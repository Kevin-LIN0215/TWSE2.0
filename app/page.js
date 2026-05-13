"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [minForeign, setMinForeign] = useState(0);
  const [minTotalInstitution, setMinTotalInstitution] = useState(0);
  const [maxPE, setMaxPE] = useState(999);

  const [minROE, setMinROE] = useState(0);
  const [minEPSGrowth, setMinEPSGrowth] = useState(0);
  const [minRevenueGrowth, setMinRevenueGrowth] = useState(0);

  const [foreignBuyDays, setForeignBuyDays] = useState(0);
  const [trustBuyDays, setTrustBuyDays] = useState(0);

  const [foreign5DayNet, setForeign5DayNet] = useState(-999999);
  const [trust5DayNet, setTrust5DayNet] = useState(-999999);

  const [minAIScore, setMinAIScore] = useState(0);

  function normalizeCode(code) {
    return String(code || "")
      .trim()
      .replace(/[^\d]/g, "")
      .slice(0, 4);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;

    return (
      Number(
        String(value)
          .replace(/,/g, "")
          .replace(/%/g, "")
          .replace("--", "0")
          .trim()
      ) || 0
    );
  }

  function calculateAIScore(stock) {
    let score = 0;

    if (stock.roe >= 15) score += 20;
    if (stock.epsGrowth >= 20) score += 20;
    if (stock.revenueGrowth >= 20) score += 20;
    if (stock.foreign5DayNet >= 1000) score += 15;
    if (stock.trust5DayNet >= 500) score += 10;
    if (stock.pe > 0 && stock.pe <= 20) score += 15;

    return score;
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [stockRes, instRes] = await Promise.all([
        fetch("/api/stocks", { cache: "no-store" }),
        fetch("/api/institutional", { cache: "no-store" }),
      ]);

      if (!stockRes.ok || !instRes.ok) {
        throw new Error("API response failed");
      }

      const stockData = await stockRes.json();
      const instData = await instRes.json();

      const instMap = new Map();

      instData.forEach((item) => {
        const code = normalizeCode(
          item.code ||
            item.stockCode ||
            item["證券代號"] ||
            item["股票代號"]
        );

        if (!code) return;

        instMap.set(code, item);
      });

      const merged = stockData.map((s) => {
        const code = normalizeCode(
          s.code ||
            s.stockCode ||
            s["證券代號"] ||
            s["股票代號"]
        );

        const inst = instMap.get(code) || {};

        const foreign = toNumber(
          inst.foreign ||
            inst.foreignNetBuy ||
            inst["外資"] ||
            inst["外資買賣超股數"] ||
            inst["外陸資買賣超股數(不含外資自營商)"]
        );

        const trust = toNumber(
          inst.trust ||
            inst.trustNetBuy ||
            inst["投信"] ||
            inst["投信買賣超股數"]
        );

        const dealer = toNumber(
          inst.dealer ||
            inst.dealerNetBuy ||
            inst["自營"] ||
            inst["自營商買賣超股數"]
        );

        const stock = {
          code,
          name:
            s.name ||
            s.stockName ||
            s["證券名稱"] ||
            s["股票名稱"] ||
            "",

          pe: toNumber(
            s.pe ||
              s.PE ||
              s["本益比"] ||
              s["殖利率"]
          ),

          pb: toNumber(
            s.pb ||
              s.PB ||
              s["股價淨值比"]
          ),

          roe: toNumber(
            s.roe ||
              s.ROE ||
              s["ROE"] ||
              s["股東權益報酬率"]
          ),

          epsGrowth: toNumber(
            s.epsGrowth ||
              s.EPSGrowth ||
              s["EPS年增率"] ||
              s["eps年增率"]
          ),

          revenueGrowth: toNumber(
            s.revenueGrowth ||
              s.monthRevenueGrowth ||
              s["月營收年增率"]
          ),

          foreign,
          trust,
          dealer,

          totalInstitution: toNumber(
            inst.totalInstitution ||
              inst.total ||
              inst["合計"] ||
              foreign + trust + dealer
          ),

          foreign5DayNet: toNumber(
            inst.foreign5DayNet ||
              inst["外資5日"] ||
              inst["五天外資買賣超"]
          ),

          trust5DayNet: toNumber(
            inst.trust5DayNet ||
              inst["投信5日"] ||
              inst["五天投信買賣超"]
          ),

          foreignBuyDays: toNumber(
            inst.foreignBuyDays ||
              inst["外資連買"] ||
              inst["外資連買天數"]
          ),

          trustBuyDays: toNumber(
            inst.trustBuyDays ||
              inst["投信連買"] ||
              inst["投信連買天數"]
          ),
        };

        stock.aiScore = calculateAIScore(stock);

        return stock;
      });

      setStocks(merged);
    } catch (err) {
      console.error(err);
      setError("資料載入失敗，請確認 API 是否正常。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    const pe = Number(stock.pe) || 0;

    return (
      stock.foreign >= minForeign &&
      stock.totalInstitution >= minTotalInstitution &&
      (pe === 0 || pe <= maxPE) &&
      stock.roe >= minROE &&
      stock.epsGrowth >= minEPSGrowth &&
      stock.revenueGrowth >= minRevenueGrowth &&
      stock.foreignBuyDays >= foreignBuyDays &&
      stock.trustBuyDays >= trustBuyDays &&
      stock.foreign5DayNet >= foreign5DayNet &&
      stock.trust5DayNet >= trust5DayNet &&
      stock.aiScore >= minAIScore
    );
  });

  return (
    <main className="container">
      <h1>TWSE 條件選股器</h1>
      <div className="subtitle">上市股票 + 三大法人籌碼 + 財報分析</div>

      <div className="grid">
        <section className="card">
          <h2>設定條件</h2>

          <label>外資買超至少（張）</label>
          <input
            type="number"
            value={minForeign}
            onChange={(e) => setMinForeign(Number(e.target.value))}
          />

          <label>三大法人合計至少（張）</label>
          <input
            type="number"
            value={minTotalInstitution}
            onChange={(e) => setMinTotalInstitution(Number(e.target.value))}
          />

          <label>本益比低於</label>
          <input
            type="number"
            value={maxPE}
            onChange={(e) => setMaxPE(Number(e.target.value))}
          />

          <label>ROE 至少 (%)</label>
          <input
            type="number"
            value={minROE}
            onChange={(e) => setMinROE(Number(e.target.value))}
          />

          <label>EPS 年增率至少 (%)</label>
          <input
            type="number"
            value={minEPSGrowth}
            onChange={(e) => setMinEPSGrowth(Number(e.target.value))}
          />

          <label>月營收年增率至少 (%)</label>
          <input
            type="number"
            value={minRevenueGrowth}
            onChange={(e) => setMinRevenueGrowth(Number(e.target.value))}
          />

          <label>外資連買天數至少</label>
          <input
            type="number"
            value={foreignBuyDays}
            onChange={(e) => setForeignBuyDays(Number(e.target.value))}
          />

          <label>投信連買天數至少</label>
          <input
            type="number"
            value={trustBuyDays}
            onChange={(e) => setTrustBuyDays(Number(e.target.value))}
          />

          <label>五天外資買賣超至少（張）</label>
          <input
            type="number"
            value={foreign5DayNet}
            onChange={(e) => setForeign5DayNet(Number(e.target.value))}
          />

          <label>五天投信買賣超至少（張）</label>
          <input
            type="number"
            value={trust5DayNet}
            onChange={(e) => setTrust5DayNet(Number(e.target.value))}
          />

          <label>AI 推薦分數至少</label>
          <input
            type="number"
            value={minAIScore}
            onChange={(e) => setMinAIScore(Number(e.target.value))}
          />

          <button onClick={fetchData}>重新抓取資料</button>

          {error && <div className="error">{error}</div>}
        </section>

        <section className="card">
          <div className="loading">
            {loading ? "載入中..." : `共 ${filteredStocks.length} 檔符合`}
          </div>

          <h2>符合條件股票</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>股票</th>
                  <th>PE</th>
                  <th>ROE</th>
                  <th>EPS年增率</th>
                  <th>月營收年增率</th>
                  <th>PB</th>
                  <th>外資</th>
                  <th>投信</th>
                  <th>自營</th>
                  <th>合計</th>
                  <th>外資5日</th>
                  <th>投信5日</th>
                  <th>外資連買</th>
                  <th>投信連買</th>
                  <th>AI分數</th>
                </tr>
              </thead>

              <tbody>
                {filteredStocks.map((stock) => (
                  <tr key={stock.code}>
                    <td>
                      {stock.code} {stock.name}
                    </td>
                    <td>{stock.pe}</td>
                    <td>{stock.roe}%</td>
                    <td>{stock.epsGrowth}%</td>
                    <td>{stock.revenueGrowth}%</td>
                    <td>{stock.pb}</td>
                    <td>{stock.foreign}</td>
                    <td>{stock.trust}</td>
                    <td>{stock.dealer}</td>
                    <td>{stock.totalInstitution}</td>
                    <td>{stock.foreign5DayNet}</td>
                    <td>{stock.trust5DayNet}</td>
                    <td>{stock.foreignBuyDays}</td>
                    <td>{stock.trustBuyDays}</td>
                    <td>{stock.aiScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

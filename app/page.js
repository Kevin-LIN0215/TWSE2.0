"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [minForeign, setMinForeign] = useState("");
  const [minTotalInstitution, setMinTotalInstitution] = useState("");
  const [maxPE, setMaxPE] = useState("");

  const [minROE, setMinROE] = useState("");
  const [minEPSGrowth, setMinEPSGrowth] = useState("");
  const [minRevenueGrowth, setMinRevenueGrowth] = useState("");

  const [foreignBuyDays, setForeignBuyDays] = useState("");
  const [trustBuyDays, setTrustBuyDays] = useState("");

  const [foreign5DayNet, setForeign5DayNet] = useState("");
  const [trust5DayNet, setTrust5DayNet] = useState("");

  const [minAIScore, setMinAISScore] = useState("");

  function normalizeCode(code) {
    return String(code || "")
      .trim()
      .replace(/[^\d]/g, "")
      .slice(0, 4);
  }

  function getValue(obj, keys) {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        return obj[key];
      }
    }
    return "";
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;

    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/%/g, "")
      .replace(/--/g, "0")
      .trim();

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function sharesToLots(value) {
    const num = toNumber(value);

    // TWSE 法人 API 通常是「股」，畫面要顯示「張」
    if (Math.abs(num) >= 1000) {
      return Math.round(num / 1000);
    }

    return num;
  }

  function passMin(value, condition) {
    if (condition === "" || condition === null || condition === undefined) return true;
    return Number(value) >= Number(condition);
  }

  function passMax(value, condition) {
    if (condition === "" || condition === null || condition === undefined) return true;
    if (Number(value) === 0) return true;
    return Number(value) <= Number(condition);
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

      console.log("stockData sample:", stockData[0]);
      console.log("instData sample:", instData[0]);

      const instMap = new Map();

      instData.forEach((item) => {
        const code = normalizeCode(
          getValue(item, ["code", "stockCode", "證券代號", "股票代號", "Code"])
        );

        if (code) instMap.set(code, item);
      });

      const merged = stockData.map((s) => {
        const code = normalizeCode(
          getValue(s, ["code", "stockCode", "證券代號", "股票代號", "Code"])
        );

        const inst = instMap.get(code) || {};

        const foreign = sharesToLots(
          getValue(inst, [
            "foreign",
            "foreignNetBuy",
            "外資",
            "外資買賣超",
            "外資買賣超股數",
            "外陸資買賣超股數(不含外資自營商)",
          ])
        );

        const trust = sharesToLots(
          getValue(inst, [
            "trust",
            "trustNetBuy",
            "投信",
            "投信買賣超",
            "投信買賣超股數",
          ])
        );

        const dealer = sharesToLots(
          getValue(inst, [
            "dealer",
            "dealerNetBuy",
            "自營",
            "自營商",
            "自營商買賣超",
            "自營商買賣超股數",
          ])
        );

        const totalInstitutionRaw = getValue(inst, [
          "totalInstitution",
          "total",
          "合計",
          "三大法人買賣超股數",
        ]);

        const totalInstitution =
          totalInstitutionRaw !== ""
            ? sharesToLots(totalInstitutionRaw)
            : foreign + trust + dealer;

        const stock = {
          code,
          name: getValue(s, [
            "name",
            "stockName",
            "證券名稱",
            "股票名稱",
            "Name",
          ]),

          pe: toNumber(getValue(s, ["pe", "PE", "本益比"])),
          pb: toNumber(getValue(s, ["pb", "PB", "股價淨值比"])),

          roe: toNumber(getValue(s, ["roe", "ROE", "股東權益報酬率"])),
          epsGrowth: toNumber(getValue(s, ["epsGrowth", "EPSGrowth", "EPS年增率"])),
          revenueGrowth: toNumber(
            getValue(s, ["revenueGrowth", "monthRevenueGrowth", "月營收年增率", "營收年增率"])
          ),

          foreign,
          trust,
          dealer,
          totalInstitution,

          foreign5DayNet: sharesToLots(
            getValue(inst, ["foreign5DayNet", "外資5日", "五天外資買賣超"])
          ),

          trust5DayNet: sharesToLots(
            getValue(inst, ["trust5DayNet", "投信5日", "五天投信買賣超"])
          ),

          foreignBuyDays: toNumber(
            getValue(inst, ["foreignBuyDays", "外資連買", "外資連買天數"])
          ),

          trustBuyDays: toNumber(
            getValue(inst, ["trustBuyDays", "投信連買", "投信連買天數"])
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
    return (
      passMin(stock.foreign, minForeign) &&
      passMin(stock.totalInstitution, minTotalInstitution) &&
      passMax(stock.pe, maxPE) &&
      passMin(stock.roe, minROE) &&
      passMin(stock.epsGrowth, minEPSGrowth) &&
      passMin(stock.revenueGrowth, minRevenueGrowth) &&
      passMin(stock.foreignBuyDays, foreignBuyDays) &&
      passMin(stock.trustBuyDays, trustBuyDays) &&
      passMin(stock.foreign5DayNet, foreign5DayNet) &&
      passMin(stock.trust5DayNet, trust5DayNet) &&
      passMin(stock.aiScore, minAIScore)
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
          <input type="number" value={minForeign} onChange={(e) => setMinForeign(e.target.value)} />

          <label>三大法人合計至少（張）</label>
          <input type="number" value={minTotalInstitution} onChange={(e) => setMinTotalInstitution(e.target.value)} />

          <label>本益比低於</label>
          <input type="number" value={maxPE} onChange={(e) => setMaxPE(e.target.value)} />

          <label>ROE 至少 (%)</label>
          <input type="number" value={minROE} onChange={(e) => setMinROE(e.target.value)} />

          <label>EPS 年增率至少 (%)</label>
          <input type="number" value={minEPSGrowth} onChange={(e) => setMinEPSGrowth(e.target.value)} />

          <label>月營收年增率至少 (%)</label>
          <input type="number" value={minRevenueGrowth} onChange={(e) => setMinRevenueGrowth(e.target.value)} />

          <label>外資連買天數至少</label>
          <input type="number" value={foreignBuyDays} onChange={(e) => setForeignBuyDays(e.target.value)} />

          <label>投信連買天數至少</label>
          <input type="number" value={trustBuyDays} onChange={(e) => setTrustBuyDays(e.target.value)} />

          <label>五天外資買賣超至少（張）</label>
          <input type="number" value={foreign5DayNet} onChange={(e) => setForeign5DayNet(e.target.value)} />

          <label>五天投信買賣超至少（張）</label>
          <input type="number" value={trust5DayNet} onChange={(e) => setTrust5DayNet(e.target.value)} />

          <label>AI 推薦分數至少</label>
          <input type="number" value={minAIScore} onChange={(e) => setMinAISScore(e.target.value)} />

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
                    <td>{stock.code} {stock.name}</td>
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

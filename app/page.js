"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [minForeign, setMinForeign] = useState(1000);
  const [minTotalInstitution, setMinTotalInstitution] = useState(2000);
  const [maxPE, setMaxPE] = useState(25);
  const [minROE, setMinROE] = useState(10);
  const [minEPSGrowth, setMinEPSGrowth] = useState(0);
  const [minRevenueGrowth, setMinRevenueGrowth] = useState(0);
  const [foreignBuyDays, setForeignBuyDays] = useState(0);
  const [trustBuyDays, setTrustBuyDays] = useState(0);
  const [foreign5DayNet, setForeign5DayNet] = useState(0);
  const [trust5DayNet, setTrust5DayNet] = useState(0);
  const [kdSignal, setKdSignal] = useState("all");
  const [maSignal, setMaSignal] = useState("all");
  const [minAIScore, setMinAIScore] = useState(0);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [stockRes, instRes] = await Promise.all([
        fetch("/api/stocks"),
        fetch("/api/institutional")
      ]);

      const stockData = await stockRes.json();
      const instData = await instRes.json();

      const merged = stockData.map((s) => {
        const inst = instData.find((i) => i.code === s.code) || {};

        const stock = {
          ...s,
          foreign: inst.foreign || 0,
          trust: inst.trust || 0,
          dealer: inst.dealer || 0,
          totalInstitution: inst.totalInstitution || 0,
          foreign5DayNet: inst.foreign5DayNet || 0,
          trust5DayNet: inst.trust5DayNet || 0,
          foreignBuyDays: inst.foreignBuyDays || 0,
          trustBuyDays: inst.trustBuyDays || 0,
          roe: s.roe || 0,
          epsGrowth: s.epsGrowth || 0,
          revenueGrowth: s.revenueGrowth || 0,
          kdSignal: s.kdSignal || "all",
          maSignal: s.maSignal || "all"
        };

        stock.aiScore = calculateAIScore(stock);
        return stock;
      });

      setStocks(merged);
    } catch (err) {
      setError("資料載入失敗，請稍後再試。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calculateAIScore(stock) {
    let score = 0;

    if (stock.roe >= 15) score += 15;
    if (stock.epsGrowth >= 20) score += 15;
    if (stock.revenueGrowth >= 20) score += 15;
    if (stock.foreign5DayNet >= 1000) score += 15;
    if (stock.trust5DayNet >= 500) score += 10;
    if (stock.pe > 0 && stock.pe <= 20) score += 10;
    if (stock.kdSignal === "golden") score += 10;
    if (stock.maSignal === "bullish") score += 10;

    return score;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    return (
      stock.foreign >= minForeign &&
      stock.totalInstitution >= minTotalInstitution &&
      stock.pe <= maxPE &&
      stock.roe >= minROE &&
      stock.epsGrowth >= minEPSGrowth &&
      stock.revenueGrowth >= minRevenueGrowth &&
      stock.foreignBuyDays >= foreignBuyDays &&
      stock.trustBuyDays >= trustBuyDays &&
      stock.foreign5DayNet >= foreign5DayNet &&
      stock.trust5DayNet >= trust5DayNet &&
      stock.aiScore >= minAIScore &&
      (kdSignal === "all" || stock.kdSignal === kdSignal) &&
      (maSignal === "all" || stock.maSignal === maSignal)
    );
  });

  return (
    <main className="container">
      <h1>TWSE 條件選股器</h1>
      <div className="subtitle">上市股票 + 三大法人籌碼 + 財報 + 技術面</div>

      <div className="grid">
        <section className="card">
          <h2>設定條件</h2>

          <label>外資買超至少（張）</label>
          <input type="number" value={minForeign} onChange={(e) => setMinForeign(Number(e.target.value))} />

          <label>三大法人合計至少（張）</label>
          <input type="number" value={minTotalInstitution} onChange={(e) => setMinTotalInstitution(Number(e.target.value))} />

          <label>本益比低於</label>
          <input type="number" value={maxPE} onChange={(e) => setMaxPE(Number(e.target.value))} />

          <label>ROE 至少 (%)</label>
          <input type="number" value={minROE} onChange={(e) => setMinROE(Number(e.target.value))} />

          <label>EPS 年增率至少 (%)</label>
          <input type="number" value={minEPSGrowth} onChange={(e) => setMinEPSGrowth(Number(e.target.value))} />

          <label>月營收年增率至少 (%)</label>
          <input type="number" value={minRevenueGrowth} onChange={(e) => setMinRevenueGrowth(Number(e.target.value))} />

          <label>外資連買天數至少</label>
          <input type="number" value={foreignBuyDays} onChange={(e) => setForeignBuyDays(Number(e.target.value))} />

          <label>投信連買天數至少</label>
          <input type="number" value={trustBuyDays} onChange={(e) => setTrustBuyDays(Number(e.target.value))} />

          <label>五天外資連買賣張數至少</label>
          <input type="number" value={foreign5DayNet} onChange={(e) => setForeign5DayNet(Number(e.target.value))} />

          <label>五天投信連買賣張數至少</label>
          <input type="number" value={trust5DayNet} onChange={(e) => setTrust5DayNet(Number(e.target.value))} />

          <label>KD 條件</label>
          <select value={kdSignal} onChange={(e) => setKdSignal(e.target.value)}>
            <option value="all">不限</option>
            <option value="golden">KD 黃金交叉</option>
            <option value="oversold">KD 低檔轉強</option>
          </select>

          <label>MA 條件</label>
          <select value={maSignal} onChange={(e) => setMaSignal(e.target.value)}>
            <option value="all">不限</option>
            <option value="aboveMA20">站上月線 MA20</option>
            <option value="aboveMA60">站上季線 MA60</option>
            <option value="bullish">多頭排列</option>
          </select>

          <label>AI 推薦分數至少</label>
          <input type="number" value={minAIScore} onChange={(e) => setMinAIScore(Number(e.target.value))} />

          <button onClick={fetchData}>重新抓取資料</button>

          {error && <div className="error">{error}</div>}
        </section>

        <section className="card">
          <div className="loading">{loading ? "載入中..." : `共 ${filteredStocks.length} 檔符合`}</div>
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
                  <th>KD</th>
                  <th>MA</th>
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
                    <td>{stock.kdSignal}</td>
                    <td>{stock.maSignal}</td>
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

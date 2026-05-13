"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [maxPe, setMaxPe] = useState("");
  const [maxPb, setMaxPb] = useState("");
  const [minEps, setMinEps] = useState("");
  const [minYield, setMinYield] = useState("");
  const [minRoe, setMinRoe] = useState("");

  async function loadStocks() {
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/goodinfo", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        setApiError(data.error || data.message || "API 失敗");
        setStocks([]);
      } else {
        setStocks(data.stocks || []);
      }
    } catch (error) {
      setApiError(error.message);
      setStocks([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      if (maxPe && s.pe > Number(maxPe)) return false;
      if (maxPb && s.pb > Number(maxPb)) return false;
      if (minEps && s.eps < Number(minEps)) return false;
      if (minYield && s.yieldRate < Number(minYield)) return false;
      if (minRoe && s.roe < Number(minRoe)) return false;
      return true;
    });
  }, [stocks, maxPe, maxPb, minEps, minYield, minRoe]);

  return (
    <main className="container">
      <section className="hero">
        <h1>台股 Goodinfo 選股系統</h1>
        <p>使用 Goodinfo 資料篩選台股基本面條件</p>
      </section>

      <section className="card">
        <h2>篩選條件</h2>

        <div className="filters">
          <label>
            最高本益比
            <input value={maxPe} onChange={(e) => setMaxPe(e.target.value)} />
          </label>

          <label>
            最高股價淨值比
            <input value={maxPb} onChange={(e) => setMaxPb(e.target.value)} />
          </label>

          <label>
            最低 EPS
            <input value={minEps} onChange={(e) => setMinEps(e.target.value)} />
          </label>

          <label>
            最低殖利率
            <input
              value={minYield}
              onChange={(e) => setMinYield(e.target.value)}
            />
          </label>

          <label>
            最低 ROE
            <input value={minRoe} onChange={(e) => setMinRoe(e.target.value)} />
          </label>
        </div>

        <button onClick={loadStocks}>重新抓取資料</button>

        {apiError && (
          <p style={{ color: "red", marginTop: "16px" }}>
            API 錯誤：{apiError}
          </p>
        )}
      </section>

      <section className="card">
        <h2>{loading ? "資料載入中..." : `${filteredStocks.length} 檔符合條件`}</h2>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>代號</th>
                <th>名稱</th>
                <th>股價</th>
                <th>本益比</th>
                <th>股價淨值比</th>
                <th>EPS</th>
                <th>殖利率</th>
                <th>ROE</th>
                <th>狀態</th>
              </tr>
            </thead>

            <tbody>
              {filteredStocks.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.price}</td>
                  <td>{s.pe}</td>
                  <td>{s.pb}</td>
                  <td>{s.eps}</td>
                  <td>{s.yieldRate}</td>
                  <td>{s.roe}</td>
                  <td>{s.error ? s.error : "OK"}</td>
                </tr>
              ))}

              {!loading && filteredStocks.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty">
                    目前沒有資料，請檢查 /api/goodinfo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

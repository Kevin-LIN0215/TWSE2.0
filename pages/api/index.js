import { useState } from "react";

const DEFAULT_STOCKS = [
  "2330",
  "2317",
  "2454",
  "2308",
  "2412",
  "2881",
  "2882",
  "2891",
  "1301",
  "1303",
  "2002",
  "2603",
  "2615",
  "3008",
  "3711"
];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Home() {
  const [stockIds, setStockIds] = useState(DEFAULT_STOCKS.join(","));
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    maxPe: "",
    maxPb: "",
    minEps: "",
    minYield: "",
    minRoe: ""
  });

  async function fetchOneStock(stockId) {
    const res = await fetch(`/api/goodinfo?stockId=${stockId}`);
    const data = await res.json();

    if (!data.success) {
      return null;
    }

    return data.stock;
  }

  async function loadStocks() {
    setLoading(true);
    setStocks([]);

    const ids = stockIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const results = [];

    for (const id of ids) {
      const stock = await fetchOneStock(id);
      if (stock) {
        results.push(stock);
      }
    }

    setStocks(results);
    setLoading(false);
  }

  const filteredStocks = stocks.filter((stock) => {
    const price = toNumber(stock.price);
    const pe = toNumber(stock.pe);
    const pb = toNumber(stock.pb);
    const eps = toNumber(stock.eps);
    const yieldRate = toNumber(stock.yieldRate);
    const roe = toNumber(stock.roe);

    if (filters.minPrice && price < toNumber(filters.minPrice)) return false;
    if (filters.maxPrice && price > toNumber(filters.maxPrice)) return false;
    if (filters.maxPe && pe > toNumber(filters.maxPe)) return false;
    if (filters.maxPb && pb > toNumber(filters.maxPb)) return false;
    if (filters.minEps && eps < toNumber(filters.minEps)) return false;
    if (filters.minYield && yieldRate < toNumber(filters.minYield)) return false;
    if (filters.minRoe && roe < toNumber(filters.minRoe)) return false;

    return true;
  });

  function updateFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  return (
    <main className="container">
      <h1>台股 Goodinfo 選股系統</h1>

      <section className="card">
        <h2>股票代號</h2>
        <textarea
          value={stockIds}
          onChange={(e) => setStockIds(e.target.value)}
          placeholder="例如：2330,2317,2454"
        />

        <button onClick={loadStocks} disabled={loading}>
          {loading ? "資料載入中..." : "抓取 Goodinfo 資料"}
        </button>
      </section>

      <section className="card">
        <h2>篩選條件</h2>

        <div className="grid">
          <input
            placeholder="最低股價"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
          />
          <input
            placeholder="最高股價"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
          />
          <input
            placeholder="最高本益比 PE"
            value={filters.maxPe}
            onChange={(e) => updateFilter("maxPe", e.target.value)}
          />
          <input
            placeholder="最高股價淨值比 PB"
            value={filters.maxPb}
            onChange={(e) => updateFilter("maxPb", e.target.value)}
          />
          <input
            placeholder="最低 EPS"
            value={filters.minEps}
            onChange={(e) => updateFilter("minEps", e.target.value)}
          />
          <input
            placeholder="最低殖利率"
            value={filters.minYield}
            onChange={(e) => updateFilter("minYield", e.target.value)}
          />
          <input
            placeholder="最低 ROE"
            value={filters.minRoe}
            onChange={(e) => updateFilter("minRoe", e.target.value)}
          />
        </div>
      </section>

      <section className="card">
        <h2>{filteredStocks.length} 檔符合標準</h2>

        <table>
          <thead>
            <tr>
              <th>代號</th>
              <th>名稱</th>
              <th>股價</th>
              <th>PE</th>
              <th>PB</th>
              <th>EPS</th>
              <th>殖利率</th>
              <th>ROE</th>
            </tr>
          </thead>

          <tbody>
            {filteredStocks.map((stock) => (
              <tr key={stock.id}>
                <td>{stock.id}</td>
                <td>{stock.name || "-"}</td>
                <td>{stock.price || "-"}</td>
                <td>{stock.pe || "-"}</td>
                <td>{stock.pb || "-"}</td>
                <td>{stock.eps || "-"}</td>
                <td>{stock.yieldRate || "-"}</td>
                <td>{stock.roe || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minVolume: "",
    minForeign5: "",
    minTrust5: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const res = await fetch(
          "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL"
        );

        const data = await res.json();

        const basicStocks = data.map((item) => ({
          code: item.Code,
          name: item.Name,
          close: toNumber(item.ClosingPrice),
          volume: toNumber(item.TradeVolume),
          foreign5: 0,
          trust5: 0,
        }));

        setStocks(basicStocks);
      } catch (error) {
        console.error("資料載入失敗", error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const price = toNumber(stock.close);
      const volume = toNumber(stock.volume);
      const foreign5 = toNumber(stock.foreign5);
      const trust5 = toNumber(stock.trust5);

      const minPrice = toNumber(filters.minPrice);
      const maxPrice = toNumber(filters.maxPrice);
      const minVolume = toNumber(filters.minVolume);
      const minForeign5 = toNumber(filters.minForeign5);
      const minTrust5 = toNumber(filters.minTrust5);

      if (filters.minPrice !== "" && price < minPrice) return false;
      if (filters.maxPrice !== "" && price > maxPrice) return false;
      if (filters.minVolume !== "" && volume < minVolume) return false;
      if (filters.minForeign5 !== "" && foreign5 < minForeign5) return false;
      if (filters.minTrust5 !== "" && trust5 < minTrust5) return false;

      return true;
    });
  }, [stocks, filters]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minVolume: "",
      minForeign5: "",
      minTrust5: "",
    });
  };

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        台股選股系統
      </h1>

      <p style={{ marginTop: "8px", color: "#666" }}>
        資料來源：TWSE OpenAPI
      </p>

      <section
        style={{
          marginTop: "24px",
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
          篩選條件
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            type="number"
            placeholder="最低股價"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="最高股價"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="最低成交量"
            value={filters.minVolume}
            onChange={(e) => updateFilter("minVolume", e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="五天外資買賣超"
            value={filters.minForeign5}
            onChange={(e) => updateFilter("minForeign5", e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="五天投信買賣超"
            value={filters.minTrust5}
            onChange={(e) => updateFilter("minTrust5", e.target.value)}
            style={inputStyle}
          />
        </div>

        <button onClick={resetFilters} style={buttonStyle}>
          清除條件
        </button>
      </section>

      <section style={{ marginTop: "24px" }}>
        {loading ? (
          <p>資料載入中...</p>
        ) : (
          <>
            <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
              {filteredStocks.length} 檔符合條件
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f3f3f3" }}>
                    <th style={thStyle}>代號</th>
                    <th style={thStyle}>名稱</th>
                    <th style={thStyle}>收盤價</th>
                    <th style={thStyle}>成交量</th>
                    <th style={thStyle}>五天外資</th>
                    <th style={thStyle}>五天投信</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock.code}>
                      <td style={tdStyle}>{stock.code}</td>
                      <td style={tdStyle}>{stock.name}</td>
                      <td style={tdStyle}>{stock.close}</td>
                      <td style={tdStyle}>
                        {stock.volume.toLocaleString()}
                      </td>
                      <td style={tdStyle}>{stock.foreign5}</td>
                      <td style={tdStyle}>{stock.trust5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "14px",
};

const buttonStyle = {
  marginTop: "16px",
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#111",
  color: "white",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "700px",
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

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

        const formatted = data.map((item) => ({
          code: item.Code,
          name: item.Name,
          close: toNumber(item.ClosingPrice),
          volume: toNumber(item.TradeVolume),
          foreign5: 0,
          trust5: 0,
        }));

        setStocks(formatted);
      } catch (err) {
        console.error(err);
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

      if (
        filters.minPrice !== "" &&
        price < toNumber(filters.minPrice)
      ) {
        return false;
      }

      if (
        filters.maxPrice !== "" &&
        price > toNumber(filters.maxPrice)
      ) {
        return false;
      }

      if (
        filters.minVolume !== "" &&
        volume < toNumber(filters.minVolume)
      ) {
        return false;
      }

      if (
        filters.minForeign5 !== "" &&
        foreign5 < toNumber(filters.minForeign5)
      ) {
        return false;
      }

      if (
        filters.minTrust5 !== "" &&
        trust5 < toNumber(filters.minTrust5)
      ) {
        return false;
      }

      return true;
    });
  }, [stocks, filters]);

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <h1 className="text-4xl font-bold mb-2">
        台股選股系統
      </h1>

      <p className="text-gray-400 mb-10">
        資料來源：TWSE OpenAPI
      </p>

      <div className="border border-white rounded-2xl p-5 mb-8">
        <h2 className="text-2xl font-bold mb-5">
          篩選條件
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="number"
            placeholder="最低股價"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({
                ...filters,
                minPrice: e.target.value,
              })
            }
            className="bg-black border border-white rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="最高股價"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({
                ...filters,
                maxPrice: e.target.value,
              })
            }
            className="bg-black border border-white rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="最低成交量"
            value={filters.minVolume}
            onChange={(e) =>
              setFilters({
                ...filters,
                minVolume: e.target.value,
              })
            }
            className="bg-black border border-white rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="五天外資買賣超"
            value={filters.minForeign5}
            onChange={(e) =>
              setFilters({
                ...filters,
                minForeign5: e.target.value,
              })
            }
            className="bg-black border border-white rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="五天投信買賣超"
            value={filters.minTrust5}
            onChange={(e) =>
              setFilters({
                ...filters,
                minTrust5: e.target.value,
              })
            }
            className="bg-black border border-white rounded-lg p-3"
          />
        </div>

        <button
          onClick={() =>
            setFilters({
              minPrice: "",
              maxPrice: "",
              minVolume: "",
              minForeign5: "",
              minTrust5: "",
            })
          }
          className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-lg py-3 mt-5 text-2xl font-bold"
        >
          清除條件
        </button>
      </div>

      <h2 className="text-3xl font-bold mb-5">
        {filteredStocks.length} 檔符合條件
      </h2>

      {loading ? (
        <p>資料載入中...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-200 text-black">
                <th className="p-3 border">代號</th>
                <th className="p-3 border">名稱</th>
                <th className="p-3 border">收盤價</th>
                <th className="p-3 border">成交量</th>
                <th className="p-3 border">五天外資</th>
                <th className="p-3 border">五天投信</th>
              </tr>
            </thead>

            <tbody>
              {filteredStocks.map((stock) => (
                <tr key={stock.code}>
                  <td className="p-3 border">
                    {stock.code}
                  </td>

                  <td className="p-3 border">
                    {stock.name}
                  </td>

                  <td className="p-3 border">
                    {stock.close}
                  </td>

                  <td className="p-3 border">
                    {stock.volume.toLocaleString()}
                  </td>

                  <td className="p-3 border">
                    {stock.foreign5}
                  </td>

                  <td className="p-3 border">
                    {stock.trust5}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

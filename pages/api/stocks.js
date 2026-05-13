export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    if (!response.ok) {
      throw new Error("TWSE stocks API failed");
    }

    const data = await response.json();

    const stocks = data.map((item) => ({
      code: item.Code || item.證券代號 || "",
      name: item.Name || item.證券名稱 || "",
      pe: cleanNumber(item.PEratio || item.本益比),
      pb: cleanNumber(item.PBratio || item.股價淨值比),
      dividendYield: cleanNumber(item.DividendYield || item.殖利率),
      roe: 0,
      epsGrowth: 0,
      revenueGrowth: 0,
      kdSignal: "all",
      maSignal: "all"
    }));

    res.status(200).json(stocks);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}

function cleanNumber(value) {
  if (!value || value === "-" || value === "N/A") return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
}

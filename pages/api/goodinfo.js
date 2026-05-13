import * as cheerio from "cheerio";
import iconv from "iconv-lite";

export const config = {
  api: {
    responseLimit: false,
  },
};

const STOCK_IDS = [
  "2330",
  "2317",
  "2454",
  "2308",
  "2382",
  "2412",
  "2881",
  "2882",
  "2886",
  "2891",
];

function cleanNumber(value) {
  if (!value) return 0;
  const n = Number(
    String(value)
      .replace(/,/g, "")
      .replace("%", "")
      .replace("元", "")
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

function findValue(text, keyword) {
  const regex = new RegExp(`${keyword}\\s*[:：]?\\s*([-+]?\\d+(\\.\\d+)?)`, "i");
  const match = text.match(regex);
  return match ? cleanNumber(match[1]) : 0;
}

async function fetchStock(stockId) {
  const url = `https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID=${stockId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      Referer: "https://goodinfo.tw/tw/index.asp",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Goodinfo HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const html = iconv.decode(buffer, "big5");
  const $ = cheerio.load(html);

  const text = $("body").text().replace(/\s+/g, " ");
  const title = $("title").text();

  const nameMatch = title.match(/(?:\d{4})\s*([^(\s]+)/);
  const stockName = nameMatch ? nameMatch[1] : stockId;

  return {
    id: stockId,
    name: stockName,
    price:
      findValue(text, "成交價") ||
      findValue(text, "收盤價") ||
      findValue(text, "股價"),
    pe: findValue(text, "本益比") || findValue(text, "PER"),
    pb: findValue(text, "股價淨值比") || findValue(text, "PBR"),
    eps: findValue(text, "EPS") || findValue(text, "每股盈餘"),
    yieldRate: findValue(text, "殖利率") || findValue(text, "現金殖利率"),
    roe: findValue(text, "ROE") || findValue(text, "股東權益報酬率"),
  };
}

export default async function handler(req, res) {
  try {
    const ids = req.query.ids
      ? String(req.query.ids).split(",")
      : STOCK_IDS;

    const stocks = [];

    for (const id of ids) {
      try {
        const stock = await fetchStock(id.trim());
        stocks.push(stock);
      } catch (err) {
        stocks.push({
          id: id.trim(),
          name: id.trim(),
          price: 0,
          pe: 0,
          pb: 0,
          eps: 0,
          yieldRate: 0,
          roe: 0,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      source: "goodinfo",
      count: stocks.length,
      stocks,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Goodinfo API failed",
      error: error.message,
      stocks: [],
    });
  }
}

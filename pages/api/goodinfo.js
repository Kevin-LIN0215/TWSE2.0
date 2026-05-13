import * as cheerio from "cheerio";
import iconv from "iconv-lite";

const STOCK_IDS = [
  "2330", "2317", "2454", "2308", "2382",
  "2412", "2881", "2882", "2886", "2891",
  "3711", "2603", "2615", "2002", "1301",
  "1303", "1216", "2303", "2327", "2357"
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

function findValueByKeyword(text, keyword) {
  const regex = new RegExp(`${keyword}\\s*[:：]?\\s*([-+]?\\d+(\\.\\d+)?)`, "i");
  const match = text.match(regex);
  return match ? cleanNumber(match[1]) : 0;
}

async function fetchStock(stockId) {
  const url = `https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID=${stockId}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      Referer: "https://goodinfo.tw/tw/index.asp",
    },
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const html = iconv.decode(buffer, "big5");

  const $ = cheerio.load(html);
  const pageText = $("body").text().replace(/\s+/g, " ");
  const title = $("title").text();

  const nameMatch = title.match(/(?:\d{4})\s*([^(\s]+)/);
  const stockName = nameMatch ? nameMatch[1] : "";

  return {
    id: stockId,
    name: stockName || stockId,
    price:
      findValueByKeyword(pageText, "成交價") ||
      findValueByKeyword(pageText, "收盤價") ||
      findValueByKeyword(pageText, "股價"),
    pe:
      findValueByKeyword(pageText, "本益比") ||
      findValueByKeyword(pageText, "PER"),
    pb:
      findValueByKeyword(pageText, "股價淨值比") ||
      findValueByKeyword(pageText, "PBR"),
    eps:
      findValueByKeyword(pageText, "EPS") ||
      findValueByKeyword(pageText, "每股盈餘"),
    yieldRate:
      findValueByKeyword(pageText, "殖利率") ||
      findValueByKeyword(pageText, "現金殖利率"),
    roe:
      findValueByKeyword(pageText, "ROE") ||
      findValueByKeyword(pageText, "股東權益報酬率"),
  };
}

export default async function handler(req, res) {
  try {
    const ids = req.query.ids
      ? String(req.query.ids).split(",").map((x) => x.trim())
      : STOCK_IDS;

    const results = [];

    for (const id of ids) {
      try {
        const stock = await fetchStock(id);
        results.push(stock);
      } catch {
        results.push({
          id,
          name: id,
          price: 0,
          pe: 0,
          pb: 0,
          eps: 0,
          yieldRate: 0,
          roe: 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      stocks: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Goodinfo 資料抓取失敗",
      error: error.message,
    });
  }
}

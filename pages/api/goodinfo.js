import * as cheerio from "cheerio";
import iconv from "iconv-lite";

function cleanNumber(value) {
  if (!value) return 0;
  const n = Number(String(value).replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

function findValueByKeyword(text, keyword) {
  const regex = new RegExp(`${keyword}\\s*[:：]?\\s*([-+]?\\d+(\\.\\d+)?)`, "i");
  const match = text.match(regex);
  return match ? cleanNumber(match[1]) : 0;
}

export default async function handler(req, res) {
  const { stockId = "2330" } = req.query;

  try {
    const url = `https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID=${stockId}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        Referer: "https://goodinfo.tw/tw/index.asp"
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const html = iconv.decode(buffer, "big5");

    const $ = cheerio.load(html);
    const pageText = $("body").text().replace(/\s+/g, " ");

    const title = $("title").text();
    const nameMatch = title.match(/(?:\d{4})\s*([^(\s]+)/);
    const stockName = nameMatch ? nameMatch[1] : "";

    const price =
      findValueByKeyword(pageText, "成交價") ||
      findValueByKeyword(pageText, "收盤價") ||
      findValueByKeyword(pageText, "股價");

    const pe =
      findValueByKeyword(pageText, "本益比") ||
      findValueByKeyword(pageText, "PER");

    const pb =
      findValueByKeyword(pageText, "股價淨值比") ||
      findValueByKeyword(pageText, "PBR");

    const eps =
      findValueByKeyword(pageText, "EPS") ||
      findValueByKeyword(pageText, "每股盈餘");

    const yieldRate =
      findValueByKeyword(pageText, "殖利率") ||
      findValueByKeyword(pageText, "現金殖利率");

    const roe =
      findValueByKeyword(pageText, "ROE") ||
      findValueByKeyword(pageText, "股東權益報酬率");

    res.status(200).json({
      success: true,
      stock: {
        id: stockId,
        name: stockName,
        price,
        pe,
        pb,
        eps,
        yieldRate,
        roe
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Goodinfo 資料抓取失敗",
      error: error.message
    });
  }
}

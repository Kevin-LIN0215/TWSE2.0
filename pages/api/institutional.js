export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://openapi.twse.com.tw/v1/fund/T86"
    );

    const data = await response.json();

    const result = data.map((item) => {
      const foreign = Number(item.Foreign_Investor_Net_Buy_Sell || item.外陸資買賣超股數 || 0) / 1000;
      const trust = Number(item.Investment_Trust_Net_Buy_Sell || item.投信買賣超股數 || 0) / 1000;
      const dealer = Number(item.Dealer_Net_Buy_Sell || item.自營商買賣超股數 || 0) / 1000;

      return {
        code: item.Code || item.證券代號 || "",
        foreign: Math.round(foreign),
        trust: Math.round(trust),
        dealer: Math.round(dealer),
        totalInstitution: Math.round(foreign + trust + dealer),

        foreign5DayNet: Math.round(foreign),
        trust5DayNet: Math.round(trust),
        foreignBuyDays: foreign > 0 ? 1 : 0,
        trustBuyDays: trust > 0 ? 1 : 0
      };
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}

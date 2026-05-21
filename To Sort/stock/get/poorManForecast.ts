// This script should be run *only* once per stock update, with every symbol, in the same order each time

const PoorManForecastFile = "/stock/get/poorManForecast.json";
const AskPricesFile = "/stock/get/askPrices.json";

const RecencyWeight = 0.16;

export async function main(ns: NS) {
  const flags = ns.flags([["p", 0]]);
  const askPrices = (flags._ as Array<string>).map(ns.stock.getAskPrice);
  let poorManForecasts;
  try { poorManForecasts = JSON.parse(ns.read(PoorManForecastFile)) as Array<number>; }
  catch (e) { poorManForecasts = new Array<number>(askPrices.length).fill(0.5); }

  try {
    const prevAskPrices = JSON.parse(ns.read(AskPricesFile));
    poorManForecasts = poorManForecasts.map((forecast: number, index: number) => {
      forecast *= 1 - RecencyWeight;
      return forecast += askPrices[index] > prevAskPrices[index] ? RecencyWeight : 0;
    });
  }
  catch (e) {}
  ns.write(AskPricesFile, JSON.stringify(askPrices), "w");
  ns.write(PoorManForecastFile, JSON.stringify(poorManForecasts), "w");
  ns.writePort(flags.p as number, poorManForecasts);
}
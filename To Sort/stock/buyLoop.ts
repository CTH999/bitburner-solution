import {BitNode} from "lib/nsEnums";
import {Ports} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";
import {ExecutorJob} from "daemons/executor";
import {FullSymbolInfo, symbolInfoRecord} from "stock/genSymbolInfo";
import {sellAllStocks} from "stock/sellLoop";

const MinPurchase = extResetInfo.currentNode == BitNode.GhostOfWallStreet ? 1e7 : 1e8;
const MinFunds = extResetInfo.currentNode == BitNode.GhostOfWallStreet ? MinPurchase : 1e9;
const MinForecast = 0.5;
const MinPoorManForecast = 0.82;

export async function main(ns: NS) {
  const hostname = ns.self().server;
  const commission = ns.stock.getConstants().StockMarketCommission;
  var usePoorMan: boolean;
  const symbols = Object.keys(symbolInfoRecord);
  var valuations: Record<string, number> = {};

  function evalStock(sym: string) {
    const info = symbolInfoRecord[sym] as FullSymbolInfo;
    const forecast = info.forecast - MinForecast;
    return Math.abs(forecast) * forecast * info.volatility;
  }

  function isRising(sym: string) { return (symbolInfoRecord[sym].forecast ?? 0.5) > (usePoorMan ? MinPoorManForecast : MinForecast); }

  ns.atExit(() => { sellAllStocks(ns); });
  while (true) {
    // sellLoop.js writes to Ports.StockInfo when it's finished each iteration.
    // Doing things this way reduces RAM usage and conflicts, and ensures that we never
    // buy when we're not prepared to sell.
    await ns.nextPortWrite(Ports.StockBroadcast);

    usePoorMan = !("volatility" in symbolInfoRecord[symbols[0]]);
    let risingSymbols = symbols.filter(isRising);
    if (usePoorMan)
      for (const sym of risingSymbols)
        valuations[sym] = (symbolInfoRecord[sym].forecast ?? 0.5) - MinPoorManForecast;
    else
      for (const sym of risingSymbols)
        valuations[sym] = evalStock(sym);
    risingSymbols.sort((a, b) => { return valuations[b] - valuations[a]; });
    ns.print("INFO: Rising stocks sorted by eval: ", JSON.stringify(risingSymbols));

    let executorJob: ExecutorJob = {
      script: "/stock/get/askPrice.ts",
      hostname: hostname,
      args: ["-p", Ports.StockBuy, ...risingSymbols],
      threadOrOptions: {temporary: true},
      retry: true
    };
    ns.writePort(Ports.Exec, executorJob);
    await ns.nextPortWrite(Ports.StockBuy);
    const askPrices = ns.readPort(Ports.StockBuy);

    executorJob.script = "/stock/buy.ts";
    for (let i = 0; i < risingSymbols.length && ns.getServerMoneyAvailable("home") >= MinFunds; ++i) {
      const sym = risingSymbols[i];
      const shareDelta = symbolInfoRecord[sym].maxShares - (symbolInfoRecord[sym].position ?? [0])[0];
      if (shareDelta) {
        const quantity = Math.min(
            Math.floor((ns.getServerMoneyAvailable("home") - commission) / askPrices[i]),
            shareDelta
        );
        if (quantity * askPrices[i] >= MinPurchase) {
          executorJob.args = [sym, "-q", quantity];
          ns.writePort(Ports.Exec, executorJob);
        }
      }
    }
  }
}
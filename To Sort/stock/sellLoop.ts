import {Ports} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";
import {ExecutorJob} from "daemons/executor";
import {symbolInfoRecord} from "stock/genSymbolInfo";
import {main as updateSymbolInfo, usePoorMan} from "stock/updateSymbolInfo";

const MinForecast = 0.5;
const MinPoorManForecast = 0.5;
const SellAllCmd = "Sell all";

export function sellAllStocks(ns: NS) { ns.writePort(Ports.StockSell, SellAllCmd); }

export async function main(ns: NS) {
  const hostname = ns.self().server;
  const symbols = Object.keys(symbolInfoRecord);

  while (true) {
    let toSell: Array<string> = [];

    if (ns.peek(Ports.StockSell) == SellAllCmd) {
      toSell = symbols;
      ns.clearPort(Ports.StockSell);
    }
    else {
      await updateSymbolInfo(ns);

      const minForecast = usePoorMan ? MinPoorManForecast : MinForecast;
      for (const sym of symbols.filter(s => symbolInfoRecord[s].position))
        if ((symbolInfoRecord[sym].forecast ?? 0.5) <= minForecast)
          toSell.push(sym);
    }
    if (toSell.length) {
      ns.print("INFO: Selling ", JSON.stringify(toSell));
      ns.writePort(Ports.Exec, {
        "script": "/stock/sell.ts",
        "hostname": hostname,
        "threadOrOptions": {"temporary": true},
        "args": toSell,
        "retry": true
      } as ExecutorJob);
    }

    ns.clearPort(Ports.StockBroadcast);
    ns.writePort(Ports.StockBroadcast, true);
    await ns.stock.nextUpdate();
  }
}
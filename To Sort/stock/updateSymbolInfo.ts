import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {main as genSymbolInfo, symbolInfoRecord} from "stock/genSymbolInfo";

export var usePoorMan = true;

export async function main(ns: NS) {
  const symbols = Object.keys(symbolInfoRecord);
  var executorJob: ExecutorJob = {
    script: "",
    hostname: ns.self().server,
    threadOrOptions: {temporary: true},
    retry: true
  };

  if (usePoorMan) {
    ns.print("INFO: Attempting to buy 4S access.");
    for (const script of ["4s.ts", "4sAPI.ts"]) {
      executorJob.script = "/stock/purchase/" + script;
      ns.writePort(Ports.Exec, executorJob);
    }
  }

  ns.print("INFO: Attempting to get 4S forecasts.");
  executorJob.script = "/stock/get/forecast.ts";
  executorJob.args = ["-p", Ports.StockSell].concat(symbols);
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  let forecasts: Array<number> = ns.readPort(Ports.StockSell);

  if (usePoorMan = !forecasts) {
    ns.print("INFO: Using poor man forecasts.");
    usePoorMan = true;
    executorJob.script = "/stock/get/poorManForecast.ts";
    ns.writePort(Ports.Exec, executorJob);
    await ns.nextPortWrite(Ports.StockSell);
    forecasts = ns.readPort(Ports.StockSell);
  }
  else if (!symbolInfoRecord[symbols[0]].volatility) {
    ns.print("INFO: Regenerating symbol info with volatility.");
    await genSymbolInfo(ns);
  }

  ns.print("INFO: Getting positions.");
  executorJob.script = "/stock/get/position.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  const pos: Array<ReturnType<NS["stock"]["getPosition"]>> = ns.readPort(Ports.StockSell);

  symbols.forEach((sym, i) => {
    symbolInfoRecord[sym].forecast = forecasts[i];
    if (pos[i][0] || pos[i][2])
      symbolInfoRecord[sym].position = pos[i];
    else if ("position" in symbolInfoRecord[sym])
      delete symbolInfoRecord[sym].position;
  });
}
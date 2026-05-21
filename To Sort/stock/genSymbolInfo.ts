import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export interface SymbolInfo {
  maxShares: number,
  volatility?: number,
  forecast?: number,
  organization: string,

  /** The first element in the array is the number of shares the player owns of the stock in the Long position. The second element in the array is the average price of the player’s shares in the Long position.
      The third element in the array is the number of shares the player owns of the stock in the Short position. The fourth element in the array is the average price of the player’s Short position. */
  position?: ReturnType<NS["stock"]["getPosition"]>
}

export interface FullSymbolInfo extends SymbolInfo {
  volatility: number,
  forecast: number
}

export type SymbolInfoRecord = Record<string, SymbolInfo>;

export var symbolInfoRecord: SymbolInfoRecord = {};

export async function main(ns: NS) {
  const hostname = ns.self().server;
  var args = ["-p", Ports.StockSell];
  var executorJob: ExecutorJob = {
    "script": "/stock/get/symbols.ts",
    "hostname": hostname,
    "args": args,
    "threadOrOptions": {"temporary": true},
    "retry": true
  };

  ns.clearPort(Ports.StockSell);
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  const symbols: Array<string> = ns.readPort(Ports.StockSell);
  args = args.concat(symbols);
  executorJob.args = args;

  executorJob.script = "/stock/get/maxShares.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  const maxShares: Array<number> = ns.readPort(Ports.StockSell);

  executorJob.script = "/stock/get/volatility.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  const volatilities: Array<number> = ns.readPort(Ports.StockSell);

  executorJob.script = "/stock/get/organization.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.StockSell);
  const orgs: Array<string> = ns.readPort(Ports.StockSell);

  for (let i = 0; i < symbols.length; ++i)
    symbolInfoRecord[symbols[i]] = {
      "maxShares": maxShares[i],
      "organization": orgs[i]
    };

  if (volatilities)
    for (let i = 0; i < symbols.length; ++i)
      symbolInfoRecord[symbols[i]].volatility = volatilities[i];
}
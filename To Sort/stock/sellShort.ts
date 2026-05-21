import {Quantity} from "stock/sell";

export async function main(ns: NS) {
  for (const sym of ns.args as Array<string>)
    ns.stock.sellShort(sym, Quantity);
}
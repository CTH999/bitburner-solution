import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.AlgorithmicStockTraderI];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const prices = ns.readPort(Ports.Contract) as Signature[0];
  var profit: Signature[1] = 0;

  for (let i = 0; i < prices.length - 1; ++i)
    profit = Math.max(profit, Math.max(...prices.slice(i + 1)) - prices[i]);

  ns.writePort(Ports.Contract, profit);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
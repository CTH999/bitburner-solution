import {Ports} from "lib/util";
import {getProfit} from "contract/stockTraderIV";

type Signature = CodingContractSignatures[CodingContractName.AlgorithmicStockTraderII];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    await ns.sleep(20);
  }*/

  var prices = ns.readPort(Ports.Contract) as Signature[0];
  
  ns.writePort(Ports.Contract, getProfit(prices) as Signature[1]);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
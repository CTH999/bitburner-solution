import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.ArrayJumpingGame];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var ar: Array<number | boolean> = ns.readPort(Ports.Contract) as Signature[0];

  ar[ar.length - 1] = true;
  for (let i = ar.length - 2; i >= 0; --i)
    ar[i] = ar.slice(i + 1, Math.min(i + (ar[i] as number) + 1, ar.length)).some(a => a);

  ns.writePort(Ports.Contract, (ar[0] ? 1 : 0) as Signature[1]);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
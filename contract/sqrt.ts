import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.SquareRoot];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const n = ns.readPort(Ports.Contract) as Signature[0];
  var up = n, low = 1n, diff;

  // Binary search for the square root
  while (low != n && (diff = up - low) > 1n) {
    const bound = up - (diff >> 1n);
    const sq = bound * bound;

    if (sq > n)
      up = bound;
    else
      low = bound;
  }

  ns.writePort(Ports.Contract, low as Signature[1]);
  if (ns.run("./attempt.js", {"temporary": true}, ns.args[0], ns.args[1])) {
    await ns.nextPortWrite(Ports.Contract);
    if (!ns.peek(Ports.Contract)) {
      ns.clearPort(Ports.Contract);
      ns.writePort(Ports.Contract, up as Signature[1]);
      ns.spawn("./attempt.js", {"spawnDelay": 20, "temporary": true}, ns.args[0], ns.args[1]);
    }
  }
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
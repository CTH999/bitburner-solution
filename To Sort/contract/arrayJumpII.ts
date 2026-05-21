import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.ArrayJumpingGameII];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var ar = ns.readPort(Ports.Contract) as Signature[0];

  for (let i = ar.length - 1; i >= 0; --i) {
    if (i + ar[i] >= ar.length - 1)
      ar[i] = 1;
    else if (ar[i])
      ar[i] = 1 + Math.min(...ar.slice(i + 1, Math.min(ar[i] + i + 1, ar.length)).filter((a) => { return a; }));
  }

  ns.writePort(Ports.Contract, (ar[0] < Number.MAX_SAFE_INTEGER ? ar[0] : 0) as Signature[1]);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
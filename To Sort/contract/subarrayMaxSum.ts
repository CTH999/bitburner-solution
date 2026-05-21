import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.SubarrayWithMaximumSum];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    await ns.sleep(20);
  }*/

  var ar = ns.readPort(Ports.Contract) as Signature[0];
  var max: Signature[1] = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < ar.length;) {
    let sum = ar[i++];

    if (sum >= 0)
      while (i < ar.length && ar[i] >= 0)
        sum += ar[i++];
    if (sum > max)
      max = sum;

    for (let j = i; j < ar.length; ++j) {
      sum += ar[j];
      if (sum > max)
        max = sum;
    }
  }

  ns.writePort(Ports.Contract, max);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  //if (!flags.p)
  //  ns.clearPort(Ports.Contract);
}
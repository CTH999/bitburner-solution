import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.TotalWaysToSum];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const x = ns.readPort(Ports.Contract) as Signature[0];
  var p = [1,1];

  for (let n = 2; n <= x; ++n) {
    p.push(0);
    for (let k = 1, pent = 1; pent <= n; ++k, pent = (3 * k * k - k) >> 1) {
      if (k & 1)
        p[n] += p[n - pent];
      else
        p[n] -= p[n - pent];
      pent += k;
      if (pent > n)
        break;
      if (k & 1)
        p[n] += p[n - pent];
      else
        p[n] -= p[n - pent];
    }
  }
  ns.writePort(Ports.Contract, (p[x] - 1) as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
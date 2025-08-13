import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.MinimumPathSumInATriangle];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var tri = ns.readPort(Ports.Contract) as Signature[0];

  for (let i = tri.length - 2; i >= 0; --i) {
    for (let j = 0; j < tri[i].length; ++j)
      tri[i][j] += Math.min(tri[i + 1][j], tri[i + 1][j + 1]);
  }

  ns.writePort(Ports.Contract, tri[0][0] as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
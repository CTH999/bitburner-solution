import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.SpiralizeMatrix];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const mat = ns.readPort(Ports.Contract) as Signature[0];
  var walls = [mat[0].length, mat.length, -1, 0];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  var spiral: Signature[1] = [];

  for (let i = 0, j = 0, d = 0; true; i += dirs[d][0], j += dirs[d][1]) {
    spiral.push(mat[i][j]);
    if (dirs[d][0] != 0) {
      if (i + dirs[d][0] == walls[d]) {
        walls[d] -= dirs[d][0];
        ++d;
        d &= 3;
        if (j + dirs[d][1] == walls[d])
          break;
      }
    }
    else if (j + dirs[d][1] == walls[d]) {
      walls[d] -= dirs[d][1];
      ++d;
      d &= 3;
      if (i + dirs[d][0] == walls[d])
        break;
    }
  }

  ns.writePort(Ports.Contract, spiral);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
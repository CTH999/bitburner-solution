import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.UniquePathsInAGridII];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var grid = ns.readPort(Ports.Contract) as Signature[0];
  const dim = [grid.length, grid[0].length];

  if (!grid[dim[0] - 1][dim[1] - 1]) {
    grid[dim[0] - 1][dim[1] - 1] = 1;
    for (let i = dim[0] - 1; i >= 0; --i)
      for (let j = dim[1] - (i == dim[0] - 1 ? 2 : 1); j >= 0; --j) {
        if (grid[i][j])
          grid[i][j] = 0;
        else {
          grid[i][j] = 0;
          if (i < dim[0] - 1)
            grid[i][j] += grid[i + 1][j];
          if (j < dim[1] - 1)
            grid[i][j] += grid[i][j + 1];
        }
      }
  }

  ns.writePort(Ports.Contract, grid[0][0] as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
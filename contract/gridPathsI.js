import {Ports} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var dim = ns.readPort(Ports.Contract);
  --dim[0];
  --dim[1];
  const len = dim[0] + dim[1];
  var factorial = [1, 1, 1];

  for (let i = 1; i <= len; ++i) {
    factorial[2] *= i;
    if (dim[0] == i)
      factorial[0] = factorial[2];
    if (dim[1] == i)
      factorial[1] = factorial[2];
  }
  const paths = factorial[2] / (factorial[0] * factorial[1]);
  ns.writePort(Ports.Contract, paths);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
import {Ports} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["p", false], ["s", ""], ["x", 0]]);
  /*if (!flags.p) {
    ns.run("./getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/
  var x, s;

  if (flags.x && flags.s) {
    x = flags.x;
    s = JSON.parse(flags.s);
  }
  else
    [x, s] = ns.readPort(Ports.Contract);
  var p = new Array(x + 1);
  p[0] = 1;
  p.fill(0, 1);

  for (const k of s)
    for (let n = k; n <= x; ++n)
      p[n] += p[n - k];

  ns.writePort(Ports.Contract, p[x]);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  if (!flags.p)
    ns.clearPort(Ports.Contract);
}
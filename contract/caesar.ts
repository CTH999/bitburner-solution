import {Ports} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var msg = ns.readPort(Ports.Contract);
  const shift = msg[1];
  var enc = [];
  msg = msg[0];

  for (let i = 0; i < msg.length; ++i) {
    enc.push(msg.charCodeAt(i));
    if (enc[i] != 0x20) {
      enc[i] -= shift;
      if (enc[i] < 0x41)
        enc[i] += 26;
    }
  }

  ns.writePort(Ports.Contract, String.fromCharCode(...enc));
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
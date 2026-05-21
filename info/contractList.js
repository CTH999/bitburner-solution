import {deepScan} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  var hostnames = deepScan(ns);
  var msg = "";

  for (let i = 0; i < hostnames.length; ++i) {
    let ccs = ns.ls(hostnames[i], ".cct");
    if (ccs.length)
      msg += hostnames[i] + ": " + ccs.toString() + "\n";
  }
  ns.alert(msg);
}
import {deepScan} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["p", 0], ["host", ""], ["include-host", false], ["exclude-purchased", false]]);
  const host = flags.host ? flags.host : undefined;
  var hostnames = deepScan(ns, host, flags["include-host"]);

  if (flags["exclude-purchased"])
    hostnames = hostnames.filter((h) => { return !h.startsWith("hack"); });
  ns.writePort(flags.p, hostnames);
}
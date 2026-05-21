import {Ports, deepScan} from "lib/util";

export async function main(ns: NS) {
  var targets = deepScan(ns, "home", false, true);
  var cracked = new Set<string>();

  for (const target of targets.values())
    if (ns.hasRootAccess(target))
      cracked.add(target);

  targets = targets.difference(cracked);
  ns.writePort(Ports.Crack, targets);
}
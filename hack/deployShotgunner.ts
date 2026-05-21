import {Ports, deepScan} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export function deployShotgunner(ns: NS, dest: string) {
  var hostnames = deepScan(ns, undefined, false, false) as Array<string>;

  for (const hostname of hostnames.filter(ns.getServerMaxRam))
    ns.scp(ns.ls("home", "hack/").concat(ns.ls("home", "lib/"), ["/srv/get.js", "/stock/genSymbolInfo.ts"]), hostname);

  ns.scp(ns.ls("home", "daemons/"), dest);
  ns.kill("/hack/shotgunner.js", dest);
  ns.writePort(Ports.Exec, {script: "/hack/shotgunner.js", hostname: dest} as ExecutorJob);
}

export async function main(ns: NS) { deployShotgunner(ns, ns.args[0] as string); }
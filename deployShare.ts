import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export async function main(ns: NS) {
  const flags = ns.flags([["r", 0]]);
  const dest = (flags._ as Array<string>)[0];
  ns.scp("/share.ts", dest);
  ns.kill("/share.ts", dest);
  ns.writePort(Ports.Exec, {
    "script": "/share.ts",
    "hostname": dest,
    "threadOrOptions": (ns.getServerMaxRam(dest) - ns.getServerUsedRam(dest) - (flags.r as number)) >> 2
  } as ExecutorJob);
}
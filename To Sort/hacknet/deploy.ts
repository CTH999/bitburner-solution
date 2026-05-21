import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export function deployHacknet(ns: NS, dest: string) {
  var execJob: ExecutorJob = {"script": "/hacknet/launch.ts", "hostname": dest};
  ns.scp(ns.ls("home", "/hacknet/").concat(["/share.ts"]), dest, "home");
  ns.writePort(Ports.Exec, execJob);
}

export async function main(ns: NS) { deployHacknet(ns, ns.args[0] as string); }
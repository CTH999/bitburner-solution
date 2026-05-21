import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export var gangInfo: GangGenInfo;

export async function main(ns: NS) {
  ns.writePort(Ports.Exec, {
    "script": "/gang/get/gangInfo.ts",
    "hostname": ns.self().server,
    "threadOrOptions": {"temporary": true},
    "retry": true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Gang);
  gangInfo = Object.freeze(ns.readPort(Ports.Gang));
}
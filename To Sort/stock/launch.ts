import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {main as genSymbolInfo} from "stock/genSymbolInfo";

export async function main(ns: NS) {
  await genSymbolInfo(ns);

  var executorJob: ExecutorJob = {
    "script": "/stock/sellLoop.ts",
    "hostname": ns.self().server,
    "retry": true
  }
  ns.writePort(Ports.Exec, executorJob);
  executorJob.script = "/stock/buyLoop.ts";
  ns.writePort(Ports.Exec, executorJob);
}
import {Ports} from "lib/util";
import {extResetInfo, bladeburnerEnabled} from "lib/genInfo/reset";
import {ExecutorJob} from "daemons/executor";

export async function main(ns: NS) {
  if (bladeburnerEnabled(extResetInfo) && ns.bladeburner.joinBladeburnerDivision())
    ns.writePort(Ports.Exec, {
      script: "bladeburner/forge.ts",
      hostname: ns.self().server,
      threadOrOptions: {preventDuplicates: true},
      retry: true
    } as ExecutorJob);
}
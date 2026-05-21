import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export async function main(ns: NS) {
  var executorJob: ExecutorJob = {
    script: "/crack/getTargets.ts",
    hostname: ns.self().server,
    threadOrOptions: {temporary: true},
    retry: true
  };
  ns.clearPort(Ports.Crack);
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Crack);
  var targets: Set<string> = ns.readPort(Ports.Crack);

  while (targets.size) {
    let message = "";
    let cracked = new Set<string>();

    for (const target of targets.values()) {
      ns.clearPort(Ports.Crack);
      executorJob.script = "/crack/tryNuke.ts";
      executorJob.args = [target];
      ns.writePort(Ports.Exec, executorJob);
      await ns.nextPortWrite(Ports.Crack);
      if (ns.readPort(Ports.Crack)) {
        executorJob.script = "/crack/deployScripts.ts";
        ns.writePort(Ports.Exec, executorJob);
        cracked.add(target);
        message = message || "Cracked new targets:";
        message += "\n" + target;
      }
    }
    targets = targets.difference(cracked);
    if (message) {
      message += "\n" + targets.size.toString() + " target servers remaining";
      ns.alert(message);
    }
    await ns.sleep(30000);
  }
}
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export async function main(ns: NS) {
  const target = (ns.args as Array<string>)[0];
  var executorJob: ExecutorJob = {
    script: "/singularity/getCurrentServer.ts",
    hostname: ns.self().server,
    threadOrOptions: {temporary: true},
    retry: true
  };
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const host: string = ns.readPort(Ports.Singularity);

  executorJob.script = "/singularity/connect.ts";
  executorJob.args = [target, "--connected-host"];
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Singularity);
  if (ns.readPort(Ports.Singularity)) {
    ns.tprintf("INFO: Backdooring %s. Please stand by.", target);

    executorJob.args.pop();
    ns.writePort(Ports.Exec, executorJob);
    await ns.nextPortWrite(Ports.Singularity);
    ns.clearPort(Ports.Singularity);

    executorJob.script = "/singularity/installBackdoor.ts";
    delete executorJob.args;
    ns.writePort(Ports.Exec, executorJob);
    await ns.nextPortWrite(Ports.Singularity);
    ns.tprintf(
      ns.readPort(Ports.Singularity) ?
      "SUCCESS: Backdoored %s." :
      "ERROR: Couldn't install backdoor on %s.",
      target
    );
    executorJob.script = "/singularity/connect.ts";
    executorJob.args = [host];
    ns.writePort(Ports.Exec, executorJob);
  }
  else
    ns.tprint("ERROR: Couldn't find connected host.")
}
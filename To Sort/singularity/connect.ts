import {Ports} from "lib/util";
import {doDynamoJob} from "daemons/dynamo";

export async function main(ns: NS) {
  const flags = ns.flags([["connected-host", false]]);
  const target = (flags._ as Array<string>)[0];

  if (flags["connected-host"]) {
    const cbPort = Ports.PIDBase + ns.self().pid;
    let hostname;
    try {
      await doDynamoJob(ns, {
        functionName: "scan",
        args: [target],
        cbPort: cbPort
      }).then((hostnames: Array<string>) => hostname = hostnames.find(ns.singularity.connect));
    }
    catch (e) { ns.writePort(Ports.Singularity, null); }
    finally { ns.clearPort(cbPort); }
    ns.writePort(Ports.Singularity, hostname ?? null);
  }
  else
    ns.writePort(Ports.Singularity, ns.singularity.connect(target));
}
import {CompanyName} from "lib/nsEnums";
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export var companyRep: Record<CompanyName, number>;

export async function main(ns: NS) {
  ns.writePort(Ports.Exec, {
    script: "singularity/get/company/rep.ts",
    hostname: ns.self().server,
    args: ["-p", Ports.Singularity, "-a"],
    threadOrOptions: {temporary: true},
    retry: true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const rep = ns.readPort(Ports.Singularity) as Array<number>;
  companyRep = Object.freeze(Object.fromEntries(
    Object.values(CompanyName).map((c, i) => [c, rep[i]])
  ) as typeof companyRep);
}
import {CompanyName, JobName} from "lib/nsEnums";
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export var companyPositions: Record<CompanyName, Array<JobName>>;

export async function main(ns: NS) {
  ns.writePort(Ports.Exec, {
    script: "/singularity/get/company/positions.ts",
    hostname: ns.self().server,
    args: ["-p", Ports.Singularity, "-a"],
    threadOrOptions: {temporary: true},
    retry: true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const positions = ns.readPort(Ports.Singularity) as Array<Array<JobName>>;
  companyPositions = Object.freeze(Object.fromEntries(Object.values(CompanyName).map(
    (company, index) => [company, positions[index]]
  )) as typeof companyPositions);
}
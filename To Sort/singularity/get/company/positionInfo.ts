export async function main(ns: NS) {
  const flags = ns.flags([["p", 0], ["c", ""]]);
  ns.writePort(flags.p as number, (flags._ as Array<JobName>).map(job => ns.singularity.getCompanyPositionInfo(
    flags.c as CompanyName, job
  )));
}
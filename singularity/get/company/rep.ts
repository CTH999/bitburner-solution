import {CompanyName} from "lib/nsEnums";

export async function main(ns: NS) {
  const flags = ns.flags([["p", 0], ["a", false]]);
  ns.writePort(flags.p as number, (
    flags.a ? Object.values(CompanyName) : (flags._ as Array<CompanyName>)
  ).map(ns.singularity.getCompanyRep));
}
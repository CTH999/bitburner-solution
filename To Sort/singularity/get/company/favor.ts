import {CompanyName} from "lib/nsEnums";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false], ["p", 0]]);
  ns.writePort(flags.p as number, flags.a ?
    Object.values(CompanyName).map(ns.singularity.getCompanyFavor) :
    ns.singularity.getCompanyFavor((flags._ as Array<CompanyName>)[0])
  );
}
export async function main(ns: NS) {
  const flags = ns.flags([["f", false]]);
  ns.singularity.workForCompany((flags._ as Array<CompanyName>)[0], flags.f as boolean);
}
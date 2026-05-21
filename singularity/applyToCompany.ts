export async function main(ns: NS) {
  ns.singularity.applyToCompany(ns.args[0] as CompanyName, ns.args[1] as JobField);
}
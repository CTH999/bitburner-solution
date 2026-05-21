export async function main(ns: NS) {
  const port = ns.flags([["p", 0]]).p as number;
  ns.writePort(port, ns.singularity.checkFactionInvitations());
}
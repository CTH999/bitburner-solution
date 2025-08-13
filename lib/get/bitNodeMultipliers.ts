export async function main(ns: NS) {
  const flags = ns.flags([["p", 0], ["n", 0], ["l", 0]]);
  ns.writePort(flags.p as number, ns.getBitNodeMultipliers(
    (flags.n as number) || undefined, (flags.l as number) || undefined
  ));
}
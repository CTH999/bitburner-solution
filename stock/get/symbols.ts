export async function main(ns: NS) {
  const flags = ns.flags([["p", 0]]);
  ns.writePort(flags.p as number, ns.stock.getSymbols());
}
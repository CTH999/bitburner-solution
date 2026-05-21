export async function main(ns: NS) {
  const flags = ns.flags([["q", 0]]);
  ns.stock.buyStock((flags._ as Array<string>)[0], flags.q as number);
}
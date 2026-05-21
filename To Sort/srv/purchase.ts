export async function main(ns: NS) {
  const flags = ns.flags([["p", 0], ["r", 0]]);
  const hostname = ns.purchaseServer((flags._ as Array<string>)[0], flags.r as number || 256);
  if (flags.p && hostname)
    ns.writePort(flags.p as number, hostname);
}
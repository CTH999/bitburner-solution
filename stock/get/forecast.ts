export async function main(ns: NS) {
  const flags = ns.flags([["p", 0]]);
  const port = flags.p as number;
  try { ns.writePort(port, (flags._ as Array<string>).map(ns.stock.getForecast)); }
  catch (e) { ns.writePort(port, null); }
}
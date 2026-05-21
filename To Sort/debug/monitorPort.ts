export async function main(ns: NS) {
  const flags = ns.flags([["p", 0]]);
  ns.ui.openTail();
  while(true) {
    await ns.nextPortWrite(flags.p as number);
    ns.print(JSON.stringify(ns.peek(flags.p)));
  }
}
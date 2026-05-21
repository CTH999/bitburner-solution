export function deployServerBuyer(ns: NS, dest: string) {
  ns.scp(ns.ls("home", "srv/").concat(ns.ls("home", "lib/"), ns.ls("home", "daemons/")), dest);
  ns.exec("/srv/purchaseHackers.ts", dest);
}

export async function main(ns: NS) { deployServerBuyer(ns, ns.args[0] as string); }
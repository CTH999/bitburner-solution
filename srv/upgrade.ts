export async function main(ns: NS) {
  const hostname = ns.args[0] as string;
  ns.upgradePurchasedServer(hostname, ns.getServerMaxRam(hostname) << 1);
}
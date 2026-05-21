import {BitNode} from "lib/nsEnums";
import {Ports} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";

const InitRam = 1 << 8;
const SleepMillis = 15000;
const RequiredSeedMoney = extResetInfo.currentNode == BitNode.GhostOfWallStreet ? 1e9 : 0;

export async function main(ns: NS) {
  const cbPort = ns.self().pid + Ports.PIDBase;

  function getPurchasedSrvs() {
    return ns.scan("home").filter(h => h.includes("hack"));
  }

  function done(hostnames: Array<string>) {
    return hostnames.length == extResetInfo.purchasedServers.limit &&
           hostnames.every(h => ns.getServerMaxRam(h) == extResetInfo.purchasedServers.maxRam);
  }

  // Shotgunner now expands to fill available space, so this filter is not in use
  function halfFull(h: string) { return ns.getServerUsedRam(h) > (ns.getServerMaxRam(h) >>> 1); }

  for (let hostnames = getPurchasedSrvs(); !done(hostnames); hostnames = getPurchasedSrvs()) {
    while (!ns.run("/lib/get/moneySources.ts", {"temporary": true}, "-p", cbPort))
      await ns.sleep(20);
    await ns.nextPortWrite(cbPort);
    const moneySinceInstall = (ns.readPort(cbPort) as MoneySources).sinceInstall;

    // Servers must pay for themselves in hacking money and stock manipulation
    if (moneySinceInstall.hacking + moneySinceInstall.stock - RequiredSeedMoney > Math.abs(moneySinceInstall.servers)) {
      if (hostnames.length < extResetInfo.purchasedServers.limit)
        while (!ns.run("./purchase.ts", {"temporary": true}, "hacker", "-r", InitRam, "-p", Ports.ServerBroadcast))
          await ns.sleep(20);
      else {
        hostnames.sort((a, b) => { return ns.getServerMaxRam(a) - ns.getServerMaxRam(b); });
        while (!ns.run("./upgrade.ts", {"temporary": true}, hostnames[0], ns.getServerMaxRam(hostnames[0]) << 1))
          await ns.sleep(20);
      }
    }
    await ns.sleep(SleepMillis);
  }
  ns.toast("Finished upgrading hackers", "success");
}
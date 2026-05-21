import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  var augs, augInfo;

  ns.run("./get/purchasableAugs.js", {"temporary": true});
  await ns.nextPortWrite(Ports.Sleeve);
  augs = ns.readPort(Ports.Sleeve);
  for (const aug of augs) {
    ns.run("./get/augPrice.js", {"temporary": true}, aug);
    await ns.nextPortWrite(Ports.Sleeve);
    ns.run("./get/augRepReq.js", {"temporary": true}, aug);
    await ns.nextPortWrite(Ports.Sleeve);
    augInfo[aug] = [ns.readPort(Ports.Sleeve), ns.readPort(Ports.Sleeve)];
  }
  ns.write("./augInfo.json", JSON.stringify(augInfo), "w");
}
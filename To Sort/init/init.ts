import {FreebieHostnames} from "lib/util";
import {deployScripts} from "crack/deployScripts";

export const MarginMillis = 50;

export async function main(ns: NS) {
  ns.exec("./cleanup.ts", "home");
  await ns.sleep(MarginMillis);
  ns.exec("./collectLit.ts", "home");
  await ns.sleep(MarginMillis);
  ns.exec("/lib/genInfo/reset.ts", "home");
  for (const target of FreebieHostnames) {
    await ns.sleep(MarginMillis);
    ns.nuke(target);
    deployScripts(ns, target);
  }
  // A brief delay allows /lib/genInfo/reset to use all avilable RAM
  ns.spawn("./init2.ts", {spawnDelay: 200});
}
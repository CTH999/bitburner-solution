import {SleepTime} from "stock/init";

export async function main(ns: NS) {
  while (!ns.stock.purchaseTixApi())
    await ns.sleep(SleepTime);

  ns.kill("/share.ts");
  ns.spawn("./launch.ts", {"spawnDelay": 0});
}
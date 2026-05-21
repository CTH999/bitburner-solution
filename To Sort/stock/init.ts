export const SleepTime = 300000;

export async function main(ns: NS) {
  while (!ns.stock.purchaseWseAccount())
    await ns.sleep(SleepTime);

  ns.spawn("./init2.ts", {"spawnDelay": 0});
}
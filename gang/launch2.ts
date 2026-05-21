export async function main(ns: NS) {
  while (!ns.run("./genTaskInfo.ts", {"temporary": true}))
    await ns.sleep(100);
  while (!ns.run("./genMemberInfo.ts", {"temporary": true}))
    await ns.sleep(100);
  ns.spawn("./kingpin.ts", {"spawnDelay": 0});
}
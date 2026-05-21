export async function main(ns: NS) {
  const flags = ns.flags([["q", false]]);
  if (ns.gang.inGang()) 
    ns.spawn("./launch2.ts", {"spawnDelay": 0});
  else if (!flags.q)
    ns.toast("Not in gang", ns.enums.ToastVariant.ERROR);
}
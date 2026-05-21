export async function main(ns: NS) {
  const dest: string = ns.args[0] as string;

  ns.scp(ns.ls("home", "stock/").concat(ns.ls("home", "lib/"), ns.ls("home", "daemons/"), ["/share.ts"]), dest);
  ns.kill("./init.ts", dest);
  ns.kill("./init2.ts", dest);
  ns.kill("./launch.ts", dest);
  ns.kill("./buyLoop.ts", dest);
  await ns.sleep(5000); // Allow time for sell loop to sell all stocks
  ns.kill("./sellLoop.ts", dest);
  ns.kill("/share.ts", dest);
  ns.exec("./init.ts", dest);
  const freeRam = ns.getServerMaxRam(dest) - ns.getServerUsedRam(dest);
  if (freeRam >= 4)
    ns.exec("/share.ts", dest, freeRam >> 2);
}
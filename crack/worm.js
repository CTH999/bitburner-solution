/** @param {NS} ns */
export async function main(ns) {
  var nodes = new Set(ns.scan());
  var nodesIter = nodes.values();

  for (const target of nodesIter) {
    let wormed = new Set();

    if (ns.hasRootAccess(target))
      wormed.add(target);
  
    nodes = nodes.difference(wormed);
  }
  while (nodes.size) {
    let wormed = new Set();
    let message = null;
    nodesIter = nodes.values();
  
    for (const target of nodesIter) {
        ns.brutessh(target);
        if (ns.fileExists("FTPCrack.exe"))
          ns.ftpcrack(target);
        if (ns.nuke(target)) {
          ns.scp("worm.js", target);
          ns.exec("worm.js", target);
          wormed.add(target);
          message = message || "Wormed new targets:";
          message += "\n" + target;
        }
    }
    nodes = nodes.difference(wormed);
    if (message)
      ns.alert(message);
    ns.sleep(30000);
  }
}
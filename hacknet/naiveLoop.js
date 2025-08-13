const SleepMillis = 5000;

/** @param {NS} ns */
export async function main(ns) {
  var i;
  var nodes = new Array(ns.hacknet.numNodes());
  var init = true, upgradesRemaining = undefined, nodePriceOK = undefined, maxPrice;

  function spendHashes() {
    // TODO: Spend hashes

  };

  ns.disableLog("sleep");

  for (i = 0; i < ns.hacknet.numNodes(); ++i)
    nodes[i] = ns.hacknet.getNodeStats(i);

  ns.print("Beginning hacknet acquisition");
  while (init || upgradesRemaining || nodePriceOK) {
    if (upgradesRemaining) {
      ns.print("Continuing with node upgrades");
      for (i = 0; i < nodes.length; ++i)
        ns.hacknet.upgradeRam(i);
      for (i = 0; i < nodes.length; ++i)
        ns.hacknet.upgradeCore(i);
      for (i = 0; i < nodes.length; ++i)
        ns.hacknet.upgradeLevel(i, 16);
    }
    if (!init)
      ns.printf("Node price deemed %sacceptable ($%s %s $%s)", nodePriceOK ? "" : "un", ns.formatNumber(ns.hacknet.getPurchaseNodeCost()), nodePriceOK ? "<" : ">", ns.formatNumber(maxPrice));
    if (nodePriceOK || init) {
      i = ns.hacknet.purchaseNode();
      if (i >= 0)
        nodes.push(ns.hacknet.getNodeStats(i))
    }
    init = !ns.hacknet.numNodes();
    if (!init) {
      maxPrice = ns.hacknet.getNodeStats(0).production << 19;
      nodePriceOK = ns.hacknet.getPurchaseNodeCost() < maxPrice;
      upgradesRemaining = ns.hacknet.getNodeStats(ns.hacknet.numNodes() - 1).cores < 16;
    }

    if (ns.hacknet.hashCapacity())
      spendHashes();

    await ns.sleep(SleepMillis);
  }

  if (ns.hacknet.hashCapacity()) {
    while (true) {
      spendHashes();
      await ns.sleep(SleepMillis);
    }
  }

  ns.toast("Ceasing Hacknet acquisition");
  if (ns.self().server != "home")
    ns.spawn("share.ts", 2);
}
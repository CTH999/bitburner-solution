import {extResetInfo} from "lib/genInfo/reset";

const SleepMillis = 30000;
const ROIThreshold = 1/(4*3600); // Max 4 hours to recover investment

const NetburnersRequirements = {
  "Levels": 100,
  "Ram": 8,
  "Cores": 4
};

enum PurchaseType {
  Node = "Node",
  Level = "Level",
  Ram = "Ram",
  Core = "Core"
};

/** [index, type, ROI] */
type Purchase = [number, PurchaseType, number];

function roiComparator(a: Purchase, b: Purchase) { return a[2] - b[2]; }

function netburnersRequirementsMet(nodes: Array<NodeStats>) {
  return nodes.reduce((sum, node) => sum + node.level, 0) >= NetburnersRequirements.Levels &&
    nodes.reduce((sum, node) => sum + node.ram, 0) >= NetburnersRequirements.Ram &&
    nodes.reduce((sum, node) => sum + node.cores, 0) >= NetburnersRequirements.Cores;
}

export async function main(ns: NS) {
  const consts = ns.formulas.hacknetNodes.constants();
  var multipliers = ns.getHacknetMultipliers();
  const fullUpgradeCost =
    ns.formulas.hacknetNodes.levelUpgradeCost(1, consts.MaxLevel - 1, multipliers.levelCost) +
    ns.formulas.hacknetNodes.ramUpgradeCost(1, Math.log2(consts.MaxRam), multipliers.ramCost) +
    ns.formulas.hacknetNodes.coreUpgradeCost(1, consts.MaxCores - 1, multipliers.coreCost);
  var baseProduction = 0, maxProduction = 0;
  var nodes: Array<NodeStats> = new Array(ns.hacknet.numNodes());

  function calcProduction() {
    baseProduction = ns.formulas.hacknetNodes.moneyGainRate(1, 1, 1, multipliers.production);
    maxProduction = ns.formulas.hacknetNodes.moneyGainRate(
      consts.MaxLevel, consts.MaxRam, consts.MaxCores, multipliers.production
    );
  }

  function getLevelROI(index: number) {
    const stats = nodes[index];
    return (ns.formulas.hacknetNodes.moneyGainRate(
      stats.level + 1, stats.ram, stats.cores, multipliers.production
    ) - stats.production) / ns.hacknet.getLevelUpgradeCost(index);
  }

  function getRamROI(index: number) {
    const stats = nodes[index];
    return (ns.formulas.hacknetNodes.moneyGainRate(
      stats.level, stats.ram + 1, stats.cores, multipliers.production
    ) - stats.production) / ns.hacknet.getRamUpgradeCost(index);
  }

  function getCoreROI(index: number) {
    const stats = nodes[index];
    return (ns.formulas.hacknetNodes.moneyGainRate(
      stats.level, stats.ram, stats.cores + 1, multipliers.production
    ) - stats.production) / ns.hacknet.getCoreUpgradeCost(index);
  }

  function getNodeROI() {
    const nodeCost = ns.hacknet.getPurchaseNodeCost();
    return Math.max(
      maxProduction / (nodeCost + fullUpgradeCost),
      baseProduction / nodeCost
    );
  }

  const getROIFuncs = { // Used for dynamic calls
    [PurchaseType.Level]: getLevelROI,
    [PurchaseType.Ram]: getRamROI,
    [PurchaseType.Core]: getCoreROI,
    [PurchaseType.Node]: getNodeROI
  };

  function pushUpgrades(index: number) {
    let roi;
    if (roi = getLevelROI(index))
      purchaseQueue.push([index, PurchaseType.Level, roi]);
    if (roi = getRamROI(index))
      purchaseQueue.push([index, PurchaseType.Ram, roi]);
    if (roi = getCoreROI(index))
      purchaseQueue.push([index, PurchaseType.Core, roi]);
  }

  function spawnShare() {
    if (ns.self().server != "home")
      ns.spawn("share.ts", 2);
  }

  if (extResetInfo.currentNode == 11)
    spawnShare();

  ns.sleep(5000);
  calcProduction();
  var purchaseQueue: Array<Purchase> = [[nodes.length, PurchaseType.Node, getNodeROI()]];
  for (let i = 0; i < nodes.length; ++i) {
    nodes[i] = ns.hacknet.getNodeStats(i);
    pushUpgrades(i);
  }
  purchaseQueue.sort(roiComparator);

  ns.print("Max production: " + ns.formatNumber(maxProduction));
  ns.print("Fully upgraded node cost: " + ns.formatNumber(ns.hacknet.getPurchaseNodeCost() + fullUpgradeCost));
  ns.print("Purchase queue: " + JSON.stringify(purchaseQueue));
  var next = purchaseQueue[purchaseQueue.length - 1];
  while (next[2] > ROIThreshold || !netburnersRequirementsMet(nodes)) {
    const [index, typ] = next;
    let success: boolean | number = 0;
    if (index == nodes.length) {
      success = ns.hacknet.purchaseNode();
      if (success >= 0) {
        ++next[0];
        next[2] = getNodeROI();
        nodes.push(ns.hacknet.getNodeStats(success));
        pushUpgrades(success);
      }
    }
    else {
      if (success = (ns.hacknet[("upgrade" + typ) as keyof Hacknet] as (i: number) => boolean)(index)) {
        nodes[index] = ns.hacknet.getNodeStats(index);
        if (nodes[index][typ == PurchaseType.Core ? "cores" : typ.toLowerCase() as keyof NodeStats] ==
            consts["Max" + (typ == PurchaseType.Core ? "Cores" : typ) as keyof HacknetNodeConstants])
          purchaseQueue.pop();
        for (let i = 0; i < purchaseQueue.length; ++i)
          if (purchaseQueue[i][0] == index)
            purchaseQueue[i][2] = getROIFuncs[purchaseQueue[i][1]](index);
      }
    }

    if (success)
      purchaseQueue.sort(roiComparator);
    else {
      await ns.sleep(SleepMillis);
      multipliers = ns.getHacknetMultipliers();
      calcProduction();
      ns.print("Purchase queue: " + JSON.stringify(purchaseQueue));
    }
    next = purchaseQueue[purchaseQueue.length - 1];
  }

  ns.toast("Ceasing Hacknet acquisition");
  spawnShare();
}
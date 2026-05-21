// Execution time ratios: 20 : 16 : 5 (weaken : grow : hack)

import {BitNode} from "lib/nsEnums";
import {ReservedRam, Ports, SpecialHostnames, deepScan, srvSecurityDelta} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";
import {symbolInfoRecord} from "stock/genSymbolInfo";

// Could do more, but launching even this many takes a significant chunk of time,
// affecting both hacking performance and IRL performance.
// And this isn't a hard cap. The shotgunner currently doesn't recalculate when available RAM
// changes, and after the initial blast, it will fill in the gaps with smaller batches.
const BatchSoftcap = 18e3;

const BatchHardcap = 25e3;

const BatchesPerSleep = 0x1FF;

// No longer used
function ramComparator(a, b) { return (a.maxRam - a.ramUsed) - (b.maxRam - b.ramUsed); };

function getForecasts() {
  var forecasts = {};
  if (symbolInfoRecord) {
    for (const s of Object.values(symbolInfoRecord))
      forecasts[s.organization] = s.forecast;
  }
  return forecasts;
}

/** @param {Server} a
 * @param {Server} b
 */
function forecastComparator(a, b) {
  var symbolInfo = Object.values(symbolInfoRecord);
  return Math.abs(symbolInfo.find(s => s.organization == a.organizationName).forecast - 0.5) -
         Math.abs(symbolInfo.find(s => s.organization == b.organizationName).forecast - 0.5);
}

function shouldUseStockMode() {
  // TODO: Go by BN mults when available
  return [BitNode.GhostOfWallStreet, BitNode.BigCrash].includes(extResetInfo.currentNode);
}

function isGrowable(server) { return server.moneyMax; }

/** @param {NS} ns
 * @param {Set} pids
*/
function removeDeadPids(ns, pids) {
  for (const pid of pids.values())
    if (!ns.isRunning(pid))
      pids.delete(pid);
}

function printStockInfo(ns, forecasts, target) {
  if (forecasts && forecasts[target.organizationName])
    ns.printf("INFO: Using stock manipulation flags. Forecast is %s.", ns.formatPercent(forecasts[target.organizationName]));
  else
    ns.printf("INFO: Forecast for %s unavailable. Not engaging in market manipulation.", target.organizationName);
}

/** @param {NS} ns */
async function shootShotgun(ns, target, hackParams, forecast, servers, player, prevPids) {
  if (srvSecurityDelta(target))
    ns.printf("WARN: %s's security is above minimum", target.hostname);

  const timestamp = performance.now();
  const times = {
    "h": ns.formulas.hacking.hackTime(target, player),
    "g": ns.formulas.hacking.growTime(target, player),
    "w": ns.formulas.hacking.weakenTime(target, player)
  };
  const extraMillis = [times.w - times.h, times.w - times.g];
  var batchCnt = 0;
  var pids = new Set();

  // Single-step prep by skipping hacks is best we can do for shotgunning
  const runGrow = true; //!srvSecurityDelta(target);
  const runHack = !srvSecurityDelta(target) && player.skills.hacking >= target.requiredHackingSkill;
  
  if (!(runGrow && runHack)) {
    hackParams = structuredClone(hackParams);
    if (!runHack) {
      hackParams.host.ramCost.total -= hackParams.host.ramCost.h;
      hackParams.home.ramCost.host = 0;
    }
    if (!runGrow) {
      hackParams.home.ramCost.total -= hackParams.home.ramCost.g;
      hackParams.host.ramCost.total -= hackParams.host.ramCost.g;
    }
  }

  forecast ??= 0.5;
  servers.home.ramUsed += ReservedRam;
  var hackerIdx = 0;
  do {
    do {
      // For best performance, this loop must contain no ns calls except the unavoidable execs
      const useHome = hackParams.home.ramCost.home <= servers.home.maxRam - servers.home.ramUsed; // && (hackParams.home.ramCost.total > hackParams.host.ramCost.total || homeCores == 1);
      while (hackerIdx < servers.hackers.length &&
            servers.hackers[hackerIdx].maxRam - servers.hackers[hackerIdx].ramUsed <
            (useHome ? hackParams.home.ramCost.host : hackParams.host.ramCost.total))
        ++hackerIdx;
      // If there's still space left on home after using it for grow/weaken, use what remains for hacking
      if (hackerIdx == servers.hackers.length && hackParams.home.ramCost.total > servers.home.maxRam - servers.home.ramUsed)
        ++hackerIdx;
      if (hackerIdx <= servers.hackers.length) {
        const hacker = hackerIdx == servers.hackers.length ? servers.home : servers.hackers[hackerIdx];
        let batchParams;
        let wgServer;
        // Scripts are restarted on load, so there's no point saving hacking scripts
        // All are temporary
        if (useHome) {
          batchParams = hackParams.home;
          wgServer = servers.home;
          servers.home.ramUsed += batchParams.ramCost.home;
          hacker.ramUsed += batchParams.ramCost.host;
        }
        else {
          // Fall back to running all on hacker
          batchParams = hackParams.host;
          wgServer = hacker;
          hacker.ramUsed += batchParams.ramCost.total;
        }
        if (runHack)
          pids.add(ns.exec("./hack.ts", hacker.hostname, {"temporary": true, "threads": batchParams.threads.h}, target.hostname, "-d", extraMillis[0], ...(forecast < 0.5 ? ["-s"] : [])));
        pids.add(ns.exec("./weaken.ts", wgServer.hostname, {"temporary": true, "threads": batchParams.threads.w[0]}, target.hostname));
        if (runGrow)
          pids.add(ns.exec("./grow.ts", wgServer.hostname, {"temporary": true, "threads": batchParams.threads.g}, target.hostname, "-d", extraMillis[1], ...(forecast > 0.5 ? ["-s"] : [])));
        pids.add(ns.exec("./weaken.ts", wgServer.hostname, {"temporary": true, "threads": batchParams.threads.w[1]}, target.hostname));
        ++batchCnt;
        if (!(++batchCnt & BatchesPerSleep))
          await ns.sleep(0);
      }
    } while (hackerIdx <= servers.hackers.length && !pids.has(0) && batchCnt < BatchHardcap);
    removeDeadPids(ns, prevPids);
    if (prevPids.size)
      await ns.sleep(20);
  } while (prevPids.size);
  if (pids.has(0)) {
    ns.print("ERROR: Exec failed (probably bad RAM logic)");
    ns.enableLog("exec");
    ns.toast("Exec failed in batcher", ns.enums.ToastVariant.ERROR);
    pids.delete(0);
  }
  servers.home.ramUsed -= ReservedRam;
  ns.printf("SUCCESS: Launched (or attempted to launch) %d batches in %dms", batchCnt, performance.now() - timestamp);
  return pids;
}

/** @param {NS} ns */
async function redeploy(ns) {
  // Run deployment script not only to restart this batcher with an updated hostname list,
  // but also to deploy hack scripts to new server(s);
  ns.enableLog("exec");
  while (!ns.exec("./deployShotgunner.ts", "home", 1, ns.self().server))
    await ns.sleep(50);
  return ns.exit();
}

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("scan");
  const hostname = ns.self().server;
  const useStockMode = shouldUseStockMode();
  /*const weakenRam = ns.getScriptRam("weaken.ts");
  const growRam = ns.getScriptRam("grow.ts");
  const hackRam = ns.getScriptRam("hack.ts");*/
  var hackParams = {}, gapFillerParams = {};
  var player;
  var homeCores = undefined;
  var hackSkill = undefined;
  var targetCnt = 0;
  var hostnames = deepScan(ns, "home", true);
  var servers;
  var moneyTargets = new Array(2), expTargets = new Array(2);
  var farmingExp = true;
  var forecasts;
  var pids = new Set();

  if (!ns.fileExists("Formulas.exe", "home")) {
    // TODO: Write fallback for pre-Formulas.exe usage
    ns.print("ERROR: Formulas.exe not found");
    ns.toast("Tried to run shotgunner without Formulas.exe", ns.enums.ToastVariant.ERROR);
    exit();
  }

  // Currently, calcHackParams can't handle unhackable servers, so filter them out
  function isHackable(server) { return ns.formulas.hacking.hackPercent(server, player); }

  async function calcHackParams() {
    const usableRam = servers.hackers.reduce((total, s) => total + s.maxRam, 0) + servers.home.maxRam;
    const maxHostRam = Math.max(...servers.hackers.map(s => s.maxRam));
    ns.clearPort(Ports.Hack);

    ns.writePort(Ports.Hack, [
      player, servers.home, servers.targets, {"maxHostRam": maxHostRam}
    ]);
    while (!ns.exec("./calcHackParams.js", hostname, {"temporary": true}, "-p", Ports.Hack))
      await ns.sleep(5);
    await ns.nextPortWrite(Ports.Hack);
    gapFillerParams = ns.readPort(Ports.Hack);

    ns.writePort(Ports.Hack, [player, servers.home, servers.targets, {
      "minRam": usableRam / BatchSoftcap, "maxHostRam": maxHostRam
    }]);
    while (!ns.exec("./calcHackParams.js", hostname, {"temporary": true}, "-p", Ports.Hack))
      await ns.sleep(5);
    let p = ns.nextPortWrite(Ports.Hack);
    await p;
    hackParams = ns.readPort(Ports.Hack);
    return p;
  };

  const moneyEfficiencyComparators = [
    (a, b) => hackParams[b.hostname].host.efficiency - hackParams[a.hostname].host.efficiency,
    (a, b) => gapFillerParams[b.hostname].host.efficiency - gapFillerParams[a.hostname].host.efficiency
  ];

  const expEfficiencyComparators = [
    (a, b) => hackParams[b.hostname].host.expEfficiency - hackParams[a.hostname].host.expEfficiency,
    (a, b) => gapFillerParams[b.hostname].host.expEfficiency - gapFillerParams[a.hostname].host.expEfficiency
  ];

  function hasAssociatedStock(server) { return server.organizationName in forecasts; }

  ns.clearPort(Ports.ServerBroadcast);
  // Sleeping before entering the loop prevents port-related errors on resume
  await ns.sleep(5000);
  //ns.disableLog("sleep");
  // Comment this out only for debugging. For routine operation, exec logging is not worth the performance hit.
  ns.disableLog("exec");
  while (true) {
    if (ns.peek(Ports.ServerBroadcast) != "NULL PORT DATA")
      await redeploy(ns);

    forecasts = getForecasts();
    player = ns.getPlayer();

    while (!ns.exec("/srv/get.js", hostname, {"temporary": true}, "-p", Ports.Hack, ...hostnames))
      ns.sleep(5);
    await ns.nextPortWrite(Ports.Hack);
    servers = {"all": ns.readPort(Ports.Hack)};
    servers.cracked = servers.all.filter(s => s.hasAdminRights)
    servers.hackers = servers.cracked.filter(s => !SpecialHostnames.includes(s.hostname) && s.maxRam);
    servers.targets = servers.cracked.filter(useStockMode ? hasAssociatedStock : isGrowable).filter(isHackable);
    servers.home = servers.cracked.find(s => s.hostname == "home");
    targetCnt = servers.targets.length;

    if (!targetCnt) {
      ns.print("ERROR: No targets found.");
      await ns.sleep(10000);
      continue;
    }

    //ns.tprint(JSON.stringify(servers.targets));
    if (hackSkill != player.skills.hacking || homeCores != servers.home.cpuCores || targetCnt != servers.targets.length) {
      // FIXME: This should also run when usable RAM changes, which is more complicated to check for
      homeCores = servers.home.cpuCores;
      hackSkill = player.skills.hacking;

      await calcHackParams();
      for (let i = 0; i < 2; ++i) {
        servers.targets.sort(useStockMode ? forecastComparator : moneyEfficiencyComparators[i]);
        moneyTargets[i] = servers.targets[0];
        servers.targets.sort(expEfficiencyComparators[i]);
        expTargets[i] = servers.targets[0];
      }

      let params = hackParams[moneyTargets[0].hostname];
      ns.printf(
        "INFO: Targeting %s for money\nUsing hack ratios: %s for home, %s for host\nEfficiency ($/GiB-s): %s for home, %s for host",
        moneyTargets[0].hostname,
        ns.formatNumber(params.home.ratio),
        ns.formatNumber(params.host.ratio),
        ns.formatNumber(params.home.efficiency),
        ns.formatNumber(params.host.efficiency)
      );
      printStockInfo(ns, forecasts, moneyTargets[0]);

      params = gapFillerParams[moneyTargets[1].hostname];
      ns.printf(
        "INFO: Filling gaps with %s\nUsing hack ratios: %s for home, %s for host\nEfficiency ($/GiB-s): %s for home, %s for host",
        moneyTargets[1].hostname,
        ns.formatNumber(params.home.ratio),
        ns.formatNumber(params.host.ratio),
        ns.formatNumber(params.home.efficiency),
        ns.formatNumber(params.host.efficiency)
      );

      params = hackParams[expTargets[0].hostname];
      ns.printf(
        "INFO: Targeting %s for exp (and filling gaps with %s\nUsing hack ratios: %s for home, %s for host\nEfficiency (exp/GiB-s): %s for home, %s for host",
        expTargets[0].hostname,
        expTargets[1].hostname,
        ns.formatNumber(params.home.ratio),
        ns.formatNumber(params.host.ratio),
        ns.formatNumber(params.home.expEfficiency),
        ns.formatNumber(params.host.expEfficiency)
      );
      printStockInfo(ns, forecasts, expTargets[0]);
    }
    else
      // Still need to update target server info for correct execution times
      for (let i = 0; i < 2; ++i) {
        expTargets[i] = servers.targets.find(s => s.hostname == expTargets[i].hostname);
        moneyTargets[i] = servers.targets.find(s => s.hostname == moneyTargets[i].hostname);
      }

    const targets = farmingExp ? expTargets : moneyTargets;
    let pids1;
    ns.disableLog("sleep");
    await shootShotgun(
      ns,
      targets[0],
      hackParams[targets[0].hostname],
      forecasts[targets[0].organizationName],
      servers,
      player,
      pids
    ).then(val => pids1 = val);
    await shootShotgun(
      ns,
      targets[1],
      gapFillerParams[targets[1].hostname],
      forecasts[targets[1].organizationName],
      servers,
      player,
      pids
    ).then(val => pids = pids1.union(val));
    ns.enableLog("sleep");
    await ns.sleep(pids.size ? Math.max(
      ns.formulas.hacking.weakenTime(targets[0], player),
      ns.formulas.hacking.weakenTime(targets[1], player)
    ) : 1000);
    farmingExp = !farmingExp;
  }
}
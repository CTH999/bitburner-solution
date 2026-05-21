const HackParamsFile = "./hackParams.json";
const FailExpRatio = 0.25;

/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["p", 0]]);
  const weakenRam = ns.getScriptRam("./weaken.ts");
  const growRam = ns.getScriptRam("./grow.ts");
  const hackRam = ns.getScriptRam("./hack.ts");
  const [player, home, targets, opts = {}] = ns.readPort(flags.p);
  const weakenAmt = {"home": ns.weakenAnalyze(1, home.cpuCores), "host": ns.weakenAnalyze(1)};
  var hackParams = {};

  opts.minRam ??= 0;
  opts.maxHostRam ??= Number.MAX_SAFE_INTEGER;
  if (opts.minRam > opts.maxHostRam)
    opts.minRam = 0;

  for (let target of targets) {
    let params = {
      "home": {"efficiency": -1, "expEfficiency": -1, "ramCost": {}, "threads": {}},
      "host": {"efficiency": -1, "expEfficiency": -1, "ramCost": {}, "threads": {}}
    };
    target.hackDifficulty = target.minDifficulty; // Assume server will be fully weakened.
    const hackChance = ns.formulas.hacking.hackChance(target, player);
    // hackPercent returns 0 for servers with unmet hack requirement, which would cause infinite loop
    const hackAmt = ns.formulas.hacking.hackPercent(target, player) || 1;
    const weakenTime = ns.formulas.hacking.weakenTime(target, player);
    params.home.ramCost.total = 1 << 20;
    params.host.ramCost.total = 1 << 20;

    for (let tHack = 1, ratio = hackAmt, cont = true; cont; ++tHack, ratio = Math.min(ratio + hackAmt, 1)) {
      // Seems this function can't be assumed to have only one inflection point
      cont = /*(params.home.efficiency < 0 || params.host.efficiency < 0) &&*/ ratio < 1;
      target.moneyAvailable = target.moneyMax * (1 - ratio); // Assume server will be depleted.
      let tGrow = ns.formulas.hacking.growThreads(target, player, target.moneyMax, home.cpuCores);
      let tWeaken = [
        Math.ceil(ns.hackAnalyzeSecurity(tHack) / weakenAmt.home),
        Math.ceil(ns.growthAnalyzeSecurity(tGrow) / weakenAmt.home)
      ];
      let ramCost = {"w": [tWeaken[0] * weakenRam, tWeaken[1] * weakenRam], "g": tGrow * growRam};
      ramCost.home = ramCost.w[0] + ramCost.w[1] + ramCost.g;
      ramCost.host = ramCost.h = tHack * hackRam;
      ramCost.total = ramCost.home + ramCost.host;
      let efficiency = ratio / ramCost.total;
      if (efficiency >= params.home.efficiency &&
          (ramCost.host <= opts.maxHostRam || tHack == 1) &&
          (ramCost.total >= opts.minRam || ratio > .95)) {
        params.home.ratio = ratio;
        params.home.efficiency = efficiency;
        params.home.ramCost = structuredClone(ramCost);
        params.home.threads.h = tHack;
        params.home.threads.g = tGrow;
        params.home.threads.w = tWeaken;
        //cont = true;
      }
      tGrow = ns.formulas.hacking.growThreads(target, player, target.moneyMax);
      tWeaken = [
        Math.ceil(ns.hackAnalyzeSecurity(tHack) / weakenAmt.host),
        Math.ceil(ns.growthAnalyzeSecurity(tGrow) / weakenAmt.host)
      ];
      ramCost.w = [tWeaken[0] * weakenRam, tWeaken[1] * weakenRam];
      ramCost.g = tGrow * growRam;
      ramCost.total = tGrow * growRam + (tWeaken[0] + tWeaken[1]) * weakenRam + ramCost.host;
      efficiency = ratio / ramCost.total;
      cont &= ramCost.host <= opts.maxHostRam || ramCost.total <= opts.maxHostRam;
      if (efficiency >= params.host.efficiency &&
          (ramCost.total <= opts.maxHostRam || tHack == 1) &&
          (ramCost.total >= opts.minRam || ratio > .95)) {
        delete ramCost.home;
        delete ramCost.host;
        params.host.ratio = tHack * hackAmt;
        params.host.efficiency = efficiency;
        params.host.ramCost = ramCost;
        params.host.threads.h = tHack;
        params.host.threads.g = tGrow;
        params.host.threads.w = tWeaken;
        //cont = true;
      }
    }
    let hackExp = ns.formulas.hacking.hackExp(target, player);
    hackExp = hackExp * (hackChance + (1 - hackChance) * FailExpRatio);
    // FIXME: Params should be set to *something* after the loop is done, but that sometimes fails (WHY???)
    // So, need to guard against accessing properties on undefined
    if (params.host.efficiency > 0) {
      params.host.efficiency *= 1000 * target.moneyMax * hackChance / weakenTime;
      const totalThreads = params.host.threads.h + params.host.threads.w[0] + params.host.threads.w[1] + params.host.threads.g;
      params.host.expEfficiency = hackExp * totalThreads / (weakenTime * params.host.ramCost.total);
    
    }
    if (params.home.efficiency > 0) {
      params.home.efficiency *= 1000 * target.moneyMax * hackChance / weakenTime;
      const totalThreads = params.home.threads.h + params.home.threads.w[0] + params.home.threads.w[1] + params.home.threads.g;
      params.home.expEfficiency = hackExp * totalThreads / (weakenTime * params.home.ramCost.total);
    }
    hackParams[target.hostname] = params;
  }
  // JSON file is used only for debugging
  ns.write(HackParamsFile, JSON.stringify(hackParams), "w");
  ns.writePort(flags.p, hackParams);
}
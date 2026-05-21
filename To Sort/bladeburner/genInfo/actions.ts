import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {
  BladeburnerAutoLevelMap,
  BladeburnerActionEstimatedChanceMap,
  BladeburnerActionLevelMap,
  BladeburnerActionRepMap,
  BladeburnerActionSucessesMap,
  BladeburnerActionTimeMap,
  BladeburnerActionsRemainingMap,
  BladeburnerGetDir,
  mapBladeburnerActions
} from "bladeburner/util";

const GetDir = BladeburnerGetDir + "action/";

export interface BladeburnerActionInfo {
  autoLevel?: boolean,
  estimatedSuccessChance: [number, number],
  level?: number,
  maxLevel?: number,
  repGain: number,
  successes: number,
  time: number,
  countRemaining: number
}

export var bladeburnerActions: Record<BladeburnerActionName, BladeburnerActionInfo>;

/** Shim for ns.bladeburner.getNextBlackOp. Name changed to distinguish it. */
export function getNextBlackOpShim() {
  // Assumes Black Ops are in order, which happens to be true, but that's still not ideal.
  return Object.entries(bladeburnerActions).find(
    action => action[1].countRemaining == 1 && action[0].startsWith("Operation")
  ) as [BladeburnerBlackOpName, BladeburnerActionInfo];
}

export async function main(ns: NS) {
  const hostname = ns.self().server;

  var executorJob: ExecutorJob = {
    "script": GetDir + "autoLevel.ts",
    "hostname": hostname,
    "args": ["-a"],
    "threadOrOptions": {"temporary": true},
    "retry": true
  };
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const autoLevelMap = ns.readPort(Ports.Bladeburner) as BladeburnerAutoLevelMap;

  executorJob.script = GetDir + "countRemaining.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const countRemainingMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionsRemainingMap;

  executorJob.script = GetDir + "currentLevel.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const levelMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionLevelMap;

  executorJob.script = GetDir + "maxLevel.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const maxLevelMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionLevelMap;

  executorJob.script = GetDir + "repGain.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const repGainMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionRepMap;

  executorJob.script = GetDir + "estSuccessChance.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const estChanceMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionEstimatedChanceMap;

  executorJob.script = GetDir + "successes.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const successesMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionSucessesMap;

  executorJob.script = GetDir + "time.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const timeMap = ns.readPort(Ports.Bladeburner) as BladeburnerActionTimeMap;

  bladeburnerActions = Object.freeze(mapBladeburnerActions(
    ns,
    (typ, name) => ({
      "autoLevel": autoLevelMap[name],
      "countRemaining": countRemainingMap[name],
      "level": levelMap[name],
      "maxLevel": maxLevelMap[name],
      "repGain": repGainMap[name],
      "estimatedSuccessChance": estChanceMap[name],
      "successes": successesMap[name],
      "time": timeMap[name]
    } as BladeburnerActionInfo)
  ));
}
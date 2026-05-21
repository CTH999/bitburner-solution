export const BladeburnerGetDir = "/bladeburner/get/";

// Constants taken from game code
export const BladeburnerChaosThreshold = 50;
export const BladeburnerPopThreshold = 1e9;

function getTypeFromName(ns: NS, actionName: BladeburnerActionName): BladeburnerActionType {
  if (ns.bladeburner.getGeneralActionNames().includes(actionName as BladeburnerGeneralActionName)) return "General" as BladeburnerActionType;
  if (ns.bladeburner.getContractNames().includes(actionName as BladeburnerContractName)) return "Contracts" as BladeburnerActionType;
  if (ns.bladeburner.getOperationNames().includes(actionName as BladeburnerOperationName)) return "Operations" as BladeburnerActionType;
  if (ns.bladeburner.getBlackOpNames().includes(actionName as BladeburnerBlackOpName)) return "Black Operations" as BladeburnerActionType;
  throw new Error("\"${actionName}\" is not a valid BladeburnerActionName");
}

export function mapBladeburnerActions<mapReturn>(
  ns: NS, mapFunc: (actionType: BladeburnerActionType, actionName: BladeburnerActionName) => mapReturn
) {
  const entryMapper = (actionName: BladeburnerActionName) => [actionName, mapFunc(getTypeFromName(ns, actionName), actionName)];
  let entries: Array<Array<BladeburnerActionName | mapReturn>> = [];

  for (const nameGetter of [
    ns.bladeburner.getGeneralActionNames,
    ns.bladeburner.getContractNames,
    ns.bladeburner.getOperationNames,
    ns.bladeburner.getBlackOpNames
  ]) {
    try { entries = entries.concat(nameGetter().map(entryMapper)); }
    catch (e) {}
  }

  return Object.fromEntries(entries) as {[an in BladeburnerActionName]: mapReturn};
}

export type BladeburnerAutoLevelMap = ReturnType<typeof mapBladeburnerActions<boolean>>;
export type BladeburnerActionEstimatedChanceMap = ReturnType<typeof mapBladeburnerActions<[number, number]>>;
export type BladeburnerActionLevelMap = ReturnType<typeof mapBladeburnerActions<number>>;
export type BladeburnerActionRepMap = ReturnType<typeof mapBladeburnerActions<number>>;
export type BladeburnerActionsRemainingMap = ReturnType<typeof mapBladeburnerActions<number>>;
export type BladeburnerActionSucessesMap = ReturnType<typeof mapBladeburnerActions<number>>;
export type BladeburnerActionTimeMap = ReturnType<typeof mapBladeburnerActions<number>>;

export async function main(ns: NS) {
}
import {getEquipmentInfo} from "gang/genEquipmentInfo";

export interface ExtGangMemberInfo extends GangMemberInfo {
  ascensionResult?: GangMemberAscension
};

export var members: Array<ExtGangMemberInfo> = [];

export function allAugsOwned(ns: NS, combatants: Array<GangMemberInfo>, hackers?: Array<GangMemberInfo>, equipmentInfo?: any) {
  const priceComparator = (a: any, b: any) => equipmentInfo.cost[b] - equipmentInfo.cost[a];
  equipmentInfo ??= getEquipmentInfo(ns);
  const mostExpensiveCombatAug = equipmentInfo.augCombat.toSorted(priceComparator)[0];
  const mostExpensiveHackAug = hackers && equipmentInfo.augHack.toSorted(priceComparator)[0];
  return combatants.every(m => m.augmentations.includes(mostExpensiveCombatAug)) &&
    (!hackers || hackers.every(m => m.augmentations.includes(mostExpensiveHackAug)));
}

export async function main(ns: NS) {
  members = ns.gang.getMemberNames().map((m) => {
    let info = ns.gang.getMemberInformation(m) as ExtGangMemberInfo;
    info.ascensionResult = ns.gang.getAscensionResult(m);
    return info;
  });
}
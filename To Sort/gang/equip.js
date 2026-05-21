import {getGangInfo} from "./genGangInfo";
import {getEquipmentInfo} from "./genEquipmentInfo";
import {getMemberInfo} from "./genMemberInfo";
import {isCombatant, isHacker} from "./recruit";
import {GangModes, RespectTarget, getMode} from "./mode";

/** @param {NS} ns */
export async function main(ns) {
  const gangInfo = getGangInfo(ns);
  const equipment = getEquipmentInfo(ns);
  const members = getMemberInfo(ns);
  const hackers = gangInfo.isHacking ? members.filter(isHacker) : [];
  const combatants = gangInfo.isHacking ? members.filter(isCombatant) : members;

  function augNotOwned(eq) { return !(this.augmentations && this.augmentations.includes(eq)); }
  function eqNotOwned(eq) { return !(this.upgrades && this.upgrades.includes(eq)); }
  function costNegligible(eq) { return Math.log2(money) - Math.log2(equipment.cost[eq]) > 8; }

  var money = ns.getServerMoneyAvailable("home");

  function tryPurchase(eq) {
    if (ns.gang.purchaseEquipment(this.name, eq))
      money -= equipment.cost[eq];
  }

  if (gangInfo.respect < RespectTarget) {
    // Only buy with heavy discount unless we have Scrooge McDuck money
    equipment.augCombat = equipment.augCombat.filter(costNegligible);
    equipment.augHack = equipment.augHack.filter(costNegligible);
    equipment.eqCombat = equipment.eqCombat.filter(costNegligible);
    equipment.eqHack = equipment.eqHack.filter(costNegligible);
  }

  function equipDefault() {
    for (const m of hackers)
      equipment.augHack.filter(augNotOwned, m).forEach(tryPurchase, m);
    for (const m of combatants)
      equipment.augCombat.filter(augNotOwned, m).forEach(tryPurchase, m);
    for (const m of hackers)
      equipment.eqHack.filter(eqNotOwned, m).forEach(tryPurchase, m);
    for (const m of combatants)
      equipment.eqCombat.filter(eqNotOwned, m).forEach(tryPurchase, m);
  }

  function equipHack() {
    for (const m of hackers.concat(combatants)) {
      equipment.augHack.filter(augNotOwned, m).forEach(tryPurchase, m);
      equipment.eqHack.filter(eqNotOwned, m).forEach(tryPurchase, m);
    }
  }

  function equipCombat() {
    for (const m of combatants.concat(hackers)) {
      equipment.augCombat.filter(augNotOwned, m).forEach(tryPurchase, m);
      equipment.eqCombat.filter(eqNotOwned, m).forEach(tryPurchase, m);
    }
  }

  function equipClash() {
    for (const m of combatants) {
      equipment.augCombat.filter(augNotOwned, m).forEach(tryPurchase, m);
      equipment.eqCombat.filter(eqNotOwned, m).forEach(tryPurchase, m);
    }
    for (const m of hackers) {
      equipment.augHack.filter(augNotOwned, m).forEach(tryPurchase, m);
      equipment.eqHack.filter(eqNotOwned, m).forEach(tryPurchase, m);
    }
  }

  switch (getMode(ns)) {
    case GangModes.Amass:
      equipCombat();
      break;

    case GangModes.AmassAndRecruit:
    case GangModes.Clash:
      equipClash();
      break;

    case GangModes.EarnMoney:
    case GangModes.EarnRespect:
      if (gangInfo.isHacking)
        equipHack();
      else
        equipCombat();
      break;

    case GangModes.Default:
    default:
      equipDefault();
      break;
  }
}
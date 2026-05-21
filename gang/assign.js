import {getGangInfo} from "./genGangInfo";
import {getMemberInfo} from "./genMemberInfo";
import {getTaskInfo} from "./genTaskInfo";
import {MaxMembers, isCombatant, isHacker} from "./recruit";
import {GangModes, getMode} from "./mode";

const WantedPenaltyThreshold = 0.45;
const WantedLevelThreshold = 1e3;
const SafeClashChance = 0.1; // Max clash chance for hackers and weak combatants to risk engaging in territory warfare
const PrimaryStatMinBase = 10;
const PrimaryStatMinMultBase = 1.55;

function raisesRespect(task) { return task.baseRespect; }
function earnsMoney(task) { return task.baseMoney; }

/** @param {GangTaskStats} task
 * @param {GangMemberInfo} member
 */
function taskStatWeight(member, task) {
  // Task stats already incorporate stat multipliers for current gains, but
  // gains also grow faster when stats with higher mults gain more exp,
  // so we weight them again

  // We sum log(mults * difficulty) * statWeight for each stat to get the rate at which statWeight (in game code)
  // increases. After moving difficulty outside the log and factoring out constants, this is equivalent to
  // summing log(mults) * statWeight for each stat, then adding log(difficulty).
  return ["hack", "str", "def", "dex", "agi", "cha"].reduce((total, stat) => total + (
    Math.log2(member[stat + "_mult"] * member[stat + "_asc_mult"])
  ) * task[stat + "Weight"], 0) + Math.log2(task.difficulty);
}

/** @param {NS} ns */
export async function main(ns) {
  const gangInfo = getGangInfo(ns);
  const taskInfo = getTaskInfo(ns);
  const respectTasks = taskInfo.filter(raisesRespect);
  const moneyTasks = taskInfo.filter(earnsMoney);
  const members = getMemberInfo(ns);
  const hackers = gangInfo.isHacking ? members.filter(isHacker) : [];
  const combatants = gangInfo.isHacking ? members.filter(isCombatant) : members;
  const primaryStatMin = Math.ceil(PrimaryStatMinBase * Math.pow(PrimaryStatMinMultBase, members.length));

  /** Comes straight from game code, and is used as an exponent to scale money and rep gains */
  //const territoryPenalty = (0.2 * gangInfo.territory + 0.8) * currentNodeMults.GangSoftcap;

  function respectPerWanted(member, task) {
    return ns.formulas.gang.respectGain(gangInfo, member, task) /
           ns.formulas.gang.wantedLevelGain(gangInfo, member, task);
  }

  function moneyPerWanted(member, task) {
    return ns.formulas.gang.moneyGain(gangInfo, member, task) /
           ns.formulas.gang.wantedLevelGain(gangInfo, member, task);
  }

  // wantedPenalty is actually a multiplier, confusingly
  function wantedAboveThreshold() { return gangInfo.wantedPenalty < WantedPenaltyThreshold || gangInfo.wantedLevel > WantedLevelThreshold; }

  function hackerGetTrainingTask(m) {
    if (m["hack"] < primaryStatMin && m.hack_exp < m.cha_exp)
      return "Train Hacking";
    else if (m.cha < primaryStatMin)
      return "Train Charisma";
  }

  function combatantGetTrainingTask(m) {
    if (m.cha < primaryStatMin && m.cha_exp < m.hack_exp)
      return "Train Charisma";
    else if (m["hack"] < primaryStatMin && m.hack_exp < m.dex_exp)
      return "Train Hacking";
    else if (["str", "def", "dex", "agi"].some(stat => m[stat] < primaryStatMin))
      return "Train Combat";
  }

  function getRespectTask(m) {
    return respectTasks.filter(t => respectPerWanted(m, t) > 1).toSorted(
      (a, b) => ns.formulas.gang.respectGain(gangInfo, m, b) * taskStatWeight(m, b) -
                ns.formulas.gang.respectGain(gangInfo, m, a) * taskStatWeight(m, a)
    )[0].name
  }

  function getMoneyTask(m) {
    return moneyTasks.filter(t => moneyPerWanted(m, t) > 1).toSorted(
      (a, b) => ns.formulas.gang.moneyGain(gangInfo, m, b) * taskStatWeight(m, b) -
                ns.formulas.gang.moneyGain(gangInfo, m, a) * taskStatWeight(m, a)
    )[0].name
  }

  function getRespectOrMoneyTask(m) {
    return members.length < MaxMembers ? getRespectTask(m) : getMoneyTask(m);
  }

  function hackerAssignDefault(m) {
    ns.gang.setMemberTask(m.name, hackerGetTrainingTask(m) ?? wantedAboveThreshold() ? "Ethical Hacking" : getRespectOrMoneyTask(m));
  }

  function combatantAssignDefault(m) {
    let task = combatantGetTrainingTask(m);
    if (!task) {
      if (wantedAboveThreshold())
        task = "Vigilante Justice";
      else if (!gangInfo.isHacking)
        task = getRespectOrMoneyTask(m);
      // TODO: Finish assingment for combatants in hacker gangs
    }

    ns.gang.setMemberTask(m.name, task);
  }

  function assignDefault() {
    hackers.forEach(hackerAssignDefault);
    combatants.forEach(combatantAssignDefault);
  }

  function combatantAssignAmass(m) {
    ns.gang.setMemberTask(
      m.name,
      ((gangInfo.territoryClashChance > SafeClashChance && m.def < primaryStatMin) && combatantGetTrainingTask(m)) ||
      "Territory Warfare"
    );
  }

  function assignAmass() {
    if (gangInfo.territoryClashChance > SafeClashChance) {
      combatants.forEach(combatantAssignAmass);
      hackers.forEach(hackerAssignDefault);
    }
    else
      members.forEach(combatantAssignAmass);
  }

  function assignClash() {
    combatants.forEach(combatantAssignAmass);
    hackers.forEach(hackerAssignDefault);
  }

  function assignEarn(focusRespect) {
    const getTrainingTask = gangInfo.isHacking ? hackerGetTrainingTask : combatantGetTrainingTask;
    const justiceTask = gangInfo.isHacking ? "Ethical Hacking" : "Vigilante Justice";
    const getEarnTask = focusRespect ? getRespectTask : getMoneyTask;
    const assignMemberEarn = (m) => { ns.gang.setMemberTask(
      m.name, getTrainingTask(m) ?? (wantedAboveThreshold() ? justiceTask : getEarnTask(m))
    ); };
    members.forEach(assignMemberEarn);
  }

  switch (getMode(ns)) {
    case GangModes.Amass:
      assignAmass();
      break;

    case GangModes.Clash:
      assignClash();
      break;

    case GangModes.EarnMoney:
      assignEarn(false);
      break;

    case GangModes.EarnRespect:
      assignEarn(true);
      break;

    case GangModes.Default:
    default:
      assignDefault();
      break;
  }
}
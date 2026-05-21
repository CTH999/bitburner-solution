import {Ports} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";
import {ExecutorJob} from "daemons/executor";
import {bladeburnerPlayer} from "bladeburner/genInfo/player";
import {bladeburnerActions, getNextBlackOpShim} from "bladeburner/genInfo/actions";

const SuccessFactorBase = 1;
const EffectiveSkillFactor = 0.8;

/** Affects the valuation of Blade's Intuition. */
const Factor1 = SuccessFactorBase * 16;

/** Affects the valuation of Reaper. */
const Factor6 = EffectiveSkillFactor;

/** Affects the valuation of Hands of Midas. */
const Factor19 = 1e3;

/** Affects the valuation of Digital Observer */
const Factor24 = SuccessFactorBase * 16;

/** Affects the valuation of Short-Circuit. */
const Factor25 = SuccessFactorBase * 2;

/** Affects the valuation of Evasive System. */
const Factor33 = EffectiveSkillFactor;

/** Affects the valuation of Cyber's Edge. */
const Factor37 = 5e5;

/** Affects the valuation of Datamancer. */
const Factor53 = 16;

/** Affects the valuation of Tracer. */
const Factor56 = SuccessFactorBase;

/** Affects the valuation of Overclock. */
const Factor60 = 1;

/** Affects the valuation of Cloak. */
const Factor66 = SuccessFactorBase;

/** Affects the valuation of Hyperdrive. */
const Factor69 = 1e4;

/** Affects the valuation of Cyber's Edge, Reaper, Evasive System, and Overclock. */
const TargetStamina = 1e3;

const MaxOverclockLevel = 90;

/** Based on game code. Skills contribute to success sub-linearly. */
const EstimatedDecay = 0.8;

const BladesIntuitionMult = 0.03;
const CloakMult = 0.055;
const ShortCircuitMult = 0.055;
const DigitalObserverMult = 0.04;
const TracerMult = 0.04;
const ReaperMult = 0.02;
const EvasiveSystemMult = 0.04;
const HandsOfMidasMult = 0.1;
const HyperdriveMult = 0.1;

const MinTimeSinceInstall = 600e3;

const StealthContracts = new Set(["Tracking" as BladeburnerContractName]);

// Sting is intentionally omitted
const StealthOperations = new Set([
  "Investigation",
  "Undercover Operation",
  "Stealth Retirement Operation",
  "Assassination",
] as Array<BladeburnerOperationName>);

const StealthBlackOps = new Set([
  "Operation Zero",
  "Operation Shoulder of Orion",
  "Operation Morpheus",
] as Array<BladeburnerBlackOpName>);

const StealthActions = StealthContracts.union(StealthOperations).union(StealthBlackOps) as Set<BladeburnerActionName>;

const KillContracts = new Set(["Retirement", "Bounty Hunter"] as Array<BladeburnerContractName>);

const KillOperations = new Set(
  ["Raid", "Stealth Retirement Operation", "Assassination"] as Array<BladeburnerOperationName>
);

const KillBlackOps = new Set([
  "Operation Typhoon",
  "Operation X",
  "Operation Titan",
  "Operation Ares",
  "Operation Archangel",
  "Operation Juggernaut",
  "Operation Red Dragon",
  "Operation K",
  "Operation Deckard",
  "Operation Tyrell",
  "Operation Wallace",
  "Operation Hyron",
  "Operation Ion Storm",
  "Operation Annihilus",
  "Operation Ultron",
] as Array<BladeburnerBlackOpName>);

const KillActions = KillContracts.union(KillOperations).union(KillBlackOps) as Set<BladeburnerActionName>;

type SkillAppraiser = () => number;

/** Not *known* to not be guaranteed, anyway. */
function successNotGuaranteed(action: BladeburnerActionName) {
  // First disjunct ensures that impossible actions (i.e., Raid with 0 communities) don't count
  return bladeburnerActions[action].estimatedSuccessChance[1] &&
         bladeburnerActions[action].estimatedSuccessChance[1] < 1;
}

export async function main(ns: NS) {
  /** Maxim 1: A Sergeant in motion outranks a Lieutenant who doesn't know what's going on. */
  function appraiseBladesIntuition() {
    // To keep the calculation relatively simple, we consider only the next Black Operation,
    // and use a high Factor1 to account for general utility and particular importance in the final trio of
    // Black Operations.
    if (!nextBlackOp || nextBlackOp[1].estimatedSuccessChance[1] == 1) return 0;

    let val = 1 + bladeburnerPlayer.bladeburner.skills["Digital Observer"].level * DigitalObserverMult;
    if (nextBlackOp && nextBlackOp[1].estimatedSuccessChance[1] < 1) {
      if (StealthBlackOps.has(nextBlackOp[0]))
        val *= 1 + (bladeburnerPlayer.bladeburner.skills.Cloak.level * CloakMult);
      else if (KillBlackOps.has(nextBlackOp[0]))
        val *= 1 + (bladeburnerPlayer.bladeburner.skills["Short-Circuit"].level * ShortCircuitMult);
    }
    return val * Factor1 / bladeburnerPlayer.bladeburner.skills["Blade's Intuition"].cost;
  }

  // FIXME: Cloak and Short-Circuit appraisers need to account for operations that are both stealth and kill
  /** Maxim 66: Necessity is the mother of deception. */
  function appraiseCloak() {
    const doMult = 1 + bladeburnerPlayer.bladeburner.skills["Digital Observer"].level * DigitalObserverMult;
    let val = 0;
    if (bladeburnerActions.Tracking.estimatedSuccessChance[1] < 1)
      val = 1 + bladeburnerPlayer.bladeburner.skills.Tracer.level * TracerMult;
    val += Array.from(StealthOperations.values()).filter(successNotGuaranteed).length * doMult;
    if (nextBlackOp && nextBlackOp[1].estimatedSuccessChance[1] < 1 && StealthBlackOps.has(nextBlackOp[0]))
      val += doMult;
    if (!val)
      return 0;
    val *= 1 + bladeburnerPlayer.bladeburner.skills["Blade's Intuition"].level;
    return val * Factor66 / bladeburnerPlayer.bladeburner.skills.Cloak.cost;
  }

  /** Maxim 25: If a manufacturer's warranty covers the damage you do, you didn't do enough damage. */
  function appraiseShortCircuit() {
    const doMult = 1 + bladeburnerPlayer.bladeburner.skills["Digital Observer"].level * DigitalObserverMult;
    let val = Array.from(KillContracts.values()).filter(successNotGuaranteed).length *
      (1 + bladeburnerPlayer.bladeburner.skills.Tracer.level * TracerMult);
    val += Array.from(KillOperations.values()).filter(successNotGuaranteed).length * doMult;
    if (nextBlackOp && nextBlackOp[1].estimatedSuccessChance[1] < 1 && KillBlackOps.has(nextBlackOp[0]))
      val += doMult;
    if (!val)
      return 0;
    val *= 1 + bladeburnerPlayer.bladeburner.skills["Blade's Intuition"].level;
    return val * Factor25 / bladeburnerPlayer.bladeburner.skills["Short-Circuit"].cost;
  }

  /** Maxim 24: Any sufficiently advanced technology is indistinguishable from a big gun. */
  function appraiseDigitalObserver() {
    // To keep the calculation relatively simple, we consider only the next Black Operation,
    // and use a high Factor24 to account for general utility and particular importance in the final trio of
    // Black Operations.
    if (!nextBlackOp || nextBlackOp[1].estimatedSuccessChance[1] == 1) return 0;

    let val = 1 + bladeburnerPlayer.bladeburner.skills["Blade's Intuition"].level * BladesIntuitionMult;
    if (StealthBlackOps.has(nextBlackOp[0]))
      val *= 1 + (bladeburnerPlayer.bladeburner.skills.Cloak.level * CloakMult);
    else if (KillBlackOps.has(nextBlackOp[0]))
      val *= 1 + (bladeburnerPlayer.bladeburner.skills["Short-Circuit"].level * ShortCircuitMult);
    return val * Factor24 / bladeburnerPlayer.bladeburner.skills["Digital Observer"].cost;
  }

  /** Maxim 56: Infantry exists to paint targets for people with real guns.  */
  function appraiseTracer() {
    let val = 0;
    if (bladeburnerActions.Tracking.estimatedSuccessChance[1] < 1)
      val = 1 + bladeburnerPlayer.bladeburner.skills.Cloak.level * CloakMult;
    val += Array.from(KillContracts.values()).filter(successNotGuaranteed).length *
      (1 + bladeburnerPlayer.bladeburner.skills["Short-Circuit"].level * ShortCircuitMult);
    if (!val) // If contracts all have max 100% estimated success chance
      return 0;
    val *= 1 + bladeburnerPlayer.bladeburner.skills["Blade's Intuition"].level * BladesIntuitionMult;
    return val * Factor56 / bladeburnerPlayer.bladeburner.skills.Tracer.cost;
  }

  /** Maxim 60: Any weapon's rate of fire is inversely proportional to the number of available targets. */
  function appraiseOverclock() {
    const level = bladeburnerPlayer.bladeburner.skills.Overclock.level;
    if (level == MaxOverclockLevel)
      return 0;

    const relevantActions = Object.values(bladeburnerActions).filter(a => a.successes > 2 && a.countRemaining > 10);
    const timeReduction = relevantActions.reduce((sum, a) => a.time, 0) * 1 / (100 - level);
    return Factor60 * timeReduction * bladeburnerPlayer.bladeburner.stamina[1] * (
      1 +
      Math.log2(1 + HandsOfMidasMult * bladeburnerPlayer.bladeburner.skills["Hands of Midas"].level) +
      Math.log2(1 + HyperdriveMult * bladeburnerPlayer.bladeburner.skills["Hyperdrive"].level)
    ) / (TargetStamina * bladeburnerPlayer.bladeburner.skills.Overclock.cost);
  }

  // TODO: Account for stamina in appraisals of Reaper and Evasive System
  /** Maxim 6: If violence wasn’t your last resort, you failed to resort to enough of it. */
  function appraiseReaper() {
    let val = 0;
    const mult = 1 + (EvasiveSystemMult * bladeburnerPlayer.bladeburner.skills["Evasive System"].level);
    let adjustedSkills = structuredClone(bladeburnerPlayer.skills);
    adjustedSkills.agility *= mult;
    adjustedSkills.dexterity *= mult;
    if (nextBlackOp && nextBlackOp[1].estimatedSuccessChance[1] < 1)
      val = (["strength", "defense", "dexterity", "agility"] as Array<keyof Skills>).reduce((sum, stat) => {
        return sum +
        Math.pow(adjustedSkills[stat] * (1 + ReaperMult), EstimatedDecay) -
        Math.pow(adjustedSkills[stat], EstimatedDecay);
      }, 0);
    return val * Factor6 / bladeburnerPlayer.bladeburner.skills.Reaper.cost;
  }

  /** Maxim 33: If you're leaving tracks, you're being followed. */
  function appraiseEvasiveSystem() {
    let val = 0;
    const mult = 1 + (ReaperMult * bladeburnerPlayer.bladeburner.skills.Reaper.level);
    let adjustedSkills = structuredClone(bladeburnerPlayer.skills);
    if (nextBlackOp && nextBlackOp[1].estimatedSuccessChance[1] < 1)
      val = (["dexterity", "agility"] as Array<keyof Skills>).reduce((sum, stat) => {
        adjustedSkills[stat] *= mult;
        return sum +
        Math.pow(adjustedSkills[stat] * (1 + EvasiveSystemMult), EstimatedDecay) -
        Math.pow(adjustedSkills[stat], EstimatedDecay);
      }, 0);
    return val * Factor33 / bladeburnerPlayer.bladeburner.skills["Evasive System"].cost;
  }

  /** Maxim 53: The intel you've got is never the intel you want. */
  function appraiseDatamancer() {
    return Factor53 * bladeburnerPlayer.mults.bladeburner_analysis / (
      Math.pow(1 + bladeburnerPlayer.bladeburner.skills.Datamancer.level, 0.5) * 
      bladeburnerPlayer.bladeburner.skills.Datamancer.cost
    );
  }

  /** Maxim 37: There is no 'overkill.' There is only 'open fire' and 'reload.' */
  function appraiseCybersEdge() {
    if (bladeburnerPlayer.bladeburner.stamina[1] > TargetStamina)
      return 0;
    return Factor37 / (
      Math.abs((TargetStamina >>> 1) - bladeburnerPlayer.bladeburner.stamina[1]) *
      (100 - bladeburnerPlayer.bladeburner.skills.Overclock.level) *
      bladeburnerPlayer.mults.bladeburner_stamina_gain *
      bladeburnerPlayer.bladeburner.skills["Cyber's Edge"].cost
    );
  }

  /** Maxim 19: The world is richer when you turn enemies into friends, but that's not the same as you being richer. */
  function appraiseHandsofMidas() {
    return Factor19 / (
      Math.log2(bladeburnerPlayer.money) *
      (100 - bladeburnerPlayer.bladeburner.skills.Overclock.level) *
      bladeburnerPlayer.bladeburner.skills["Hands of Midas"].cost
    );
  }

  /** Maxim 69: Sometimes rank is a function of firepower. */
  function appraiseHyperdrive() {
    return Factor69 / (
      (1 + Math.log2(1 + bladeburnerPlayer.bladeburner.skills.Hyperdrive.level)) *
      (100 - bladeburnerPlayer.bladeburner.skills.Overclock.level) *
      bladeburnerPlayer.bladeburner.skills.Hyperdrive.cost
    );
  }

  // If there's a stamina penalty or there hasn't been much time since install to accumulate exp,
  // calculations are liable to be thrown off, so we hold off on spending skill points
  if (bladeburnerPlayer.bladeburner.stamina[0] * 2 < bladeburnerPlayer.bladeburner.stamina[1]) {
    ns.print("WARN: Stamina too low to evaluate skills.");
    return;
  }

  if (Date.now() - extResetInfo.lastAugReset < MinTimeSinceInstall) {
    ns.print("INFO: Postponing skill buy.");
    return;
  }

  const nextBlackOp = getNextBlackOpShim();
  if (nextBlackOp)
    ns.print("INFO: Next Black Op is ", nextBlackOp[0]);
  else
    ns.print("SUCCESS: All Black Ops completed!");
  const appraisals = (
    ns.bladeburner.getSkillNames()
    .map(skill => [skill, (eval("appraise" + skill.replaceAll(/\W/g, "")) as SkillAppraiser)()]) as Array<[BladeburnerSkillName, number]>
  ).sort((a, b) => b[1] - a[1]);
  ns.print("INFO: Skill valuations: " + JSON.stringify(appraisals));
  if (bladeburnerPlayer.bladeburner.skillPoints >= bladeburnerPlayer.bladeburner.skills[appraisals[0][0]].cost) {
    ns.print("Buying a level of ", appraisals[0][0]);
    ns.writePort(Ports.Exec, {
      "script": "/bladeburner/upgradeSkill.ts",
      "hostname": ns.self().server,
      "args": [appraisals[0][0]],
      "threadOrOptions": {"temporary": true},
      "retry": true
    } as ExecutorJob)
  }
}
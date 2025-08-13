export async function main(ns: NS) {
  ns.bladeburner.upgradeSkill(ns.args[0] as BladeburnerSkillName);
}
import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getCost = ns.bladeburner.getSkillUpgradeCost;
  ns.writePort(Ports.Bladeburner, flags.a ?
    Object.fromEntries(ns.bladeburner.getSkillNames().map(s => [s, getCost(s)])):
    getCost(ns.args[0] as BladeburnerSkillName)
  );
}
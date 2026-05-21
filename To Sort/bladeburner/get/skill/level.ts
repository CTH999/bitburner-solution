import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getLevel = ns.bladeburner.getSkillLevel;
  ns.writePort(Ports.Bladeburner, flags.a ?
    Object.fromEntries(ns.bladeburner.getSkillNames().map(s => [s, getLevel(s)])):
    getLevel(ns.args[0] as BladeburnerSkillName)
  );
}
import {Ports} from "lib/util";
import {mapBladeburnerActions} from "bladeburner/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getMaxLevel = ns.bladeburner.getActionMaxLevel;
  ns.writePort(Ports.Bladeburner, flags.a ?
    mapBladeburnerActions(ns, getMaxLevel):
    getMaxLevel(ns.args[0] as BladeburnerActionType, ns.args[1] as BladeburnerActionName)
  );
}
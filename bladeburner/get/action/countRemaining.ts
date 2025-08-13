import {Ports} from "lib/util";
import {mapBladeburnerActions} from "bladeburner/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getCountRemaining = ns.bladeburner.getActionCountRemaining;
  ns.writePort(Ports.Bladeburner, flags.a ?
    mapBladeburnerActions(ns, getCountRemaining) :
    getCountRemaining(ns.args[0] as BladeburnerActionType, ns.args[1] as BladeburnerActionName)
  );
}
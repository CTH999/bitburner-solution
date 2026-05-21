import {Ports} from "lib/util";
import {mapBladeburnerActions} from "bladeburner/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getSuccesses = ns.bladeburner.getActionSuccesses;
  ns.writePort(Ports.Bladeburner, flags.a ?
    mapBladeburnerActions(ns, getSuccesses):
    getSuccesses(ns.args[0] as BladeburnerActionType, ns.args[1] as BladeburnerActionName)
  );
}
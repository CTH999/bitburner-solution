import {Ports} from "lib/util";
import {mapBladeburnerActions} from "bladeburner/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false], ["s", -1]]);
  const args = flags._ as [BladeburnerActionType, BladeburnerActionName];
  const getEstimate = flags.s == -1 ?
    ns.bladeburner.getActionEstimatedSuccessChance :
    (actionType: BladeburnerActionType, actionName: BladeburnerActionName) =>
    ns.bladeburner.getActionEstimatedSuccessChance(actionType, actionName, flags.s as number);
  ns.writePort(Ports.Bladeburner, flags.a ?
    mapBladeburnerActions(ns, getEstimate):
    getEstimate(args[0], args[1])
  );
}
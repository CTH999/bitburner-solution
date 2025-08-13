import {Ports} from "lib/util";

export async function main(ns: NS) {
  ns.writePort(Ports.Bladeburner, ns.bladeburner.getBlackOpRank(ns.args[0] as BladeburnerBlackOpName));
}
import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  ns.writePort(Ports.Sleeve, ns.sleeve.getSleeveAugmentationPrice(ns.args[0]));
}
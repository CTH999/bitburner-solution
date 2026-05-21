import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["n", 0]])
  ns.writePort(Ports.Sleeve, ns.sleeve.getSleeveAugmentations(flags.n));
}
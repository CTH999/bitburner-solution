import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  // TODO: Re-implement
  ns.writePort(Ports.Go, ns.go.analysis.getLiberties());
}
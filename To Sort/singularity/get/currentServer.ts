import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["p", Ports.Singularity]]);
  ns.writePort(flags.p as number, ns.singularity.getCurrentServer());
}
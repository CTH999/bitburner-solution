import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["p", 0]]);
  ns.writePort(flags.p as number, (flags._ as Array<string>).map(ns.singularity.getFactionFavor));
}
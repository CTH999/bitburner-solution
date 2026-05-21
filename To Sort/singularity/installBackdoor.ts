import {Ports} from "lib/util";

export async function main(ns: NS) {
  const port = ns.flags([["p", Ports.Singularity]]).p as number;
  try {
    await ns.singularity.installBackdoor();
    ns.writePort(port, true);
  }
  catch (e) { ns.writePort(port, false); }
}
import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["p", Ports.Singularity], ["a", false]]);
  ns.writePort(flags.p as number, flags.a ?
    Object.values(ns.enums.FactionName).map(ns.singularity.getFactionEnemies) :
    ns.singularity.getFactionEnemies((flags._ as Array<string>)[0])
  );
}
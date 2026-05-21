import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getEstPop = ns.bladeburner.getCityEstimatedPopulation;
  ns.writePort(Ports.Bladeburner, flags.a ?
    Object.fromEntries(Object.values(ns.enums.CityName).map(c => [c, getEstPop(c)])) :
    getEstPop(ns.args[0] as CityName)
  );
}
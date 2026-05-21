import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["a", false]]);
  const getComms = ns.bladeburner.getCityCommunities;
  ns.writePort(Ports.Bladeburner, flags.a ?
    Object.fromEntries(Object.values(ns.enums.CityName).map(c => [c, getComms(c)])) :
    getComms(ns.args[0] as CityName)
  );
}
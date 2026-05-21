import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {BladeburnerGetDir} from "bladeburner/util";

const GetDir = BladeburnerGetDir + "city/";

export type BladeburnerCity = {
  estimatedPopulation: ReturnType<NS["bladeburner"]["getCityEstimatedPopulation"]>
  communities: ReturnType<NS["bladeburner"]["getCityCommunities"]>
  chaos: ReturnType<NS["bladeburner"]["getCityChaos"]>
};

export var bladeburnerCities: Record<CityName, BladeburnerCity>;

export async function main(ns: NS) {
  const hostname = ns.self().server;

  var executorJob: ExecutorJob = {
    "script": GetDir + "chaos.ts",
    "hostname": hostname,
    "args": ["-a"],
    "threadOrOptions": {"temporary": true},
    "retry": true
  };
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const chaos = ns.readPort(Ports.Bladeburner) as Record<CityName, number>;

  executorJob.script = GetDir + "communities.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const communities = ns.readPort(Ports.Bladeburner) as Record<CityName, number>;

  executorJob.script = GetDir + "estPop.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const estPop = ns.readPort(Ports.Bladeburner) as Record<CityName, number>;

  bladeburnerCities = Object.freeze(Object.fromEntries(Object.values(ns.enums.CityName).map(c => [c, {
    "chaos": chaos[c],
    "communities": communities[c],
    "estimatedPopulation": estPop[c]
  } as BladeburnerCity])) as typeof bladeburnerCities);
}
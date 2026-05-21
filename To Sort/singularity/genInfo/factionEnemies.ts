import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

export var factionEnemies: Map<FactionName, Array<FactionName>>;

export async function main(ns: NS) {
  const factions = Object.values(ns.enums.FactionName);
  ns.writePort(Ports.Exec, {
    script: "/singularity/get/faction/enemies.ts",
    hostname: ns.self().server,
    args: ["-a"],
    threadOrOptions: {temporary: true},
    retry: true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Singularity);
  var enemies: Array<Array<FactionName>> = ns.readPort(Ports.Singularity);
  factionEnemies = new Map<FactionName, Array<FactionName>>();
  for (let i = 0; i < factions.length; ++i)
    if (enemies[i].length)
      factionEnemies.set(factions[i], enemies[i]);
}
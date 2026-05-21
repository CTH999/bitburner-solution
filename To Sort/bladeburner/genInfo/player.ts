import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {BladeburnerGetDir as GetDir} from "bladeburner/util";

/** Bladeburner skill info */
export interface BladeburnerSkill {
  /** Current skill level */
  level: ReturnType<NS["bladeburner"]["getSkillLevel"]>,

  /** Point cost of upgrading */
  cost: ReturnType<NS["bladeburner"]["getSkillUpgradeCost"]>
}

export type BladeburnerSkills = Record<BladeburnerSkillName, BladeburnerSkill>;

/** Extends the Player interface with player info for Bladeburner */
export interface BladeburnerPlayer extends Player {bladeburner: {
  city: ReturnType<NS["bladeburner"]["getCity"]>,
  rank: ReturnType<NS["bladeburner"]["getRank"]>,
  skills: BladeburnerSkills,
  skillPoints: ReturnType<NS["bladeburner"]["getSkillPoints"]>,

  /** Current stamina, max stamina */
  stamina: ReturnType<NS["bladeburner"]["getStamina"]>,
  teamSize: ReturnType<NS["bladeburner"]["getTeamSize"]>
}}

export var bladeburnerPlayer: BladeburnerPlayer;

export function getBladeburnerEffectiveSkills(player: BladeburnerPlayer) {
  var skills = structuredClone(player.skills);
  const reaperMult = 1 + (0.02 * player.bladeburner.skills[BladeburnerSkillName.Reaper].level);
  const evasiveSysMult = 1 + (0.04 * player.bladeburner.skills[BladeburnerSkillName.EvasiveSystem].level);

  for (const s of ["dexterity", "agility"] as Array<keyof Skills>)
    skills[s] *= evasiveSysMult;
  for (const s of ["strength", "defense", "dexterity", "agility"] as Array<keyof Skills>) {
    skills[s] *= reaperMult;
    skills[s] = Math.floor(skills[s]);
  }
  return skills;
}

export async function main(ns: NS) {
  const hostname = ns.self().server;
  var player = ns.getPlayer() as BladeburnerPlayer;

  var executorJob: ExecutorJob = {
    "script": GetDir + "skill/points.ts",
    "hostname": hostname,
    "threadOrOptions": {"temporary": true},
    "retry": true
  };
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const points = ns.readPort(Ports.Bladeburner) as BladeburnerPlayer["bladeburner"]["skillPoints"];

  executorJob.script = GetDir + "city/current.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const city = ns.readPort(Ports.Bladeburner) as BladeburnerPlayer["bladeburner"]["city"];

  executorJob.script = GetDir + "rank.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const rank = ns.readPort(Ports.Bladeburner) as BladeburnerPlayer["bladeburner"]["rank"];

  executorJob.script = GetDir + "teamSize.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const teamSize = ns.readPort(Ports.Bladeburner) as BladeburnerPlayer["bladeburner"]["teamSize"];

  executorJob.script = GetDir + "stamina.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const stamina = ns.readPort(Ports.Bladeburner) as BladeburnerPlayer["bladeburner"]["stamina"];

  executorJob.script = GetDir + "skill/level.ts";
  executorJob.args = ["-a"];
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const levels = ns.readPort(Ports.Bladeburner) as Record<BladeburnerSkillName, BladeburnerSkill["level"]>;

  executorJob.script = GetDir + "skill/upgradeCost.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Bladeburner);
  const costs = ns.readPort(Ports.Bladeburner) as Record<BladeburnerSkillName, BladeburnerSkill["cost"]>;

  const skills = Object.fromEntries(ns.bladeburner.getSkillNames().map(s => [s, ({"level": levels[s], "cost": costs[s]} as BladeburnerSkill)])) as BladeburnerSkills;

  player.bladeburner = {
    "city": city,
    "rank": rank,
    "skills": skills,
    "skillPoints": points,
    "stamina": stamina,
    "teamSize": teamSize
  };
  bladeburnerPlayer = player;
}
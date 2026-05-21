import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {gangInfo} from "gang/genInfo/gang";
import {members} from "gang/genInfo/members";

export const MemberNames = {
  "Hack": new Set(["Shades", "TOMCAT", "Optics", "Tattletale", "Saint", "Pilar", "Nomi", "Kiwi", "Lucyna", "Makishima", "Zed", "Rad Ray"]),
  "Combat": new Set(["Neo", "Trinity", "Bakuda", "Maine", "Falco", "Dorio", "David", "Rebecca", "Laserhawk", "Denton", "Jensen", "Kogami"])
};
export const MaxMembers = 12;

export function isHacker(m: string | GangMemberInfo) {
  return MemberNames.Hack.has(m as string) || MemberNames.Hack.has((m as GangMemberInfo).name);
}

export function isCombatant(m: string | GangMemberInfo) {
  return MemberNames.Combat.has(m as string) || MemberNames.Combat.has((m as GangMemberInfo).name);
}

export async function main(ns: NS) {
  var executorJob = {
    "script": "/gang/canRecruitMember.ts",
    "hostname": ns.self().server,
    "threadOrOptions": {"temporary": true, "preventDuplicates": true},
    "retry": true
  } as ExecutorJob;
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Gang);
  if (ns.readPort(Ports.Gang)) {
    const memberNames = members.map((m: GangMemberInfo) => m.name);
    const hackers = new Set(memberNames.filter(isHacker));
    const combatants = new Set(memberNames.filter(isCombatant));
    const candidates = Array.from<string>((
      !gangInfo.isHacking || combatants.size < hackers.size ?
      MemberNames.Combat.difference(combatants) :
      MemberNames.Hack.difference(hackers)).values()
    );
    const recruit = candidates[Math.floor(Math.random() * (candidates.length - .001))];
    executorJob.script = "/gang/recruitMember.ts";
    executorJob.args = [recruit];
    ns.print("Recruiting ", recruit);
    ns.writePort(Ports.Exec, executorJob);
  }
}
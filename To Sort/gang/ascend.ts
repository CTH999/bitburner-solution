import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {gangInfo} from "gang/genInfo/gang";
import {ExtGangMemberInfo, members} from "gang/genInfo/members";
import {isHacker} from "gang/recruit";

// From game code
const ExpMultFactor = 0.25;

export async function main(ns: NS) {
  function isCandidate(m: ExtGangMemberInfo) {
    const res = m.ascensionResult;
    let gains = m.expGain;
    if (!(res && gains) || (res.respect * 2) > gangInfo.respect)
      return false;

    for (const stat of ["hack", "str", "def", "dex", "agi", "cha"]) {
      // Factor out the exp mult from equipment
      const expKey = (stat + "_exp") as keyof GangMemberExpGain;
      // mult is actually equipment mult only, so no need to factor out ascenscion mult
      const mult = m[(stat + "_mult") as keyof ExtGangMemberInfo] as number;
      m[expKey] /= (1 + (mult - 1) * ExpMultFactor);
    }

    if (m.task.includes("Train")) {
      // It's most efficient to train all relevant stats in each ascension
      // So, fudge training exp to prevent premature ascension
      if (isHacker(m))
        gains.cha_exp = gains.hack_exp = gains.cha_exp || gains.hack_exp;
      else
        gains.cha_exp = gains.hack_exp = gains.dex_exp = gains.cha_exp || gains.hack_exp || gains.dex_exp;
    }

    return Object.entries(res).every(([stat, ascMult]) => {
      if (stat == "respect")
        return true;

      const gain = gains[(stat + "_exp") as keyof GangMemberExpGain];
      const exp = (m[(stat + "_exp") as keyof ExtGangMemberInfo] ?? 0) as number;
      return !gain || ascMult * exp > exp + 1000;
    });
  };

  const candidate = members.find(isCandidate);

  if (candidate)
    ns.writePort(Ports.Exec, {
      "script": "/gang/ascendMember.ts",
      "hostname": ns.self().server,
      "args": [candidate.name],
      "threadOrOptions": {"temporary": true},
      "retry": true
    } as ExecutorJob);
}
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {gangInfo} from "gang/genInfo/gang";
import {others, powerChanged} from "gang/genInfo/otherGangs";
import {members, allAugsOwned} from "gang/genInfo/members";
import {MaxMembers} from "gang/recruit";

export enum GangMode {
  Default,
  Amass,
  Clash,
  EarnMoney,
  EarnRespect,
  AugPrep
};

export var gangMode = GangMode.Default;

export const RepTarget = 2.5e6;
export const RespectTarget = 7.5e6; // Tuned to achieve a high discount whithout going too far into diminishing returns
export const MoneyTarget = 1e12;

const MinWinChance = .58;
const TargetWinChance = .96;

// Taken from game code
const MillisPerCycle = 2000;
const MillisPerBonusTimeCycle = 5000;
const CyclesPerPowerUpdate = 10;
const MillisPerPowerUpdate = MillisPerCycle * CyclesPerPowerUpdate;

var millisSincePowerUpdate = 0;

export function addTime(ns: NS, millis: number) {
  millisSincePowerUpdate += millis;
}

export async function main(ns: NS) {
  if (powerChanged || gangInfo.territory == 1)
    millisSincePowerUpdate = 0;
  const powerUpdateComing = millisSincePowerUpdate + (ns.gang.getBonusTime() ? MillisPerBonusTimeCycle : MillisPerCycle) >= MillisPerPowerUpdate;
  var engage = false;
  var winChance = 0;

  function setPeaceMode() {
    // FIXME: Currently, this assumes combat gang
    gangMode = members.length == MaxMembers && (
      (allAugsOwned(ns, members, undefined) && ns.getServerMoneyAvailable("home") < MoneyTarget) ||
      gangInfo.respect >= RespectTarget
    ) ? GangMode.EarnMoney : GangMode.EarnRespect;
  }

  if (gangInfo.territory < 1) {
    winChance = others.map((og) => {
      return gangInfo.power > og.power ? 1 - .5 * (og.power / gangInfo.power) : .5 * (gangInfo.power / og.power);
    }).reduce((sum, p) => { return sum + p; }, 0) / others.length;
    engage = winChance > MinWinChance;

    ns.writePort(Ports.Exec, {
      "script": "/gang/set/territoryWarfare.ts",
      "hostname": ns.self().server,
      "args": [engage],
      "threadOrOptions": {"temporary": true},
      "retry": true
    } as ExecutorJob);
  }

  if (powerUpdateComing) {
    if (engage) {
      if (winChance < TargetWinChance)
        gangMode = GangMode.Clash;
      else
        setPeaceMode();
    }
    else
      gangMode = GangMode.Amass;
  }
  else
    setPeaceMode();

  ns.print("INFO: Mode is set to ", gangMode);
}
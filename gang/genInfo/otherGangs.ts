import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {gangInfo} from "gang/genInfo/gang";

export var others: Array<GangOtherInfoObject> = [];
export var powerChanged = false;

export async function main(ns: NS) {
  const prev = others;

  ns.writePort(Ports.Exec, {
    "script": "gang/get/otherGangInfo.ts",
    "hostname": ns.self().server,
    "threadOrOptions": {"temporary": true},
    "retry": true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Gang);
  // getOtherGangInformation for some reason includes our own gang, so have to filter it out
  others = Object.values(ns.readPort(Ports.Gang) as Array<GangOtherInfoObject>).filter(
    og => og.territory && og.territory != gangInfo.territory && og.power != gangInfo.power
  );
  // FIXME: Is it really safe to assume order won't change?
  powerChanged = !!prev.length && others.some((og, i) => og.power != prev[i]?.power);
}
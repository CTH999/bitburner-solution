import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {main as genGangInfo} from "gang/genInfo/gang";
import {main as genOtherGangInfo} from "gang/genInfo/otherGangs";
import {main as recruit} from "gang/recruit";
import {main as setMode} from "gang/mode";
import {main as ascend} from "gang/ascend";
import {addTime} from "gang/mode";

const MarginMillis = 20;

export async function main(ns: NS) {
  function addTimeWrapper(millis: number) {
    ns.printf("INFO: Processed %d ms", millis);
    addTime(ns, millis);
  }

  const mdules = [
    genGangInfo,
    genOtherGangInfo,
    recruit,
    setMode,
    ascend
  ];
  const hostname = ns.self().server;
  const jobs: Array<ExecutorJob> = [
    "genEquipmentInfo.j",
    "genMemberInfo.t",
    "equip.j",
    "assign.j",
  ].map(script => ({"script": "/gang/" + script + "s", "hostname": hostname, "threadOrOptions": {"temporary": true}} as ExecutorJob));

  ns.disableLog("sleep");
  ns.clearPort(Ports.Gang);
  while (true) {
    for (const mdule of mdules)
      await mdule(ns);
    for (const job of jobs) {
      ns.writePort(Ports.Exec, job);
      await ns.sleep(MarginMillis);
    }
    await ns.gang.nextUpdate().then(addTimeWrapper);
  }
}
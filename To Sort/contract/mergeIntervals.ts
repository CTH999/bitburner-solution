import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.MergeOverlappingIntervals];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var intervals = ns.readPort(Ports.Contract) as Signature[0];
  var temp;

  intervals.sort((a, b) => { return a[0] - b[0]; });
  temp = [intervals[0]];
  for (let i = 1; i < intervals.length; ++i) {
    if (intervals[i][0] <= temp[temp.length - 1][1]) {
      if (intervals[i][1] > temp[temp.length - 1][1])
        temp[temp.length - 1][1] = intervals[i][1];
    }
    else
      temp.push(intervals[i]);
  }
  intervals = temp;

  ns.writePort(Ports.Contract, intervals as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
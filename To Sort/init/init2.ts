import {MarginMillis} from "init/init";
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

const Jobs: Array<ExecutorJob> = [
  {script: "/crack/crack.js", hostname: "home", threadOrOptions: {preventDuplicates: true}},
  {script: "/contract/solveLoop.tsx", hostname: "home", threadOrOptions: {preventDuplicates: true}},
  {script: "/gang/launch.ts", hostname: "home", args: ["-q"], threadOrOptions: {preventDuplicates: true}},
  {script: "/bladeburner/launch.ts", hostname: "home", threadOrOptions: {preventDuplicates: true}},
  {script: "/queenAdministrator.ts", hostname: "home", threadOrOptions: {preventDuplicates: true}}
];

export async function main(ns: NS) {
  for (const job of Jobs) {
    await ns.sleep(MarginMillis);
    ns.writePort(Ports.Exec, job);
  }
}
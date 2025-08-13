import {Ports} from "lib/util";
import {DynamoJob, doDynamoJob} from "daemons/dynamo";

export type DarkwebMenuType = Record<string, number>;

export var DarkwebMenuType: DarkwebMenuType;

export const ProgramCreationRequirements: DarkwebMenuType = {
  "AutoLink.exe": 25,
  "BruteSSH.exe": 50,
  "ServerProfiler.exe": 75,
  "DeepScanV1.exe": 75,
  "FTPCrack.exe": 100,
  "relaySMTP.exe": 250,
  "DeepScanV2.exe": 400,
  "HTTPWorm.exe": 500,
  "SQLInject.exe": 750
} as const;

export var programsNotOwned = new Set(Object.keys(ProgramCreationRequirements));

export async function main(ns: NS) {
  var args = [null, "home"];
  var dynamoJob: DynamoJob = {
    functionName: "fileExists",
    cbPort: Ports.Singularity,
    args: args
  };

  for (const file of Array.from(programsNotOwned.values())) {
    args[0] = file;
    await doDynamoJob(ns, dynamoJob).then(e => programsNotOwned.delete(file));
  }
}
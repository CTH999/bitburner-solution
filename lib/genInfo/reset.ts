import {BitNode} from "lib/nsEnums";
import {Ports} from "lib/util";
import {DynamoJob, doDynamoJob} from "daemons/dynamo";
import {ExecutorJob} from "daemons/executor";

export enum BitNodePath {
  Hacking,
  Combat
}

export interface ExtResetInfo extends ResetInfo {
  favorToDonate: number,
  purchasedServers: {
    limit: number,
    maxRam: number
  },
  stock: {
    canShort: boolean,
    canLimit: boolean
  },
  bitNodeMultipliers?: BitNodeMultipliers,
  bitNodePath: BitNodePath,
  companyFavor: Record<CompanyName, number>,
  bladeburnerEnabled: boolean,
  gangEnabled: boolean,
  singularityEnabled: boolean
}

export var extResetInfo: ExtResetInfo;

export async function main(ns: NS) {
  const self = ns.self();
  const port = Ports.PIDBase + self.pid;
  var info: Partial<ExtResetInfo> = {};

  ns.clearPort(port);
  ns.atExit(() => ns.clearPort(port));
  ns.print("INFO: Getting reset info");
  let dynamoJob: DynamoJob = {
    functionName: "getResetInfo",
    cbPort: port
  };
  await doDynamoJob(ns, dynamoJob).then(val => info = val);

  ns.print("INFO: Getting favor to donate");
  dynamoJob.functionName = "getFavorToDonate";
  await doDynamoJob(ns, dynamoJob).then(val => info.favorToDonate = val);

  info.purchasedServers = {limit: 0, maxRam: 0};
  ns.print("INFO: Getting purchased server constants");
  dynamoJob.functionName = "getPurchasedServerLimit";
  await doDynamoJob(ns, dynamoJob).then(val => (info as ExtResetInfo).purchasedServers.limit = val);
  dynamoJob.functionName = "getPurchasedServerMaxRam";
  await doDynamoJob(ns, dynamoJob).then(val => (info as ExtResetInfo).purchasedServers.maxRam = val);

  if ((info as ExtResetInfo).ownedSF.get(BitNode.ArtificialIntelligence) ||
      info.currentNode == BitNode.ArtificialIntelligence) {
    // TODO: Run this on some server other than home
    ns.print("INFO: Getting BN mults");
    let executorJob: ExecutorJob = {
      script: "/lib/get/bitNodeMultipliers.ts",
      hostname: self.server,
      args: ["-p", port],
      threadOrOptions: {temporary: true},
      retry: true
    };
    ns.writePort(Ports.Exec, executorJob);
    await ns.nextPortWrite(port);
    info.bitNodeMultipliers = ns.readPort(port);
  }
  else
    ns.print("WARN: BN mults unavailable");

  info.bladeburnerEnabled = !info.bitNodeOptions?.disableBladeburner &&
    info.currentNode != BitNode.GhostOfWallStreet && (
      info.ownedSF?.has(BitNode.Bladeburners) ||
      info.ownedSF?.has(BitNode.Bladeburners2079) ||
      info.currentNode == BitNode.Bladeburners ||
      info.currentNode == BitNode.Bladeburners2079
    );

  info.gangEnabled = !info.bitNodeOptions?.disableGang &&
    !!info.bitNodeMultipliers?.GangSoftcap && (
      info.ownedSF?.has(BitNode.RiseOfTheUnderworld) ||
      info.currentNode == BitNode.RiseOfTheUnderworld
    );

  info.stock = {
    canShort: (info.ownedSF?.get(BitNode.GhostOfWallStreet) ?? 0) >= 2 ||
      info.currentNode == BitNode.GhostOfWallStreet,
    canLimit: (info.ownedSF?.get(BitNode.GhostOfWallStreet) ?? 0) >= 3 ||
      info.currentNode == BitNode.GhostOfWallStreet
  };

  switch (info.currentNode) {
    case BitNode.RiseOfTheUnderworld:
    case BitNode.BigCrash:
    case BitNode.Bladeburners:
    case BitNode.Bladeburners2079:
      info.bitNodePath = info.bladeburnerEnabled ? BitNodePath.Combat : BitNodePath.Hacking;
      break;
    default:
      info.bitNodePath = BitNodePath.Hacking;
      break;
  }

  extResetInfo = Object.freeze(info as ExtResetInfo);
}
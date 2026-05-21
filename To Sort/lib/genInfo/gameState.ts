import {Ports} from "lib/util";
import {DynamoJob, doDynamoJob} from "daemons/dynamo";
import {ExecutorJob} from "daemons/executor";

export interface GameState {
  player: Player,
  moneySources: MoneySources
};

export var gameState: GameState;

export async function main(ns: NS) {
  const self = ns.self();
  const port = Ports.PIDBase + self.pid;
  let newState: Partial<GameState> = {};

  ns.atExit(() => ns.clearPort(port));

  let dynamoJob: DynamoJob = {
    functionName: "getPlayer",
    cbPort: port
  };
  await doDynamoJob(ns, dynamoJob).then(val => newState.player = val);

  let executorJob: ExecutorJob = {
    script: "/lib/get/moneySources.ts",
    hostname: self.server,
    args: ["-p", port],
    threadOrOptions: {temporary: true},
    retry: true
  };
   ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(port);
  newState.moneySources = ns.readPort(port) as MoneySources;

  gameState = Object.freeze(newState as GameState);
}
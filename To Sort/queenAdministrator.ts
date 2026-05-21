import {BitNode} from "lib/nsEnums";
import {main as genResetInfo, extResetInfo} from "lib/genInfo/reset";
import {main as genGameState} from "lib/genInfo/gameState";
import {main as genFactionEnemies} from "singularity/genInfo/factionEnemies";
import {main as procSTEM} from "singularity/stem";

const SleepMillis = 1000;

export async function main(ns: NS) {
  // Regenerating reset info here prevents errors while editing code
  await genResetInfo(ns);

  const singularityAvailable = extResetInfo.ownedSF.has(BitNode.Singularity) || extResetInfo.currentNode == BitNode.Singularity;
  if (singularityAvailable)
    await genFactionEnemies(ns);

  ns.disableLog("sleep");
  while (true) {
    ns.print("INFO: Generating game state.");
    await genGameState(ns);
    if (singularityAvailable) {
      ns.print("INFO: Processing STEM.")
      await procSTEM(ns);
    }
    await ns.sleep(SleepMillis);
  }
}
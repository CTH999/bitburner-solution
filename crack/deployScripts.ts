import {deployDynamo} from "daemons/deployDynamo";
import {deployExecutor} from "daemons/deployExecutor";
import {deployShotgunner} from "hack/deployShotgunner";
import {deployHacknet} from "hacknet/deploy";
import {deployServerBuyer} from "srv/deploy";

export function deployScripts(ns: NS, target: string) {
  function deployShare(t?: number) {
    ns.scp("/share.ts", target);
    try {
      ns.exec("/share.ts", target, {
          "threads": t || (ns.getServerMaxRam(target) - ns.getServerUsedRam(target)) >> 2,
          "preventDuplicates": true
      });
    }
    catch (e) {}
  }

  switch (target) {
    case "n00dles":
      deployDynamo(ns, target);
      break;

    case "CSEC":
      deployServerBuyer(ns, target);
      break;

    case "nectar-net":
      deployExecutor(ns, target);
      deployShotgunner(ns, target);
      break;

    case "harakiri-sushi":
      ns.exec("/stock/deploy.ts", "home", 1, target);
      break;

    case "sigma-cosmetics":
      deployHacknet(ns, target);
      deployShare(2);
      break;
  }
}

export async function main(ns: NS) { deployScripts(ns, ns.args[0] as string); }
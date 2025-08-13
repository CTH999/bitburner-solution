import {Ports} from "lib/util";
import {main as genBladeburnerPlayer} from "bladeburner/genInfo/player";
import {main as genBladeburnerActions} from "bladeburner/genInfo/actions";
import {main as genBladeburnerCities} from "bladeburner/genInfo/cities";
import {main as chooseCity} from "bladeburner/chooseCity";
import {main as manageSkills} from "bladeburner/manageSkills";

export async function main(ns: NS) {
  ns.clearPort(Ports.Bladeburner);
  while (true) {
    ns.clearLog();
    await genBladeburnerCities(ns);
    await genBladeburnerPlayer(ns);
    await chooseCity(ns);
    await genBladeburnerActions(ns);
    await manageSkills(ns);
    await ns.bladeburner.nextUpdate();
  }
}
import {gameState} from "lib/genInfo/gameState";

const MinFunds = 10e9;

export async function main(ns: NS) {
  const cities = Object.values(ns.enums.CityName);
  if (gameState.player.money >= MinFunds)
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 0xFF; ++j)
        cities.forEach(ns.singularity.travelToCity);
      await ns.sleep(0);
    }
  ns.singularity.travelToCity(gameState.player.city);
}
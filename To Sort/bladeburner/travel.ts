export async function main(ns: NS) {
  ns.bladeburner.switchCity(ns.args[0] as CityName);
}
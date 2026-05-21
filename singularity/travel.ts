export async function main(ns: NS) {
  ns.singularity.travelToCity((ns.args as Array<CityName>)[0]);
}
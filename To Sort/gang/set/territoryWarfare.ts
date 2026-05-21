export async function main(ns: NS) {
  ns.gang.setTerritoryWarfare(ns.args[0] as boolean);
}
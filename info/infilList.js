/** @param {NS} ns */
export async function main(ns) {
  var i;
  var targets = ns.infiltration.getPossibleLocations();
  var infilList = "";
  for (i = 0; i < targets.length; ++i) {
    let infil = ns.infiltration.getInfiltration(targets[i].name);

    infilList += ns.sprintf("%s, %s\n%d, %d, %d, %d\n", targets[i].city, targets[i].name, infil.difficulty, infil.startingSecurityLevel, infil.maxClearanceLevel, infil.reward.SoARep);
  }
  ns.alert(infilList);
}
/** @param {NS} ns */
export async function main(ns) {
  var player = ns.getPlayer();
  ns.alert("Karma: " + player.karma.toString() + "\nBody count: " + player.numPeopleKilled.toString());
}
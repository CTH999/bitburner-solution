import {Ports} from "lib/util";

/** @param {NS} ns */
export async function main(ns) {
  const answer = ns.readPort(Ports.Contract);

  if (answer != "NULL PORT DATA")
    ns.writePort(Ports.Contract, ns.codingcontract.attempt(answer, ns.args[0], ns.args[1]));
}
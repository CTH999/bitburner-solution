import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  var p = ns.go.makeMove(ns.readPort(Ports.Go), ns.readPort(Ports.Go)).then((response) => ns.writePort(Ports.Go, response));
  await p;
}
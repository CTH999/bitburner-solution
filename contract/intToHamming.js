import {Ports} from "/library/library.js";

/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", {"temporary": true}, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }

  var n = ns.readPort(Ports.Contract);
  var nBits, parityBits;
  var code = 0;
  var codePos, nPos;

  nBits = Math.ceil(Math.log2(n));
  parityBits = Math.ceil(Math.log2(nBits));
  while (Math.ceil(Math.log2(nBits + parityBits)) < parityBits)
    ++parityBits;
  n = BigInt(n); // Need to prevent automatic conversion to 32-bit signed
  for (nPos = nBits - 1, codePos = 1; codePos <= nBits + parityBits; ++codePos) {
    
  }
}
import {deepScan} from "lib/util";

export async function main(ns: NS) {
  var nodes = deepScan(ns);

  for (let i = 0; i < nodes.length; ++i) {
    let lit = ns.ls(nodes[i], ".lit");
    ns.scp(lit, "home", nodes[i]);
  }
}
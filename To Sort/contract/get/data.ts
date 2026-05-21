import {Ports} from "lib/util";

export async function main(ns: NS) {
  const flags = ns.flags([["p", false]]);
  const args = flags._ as Array<string>;
  const data = ns.codingcontract.getData(args[0], args[1]);

  if (flags.p)
    ns.writePort(Ports.Contract, data);
  else
    ns.tprint(data.toString());
}
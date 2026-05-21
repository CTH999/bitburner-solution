import {Ports} from "lib/util";

export async function main(ns: NS) {
  ns.writePort(Ports.Gang, (ns.args as Array<string>).map(ns.gang.getAscensionResult));
}
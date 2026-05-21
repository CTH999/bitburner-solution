import {Ports} from"lib/util";

export async function main(ns: NS) {
  ns.writePort(Ports.Gang, ns.gang.getGangInformation());
}
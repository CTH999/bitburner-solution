import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.CompressionIRLECompression];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const str = ns.readPort(Ports.Contract) as Signature[0];

  var compressed: Signature[1] = "";
  var c = "\0";
  var n = 0;
  for (let i = 0; i < str.length; ++i) {
    if (str[i] == c) {
      if (n < 9)
        ++n;
      else {
        compressed += "9" + c;
        n = 1;
      }
    }
    else {
      if (n)
        compressed += n.toString() + c;
      c = str[i];
      n = 1;
    }
  }
  compressed += n.toString() + c;

  ns.writePort(Ports.Contract, compressed);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
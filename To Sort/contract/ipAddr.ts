import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.GenerateIPAddresses];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const str = ns.readPort(Ports.Contract) as Signature[0];
  var addrs = [];

  const isValid = function(octet: string) {
    return (octet == "0" || octet[0] != "0") && (octet.length < 3 || octet <= "255");
  }

  for (let a = 1; a < 4; ++a) {
    var octets = new Array<string>(4);

    octets[0] = str.slice(0, a);
    if (isValid(octets[0]))
      for (let b = 1; b < 4 && a + b <= str.length - 2; ++b) {
        octets[1] = str.slice(a, a + b);
        if (isValid(octets[1]))
          for (let c = 3; c; --c) {
            const d = str.length - a - b - c;

            if (d >= 1 && d <= 3) {
              octets[2] = str.slice(a + b, a + b + c);
              if (isValid(octets[2])) {
                octets[3] = str.slice(a + b + c);
                if (isValid(octets[3]))
                  addrs.push(octets[0] + "." + octets[1] + "." + octets[2] + "." + octets[3]);
              }
            }
          }
      }
  }

  ns.writePort(Ports.Contract, addrs as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
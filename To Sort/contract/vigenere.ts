import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.EncryptionIIVigenereCipher];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const [msg, key] = ns.readPort(Ports.Contract) as Signature[0];
  var charCodes: Array<number> = [];

  for (let i = 0; i < key.length; ++i)
    charCodes.push(key.charCodeAt(i) - 0x41);
  const keyCodes = charCodes;

  charCodes = [];
  for (let i = 0, j = 0; i < msg.length; ++i) {
    charCodes.push(msg.charCodeAt(i))
    if (charCodes[i] != 0x20) {
      charCodes[i] += keyCodes[j];
      if (charCodes[i] > 0x5A)
        charCodes[i] -= 26;
      j = (j + 1) % keyCodes.length;
    }
  }

  ns.writePort(Ports.Contract, String.fromCharCode(...charCodes) as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
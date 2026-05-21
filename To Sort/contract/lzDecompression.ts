/*Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:

1. Exactly L characters, which are to be copied directly into the uncompressed data.
2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.

For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.*/

import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.CompressionIILZDecompression];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  var comp = ns.readPort(Ports.Contract) as Signature[0];
  var decomp = "";

  for (let i = 0, chunkType = 0; i < comp.length; chunkType ^= 1) {
    const chunkLen = parseInt(comp[i++]);
  
    if (chunkLen) {
      if (chunkType) {
        const chunkStart = decomp.length - parseInt(comp[i++]);
        for (let j = chunkStart; j < chunkStart + chunkLen; ++j)
          decomp += decomp[j];
      }
      else {
        decomp += comp.substring(i, i + chunkLen);
        i += chunkLen;
      }
    }
  }

  ns.writePort(Ports.Contract, decomp as Signature[1]);
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
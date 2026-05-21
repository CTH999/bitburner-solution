export async function main(ns: NS) {
  const flags = ns.flags([["f", false]]);
  ns.singularity.workForFaction(
    (flags._ as Array<FactionName>)[0], (flags._ as Array<FactionWorkType>)[1], flags.f as boolean
  );
}
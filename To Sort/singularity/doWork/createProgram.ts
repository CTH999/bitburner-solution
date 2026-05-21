export async function main(ns: NS) {
  const flags = ns.flags([["f", false]]);
  ns.singularity.createProgram((flags._ as Array<string>)[0], flags.f as boolean);
}
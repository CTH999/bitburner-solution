export async function main(ns: NS) {
  const flags = ns.flags([["d", 0], ["n", 1]]);
  const opts: BasicHGWOptions = {"additionalMsec": flags.d as number};

  for (let i = 0; i < (flags.n as number); ++i)
    await ns.weaken((flags._ as Array<string>)[0], opts);
}
export async function main(ns: NS) {
  const flags = ns.flags([["d", 0], ["n", 1], ["s", false]]);
  const opts: BasicHGWOptions = {
    "stock": flags.s as boolean,
    "additionalMsec": flags.d as number
  };

  for (let i = 0; i < (flags.n as number); ++i)
    await ns.grow((flags._ as Array<string>)[0], opts);
}
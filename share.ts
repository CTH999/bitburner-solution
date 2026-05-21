export async function main(ns: NS) {
  const flags = ns.flags([["c", 0]]);

  for (let cycles: number = flags.c as number || Number.MAX_SAFE_INTEGER; cycles; --cycles)
    await ns.share();
}
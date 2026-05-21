export async function main(ns: NS) {
  for (const filename of ns.args as Array<string>)
    ns.rm(filename);
}
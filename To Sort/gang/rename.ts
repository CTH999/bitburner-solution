export async function main(ns: NS) {
  ns.gang.renameMember(ns.args[0] as string, ns.args[1] as string);
}
export async function main(ns: NS) {
  const args = ns.args as Array<string>;
  ns.singularity.purchaseAugmentation(args[0], args[1]);
}
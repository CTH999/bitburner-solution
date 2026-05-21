/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    await Promise.any([ns.gang.nextUpdate(), ns.stock.nextUpdate()]);
  }
}
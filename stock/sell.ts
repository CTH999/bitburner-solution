export const Quantity = 1e8;

export async function main(ns: NS) {
  for (const sym of ns.args as Array<string>)
    ns.stock.sellStock(sym, Quantity);
}
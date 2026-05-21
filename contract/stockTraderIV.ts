import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.AlgorithmicStockTraderIV];

export function getProfit (prices: Signature[0][1], k?: Signature[0][0]): Signature[1] {
  var price = Number.MAX_SAFE_INTEGER;
  var buy = true;
  var profit = 0;
  var temp: Signature[0][1] = [];

  // Loop throws out prices that buck the trend at the end,
  // so fudge one
  prices.push(prices[prices.length - 2]);
  // Construct array of local minima and maxima
  for (let i = 0; i < prices.length; ++i) {
    if (buy) {
      if (prices[i] > price) {
        temp.push(price);
        price = prices[i];
        buy = false;
      }
      else
        price = prices[i];
    }
    else {
      if (prices[i] < price) {
        temp.push(price);
        price = prices[i];
        buy = true;
      }
      else
        price = prices[i];
    }
  }
  
  prices = temp;
  if (prices.length & 1)
    prices.pop();

  if (k) {
    // Throw out pair with least difference as needed
    k <<= 1;
    while (prices.length > k) {
      let toToss = 0;

      for (let i = 1; i < prices.length - 1; ++i)
        if (Math.abs(prices[i] - prices[i + 1]) < Math.abs(prices[toToss] - prices[toToss + 1]))
          toToss = i;

      prices.splice(toToss, 2);
    }
  }

  for (let i = 0; i < prices.length; i += 2)
      profit += prices[i + 1] - prices[i];

  return profit;
}

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    await ns.sleep(20);
  }*/

  var [k, prices] = ns.readPort(Ports.Contract) as Signature[0];
  
  ns.writePort(Ports.Contract, getProfit(prices, k));
  ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
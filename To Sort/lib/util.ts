export const ReservedRam = 97.6; //17;

export enum Ports {
  // System daemons
  Exec = 1,
  DynamicNS,

  // Basic mechanics
  Crack,
  Server,
  ServerBroadcast,
  Contract,
  StockBuy,
  StockSell,
  StockBroadcast,
  StockUpdate,
  Hack,
  Go,

  // SF-gated mechanics
  Sleeve,
  Gang,
  GangUpdate,
  Corp,
  CorpUpdate,
  Bladeburner,
  Singularity,

  // Offset for using PIDs as port numbers
  PIDBase = 100
}

export const SpecialHostnames = ["home", "CSEC", "n00dles", "nectar-net", "harakiri-sushi", "sigma-cosmetics"];
export const FreebieHostnames = ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "hong-fang-tea", "nectar-net", "harakiri-sushi"];

export function replacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

export function reviver(key: any, value: any) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

/** @returns Array of all nodes excluding host
*/
export function deepScan(ns: NS, host?: string, incHost?: boolean, asSet?: boolean) {
  var nodes = new Set<string>(), newNodes = new Set<string>();
  host ??= ns.self().server;

/* Recursive version crashes
  var adj = new Set(ns.scan(host));
  var adjIter;
  if (adj.has(host))
    adj.delete(host);
  adjIter = adj.values();
  for (const adjHost of adjIter) {
    nodes += deepScan(ns, adjHost);
  }
*/

  for (newNodes.add(host); !newNodes.isSubsetOf(nodes);) {
    nodes = nodes.union(newNodes);
    newNodes = new Set<string>();

    for (const node of nodes.values())
      newNodes = newNodes.union(new Set(ns.scan(node)));
  }
  if (!incHost)
    nodes.delete(host);

  if (!asSet)
    return Array.from(nodes.values());

  return nodes;
}

export function getSecurityDelta(ns: NS, hostname: string) {
  hostname ??= ns.self().server;
  return ns.getServerSecurityLevel(hostname) - ns.getServerMinSecurityLevel(hostname);
}

export function srvSecurityDelta(srv: Server) {
  return (srv.hackDifficulty ?? 0) - (srv.minDifficulty ?? 0);
}

export function getMoneyRatio(ns: NS, hostname: string) {
  hostname ??= ns.self().server;
  return ns.getServerMoneyAvailable(hostname) / ns.getServerMaxMoney(hostname);
}

export function srvMoneyRatio(srv: Server) {
  return (srv.moneyAvailable ?? 0) / (srv.moneyMax ?? 1);
}

export async function main(ns: NS) {
  var nodes = deepScan(ns);
}
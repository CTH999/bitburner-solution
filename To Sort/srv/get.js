/** @param {NS} ns */
export async function main(ns) {
  const flags = ns.flags([["p", 0]])
  const servers = flags._.map(ns.getServer);

  if (flags.p)
    ns.writePort(flags.p, servers.length > 1 ? servers : servers[0])
  else
    for (const srv of servers)
      ns.write("/srv/info/" + hostname + ".json", JSON.stringify(srv), "w");
}
/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  var path = [];

  function pathToServer(hostname) {
    const connections = ns.scan(hostname);

    path.push(hostname);
    if (hostname == target)
      return true;

    for (const connection of connections) {
      if (!path.includes(connection) && pathToServer(connection))
        break;
    }

    if (path[path.length - 1] == target)
      return true;
    path.pop();
    return false;
  }

  if (pathToServer(ns.getHostname()))
    ns.tprint(JSON.stringify(path));
  else
    ns.tprint("Could not find " + target);
}
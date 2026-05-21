import {Ports} from "lib/util";

type Signature = CodingContractSignatures[CodingContractName.Proper2ColoringOfAGraph];

export async function main(ns: NS) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("/contract/getData.js", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/

  const [size, edges] = ns.readPort(Ports.Contract) as Signature[0];
  var graph = new Array(size);

  for (let i = 0; i < size; ++i)
    graph[i] = {"color": 0, "touched": false, "edges": []};

  for (let i = 0; i < edges.length; ++i) {
    graph[edges[i][0]].edges.push(graph[edges[i][1]]);
    graph[edges[i][1]].edges.push(graph[edges[i][0]]);
  }

  graph.find(a => a.edges.length).touched = true;
  const isTouched = (a: any) => a.touched;
  let edgeFound = true;
  do {
    if (!edgeFound)
      graph.find(a => !a.touched).touched = true;
    edgeFound = false;

    for (let i = 1; i < graph.length; ++i)
      if (!graph[i].touched) {
        if (graph[i].edges.length) {
          const t = graph[i].edges.find(isTouched);
          if (t !== undefined) {
            graph[i].color = t.color ^ 1;
            graph[i].touched = true;
            edgeFound = true;
          }
        }
        else
          graph[i].touched = true;
      }
  } while (!graph.every(isTouched));

  if (graph.every((a) => {
    return a.edges.every((b: any) => a.color ^ b.color);
  }))
    graph = graph.map(a => a.color);
  else
    graph = [];

  ns.writePort(Ports.Contract, graph as Signature[1]);
  ns.spawn("/contract/attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
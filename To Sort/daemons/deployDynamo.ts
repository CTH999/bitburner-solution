const DynamoScript = "/daemons/dynamo.ts";

export function deployDynamo(ns: NS, dest: string) {
  ns.scp(["/lib/util.ts", ...ns.ls("home", "daemons")], dest);
  ns.kill(DynamoScript, dest);
  ns.exec(DynamoScript, dest);
}

export async function main(ns: NS) { deployDynamo(ns, ns.args[0] as string); }
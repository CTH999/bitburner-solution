const ExecutorScript = "/daemons/executor.ts";

export function deployExecutor(ns: NS, dest: string) {
  ns.scp(["/lib/util.ts", ExecutorScript], dest);
  ns.kill(ExecutorScript, dest);
  ns.exec(ExecutorScript, dest);
}

export async function main(ns: NS) { deployExecutor(ns, ns.args[0] as string); }
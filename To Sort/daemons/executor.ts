// This should not be used for high-volume purposes like batch hacking
// Otherwise, it's great for minimizing RAM usage

import {Ports} from "lib/util";

const MaxRetries = 1e3;

export interface ExecutorJob {
  /** File path must be absolute, not relative. */
  script: string,

  /** Name of server to run on. */
  hostname: string,

  /** Same as in ns.run and ns.exec. */
  threadOrOptions?: number | RunOptions,

  /** Array of arguments to pass to the script. */
  args?: Array<ScriptArg>,

  /** Delay in ms. Mutually exclusive with retry. */
  delay?: number,

  /** Callback port. PID will be written to it. If retry is true, port write will happen only when exec succeeds. */
  cbPort?: number,

  /** True to retry until exec succeeds. Mutually exclusive with delay. Will retry at most 1000 times.*/
  retry?: boolean | number
};

function execute(ns: NS, job: ExecutorJob) {
  try {
    const pid = ns.exec(job.script, job.hostname, job.threadOrOptions, ...(job.args ?? []));
    if (job.cbPort && (pid || !job.retry))
      ns.writePort(job.cbPort, pid);
    return pid;
  }
  catch (e) {
    ns.print(e);
    ns.alert("Executor job threw an error\nScript: " + job.script + "\n" + "args: " + JSON.stringify(job.args) + "\n\n" + e);
    if (job.cbPort)
      ns.writePort(job.cbPort, 0);
    return -1;
  }
}

export async function main(ns: NS) {
  // window.setTimeout is used for delays, so ramOverride is needed to dodge the 25 GiB cost
  ns.ramOverride(2.9);

  function needsRetry(job: ExecutorJob) { return job.retry; }

  var toRetry: Array<ExecutorJob> = [];

  // TODO: Implement search for server with available RAM
  while (true) {
    while (ns.peek(Ports.Exec) != "NULL PORT DATA") {
      const job = ns.readPort(Ports.Exec) as ExecutorJob;
      if (job.delay)
        window.setTimeout(execute, job.delay, ns, job);
      else if (!execute(ns, job) && job.retry) {
        job.retry = MaxRetries;
        toRetry.push(job);
      }
    }

    for (const job of toRetry)
      if (execute(ns, job))
        job.retry = false;
      else if (!--(job.retry as number) && job.cbPort)
        ns.writePort(job.cbPort, 0);
    toRetry = toRetry.filter(needsRetry);

    await (toRetry.length ? ns.sleep(20) : ns.nextPortWrite(Ports.Exec));
  }
}
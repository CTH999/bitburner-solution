import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";

const StaticRam = 4;
const MaxRamCost = StaticRam - 1.6;

export interface DynamoJob {
  /** The fully qualified name of the function to call, without the leading `ns.` */
  functionName: string,

  /** An array of arguments to pass to the function (optional). */
  args?: Array<any>,

  /** The port to which the function's return value will be written (optional). */
  cbPort?: number,

  /** Set to suppress messages about unhandled errors. Only used if cbPort is undefined. */
  ignoreErrors?: boolean
}

export interface DynamoResult {
  /** The return value, if the function returned normally. Otherwise, the error. */
  val: any,

  /** True if the function threw an error. */
  error: boolean
}

/** Use this instead of writing to Ports.DynamicNS directly. It unpacks the result and
 * either throws an error or returns the NS function's return value, as you'd expect.
 */
export async function doDynamoJob(ns: NS, job: DynamoJob) {
  ns.writePort(Ports.DynamicNS, job);
  if (job.cbPort) {
    await ns.nextPortWrite(job.cbPort);
    const result = ns.readPort(job.cbPort) as DynamoResult;
    if (result.error)
      throw(result.val);
    return result.val;
  }
}

export async function main(ns: NS) {
  if (ns.ramOverride(StaticRam) != StaticRam) {
    ns.print("ERROR: ramOverride failed.");
    ns.toast("ramOverride failed in dynamo", ns.enums.ToastVariant.ERROR);
    ns.exit();
  }

  var usedFuncs = new Map<string, Function>();

  while (true) {
    while (ns.peek(Ports.DynamicNS) != "NULL PORT DATA") {
      const job = ns.readPort(Ports.DynamicNS) as DynamoJob;
      const self = ns.self();
      let ramCost: number;

      try { ramCost = ns.getFunctionRamCost(job.functionName); }
      catch (e) {
        ns.toast("Invalid dynamo job", ns.enums.ToastVariant.ERROR);
        ns.print(e);
        continue;
      }

      if (ramCost > MaxRamCost) {
        const err = "Dynamo job exceeded static RAM";
        ns.toast(err, ns.enums.ToastVariant.ERROR);
        if (job.cbPort)
          ns.writePort(job.cbPort, {val: err, error: true} as DynamoResult);
      }

      if (!usedFuncs.has(job.functionName)) {
        if (StaticRam - (self.dynamicRamUsage ?? 1.6) < ramCost) {
          // Restart the daemon. Can't use ns.spawn, because that costs RAM, so do it with the executor.
          ns.print("Respawning");
          ns.writePort(Ports.Exec, {
            script: self.filename,
            hostname: self.server,
            args: self.args,
            retry: true
          } as ExecutorJob);
          ns.exit();
        }
        usedFuncs.set(job.functionName, eval("ns." + job.functionName) as Function);
        ns.printf("INFO: %s added to used functions.\nDynamic RAM usage is now %s.",
                  job.functionName, ns.formatRam((self.dynamicRamUsage ?? 1.6) + ramCost));
      }

      try {
        const ret = (usedFuncs.get(job.functionName) as Function)(...(job.args ?? []));
        if (job.cbPort)
          ns.writePort(job.cbPort, {val: ret, error: false} as DynamoResult);
      }
      catch (e) {
        if (job.cbPort)
          ns.writePort(job.cbPort, {val: e, error: true} as DynamoResult);
        else if (!job.ignoreErrors) {
          ns.print(e);
          ns.toast("Unhandled error in dynamo");
        }
      }
    }
    await ns.nextPortWrite(Ports.DynamicNS);
  }
}
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {main as genCompanyRep} from "singularity/genInfo/companyRep";
import {main as genCompanyPositions} from "singularity/genInfo/companyPositions";
import {main as genDarkwebInfo} from "singularity/genInfo/darkweb";
import {main as applyForJobs} from "singularity/applyForJobs";
import {main as chooseWork} from "singularity/chooseWork";

export async function main(ns: NS) {
  ns.print("INFO: Attempting to farm Int.");
  ns.writePort(Ports.Exec, {
    script: "/singularity/farmInt.ts",
    hostname: ns.self().server,
    threadOrOptions: {temporary: true}
  } as ExecutorJob);
  await genCompanyRep(ns);
  await genCompanyPositions(ns);
  await genDarkwebInfo(ns);
  ns.print("INFO: Applying for jobs.")
  await applyForJobs(ns);
  ns.print("INFO: Choosing work.");
  await chooseWork(ns);
}
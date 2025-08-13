import {BitNode, CompanyName, JobField} from "lib/nsEnums";
import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {BitNodePath, extResetInfo} from "lib/genInfo/reset";
import {gameState} from "lib/genInfo/gameState";
import {symbolInfoRecord} from "stock/genSymbolInfo";
import {companyPositions} from "singularity/genInfo/companyPositions";
import {companyRep} from "singularity/genInfo/companyRep";

const Megacorps = [
  CompanyName.BachmanAndAssociates,
  CompanyName.BladeIndustries,
  CompanyName.ClarkeIncorporated,
  CompanyName.ECorp,
  CompanyName.FourSigma,
  CompanyName.FulcrumTechnologies,
  CompanyName.KuaiGongInternational,
  CompanyName.MegaCorp,
  CompanyName.NWO,
  CompanyName.OmniTekIncorporated
];

const FieldPreferences: Record<BitNodePath, Record<JobField, number>> = {
  [BitNodePath.Hacking]: {
    [JobField.softwareConsultant]: 10,
    [JobField.it]: 9,
    [JobField.software]: 8,
    [JobField.networkEngineer]: 7,
    [JobField.securityEngineer]: 6,
    [JobField.businessConsultant]: 5,
    [JobField.business]: 4,
    [JobField.agent]: 3,
    [JobField.security]: 2,
    [JobField.employee]: 1,
    [JobField.waiter]: 1,
    [JobField.partTimeEmployee]: 0,
    [JobField.partTimeWaiter]: 0
  },
  [BitNodePath.Combat]: {
    [JobField.agent]: 10,
    [JobField.security]: 9,
    [JobField.businessConsultant]: 8,
    [JobField.business]: 7,
    [JobField.softwareConsultant]: 6,
    [JobField.it]: 5,
    [JobField.software]: 4,
    [JobField.networkEngineer]: 3,
    [JobField.securityEngineer]: 2,
    [JobField.employee]: 1,
    [JobField.waiter]: 1,
    [JobField.partTimeEmployee]: 0,
    [JobField.partTimeWaiter]: 0
  }
} as const;

var companiesWithStock: Array<CompanyName> = [];

/** Applies to a job at the given company, if requirements for any position are met.
 * Positions with higher rep requirements are preferred. In the case of a tie, FieldPreferences will be used
 * to break it.
 */
async function pickJobAtCompany(ns: NS, company: CompanyName) {
  const hostname = ns.self().server;
  const fieldPreferences = FieldPreferences[extResetInfo.bitNodePath];
  // Can't just one-and-done the position info, even per install, because backdooring changes rep requirements
  ns.writePort(Ports.Exec, {
    script: "/singularity/get/company/positionInfo.ts",
    hostname: hostname,
    args: ["-p", Ports.Singularity, "-c", company].concat(companyPositions[company]),
    threadOrOptions: {temporary: true},
    retry: true
  } as ExecutorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const positionInfo = (ns.readPort(Ports.Singularity) as Array<CompanyPositionInfo>).filter(
    p => companyRep[company] >= p.requiredReputation && Object.entries(p.requiredSkills).every(
      ([skill, req]) => gameState.player.skills[skill as keyof Skills] >= req
  )).sort((a, b) =>
    b.requiredReputation == a.requiredReputation ?
    fieldPreferences[b.field] - fieldPreferences[a.field] :
    b.requiredReputation - a.requiredReputation
  )[0];
  if (positionInfo)
    ns.writePort(Ports.Exec, {
      script: "/singularity/applyToCompany.ts",
      hostname: hostname,
      args: [company, positionInfo.field],
      threadOrOptions: {temporary: true},
      retry: true
    } as ExecutorJob);
}

export async function main(ns: NS) {
  var relevantCompanies: Array<CompanyName>;

  if (extResetInfo.currentNode == BitNode.GhostOfWallStreet) {
    if (!companiesWithStock.length && symbolInfoRecord) {
      const symbolInfo = Object.values(symbolInfoRecord);
      companiesWithStock = Object.values(CompanyName).filter(c => symbolInfo.find(s => s.organization == c));
    }
    relevantCompanies = companiesWithStock;
  }
  else
    relevantCompanies = Megacorps.filter(c => !gameState.player.factions.includes(c));

  for (const company of relevantCompanies)
    await pickJobAtCompany(ns, company);
}
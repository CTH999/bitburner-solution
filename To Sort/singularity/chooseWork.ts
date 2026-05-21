import {BitNode, WorkType} from "lib/nsEnums";
import {Ports} from "lib/util";
import {extResetInfo} from "lib/genInfo/reset";
import {gameState} from "lib/genInfo/gameState";
import {ExecutorJob} from "daemons/executor";
import {SymbolInfo, symbolInfoRecord} from "stock/genSymbolInfo";
import {ProgramCreationRequirements, programsNotOwned} from "singularity/genInfo/darkweb";

function evalStockPriority(s: SymbolInfo) {
  const pos = s.position as Array<number>;
  return pos[0] * pos[1] * (s.volatility ?? 1) * (1 - (s.forecast ?? 0));
}

export async function main(ns: NS) {
  const employers = Object.keys(gameState.player.jobs);
  var workChosen = false;
  var executorJob: ExecutorJob = {
    script: "/singularity/is/focused.ts",
    hostname: ns.self().server,
    threadOrOptions: {temporary: true},
    retry: true
  };

  function workOnProgram(onlyEasy: boolean) {
    const maxHackReq = onlyEasy ? gameState.player.skills.hacking << 1 :
      gameState.player.skills.hacking + (gameState.player.skills.intelligence >>> 1);
    let prog = Array.from(programsNotOwned.values()).find(p => ProgramCreationRequirements[p] <= maxHackReq);
    if (prog) {
      ns.print("INFO: Will create ", prog, ".");
      if (currentWork.type != WorkType.CreateProgram || (currentWork as CreateProgramWorkTask).programName != prog) {
        executorJob.script += "createProgram.ts";
        executorJob.args = [prog];
      }
      return true;
    }
    return false;
  }

  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const focused: boolean = ns.readPort(Ports.Singularity);

  executorJob.script = "/singularity/get/currentWork.ts";
  ns.writePort(Ports.Exec, executorJob);
  await ns.nextPortWrite(Ports.Singularity);
  const currentWork: Task = ns.readPort(Ports.Singularity);

  executorJob.script = "/singularity/doWork/";
  if (extResetInfo.currentNode == BitNode.GhostOfWallStreet ) {
    // First, create any programs that can be created quickly
    workChosen = workOnProgram(true);

    // Second, work for a company whose stock we hold in the long position
    // This will drive the value of the stock up
    if (!workChosen && symbolInfoRecord) {
      const symbolInfo = Object.values(symbolInfoRecord)
        .filter(s => s.position && s.position[0] && employers.includes(s.organization))
        .sort((a, b) => evalStockPriority(b) - evalStockPriority(a));
      if (symbolInfo.length) {
        workChosen = true;
        ns.print("INFO: Will do company work for ", symbolInfo[0].organization, ".");
        if (currentWork.type != WorkType.Company ||
            (currentWork as CompanyWorkTask).companyName != symbolInfo[0].organization) {
          executorJob.script += "company.ts";
          executorJob.args = [symbolInfo[0].organization];
        }
      }
    }

    // Third, create any program that can be created
    if (!workChosen)
      workChosen = workOnProgram(false);
  }

  if (!workChosen)
    ns.print("WARN: Failed to choose work task.");

  if (executorJob.args) {
    if (focused)
      executorJob.args.push("-f");
    ns.writePort(Ports.Exec, executorJob);
  }
}
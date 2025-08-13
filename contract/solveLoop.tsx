import {Ports} from "lib/util";
import {CodingContractName} from "lib/nsEnums";

type CodingContractInfo = {
  "hostname": string,
  "filename": string
  "type": CodingContractName
};

type CodingContractStats = {
  "numSolved": number,
  "moneyGained": number
};

const Solvers: Record<CodingContractName, string | undefined> = {
  [CodingContractName.AlgorithmicStockTraderI]: "./stockTraderI.ts",
  [CodingContractName.AlgorithmicStockTraderII]: "./stockTraderII.ts",
  [CodingContractName.AlgorithmicStockTraderIII]: "./stockTraderIII.ts",
  [CodingContractName.AlgorithmicStockTraderIV]: "./stockTraderIV.ts",
  [CodingContractName.ArrayJumpingGame]: "./arrayJumpI.ts",
  [CodingContractName.ArrayJumpingGameII]: "./arrayJumpII.ts",
  [CodingContractName.CompressionIRLECompression]: "./rleCompression.ts",
  [CodingContractName.CompressionIILZDecompression]: "./lzDecompression.ts",
  [CodingContractName.CompressionIIILZCompression]: "./lzCompression.js",
  [CodingContractName.EncryptionICaesarCipher]: "./caesar.ts",
  [CodingContractName.EncryptionIIVigenereCipher]: "./vigenere.ts",
  [CodingContractName.GenerateIPAddresses]: "./ipAddr.ts",
  [CodingContractName.HammingCodesEncodedBinaryToInteger]: undefined,
  [CodingContractName.HammingCodesIntegerToEncodedBinary]: "./intToHamming.js",
  [CodingContractName.FindAllValidMathExpressions]: "./mathExprs.js",
  [CodingContractName.FindLargestPrimeFactor]: "./lpf.js",
  [CodingContractName.MergeOverlappingIntervals]: "./mergeIntervals.ts",
  [CodingContractName.MinimumPathSumInATriangle]: "./triMinSum.ts",
  [CodingContractName.Proper2ColoringOfAGraph]: "./2color.ts",
  [CodingContractName.SanitizeParenthesesInExpression]: undefined,
  [CodingContractName.ShortestPathInAGrid]: "./shortestGridPath.ts",
  [CodingContractName.SpiralizeMatrix]: "./spiralize.ts",
  [CodingContractName.SquareRoot]: "./sqrt.ts",
  [CodingContractName.SubarrayWithMaximumSum]: "./subarrayMaxSum.ts",
  [CodingContractName.TotalWaysToSum]: "./intPartition.ts",
  [CodingContractName.TotalWaysToSumII]: "./intPartitionSet.js",
  [CodingContractName.UniquePathsInAGridI]: "./gridPathsI.js",
  [CodingContractName.UniquePathsInAGridII]: "./gridPathsII.ts"
};

export async function main(ns: NS) {
  ns.atExit(() => { ns.clearPort(Ports.Contract); });
  while (!ns.run("/lib/deepScan.js", 1, "-p", Ports.Contract, "--include-host", "--exclude-purchased"))
    await ns.sleep(1000);
  await ns.nextPortWrite(Ports.Contract);
  var styles: any = ns.ui.getTheme();
  styles = {
    "error": {"color": styles.error},
    "success": {"color": styles.success},
    "money": {"color": styles.money}
  };
  var hostnames = ns.readPort(Ports.Contract) as Array<string>;
  const host = ns.self().server;

  var failedTypes = new Set<CodingContractName>();
  var successStats: {[key in CodingContractName]?: CodingContractStats} = {};
  var moneyGained = 0;

  const attemptRam = ns.getScriptRam("./attempt.js");
  const freeRam = function() { return ns.getServerMaxRam(host) - ns.getServerUsedRam(host); };

  function renderPrettyLog(outstanding: Array<CodingContractInfo>) {
    var log = new Array<React.JSX.Element>();
    if (outstanding.length) {
      const listItems = outstanding.map((c) => {
        return <li>{c.filename} on {c.hostname} ({c["type"]})</li>;
      });
      log.push(<div><h1>Outstanding Contracts</h1><ul>{listItems}</ul></div>);
    }
    else
      log.push(<p>No outstanding contracts</p>);

    log.push(<hr/>);
    if (failedTypes.size) {
      var listItems = new Array<React.JSX.Element>();

      for (const typ of failedTypes.values())
        listItems.push(<li>{typ}</li>);
      log.push(<div style={styles.error}><h1>Failed Contract Types</h1><ul>{listItems}</ul></div>);
    }
    else
      log.push(<p>No failures</p>);

    var rows = new Array<React.JSX.Element>();

    log.push(<hr/>);
    for (const [typ, stats] of Object.entries(successStats))
      rows.push(<tr><td>{typ}</td><td style={styles.success}>{stats.numSolved}</td><td style={styles.money}>${ns.formatNumber(stats.moneyGained)}</td></tr>);
    if (rows.length) {
      log.push(
        <div>
          <table style={{"border-spacing": "10px"}}>
            <tr><th>Contract Type</th><th style={styles.success}>Solved</th><th style={styles.money}>Money</th></tr>
            {rows}
          </table>
          <p style={styles.money}>Total money gained: ${ns.formatNumber(moneyGained)}</p>
        </div>
      );
    }
    else
      log.push(<p>No contracts solved yet</p>);
    return log;
  }

  ns.disableLog("sleep");
  ns.disableLog("run");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
  while (true) {
    let outstanding = new Array<CodingContractInfo>();

    for (let i = 0; i < hostnames.length && freeRam(); ++i) {
      const ccs = ns.ls(hostnames[i], ".cct");
      for (let j = 0; j < ccs.length && freeRam(); ++j) {
        ns.clearPort(Ports.Contract);
        
        if (ns.run("./get/type.ts", {"temporary": true}, ccs[j], hostnames[i], "-p")) {
          await ns.nextPortWrite(Ports.Contract);
          const typ = ns.readPort(Ports.Contract) as CodingContractName;
          const contractInfo: CodingContractInfo = {"hostname": hostnames[i], "filename": ccs[j], "type": typ};

          // Sleep before attempting to prevent immediate freeze on load
          await ns.sleep(5000);
          if (Solvers[typ] && attemptRam <= freeRam() && ns.run("./get/data.ts", {"temporary": true}, ccs[j], hostnames[i], "-p")) {
            // Script writes data to port. Let the solver read it.
            await ns.nextPortWrite(Ports.Contract);
            //ns.alert(hostnames[i] + ": " + ccs[j] + ": " + type.toString());
            while (attemptRam > freeRam())
              await ns.sleep(1000);
            const pid = ns.run(Solvers[typ] as string, {"temporary": true}, ccs[j], hostnames[i], "-p");
            if (pid) {
              // Can't await port write because it might not happen while debugging
              await ns.sleep(5000);
              while (ns.isRunning(pid) || ns.isRunning("./attempt.js", undefined, ccs[j], hostnames[i]))
                await ns.sleep(100);
              let reward = ns.readPort(Ports.Contract);
              if (reward != "NULL PORT DATA") {
                if (reward == "") {
                  reward = "Contract failed!";
                  failedTypes.add(typ);
                  outstanding.push(contractInfo);
                  ns.toast(reward, ns.enums.ToastVariant.ERROR);
                }
                else if (typeof reward == "string" && reward.startsWith("Gained")) {
                  let rewardMoney = reward[7] == "$" ? parseFloat(reward.slice(8)) : 0;
                  if (rewardMoney)
                    switch (reward[reward.length - 1]) {
                      case "k": rewardMoney *= 1000; break;
                      case "m": rewardMoney *= 1000000; break;
                      default: break;
                    }

                  if (successStats[typ] === undefined)
                    successStats[typ] = {"numSolved": 0, "moneyGained": 0};
                  ++(successStats[typ] as CodingContractStats).numSolved;
                  (successStats[typ] as CodingContractStats).moneyGained += rewardMoney;
                  moneyGained += rewardMoney;
                  ns.toast("Contract solved! " + reward + ".", ns.enums.ToastVariant.SUCCESS);
                }
                else
                  // attempt.js failed to run, and the 'reward' is actually the answer
                  // No need to toast in that case
                  outstanding.push(contractInfo);
              }
              else {
                outstanding.push(contractInfo);
                ns.toast("Solver for " + typ.toString() + " returned no reward", ns.enums.ToastVariant.WARNING);
              }
            }
          }
          else {
            outstanding.push(contractInfo);
            ns.toast("Couldn't attempt " + typ.toString() + " contract", ns.enums.ToastVariant.WARNING);
          }
        }
      }
    }
    ns.clearLog();
    ns.printRaw(<div style={{"padding": "10px"}}>{renderPrettyLog(outstanding)}</div>);
    await ns.sleep(300000);
  }
}
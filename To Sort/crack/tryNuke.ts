import {Ports} from "lib/util";

export async function main(ns: NS) {
  const target = ns.args[0] as string;
  const srv = ns.getServer(target);
  if (!srv.sshPortOpen && ns.fileExists("BruteSSH.exe"))
    ns.brutessh(target);
  if (!srv.ftpPortOpen && ns.fileExists("FTPCrack.exe"))
    ns.ftpcrack(target);
  if (!srv.smtpPortOpen && ns.fileExists("RelaySMTP.exe"))
    ns.relaysmtp(target);
  if (!srv.httpPortOpen && ns.fileExists("HTTPWorm.exe"))
    ns.httpworm(target);
  if (!srv.sqlPortOpen && ns.fileExists("SQLInject.exe"))
    ns.sqlinject(target);
  ns.writePort(Ports.Crack, (srv.openPortCount ?? 0) >= (srv.numOpenPortsRequired ?? 0) && ns.nuke(target));
}
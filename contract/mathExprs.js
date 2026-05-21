import {Ports} from "lib/util";

const Ops = "\0-+*";

/**
 * op tuple format
 * 0: Result accumulator
 * 1: Digits accumulator
 * 2: Mult accumulator
 * 3: Opcode index
 */

/** @param {NS} ns */
export async function main(ns) {
  /*const flags = ns.flags([["p", false]]);
  if (!flags.p) {
    ns.run("./get/data.ts", 1, ns.args[0], ns.args[1], "-p");
    ns.sleep(20);
  }*/
  const timestamp = new Date().getTime();

  const [str, target] = ns.readPort(Ports.Contract);
  var digits = new Array(str.length);
  var opStack = new Array(str.length);
  var exprs = [];
  var expr = str[0];
  var result;

  digits[0] = parseInt(str[0]);
  opStack[0] = [0, digits[0], 1, Ops.length - 1];
  result = digits[0];
  for (let i = 1; i < digits.length; ++i) {
    digits[i] = parseInt(str[i + 1]);
    result *= 10;
    result += digits[i];
    opStack[i] = [0, result, 1, 0];
    expr += Ops[0] + str[i + 1];
  }

  while (false && opStack.length) {
    let index;

    if (opStack.length == digits.length && result == target)
      exprs.push(expr.replaceAll(Ops[0], ""));

    while (opStack[opStack.length - 1][2] == Ops.length - 1) {
      const prevOp = opStack.pop();
      result = prevOp[0];
    }
    while (opStack.length < digits.length) {
      index = opStack.length - 1;
      opStack.push([opStack[index][0], opStack[index][1] * 10, opStack[index][2], 0]);
      if (opStack[++index][1] < 0)
        opStack[index][1] -= digits[index];
      else
        opStack[index][1] += digits[index];
    }
    index = opStack.length - 1;
    result = opStack[index][0] + opStack[index][1] * opStack[index][2];
  }

  //ns.tprintf("%d valid expressions found", exprs.length);
  //ns.tprintf("%s seconds elapsed", ns.formatNumber((new Date().getTime() - timestamp) / 1000));
  //ns.writePort(Ports.Contract, exprs);
  //ns.spawn("./attempt.js", {"spawnDelay": 0, "temporary": true}, ns.args[0], ns.args[1]);
  /*if (!flags.p)
    ns.clearPort(Ports.Contract);*/
}
import {initEnums} from "lib/nsEnums";
import {main as genResetInfo} from "lib/genInfo/reset";

export async function main(ns: NS) {
  // initEnums needs to be synchronous and called first to prevent errors
  initEnums(ns);
  await genResetInfo(ns);
}
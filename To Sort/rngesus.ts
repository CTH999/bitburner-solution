// Run this, place a test bet in roulette, leave the casino, return,
// and bet everything on the number that won

export async function main(ns: NS) {
  const realGetTime = Date.prototype.getTime;
  const dt = new Date().getTime();
  Date.prototype.getTime = () => dt;
  ns.toast("RNGesus smiles upon you!");
  await ns.sleep(300000);
  Date.prototype.getTime = realGetTime;
  ns.toast("RNGesus disabled", "warning");
}
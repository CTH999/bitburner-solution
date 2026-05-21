export async function main(ns: NS) {
  ns.spawn(
    ns.fileExists("Formulas.exe", "home") ? "./nodeFormulasLoop.js" : "./naiveLoop.js",
    {"spawnDelay": 0}
  );
}
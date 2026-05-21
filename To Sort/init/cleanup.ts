//TODO: DRY this

const TempFiles = [
  "/lib/resetInfo.json",
  "/crack/deployment.json",
  "/hack/hackParams.json",
  "/gang/gangInfo.json",
  "/gang/memberInfo.json",
  "/gang/taskInfo.json",
  "/gang/state.json",
  "/stock/symbolInfo.json",
  "/stock/get/askPrices.json",
  "/stock/get/poorManForecast.json"
];

export async function main(ns: NS) {
  for (const file of TempFiles)
    ns.rm(file);
}
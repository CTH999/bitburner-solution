export const TaskInfoFile = "/gang/info/tasks.json";

export function getTaskInfo(ns: NS) {
  return JSON.parse(ns.read(TaskInfoFile)) as Array<GangTaskStats>;
}

export async function main(ns: NS) {
  ns.write(TaskInfoFile, JSON.stringify(ns.gang.getTaskNames().map(ns.gang.getTaskStats)), "w");
}
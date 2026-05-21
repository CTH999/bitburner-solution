export var CityName: NS["enums"]["CityName"];
export var CodingContractName: NS["enums"]["CodingContractName"];
export var CompanyName: NS["enums"]["CompanyName"];
export var CrimeType: NS["enums"]["CrimeType"];
export var FactionName: NS["enums"]["FactionName"];
export var FactionWorkType: NS["enums"]["FactionWorkType"];
export var JobField: NS["enums"]["JobField"];
export var JobName: NS["enums"]["JobName"];
export var LocationName: NS["enums"]["LocationName"];

export enum BitNode {
  SourceGenesis = 1,
  RiseOfTheUnderworld,
  Corporotocracy,
  Singularity,
  ArtificialIntelligence,
  Bladeburners,
  Bladeburners2079,
  GhostOfWallStreet,
  Hacktocracy,
  DigitalCarbon,
  BigCrash,
  Recursion,
  Lunatics,
  IPvGOSubnetTakeover
}

export enum WorkType {
  Company = "COMPANY",
  CreateProgram = "CREATE_PROGRAM",
  Faction = "FACTION"
}

export function initEnums(ns: NS) {
  CityName = ns.enums.CityName;
  CodingContractName = ns.enums.CodingContractName;
  CompanyName = ns.enums.CompanyName;
  CrimeType = ns.enums.CrimeType;
  FactionName = ns.enums.FactionName;
  FactionWorkType = ns.enums.FactionWorkType;
  JobField = ns.enums.JobField;
  JobName = ns.enums.JobName;
  LocationName = ns.enums.LocationName;
}

export async function main(ns: NS) { initEnums(ns); }
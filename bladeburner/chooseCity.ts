import {Ports} from "lib/util";
import {ExecutorJob} from "daemons/executor";
import {BladeburnerChaosThreshold, BladeburnerPopThreshold} from "bladeburner/util";
import {bladeburnerPlayer} from "bladeburner/genInfo/player";
import {BladeburnerCity, bladeburnerCities} from "bladeburner/genInfo/cities";

type CityEntry = [CityName, BladeburnerCity];

function chaosLow(c: CityEntry) {
  return c[1].chaos <= BladeburnerChaosThreshold * 1.1;
}

function popAboveThreshold(c: CityEntry) {
  return c[1].estimatedPopulation >= BladeburnerPopThreshold;
}

function popComparator(a: CityEntry, b: CityEntry) {
  return a[1].estimatedPopulation - b[1].estimatedPopulation
}

export async function main(ns: NS) {
  var destination;

  // First, prefer cities with at least one community
  var candidates: Array<CityEntry> =
    Object.entries(bladeburnerCities).filter(c => c[1].communities) as typeof candidates;
  if (!candidates.length)
    candidates = Object.entries(bladeburnerCities) as typeof candidates;

  // Second, prefer cities with low chaos
  // Is this actually a good idea? Liable to get stuck in one city if Incite Violence is ever used.
  // Probably won't happen, but even so, maybe reconsider.
  if (candidates.findIndex(chaosLow) >= 0)
    candidates = candidates.filter(chaosLow);

  // Third, find the city closest to the threshold at which population affects success (above it if possible)
  if (candidates.findIndex(popAboveThreshold) >= 0) {
    candidates = candidates.filter(popAboveThreshold);
    destination = candidates.toSorted(popComparator)[0][0];
  }
  else
    destination = candidates.toSorted(popComparator)[candidates.length - 1][0];

  if (bladeburnerPlayer.bladeburner.city != destination) {
    ns.print("INFO: Traveling to ", destination, " from ", bladeburnerPlayer.bladeburner.city, ".");
    ns.writePort(Ports.Exec, {
      "script": "/bladeburner/travel.ts",
      "hostname": ns.self().server,
      "args": [destination],
      "threadOrOptions": {"temporary": true},
      "retry": true
    } as ExecutorJob);
    bladeburnerPlayer.bladeburner.city = destination;
  }
  else
    ns.print("INFO: Staying in ", destination, ".");
}

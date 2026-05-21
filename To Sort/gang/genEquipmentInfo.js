const EquipmentInfoFile = "/gang/info/equipment.json";

export function getEquipmentInfo(ns) {
  return JSON.parse(ns.read(EquipmentInfoFile));
}

/** @param {NS} ns */
export async function main(ns) {
  var equipment = {
    "stats": {},
    "cost": {},
    "augHack": [],
    "augCombat": [],
    "Weapon": [],
    "Armor": [],
    "Rootkit": [],
    "Vehicle": []
  };
  ns.gang.getEquipmentNames().forEach((eq) => {
    var type = ns.gang.getEquipmentType(eq);
    const cost = ns.gang.getEquipmentCost(eq);

    equipment.stats[eq] = ns.gang.getEquipmentStats(eq);
    equipment.cost[eq] = cost;

    if (type == "Augmentation")
      type = equipment.stats[eq]["hack"] ? "augHack" : "augCombat";

    equipment[type].push(eq);
  });
  // Concatenation here is done in order of purchasing priority
  equipment.eqHack = equipment.Rootkit.concat(equipment.Vehicle);
  equipment.eqCombat = equipment.Armor.concat(equipment.Weapon, equipment.Vehicle, equipment.Rootkit);
  equipment.augCombat = equipment.augCombat.concat(equipment.augHack); // All stats contribute to combat effectiveness
  delete equipment.Weapon;
  delete equipment.Armor;
  delete equipment.Rootkit;
  delete equipment.Vehicle;
  ns.write(EquipmentInfoFile, JSON.stringify(equipment), "w");
}
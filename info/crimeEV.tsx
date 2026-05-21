import {CrimeType} from "lib/nsEnums";

const Times: Record<CrimeType, number> = {
  [CrimeType.assassination]: 300,
  [CrimeType.bondForgery]: 300,
  [CrimeType.dealDrugs]: 10,
  [CrimeType.grandTheftAuto]: 80,
  [CrimeType.heist]: 600,
  [CrimeType.homicide]: 3,
  [CrimeType.kidnap]: 120,
  [CrimeType.larceny]: 90,
  [CrimeType.mug]: 4,
  [CrimeType.robStore]: 60,
  [CrimeType.shoplift]: 2,
  [CrimeType.traffickArms]: 40
};

const Karma: Record<CrimeType, number> = {
  [CrimeType.assassination]: 10,
  [CrimeType.bondForgery]: 0.1,
  [CrimeType.dealDrugs]: 0.5,
  [CrimeType.grandTheftAuto]: 5,
  [CrimeType.heist]: 15,
  [CrimeType.homicide]: 3,
  [CrimeType.kidnap]: 6,
  [CrimeType.larceny]: 1.5,
  [CrimeType.mug]: 0.25,
  [CrimeType.robStore]: 0.5,
  [CrimeType.shoplift]: 0.1,
  [CrimeType.traffickArms]: 1
};

export async function main(ns: NS) {
  const player = ns.getPlayer();

  var styles: any = ns.ui.getTheme();
  styles = {
    "money": {"color": styles.money},
    "hackExp": {"color": styles["hack"]},
    "combat": {"color": styles.combat},
    "chaExp": {"color": styles.cha},
    "intExp": {"color": styles.int}
  };
  styles.strExp = styles.combat;
  styles.defExp = styles.combat;
  styles.dexExp = styles.combat;
  styles.agiExp = styles.combat;

  function adjExp(typ: CrimeType, exp: number, chance: number, failRatio?: number) {
    failRatio ??= 0.25;
    return exp * (chance + (1 - chance) * failRatio) / Times[typ];
  }

  const evRows = Object.values(ns.enums.CrimeType).map((typ: CrimeType) => {
    const chance = ns.formulas.work.crimeSuccessChance(player, typ);
    let gains = ns.formulas.work.crimeGains(player, typ);
    let cells = [<th>{typ.toString()}</th>, <td>{ns.formatPercent(chance)}</td>, <td style={styles.money}>{ns.formatNumber(adjExp(typ, gains.money, chance, 0))}</td>];

    cells = cells.concat(["hackExp", "strExp", "defExp", "dexExp", "agiExp", "chaExp", "intExp"].map((stat: string) => {
      gains[stat as keyof WorkStats] = adjExp(typ, gains[stat as keyof WorkStats], chance, stat == "intExp" ? 0 : undefined);
      return <td style={styles[stat]}>{ns.formatNumber(gains[stat as keyof WorkStats])}</td>;
    }));
    cells.push(<span>{ns.formatNumber(adjExp(typ, Karma[typ as CrimeType], chance))}</span>);
    return <tr>{cells}</tr>;
  });

  ns.tprintRaw(
    <div><table style={{"border-spacing": "10px"}}>
      <thead><tr><th>Crime</th><th>Chance</th><th style={styles.money}>Money</th><th style={styles.hackExp}>Hack</th><th style={styles.combat}>Str</th><th style={styles.combat}>Def</th><th style={styles.combat}>Dex</th><th style={styles.combat}>Agi</th><th style={styles.chaExp}>Cha</th><th style={styles.intExp}>Int</th><th>Karma</th></tr></thead>
      <tbody>{evRows}</tbody>
    </table></div>
  );
  ns.asleep(20);
}
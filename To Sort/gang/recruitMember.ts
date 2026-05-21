export async function main(ns: NS) {
  const recruit = ns.args[0] as string;
  if (ns.gang.recruitMember(recruit))
    ns.toast("Recruited " + recruit);
}
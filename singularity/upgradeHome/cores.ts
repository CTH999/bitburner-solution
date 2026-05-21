export async function main(ns: NS) {
  if (ns.singularity.upgradeHomeCores())
    ns.toast("Upgraded home cores", ns.enums.ToastVariant.SUCCESS);
  else if (!ns.self().parent)
    ns.tprint("ERROR: Couldn't upgrade home cores");
}
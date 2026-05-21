export async function main(ns: NS) {
  if (ns.singularity.upgradeHomeRam())
    ns.toast("Upgraded home RAM", ns.enums.ToastVariant.SUCCESS);
  else if (!ns.self().parent)
    ns.tprint("ERROR: Couldn't upgrade home RAM");
}
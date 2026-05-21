export async function main(ns: NS) {
  const member = ns.args[0] as string;
  if (ns.gang.ascendMember(member))
    ns.toast(member + " has ascended!", ns.enums.ToastVariant.SUCCESS);
}
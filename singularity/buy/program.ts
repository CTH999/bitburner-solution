export async function main(ns: NS) {
  const program = (ns.args as Array<string>)[0];
  if (ns.singularity.purchaseProgram(program))
    ns.toast("Bought " + program, ns.enums.ToastVariant.SUCCESS);
  else if (!ns.self().parent)
    ns.tprint("ERROR: Couldn't purchase " + program);
}
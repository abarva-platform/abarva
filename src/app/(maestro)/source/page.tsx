import { redirect } from "next/navigation";
export const metadata = { title: "Source · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * Source landing.
 *
 * The governed Source Workspace (native-canvas explorer bound to
 * source.contract_360 / source.vendor_contract_portfolio) is the canonical
 * Source entry. Historical portfolio and preview routes redirect here for
 * existing links so operators do not enter a second Source home.
 */
export default function SourcePage() {
  redirect("/source/workspace");
}

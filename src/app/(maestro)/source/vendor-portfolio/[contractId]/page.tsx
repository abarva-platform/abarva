import { redirect } from "next/navigation";

export const metadata = { title: "Source Workspace · AbarVa" };
export const dynamic = "force-dynamic";

const SOURCE_WORKSPACE_ROUTE = "/source/preview/workspace";

/**
 * Archived legacy Contract 360 route.
 *
 * Source workspace is the canonical Vendor 360 surface. Preserve the old
 * contract id as a query parameter for bookmarks and future workspace focus.
 */
export default async function ArchivedSourceContract360Route({
  params,
  searchParams,
}: {
  params: Promise<{ contractId: string }>;
  searchParams: Promise<{ asOf?: string; client?: string }>;
}) {
  const [{ contractId: rawContractId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const next = new URLSearchParams();
  const contractId = decodeURIComponent(rawContractId).trim();
  const asOf = query.asOf?.trim();
  const client = query.client?.trim();
  if (contractId) next.set("contractId", contractId);
  if (asOf) next.set("asOf", asOf);
  if (client) next.set("client", client);

  redirect(`${SOURCE_WORKSPACE_ROUTE}?${next.toString()}`);
}

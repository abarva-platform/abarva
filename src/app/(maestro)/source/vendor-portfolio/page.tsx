import { redirect } from "next/navigation";

export const metadata = {
  title: "Source Workspace · AbarVa",
};
export const dynamic = "force-dynamic";

const SOURCE_WORKSPACE_ROUTE = "/source/preview/workspace";

/**
 * Archived legacy Vendor & Contract Portfolio route.
 *
 * The Source workspace is now the canonical Vendor 360 surface. Keep this
 * shell only so old bookmarks cannot render a stale portfolio story.
 */
export default async function ArchivedSourceVendorPortfolioRoute({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string; client?: string }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  const asOf = params.asOf?.trim();
  const client = params.client?.trim();
  if (asOf) next.set("asOf", asOf);
  if (client) next.set("client", client);

  redirect(
    next.size > 0
      ? `${SOURCE_WORKSPACE_ROUTE}?${next.toString()}`
      : SOURCE_WORKSPACE_ROUTE,
  );
}

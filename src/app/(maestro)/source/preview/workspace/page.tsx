import { redirect } from "next/navigation";

export const metadata = {
  title: "Source Workspace · AbarVa",
};

export const dynamic = "force-dynamic";

/**
 * Compatibility route for historical proof links.
 *
 * The governed commercial workspace is now a product route at /source/workspace;
 * keep this redirect so older proof URLs and bookmarks continue to resolve
 * without leaving "preview" in the operator-facing address bar.
 */
export default async function SourceWorkspacePreviewRedirect({
  searchParams,
}: {
  searchParams: Promise<{
    asOf?: string;
    client?: string;
    contractId?: string;
    contractTab?: string;
    provider?: string;
    sourceProvider?: string;
    tab?: string;
  }>;
}) {
  const query = new URLSearchParams();
  const params = await searchParams;
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim().length > 0) {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  redirect(`/source/workspace${queryString ? `?${queryString}` : ""}`);
}

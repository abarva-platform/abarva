// `/tower/command` — kept as a permanent alias of `/tower`.
//
// This was the Command Center's own route while it was being built alongside the
// previous Tower. Since 2026-07-23 the Command Center IS `/tower`, so this route
// forwards rather than serving a second copy — one page, one URL, but links,
// bookmarks and the E2E spec written against `/tower/command` keep working.
//
// Query parameters are preserved, so `?tab=` deep links and `?client=` tenant
// switching survive the redirect.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TowerCommandAliasPage({
  searchParams,
}: PageProps = {}) {
  const resolved = (await searchParams) ?? {};
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/tower?${query}` : "/tower");
}

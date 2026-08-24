import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { HomePreviewAppRoot } from "@/components/home/preview/HomePreviewAppRoot";
import {
  isFoundationPreviewOperatorSession,
} from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import {
  getHomeReviewBundle,
  isHomePreviewTenantKey,
  HOME_PREVIEW_TENANT_KEYS,
} from "@/lib/home/preview/golden-snapshot";
import { getHomeEclProjectionBundle } from "@/lib/home/preview/ecl-projection-bundle";

/**
 * Production-faithful preview of the new eight-chapter Home experience -- not a static prototype.
 * Renders the exact ChapterView/EnterpriseThesis payload contract the data-build pipeline
 * produces (scripts/data-build/build-home-chapters.ts), against the two tenants' accepted golden
 * snapshots (src/lib/home/preview/golden-snapshots/*.json) rather than a live model call or the
 * database. This is the review surface for the acceptance question the workstream defined: would
 * a newly appointed CXO spend 20 minutes here and come away feeling Abarva understands their
 * enterprise exceptionally well? It is not wired to /home, does not write to the database, and
 * does not replace the legacy Home reader -- see docs/releases/records/2026-08-19-home-chapter-writer-foundation.md.
 */
export const metadata: Metadata = {
  title: "Home (preview) | AbarVa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; provider?: string }>;
}) {
  await connection();

  const hasPlatformAdmin = await isPlatformAdminSession();
  const hasFoundationOperator = await isFoundationPreviewOperatorSession();
  if (!hasPlatformAdmin && !hasFoundationOperator) {
    notFound();
  }

  // One tenant per render. Reviewers pick with ?tenant=<key>; the page never loads a second
  // tenant's bundle, so no other client's data reaches the response and the UI carries no
  // cross-client control. A client-facing surface must look tenant-isolated because it is.
  const { tenant, provider } = await searchParams;
  const tenantKey = tenant && isHomePreviewTenantKey(tenant) ? tenant : HOME_PREVIEW_TENANT_KEYS[0];

  const bundle = provider === "ecl_projection_db"
    ? await getHomeEclProjectionBundle(tenantKey)
    : getHomeReviewBundle(tenantKey);
  if (!bundle) {
    // Fail loudly and specifically rather than rendering a blank page -- a missing golden
    // snapshot file is a real setup defect, not something to paper over with an empty state.
    throw new Error(`Home preview: missing golden snapshot for ${tenantKey}. Expected a file under src/lib/home/preview/golden-snapshots/.`);
  }

  return (
    <AppShell surface="home" topBarProps={{ context: "Home preview — candidate, not yet reviewed" }}>
      <HomePreviewAppRoot bundle={bundle} tenantKey={tenantKey} />
    </AppShell>
  );
}

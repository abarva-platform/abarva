"use client";

import { HomeV4App } from "@/components/home/v4/HomeV4App";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

/** Client boundary for one tenant's preview. Deliberately holds no tenant-switching state and
 * receives only the one bundle it renders: a client-facing surface must not carry a control that
 * implies another client's data is reachable, and the other tenant's payload should never be in
 * the response at all. Reviewers select a tenant with `?tenant=<key>` on the route.
 *
 * Renders Home v4 ("Record and Reading"). The previous chapter layout it replaces is still on
 * disk under `components/home/preview/` -- deleting it is a separate, later step, after v4 has
 * been reviewed here and `/home` has been repointed. Two renderable Homes is a temporary state,
 * not the destination. */
export function HomePreviewAppRoot({
  bundle,
  tenantKey,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
}) {
  return <HomeV4App bundle={bundle} tenantKey={tenantKey} />;
}

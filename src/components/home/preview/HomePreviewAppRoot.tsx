"use client";

import { HomePreviewApp } from "./HomePreviewApp";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

/** Client boundary for one tenant's preview. Deliberately holds no tenant-switching state and
 * receives only the one bundle it renders: a client-facing surface must not carry a control that
 * implies another client's data is reachable, and the other tenant's payload should never be in
 * the response at all. Reviewers select a tenant with `?tenant=<key>` on the route. */
export function HomePreviewAppRoot({
  bundle,
  tenantKey,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
}) {
  return <HomePreviewApp bundle={bundle} tenantKey={tenantKey} />;
}

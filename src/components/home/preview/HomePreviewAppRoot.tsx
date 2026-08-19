"use client";

import { useState } from "react";

import { HomePreviewApp } from "./HomePreviewApp";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

/** Client boundary that owns which tenant is currently shown, so switching between the two
 * accepted tenants is instant (both golden snapshots are already loaded server-side) rather than
 * a full page navigation. */
export function HomePreviewAppRoot({
  bundles,
}: {
  bundles: Record<HomePreviewTenantKey, HomeReviewBundle>;
}) {
  const [tenantKey, setTenantKey] = useState<HomePreviewTenantKey>("meridian-health");
  return <HomePreviewApp bundle={bundles[tenantKey]} tenantKey={tenantKey} onTenantChange={setTenantKey} />;
}

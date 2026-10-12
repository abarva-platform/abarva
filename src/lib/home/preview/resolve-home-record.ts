import "server-only";

import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "./ecl-projection-bundle";
import {
  getHomeReviewBundle,
  type HomePreviewTenantKey,
} from "./golden-snapshot";
import { homeRecordSourceToken } from "./record-source-token";
import type { HomeRecordRenderSource } from "./types";

export async function resolveHomeRecord(
  tenantKey: HomePreviewTenantKey,
  requestedProvider?: string,
) {
  const served = isEclProductProvider(
    resolveEclProductProvider(requestedProvider),
  )
    ? await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey)
    : null;
  const bundle = served?.bundle ?? getHomeReviewBundle(tenantKey);
  if (!bundle) return null;
  const recordSource: HomeRecordRenderSource = served?.recordSource ?? {
    kind: "reviewed_snapshot",
    canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
  };
  return {
    bundle,
    recordSource,
    recordToken: homeRecordSourceToken(tenantKey, recordSource),
  };
}

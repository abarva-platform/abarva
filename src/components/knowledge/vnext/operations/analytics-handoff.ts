/**
 * "Analyze in Superset" handoff — builds a baseline-bound deep link from the lens
 * to the governed Superset dashboard. This is UI/UX only: it constructs a URL to a
 * Superset instance the FOUNDATION lane stands up and connects; it never connects
 * to any data itself.
 *
 * Dormant by default: when `NEXT_PUBLIC_SUPERSET_BASE_URL` is not configured the
 * handoff returns null and the button renders disabled. Only governed operational
 * identifiers (tenant key, baseline ref, projection version) travel in the link —
 * never personal data, never metric values.
 */

import type { LensBaselineMeta } from "./useOperationsLens";

/** The Superset dashboard slug authored in clients/shared/22-operations-vendor-analytics. */
export const SUPERSET_DASHBOARD_SLUG = "vendor-operational-exposure";

export function supersetBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPERSET_BASE_URL;
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(trimmed) ? trimmed : null;
}

/**
 * Build the deep link, or null when Superset is not configured (dormant). The
 * dashboard reads the baseline itself; the params only preselect the same
 * tenant/baseline so the analyst lands on matching, reconcilable data.
 */
export function buildSupersetDeepLink(meta: Pick<LensBaselineMeta, "tenantKey" | "knowledgeBaselineRef" | "projectionContractVersion">): string | null {
  const base = supersetBaseUrl();
  if (!base) return null;
  const params = new URLSearchParams({
    tenant_key: meta.tenantKey,
    knowledge_baseline_ref: meta.knowledgeBaselineRef,
    projection_contract_version: meta.projectionContractVersion,
  });
  return `${base}/superset/dashboard/${SUPERSET_DASHBOARD_SLUG}/?${params.toString()}`;
}

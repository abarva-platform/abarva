// Shared helpers for /api/v1/programs/:programId/pricing/** routes.
//
// Move-scoped (not admin-scoped): every route here follows the same
// `requireTenancy()` + `getProgramById(ctx, programId)` (tenant-scoped
// Move lookup, 404 if not visible) + `{error, detail}` JSON convention as
// the rest of `src/app/api/v1/programs/[programId]/**` — see
// `phase-capture/route.ts` for the precedent this copies. This is
// deliberately NOT the admin `requireTenancy()`-only /
// `tenancyErrorResponse()` pattern from `api/admin/pricing/rate-cards/route.ts`,
// which has no Move-membership concept at all.

import { getProgramById } from "@/lib/programs/queries";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { getEstimate } from "@/lib/pricing/moves-workflow";
import type { PricingEstimateInputRow, PricingEstimateRow, PricingEstimateSnapshotRow } from "@/lib/pricing/types";

export class MissingTenantClientKeyError extends Error {
  constructor() {
    super("missing_tenant_client_key: requireTenancy() resolved a session with no clientKey — cannot canonicalize a pricing tenant key");
    this.name = "MissingTenantClientKeyError";
  }
}

/** Canonical hyphenated tenant key for pricing_* tables — canonicalized at this write/read boundary, never assumed equal to the session ClientKey (PRICING_ENGINE_CURRENT_STATE.md §10). */
export function tenantKeyFor(ctx: TenancyCtx): string {
  if (!ctx.clientKey) throw new MissingTenantClientKeyError();
  return canonicalTenantKey(ctx.clientKey);
}

/** Loads the Move, tenant-scoped (404 if not visible to this tenant/user) — same pattern as every other programs/:programId route. */
export async function requireOwnedMove(ctx: TenancyCtx, programId: string) {
  return getProgramById(ctx, programId);
}

export type EstimateOwnershipResult =
  | { ok: true; estimate: PricingEstimateRow }
  | { ok: false; status: number; error: string; detail?: string };

/**
 * Loads an estimate and verifies it belongs to BOTH this Move (`move_id`)
 * and this tenant (`tenant_key`) — a mismatch on either returns `not_found`
 * rather than leaking cross-tenant/cross-Move existence, matching
 * `getProgramById`'s own tenant-scoped-404 convention.
 */
export async function requireOwnedEstimate(
  ctx: TenancyCtx,
  programId: string,
  estimateId: string,
): Promise<EstimateOwnershipResult> {
  const estimate = await getEstimate(estimateId);
  if (!estimate) return { ok: false, status: 404, error: "not_found" };
  const tenantKey = tenantKeyFor(ctx);
  if (estimate.tenant_key !== tenantKey || estimate.move_id !== programId) {
    return { ok: false, status: 404, error: "not_found" };
  }
  return { ok: true, estimate };
}

/** snake_case DB row -> camelCase JSON for the client. */
export function estimateToJson(row: PricingEstimateRow) {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    moveId: row.move_id,
    scenarioGroupId: row.scenario_group_id,
    scenarioName: row.scenario_name,
    scenarioKey: row.scenario_key,
    archetypeCode: row.archetype_code,
    modelVersion: row.model_version,
    currency: row.currency,
    targetStartDate: row.target_start_date,
    targetDurationWeeks: row.target_duration_weeks,
    selectedRateCardId: row.selected_rate_card_id,
    status: row.status,
    lastRunId: row.last_run_id,
    lastRunAt: row.last_run_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** snake_case DB row -> camelCase JSON for the client (PR6). `totals` is passed through as-is — it is already the safe `SnapshotTotalsPayload` shape (see `effort-engine/snapshot-service.ts`), never raw line items. */
export function snapshotToJson(row: PricingEstimateSnapshotRow) {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    moveId: row.move_id,
    estimateId: row.estimate_id,
    modelVersion: row.model_version,
    taxonomyVersion: row.taxonomy_version,
    rateCardVersionId: row.rate_card_version_id,
    clientProfileVersionId: row.client_profile_version_id,
    upstreamScopeFingerprint: row.upstream_scope_fingerprint,
    totals: row.totals,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    approvalRationale: row.approval_rationale,
    createdAt: row.created_at,
  };
}

export function inputToJson(row: PricingEstimateInputRow) {
  return {
    inputKey: row.input_key,
    value: row.value,
    unit: row.unit,
    required: row.required,
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    confidence: row.confidence,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    overrideReason: row.override_reason,
    modelVersion: row.model_version,
    updatedAt: row.updated_at,
  };
}

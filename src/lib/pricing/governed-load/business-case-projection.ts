/**
 * Nexus Pricing Engine — PR6 business-case-safe pricing summary (brief
 * §9.7).
 *
 * Sibling to `governed-projection.ts`'s `buildGovernedPricingProjection`
 * (PR3) — same discipline, applied to an APPROVED
 * `pricing_estimate_snapshots` row instead of the tenant's live rate card:
 * project ONLY the safe summary fields a future Move/P4 business-case
 * consumer is allowed to see (model/taxonomy/rate-card versions,
 * low/expected/high totals, top assumptions, top uncertainty drivers,
 * approval identity/timestamp) — never the full `pricing_estimate_line_items`
 * rows.
 *
 * IMPORTANT — same scope boundary as `governed-projection.ts`: this
 * function has NO consumer in this PR. It is not called from
 * `src/app/api/v1/moves/board-grade-business-case/route.ts` or any other
 * expert-kernel-consuming path, and it is not wired into
 * `buildValidatedAgentContextBundle` / any agent-context broker. See
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 and the PR6
 * release record: wiring an approved pricing snapshot into the live,
 * currently-shipping business-case route is an explicit, deliberate
 * deviation from a literal reading of brief §9.5/§9.7, reserved for a
 * future PR with its own product sign-off (this function only proves the
 * safe SHAPE exists and is tested — see
 * `__tests__/business-case-projection.test.ts`).
 */
import type { PricingEstimateSnapshotRow } from "../types";
import type { SnapshotTotalsPayload } from "../effort-engine/snapshot-service";

export interface BusinessCasePricingSummary {
  snapshotId: string;
  moveId: string;
  tenantKey: string;
  status: PricingEstimateSnapshotRow["status"];
  modelVersion: number | null;
  taxonomyVersion: number | null;
  rateCardVersionId: string | null;
  clientProfileVersionId: string | null;
  currency: string | null;
  lowCents: number | null;
  expectedCents: number | null;
  highCents: number | null;
  topAssumptions: string[];
  topUncertaintyDrivers: string[];
  approvedBy: string | null;
  approvedAt: string | null;
  approvalRationale: string | null;
}

/**
 * Reads back exactly the `SnapshotTotalsPayload` shape
 * `effort-engine/snapshot-service.ts`'s `createEstimateSnapshot` writes into
 * `totals` — the single source of truth for that JSONB shape lives there,
 * this function only projects the safe subset of it (plus the row's own
 * approval columns) outward. Deliberately does NOT read/expose
 * `totalLaborCostCents` / `totalManualCostCents` / `gapCount` / raw hours —
 * brief §9.7 asks for "low/expected/high totals", not the granular
 * labor/manual/hours breakdown a full drilldown view would need; narrower
 * than what is technically available is the safe default for a projection
 * function, matching `buildGovernedPricingProjection`'s "never the full
 * rate lines" discipline.
 */
export function buildBusinessCasePricingSummary(
  snapshot: PricingEstimateSnapshotRow,
): BusinessCasePricingSummary {
  const totals = snapshot.totals as unknown as Partial<SnapshotTotalsPayload> | null;

  return {
    snapshotId: snapshot.id,
    moveId: snapshot.move_id,
    tenantKey: snapshot.tenant_key,
    status: snapshot.status,
    modelVersion: snapshot.model_version,
    taxonomyVersion: snapshot.taxonomy_version,
    rateCardVersionId: snapshot.rate_card_version_id,
    clientProfileVersionId: snapshot.client_profile_version_id,
    currency: totals?.currency ?? null,
    lowCents: totals?.range?.lowCents ?? null,
    expectedCents: totals?.range?.expectedCents ?? null,
    highCents: totals?.range?.highCents ?? null,
    topAssumptions: totals?.topAssumptions ?? [],
    topUncertaintyDrivers: totals?.topUncertaintyDrivers ?? [],
    approvedBy: snapshot.approved_by,
    approvedAt: snapshot.approved_at,
    approvalRationale: snapshot.approval_rationale,
  };
}

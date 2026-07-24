import { describe, expect, it } from "@jest/globals";
import { buildBusinessCasePricingSummary } from "../business-case-projection";
import type { PricingEstimateSnapshotRow } from "../../types";
import type { SnapshotTotalsPayload } from "../../effort-engine/snapshot-service";

function totalsPayload(overrides: Partial<SnapshotTotalsPayload> = {}): SnapshotTotalsPayload {
  return {
    currency: "USD",
    totalRawHours: 1000,
    totalExpectedHours: 950,
    totalLaborCostCents: 50_000_00,
    totalManualCostCents: 5_000_00,
    totalCostCents: 55_000_00,
    gapCount: 0,
    range: {
      policyCode: "RANGE-DEFAULT",
      policyName: "Default range policy",
      score: 0.5,
      lowCents: 44_000_00,
      expectedCents: 55_000_00,
      highCents: 66_000_00,
    },
    topAssumptions: ["offshore_ratio defaulted to 0.4 (AbarVa default)."],
    topUncertaintyDrivers: ["Scope maturity scored high uncertainty for this estimate."],
    ...overrides,
  };
}

function snapshotRow(overrides: Partial<PricingEstimateSnapshotRow> = {}): PricingEstimateSnapshotRow {
  return {
    id: "snapshot-1",
    tenant_key: "apex-retail",
    move_id: "move-1",
    estimate_id: "estimate-1",
    model_version: 1,
    taxonomy_version: 1,
    rate_card_version_id: "rate-card-1",
    client_profile_version_id: null,
    upstream_scope_fingerprint: "fingerprint-hash",
    totals: totalsPayload() as unknown as Record<string, unknown>,
    status: "approved",
    approved_by: "approver@abarva.ai",
    approved_at: "2026-07-24T00:00:00.000Z",
    approval_rationale: "Reviewed against Move charter; numbers hold up.",
    created_at: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildBusinessCasePricingSummary", () => {
  it("projects the safe summary shape — versions, low/expected/high totals, top assumptions/drivers, approval identity", () => {
    const summary = buildBusinessCasePricingSummary(snapshotRow());

    expect(summary).toEqual({
      snapshotId: "snapshot-1",
      moveId: "move-1",
      tenantKey: "apex-retail",
      status: "approved",
      modelVersion: 1,
      taxonomyVersion: 1,
      rateCardVersionId: "rate-card-1",
      clientProfileVersionId: null,
      currency: "USD",
      lowCents: 44_000_00,
      expectedCents: 55_000_00,
      highCents: 66_000_00,
      topAssumptions: ["offshore_ratio defaulted to 0.4 (AbarVa default)."],
      topUncertaintyDrivers: ["Scope maturity scored high uncertainty for this estimate."],
      approvedBy: "approver@abarva.ai",
      approvedAt: "2026-07-24T00:00:00.000Z",
      approvalRationale: "Reviewed against Move charter; numbers hold up.",
    });
  });

  it("does NOT include raw line items or any per-role/per-activity-pack breakdown — only the safe summary fields", () => {
    const summary = buildBusinessCasePricingSummary(snapshotRow()) as unknown as Record<string, unknown>;

    expect(summary.lineItems).toBeUndefined();
    expect(summary.costByActivityPack).toBeUndefined();
    expect(summary.costByRole).toBeUndefined();
    expect(summary.internalVsExternal).toBeUndefined();
    // Even the granular totals the snapshot itself stores are deliberately
    // excluded from the safe projection (brief §9.7 asks for low/expected/
    // high, not the labor/manual/hours breakdown a drilldown view needs).
    expect(summary.totalLaborCostCents).toBeUndefined();
    expect(summary.totalManualCostCents).toBeUndefined();
    expect(summary.gapCount).toBeUndefined();
  });

  it("degrades gracefully (nulls/empty arrays) when totals is missing/malformed rather than throwing", () => {
    const summary = buildBusinessCasePricingSummary(snapshotRow({ totals: {} }));
    expect(summary.currency).toBeNull();
    expect(summary.lowCents).toBeNull();
    expect(summary.expectedCents).toBeNull();
    expect(summary.highCents).toBeNull();
    expect(summary.topAssumptions).toEqual([]);
    expect(summary.topUncertaintyDrivers).toEqual([]);
  });
});

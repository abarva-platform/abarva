/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's "missing all fallbacks
 * blocks the estimate."
 *
 * All 326 real, committed roles in `datasets/reference/pricing-engine-v1/pricing_roles.csv`
 * currently resolve via at least the `rate_band_default` fallback (PR3's
 * coverage report proved "0 direct / 326 inherited / 0 missing" with no
 * client rate card — see that PR's release record) — so a genuine
 * zero-coverage role does not exist in the real reference pack today. Per
 * this PR7 hardening prompt's own instruction, this test constructs one
 * SYNTHETICALLY: a tiny, hand-built `EffortEnginePack` with one archetype
 * mapped to one activity pack whose role mix references a role that has NO
 * resolvable rate anywhere (no client line, no global line, no rate-band
 * default).
 *
 * Two things are proven here, matching the brief's two-part ask exactly:
 *   1. PR4's real `runEffortEngine` genuinely REFUSES to fabricate a zero
 *      cost for that line — `laborCostCents` stays `null` and the line
 *      carries an honest `gapReason`, and the ENGINE's own total
 *      (`totalLaborCostCents`) excludes it entirely (never adds a phantom
 *      $0 contribution that would look like "priced at zero").
 *   2. A GENUINE gap this hardening pass found and fixed: prior to this PR7
 *      change, nothing stopped an estimate with `gapCount > 0` from being
 *      approved into a permanent, immutable snapshot — `runEstimate` only
 *      ever surfaced the gap as a `topUncertaintyDrivers` disclosure, never
 *      a block. `effort-engine/snapshot-service.ts#createEstimateSnapshot`
 *      now refuses outright (`UnresolvedRateGapError`) when the totals it is
 *      asked to lock in carry ANY unresolved rate gap — proven here against
 *      the REAL totals this synthetic pack's `runEffortEngine` run produces,
 *      not a hand-typed totals object.
 */
import { runEffortEngine } from "../effort-engine";
import { createEstimateSnapshot, UnresolvedRateGapError } from "../snapshot-service";
import type { SnapshotStorePort } from "../snapshot-service";
import type { EffortEnginePack, ResolvedRate } from "../types";
import type { PricingEstimateSnapshotRow } from "../../types";

const MODEL_VERSION = 1;

/** A minimal, self-contained pack: 1 archetype, 2 activity packs (one priced role, one UNPRICED role), so the "everything else still prices normally" half of the proof is real, not vacuous. */
const SYNTHETIC_PACK: EffortEnginePack = {
  modelVersion: MODEL_VERSION,
  archetypes: [
    { model_version: MODEL_VERSION, archetype_code: "ARCH-TEST", archetype_name: "Synthetic test archetype", description: null, status: "active" },
  ],
  activityPacks: [
    { model_version: MODEL_VERSION, activity_pack_code: "AP-PRICED", activity_pack_name: "Priced work", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
    { model_version: MODEL_VERSION, activity_pack_code: "AP-UNPRICED", activity_pack_name: "Unpriced work", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
  ],
  effortDrivers: [
    { model_version: MODEL_VERSION, driver_code: "widget_count", driver_name: "Widget count", unit_label: "widget", description: null, status: "active" },
  ],
  effortRules: [
    { model_version: MODEL_VERSION, activity_pack_code: "AP-PRICED", rule_code: "R-PRICED-1", operation: "fixed_hours", driver_code: null, parameters: { hours: 100 }, classification: "initiative_specific", sequence: 1, status: "active" },
    { model_version: MODEL_VERSION, activity_pack_code: "AP-UNPRICED", rule_code: "R-UNPRICED-1", operation: "fixed_hours", driver_code: null, parameters: { hours: 50 }, classification: "initiative_specific", sequence: 1, status: "active" },
  ],
  roleMix: [
    { model_version: MODEL_VERSION, activity_pack_code: "AP-PRICED", role_code: "ROL-PRICED", allocation_pct: 100, level_hint: null, status: "active" },
    { model_version: MODEL_VERSION, activity_pack_code: "AP-UNPRICED", role_code: "ROL-NO-RATE-COVERAGE", allocation_pct: 100, level_hint: null, status: "active" },
  ],
  archetypeActivityMap: [
    { model_version: MODEL_VERSION, archetype_code: "ARCH-TEST", activity_pack_code: "AP-PRICED", applicability: "required", notes: null, status: "active" },
    { model_version: MODEL_VERSION, archetype_code: "ARCH-TEST", activity_pack_code: "AP-UNPRICED", applicability: "required", notes: null, status: "active" },
  ],
  rangePolicies: [
    { model_version: MODEL_VERSION, policy_code: "RANGE-DEFAULT", policy_name: "Default", min_score: 0, max_score: 10, low_multiplier: 0.8, high_multiplier: 1.2, description: null, status: "active" },
  ],
  agentCosts: [],
};

function buildRates(): Map<string, ResolvedRate> {
  const rates = new Map<string, ResolvedRate>();
  rates.set("ROL-PRICED", {
    resolvedFromScope: "client",
    roleCode: "ROL-PRICED",
    levelCode: null,
    hourlyRateCents: 15_000, // $150/hr
    currency: "USD",
    rateCardVersionId: "card-1",
    gapReason: null,
  });
  // The one role with NO resolvable rate anywhere — matching exactly what
  // `rate-card-resolver.ts#resolveRoleRate` returns for a role with no
  // client line, no global line, and no rate-band default (its `missing`
  // branch), not a hand-invented shape.
  rates.set("ROL-NO-RATE-COVERAGE", {
    resolvedFromScope: "missing",
    roleCode: "ROL-NO-RATE-COVERAGE",
    levelCode: null,
    hourlyRateCents: null,
    currency: "USD",
    rateCardVersionId: null,
    gapReason:
      "no client rate-card line, global rate-card line, or rate-band default resolves role 'ROL-NO-RATE-COVERAGE' — this line's cost is an unpriced gap, not a fabricated number",
  });
  return rates;
}

function makeFakeSnapshotStore(): SnapshotStorePort & { rows: PricingEstimateSnapshotRow[] } {
  const rows: PricingEstimateSnapshotRow[] = [];
  return {
    rows,
    async insertSnapshot(row) {
      rows.push(row);
    },
    async getLatestSnapshotForMove() {
      return null;
    },
  };
}

describe("PR7 — missing rate coverage: the engine refuses to fabricate zero, and approval now blocks", () => {
  it("the unpriced role's line carries a null cost + gapReason, never a fabricated zero", () => {
    const output = runEffortEngine(SYNTHETIC_PACK, {
      archetypeCode: "ARCH-TEST",
      tenantKey: "tenant-synthetic",
      scenarioKey: "traditional",
      scopeDrivers: {},
      rates: buildRates(),
    });

    const unpricedLine = output.lineItems.find((li) => li.roleCode === "ROL-NO-RATE-COVERAGE");
    expect(unpricedLine).toBeDefined();
    expect(unpricedLine!.laborCostCents).toBeNull(); // NOT 0 — an honest gap, not a fabricated number.
    expect(unpricedLine!.gapReason).toEqual(expect.stringContaining("unpriced gap"));

    const pricedLine = output.lineItems.find((li) => li.roleCode === "ROL-PRICED");
    expect(pricedLine).toBeDefined();
    expect(pricedLine!.laborCostCents).toBe(100 * 15_000); // 100h × $150/hr, in cents.

    // The engine's own total EXCLUDES the unpriced line's cost entirely
    // (never adds a phantom $0) — it equals ONLY the priced line's cost.
    expect(output.totals.totalLaborCostCents).toBe(pricedLine!.laborCostCents);
    expect(output.totals.gapCount).toBe(1);
  });

  it("createEstimateSnapshot REJECTS approval when the run's real totals carry this gap (the genuine bug this PR7 pass found and fixed)", async () => {
    const output = runEffortEngine(SYNTHETIC_PACK, {
      archetypeCode: "ARCH-TEST",
      tenantKey: "tenant-synthetic",
      scenarioKey: "traditional",
      scopeDrivers: {},
      rates: buildRates(),
    });
    expect(output.totals.gapCount).toBe(1); // sanity — this test is only meaningful if the gap is real.

    const store = makeFakeSnapshotStore();
    await expect(
      createEstimateSnapshot(
        {
          estimateId: "estimate-synthetic",
          tenantKey: "tenant-synthetic",
          moveId: "move-synthetic",
          archetypeCode: "ARCH-TEST",
          modelVersion: MODEL_VERSION,
          scenarioKey: "traditional",
          currency: "USD",
          totals: output.totals,
          range: {
            policyCode: "RANGE-DEFAULT",
            policyName: "Default",
            score: 5,
            lowCents: Math.round(output.totals.totalCostCents * 0.8),
            expectedCents: output.totals.totalCostCents,
            highCents: Math.round(output.totals.totalCostCents * 1.2),
          },
          topAssumptions: [],
          topUncertaintyDrivers: [`${output.totals.gapCount} line item(s) have an unresolved role rate.`],
          rateCardVersionId: "card-1",
          clientProfileVersionId: null,
          taxonomyVersion: 1,
          inputs: [],
          preparedBy: "preparer-1",
          approvedBy: "approver-1",
          approvalRationale: "Attempting to approve despite a known gap",
        },
        store,
      ),
    ).rejects.toThrow(UnresolvedRateGapError);

    // Nothing was written — the immutable snapshot table never gets an
    // incomplete/dishonest total locked into it.
    expect(store.rows).toHaveLength(0);
  });
});

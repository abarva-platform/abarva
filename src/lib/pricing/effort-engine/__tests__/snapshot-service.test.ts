import { describe, expect, it } from "@jest/globals";
import {
  SelfApprovalViolationError,
  UnresolvedRateGapError,
  checkSnapshotStaleness,
  computeUpstreamScopeFingerprint,
  createEstimateSnapshot,
  getApprovedSnapshotForMove,
  resolvePreparedBy,
  assertSegregationOfDuties,
  toScopeFingerprintInput,
  type EstimateScopeLookupPort,
  type SnapshotCandidate,
  type SnapshotStorePort,
} from "../snapshot-service";
import type {
  PricingEstimateInputRow,
  PricingEstimateRow,
  PricingEstimateSnapshotRow,
} from "../../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function inputRow(
  overrides: Partial<PricingEstimateInputRow>,
): PricingEstimateInputRow {
  return {
    id: "input-id",
    estimate_id: "estimate-1",
    input_key: "integration_count",
    value: 4,
    unit: null,
    required: true,
    source_type: "client_input",
    source_ref: null,
    confidence: null,
    confirmed_by: null,
    confirmed_at: null,
    override_reason: null,
    model_version: 1,
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

function estimateRow(
  overrides: Partial<PricingEstimateRow>,
): PricingEstimateRow {
  return {
    id: "estimate-1",
    tenant_key: "apex-retail",
    move_id: "move-1",
    scenario_group_id: "group-1",
    scenario_name: "Traditional",
    scenario_key: "traditional",
    archetype_code: "ARCH-01",
    model_version: 1,
    currency: "USD",
    target_start_date: null,
    target_duration_weeks: null,
    selected_rate_card_id: "rate-card-1",
    status: "draft",
    last_run_id: "run-1",
    last_run_at: "2026-07-24T00:00:00.000Z",
    created_by: "preparer@abarva.ai",
    created_at: "2026-07-24T00:00:00.000Z",
    updated_at: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

function baseCandidate(
  overrides: Partial<SnapshotCandidate> = {},
): SnapshotCandidate {
  return {
    estimateId: "estimate-1",
    tenantKey: "apex-retail",
    moveId: "move-1",
    archetypeCode: "ARCH-01",
    modelVersion: 1,
    scenarioKey: "traditional",
    currency: "USD",
    totals: {
      totalRawHours: 1000,
      totalExpectedHours: 950,
      totalLaborCostCents: 50_000_00,
      totalManualCostCents: 5_000_00,
      totalCostCents: 55_000_00,
      gapCount: 0,
    },
    range: {
      policyCode: "RANGE-DEFAULT",
      policyName: "Default range policy",
      score: 0.5,
      lowCents: 44_000_00,
      expectedCents: 55_000_00,
      highCents: 66_000_00,
    },
    topAssumptions: ["offshore_ratio defaulted to 0.4 (AbarVa default)."],
    topUncertaintyDrivers: [
      "Scope maturity scored high uncertainty for this estimate.",
    ],
    rateCardVersionId: "rate-card-1",
    clientProfileVersionId: null,
    taxonomyVersion: 1,
    inputs: [
      {
        inputKey: "integration_count",
        value: 4,
        confirmedAt: "2026-07-24T00:00:00.000Z",
        overrideReason: null,
        confidence: null,
      },
    ],
    preparedBy: "preparer@abarva.ai",
    approvedBy: "approver@abarva.ai",
    approvalRationale: "Reviewed against Move charter; numbers hold up.",
    ...overrides,
  };
}

function createFakeSnapshotStore(): SnapshotStorePort & {
  rows: PricingEstimateSnapshotRow[];
} {
  const rows: PricingEstimateSnapshotRow[] = [];
  return {
    rows,
    async insertSnapshot(row) {
      rows.push(row);
    },
    async getLatestSnapshotForMove(moveId, tenantKey) {
      const matches = rows
        .filter((r) => r.move_id === moveId && r.tenant_key === tenantKey)
        .sort((a, b) =>
          a.created_at < b.created_at
            ? 1
            : a.created_at > b.created_at
              ? -1
              : 0,
        );
      return matches[0] ?? null;
    },
  };
}

function createFakeScopeLookup(
  estimates: Map<string, PricingEstimateRow>,
  inputs: Map<string, PricingEstimateInputRow[]>,
): EstimateScopeLookupPort {
  return {
    async getEstimateById(estimateId) {
      return estimates.get(estimateId) ?? null;
    },
    async listEstimateInputs(estimateId) {
      return inputs.get(estimateId) ?? [];
    },
  };
}

// ---------------------------------------------------------------------------
// computeUpstreamScopeFingerprint
// ---------------------------------------------------------------------------

describe("computeUpstreamScopeFingerprint", () => {
  const settledInput = {
    inputKey: "integration_count",
    value: 4,
    confirmedAt: "2026-07-24T00:00:00.000Z",
    overrideReason: null,
    confidence: null,
  };

  it("produces the same fingerprint regardless of input array order", () => {
    const a = {
      inputKey: "a_key",
      value: 1,
      confirmedAt: "2026-07-24T00:00:00.000Z",
      overrideReason: null,
      confidence: null,
    };
    const b = {
      inputKey: "b_key",
      value: 2,
      confirmedAt: "2026-07-24T00:00:00.000Z",
      overrideReason: null,
      confidence: null,
    };

    const fp1 = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [a, b],
    });
    const fp2 = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [b, a],
    });
    expect(fp1).toBe(fp2);
  });

  it("changes when a settled input's value changes", () => {
    const fp1 = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [settledInput],
    });
    const fp2 = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [{ ...settledInput, value: 9 }],
    });
    expect(fp1).not.toBe(fp2);
  });

  it("ignores an input that is neither confirmed nor override+confidence settled", () => {
    const unsettled = {
      inputKey: "unsettled_key",
      value: "whatever",
      confirmedAt: null,
      overrideReason: null,
      confidence: null,
    };
    const fpWithout = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [settledInput],
    });
    const fpWithUnsettled = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [settledInput, unsettled],
    });
    expect(fpWithout).toBe(fpWithUnsettled);
  });

  it("counts an override+confidence 'confirmed unknown' input as settled", () => {
    const overrideSettled = {
      inputKey: "override_key",
      value: null,
      confirmedAt: null,
      overrideReason: "No Move-recorded source; widened range instead",
      confidence: "low",
    };
    const fpWithout = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [],
    });
    const fpWithOverride = computeUpstreamScopeFingerprint({
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [overrideSettled],
    });
    expect(fpWithout).not.toBe(fpWithOverride);
  });
});

// ---------------------------------------------------------------------------
// resolvePreparedBy / assertSegregationOfDuties
// ---------------------------------------------------------------------------

describe("resolvePreparedBy", () => {
  it("returns the confirmed_by of the most-recently-confirmed input", () => {
    const inputs = [
      inputRow({
        input_key: "a",
        confirmed_by: "alice@abarva.ai",
        confirmed_at: "2026-07-24T01:00:00.000Z",
      }),
      inputRow({
        input_key: "b",
        confirmed_by: "bob@abarva.ai",
        confirmed_at: "2026-07-24T03:00:00.000Z",
      }),
      inputRow({
        input_key: "c",
        confirmed_by: "carol@abarva.ai",
        confirmed_at: "2026-07-24T02:00:00.000Z",
      }),
    ];
    expect(
      resolvePreparedBy(estimateRow({ created_by: "dave@abarva.ai" }), inputs),
    ).toBe("bob@abarva.ai");
  });

  it("falls back to the estimate's created_by when no input has ever been confirmed", () => {
    const inputs = [
      inputRow({
        confirmed_by: null,
        confirmed_at: null,
        override_reason: "unknown",
        confidence: "low",
      }),
    ];
    expect(
      resolvePreparedBy(estimateRow({ created_by: "dave@abarva.ai" }), inputs),
    ).toBe("dave@abarva.ai");
  });

  it("returns null when neither an input confirmation nor created_by has an identity", () => {
    expect(resolvePreparedBy(estimateRow({ created_by: null }), [])).toBeNull();
  });
});

describe("assertSegregationOfDuties", () => {
  it("allows self-approval in pilot mode when approver === preparer", () => {
    delete process.env.GATE_APPROVAL_STRICT_MODE;
    expect(() =>
      assertSegregationOfDuties("same@abarva.ai", "same@abarva.ai"),
    ).not.toThrow();
  });

  it("throws SelfApprovalViolationError in strict mode when approver === preparer", () => {
    process.env.GATE_APPROVAL_STRICT_MODE = "true";
    expect(() =>
      assertSegregationOfDuties("same@abarva.ai", "same@abarva.ai"),
    ).toThrow(SelfApprovalViolationError);
    delete process.env.GATE_APPROVAL_STRICT_MODE;
  });

  it("does not throw when approver differs from preparer", () => {
    expect(() =>
      assertSegregationOfDuties("approver@abarva.ai", "preparer@abarva.ai"),
    ).not.toThrow();
  });

  it("does not throw when preparedBy is null (no identity signal to compare against)", () => {
    expect(() =>
      assertSegregationOfDuties("approver@abarva.ai", null),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createEstimateSnapshot
// ---------------------------------------------------------------------------

describe("createEstimateSnapshot", () => {
  it("writes an approved, append-only row with a computed fingerprint", async () => {
    const store = createFakeSnapshotStore();
    const snapshot = await createEstimateSnapshot(baseCandidate(), store);

    expect(snapshot.status).toBe("approved");
    expect(snapshot.approved_by).toBe("approver@abarva.ai");
    expect(snapshot.approval_rationale).toBe(
      "Reviewed against Move charter; numbers hold up.",
    );
    expect(snapshot.estimate_id).toBe("estimate-1");
    expect(snapshot.upstream_scope_fingerprint).toEqual(expect.any(String));
    expect(snapshot.upstream_scope_fingerprint.length).toBeGreaterThan(0);
    expect(store.rows).toHaveLength(1);
  });

  it("rejects an empty approval rationale before writing anything", async () => {
    const store = createFakeSnapshotStore();
    await expect(
      createEstimateSnapshot(
        baseCandidate({ approvalRationale: "   " }),
        store,
      ),
    ).rejects.toThrow(/approval_rationale_required/);
    expect(store.rows).toHaveLength(0);
  });

  it("records a pilot self-approval note instead of silently accepting same-preparer approval", async () => {
    delete process.env.GATE_APPROVAL_STRICT_MODE;
    const store = createFakeSnapshotStore();
    const snapshot = await createEstimateSnapshot(
      baseCandidate({
        approvedBy: "preparer@abarva.ai",
        preparedBy: "preparer@abarva.ai",
      }),
      store,
    );
    expect(snapshot.status).toBe("approved");
    expect(snapshot.approval_rationale).toContain(
      "Pilot approval note: the approver is also the pricing estimate preparer",
    );
    expect(store.rows).toHaveLength(1);
  });

  it("rejects a self-approval in strict mode before writing anything", async () => {
    process.env.GATE_APPROVAL_STRICT_MODE = "true";
    const store = createFakeSnapshotStore();
    await expect(
      createEstimateSnapshot(
        baseCandidate({
          approvedBy: "preparer@abarva.ai",
          preparedBy: "preparer@abarva.ai",
        }),
        store,
      ),
    ).rejects.toThrow(SelfApprovalViolationError);
    expect(store.rows).toHaveLength(0);
    delete process.env.GATE_APPROVAL_STRICT_MODE;
  });

  // PR7 hardening (brief §12 "missing all fallbacks blocks the estimate"):
  // PR4's engine already refuses to fabricate a zero cost for an unpriced
  // role (it leaves that line's laborCostCents null and increments
  // totals.gapCount — see cost-engine.ts#aggregateTotals). Before this PR7
  // change, nothing stopped an estimate with gapCount > 0 from being
  // approved into a permanent, immutable snapshot — `runEstimate` only ever
  // surfaced the gap as a `topUncertaintyDrivers` disclosure, never a block.
  // This is the fix: approval — the one point a number becomes a financial
  // commitment — now refuses outright, rather than silently locking in an
  // honest-but-incomplete total.
  it("rejects approval when the candidate totals carry ANY unresolved rate gap, before writing anything", async () => {
    const store = createFakeSnapshotStore();
    await expect(
      createEstimateSnapshot(
        baseCandidate({ totals: { ...baseCandidate().totals, gapCount: 1 } }),
        store,
      ),
    ).rejects.toThrow(UnresolvedRateGapError);
    expect(store.rows).toHaveLength(0);
  });

  it("UnresolvedRateGapError carries the exact gap count for the caller to surface", async () => {
    const store = createFakeSnapshotStore();
    try {
      await createEstimateSnapshot(
        baseCandidate({ totals: { ...baseCandidate().totals, gapCount: 3 } }),
        store,
      );
      throw new Error("expected createEstimateSnapshot to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(UnresolvedRateGapError);
      expect((err as UnresolvedRateGapError).gapCount).toBe(3);
    }
    expect(store.rows).toHaveLength(0);
  });

  it("still approves cleanly when gapCount is exactly 0 (the unaffected, common case)", async () => {
    const store = createFakeSnapshotStore();
    const snapshot = await createEstimateSnapshot(
      baseCandidate({ totals: { ...baseCandidate().totals, gapCount: 0 } }),
      store,
    );
    expect(snapshot.status).toBe("approved");
    expect(store.rows).toHaveLength(1);
  });

  it("approving twice for the same Move: the first row is NEVER mutated — 'superseded' is purely a function of a newer row existing", async () => {
    const store = createFakeSnapshotStore();
    const first = await createEstimateSnapshot(baseCandidate(), store);
    // A later approval — simulate scope drift so it's a distinguishable snapshot.
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await createEstimateSnapshot(
      baseCandidate({
        inputs: [
          {
            inputKey: "integration_count",
            value: 9,
            confirmedAt: "2026-07-24T05:00:00.000Z",
            overrideReason: null,
            confidence: null,
          },
        ],
      }),
      store,
    );

    expect(store.rows).toHaveLength(2);
    // The store port exposes NO update method at all — the only way this
    // test could observe a mutation is if the first row's own object were
    // changed in place, which it is not.
    const firstAfterSecondApproval = store.rows.find((r) => r.id === first.id);
    expect(firstAfterSecondApproval?.status).toBe("approved");
    expect(firstAfterSecondApproval?.upstream_scope_fingerprint).toBe(
      first.upstream_scope_fingerprint,
    );
    expect(second.id).not.toBe(first.id);

    const latest = await store.getLatestSnapshotForMove(
      "move-1",
      "apex-retail",
    );
    expect(latest?.id).toBe(second.id);
  });
});

// ---------------------------------------------------------------------------
// checkSnapshotStaleness
// ---------------------------------------------------------------------------

describe("checkSnapshotStaleness", () => {
  it("is not stale when the current scope matches the stored fingerprint exactly", () => {
    const scope = {
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [
        {
          inputKey: "integration_count",
          value: 4,
          confirmedAt: "2026-07-24T00:00:00.000Z",
          overrideReason: null,
          confidence: null,
        },
      ],
    };
    const fingerprint = computeUpstreamScopeFingerprint(scope);
    const result = checkSnapshotStaleness(scope, {
      upstream_scope_fingerprint: fingerprint,
    });
    expect(result.stale).toBe(false);
  });

  it("flags stale_for_current_scope drift when a confirmed input's value changed since approval", () => {
    const approvedScope = {
      archetypeCode: "ARCH-01",
      modelVersion: 1,
      scenarioKey: "traditional",
      selectedRateCardId: "rc-1",
      inputs: [
        {
          inputKey: "integration_count",
          value: 4,
          confirmedAt: "2026-07-24T00:00:00.000Z",
          overrideReason: null,
          confidence: null,
        },
      ],
    };
    const fingerprint = computeUpstreamScopeFingerprint(approvedScope);

    const driftedScope = {
      ...approvedScope,
      inputs: [
        {
          inputKey: "integration_count",
          value: 12,
          confirmedAt: "2026-07-25T00:00:00.000Z",
          overrideReason: null,
          confidence: null,
        },
      ],
    };
    const result = checkSnapshotStaleness(driftedScope, {
      upstream_scope_fingerprint: fingerprint,
    });
    expect(result.stale).toBe(true);
    expect(result.currentFingerprint).not.toBe(fingerprint);
  });
});

// ---------------------------------------------------------------------------
// getApprovedSnapshotForMove
// ---------------------------------------------------------------------------

describe("getApprovedSnapshotForMove", () => {
  it("returns { status: 'none' } when no snapshot exists for the Move", async () => {
    const store = createFakeSnapshotStore();
    const result = await getApprovedSnapshotForMove(
      "move-1",
      "apex-retail",
      store,
      createFakeScopeLookup(new Map(), new Map()),
    );
    expect(result).toEqual({ status: "none" });
  });

  it("returns { status: 'approved' } when the current scope still matches the snapshot's fingerprint", async () => {
    const store = createFakeSnapshotStore();
    const snapshot = await createEstimateSnapshot(baseCandidate(), store);

    const estimates = new Map([["estimate-1", estimateRow({})]]);
    const inputs = new Map([
      [
        "estimate-1",
        [
          inputRow({
            confirmed_by: "preparer@abarva.ai",
            confirmed_at: "2026-07-24T00:00:00.000Z",
            value: 4,
          }),
        ],
      ],
    ]);

    const result = await getApprovedSnapshotForMove(
      "move-1",
      "apex-retail",
      store,
      createFakeScopeLookup(estimates, inputs),
    );
    expect(result.status).toBe("approved");
    expect(
      (result as { snapshot: PricingEstimateSnapshotRow }).snapshot.id,
    ).toBe(snapshot.id);
  });

  it("returns { status: 'stale' } — never silently treated as valid — when the Move's current inputs have drifted from the approved snapshot", async () => {
    const store = createFakeSnapshotStore();
    await createEstimateSnapshot(baseCandidate(), store);

    const estimates = new Map([["estimate-1", estimateRow({})]]);
    // Current confirmed value (9) differs from what was approved (4).
    const inputs = new Map([
      [
        "estimate-1",
        [
          inputRow({
            confirmed_by: "preparer@abarva.ai",
            confirmed_at: "2026-07-25T00:00:00.000Z",
            value: 9,
          }),
        ],
      ],
    ]);

    const result = await getApprovedSnapshotForMove(
      "move-1",
      "apex-retail",
      store,
      createFakeScopeLookup(estimates, inputs),
    );
    expect(result.status).toBe("stale");
  });

  it("falls back to the stored status when the snapshot has no estimate_id (defensive path)", async () => {
    const store = createFakeSnapshotStore();
    await createEstimateSnapshot(baseCandidate(), store);
    // Force estimate_id to null the way a hand-seeded/legacy row would be.
    store.rows[0] = { ...store.rows[0], estimate_id: null };

    const result = await getApprovedSnapshotForMove(
      "move-1",
      "apex-retail",
      store,
      createFakeScopeLookup(new Map(), new Map()),
    );
    expect(result.status).toBe("approved");
  });

  it("falls back to the stored status when the named estimate no longer resolves for this tenant", async () => {
    const store = createFakeSnapshotStore();
    await createEstimateSnapshot(baseCandidate(), store);

    // No estimate registered in the scope lookup at all.
    const result = await getApprovedSnapshotForMove(
      "move-1",
      "apex-retail",
      store,
      createFakeScopeLookup(new Map(), new Map()),
    );
    expect(result.status).toBe("approved");
  });
});

// ---------------------------------------------------------------------------
// toScopeFingerprintInput
// ---------------------------------------------------------------------------

describe("toScopeFingerprintInput", () => {
  it("maps a persisted input row down to the gate/fingerprint shape", () => {
    const row = inputRow({
      input_key: "integration_count",
      value: 4,
      confirmed_at: "2026-07-24T00:00:00.000Z",
      confidence: "high",
    });
    expect(toScopeFingerprintInput(row)).toEqual({
      inputKey: "integration_count",
      value: 4,
      confirmedAt: "2026-07-24T00:00:00.000Z",
      overrideReason: null,
      confidence: "high",
    });
  });
});

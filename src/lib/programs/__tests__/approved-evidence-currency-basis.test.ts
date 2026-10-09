// An unevaluable approved-evidence BASIS must not veto a recorded human sign-off.
//
// `deliverable-approval-currency.ts` already states that rule and applies it to
// one input of the comparison (the deliverable's phase). This suite pins it for
// the other input — the Move's approved-evidence snapshot — which
// `loadApprovedMoveEvidenceSnapshot` answers `null` for five distinct
// "I cannot tell" reasons while a Move with nothing approved comes back as a real
// snapshot with zero rows. Both currency legs in `isSignedOff` read
// `Boolean(currentEvidenceSnapshot && …)`, so a null sent both false and the veto
// `if (linkedArtifactId && !linkedArtifactCurrent) return false` fired for every
// deliverable carrying an `approved_artifact_id`.
//
// The `tenantScopeResolved` cases matter on their own: the one reason that is NOT
// the loader's — `governance.ts` skipping the load when `ctx.clientKey` is falsy,
// which `TenancyCtx` permits and `assertTenancy` does not require — also means the
// `move_artifacts` lookup never ran, so the linked artifact's integrity is
// unevaluable too rather than failed. That is why the flag is declared on the
// result instead of re-derived from the reason string at the call site.

import {
  __resetUnevaluableApprovedEvidenceBasisReports,
  describeUnevaluableApprovedEvidenceBasis,
  reportUnevaluableApprovedEvidenceBasisOnce,
  resolveApprovedEvidenceCurrencyBasis,
  type ApprovedEvidenceCurrencyBasisReason,
} from "@/lib/programs/approved-evidence-currency-basis";
import type { ApprovedMoveEvidenceSnapshot } from "@/lib/programs/approved-move-evidence-snapshot";

const MOVE_ID = "11111111-2222-3333-4444-555555555555";

function snapshotWith(
  overrides: Partial<ApprovedMoveEvidenceSnapshot> = {},
): ApprovedMoveEvidenceSnapshot {
  return {
    tenantKey: "meridian",
    moveId: MOVE_ID,
    revision: "rev-1",
    approvedEvidenceCount: 0,
    rows: [],
    latestEvidenceActivityAt: null,
    revisionByPhase: { 1: "rev-1", 2: "rev-1", 3: "rev-1", 4: "rev-1", 5: "rev-1" },
    latestEvidenceActivityAtByPhase: { 1: null, 2: null, 3: null, 4: null, 5: null },
    ...overrides,
  };
}

describe("resolveApprovedEvidenceCurrencyBasis", () => {
  it("is evaluable when the loader returns a snapshot, and carries that snapshot", async () => {
    const snapshot = snapshotWith({ revision: "rev-abc" });
    const basis = await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "meridian",
      moveId: MOVE_ID,
      load: async () => snapshot,
    });
    expect(basis.evaluable).toBe(true);
    expect(basis.tenantScopeResolved).toBe(true);
    if (!basis.evaluable) throw new Error("expected an evaluable basis");
    expect(basis.snapshot).toBe(snapshot);
  });

  it("is EVALUABLE for a Move with nothing approved — zero rows is an answer, not a gap", async () => {
    // The distinction the whole module rests on. `loadApprovedMoveEvidenceSnapshot`
    // returns a real snapshot with `approvedEvidenceCount: 0` for a Move whose
    // evidence was never approved, so that case must not take the unevaluable path.
    const basis = await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "meridian",
      moveId: MOVE_ID,
      load: async () => snapshotWith({ approvedEvidenceCount: 0, rows: [] }),
    });
    expect(basis.evaluable).toBe(true);
  });

  it("reports snapshot_unavailable, with the tenant scope resolved, when the loader returns null", async () => {
    const basis = await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "meridian",
      moveId: MOVE_ID,
      load: async () => null,
    });
    expect(basis.evaluable).toBe(false);
    if (basis.evaluable) throw new Error("expected an unevaluable basis");
    expect(basis.reason).toBe("snapshot_unavailable");
    // The reads DID run, so a linked-artifact integrity check is still meaningful.
    expect(basis.tenantScopeResolved).toBe(true);
  });

  it("reports snapshot_load_failed apart when the loader throws", async () => {
    const basis = await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "meridian",
      moveId: MOVE_ID,
      load: async () => {
        throw new Error("read replica unreachable");
      },
    });
    expect(basis.evaluable).toBe(false);
    if (basis.evaluable) throw new Error("expected an unevaluable basis");
    expect(basis.reason).toBe("snapshot_load_failed");
    expect(basis.tenantScopeResolved).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty", ""],
    ["whitespace", "   "],
  ])(
    "reports tenant_scope_unresolved for a %s tenant key, and never calls the loader",
    async (_label, tenantKey) => {
      // `TenancyCtx.clientKey` is optional and `assertTenancy` requires only
      // clientId + userId, so the gate can run without it. The loader must not be
      // called: a query scoped to no tenant key is the one read that could widen.
      const load = jest.fn(async () => snapshotWith());
      const basis = await resolveApprovedEvidenceCurrencyBasis({
        tenantKey,
        moveId: MOVE_ID,
        load,
      });
      expect(load).not.toHaveBeenCalled();
      expect(basis.evaluable).toBe(false);
      if (basis.evaluable) throw new Error("expected an unevaluable basis");
      expect(basis.reason).toBe("tenant_scope_unresolved");
      expect(basis.tenantScopeResolved).toBe(false);
    },
  );

  it("reports tenant_scope_unresolved for a missing moveId too", async () => {
    const load = jest.fn(async () => snapshotWith());
    const basis = await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "meridian",
      moveId: "",
      load,
    });
    expect(load).not.toHaveBeenCalled();
    expect(basis.evaluable).toBe(false);
  });

  it("passes the TRIMMED tenant key to the loader", async () => {
    const load = jest.fn(async () => snapshotWith());
    await resolveApprovedEvidenceCurrencyBasis({
      tenantKey: "  meridian  ",
      moveId: MOVE_ID,
      load,
    });
    expect(load).toHaveBeenCalledWith({ tenantKey: "meridian", moveId: MOVE_ID });
  });

  it("marks tenantScopeResolved false for exactly one reason", async () => {
    // The flag is what lets `isSignedOff` keep the integrity veto for the loader's
    // own failures while dropping it when no read was issued at all. If a second
    // reason ever starts claiming an unresolved scope, that veto quietly goes away
    // for it too — so the mapping is pinned rather than left to the call site.
    const bases = await Promise.all([
      resolveApprovedEvidenceCurrencyBasis({
        tenantKey: null,
        moveId: MOVE_ID,
        load: async () => snapshotWith(),
      }),
      resolveApprovedEvidenceCurrencyBasis({
        tenantKey: "meridian",
        moveId: MOVE_ID,
        load: async () => null,
      }),
      resolveApprovedEvidenceCurrencyBasis({
        tenantKey: "meridian",
        moveId: MOVE_ID,
        load: async () => {
          throw new Error("boom");
        },
      }),
    ]);
    const unresolved = bases
      .filter((basis) => !basis.tenantScopeResolved)
      .map((basis) => (basis.evaluable ? "evaluable" : basis.reason));
    expect(unresolved).toEqual(["tenant_scope_unresolved"]);
  });
});

describe("describeUnevaluableApprovedEvidenceBasis", () => {
  const REASONS: ApprovedEvidenceCurrencyBasisReason[] = [
    "tenant_scope_unresolved",
    "snapshot_load_failed",
    "snapshot_unavailable",
  ];

  it.each(REASONS)("names what was NOT verified for %s", (reason) => {
    const text = describeUnevaluableApprovedEvidenceBasis(reason);
    expect(text).toMatch(/currency against approved evidence was not ?\n?checked/);
    // Never claims the approval was confirmed current: that is the sentence an
    // operator would act on, and it would be false.
    expect(text).not.toMatch(/approved and current/i);
  });

  it("distinguishes the three reasons from one another", () => {
    const texts = REASONS.map((reason) =>
      describeUnevaluableApprovedEvidenceBasis(reason),
    );
    expect(new Set(texts).size).toBe(REASONS.length);
  });

  it("says a Move with nothing approved does not reach here", () => {
    // The reason an operator would otherwise draw the wrong conclusion: the
    // obvious reading of "evidence basis unavailable" is "no evidence", and that
    // reading would make passing the gate look wrong.
    expect(
      describeUnevaluableApprovedEvidenceBasis("snapshot_unavailable"),
    ).toMatch(/nothing approved does NOT reach here/);
  });
});

describe("reportUnevaluableApprovedEvidenceBasisOnce", () => {
  beforeEach(() => {
    __resetUnevaluableApprovedEvidenceBasisReports();
  });

  it("logs once per Move per reason and returns false after that", () => {
    // `isSignedOff` runs this for every deliverable row on every gate evaluation,
    // so a per-call log would bury the event it exists to surface.
    const log = jest.fn();
    expect(
      reportUnevaluableApprovedEvidenceBasisOnce(MOVE_ID, "snapshot_unavailable", log),
    ).toBe(true);
    expect(
      reportUnevaluableApprovedEvidenceBasisOnce(MOVE_ID, "snapshot_unavailable", log),
    ).toBe(false);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("keeps a second reason, and a second Move, reportable", () => {
    const log = jest.fn();
    reportUnevaluableApprovedEvidenceBasisOnce(MOVE_ID, "snapshot_unavailable", log);
    expect(
      reportUnevaluableApprovedEvidenceBasisOnce(MOVE_ID, "snapshot_load_failed", log),
    ).toBe(true);
    expect(
      reportUnevaluableApprovedEvidenceBasisOnce("other-move", "snapshot_unavailable", log),
    ).toBe(true);
    expect(log).toHaveBeenCalledTimes(3);
  });

  it("carries the move id, the reason and the operator-readable detail", () => {
    const log = jest.fn();
    reportUnevaluableApprovedEvidenceBasisOnce(MOVE_ID, "tenant_scope_unresolved", log);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("not evaluable"),
      expect.objectContaining({
        moveId: MOVE_ID,
        reason: "tenant_scope_unresolved",
        detail: describeUnevaluableApprovedEvidenceBasis("tenant_scope_unresolved"),
      }),
    );
  });
});

// The portfolio and the phase workspace must agree on a Move's phase.
//
// The resolver is tested with injected reads so the cases are about the rule —
// which gate reopens which phase — and not about a database fixture.

jest.mock("../queries", () => ({ getPhaseSnapshots: jest.fn() }));
jest.mock("../approved-move-evidence-snapshot", () => ({
  loadApprovedMoveEvidenceSnapshot: jest.fn(),
}));
jest.mock("../governance", () => ({ evaluateGate: jest.fn() }));
jest.mock("../transformers", () => ({
  buildUnverifiedGateCriteria: (phase: number) => [
    { id: `unverified-p${phase}`, label: "", status: "pending" },
  ],
}));

import {
  applyEffectivePhasesToPortfolio,
  resolveEffectiveMovePhase,
  type EffectiveMovePhaseDeps,
} from "../effective-move-phase";
import type { PhaseSnapshot, TenancyCtx } from "../types.db";
import type { StrategicMove, StrategicMovePortfolio } from "../types.ui";

const ctx = {
  clientId: "c1",
  clientKey: "tenant-a",
  userId: "u1",
} as TenancyCtx;

const APPROVED_AT = "2026-09-29T12:00:00.000Z";
const BEFORE_APPROVAL = "2026-09-29T09:00:00.000Z";
const AFTER_APPROVAL = "2026-09-29T15:00:00.000Z";

function approved(phaseNumber: number): PhaseSnapshot {
  return {
    id: `snapshot-p${phaseNumber}`,
    engagementId: "m1",
    phaseNumber,
    phaseName: null,
    snapshot: {
      evidenceSnapshotHash: "rev",
      phaseEvidenceSnapshotHash: `rev-p${phaseNumber}`,
    },
    lockedByUserId: null,
    lockedAt: APPROVED_AT,
    approvalStatus: "approved",
    createdAt: APPROVED_AT,
  };
}

/** Evidence as it stood when phases 1–4 were approved. */
function evidence(changedPhases: number[] = []) {
  const phases = [1, 2, 3, 4];
  return {
    revision: "rev",
    latestEvidenceActivityAt: changedPhases.length
      ? AFTER_APPROVAL
      : BEFORE_APPROVAL,
    revisionByPhase: Object.fromEntries(
      phases.map((p) => [
        p,
        changedPhases.includes(p) ? `rev-p${p}-changed` : `rev-p${p}`,
      ]),
    ),
    latestEvidenceActivityAtByPhase: Object.fromEntries(
      phases.map((p) => [
        p,
        changedPhases.includes(p) ? AFTER_APPROVAL : BEFORE_APPROVAL,
      ]),
    ),
  };
}

/**
 * Every prior phase is approved against unchanged evidence unless stated.
 * Gates listed in `openHardGates` have an open hard blocker; the rest hold.
 */
function deps(
  openHardGates: number[] = [],
  overrides: Partial<EffectiveMovePhaseDeps> = {},
  changedEvidencePhases: number[] = [],
): EffectiveMovePhaseDeps & { evaluated: Array<[string, number, number]> } {
  const evaluated: Array<[string, number, number]> = [];
  return {
    evaluated,
    getPhaseSnapshots: (async () =>
      [1, 2, 3, 4].map(
        approved,
      )) as EffectiveMovePhaseDeps["getPhaseSnapshots"],
    loadApprovedMoveEvidenceSnapshot: (async () =>
      evidence(
        changedEvidencePhases,
      )) as unknown as EffectiveMovePhaseDeps["loadApprovedMoveEvidenceSnapshot"],
    evaluateGate: (async (
      _ctx: TenancyCtx,
      moveId: string,
      from: number,
      to: number,
    ) => {
      evaluated.push([moveId, from, to]);
      return {
        failedChecks: openHardGates.includes(from)
          ? [{ id: "x", severity: "hard" }]
          : [{ id: "y", severity: "soft" }],
      };
    }) as unknown as EffectiveMovePhaseDeps["evaluateGate"],
    ...overrides,
  };
}

function move(partial: Partial<StrategicMove>): StrategicMove {
  return {
    id: "m1",
    currentPhase: 3,
    terminalComplete: false,
    phaseLabel: "stored",
    gateCriteria: [],
    ...partial,
  } as StrategicMove;
}

describe("resolveEffectiveMovePhase", () => {
  it("keeps the stored phase when every prior gate holds", async () => {
    const d = deps();
    const result = await resolveEffectiveMovePhase(ctx, move({}), d);
    expect(result.effectivePhase).toBe(3);
    expect(result.reopenedForGateReview).toBe(false);
    expect(d.evaluated).toEqual([
      ["m1", 1, 2],
      ["m1", 2, 3],
    ]);
  });

  it("falls back to the phase whose exit gate has an open hard blocker", async () => {
    const result = await resolveEffectiveMovePhase(ctx, move({}), deps([2]));
    expect(result.storedPhase).toBe(3);
    expect(result.effectivePhase).toBe(2);
    expect(result.reopenedForGateReview).toBe(true);
    expect(result.reopenedForEvidenceReview).toBe(false);
  });

  it("falls back to the EARLIEST open gate, not the latest", async () => {
    const result = await resolveEffectiveMovePhase(
      ctx,
      move({ currentPhase: 5 }),
      deps([2, 4]),
    );
    expect(result.effectivePhase).toBe(2);
  });

  it("does not reopen for a soft-only failure", async () => {
    const result = await resolveEffectiveMovePhase(ctx, move({}), deps([]));
    expect(result.effectivePhase).toBe(3);
  });

  it("treats a gate that cannot be evaluated as not holding", async () => {
    const result = await resolveEffectiveMovePhase(
      ctx,
      move({}),
      deps([], {
        evaluateGate: (async (_c: TenancyCtx, _m: string, from: number) => {
          if (from === 2) throw new Error("read failed");
          return { failedChecks: [] };
        }) as unknown as EffectiveMovePhaseDeps["evaluateGate"],
      }),
    );
    expect(result.effectivePhase).toBe(2);
  });

  it("reopens for evidence that changed after its approval, before any gate is asked", async () => {
    const d = deps([], {}, [2]);
    const result = await resolveEffectiveMovePhase(
      ctx,
      move({ currentPhase: 4 }),
      d,
    );
    expect(result.evidenceEffectivePhase).toBe(2);
    expect(result.effectivePhase).toBe(2);
    expect(result.reopenedForEvidenceReview).toBe(true);
    // Only the gate before the reopened phase is still worth evaluating.
    expect(d.evaluated).toEqual([["m1", 1, 2]]);
  });

  it("does not evaluate gates for a terminally complete Move or one before phase 2", async () => {
    const d = deps([1, 2, 3, 4]);
    expect(
      (
        await resolveEffectiveMovePhase(
          ctx,
          move({ currentPhase: 5, terminalComplete: true }),
          d,
        )
      ).effectivePhase,
    ).toBe(5);
    expect(
      (await resolveEffectiveMovePhase(ctx, move({ currentPhase: 1 }), d))
        .effectivePhase,
    ).toBe(1);
    expect(d.evaluated).toEqual([]);
  });
});

describe("applyEffectivePhasesToPortfolio", () => {
  function portfolio(moves: StrategicMove[]): StrategicMovePortfolio {
    return {
      moves,
      counts: {
        total: moves.length,
        needAttention: 0,
        onTrack: 0,
        gated: 0,
        idle: 0,
      },
      totalValueAtStake: { amount: 0, currency: "USD" },
      needAttentionMoves: [],
    };
  }

  it("re-phases a Move whose prior gate is open, and its label and criteria with it", async () => {
    const result = await applyEffectivePhasesToPortfolio(
      ctx,
      portfolio([move({ id: "reopened" })]),
      { deps: deps([2]) },
    );
    const shown = result.moves[0];
    expect(shown.currentPhase).toBe(2);
    expect(shown.phaseLabel).not.toBe("stored");
    expect(shown.gateCriteria).toEqual([
      { id: "unverified-p2", label: "", status: "pending" },
    ]);
  });

  it("leaves a Move whose gates hold exactly as stored, same object", async () => {
    const stored = move({ id: "holding" });
    const result = await applyEffectivePhasesToPortfolio(
      ctx,
      portfolio([stored]),
      {
        deps: deps(),
      },
    );
    expect(result.moves[0]).toBe(stored);
  });

  it("does not resolve archived Moves", async () => {
    const d = deps([2]);
    const archived = move({ id: "archived", lifecycleState: "archived" });
    const result = await applyEffectivePhasesToPortfolio(
      ctx,
      portfolio([archived]),
      {
        deps: d,
      },
    );
    expect(result.moves[0]).toBe(archived);
    expect(d.evaluated).toEqual([]);
  });

  it("preserves order and resolves each Move against its own gates", async () => {
    const d = deps([], {
      evaluateGate: (async (_c: TenancyCtx, moveId: string, from: number) => ({
        failedChecks:
          moveId === "b" && from === 1 ? [{ id: "x", severity: "hard" }] : [],
      })) as unknown as EffectiveMovePhaseDeps["evaluateGate"],
    });
    const result = await applyEffectivePhasesToPortfolio(
      ctx,
      portfolio([
        move({ id: "a", currentPhase: 4 }),
        move({ id: "b", currentPhase: 4 }),
        move({ id: "c", currentPhase: 2 }),
        move({ id: "d", currentPhase: 0 }),
      ]),
      { deps: d, concurrency: 2 },
    );
    expect(result.moves.map((m) => [m.id, m.currentPhase])).toEqual([
      ["a", 4],
      ["b", 1],
      ["c", 2],
      ["d", 0],
    ]);
  });

  it("keeps a Move as stored when its resolution is lost, rather than dropping it", async () => {
    const broken = deps([], {
      getPhaseSnapshots: (() => {
        throw new Error("sync failure");
      }) as unknown as EffectiveMovePhaseDeps["getPhaseSnapshots"],
    });
    const stored = move({ id: "lost" });
    const result = await applyEffectivePhasesToPortfolio(
      ctx,
      portfolio([stored]),
      {
        deps: broken,
      },
    );
    expect(result.moves).toHaveLength(1);
    expect(result.moves[0]).toBe(stored);
  });
});

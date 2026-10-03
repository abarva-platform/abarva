// Where a Move actually is, as opposed to where its row says it is.
//
// `current_phase` records the furthest phase a Move was advanced to. It is not
// re-written when an earlier gate stops holding — evidence changed after the
// approval, or a signed-off artifact was regenerated as a draft. The phase
// workspace has always derived the effective phase from the gates and sent the
// reader back to the phase that is really open.
//
// That derivation lived inside the phase page, so every other surface read the
// stored number. A portfolio row could show a Move one phase further on than
// its own page would let anyone work, and link to a phase that immediately
// redirected away as blocked. One resolver, used by both, is the fix: a surface
// cannot disagree with the workspace about the phase if it asks the same
// function.

import type { TenancyCtx } from "./types.db";
import type { StrategicMove, StrategicMovePortfolio } from "./types.ui";
import { getPhaseSnapshots } from "./queries";
import { loadApprovedMoveEvidenceSnapshot } from "./approved-move-evidence-snapshot";
import {
  effectivePhaseAfterEvidenceChange,
  effectivePhaseAfterGateValidation,
} from "./phase-gate-evidence-binding";
import { evaluateGate } from "./governance";
import { getPhaseLabel } from "./phase-labels";
import { buildUnverifiedGateCriteria } from "./transformers";

export interface EffectiveMovePhase {
  storedPhase: number;
  /** After approvals are checked against the evidence they approved. */
  evidenceEffectivePhase: number;
  /** After every prior gate is re-evaluated. This is the phase to show. */
  effectivePhase: number;
  reopenedForEvidenceReview: boolean;
  reopenedForGateReview: boolean;
}

export interface EffectiveMovePhaseDeps {
  getPhaseSnapshots: typeof getPhaseSnapshots;
  loadApprovedMoveEvidenceSnapshot: typeof loadApprovedMoveEvidenceSnapshot;
  evaluateGate: typeof evaluateGate;
}

const DEFAULT_DEPS: EffectiveMovePhaseDeps = {
  getPhaseSnapshots,
  loadApprovedMoveEvidenceSnapshot,
  evaluateGate,
};

type PhasedMove = Pick<
  StrategicMove,
  "id" | "currentPhase" | "terminalComplete"
>;

export async function resolveEffectiveMovePhase(
  ctx: TenancyCtx,
  move: PhasedMove,
  deps: EffectiveMovePhaseDeps = DEFAULT_DEPS,
): Promise<EffectiveMovePhase> {
  const storedPhase = move.currentPhase;
  const unchanged: EffectiveMovePhase = {
    storedPhase,
    evidenceEffectivePhase: storedPhase,
    effectivePhase: storedPhase,
    reopenedForEvidenceReview: false,
    reopenedForGateReview: false,
  };
  // A Move that passed its terminal gate is complete; and nothing before
  // phase 2 has a prior gate that could have stopped holding.
  if (move.terminalComplete || storedPhase <= 1) return unchanged;

  const [phaseSnapshots, evidenceSnapshot] = await Promise.all([
    deps.getPhaseSnapshots(ctx, move.id).catch(() => []),
    deps
      .loadApprovedMoveEvidenceSnapshot({
        tenantKey: ctx.clientKey ?? ctx.clientId,
        moveId: move.id,
      })
      .catch(() => null),
  ]);
  const evidenceEffectivePhase = effectivePhaseAfterEvidenceChange(
    storedPhase,
    phaseSnapshots,
    evidenceSnapshot
      ? {
          revision: evidenceSnapshot.revision,
          latestEvidenceActivityAt: evidenceSnapshot.latestEvidenceActivityAt,
          revisionByPhase: evidenceSnapshot.revisionByPhase,
          latestEvidenceActivityAtByPhase:
            evidenceSnapshot.latestEvidenceActivityAtByPhase,
        }
      : null,
  );

  let effectivePhase = evidenceEffectivePhase;
  if (effectivePhase > 1) {
    const gateReadinessByPhase = new Map<number, boolean>();
    for (let priorPhase = 1; priorPhase < effectivePhase; priorPhase += 1) {
      try {
        const gate = await deps.evaluateGate(
          ctx,
          move.id,
          priorPhase,
          priorPhase + 1,
          { allowHistoricalPhase: true },
        );
        gateReadinessByPhase.set(
          priorPhase,
          !gate.failedChecks.some((check) => check.severity === "hard"),
        );
      } catch {
        // A gate that cannot be evaluated has not been shown to hold.
        gateReadinessByPhase.set(priorPhase, false);
      }
    }
    effectivePhase = effectivePhaseAfterGateValidation(
      effectivePhase,
      gateReadinessByPhase,
    );
  }

  return {
    storedPhase,
    evidenceEffectivePhase,
    effectivePhase,
    reopenedForEvidenceReview: evidenceEffectivePhase < storedPhase,
    reopenedForGateReview: effectivePhase < storedPhase,
  };
}

/**
 * Re-phase every live Move in a portfolio to its effective phase.
 *
 * Archived Moves are left as stored: they are a record of where the work
 * stopped, not a claim about what is open now. A Move whose resolution throws
 * is also left as stored rather than dropped from the list — but resolution
 * itself already fails closed per gate, so that path is a lost read, not a
 * gate that was skipped.
 */
export async function applyEffectivePhasesToPortfolio(
  ctx: TenancyCtx,
  portfolio: StrategicMovePortfolio,
  opts: { concurrency?: number; deps?: EffectiveMovePhaseDeps } = {},
): Promise<StrategicMovePortfolio> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const moves = [...portfolio.moves];
  const pending = moves
    .map((move, index) => ({ move, index }))
    .filter(
      ({ move }) =>
        move.lifecycleState !== "archived" &&
        !move.terminalComplete &&
        move.currentPhase > 1,
    );

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < pending.length) {
      const { move, index } = pending[cursor];
      cursor += 1;
      const resolved = await resolveEffectiveMovePhase(
        ctx,
        move,
        opts.deps,
      ).catch(() => null);
      if (!resolved || resolved.effectivePhase === move.currentPhase) continue;
      moves[index] = {
        ...move,
        currentPhase: resolved.effectivePhase,
        phaseLabel: getPhaseLabel(resolved.effectivePhase),
        // The portfolio never evaluates criteria; keep them unverified, but
        // for the phase now shown rather than the one it replaced.
        gateCriteria: buildUnverifiedGateCriteria(resolved.effectivePhase),
      };
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, worker),
  );

  return { ...portfolio, moves };
}

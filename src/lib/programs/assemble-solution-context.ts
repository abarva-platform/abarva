// Slice 1 — assembleMoveSolutionContext: build the cumulative SolutionContext for
// a move/phase from the tenant's REAL context, replacing the `[DATA GAP]` stubs +
// 1800-char clips. The heavy sources (broker retrieval, prior-deliverable
// digests, gate approvals) are INJECTED so this is tenant-agnostic and testable
// without the data plane; the route wires the real sources.

import {
  emptySolutionContext,
  applyPhaseDigest,
  contextReadyForPhase,
  type SolutionContext,
  type PhaseDigest,
  type SolutionDecision,
  type ContextReadiness,
} from "./solution-context";
import { inferP2EvidenceSpecificity } from "@/lib/deliverables/evidence-specificity";

export interface SolutionContextSources {
  /** Retrieve the tenant's real current-state estate (AgentContextBroker / enterprise_context). */
  retrieveCurrentState: (
    tenantKey: string,
    query: string,
    moveId?: string,
  ) => Promise<string>;
  /** Full structured digests from prior approved deliverables (NOT 1800-char clips). */
  loadPriorDigests: (moveId: string) => Promise<PhaseDigest[]>;
  /** Approved gate decisions for the move. */
  loadDecisions: (moveId: string) => Promise<SolutionDecision[]>;
  /**
   * The operator's saved phase capture for the target phase
   * (`program_modules.state_jsonb`, the "N of N" section content). Optional so
   * existing callers/tests keep working; when present it binds the diagnosis the
   * operator actually entered so the mandated sections are not left empty and the
   * model does not emit `[DATA GAP]`.
   */
  loadPhaseCapture?: (
    moveId: string,
    phase: number,
  ) => Promise<PhaseDigest | null>;
}

export interface AssembledContext {
  context: SolutionContext;
  readiness: ContextReadiness;
  /** True when the broker returned a real current state (not empty / not stubbed). */
  currentStateBound: boolean;
}

/**
 * Assemble the SolutionContext for a move at a target phase. Folds prior phase
 * digests first, then binds the REAL current state, then the approved decisions.
 * Never fabricates: if the broker returns nothing, currentState stays unset and
 * the prompt-factory will mark it as a blocking input.
 */
export async function assembleMoveSolutionContext(
  args: {
    moveId: string;
    tenantKey: string;
    targetPhase: number;
    useCaseQuery?: string;
  },
  sources: SolutionContextSources,
): Promise<AssembledContext> {
  let ctx = emptySolutionContext(args.moveId, args.tenantKey);
  if (args.useCaseQuery?.trim()) {
    ctx = applyPhaseDigest(ctx, {
      problemSeed: args.useCaseQuery.trim(),
      useCaseCandidate: args.useCaseQuery.trim(),
    });
  }

  // 1) fold prior approved phase digests (full, structured) — cumulative memory.
  for (const digest of await sources.loadPriorDigests(args.moveId)) {
    ctx = applyPhaseDigest(ctx, digest);
  }

  // 2) bind the REAL current state from the broker — replaces [DATA GAP].
  const query =
    args.useCaseQuery ??
    ctx.useCase ??
    ctx.useCaseCandidate ??
    `${args.tenantKey} current state estate`;
  const currentState =
    (
      await sources.retrieveCurrentState(args.tenantKey, query, args.moveId)
    )?.trim() ?? "";
  let currentStateBound =
    currentState.length > 0 && !currentState.startsWith("[MISSING");
  if (currentStateBound) ctx = applyPhaseDigest(ctx, { currentState });

  // 2b) fold the operator's saved phase capture. This is the diagnosis the
  // operator actually entered in the phase form (current-state findings, baseline
  // metrics, gaps/root causes, …). It is stored in program_modules but was never
  // bound here, so the mandated sections had no supporting context and the model
  // wrote `[DATA GAP]`. Merge its currentState with the broker result (do not
  // overwrite either) and carry its structured fields (baselineMetrics, gaps, …).
  if (sources.loadPhaseCapture) {
    const capture = await sources
      .loadPhaseCapture(args.moveId, args.targetPhase)
      .catch(() => null);
    if (capture) {
      const { currentState: captureCurrentState, ...captureRest } = capture;
      const mergedCurrentState = [ctx.currentState, captureCurrentState]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join("\n\n");
      ctx = applyPhaseDigest(ctx, {
        ...captureRest,
        ...(mergedCurrentState ? { currentState: mergedCurrentState } : {}),
      });
      // The operator's capture is real bound context: it lets the P2 metric
      // inference run and satisfies the diagnosis-present readiness checks.
      if (
        mergedCurrentState.length > 0 ||
        captureRest.baselineMetrics ||
        (captureRest.gaps && captureRest.gaps.length > 0)
      ) {
        currentStateBound = true;
      }
    }
  }

  // Promote concrete P2 evidence into first-class prompt fields so the model does
  // not have to hunt through raw CSV/XLSX excerpts for the facts that should drive
  // the diagnostic thesis. P3 draft shaping must also carry these P2 signals
  // forward so the future-state blueprint is grounded in the approved diagnostic.
  if (currentStateBound && (args.targetPhase === 2 || args.targetPhase === 3)) {
    const specificity = inferP2EvidenceSpecificity(ctx);
    ctx = applyPhaseDigest(ctx, specificity);
  }

  // 3) fold approved gate decisions.
  const decisions = await sources.loadDecisions(args.moveId);
  if (decisions.length) ctx = applyPhaseDigest(ctx, { decisions });

  return {
    context: ctx,
    readiness: contextReadyForPhase(ctx, args.targetPhase),
    currentStateBound,
  };
}

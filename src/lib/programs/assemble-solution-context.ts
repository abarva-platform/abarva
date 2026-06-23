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

export interface SolutionContextSources {
  /** Retrieve the tenant's real current-state estate (AgentContextBroker / enterprise_context). */
  retrieveCurrentState: (tenantKey: string, query: string) => Promise<string>;
  /** Full structured digests from prior approved deliverables (NOT 1800-char clips). */
  loadPriorDigests: (moveId: string) => Promise<PhaseDigest[]>;
  /** Approved gate decisions for the move. */
  loadDecisions: (moveId: string) => Promise<SolutionDecision[]>;
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
  args: { moveId: string; tenantKey: string; targetPhase: number; useCaseQuery?: string },
  sources: SolutionContextSources,
): Promise<AssembledContext> {
  let ctx = emptySolutionContext(args.moveId, args.tenantKey);

  // 1) fold prior approved phase digests (full, structured) — cumulative memory.
  for (const digest of await sources.loadPriorDigests(args.moveId)) {
    ctx = applyPhaseDigest(ctx, digest);
  }

  // 2) bind the REAL current state from the broker — replaces [DATA GAP].
  const query =
    args.useCaseQuery ?? ctx.useCase ?? ctx.useCaseCandidate ?? `${args.tenantKey} current state estate`;
  const currentState = (await sources.retrieveCurrentState(args.tenantKey, query))?.trim() ?? "";
  const currentStateBound = currentState.length > 0;
  if (currentStateBound) ctx = applyPhaseDigest(ctx, { currentState });

  // 3) fold approved gate decisions.
  const decisions = await sources.loadDecisions(args.moveId);
  if (decisions.length) ctx = applyPhaseDigest(ctx, { decisions });

  return {
    context: ctx,
    readiness: contextReadyForPhase(ctx, args.targetPhase),
    currentStateBound,
  };
}

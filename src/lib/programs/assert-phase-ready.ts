// Slice 6 — assertPhaseReadyForGeneration: the shared guard that restores the
// product contract "no approved gate, no generation; approved gate → generation".
// Wired into EVERY generation entry point (phase build, single deliverable, retry,
// worker requeue). Injectable sources (capture state + gate approval) so it's
// route-agnostic + tested without the data plane.

export interface GenerationBlocker {
  code: "capture_incomplete" | "gate_not_approved";
  phase: number;
  reason: string;
  severity: "hard";
}

export interface PhaseGenerationReadiness {
  ready: boolean;
  phase: number;
  blockers: GenerationBlocker[];
}

export interface GateReadinessSources {
  /** Is the phase capture complete (the "N of M" state)? */
  captureComplete: (moveId: string, phase: number) => Promise<{ complete: boolean; missing: string[] }>;
  /** Has the phase gate been approved? */
  gateApproved: (moveId: string, phase: number) => Promise<boolean>;
}

/**
 * Require phase capture + gate approval before any enqueue. Returns a structured
 * blocker list instead of generating when not ready. `allowApprovedRetry` lets a
 * re-generation proceed for an already-approved phase (retry) but never bypasses
 * an unapproved gate.
 */
export async function assertPhaseReadyForGeneration(
  args: { moveId: string; phase: number; allowApprovedRetry?: boolean },
  sources: GateReadinessSources,
): Promise<PhaseGenerationReadiness> {
  const { moveId, phase } = args;
  const blockers: GenerationBlocker[] = [];

  const approved = await sources.gateApproved(moveId, phase);

  // Retry of an already-approved phase is allowed without re-checking capture.
  if (approved && args.allowApprovedRetry) {
    return { ready: true, phase, blockers: [] };
  }

  const capture = await sources.captureComplete(moveId, phase);
  if (!capture.complete) {
    blockers.push({
      code: "capture_incomplete",
      phase,
      reason: `Phase capture incomplete: ${capture.missing.join(", ") || "items outstanding"}.`,
      severity: "hard",
    });
  }
  if (!approved) {
    blockers.push({
      code: "gate_not_approved",
      phase,
      reason: `Phase ${phase} gate is not approved — no generation until the gate is approved.`,
      severity: "hard",
    });
  }

  return { ready: blockers.length === 0, phase, blockers };
}

/** HTTP status for a not-ready result (routes return this instead of generating). */
export function statusForReadiness(r: PhaseGenerationReadiness): 200 | 409 {
  return r.ready ? 200 : 409;
}

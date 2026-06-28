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

export type GenerationMode = "final" | "draft";

export interface PhaseGenerationReadiness {
  ready: boolean;
  phase: number;
  blockers: GenerationBlocker[];
  generationMode: GenerationMode;
  gateApproved: boolean;
  draftOnly: boolean;
  draftCaveats: GenerationBlocker[];
}

export interface GateReadinessSources {
  /** Is the phase capture complete (the "N of M" state)? */
  captureComplete: (moveId: string, phase: number) => Promise<{ complete: boolean; missing: string[] }>;
  /** Has the phase gate been approved? */
  gateApproved: (moveId: string, phase: number) => Promise<boolean>;
  /**
   * Optional next-phase draft exception. Used for governed handoffs such as:
   * P2 sponsor review explicitly approved for P3 draft shaping. This is not
   * final approval and must return caveats that are carried into the draft.
   */
  priorPhaseDraftApproval?: (
    moveId: string,
    phase: number,
  ) => Promise<{ approved: boolean; caveats: string[] }>;
}

/**
 * Require phase capture + gate approval before any enqueue. Returns a structured
 * blocker list instead of generating when not ready. `allowApprovedRetry` lets a
 * re-generation proceed for an already-approved phase (retry) but never bypasses
 * an unapproved gate.
 */
export async function assertPhaseReadyForGeneration(
  args: {
    moveId: string;
    phase: number;
    allowApprovedRetry?: boolean;
    generationMode?: GenerationMode;
  },
  sources: GateReadinessSources,
): Promise<PhaseGenerationReadiness> {
  const { moveId, phase } = args;
  const generationMode = args.generationMode ?? "final";
  const blockers: GenerationBlocker[] = [];

  const approved = await sources.gateApproved(moveId, phase);
  const gateBlocker: GenerationBlocker = {
    code: "gate_not_approved",
    phase,
    reason: `Phase ${phase} gate is not approved — no generation until the gate is approved.`,
    severity: "hard",
  };

  // Retry of an already-approved phase is allowed without re-checking capture.
  if (approved && args.allowApprovedRetry) {
    return {
      ready: true,
      phase,
      blockers: [],
      generationMode,
      gateApproved: true,
      draftOnly: false,
      draftCaveats: [],
    };
  }

  if (!approved && generationMode === "draft" && sources.priorPhaseDraftApproval) {
    const priorDraftApproval = await sources.priorPhaseDraftApproval(moveId, phase);
    if (priorDraftApproval.approved) {
      return {
        ready: true,
        phase,
        blockers: [],
        generationMode,
        gateApproved: false,
        draftOnly: true,
        draftCaveats: [
          gateBlocker,
          ...priorDraftApproval.caveats.map(
            (reason): GenerationBlocker => ({
              code: "gate_not_approved",
              phase,
              reason,
              severity: "hard",
            }),
          ),
        ],
      };
    }
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
    if (generationMode === "draft" && capture.complete) {
      return {
        ready: true,
        phase,
        blockers: [],
        generationMode,
        gateApproved: false,
        draftOnly: true,
        draftCaveats: [gateBlocker],
      };
    }
    blockers.push(gateBlocker);
  }

  return {
    ready: blockers.length === 0,
    phase,
    blockers,
    generationMode,
    gateApproved: approved,
    draftOnly: false,
    draftCaveats: [],
  };
}

/** HTTP status for a not-ready result (routes return this instead of generating). */
export function statusForReadiness(r: PhaseGenerationReadiness): 200 | 409 {
  return r.ready ? 200 : 409;
}

// Source reasoning · live-path capture (Phase 1, Slice 1.6)
//
// The single, guarded entry point the generate route calls to run the reasoning
// spine and produce a VALIDATED ReasoningEnvelope — or null. By contract this
// NEVER throws and NEVER affects generation: when the flag is off, when the spine
// errors, or when the envelope fails the gate, it returns a null envelope and the
// route proceeds on the legacy path UNCHANGED. This slice CAPTURES the envelope
// (the route persists it as reasoning metadata, with zero change to the generated
// prose); rendering the envelope into the deliverable is a later slice (1.6b).

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import type { ReasoningEnvelope } from "./reasoning-envelope";
import { runAnalysisStage } from "./analysis-stage";
import { runRecommendationStage } from "./recommendation-stage";
import { validateEnvelope } from "./envelope-gate";

export interface CaptureOptions {
  /** Result of the `source_reasoning_spine` tenant flag check (route computes it). */
  enabled: boolean;
  envelopeId: string;
  /** ISO timestamp (the route passes a real one; the spine stays pure). */
  now: string;
}

export type CaptureStatus = "disabled" | "ok" | "gate_failed" | "error";

export interface CaptureResult {
  /** The validated envelope, or null when status !== "ok". */
  envelope: ReasoningEnvelope | null;
  status: CaptureStatus;
  /** Failure kinds / error message, for the generation receipt + logs. */
  failures?: string[];
}

/**
 * Run the reasoning spine for a generation, fully guarded. Returns the validated
 * envelope on success; otherwise a null envelope with a status the route records.
 * The route MUST treat a non-"ok" result as "no envelope" and generate exactly as
 * it does today.
 */
export function captureReasoningEnvelope(
  ctx: SourceGenerationContext,
  opts: CaptureOptions,
): CaptureResult {
  if (!opts.enabled) return { envelope: null, status: "disabled" };
  try {
    const { results } = runAnalysisStage(ctx);
    const envelope = runRecommendationStage(ctx, results, {
      envelopeId: opts.envelopeId,
      now: opts.now,
    });
    const validation = validateEnvelope(envelope);
    if (!validation.ok) {
      return {
        envelope: null,
        status: "gate_failed",
        failures: validation.failures.map((f) => f.kind),
      };
    }
    return { envelope, status: "ok" };
  } catch (err) {
    return {
      envelope: null,
      status: "error",
      failures: [err instanceof Error ? err.message : "unknown"],
    };
  }
}

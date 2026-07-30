/**
 * Visual presentation lookup for the 11-value ComponentReadinessState (the
 * real assembler's readiness enum -- see src/lib/knowledge/view-model/types.ts
 * and reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * VIEW_MODEL_ASSEMBLER_INTERFACES.md §1).
 *
 * This module used to own the render-gate DECISION (gateEnvelope(), reading a
 * raw availability/authority/freshness triple). That logic now lives once, in
 * the assembler's deriveReadiness() -- every ViewModelEnvelope already carries
 * a computed `readiness` plus an honest, field-specific `unavailableReason`.
 * This module's only remaining job is: given a readiness value, which of the
 * existing 6 visual tones and which short title does it get. It never
 * re-derives readiness from raw state, and it never invents body copy --
 * `unavailableReason` on the envelope is always the source of body text.
 */

import type { ComponentReadinessState } from "@/lib/knowledge/view-model";

export type GateTone =
  | "blocked"
  | "restricted"
  | "stale"
  | "gap"
  | "candidate"
  | "neutral";

export interface ReadinessPresentation {
  readonly tone: GateTone;
  readonly title: string;
}

/**
 * One row per ComponentReadinessState. Every one of the 11 values gets its
 * own honest title -- per AGENTS.md's render-gate discipline, "SOURCE_INCOMPLETE"
 * must never collapse into the same generic "not available" a  "WITHHELD" or a
 * "STALE" state would show.
 */
const READINESS_PRESENTATION: Record<
  ComponentReadinessState,
  ReadinessPresentation
> = {
  ENABLED_AND_PROVEN: { tone: "neutral", title: "Available" },
  DATA_RECONCILED_BUT_UI_UNPROVEN: {
    tone: "candidate",
    title: "Available -- unproven view",
  },
  SOURCE_INCOMPLETE: { tone: "blocked", title: "Source incomplete" },
  PROJECTION_UNAVAILABLE: { tone: "blocked", title: "Not loaded" },
  CUBE_UNPROVEN: { tone: "blocked", title: "Measure not yet available" },
  WITHHELD: { tone: "restricted", title: "Withheld" },
  RESTRICTED: { tone: "restricted", title: "Restricted" },
  STALE: { tone: "stale", title: "Needs refresh" },
  DISPUTED: { tone: "gap", title: "Sources disagree" },
  NOT_MEASURED: { tone: "blocked", title: "Not measured" },
  NOT_ASSESSED: { tone: "neutral", title: "Not assessed" },
};

export function readinessPresentation(
  readiness: ComponentReadinessState,
): ReadinessPresentation {
  return READINESS_PRESENTATION[readiness];
}

/** True for the one readiness value where a value IS rendering (as an
 * unproven view) but should still carry a visible marker distinct from a
 * fully proven one -- mirrors the old "stale data is visibly marked, not
 * silently shown fresh" rule, now applied to "unproven, not silently shown
 * proven." */
export function isUnprovenButRendering(
  readiness: ComponentReadinessState,
): boolean {
  return readiness === "DATA_RECONCILED_BUT_UI_UNPROVEN";
}

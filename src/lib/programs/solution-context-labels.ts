import type { SolutionContext } from "./solution-context";

/**
 * Reader-facing names for the SolutionContext fields a phase requires before it
 * may generate (`PHASE_REQUIRED_CONTEXT`) and for the P3b option approval
 * (`architectureMayProceed`).
 *
 * `contextReadyForPhase` reports missing fields by their TypeScript key
 * (`useCase`, `kpis`, `currentState`, ...). Those keys were printed verbatim
 * into the pre-gate draft banner stored in a client-facing artifact and into
 * aVa's "I need more evidence" reply. Every sentence a reader sees names the
 * field with this label instead; the key stays the machine value.
 */
export const SOLUTION_CONTEXT_FIELD_LABELS = {
  useCaseCandidate: "The candidate use case",
  useCase: "The confirmed use case",
  kpis: "The success KPIs",
  currentState: "The current-state diagnosis",
  gaps: "The diagnosed gaps",
  architecture: "The target architecture",
  roadmap: "The delivery roadmap",
  chosenOption: "An approved design option",
} as const satisfies Partial<Record<keyof SolutionContext, string>>;

/** `architectureMayProceed` reports its one missing item with this suffix. */
const P3A_APPROVAL_SUFFIX = " (P3a approval required)";

/**
 * The reader-facing name of one entry from `ContextReadiness.missing`. An entry
 * that is not a known field is returned unchanged rather than dropped, so a
 * new required field degrades to its key instead of disappearing from the list.
 */
export function describeMissingSolutionContext(missing: string): string {
  const suffixed = missing.endsWith(P3A_APPROVAL_SUFFIX);
  const key = suffixed
    ? missing.slice(0, -P3A_APPROVAL_SUFFIX.length)
    : missing;
  const label = Object.prototype.hasOwnProperty.call(
    SOLUTION_CONTEXT_FIELD_LABELS,
    key,
  )
    ? SOLUTION_CONTEXT_FIELD_LABELS[
        key as keyof typeof SOLUTION_CONTEXT_FIELD_LABELS
      ]
    : undefined;
  if (!label) return missing;
  return suffixed ? `${label} (P3a approval required)` : label;
}

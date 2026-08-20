// =============================================================================
// Solution Pattern — the 5-pattern platform-fit gate
// -----------------------------------------------------------------------------
// Per the target model: "Only one pattern needs the platform... Track 1
// makes this call during the domain interview — platform and security
// readiness are answered in the same session, not a separate review
// afterward." The source workbook's "Solutioning" tab CALCULATES a
// suggested pattern from Discovery answers, with a human override + reason.
// This module does not implement that calculation — the derivation formula
// isn't available from the source material (unlike risk-tier scoring, which
// had concrete point-value worked examples to reverse-engineer from). Rather
// than invent an unfounded formula, this models the pattern as a named
// owner's explicit classification, consistent with how Complexity Tier
// (p0-extended-intake-fields.ts) is handled for the same honest reason.
//
// Storage mirrors the same isolated charter-JSONB seam as every other
// extended field in this session's work.
// =============================================================================

export type SolutionPattern =
  | "Build on the Platform"
  | "Point Automation"
  | "Embedded in a Licensed Product"
  | "Native to the Core Clinical System"
  | "New Third-Party Platform";

export interface SolutionPatternOption {
  value: SolutionPattern;
  description: string;
  /**
   * The source model's own routing language for this pattern — surfaced in
   * the UI as context, not enforced as a governance.ts gate check in this
   * pass (see the release record's Known Gaps).
   */
  routingNote: string;
}

export const SOLUTION_PATTERN_OPTIONS: readonly SolutionPatternOption[] = [
  {
    value: "Build on the Platform",
    description:
      "Core functionality runs on the platform — its compute, its data, its models — inside the tenant's own boundary.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Point Automation",
    description:
      "One system the tenant already runs and has already approved. Nothing new enters the estate.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Embedded in a Licensed Product",
    description:
      "AI built into something the tenant already licenses for its actual job.",
    routingNote: "Check coverage first.",
  },
  {
    value: "Native to the Core Clinical System",
    description:
      "AI capabilities shipped inside the core system of record itself, running on its own data.",
    routingNote: "Check coverage first.",
  },
  {
    value: "New Third-Party Platform",
    description:
      "Data ships out to a vendor the tenant does not already have this relationship with.",
    routingNote: "Challenge by default.",
  },
];

const SOLUTION_PATTERN_KEY = "p3_solution_pattern_v1";

export interface SolutionPatternFields {
  pattern: SolutionPattern;
  /** Why this pattern fits — a named owner's rationale, not a calculated field. */
  rationale: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const VALID_PATTERNS = new Set(
  SOLUTION_PATTERN_OPTIONS.map((o) => o.value as string),
);

/** Safe read — null unless a recognized pattern and a non-empty rationale are both present. */
export function readSolutionPatternFromCharter(
  charter: Record<string, unknown> | null,
): SolutionPatternFields | null {
  if (!charter) return null;
  const v = charter[SOLUTION_PATTERN_KEY];
  if (!isPlainObject(v)) return null;
  if (!VALID_PATTERNS.has(v.pattern as string)) return null;
  if (typeof v.rationale !== "string" || !v.rationale.trim()) return null;
  return v as unknown as SolutionPatternFields;
}

/** Embed the fields into a charter. Pure — returns a new object, never mutates. */
export function embedSolutionPatternInCharter(
  charter: Record<string, unknown>,
  fields: SolutionPatternFields,
): Record<string, unknown> {
  return { ...charter, [SOLUTION_PATTERN_KEY]: fields };
}

/**
 * P3 capture helper: embed only when the feature flag is on. Pure — the flag
 * decision is passed in, so the wiring stays unit-testable without a live
 * tenant or DB. No-op (same reference) otherwise.
 */
export function applySolutionPatternIfEnabled(
  charter: Record<string, unknown>,
  fields: SolutionPatternFields | null | undefined,
  flagEnabled: boolean,
): Record<string, unknown> {
  if (!flagEnabled || !fields) return charter;
  return embedSolutionPatternInCharter(charter, fields);
}

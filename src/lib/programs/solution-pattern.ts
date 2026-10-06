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

import {
  ALL_SOLUTION_PATTERN_VALUES,
  DEFAULT_SOLUTION_PATTERN_OPTIONS,
  type SolutionPattern,
  type SolutionPatternOption,
} from "@/lib/programs/solution-pattern-catalog";

export type { SolutionPattern, SolutionPatternOption };

/**
 * The platform-fit options a Move that declares nothing is asked. Kept as a
 * named re-export so every existing consumer is unchanged; a Move whose
 * DECLARED archetype has its own set resolves it through
 * `solutionPatternOptionsFor` instead (solution-pattern-catalog.ts).
 */
export const SOLUTION_PATTERN_OPTIONS: readonly SolutionPatternOption[] =
  DEFAULT_SOLUTION_PATTERN_OPTIONS;

const SOLUTION_PATTERN_KEY = "p3_solution_pattern_v1";

export interface SolutionPatternFields {
  pattern: SolutionPattern;
  /** Why this pattern fits — a named owner's rationale, not a calculated field. */
  rationale: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Read validation spans EVERY set the catalog offers, not the Move's resolved
 * set. A pattern a named owner recorded must stay readable if the Move's
 * declaration later changes, or the charter silently drops a signed
 * classification. Write validation is the scoped half — see
 * `isSolutionPatternAllowedFor`.
 */
const VALID_PATTERNS = ALL_SOLUTION_PATTERN_VALUES;

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

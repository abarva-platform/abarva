// ─────────────────────────────────────────────────────────────────────────────
// aVa Source answer-mode classifier — Phase A of the senior-advisor hardening.
//
// aVa on a Source event needs to know WHAT KIND of question it is being asked
// before it can answer like a practitioner instead of a generic chatbot. This
// module is the deterministic (no-LLM) classifier: given the user's question
// text (+ optionally the stage they are viewing), it returns one of 16 modes.
//
// Only 6 modes are IMPLEMENTED in Phase A (grounding + quality gate wired):
//   event_status · workflow_how_to · evidence_readiness · artifact_lineage ·
//   artifact_finality · stage_gate
// The other 10 classify (so the type and the keyword signal both exist now,
// keeping Phase B/C additive-only) but the caller does not build mode-specific
// grounding for them yet — the chat route falls through to its existing
// (unchanged) behavior. Classifying them here is deliberately harmless: it
// costs nothing, and gives Phase B/C a stable extension point.
//
// Deterministic on purpose: classification must be fast, cheap, and testable
// without an LLM round-trip — this is pattern/keyword matching only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The full 16-mode union the Source aVa answer taxonomy defines. Phase A
 * implements the first 6 (see module doc); the remaining 10 are classified now
 * so Phase B/C can extend grounding without touching this type again.
 */
export type SourceAnswerMode =
  // ── Phase A — implemented (grounding + quality gate wired) ──────────────────
  | "event_status"
  | "workflow_how_to"
  | "evidence_readiness"
  | "artifact_lineage"
  | "artifact_finality"
  | "stage_gate"
  // ── Phase B/C — classify-only-passthrough (existing chat behavior unchanged) ─
  | "value_at_stake"
  | "vendor_comparison"
  | "risk_exposure"
  | "clause_coverage"
  | "bafo_strategy"
  | "should_cost"
  | "committed_value"
  | "value_realization"
  | "stakeholder_alignment"
  | "general_advisory";

/** The 6 modes Phase A actually builds mode-specific grounding for. */
export const PHASE_A_IMPLEMENTED_MODES: readonly SourceAnswerMode[] = [
  "event_status",
  "workflow_how_to",
  "evidence_readiness",
  "artifact_lineage",
  "artifact_finality",
  "stage_gate",
];

export function isPhaseAImplementedMode(mode: SourceAnswerMode): boolean {
  return (PHASE_A_IMPLEMENTED_MODES as readonly string[]).includes(mode);
}

export interface ClassifySourceAnswerModeInput {
  /** The user's raw question text for this turn. */
  question: string;
  /** The stage key the user is currently viewing, if known (from surfaceContext.viewStage). */
  viewedStage?: string | null;
}

export interface SourceAnswerModeClassification {
  mode: SourceAnswerMode;
  /** The keyword/pattern rule that fired, for debugging + eval fixtures. */
  matchedRule: string;
  /** True when no specific pattern matched and we fell back to general_advisory. */
  isFallback: boolean;
}

// ── Pattern rules ────────────────────────────────────────────────────────────
// Ordered by specificity: more specific / higher-signal patterns are tested
// first so a question that could plausibly match two modes resolves to the
// more actionable one (e.g. "final" + "version" → artifact_finality before
// the more generic artifact_lineage).

interface ModeRule {
  mode: SourceAnswerMode;
  id: string;
  test: (q: string) => boolean;
}

const RULES: ModeRule[] = [
  // ── Phase A: event_status ──────────────────────────────────────────────────
  {
    mode: "event_status",
    id: "event_status.where_are_we",
    test: (q) =>
      /\b(where (are|is) (we|this event)|what stage|current stage|what('s| is) (the )?status|how (far along|much (is )?(done|left|remaining))|what('s| is) (open|outstanding|left to do)|event status|status of (this|the) event)\b/.test(
        q,
      ),
  },
  {
    mode: "event_status",
    id: "event_status.progress",
    test: (q) =>
      /\b(stage (\d+ )?of \d+|which stages? (are|is) (complete|done)|what('s| have) (we|i) (completed|finished))\b/.test(
        q,
      ),
  },

  // ── Phase A: stage_gate ─────────────────────────────────────────────────────
  {
    mode: "stage_gate",
    id: "stage_gate.blockers",
    test: (q) =>
      /\b(gate|advance (the )?stage|move (to|past) (the )?next stage|what('s| is) blocking|what do i need to (advance|approve)|approve (the )?(gate|stage)|what('s| is) required to (advance|move on|proceed))\b/.test(
        q,
      ),
  },
  {
    mode: "stage_gate",
    id: "stage_gate.confirms",
    test: (q) =>
      /\b(gate confirm|confirmation (box|item)|sign[- ]?off|sponsor confirm)\b/.test(
        q,
      ),
  },

  // ── Phase A: evidence_readiness ─────────────────────────────────────────────
  {
    mode: "evidence_readiness",
    id: "evidence_readiness.missing",
    test: (q) =>
      /\b(what|which) (evidence|data|facts|inputs?|documents?) (do (i|we) (still )?need|(is|are) missing|(is|are) outstanding)\b/.test(
        q,
      ) ||
      /\b(evidence|data) (readiness|complete|gaps?)\b/.test(q) ||
      /\bwhat (do i still need to (provide|upload)|haven't i (provided|uploaded))\b/.test(
        q,
      ),
  },

  // ── Phase A: artifact_finality ───────────────────────────────────────────────
  // Tested BEFORE artifact_lineage — "final"/"authoritative"/"latest" questions
  // are more specific than a general "where did this come from" lineage ask.
  {
    mode: "artifact_finality",
    id: "artifact_finality.which_is_final",
    test: (q) =>
      /\b(which (version|copy|file|artifact) is (the )?(final|authoritative|current|latest)|is (this|that) (the )?(final version|final|authoritative( copy| version)?)|has (this|it) been superseded|which one (is|counts as) (final|authoritative))\b/.test(
        q,
      ),
  },

  // ── Phase A: artifact_lineage ─────────────────────────────────────────────
  {
    mode: "artifact_lineage",
    id: "artifact_lineage.history",
    test: (q) =>
      /\b(where did (this|that|it)( \w+)? come from|(upload|version) history|who uploaded|what replaced|prior version|previous version|artifact history|document history)\b/.test(
        q,
      ),
  },

  // ── Phase A: workflow_how_to ─────────────────────────────────────────────
  {
    mode: "workflow_how_to",
    id: "workflow_how_to.how_do_i",
    test: (q) =>
      /\bhow do i\b/.test(q) ||
      /\bhow (can|do) (i|we) (upload|submit|advance|approve|attach|provide|review|confirm)\b/.test(
        q,
      ) ||
      /\bwhere (do i|can i|should i) (upload|click|find|go)\b/.test(q),
  },

  // ── Phase B/C: classify-only-passthrough ────────────────────────────────────
  {
    mode: "value_at_stake",
    id: "value_at_stake.deferred",
    test: (q) =>
      /\b(value at stake|how much (savings|value)|value bridge|value pool)\b/.test(
        q,
      ),
  },
  {
    mode: "vendor_comparison",
    id: "vendor_comparison.deferred",
    test: (q) =>
      /\b(compare vendors?|vendor comparison|which vendor|best vendor|vendor scorecard)\b/.test(
        q,
      ),
  },
  {
    mode: "risk_exposure",
    id: "risk_exposure.deferred",
    test: (q) => /\b(risk exposure|transition risk|what('s| is) (the )?risk)\b/.test(q),
  },
  {
    mode: "clause_coverage",
    id: "clause_coverage.deferred",
    test: (q) => /\b(clause coverage|rfp clause|which clauses?)\b/.test(q),
  },
  {
    mode: "bafo_strategy",
    id: "bafo_strategy.deferred",
    test: (q) => /\bbafo\b/.test(q),
  },
  {
    mode: "should_cost",
    id: "should_cost.deferred",
    test: (q) => /\bshould[- ]cost\b/.test(q),
  },
  {
    mode: "committed_value",
    id: "committed_value.deferred",
    test: (q) => /\bcommitted value\b/.test(q),
  },
  {
    mode: "value_realization",
    id: "value_realization.deferred",
    test: (q) => /\bvalue realiz\w*|\brealized value\b|\btracking (the )?savings\b/.test(q),
  },
  {
    mode: "stakeholder_alignment",
    id: "stakeholder_alignment.deferred",
    test: (q) =>
      /\b(stakeholder alignment|sponsor (agree|aligned)|committee (agree|aligned))\b/.test(
        q,
      ),
  },
];

/**
 * Classify a Source aVa question into one of the 16 modes. Pure + deterministic
 * (no LLM call). Falls back to `general_advisory` when nothing matches — this is
 * the honest "I don't have a specific pattern for this" bucket, which the caller
 * treats identically to the other classify-only-passthrough modes (existing chat
 * behavior, unchanged).
 */
export function classifySourceAnswerMode(
  input: ClassifySourceAnswerModeInput,
): SourceAnswerModeClassification {
  const q = (input.question ?? "").trim().toLowerCase();
  if (!q) {
    return { mode: "general_advisory", matchedRule: "empty_question", isFallback: true };
  }
  for (const rule of RULES) {
    if (rule.test(q)) {
      return { mode: rule.mode, matchedRule: rule.id, isFallback: false };
    }
  }
  return { mode: "general_advisory", matchedRule: "no_match", isFallback: true };
}

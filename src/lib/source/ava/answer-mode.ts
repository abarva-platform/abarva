// ─────────────────────────────────────────────────────────────────────────────
// aVa Source answer-mode classifier — the senior-advisor hardening series
// (Phase A/B/C, all landed).
//
// aVa on a Source event needs to know WHAT KIND of question it is being asked
// before it can answer like a practitioner instead of a generic chatbot. This
// module is the deterministic (no-LLM) classifier: given the user's question
// text (+ optionally the stage they are viewing), it returns one of 16 modes.
//
// Only 6 modes are IMPLEMENTED in Phase A (grounding + quality gate wired):
//   event_status · workflow_how_to · evidence_readiness · artifact_lineage ·
//   artifact_finality · stage_gate
// Phase B added 8 more (vendor/value/commercial). Phase C (this slice) adds
// the final 2 fully-grounded modes — `decision_recommendation` and
// `contract_optimization` — plus grounds `general_advisory` (the catch-all
// "senior sourcing judgment" mode, previously classify-only). Classifying them
// costs nothing, and gives each phase a stable extension point.
//
// Deterministic on purpose: classification must be fast, cheap, and testable
// without an LLM round-trip — this is pattern/keyword matching only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The full 16-mode union the Source aVa answer taxonomy defines. Phase A
 * implements the first 6 (see module doc); Phase B implements 8 more — the
 * vendor/value/commercial modes; Phase C implements the final 2
 * (`decision_recommendation`, `contract_optimization`) and grounds
 * `general_advisory` as a lighter-bar catch-all. `stakeholder_alignment`
 * remains classify-only-passthrough — it asks about human sentiment/consensus
 * (has the committee/sponsor agreed?) which this event-bound deterministic
 * tool has no persisted signal for; grounding it would require fabricating a
 * "who agrees with what" state the data model does not capture, so it is left
 * as an honest passthrough rather than a grounded mode.
 */
export type SourceAnswerMode =
  // ── Phase A — implemented (grounding + quality gate wired) ──────────────────
  | "event_status"
  | "workflow_how_to"
  | "evidence_readiness"
  | "artifact_lineage"
  | "artifact_finality"
  | "stage_gate"
  // ── Phase B — implemented (grounding + quality gate wired) ──────────────────
  | "value_at_stake"
  | "vendor_comparison"
  | "risk_exposure"
  | "clause_coverage"
  | "bafo_strategy"
  | "should_cost"
  | "committed_value"
  | "value_realization"
  // ── Phase C — implemented (grounding + quality gate wired) ──────────────────
  | "decision_recommendation"
  | "contract_optimization"
  | "general_advisory"
  // ── Deferred — classify-only-passthrough (existing chat behavior unchanged) ─
  | "stakeholder_alignment";

/** The 6 modes Phase A actually builds mode-specific grounding for. */
export const PHASE_A_IMPLEMENTED_MODES: readonly SourceAnswerMode[] = [
  "event_status",
  "workflow_how_to",
  "evidence_readiness",
  "artifact_lineage",
  "artifact_finality",
  "stage_gate",
];

/**
 * The 8 modes Phase B builds mode-specific grounding for — `value_at_stake` was
 * already effectively covered by the pre-existing `buildAvaSourceGrounding` value
 * wire (#4567), so its grounding here just confirms/labels that coverage rather
 * than re-deriving it; the other 7 are net-new vendor/value/commercial modes.
 */
export const PHASE_B_IMPLEMENTED_MODES: readonly SourceAnswerMode[] = [
  "value_at_stake",
  "vendor_comparison",
  "should_cost",
  "risk_exposure",
  "clause_coverage",
  "bafo_strategy",
  "committed_value",
  "value_realization",
];

/**
 * The 3 modes Phase C builds mode-specific grounding for. `decision_recommendation`
 * and `contract_optimization` are net-new composite modes (they assemble OTHER
 * modes' grounding, never re-deriving); `general_advisory` is the pre-existing
 * catch-all fallback, now grounded with a compact roll-up instead of a bare
 * passthrough.
 */
export const PHASE_C_IMPLEMENTED_MODES: readonly SourceAnswerMode[] = [
  "decision_recommendation",
  "contract_optimization",
  "general_advisory",
];

export function isPhaseAImplementedMode(mode: SourceAnswerMode): boolean {
  return (PHASE_A_IMPLEMENTED_MODES as readonly string[]).includes(mode);
}

export function isPhaseBImplementedMode(mode: SourceAnswerMode): boolean {
  return (PHASE_B_IMPLEMENTED_MODES as readonly string[]).includes(mode);
}

export function isPhaseCImplementedMode(mode: SourceAnswerMode): boolean {
  return (PHASE_C_IMPLEMENTED_MODES as readonly string[]).includes(mode);
}

/** True when the mode has ANY mode-specific grounding wired (Phase A, B, or C). */
export function isGroundedAnswerMode(mode: SourceAnswerMode): boolean {
  return (
    isPhaseAImplementedMode(mode) ||
    isPhaseBImplementedMode(mode) ||
    isPhaseCImplementedMode(mode)
  );
}

/**
 * Source aVa polish gate — Gap 1 fix.
 *
 * Live-found: "What evidence is missing?" asked on the RFP stage was
 * answered with an unrelated cross-module risk item (a generic SOX /
 * payment-approval control flag) instead of Source-event evidence
 * readiness. Root cause (verified, not guessed): the question classifies
 * correctly to `evidence_readiness` — no earlier rule in `RULES` matches
 * "what evidence is missing?" ahead of it — and its Source-scoped grounding
 * (`buildModeGrounding`) builds correctly too. The actual bug is one layer
 * up, in the chat route (`/api/chat/agent/route.ts`): the route ALSO
 * assembles a generic, tenant-wide `ContextBundle` on every turn
 * (`getContextBroker().assemble` with mode `'full'` for `/source*`
 * surfaces) via a keyword/semantic search that is completely independent of
 * the active Source event. Broad keywords like "evidence" and "missing" can
 * surface an unrelated tenant-wide compliance/risk chunk, and that generic
 * "CONTEXT BROKER RECEIPT" block was injected into the SAME system prompt
 * as the correctly Source-scoped grounding, with nothing telling the model
 * the generic receipt was off-topic for this turn.
 *
 * This predicate is the decision the route now makes: once a GROUNDED,
 * non-passthrough Source answer mode has fired for this turn, the
 * deterministic Source grounding block is authoritative for the topic, and
 * the generic cross-module context-broker receipt should be suppressed
 * from the prompt entirely (see route.ts's
 * `contextBundlePromptBlockForPrompt`). `stakeholder_alignment` (the one
 * mode `isGroundedAnswerMode` returns false for) keeps receiving the
 * generic receipt exactly as before — this fix changes nothing for it.
 */
export function shouldSuppressGenericContextBundleForSourceMode(
  mode: SourceAnswerMode | null,
): boolean {
  return mode !== null && isGroundedAnswerMode(mode);
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

  // ── Phase C: decision_recommendation / contract_optimization ─────────────────
  // Tested BEFORE Phase B's broader value/risk rules — "what should we do" /
  // "recommend an award" / "renew vs rebid" phrasing is more specific than a
  // bare value-at-stake or risk-exposure ask and should resolve to the
  // composite decision/optimization modes instead.
  {
    mode: "decision_recommendation",
    id: "decision_recommendation.core",
    test: (q) =>
      /\b(what should (we|i) (do|decide|award|recommend)|recommend (an? )?(award|decision|vendor)|who should (we|i) award|which vendor should (we|i) (pick|choose|select|award)|award recommendation|make the (award )?decision|ready to award)\b/.test(
        q,
      ),
  },
  {
    mode: "contract_optimization",
    id: "contract_optimization.core",
    test: (q) =>
      /\b(renew (or|vs\.?|versus) (rebid|renegotiate)|renegotiate (the )?(contract|incumbent|current vendor)|rebid (this|the) (contract|event)|incumbent (economics|leakage|contract)|contract optimization|optimize (the )?(current )?contract|cure (the )?contract|current[- ]state economics)\b/.test(
        q,
      ),
  },

  // ── Phase B: vendor/value/commercial modes (grounding + quality gate wired) ──
  {
    mode: "value_at_stake",
    id: "value_at_stake.core",
    test: (q) =>
      /\b(value at stake|how much (savings|value)|value bridge|value pool)\b/.test(
        q,
      ),
  },
  {
    mode: "vendor_comparison",
    id: "vendor_comparison.core",
    test: (q) =>
      /\b(compare vendors?|vendor comparison|which vendor|best vendor|vendor scorecard|vendor coverage|vendor response|response coverage|response completeness|response readiness|proposal completeness|proposal coverage|who (addressed|dodged))\b/.test(
        q,
      ),
  },
  {
    mode: "risk_exposure",
    id: "risk_exposure.core",
    test: (q) => /\b(risk exposure|transition risk|commercial risk|what('s| is) (the )?risk)\b/.test(q),
  },
  {
    mode: "clause_coverage",
    id: "clause_coverage.core",
    test: (q) => /\b(clause coverage|rfp clause|which clauses?|protected vs exposed|what('s| is) exposed)\b/.test(q),
  },
  {
    mode: "bafo_strategy",
    id: "bafo_strategy.core",
    test: (q) => /\bbafo\b/.test(q),
  },
  {
    mode: "should_cost",
    id: "should_cost.core",
    test: (q) => /\bshould[- ]cost|normalized tco|tco normalization\b/.test(q),
  },
  {
    mode: "committed_value",
    id: "committed_value.core",
    test: (q) => /\bcommitted value|what did (we|the award) (lock|commit)\b/.test(q),
  },
  {
    mode: "value_realization",
    id: "value_realization.core",
    test: (q) => /\bvalue realiz\w*|\brealized value\b|\btracking (the )?savings\b/.test(q),
  },

  // ── Deferred: classify-only-passthrough (existing chat behavior unchanged) ──
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
 * the honest "I don't have a specific pattern for this" bucket. Phase C grounds
 * `general_advisory` with a compact roll-up (see `mode-grounding.ts`); it is the
 * ONLY fallback mode that is grounded — `stakeholder_alignment` still falls
 * through to existing (ungrounded) chat behavior when matched.
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

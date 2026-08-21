// Moves aVa chat hardening — answer-mode classification + scope guard.
//
// Classifies a user question into one of the 12 Moves-chat answer modes and
// detects broad ad hoc strategy questions that should be bounded back to the
// active Move (or redirected to Intelligence for the general case). Pure
// keyword/regex classification — deterministic, no LLM call, testable in
// isolation from the chat route.

import type { MovesAvaAnswerMode } from "./types";

export interface MovesAvaAnswerModeClassification {
  mode: MovesAvaAnswerMode;
  isOutOfScope: boolean;
}

interface ModeRule {
  mode: MovesAvaAnswerMode;
  patterns: RegExp[];
}

// Order matters: earlier rules win on ambiguous overlap (e.g. "what changed"
// before the more generic "phase_guidance" catch-all).
const MODE_RULES: readonly ModeRule[] = [
  {
    mode: "phase_input_draft",
    patterns: [
      /draft.*(phase )?(input|capture|field|section)/i,
      /(propose|prepare|fill).*p[1-5].*(input|capture|field|section)/i,
      /draft proposed inputs/i,
      /help.*fill.*(this )?(phase|step|field)/i,
    ],
  },
  {
    mode: "draft_final_change",
    patterns: [
      /what (changed|is different)\b/i,
      /draft (vs\.?|versus|and) final/i,
      /between draft and final/i,
    ],
  },
  {
    mode: "upload_mapping",
    patterns: [
      /what did (this|that|the) upload mean/i,
      /what does this upload map to/i,
      /upload.*mean/i,
    ],
  },
  {
    mode: "evidence_gap",
    patterns: [
      /evidence.*(missing|gap|still need)/i,
      /what('s| is) still missing/i,
      /what evidence/i,
    ],
  },
  {
    mode: "gate_blocker",
    patterns: [
      /what('s| is) blocking/i,
      /gate (criteria|blocker|status|readiness)/i,
      /current gate/i,
      /gate tally/i,
      /checklist status/i,
      /why can'?t (we|i) advance/i,
    ],
  },
  {
    mode: "next_phase_readiness",
    patterns: [
      /can we (move|advance|go) to (the )?next phase/i,
      /ready (for|to advance to) (p\d|the next phase)/i,
      /next phase readiness/i,
    ],
  },
  {
    mode: "workshop_preparation",
    patterns: [
      /workshop.*focus/i,
      /prepare.*(workshop|session)/i,
      /what should (the|this) (workshop|session) (cover|focus on)/i,
    ],
  },
  {
    mode: "solution_lane_explanation",
    patterns: [
      /(solution )?lanes? (are |is )?(affected|impacted)/i,
      /which (lanes|building blocks)/i,
      /building block/i,
    ],
  },
  {
    mode: "risk_control",
    patterns: [
      /\brisks?\b/i,
      /automate.*(legal|clinical|financial|review)/i,
      /should we automate/i,
      /control(s)? (gap|risk)/i,
    ],
  },
  {
    mode: "source_implication",
    patterns: [
      /\bsource\b/i,
      /vendor|contract|renewal|rfp|sourcing|procurement|bafo|supplier/i,
    ],
  },
  {
    mode: "tower_measurement",
    patterns: [
      /\btower\b/i,
      /what (should|will) tower measure/i,
      /metric contract/i,
      /\bkpi\b/i,
      /\broi\b/i,
    ],
  },
  {
    mode: "phase_guidance",
    patterns: [
      /what (should|do) i do next/i,
      /what('s| is) next/i,
      /how does this affect p[0-5]/i,
      /how does this become a roadmap/i,
    ],
  },
];

// Broad, ad hoc strategy signals — not anchored to the active Move's phase
// work. These route to out_of_scope_redirect regardless of a mode match.
const OUT_OF_SCOPE_PATTERNS: readonly RegExp[] = [
  /\b(latest|top|current|emerging)\b.{0,20}\btrends?\b/i,
  /industry trends?/i,
  /(create|build|develop) an? (ai )?strategy for/i,
  /executive council strategy/i,
  /broader (strategy|market|industry)/i,
  /general (market|industry) (outlook|analysis)/i,
  /competitive landscape/i,
];

export function classifyMovesAvaQuestion(
  questionText: string,
): MovesAvaAnswerModeClassification {
  const text = questionText.trim();
  const isOutOfScope = OUT_OF_SCOPE_PATTERNS.some((pattern) =>
    pattern.test(text),
  );
  if (isOutOfScope) {
    return { mode: "out_of_scope_redirect", isOutOfScope: true };
  }
  for (const rule of MODE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { mode: rule.mode, isOutOfScope: false };
    }
  }
  return { mode: "phase_guidance", isOutOfScope: false };
}

/**
 * Bounded redirect text for a broad ad hoc strategy question. Keeps the
 * boundary clean: acknowledge the question is broader than the Move, offer
 * to answer the Move-scoped implication, and name Intelligence for the
 * general case — never a flat refusal.
 */
export function buildOutOfScopeRedirect(moveTitle: string): string {
  return (
    `That is broader than this Move. I can answer it as it applies to ${moveTitle} and the current phase, ` +
    "or Intelligence can handle the broader strategy view. For this Move, the relevant implication is which " +
    "candidate ideas from that broader question should become evidence, solution-lane input, or a future phase " +
    "consideration here."
  );
}

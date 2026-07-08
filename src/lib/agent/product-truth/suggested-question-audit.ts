// Global aVa Product Truth + Scope Guard — suggested-question safety audit.
//
// Confirmed (2026-07-08 investigation): every surface's "suggested
// questions" are static, curated per-phase/per-template strings — not
// LLM-generated at request time (e.g. StrategicMovePhaseClient.tsx's
// PHASE_CONFIGS). That makes this an OFFLINE audit of the curated lists
// rather than a live runtime filter: run this over every known static
// suggestion source in a test, and CI fails if someone adds a question that
// baits a hallucination trap (implies a not-built capability, a workflow
// bypass, or a third-party replacement).

import { checkThirdPartyReplacementClaims } from "./third-party-replacement-guard";

const WORKFLOW_BYPASS_TRAP_PATTERNS: readonly RegExp[] = [
  /\bcan (moves|nexus|sentinel|atlas|steward|ava) approve\b/i,
  /\b(automatically|auto-)?(approve|advance) the (gate|phase)\b/i,
  /\bcertifies? (the )?value automatically\b/i,
];

const CAPABILITY_OVERREACH_TRAP_PATTERNS: readonly RegExp[] = [
  /\bdoes (source|tower|moves|intelligence|home) (classify|certify|automatically)\b/i,
];

export interface SuggestedQuestionAuditViolation {
  question: string;
  reason: string;
}

export function auditSuggestedQuestions(
  questions: readonly string[],
): SuggestedQuestionAuditViolation[] {
  const violations: SuggestedQuestionAuditViolation[] = [];

  for (const question of questions) {
    const bypassMatch = WORKFLOW_BYPASS_TRAP_PATTERNS.find((pattern) => pattern.test(question));
    if (bypassMatch) {
      violations.push({
        question,
        reason: "Implies chat can approve/advance/certify a workflow step on its own — rewrite to ask about readiness instead.",
      });
      continue;
    }

    const overreachMatch = CAPABILITY_OVERREACH_TRAP_PATTERNS.find((pattern) =>
      pattern.test(question),
    );
    if (overreachMatch) {
      violations.push({
        question,
        reason: "Baits a capability-overreach answer — confirm the capability is shipped before keeping this suggestion.",
      });
      continue;
    }

    const thirdPartyViolations = checkThirdPartyReplacementClaims(question);
    if (thirdPartyViolations.length > 0) {
      violations.push({
        question,
        reason: thirdPartyViolations[0].detail,
      });
    }
  }

  return violations;
}

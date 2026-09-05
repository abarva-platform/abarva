// Tower aVa chat — answer-mode classification + scope guard.
//
// Deterministic keyword classification, no LLM call. Tower owns portfolio
// value, adoption, and metric-contract state; execution mechanics belong to
// Moves and vendor mechanics to Source, so those redirect rather than answer.

import type { AvaModuleAnswerModeClassification } from "@/lib/agent/module-expert-contract";
import type { TowerAvaAnswerMode } from "./types";

export interface TowerAvaAnswerModeClassification
  extends AvaModuleAnswerModeClassification<TowerAvaAnswerMode> {
  isOutOfScope: boolean;
}

interface ModeRule {
  mode: TowerAvaAnswerMode;
  patterns: RegExp[];
}

// Order matters: a question about whether value is *proven* is a value
// question even when it names a metric.
const MODE_RULES: readonly ModeRule[] = [
  {
    mode: "value_realization",
    patterns: [
      /\b(realized|realised)\b/i,
      /\bvalue (delivered|proven|banked|captured)\b/i,
      /\bdid we (actually )?(deliver|achieve|realize|realise)\b/i,
      /\bbenefit(s)? (proven|realized|realised|tracked)\b/i,
    ],
  },
  {
    mode: "funding_gate",
    patterns: [
      /\bfunding gate\b/i,
      /\b(should|do) we (keep )?fund(ing)?\b/i,
      /\bcontinue investing\b/i,
      /\bstop\/go\b/i,
      /\bgate (decision|posture|status)\b/i,
    ],
  },
  {
    mode: "adoption_status",
    patterns: [/\badoption\b/i, /\bbeing used\b/i, /\busage (rate|level)\b/i, /\buptake\b/i],
  },
  {
    mode: "evidence_gap",
    patterns: [
      /\bwhat('s| is) missing\b/i,
      /\bevidence (gap|missing|needed|required)\b/i,
      /\bwhy (can'?t|is) (we|it) (say|claim)\b/i,
      /\bnot (yet )?(proven|evidenced)\b/i,
    ],
  },
  {
    mode: "metric_status",
    patterns: [
      /\bmetric\b/i,
      /\bkpi\b/i,
      /\bwhere (are|is) (we|it) on\b/i,
      /\btracking (against|to)\b/i,
      /\bcurrent (value|status|number|figure)\b/i,
    ],
  },
];

// Work that Tower observes but does not run.
const OUT_OF_SCOPE_PATTERNS: readonly RegExp[] = [
  /\bhow do (i|we) (run|execute|advance|complete)\b.*\b(phase|charter|move)\b/i,
  /\b(p[0-5])\b.*\b(what|how|next)\b/i,
  /\b(rfp|bafo|vendor|contract|renewal|sourcing event)\b/i,
  /\bnegotiat/i,
];

export function classifyTowerAvaQuestion(
  questionText: string,
): TowerAvaAnswerModeClassification {
  const text = questionText ?? "";
  const isOutOfScope = OUT_OF_SCOPE_PATTERNS.some((p) => p.test(text));
  if (isOutOfScope) {
    return { mode: "out_of_scope_redirect", isOutOfScope: true };
  }
  for (const rule of MODE_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      return { mode: rule.mode, isOutOfScope: false };
    }
  }
  return { mode: "general", isOutOfScope: false };
}

/**
 * A redirect needs no deterministic Tower state to answer correctly, and a
 * packet is only built when the surface is hardened — so Tower can be flagged
 * on per tenant the way Moves already is.
 */
export function shouldBuildTowerAvaPacketForMode(args: {
  hardeningEnabled: boolean;
  mode: TowerAvaAnswerMode;
}): boolean {
  if (!args.hardeningEnabled) return false;
  return args.mode !== "out_of_scope_redirect";
}

// Live-answer bank — structural validator (W5.2). Pure + deterministic; runs in
// CI without the model. Proves the bank is well-formed and internally consistent
// BEFORE the env-gated live runner ever scores it, so a malformed case can't
// silently pass a live run.

import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import type { AdversarialKind, LiveAnswerBehavior, LiveAnswerCase } from "./types";

export interface LiveAnswerBankIssue {
  caseId: string;
  message: string;
}

export interface LiveAnswerBankValidation {
  total: number;
  adversarialCount: number;
  positiveCount: number;
  expertsCovered: number;
  ok: boolean;
  issues: LiveAnswerBankIssue[];
}

const VALID_BEHAVIORS = new Set<LiveAnswerBehavior>([
  "cite_benchmark",
  "name_real_next_move",
  "surface_stuck_point",
  "hedge_uncertainty",
  "no_fabrication",
  "refuse_cross_tenant",
  "scope_down",
  "require_evidence",
  "output_shape_table",
  "output_shape_chart",
  "output_shape_graph",
]);

// Each adversarial kind MUST require its defining honesty behavior — otherwise
// the case probes a failure mode without asserting the resistance to it.
const REQUIRED_BEHAVIOR_BY_KIND: Record<Exclude<AdversarialKind, null>, LiveAnswerBehavior[]> = {
  tempts_fake_precision: ["cite_benchmark", "hedge_uncertainty", "require_evidence"],
  tempts_cross_tenant: ["refuse_cross_tenant"],
  out_of_domain: ["scope_down"],
  no_evidence: ["require_evidence"],
  leading_overclaim: ["surface_stuck_point", "hedge_uncertainty"],
};

/**
 * Validate a live-answer bank. `minPerExpert` is the floor of cases each covered
 * expert should carry; `requireAdversarialPerExpert` requires every covered
 * expert to have at least one adversarial case.
 */
export function validateLiveAnswerBank(
  cases: LiveAnswerCase[],
  opts: { minPerExpert?: number; requireAdversarialPerExpert?: boolean } = {},
): LiveAnswerBankValidation {
  const minPerExpert = opts.minPerExpert ?? 1;
  const requireAdversarialPerExpert = opts.requireAdversarialPerExpert ?? false;
  const issues: LiveAnswerBankIssue[] = [];

  const seenIds = new Set<string>();
  const byExpert = new Map<string, LiveAnswerCase[]>();

  for (const c of cases) {
    if (seenIds.has(c.id)) issues.push({ caseId: c.id, message: "duplicate id" });
    seenIds.add(c.id);

    if (!c.query?.trim()) issues.push({ caseId: c.id, message: "empty query" });
    if (!c.notes?.trim()) issues.push({ caseId: c.id, message: "missing notes (what is this case testing?)" });
    if (c.surfaceFacts) {
      if (!Array.isArray(c.surfaceFacts)) {
        issues.push({ caseId: c.id, message: "surfaceFacts must be an array when present" });
      } else if (c.surfaceFacts.some((fact) => typeof fact !== "string" || fact.trim().length === 0)) {
        issues.push({ caseId: c.id, message: "surfaceFacts must contain only non-empty strings" });
      }
    }

    // expectedExpertId integrity.
    if (c.expectedExpertId === "") {
      if (c.adversarialKind !== "out_of_domain") {
        issues.push({ caseId: c.id, message: "empty expectedExpertId only allowed for out_of_domain" });
      }
    } else if (!getExpertById(c.expectedExpertId)) {
      issues.push({ caseId: c.id, message: `expectedExpertId ${c.expectedExpertId} is not a registered expert` });
    } else {
      const list = byExpert.get(c.expectedExpertId) ?? [];
      list.push(c);
      byExpert.set(c.expectedExpertId, list);
    }

    // behaviors.
    if (!c.expectedBehaviors?.length) {
      issues.push({ caseId: c.id, message: "expectedBehaviors must be non-empty" });
    } else {
      for (const b of c.expectedBehaviors) {
        if (!VALID_BEHAVIORS.has(b)) issues.push({ caseId: c.id, message: `unknown behavior ${b}` });
      }
    }

    // adversarial consistency.
    if (c.adversarialKind) {
      const required = REQUIRED_BEHAVIOR_BY_KIND[c.adversarialKind];
      if (required && !required.some((b) => c.expectedBehaviors.includes(b))) {
        issues.push({
          caseId: c.id,
          message: `adversarialKind ${c.adversarialKind} must require one of: ${required.join(", ")}`,
        });
      }
    }
    if (
      c.expectedBehaviors.includes("output_shape_chart") &&
      (!c.surfaceFacts || c.surfaceFacts.length < 2)
    ) {
      issues.push({ caseId: c.id, message: "chart-shaped cases need >=2 surfaceFacts for live evidence" });
    }
  }

  // per-expert coverage.
  for (const [expertId, list] of byExpert) {
    if (list.length < minPerExpert) {
      issues.push({ caseId: expertId, message: `expert has ${list.length} case(s), needs >= ${minPerExpert}` });
    }
    if (requireAdversarialPerExpert && !list.some((c) => c.adversarialKind !== null)) {
      issues.push({ caseId: expertId, message: "expert has no adversarial case" });
    }
  }

  const adversarialCount = cases.filter((c) => c.adversarialKind !== null).length;
  return {
    total: cases.length,
    adversarialCount,
    positiveCount: cases.length - adversarialCount,
    expertsCovered: byExpert.size,
    ok: issues.length === 0,
    issues,
  };
}

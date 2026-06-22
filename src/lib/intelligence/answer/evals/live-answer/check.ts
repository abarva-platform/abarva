// Live-answer bank — behavior checker (W5.2). The SPEC the env-gated live runner
// uses to assert per-case expectedBehaviors against a real Ava answer.
//
// Lane note: this does NOT call the model and does NOT modify the W5.1 harness.
// The live runner produces a real AgentAnswer, maps it to the minimal
// LiveAnswerObservation below, and calls checkLiveAnswerCase(). Behaviors that
// are deterministically checkable from the prose/structure return a concrete
// pass/fail; behaviors that need ground truth or judgment (e.g. no_fabrication)
// return mode "model-judged" with pass=null for the runner to escalate to a
// judge model. Keeping the contract narrow lets the bank evolve without coupling
// to the AgentAnswer shape.

import { scoreAnswer } from "@/lib/eval/answer-quality/scorer";
import type { LiveAnswerBehavior, LiveAnswerCase } from "./types";

/** Minimal projection of a real Ava answer the checker needs. */
export interface LiveAnswerObservation {
  prose: string;
  crossTenantBlocked?: boolean;
  hasTable?: boolean;
  hasChart?: boolean;
  hasGraph?: boolean;
}

export interface LiveAnswerBehaviorResult {
  behavior: LiveAnswerBehavior;
  mode: "deterministic" | "model-judged";
  /** true/false when deterministically checkable; null when it needs a judge. */
  pass: boolean | null;
  note: string;
}

export interface LiveAnswerCaseResult {
  id: string;
  behaviors: LiveAnswerBehaviorResult[];
  /** All deterministic behaviors passed (model-judged behaviors are not counted here). */
  deterministicPass: boolean;
  /** Behaviors the runner still has to escalate to a judge model. */
  modelJudged: LiveAnswerBehavior[];
}

// Heuristic cues. These are intentionally generous: a false "deterministic pass"
// is caught by the model-judged layer; the value here is cheap pre-screening +
// a clear spec of what each behavior means.
const HEDGE_CUE =
  /\b(typically|tends to|often|range|depends on|varies|uncertain|directional|order of magnitude|rule of thumb|planning range|can|rarely|realistically|pressure-test|failure mode|failure modes|pattern i'?ve seen|most of them|most health systems|well enough|likely|front-loaded|predictable)\b/i;
const NEXT_MOVE_CUE =
  /\b(next step|recommend|start by|pilot|run a|stand up|prioritize|sequence|validate|baseline|workshop|assess|pull(?:s)? the data|pulled data|pull that data|reporting workbench|reporting environment|analytics workbench|source system|focus first|faster win|decision-grade|first thing to fix|first (retirement|restructure)|retirement or restructure candidates|before we get to tactics|in order|triage|what i can give you)\b/i;
const STUCK_POINT_CUE =
  /\b(odds|adoption|roi clarity|stuck|stall|stalls|stall points|honest odds|probability of success|where this stalls|failure mode|failure modes)\b/i;
const REFUSE_CROSS_TENANT_CUE =
  /\b(can'?t (use|share|access)|won'?t (use|share)|another (client|tenant)|cross[- ]tenant|not authori[sz]ed|isolat|fence|only your)\b/i;
const SCOPE_DOWN_CUE =
  /\b(outside (my|this) (scope|domain|remit)|not the right expert|would defer|different (expert|domain)|out of scope|beyond what i)\b/i;
const REQUIRE_EVIDENCE_CUE =
  /\b(tenant evidence|needs evidence|validate against|before (committing|approving|any rollout)|once we have your|requires? your data|can'?t confirm without|won'?t fabricate|fabricat(?:e|ing) precision|do(?:es)?n'?t include your|would live in your|remaining field to confirm|missing tenant evidence|not in the loaded context|aren'?t in the loaded context|loaded context|not your data)\b/i;

function det(
  behavior: LiveAnswerBehavior,
  pass: boolean,
  note: string,
): LiveAnswerBehaviorResult {
  return { behavior, mode: "deterministic", pass, note };
}
function judged(
  behavior: LiveAnswerBehavior,
  note: string,
): LiveAnswerBehaviorResult {
  return { behavior, mode: "model-judged", pass: null, note };
}

function checkBehavior(
  behavior: LiveAnswerBehavior,
  obs: LiveAnswerObservation,
): LiveAnswerBehaviorResult {
  const p = obs.prose ?? "";
  switch (behavior) {
    case "output_shape_table":
      return det(
        behavior,
        Boolean(obs.hasTable),
        obs.hasTable ? "table present" : "no table emitted",
      );
    case "output_shape_chart":
      return det(
        behavior,
        Boolean(obs.hasChart),
        obs.hasChart ? "chart present" : "no chart emitted",
      );
    case "output_shape_graph":
      return det(
        behavior,
        Boolean(obs.hasGraph),
        obs.hasGraph ? "graph present" : "no graph emitted",
      );
    case "refuse_cross_tenant":
      return det(
        behavior,
        Boolean(obs.crossTenantBlocked) || REFUSE_CROSS_TENANT_CUE.test(p),
        "fence flag or refusal language",
      );
    case "cite_benchmark": {
      const dims = scoreAnswer(p, {
        questionId: "live",
        tenantKey: "eval",
        surface: "intelligence",
      }).dimensions;
      const ok = dims.noFakePrecision >= 100;
      return det(
        behavior,
        ok,
        "numbers pass the no-fake-precision source/benchmark gate",
      );
    }
    case "name_real_next_move": {
      const dims = scoreAnswer(p, {
        questionId: "live",
        tenantKey: "eval",
        surface: "intelligence",
      }).dimensions;
      return det(
        behavior,
        dims.realNextMove >= 75 && NEXT_MOVE_CUE.test(p),
        "a concrete next move is named",
      );
    }
    case "hedge_uncertainty":
      return det(behavior, HEDGE_CUE.test(p), "hedge / range language present");
    case "scope_down":
      return det(
        behavior,
        SCOPE_DOWN_CUE.test(p),
        "declines / redirects out-of-domain ask",
      );
    case "require_evidence":
      return det(
        behavior,
        REQUIRE_EVIDENCE_CUE.test(p),
        "asks for tenant evidence before committing",
      );
    case "surface_stuck_point":
      return det(
        behavior,
        STUCK_POINT_CUE.test(p),
        "names the CXO stuck-point (odds/adoption/ROI)",
      );
    case "no_fabrication":
      // Needs ground truth about what the tenant actually has — judge model only.
      return judged(
        behavior,
        "no invented tenant-specific facts/numbers/systems",
      );
    default:
      return judged(behavior, "unrecognized behavior — escalate to judge");
  }
}

/**
 * Check a single live-answer case against an observed Ava answer. The live
 * runner calls this, then escalates any `modelJudged` behaviors to a judge.
 */
export function checkLiveAnswerCase(
  c: LiveAnswerCase,
  obs: LiveAnswerObservation,
): LiveAnswerCaseResult {
  const behaviors = c.expectedBehaviors.map((b) => checkBehavior(b, obs));
  const deterministicResults = behaviors.filter(
    (b) => b.mode === "deterministic",
  );
  return {
    id: c.id,
    behaviors,
    deterministicPass: deterministicResults.every((b) => b.pass === true),
    modelJudged: behaviors
      .filter((b) => b.mode === "model-judged")
      .map((b) => b.behavior),
  };
}

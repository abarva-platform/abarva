import "server-only";

// PR9 — prose ⇄ structure consistency guard.
//
// The model emits narrative AND the structured block in the same run. If they
// disagree we must NOT silently pick one — we block the artifact. This module
// detects MATERIAL contradictions between the prose and the structured payload.
// Checks are deliberately conservative (only clear, well-anchored contradictions
// flag) so the guard blocks real drift, not stylistic variation.

import type { RoadmapStructuredInput } from "./roadmap-contract-extractor";
import type { RoadmapLifecycleState } from "./roadmap-lifecycle";

export interface ProseStructureMismatch {
  code:
    | "horizon_count_mismatch"
    | "control_gate_missing"
    | "milestone_missing_from_structure"
    | "dependency_resolved_but_unproven"
    | "lifecycle_finality_mismatch";
  detail: string;
  /** Material mismatches block the artifact; non-material are surfaced only. */
  material: boolean;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
};

/** Pull an explicit horizon/stage count the prose asserts, e.g. "four-stage",
 * "four horizons", "4 stages". Returns null if the prose makes no such claim. */
function proseHorizonCount(prose: string): number | null {
  const lower = prose.toLowerCase();
  const m = lower.match(
    /\b(one|two|three|four|five|six|seven|eight|\d+)[-\s]?(?:stage|horizon|phase)s?\b/,
  );
  if (!m) return null;
  const tok = m[1];
  return NUMBER_WORDS[tok] ?? (/^\d+$/.test(tok) ? Number(tok) : null);
}

function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/** Detect material prose⇄structure contradictions. */
export function checkProseStructureConsistency(args: {
  prose: string;
  input: RoadmapStructuredInput;
  lifecycleState: RoadmapLifecycleState;
}): ProseStructureMismatch[] {
  const { prose, input, lifecycleState } = args;
  const lower = prose.toLowerCase();
  const mismatches: ProseStructureMismatch[] = [];

  // 1) Horizon count: prose says N, structure has M.
  const distinctHorizons = new Set(input.cells.map((c) => c.horizon)).size;
  const claimed = proseHorizonCount(prose);
  if (
    claimed !== null &&
    distinctHorizons > 0 &&
    claimed !== distinctHorizons
  ) {
    mismatches.push({
      code: "horizon_count_mismatch",
      detail: `Prose asserts ${claimed} horizons/stages but the structure contains ${distinctHorizons}.`,
      material: true,
    });
  }

  // 2) Control-gate: title claims value scales only after controls, but no gate
  //    references control/governance approval.
  const title = input.executiveConclusion.toLowerCase();
  const claimsControlledScaling =
    /(scal\w+).{0,40}(after|once|when).{0,40}(control|govern)/.test(title) ||
    /(control|govern)\w*.{0,40}(before|prior).{0,40}scal/.test(title);
  if (claimsControlledScaling) {
    const hasControlGate = (input.decisionGates ?? []).some((g) =>
      /(control|govern|assur|risk)/i.test(`${g.name} ${g.criteria ?? ""}`),
    );
    if (!hasControlGate) {
      mismatches.push({
        code: "control_gate_missing",
        detail:
          "The executive conclusion says value scales only after controls are established, but no decision gate references a control/governance approval.",
        material: true,
      });
    }
  }

  // 3) (removed in PR14) The milestone_missing_from_structure check lexically
  //    compared prose "milestone" lines to structured milestone names. On real
  //    board narratives it false-positived on section HEADERS ("Value Milestones
  //    (Proof, Not Promises)") and generic mentions (live run 59389096). Matching
  //    prose milestones to structured ones reliably is too lossy, so the check is
  //    removed rather than left over-blocking. Horizon-count + control-gate +
  //    dependency + lifecycle checks (below) are the reliable contradiction
  //    signals and remain.

  // 4) Dependency the prose calls resolved but the structure marks unproven.
  for (const c of input.cells) {
    const dep = c.dependency?.trim();
    if (!dep) continue;
    if (
      c.evidenceStatus !== "evidence_required" &&
      c.evidenceStatus !== undefined
    )
      continue;
    const depWords = normalizeWords(dep);
    if (depWords.length === 0) continue;
    // Find a prose window mentioning the dependency's salient noun.
    const key = depWords[0];
    const idx = lower.indexOf(key);
    if (idx === -1) continue;
    const windowText = lower.slice(Math.max(0, idx - 60), idx + 120);
    if (
      /(resolved|in place|already secured|confirmed|completed|signed)/.test(
        windowText,
      )
    ) {
      mismatches.push({
        code: "dependency_resolved_but_unproven",
        detail: `Prose describes dependency "${dep}" as resolved/in place, but the structure marks it evidence_required.`,
        material: true,
      });
      break;
    }
  }

  // 5) Lifecycle/finality language vs the governed lifecycle state.
  // Only genuine finality CLAIMS about THIS artifact count — NOT the bare word
  // "final"/"finalized" (which appears innocuously in real board prose, e.g.
  // "finalized the data model") and NOT a factual "charter signed off". PR14
  // calibration: live run 59389096 false-positived on "final"/"finalized".
  const finalityInProse =
    /(approved for release|ready for (?:distribution|the board)|board[- ]ready|board[- ]approved|final(?:ized|ised)? and approved|signed off and approved|sponsor has accepted this|no further (?:changes|revisions|approvals) (?:are )?(?:needed|required))/.test(
      lower,
    );
  const draftInProse =
    /(review draft|draft for review|not yet approved|pending approval)/.test(
      lower,
    );
  if (finalityInProse && lifecycleState !== "exit_approved_final") {
    mismatches.push({
      code: "lifecycle_finality_mismatch",
      detail: `Prose uses finality language but the governed lifecycle state is "${lifecycleState}", not exit_approved_final.`,
      material: true,
    });
  }
  if (draftInProse && lifecycleState === "exit_approved_final") {
    mismatches.push({
      code: "lifecycle_finality_mismatch",
      detail:
        "Prose calls this a review draft / not-yet-approved, but the governed lifecycle state is exit_approved_final.",
      material: true,
    });
  }

  return mismatches;
}

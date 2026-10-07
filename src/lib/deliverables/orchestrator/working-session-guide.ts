// Which Moves deliverables are WORKING-SESSION GUIDES, and the purpose rules
// each one declares for itself.
//
// WHAT WAS WRONG
//
// The prompt builder branched the whole generation sequence on a working-guide
// path — the draft requirements, the red-team reviewer's role and criteria, the
// rewrite standard, the render instruction, the per-section draft framing, the
// next-actions requirement, the expected exhibits/tables lines, the quality-bar
// line, the formatting line, the size-discipline note and the length-and-purpose
// rules. Eleven call sites, every one of them keyed to a single literal:
//
//   req.module === "moves" && req.deliverableType === "design_workshop_guide"
//
// Five generatable deliverables are working guides, not one. They are declared
// as such in exactly one place — `WORKSHOP_GUIDE_QUALITY_BAR`
// (quality-bar-registry.ts), whose own comment reads "Working guide, not a
// phase decision artifact. It needs practical session instructions and gap
// discipline, not the decision/recommendation/risk-table spine required by
// board-grade gate artifacts." That object is shared by `discovery_plan`,
// `discovery_workshop_guide`, `design_workshop_guide`,
// `planning_workshop_guide`, `mobilization_workshop_guide` and
// `execution_kickoff_guide`.
//
// So four of the five guides a phase can build took the BOARD-GRADE path. They
// were drafted under "Include the required decision tables, risk/issues/
// dependencies table, ... and a clear recommendation with next steps",
// red-teamed by "a skeptical senior McKinsey partner ... preparing an artifact
// for a board steering committee" told to flag "unclear or missing decisions"
// and anything "too short for a board-grade artifact", rewritten to "strengthen
// ... the decision ask", and rendered with instructions to preserve "the
// recommendation, and next actions".
//
// Each of those four declares the opposite of that, twice over: its quality bar
// sets `requiresRecommendation`, `requiresDecisionSection` and
// `requiresRiskTable` to false, and its profile's own acceptance checks say it
// "does not make new sponsor, funding, design, or execution decisions". The
// synthesis pass already reads the declaration correctly
// (`req.qualityBar.requiresRecommendation` picks "a concise description of what
// this working guide enables, not a decision ask"), which is what makes the
// other eleven sites a borrowed literal rather than a missing signal — the
// request already carried the answer.
//
// WHY THE PREDICATE READS THREE FLAGS AND NOT A LIST OF KEYS
//
// A key list here would be a second place to remember when a sixth guide is
// added, and `WORKSHOP_GUIDE_QUALITY_BAR` is already the first. The three flags
// ARE the decision/recommendation/risk spine the board-grade prose assumes, and
// across every deliverable a Moves phase can generate they separate the set
// exactly: five guides have all three false, the other sixteen have all three
// true. `requiresRecommendation: false` appears nowhere in the registry except
// that one shared object. `phase-deliverable-working-session-guide.test.ts`
// pins both halves of that split by name, so a new deliverable that lands on
// the wrong side of it fails rather than silently taking the wrong path.
//
// PURPOSE RULES COME FROM THE GUIDE'S OWN PROFILE
//
// The length-and-purpose block used to state the design guide's purpose as a
// hand-written sentence ("prepares focused design decisions and estimate-ready
// scope"), which is false for a mobilization or kickoff guide. Each guide's
// profile already declares both halves: `decisionPurpose` (the sessions this
// guide prepares) and `acceptanceChecks` (what the finished guide must do).
// `acceptanceChecks` is typed as "Profile-specific acceptance checks (in
// addition to global gates)" and had ZERO production readers — CI asserts every
// phase deliverable declares some (phase-deliverable-quality-contract-coverage
// .test.ts) while nothing stated them to the pass that has to satisfy them.
// They are stated here, to the writer, and the gates are untouched.

import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";

/**
 * The parts of a generation request this decision reads. Narrower than
 * `DeliverableIntelligenceRequest` so the predicate can be exercised directly.
 */
export interface WorkingSessionGuideSignal {
  module: string;
  deliverableType: string;
  qualityBar: {
    requiresRecommendation: boolean;
    requiresDecisionSection: boolean;
    requiresRiskTable: boolean;
  };
}

/**
 * True when this deliverable is a working-session guide — a facilitation
 * document that prepares the sessions where decisions get made, rather than the
 * artifact that asks for one.
 */
export function isWorkingSessionGuide(req: WorkingSessionGuideSignal): boolean {
  if (req.module !== "moves") return false;
  const qb = req.qualityBar;
  return (
    !qb.requiresRecommendation &&
    !qb.requiresDecisionSection &&
    !qb.requiresRiskTable
  );
}

function guideProfile(req: WorkingSessionGuideSignal) {
  const key = deliverableKeyForOrchestratorType(req.deliverableType);
  return key ? DELIVERABLE_PROFILES[key] : undefined;
}

/**
 * The sessions this guide exists to prepare, as its profile declares them.
 *
 * Null when the orchestrator type resolves no profile — the caller then states
 * no purpose rather than a generic one invented here.
 */
export function workingSessionGuidePurpose(
  req: WorkingSessionGuideSignal,
): string | null {
  if (!isWorkingSessionGuide(req)) return null;
  return guideProfile(req)?.decisionPurpose ?? null;
}

/** The profile's acceptance checks for this guide; empty when none resolve. */
export function workingSessionGuideAcceptanceChecks(
  req: WorkingSessionGuideSignal,
): ReadonlyArray<string> {
  if (!isWorkingSessionGuide(req)) return [];
  return guideProfile(req)?.acceptanceChecks ?? [];
}

/**
 * The purpose lines for the length-and-purpose rules block, in the order they
 * are stated. Empty when nothing is declared, so the block keeps its shape
 * instead of carrying an empty bullet.
 */
export function workingSessionGuidePurposeRules(
  req: WorkingSessionGuideSignal,
): string[] {
  const out: string[] = [];
  const purpose = workingSessionGuidePurpose(req);
  if (purpose) {
    out.push(
      `- Purpose of this guide: ${purpose} It does not do that work itself and it does not decide anything the sessions exist to decide.`,
    );
  }
  const checks = workingSessionGuideAcceptanceChecks(req);
  if (checks.length > 0) {
    out.push(
      `- The finished guide is accepted only if every one of these holds: ${checks.join("; ")}.`,
    );
  }
  return out;
}

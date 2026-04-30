// Phase Intelligence Pack · Programs Strict Completion v1.2 · Surface 2 PR-A
//
// What problem this solves
// ────────────────────────
// Closes the agent-fluency gap. Before this layer, Nexus knew the program's
// current_phase number ("P3") and the gate rules at the *exit* of each
// phase, but had no opinionated coaching knowledge for what to do *during*
// the phase. The result was a generic chatbot decorated with phase labels.
//
// A PhasePack is a per-phase playbook — a structured, opinionated answer to:
//   • What does successful completion of this phase produce?
//   • What questions should Nexus ask, sequenced from open → converge → close?
//   • What anti-patterns should Nexus flag proactively?
//   • What evidence does the phase need before it can advance?
//   • How should Nexus's posture evolve from entry to mid to exit?
//   • What does this phase need from prior phases / produce for the next?
//
// Relationship to existing per-pattern intelligence
// ────────────────────────────────────────────────
// LifecyclePatternSeed (src/lib/intelligence/seed-types.ts) holds
// pattern-specific knowledge — CDP failure modes, AMS contradictions, etc.
// PhasePack holds pattern-agnostic discipline — what's true of every Charter
// phase regardless of which pattern the program is running. Nexus loads
// both: the active phase's pack PLUS the program's pattern's per-stage
// criteria. Generic + specific.
//
// Authoring contract
// ──────────────────
// The packs must read like a senior program leader's playbook, not a
// consulting deck. Concretely:
//   • Anti-patterns must be observable — "what would Nexus see in chat or
//     evidence that proves this is happening" — not vibes.
//   • Questions must have a `why` — Nexus uses it to know when the
//     question is satisfied vs still open.
//   • Evidence items must have an `evaluationHint` — how Nexus knows the
//     evidence exists, not just that it should.
//   • Coaching arc text must change Nexus's *posture*, not just describe
//     the phase.

export type PhaseNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ── Step decomposition · OV2-5-types ────────────────────────────────────────
//
// Adds the PhaseStep doctrine from
// docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Part C.4.
// A PhaseStep is the unit at which the agent decides what to do next:
// simple steps are chat-resolvable, complex steps require off-platform work
// (workshop / interview / baseline) gated by intent capture before and an
// upload after. This slice adds the type only; the `steps` field on PhasePack
// is optional so existing packs continue to type-check unchanged. Pack
// content is authored in follow-on slices (one pack per slice).

export type StepComplexity = 'simple' | 'complex';

export type AgentStepRole =
  | 'extract'
  | 'validate'
  | 'coach_workshop'
  | 'coach_interview'
  | 'coach_baseline'
  | 'evaluate_evidence'
  | 'request_approval'
  | 'flag_anti_pattern'
  | 'compose_artifact';

export interface PhaseStep {
  id: string;
  label: string;
  complexity: StepComplexity;
  agentRole: AgentStepRole;
  inputs: string[];
  outputs: string[];
  templateRefs: string[];
  preventsFailureModes: number[];
  intentCaptureRequired: boolean;
  postMeetingUploadExpected: boolean;
}

/** A single piece of evidence that the phase produces or requires. */
export interface PhaseEvidenceItem {
  /** Stable id, kebab-case. Referenced by anti-patterns and tools. */
  id: string;
  /** Short label rendered in UI. */
  label: string;
  /** Hard = blocks advance. Soft = flag, can advance with rationale. */
  severity: 'hard' | 'soft';
  /** How Nexus knows this evidence exists — not the criterion itself. */
  evaluationHint: string;
  preventsFailureModes?: number[];
}

/** A single question Nexus should drive toward. Sequenced by arc. */
export interface PhaseQuestion {
  id: string;
  /** The actual question, phrased the way Nexus would ask it. */
  text: string;
  /** Why this matters at this point in the phase. Used to detect resolution. */
  why: string;
  /** Optional shape of a "good enough" answer — helps Nexus judge sufficiency. */
  expectedAnswerShape?: string;
  preventsFailureModes?: number[];
}

/** A failure mode Nexus must surface proactively when the signal appears. */
export interface PhaseAntiPattern {
  id: string;
  /** Punchy name a senior PM would recognize. */
  label: string;
  /** Observable signal that this is happening — what Nexus sees. */
  detectionHint: string;
  /** What Nexus should say or do when the signal fires. */
  whatToFlag: string;
  /** What to redirect the conversation toward. */
  mitigation: string;
  preventsFailureModes?: number[];
}

/** Posture changes across the phase — entry / mid / exit. */
export interface PhaseCoachingArc {
  /** First few turns of conversation. Establishes priors, sets expectations. */
  entry: string;
  /** Bulk of the phase. Drives convergence. */
  midPhase: string;
  /** Last stretch before the gate. Locks evidence, validates sign-off authority. */
  exit: string;
}

/** Cross-phase evidence flow. Lets Nexus reason about handoffs. */
export interface PhaseDependencies {
  /** What this phase needs to be in place from prior phases. */
  requiresFromPrior: string[];
  /** What this phase produces for downstream phases. */
  producesForNext: string[];
}

export interface PhasePack {
  phase: PhaseNumber;
  /** Display label, e.g. 'P2 Charter'. Matches PHASE_LABEL_MAP. */
  label: string;
  /**
   * One-paragraph definition of successful completion. Read aloud, this is
   * what Nexus would tell a sponsor "we'll know this phase is done when…".
   */
  outcome: string;
  /** Evidence items the phase needs. Hard items block advance. */
  definitionOfDone: PhaseEvidenceItem[];
  /** Questions sequenced by phase arc. */
  rightQuestions: {
    open: PhaseQuestion[];
    converge: PhaseQuestion[];
    close: PhaseQuestion[];
  };
  /** Anti-patterns Nexus must surface when detected. */
  antiPatterns: PhaseAntiPattern[];
  coachingArc: PhaseCoachingArc;
  dependencies: PhaseDependencies;
  /**
   * Optional step decomposition. See OV2-5-types block above and design doc
   * Part C.4. Optional because pack content is authored per-pack in follow-on
   * slices; existing packs without `steps` remain valid.
   */
  steps?: PhaseStep[];
}

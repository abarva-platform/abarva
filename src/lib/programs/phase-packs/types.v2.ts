/**
 * Phase Pack V2 · AbarVa Strategic Moves
 *
 * 21-field schema for Nexus agent training packs.
 * This schema is ADDITIVE to V1 (types.ts) — V1 types remain unchanged.
 * V2 packs replace V1 packs during the S-4 migration.
 *
 * Authoring contract:
 *   - Each field maps to a section in the training pack markdown doc.
 *   - `satisfies` expressions in pack files provide structural validation at
 *     author time without losing the literal types used by the pack's own fields.
 *   - Pack files import ONLY from types.v2 (not from types.ts); the loader
 *     bridges V2 packs to the V1 loader interface during the migration period.
 */

export type PhaseNumber = 0 | 1 | 2 | 3 | 4 | 5;

// ── §3.1 Inner types ────────────────────────────────────────────────────────

/** Entry or exit gate criterion — input to the phase or output from the gate. */
export interface PhaseCriterion {
  id: string;
  /** Short label — how this appears in gate UI. */
  description: string;
  /** hard = blocks; soft = flags with warning but can override. */
  type: 'hard' | 'soft';
}

/** A single step in the guided workflow for the phase. */
export interface WorkflowStep {
  /** Stable ID, e.g. "P0.1", "P4.3". Matches Layer 3 interaction IDs. */
  step_id: string;
  step_name: string;
  /** One sentence: what "done" for this step means. */
  step_goal: string;
  /** What the human must provide before this step can complete. */
  required_user_inputs: string[];
  /** MIME types Nexus accepts for uploads during this step. */
  accepted_uploads: string[];
  /** Pattern keys to load from the knowledge store for this step. */
  patterns_to_load: string[];
  /** Ordered list of questions Nexus asks to drive this step. */
  questions_to_ask: string[];
  /** Artifact sections whose content should be updated during this step. */
  artifact_sections_to_update: string[];
  /** Evidence keys that Nexus should capture and record during this step. */
  evidence_to_capture: string[];
  /** Assertions Nexus checks before marking the step complete. */
  quality_checks: string[];
  /** Boolean-expression strings; all must be true to mark step done. */
  completion_criteria: string[];
}

/** A gate criterion evaluated at phase exit. */
export interface GateCriterion {
  id: string;
  /** Display label in the gate panel. */
  label: string;
  /** hard = blocks promotion; soft = warning only. */
  type: 'hard' | 'soft';
  /** How Nexus evaluates whether this criterion is met. */
  evaluation: string;
  /** What rule governs this criterion (block, warn, or advisory). */
  gating_rule: string;
  /**
   * Pilot approval note — describes who can approve in pilot tier.
   * Omit if same as default (any authenticated user).
   */
  pilot_approval_note?: string;
  /**
   * Production approval note — describes who can approve when
   * GATE_APPROVAL_STRICT_MODE = true.
   * Required for soft criteria (where self-approval semantics differ).
   */
  production_approval_note?: string;
  prevents_failure_modes?: string[];
}

/** An evidence item the phase requires or produces. */
export interface EvidenceRequirement {
  id: string;
  label: string;
  /** hard = phase cannot complete without this; soft = flag if missing. */
  type: 'hard' | 'soft';
  /** Where this evidence comes from (upload, substrate field, session capture). */
  source: string;
  /** How Nexus knows the evidence exists — not the criterion itself. */
  evaluation_hint: string;
  prevents_failure_modes?: string[];
}

/**
 * A self-approval rule — defines when Nexus (the AI) may mark a gate
 * criterion as met without human confirmation.
 *
 * NOTE: These govern Nexus (AI) self-approval ONLY. They do NOT restrict
 * human users from confirming criteria. Human self-approval by an
 * authenticated user is permitted in pilot per R9.
 */
export interface SelfApprovalRule {
  /** ID of the GateCriterion this rule applies to. */
  criterion_id: string;
  /** Condition that must be true for Nexus to self-approve. */
  condition: string;
  /** Whether Nexus may self-approve this criterion when condition is met. */
  nexus_may_self_approve: boolean;
  /** Label Nexus uses in audit output: "Nexus self-approved: [label]". */
  approval_label: string;
}

/** A rule governing when and how Nexus may generate an artifact draft. */
export interface ArtifactGenerationRule {
  /** Artifact key from the AbarVa artifact taxonomy, e.g. "BRIEF-P0". */
  artifact: string;
  /** Whether Nexus may auto-draft without explicit user request. */
  nexus_may_auto_draft: boolean;
  /** Step completion conditions that unlock drafting. */
  conditions: string[];
  /** What the human must provide or validate. null = no constraint. */
  human_direction_required: string | null;
}

/** An observable signal + required response for a specific failure mode. */
export interface AntiHallucinationRule {
  /** Stable ID, e.g. "AH-P0-1". */
  id: string;
  /** One-sentence rule statement. */
  rule: string;
  /** What observable event triggers this rule. */
  trigger: string;
  /** How Nexus must respond when trigger fires. */
  required_behavior: string;
  /** Response Nexus is prohibited from giving. */
  prohibited_behavior: string;
}

/** A coaching heuristic governing Nexus's posture in a specific situation. */
export interface CoachingRule {
  /** Stable ID, e.g. "CR-P1-1". */
  id: string;
  /** One-sentence rule statement. */
  rule: string;
  /** What situation activates this rule. */
  trigger: string;
  required_behavior: string;
  prohibited_behavior: string;
}

/** An observable anti-pattern Nexus must surface proactively. */
export interface AntiPattern {
  id: string;
  label: string;
  /** What Nexus sees in chat or evidence that signals this pattern is active. */
  detection_hint: string;
  /** What Nexus says when the pattern fires. */
  what_to_flag: string;
  /** What to redirect the conversation toward. */
  mitigation: string;
  prevents_failure_modes?: string[];
}

/** Posture coaching arc — entry / mid / exit. */
export interface CoachingArc {
  entry: string;
  mid: string;
  exit: string;
}

/**
 * A test fixture for the pack's test harness (T-D.3).
 * Each fixture represents a scenario that the pack's behavior should handle.
 */
export interface Fixture {
  /** Stable ID, e.g. "FX-P0-1". */
  id: string;
  name: string;
  description: string;
  /** State of the engagement at the time of the test (subset of DB fields). */
  input: Record<string, unknown>;
  /** Expected behaviors Nexus should exhibit in this scenario. */
  expected_behaviors: string[];
  /** Behaviors Nexus is prohibited from exhibiting in this scenario. */
  prohibited_behaviors?: string[];
}

/**
 * P4-specific Tower Metric Plan Authority.
 * This field is ONLY present on the P4 pack.
 */
export interface TowerMetricPlanAuthority {
  /** Rule ID — used in gate enforcement. */
  rule: string;
  /**
   * Trigger condition — when proactive surfacing fires.
   * Typically: "roadmap_draft_exists AND business_case_draft_exists".
   */
  trigger: string;
  /** Opening message Nexus sends when the trigger fires. */
  opening_message: string;
  /** Redirect message when team attempts to defer to P5. */
  deferral_redirect: string;
  /** Response Nexus is prohibited from giving. */
  prohibited_behavior: string;
  /** Required response pattern — the structure Nexus uses to define a metric. */
  required_pattern: string;
  /** Gate enforcement rule key. */
  gate_block: string;
  /** Additional trigger scenarios. */
  triggers: string[];
}

// ── §3.2 Root type ──────────────────────────────────────────────────────────

/** V2 PhasePack — 21-field schema. */
export interface PhasePack {
  // Field 1
  phase_id: PhaseNumber;
  // Field 2
  phase_name: string;
  // Field 3
  phase_intent: string;
  // Field 4 — entry gate
  entry_criteria: PhaseCriterion[];
  // Field 5 — workflow steps
  workflow_steps: WorkflowStep[];
  // Field 6 — phase outcome (what "done" produces)
  phase_outcome: string;
  // Field 7 — scope boundary
  phase_scope_boundary: {
    in: string[];
    out: string[];
    partial?: string[];
  };
  // Field 8 — coaching arc
  agent_posture_coaching_arc: CoachingArc;
  // Field 9 — question sequencing
  question_sequencing: {
    open: string[];
    converge: string[];
    close: string[];
  };
  // Field 10 — evidence requirements
  evidence_requirements: EvidenceRequirement[];
  // Field 11 — exit criteria (gate entry pre-checks)
  exit_criteria: PhaseCriterion[];
  // Field 12 — gate criteria (formal gate checks)
  gate_criteria: GateCriterion[];
  // Field 13 — anti-patterns
  anti_patterns: AntiPattern[];
  // Field 14 — self-approval rules (Nexus AI only; human approval governed by R9)
  self_approval_rules: SelfApprovalRule[];
  // Field 15 — first-message variants (used by Layer 5 knowledge surfacing)
  first_message: {
    variant: string;
    template: string;
  }[];
  // Field 16 — fixtures for T-D.3 test harness
  fixtures: Fixture[];
  // Field 17 — coaching rules
  coaching_rules: CoachingRule[];
  // Field 18 — artifact generation rules
  artifact_generation_rules: ArtifactGenerationRule[];
  // Field 19 — anti-hallucination rules
  anti_hallucination_rules: AntiHallucinationRule[];
  // Field 20 — global patterns to always load for this phase
  patterns_to_load: string[];
  // Field 21 — cross-phase dependencies
  phase_dependencies: {
    requires_from_prior: string[];
    produces_for_next: string[];
  };
  /**
   * P4-only: Tower metric plan authority.
   * Optional — only present when phase_id === 4.
   */
  tower_metric_plan_authority?: TowerMetricPlanAuthority;
}

# T-D.1 — Pack Serialization Format

| | |
|---|---|
| **Work Package** | T-D.1 |
| **Doc ID** | `AGENT_TRAINING_TD1_PACK_SERIALIZATION_FORMAT` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | T-P0 through T-P5 (21-field schema established across all packs), T-X.2 (global behavioral rules) |
| **Produces** | `src/lib/programs/phase-packs/types.v2.ts` — canonical TypeScript type definitions for V2 packs |
| **Referenced by** | T-D.2 (loader integration), T-D.3 (test harness) |

---

## §1 · Purpose

The training packs (T-P0 through T-P5) define a **21-field V2 PhasePack schema** that is richer and more opinionated than the existing V1 schema in `src/lib/programs/phase-packs/types.ts`. Each pack's TypeScript block imports from `@/lib/programs/phase-packs/types` using type names that do not yet exist in that file.

This document specifies the complete TypeScript type system for V2 packs. It is the single source of truth that:

1. Defines all 21 fields of `PhasePack` (V2)
2. Defines all inner types (`WorkflowStep`, `GateCriterion`, etc.)
3. Specifies the migration strategy — V2 types live in `types.v2.ts`; V1 types remain in `types.ts` until S-4 migration
4. Documents the `satisfies` pattern used in pack files for structural validation

---

## §2 · V1 vs V2 schema comparison

| Dimension | V1 (`types.ts`) | V2 (`types.v2.ts`) |
|---|---|---|
| Primary key | `phase: PhaseNumber` | `phase_id: PhaseNumber` |
| Phase intent | `outcome: string` | `phase_intent: string` + `phase_outcome: string` |
| Workflow decomposition | `steps?: PhaseStep[]` (optional, minimal) | `workflow_steps: WorkflowStep[]` (required, full inner schema) |
| Gate criteria | `definitionOfDone: PhaseEvidenceItem[]` (no type=hard/soft) | `gate_criteria: GateCriterion[]` with `type: 'hard' \| 'soft'`, pilot/prod notes |
| Questions | `rightQuestions: { open, converge, close }` (PhaseQuestion[]) | `question_sequencing: { open, converge, close }` (string[], simpler) |
| Anti-patterns | `antiPatterns: PhaseAntiPattern[]` | `anti_patterns: AntiPattern[]` (same shape, renamed) |
| Coaching arc | `coachingArc: PhaseCoachingArc` | `agent_posture_coaching_arc: CoachingArc` (same shape, renamed) |
| Anti-hallucination | Not in V1 | `anti_hallucination_rules: AntiHallucinationRule[]` |
| Artifact generation | Not in V1 | `artifact_generation_rules: ArtifactGenerationRule[]` |
| Self-approval | Not in V1 | `self_approval_rules: SelfApprovalRule[]` |
| Evidence requirements | `definitionOfDone` doubles as evidence | `evidence_requirements: EvidenceRequirement[]` (separate) |
| Fixtures | Not in V1 | `fixtures: Fixture[]` |
| Phase-specific authority | Not in V1 | `tower_metric_plan_authority?` (P4 only) |

---

## §3 · Canonical TypeScript type definitions

The following types should be written verbatim to `src/lib/programs/phase-packs/types.v2.ts`.

```typescript
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
```

---

## §4 · Migration strategy

### §4.1 Parallel coexistence (pilot phase)

During the migration period:

- V1 types remain in `src/lib/programs/phase-packs/types.ts` — untouched
- V1 pack files remain (`P0_originate.ts` through `P5_activate.ts`) — untouched
- V2 types live in `src/lib/programs/phase-packs/types.v2.ts`
- V2 pack files live in `src/lib/programs/phase-packs/v2/` (e.g., `P0_originate.v2.ts`)
- The loader (`index.ts`) is extended to support both versions via a feature flag (see T-D.2 §3)

This allows T-D.4 pack rollout to proceed phase-by-phase without breaking the existing chat flow.

### §4.2 S-4 final migration (post-validation)

After T-D.4 validates all 6 V2 packs in production:

1. Delete V1 pack files (`P0_originate.ts` through `P5_activate.ts`)
2. Rename V2 pack files (drop the `v2/` prefix)
3. Rename `types.v2.ts` → `types.ts` (or merge V2 types into the existing file, deprecating V1 types)
4. Update `index.ts` to remove the feature flag and use V2 exclusively

### §4.3 `satisfies` pattern

Pack files use the TypeScript `satisfies` operator rather than type annotation:

```typescript
export const P0_ORIGINATE_PACK: PhasePack = {
  // ...fields
} satisfies PhasePack;
```

This provides structural validation at author time while preserving the literal types of each field. The `satisfies` pattern catches missing fields at compile time but allows the pack to carry richer metadata without explicit casts.

---

## §5 · File location and import paths

| File | Purpose |
|---|---|
| `src/lib/programs/phase-packs/types.v2.ts` | V2 type definitions (this spec) |
| `src/lib/programs/phase-packs/v2/P0_originate.v2.ts` | V2 P0 pack |
| `src/lib/programs/phase-packs/v2/P1_charter.v2.ts` | V2 P1 pack |
| `src/lib/programs/phase-packs/v2/P2_diagnose.v2.ts` | V2 P2 pack |
| `src/lib/programs/phase-packs/v2/P3_design.v2.ts` | V2 P3 pack |
| `src/lib/programs/phase-packs/v2/P4_roadmap.v2.ts` | V2 P4 pack |
| `src/lib/programs/phase-packs/v2/P5_mobilize.v2.ts` | V2 P5 pack |
| `src/lib/programs/phase-packs/v2/index.ts` | V2 pack registry |

Training pack markdown docs (in `docs/design/strategic-moves/agent-training/`) use the import path:
```typescript
import type { PhasePack, WorkflowStep, ... } from "@/lib/programs/phase-packs/types";
```
During migration, `@/lib/programs/phase-packs/types` should re-export V2 types alongside V1 types, resolving the import path the training packs expect.

---

## §6 · Self-QA

| Check | Status |
|---|---|
| All 21 fields defined in `PhasePack` interface | PASS |
| All inner types defined: `WorkflowStep`, `GateCriterion`, `EvidenceRequirement`, `SelfApprovalRule`, `ArtifactGenerationRule`, `AntiHallucinationRule`, `CoachingRule`, `AntiPattern`, `CoachingArc`, `Fixture`, `TowerMetricPlanAuthority` | PASS |
| `tower_metric_plan_authority` is optional (P4-only) | PASS |
| `self_approval_rules` comments clarify Nexus (AI) scope per R8/R9 | PASS |
| V1 migration strategy documented | PASS |
| `satisfies` pattern documented | PASS |
| Import path for training pack docs specified | PASS |

---

## §7 · Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — full 21-field type system; V1 coexistence strategy | Claude Code |

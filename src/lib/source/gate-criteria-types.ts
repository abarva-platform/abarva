// F-M1-204 · Gate criteria per-criterion state types
//
// Mirrors the gate_criteria and gate_criterion_states tables
// introduced in supabase/migrations/20260507210000_gate_criteria_substrate.sql.
// These are view-model types (camelCase) used by API routes and UI components.

export interface GateCriterion {
  id: string;
  programId: string;
  stageKey: string;
  criterionId: string;
  title: string;
  description?: string;
  severity: 'hard' | 'soft' | 'informational';
  required: boolean;
}

export type GateCriterionState = 'pending' | 'met' | 'not_met' | 'waived' | 'deferred';

export interface GateCriterionStateRecord {
  id: string;
  gateCriteriaId: string;
  state: GateCriterionState;
  reviewerUserId?: string;
  reviewedAt?: string;
  notes?: string;
  evidenceArtifactIds: string[];
}

// ── Specialist registry types ────────────────────────────────────────────────
// Mirrors specialist_registry table from
// supabase/migrations/20260507200000_specialist_registry.sql.

export type SpecialistFlavor = 'sentinel' | 'nexus' | 'atlas' | 'steward';

export interface SpecialistRegistryEntry {
  id: string;
  specialistId: string;
  name: string;
  flavor: SpecialistFlavor;
  purpose: string;
  inputs: string[];
  outputs: string[];
  ownerAgent: string;
  active: boolean;
}

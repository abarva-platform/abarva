/**
 * PAT4 · AI Program Failure Modes → Solution Pattern Runtime Map
 *
 * Bridges the PF1 AI Program Failure Modes pack
 * (src/lib/intelligence/ai-program-failure-modes.ts) with the PAT1–PAT3
 * solution pattern packs, creating a deterministic mapping from failure
 * modes to applicable sourcing / evaluation patterns.
 *
 * Use this module when an agent needs to surface "which sourcing or
 * evaluation pattern applies given the failure modes detected in this
 * programme."
 *
 * No model calls. No DB writes. No React hooks. No Date.now reads.
 * Same input → identical output every time (deterministic seed).
 *
 * This module does NOT import:
 *   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
 *   - src/lib/agent/**, src/components/agent/**
 *   - src/lib/source/**, src/app/(maestro)/source/**
 *   - src/app/programs/**
 *   - src/lib/programs/mock.ts
 *   - src/lib/auth/**
 *   - supabase/**
 */

import type {
  AiProgramFailureKey,
  AiProgramFailureAgent,
} from '../intelligence/ai-program-failure-modes';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Which solution pattern pack does the mapping reference. */
export type SolutionPatternPack =
  | 'pat1_data_platform_managed_services'
  | 'pat2_ims_managed_services'
  | 'pat3_vendor_evaluation';

/** A single mapping entry tying a failure mode to a solution action. */
export interface FailureModeSolutionMapping {
  /** The PF1 failure mode key this entry maps from. */
  failureModeKey: AiProgramFailureKey;
  /** The pattern pack that addresses this failure mode. */
  patternPack: SolutionPatternPack;
  /** Slug(s) within that pack that are most relevant. */
  patternSlugs: ReadonlyArray<string>;
  /** Primary agent responsible for applying the pattern. */
  primaryAgent: AiProgramFailureAgent;
  /** Short rationale explaining why this pattern applies. */
  rationale: string;
  /** Specific criteria IDs within the pattern that are most salient. */
  salientCriteriaIds: ReadonlyArray<string>;
  createdFrom: 'pat4_ai_failure_modes_solution_map';
}

/** Lookup result returned by mapFailureModeToSolutions. */
export interface FailureModeSolutionResult {
  failureModeKey: AiProgramFailureKey;
  mappings: ReadonlyArray<FailureModeSolutionMapping>;
  /** True if at least one mapping exists. */
  hasMappings: boolean;
}

/** Aggregated report for a set of failure modes. */
export interface FailureModesSolutionReport {
  failureModeKeys: ReadonlyArray<AiProgramFailureKey>;
  results: ReadonlyArray<FailureModeSolutionResult>;
  /** All unique pattern slugs across all mappings. */
  uniquePatternSlugs: ReadonlyArray<string>;
  /** All unique pattern packs across all mappings. */
  uniquePatternPacks: ReadonlyArray<SolutionPatternPack>;
  totalMappings: number;
  createdFrom: 'pat4_ai_failure_modes_solution_map';
}

// ---------------------------------------------------------------------------
// Mapping table (deterministic seed)
// ---------------------------------------------------------------------------

const FAILURE_MODE_SOLUTION_MAPPINGS: ReadonlyArray<FailureModeSolutionMapping> = [
  // ---- weak_data_foundation -------------------------------------------------
  {
    failureModeKey: 'weak_data_foundation',
    patternPack: 'pat1_data_platform_managed_services',
    patternSlugs: ['data-platform-vendor-selection-criteria'],
    primaryAgent: 'steward',
    rationale:
      'A weak data foundation is addressed at the source: the data platform managed services procurement. PAT1 criteria dpms-c001 (technical depth) and dpms-c005 (data governance) directly target the controls needed to prevent data foundation degradation.',
    salientCriteriaIds: ['dpms-c001', 'dpms-c005', 'dpms-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  {
    failureModeKey: 'weak_data_foundation',
    patternPack: 'pat1_data_platform_managed_services',
    patternSlugs: ['data-platform-transition-governance'],
    primaryAgent: 'steward',
    rationale:
      'The transition governance pattern (dpms-c006, dpms-c007) ensures runbook completeness and stabilisation gates that prevent knowledge loss from creating a weak data foundation during vendor handover.',
    salientCriteriaIds: ['dpms-c006', 'dpms-c007'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- no_measurable_baseline -----------------------------------------------
  {
    failureModeKey: 'no_measurable_baseline',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'atlas',
    rationale:
      'Vendor evaluation without a measurable baseline produces uncommitted SLA credits. PAT3 criterion vep-c004 (SLA credits) and commercial risk vep-cr002 (pricing comparability gap) enforce the measurement structure.',
    salientCriteriaIds: ['vep-c004', 'vep-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- no_value_ledger -------------------------------------------------------
  {
    failureModeKey: 'no_value_ledger',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'atlas',
    rationale:
      'A missing value ledger at vendor selection leads to no ROI accountability. PAT3 dimension commercial_structure and strategic_alignment (vep-c010) surface whether the vendor has committed to measurable value delivery.',
    salientCriteriaIds: ['vep-c010', 'vep-c003', 'vep-c004'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- weak_workflow_integration --------------------------------------------
  {
    failureModeKey: 'weak_workflow_integration',
    patternPack: 'pat2_ims_managed_services',
    patternSlugs: ['ims-vendor-selection-criteria'],
    primaryAgent: 'nexus',
    rationale:
      'Weak workflow integration arises when managed services vendors have unclear scope and inadequate tooling. PAT2 criterion ims-c001 (scope definition) and ims-c002 (tooling/automation) directly address integration readiness.',
    salientCriteriaIds: ['ims-c001', 'ims-c002'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  {
    failureModeKey: 'weak_workflow_integration',
    patternPack: 'pat1_data_platform_managed_services',
    patternSlugs: ['data-platform-vendor-selection-criteria'],
    primaryAgent: 'nexus',
    rationale:
      'Data platform integration weaknesses are prevented by PAT1 criterion dpms-c002 (24/7 operational model) and dpms-c003 (transition risk methodology) which mandate integration readiness gates before go-live.',
    salientCriteriaIds: ['dpms-c002', 'dpms-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- tool_first_thinking --------------------------------------------------
  {
    failureModeKey: 'tool_first_thinking',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'nexus',
    rationale:
      'Tool-first thinking during vendor selection is countered by PAT3 dimension strategic_alignment (vep-c010): it forces evaluation of vendor roadmap alignment to client AI strategy before capability scoring.',
    salientCriteriaIds: ['vep-c010', 'vep-c001'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- missing_governance_risk ----------------------------------------------
  {
    failureModeKey: 'missing_governance_risk',
    patternPack: 'pat1_data_platform_managed_services',
    patternSlugs: ['data-platform-vendor-selection-criteria'],
    primaryAgent: 'steward',
    rationale:
      'Governance gaps are addressed at the data platform layer. PAT1 criterion dpms-c005 (data governance framework) enforces access controls, audit logging, and data residency commitments as selection gates.',
    salientCriteriaIds: ['dpms-c005'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  {
    failureModeKey: 'missing_governance_risk',
    patternPack: 'pat2_ims_managed_services',
    patternSlugs: ['ims-vendor-selection-criteria'],
    primaryAgent: 'steward',
    rationale:
      'Infrastructure governance gaps are addressed by PAT2 criterion ims-c004 (security and compliance), which requires SOC2 Type II, ISO 27001, and PAM tooling as BAFO prerequisites.',
    salientCriteriaIds: ['ims-c004'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  {
    failureModeKey: 'missing_governance_risk',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'steward',
    rationale:
      'PAT3 dimension contractual_protection (vep-c009) enforces IP ownership, data protection schedules covering AI data usage rights, and liability caps as auto-inclusion criteria.',
    salientCriteriaIds: ['vep-c009'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- no_adoption_change_plan ----------------------------------------------
  {
    failureModeKey: 'no_adoption_change_plan',
    patternPack: 'pat2_ims_managed_services',
    patternSlugs: ['ims-vendor-selection-criteria'],
    primaryAgent: 'nexus',
    rationale:
      'Adoption failures in managed services contexts arise from staffing model gaps. PAT2 criterion ims-c003 (staffing model) requires named account teams and backup coverage — structural enablers for sustainable adoption.',
    salientCriteriaIds: ['ims-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- no_operating_model_for_scale -----------------------------------------
  {
    failureModeKey: 'no_operating_model_for_scale',
    patternPack: 'pat2_ims_managed_services',
    patternSlugs: ['ims-vendor-selection-criteria'],
    primaryAgent: 'atlas',
    rationale:
      'Operating model gaps at scale are prevented by PAT2 failure mode ims-fm002 (key person dependency) and criterion ims-c002 (tooling/automation): scale requires documented tooling, not tribal knowledge.',
    salientCriteriaIds: ['ims-c002', 'ims-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  {
    failureModeKey: 'no_operating_model_for_scale',
    patternPack: 'pat1_data_platform_managed_services',
    patternSlugs: ['data-platform-transition-governance'],
    primaryAgent: 'atlas',
    rationale:
      'Scale operating model readiness requires PAT1 transition governance: runbook completeness (dpms-c007) and stabilisation phase gates (dpms-c006) confirm the operating model is portable beyond the founding team.',
    salientCriteriaIds: ['dpms-c006', 'dpms-c007'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- pilot_purgatory -------------------------------------------------------
  {
    failureModeKey: 'pilot_purgatory',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'atlas',
    rationale:
      'Pilot purgatory is driven by BAFO indecision. PAT3 BAFO eligibility scoring (normalised threshold 55/100) and auto-exclusion criteria impose objective gates that force a decision rather than endless extension.',
    salientCriteriaIds: ['vep-c001', 'vep-c003', 'vep-c008'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- ai_tool_sprawl_without_value -----------------------------------------
  {
    failureModeKey: 'ai_tool_sprawl_without_value',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'atlas',
    rationale:
      'AI tool sprawl is countered by forcing every new tool through PAT3 evaluation: strategic_alignment (vep-c010) blocks additions that do not align with the client AI strategy, and commercial_structure (vep-c003) surfaces true cost.',
    salientCriteriaIds: ['vep-c010', 'vep-c003'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- poor_use_case_framing ------------------------------------------------
  {
    failureModeKey: 'poor_use_case_framing',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'nexus',
    rationale:
      'Poor use case framing surfaces during vendor selection when scope is defined by vendor convenience rather than business need. PAT3 criterion vep-c002 (proposal scope without unexplained dependencies) forces clarity on what the vendor is actually delivering.',
    salientCriteriaIds: ['vep-c002'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
  // ---- no_business_owner ----------------------------------------------------
  {
    failureModeKey: 'no_business_owner',
    patternPack: 'pat3_vendor_evaluation',
    patternSlugs: ['vendor-evaluation-scorecard'],
    primaryAgent: 'steward',
    rationale:
      'Without a named business owner, vendor SLA disputes have no internal arbiter. PAT3 dimension strategic_alignment (vep-c010) requires a named C-level executive sponsor — the internal accountability signal for business ownership.',
    salientCriteriaIds: ['vep-c010'],
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  },
];

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

/**
 * Return all solution pattern mappings for a given AI failure mode key.
 */
export function mapFailureModeToSolutions(
  failureModeKey: AiProgramFailureKey,
): FailureModeSolutionResult {
  const mappings = FAILURE_MODE_SOLUTION_MAPPINGS.filter(
    (m) => m.failureModeKey === failureModeKey,
  );
  return {
    failureModeKey,
    mappings,
    hasMappings: mappings.length > 0,
  };
}

/**
 * Build an aggregated solution report for a set of failure mode keys.
 * Duplicate pattern slugs are deduplicated in the output.
 */
export function buildFailureModesSolutionReport(
  failureModeKeys: ReadonlyArray<AiProgramFailureKey>,
): FailureModesSolutionReport {
  const results = failureModeKeys.map((key) => mapFailureModeToSolutions(key));

  const allMappings = results.flatMap((r) => r.mappings);

  const uniquePatternSlugs = Array.from(
    new Set(allMappings.flatMap((m) => m.patternSlugs)),
  );
  const uniquePatternPacks = Array.from(
    new Set(allMappings.map((m) => m.patternPack)),
  ) as SolutionPatternPack[];

  return {
    failureModeKeys,
    results,
    uniquePatternSlugs,
    uniquePatternPacks,
    totalMappings: allMappings.length,
    createdFrom: 'pat4_ai_failure_modes_solution_map',
  };
}

/**
 * Return all failure mode keys that reference a given pattern pack.
 */
export function getFailureModesByPatternPack(
  patternPack: SolutionPatternPack,
): ReadonlyArray<AiProgramFailureKey> {
  const keys = FAILURE_MODE_SOLUTION_MAPPINGS
    .filter((m) => m.patternPack === patternPack)
    .map((m) => m.failureModeKey);
  // deduplicate
  return Array.from(new Set(keys)) as AiProgramFailureKey[];
}

/**
 * Return all failure mode keys that reference a given pattern slug.
 */
export function getFailureModesByPatternSlug(
  slug: string,
): ReadonlyArray<AiProgramFailureKey> {
  const keys = FAILURE_MODE_SOLUTION_MAPPINGS
    .filter((m) => m.patternSlugs.includes(slug))
    .map((m) => m.failureModeKey);
  return Array.from(new Set(keys)) as AiProgramFailureKey[];
}

/**
 * Return all mappings for a given pattern pack, optionally filtered by slug.
 */
export function getMappingsForPatternPack(
  patternPack: SolutionPatternPack,
  slug?: string,
): ReadonlyArray<FailureModeSolutionMapping> {
  return FAILURE_MODE_SOLUTION_MAPPINGS.filter(
    (m) =>
      m.patternPack === patternPack &&
      (slug == null || m.patternSlugs.includes(slug)),
  );
}

/**
 * Lightweight check: does a given failure mode have any solution mapping?
 */
export function failureModeHasSolutionMapping(
  failureModeKey: AiProgramFailureKey,
): boolean {
  return FAILURE_MODE_SOLUTION_MAPPINGS.some(
    (m) => m.failureModeKey === failureModeKey,
  );
}

// ---------------------------------------------------------------------------
// Re-exports for cross-module convenience
// ---------------------------------------------------------------------------

export const ALL_FAILURE_MODE_SOLUTION_MAPPINGS: ReadonlyArray<FailureModeSolutionMapping> =
  FAILURE_MODE_SOLUTION_MAPPINGS;

export const SOLUTION_PATTERN_PACKS: ReadonlyArray<SolutionPatternPack> = [
  'pat1_data_platform_managed_services',
  'pat2_ims_managed_services',
  'pat3_vendor_evaluation',
];

/**
 * Failure mode keys that currently have at least one solution pattern mapping.
 * Computed once at module load time.
 */
export const MAPPED_FAILURE_MODE_KEYS: ReadonlyArray<AiProgramFailureKey> = Array.from(
  new Set(FAILURE_MODE_SOLUTION_MAPPINGS.map((m) => m.failureModeKey)),
) as AiProgramFailureKey[];

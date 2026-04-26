// MW6 · SME Recommendation Panel read model.
//
// Pure deterministic projection that recommends AbarVa and client SMEs
// for the next workshop in a program. Composes (workshop type, evidence
// gaps, failure modes, solution archetype, program phase) into a stable
// shortlist of role-anchored recommendations the Client Maestro can use
// to staff the room.
//
// No live runtime, no model calls, no calendar/booking, no live SME
// directory lookup, no real person names, no Date.now() reads, no
// random IDs, no fetch.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import type {
  WorkshopReadiness,
  WorkshopType,
} from '@/lib/programs/workshop-readiness';
import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
} from '@/lib/programs/workshop-readiness';
import {
  listAiProgramFailureModes,
  type AiProgramFailureMode,
} from '@/lib/intelligence/ai-program-failure-modes';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SmeRole =
  | 'client_maestro'
  | 'abarva_maestro'
  | 'domain_sme'
  | 'data_architect'
  | 'security_governance_lead'
  | 'value_lead'
  | 'workflow_owner'
  | 'change_adoption_lead'
  | 'solution_architect'
  | 'vendor_startup_expert'
  | 'clinical_sme'
  | 'engineering_productivity_lead';

export type SmeParticipationMode = 'required' | 'optional' | 'advisory';

export type SmeReadiness =
  | 'confirmed'
  | 'tentative'
  | 'awaiting_outreach'
  | 'unstaffed';

export interface SmeRecommendationReason {
  evidenceGap: string | null;
  failureModeKey: string | null;
  archetypeAnchor: string | null;
  phaseRationale: string;
}

export interface SmeRecommendation {
  id: string;
  tenantKey: string;
  programCode: string;
  programSlug: string;
  workshopId: string | null;
  workshopType: WorkshopType | null;
  role: SmeRole;
  roleLabel: string;
  organization: 'client' | 'abarva';
  participationMode: SmeParticipationMode;
  readiness: SmeReadiness;
  whyNeeded: string;
  reason: SmeRecommendationReason;
  suggestedFocus: ReadonlyArray<string>;
  createdFrom: 'deterministic_sme_recommendation_seed';
}

export interface SmeRecommendationSummary {
  totalCount: number;
  byRole: Record<SmeRole, number>;
  byParticipationMode: Record<SmeParticipationMode, number>;
  byReadiness: Record<SmeReadiness, number>;
  byOrganization: Record<'client' | 'abarva', number>;
  uniqueWorkshopTypes: ReadonlyArray<WorkshopType>;
}

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

export const SME_ROLES_IN_ORDER: ReadonlyArray<SmeRole> = [
  'client_maestro',
  'abarva_maestro',
  'domain_sme',
  'data_architect',
  'security_governance_lead',
  'value_lead',
  'workflow_owner',
  'change_adoption_lead',
  'solution_architect',
  'vendor_startup_expert',
  'clinical_sme',
  'engineering_productivity_lead',
];

export const SME_PARTICIPATION_MODES_IN_ORDER: ReadonlyArray<SmeParticipationMode> = [
  'required',
  'optional',
  'advisory',
];

export const SME_READINESS_IN_ORDER: ReadonlyArray<SmeReadiness> = [
  'confirmed',
  'tentative',
  'awaiting_outreach',
  'unstaffed',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build SME recommendations for a single workshop. Pure: same input →
 * identical output. Always seeds at least the Client Maestro and an
 * AbarVa Maestro so the room is never unstaffed.
 */
export function buildSmeRecommendationsForWorkshop(
  workshop: WorkshopReadiness,
): ReadonlyArray<SmeRecommendation> {
  const roleSlots = workshopRoleSlots(workshop.type);
  const failureMode = pickFailureModeForWorkshop(workshop.type);
  const archetypeAnchor = archetypeAnchorForProgramCode(workshop.programCode);
  const out: SmeRecommendation[] = [];
  for (const slot of roleSlots) {
    const evidenceGap = pickEvidenceGapForSlot(slot.role, workshop);
    const reason: SmeRecommendationReason = {
      evidenceGap,
      failureModeKey: failureMode ? failureMode.key : null,
      archetypeAnchor,
      phaseRationale: phaseRationaleFor(workshop.type),
    };
    out.push({
      id: `sme:${workshop.tenantKey}:${workshop.programSlug}:${workshop.type}:${slot.role}`,
      tenantKey: workshop.tenantKey,
      programCode: workshop.programCode,
      programSlug: workshop.programSlug,
      workshopId: workshop.id,
      workshopType: workshop.type,
      role: slot.role,
      roleLabel: roleLabel(slot.role),
      organization: organizationForRole(slot.role),
      participationMode: slot.participationMode,
      readiness: readinessForSlot(slot.role, slot.participationMode),
      whyNeeded: slot.whyNeeded,
      reason,
      suggestedFocus: slot.suggestedFocus,
      createdFrom: 'deterministic_sme_recommendation_seed',
    });
  }
  return out;
}

/**
 * Build SME recommendations for a program (no specific workshop). Picks
 * the program-level next-recommended workshop when one exists; otherwise
 * composes a phase-level shortlist from the program's `currentPhaseSpec`
 * without a workshop linkage. Pure.
 */
export function buildSmeRecommendationsForProgram(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ReadonlyArray<SmeRecommendation> {
  const next = buildNextRecommendedWorkshop(tenant, program);
  if (next !== null) {
    return buildProgramLevelRecommendations(tenant, program, next);
  }
  return buildProgramLevelRecommendationsFromPhase(tenant, program);
}

/**
 * Aggregate counts across a list of SME recommendations. Pure.
 */
export function summarizeSmeRecommendations(
  recommendations: ReadonlyArray<SmeRecommendation>,
): SmeRecommendationSummary {
  const byRole = emptyByRole();
  const byParticipationMode = emptyByParticipationMode();
  const byReadiness = emptyByReadiness();
  const byOrganization: Record<'client' | 'abarva', number> = {
    client: 0,
    abarva: 0,
  };
  const workshopTypes = new Set<WorkshopType>();
  for (const rec of recommendations) {
    byRole[rec.role] += 1;
    byParticipationMode[rec.participationMode] += 1;
    byReadiness[rec.readiness] += 1;
    byOrganization[rec.organization] += 1;
    if (rec.workshopType !== null) workshopTypes.add(rec.workshopType);
  }
  const uniqueWorkshopTypes = Array.from(workshopTypes).sort();
  return {
    totalCount: recommendations.length,
    byRole,
    byParticipationMode,
    byReadiness,
    byOrganization,
    uniqueWorkshopTypes,
  };
}

// ---------------------------------------------------------------------
// Program-level composition
// ---------------------------------------------------------------------

function buildProgramLevelRecommendations(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  next: WorkshopReadiness,
): ReadonlyArray<SmeRecommendation> {
  void tenant;
  void program;
  // Program-level shortlist drops the workshop linkage and tightens the
  // role list to the union of the next workshop's required + optional
  // SMEs, so the panel can render a calmer aggregate when no specific
  // workshop is in focus.
  const workshopRecs = buildSmeRecommendationsForWorkshop(next);
  return workshopRecs.map((rec) => ({
    ...rec,
    id: `sme-program:${rec.tenantKey}:${rec.programSlug}:${rec.role}`,
    workshopId: null,
    workshopType: null,
    participationMode:
      rec.participationMode === 'advisory' ? 'optional' : rec.participationMode,
    readiness:
      rec.readiness === 'unstaffed' ? 'awaiting_outreach' : rec.readiness,
  }));
}

function buildProgramLevelRecommendationsFromPhase(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ReadonlyArray<SmeRecommendation> {
  // Defensive fallback. If buildNextRecommendedWorkshop returned null
  // (which only happens when the program has no workshops), surface the
  // canonical maestro pair so the panel never renders empty.
  const list = buildWorkshopReadinessForProgram(tenant, program);
  if (list.length > 0) {
    return buildProgramLevelRecommendations(tenant, program, list[0]);
  }
  const archetypeAnchor = archetypeAnchorForProgramCode(program.code);
  const reason: SmeRecommendationReason = {
    evidenceGap: null,
    failureModeKey: null,
    archetypeAnchor,
    phaseRationale: 'No workshop is currently scheduled; staffing the maestro pair keeps the program ready for the next session.',
  };
  return [
    {
      id: `sme-program:${tenant.tenantKey}:${program.programSlug}:client_maestro`,
      tenantKey: tenant.tenantKey,
      programCode: program.code,
      programSlug: program.programSlug,
      workshopId: null,
      workshopType: null,
      role: 'client_maestro',
      roleLabel: roleLabel('client_maestro'),
      organization: 'client',
      participationMode: 'required',
      readiness: 'awaiting_outreach',
      whyNeeded: 'Holds the room and owns the outcome record for the program.',
      reason,
      suggestedFocus: [
        'Confirm program intent and the next session objective.',
        'Adjudicate ownership of decisions captured between sessions.',
      ],
      createdFrom: 'deterministic_sme_recommendation_seed',
    },
    {
      id: `sme-program:${tenant.tenantKey}:${program.programSlug}:abarva_maestro`,
      tenantKey: tenant.tenantKey,
      programCode: program.code,
      programSlug: program.programSlug,
      workshopId: null,
      workshopType: null,
      role: 'abarva_maestro',
      roleLabel: roleLabel('abarva_maestro'),
      organization: 'abarva',
      participationMode: 'required',
      readiness: 'awaiting_outreach',
      whyNeeded: 'Carries the AbarVa method and prior comparable engagements.',
      reason,
      suggestedFocus: [
        'Bring archetype-aligned references and prior decision records.',
        'Surface the deterministic method the Maestro should anchor on.',
      ],
      createdFrom: 'deterministic_sme_recommendation_seed',
    },
  ];
}

// ---------------------------------------------------------------------
// Workshop-type → role-slot mapping
// ---------------------------------------------------------------------

interface RoleSlot {
  role: SmeRole;
  participationMode: SmeParticipationMode;
  whyNeeded: string;
  suggestedFocus: ReadonlyArray<string>;
}

const CLIENT_MAESTRO_SLOT: RoleSlot = {
  role: 'client_maestro',
  participationMode: 'required',
  whyNeeded: 'Holds the room, sets the agenda, and owns the outcome record.',
  suggestedFocus: [
    'Frame the workshop intent and confirm the named decision.',
    'Capture the outcome record before the room closes.',
  ],
};

const ABARVA_MAESTRO_SLOT: RoleSlot = {
  role: 'abarva_maestro',
  participationMode: 'required',
  whyNeeded: 'Carries the AbarVa workshop method and prior pattern matches.',
  suggestedFocus: [
    'Bring the AbarVa rubric for the workshop type.',
    'Reference comparable prior engagements without fabricating evidence.',
  ],
};

function workshopRoleSlots(type: WorkshopType): ReadonlyArray<RoleSlot> {
  switch (type) {
    case 'current_state_discovery':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'workflow_owner',
          participationMode: 'required',
          whyNeeded: 'Ground-truth on the operating workflow the program must improve.',
          suggestedFocus: [
            'Walk the operating reality with named hand-offs and tools.',
            'Surface contradictions the room must resolve to advance.',
          ],
        },
        {
          role: 'domain_sme',
          participationMode: 'optional',
          whyNeeded: 'Names the domain shape so discovery does not drift into adjacent territory.',
          suggestedFocus: [
            'Bring the domain glossary and the canonical taxonomy.',
            'Adjudicate whether observed friction is in or out of scope.',
          ],
        },
      ];
    case 'use_case_framing':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'value_lead',
          participationMode: 'required',
          whyNeeded: 'Owns the prioritization rubric for the use-case wave.',
          suggestedFocus: [
            'Score candidate use cases on operating impact and feasibility.',
            'Flag candidates that cannot be defended with current evidence.',
          ],
        },
        {
          role: 'workflow_owner',
          participationMode: 'required',
          whyNeeded: 'Names the use cases that move the operating metric the workflow owns.',
          suggestedFocus: [
            'Walk each candidate from intake to disposition.',
            'Adjudicate which use cases the team can absorb in the first wave.',
          ],
        },
        {
          role: 'domain_sme',
          participationMode: 'advisory',
          whyNeeded: 'Adjacent-domain SME for archetype-aligned use cases.',
          suggestedFocus: [
            'Surface comparable use cases from prior engagements.',
            'Name failure modes the candidates have hit before.',
          ],
        },
      ];
    case 'data_foundation_assessment':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'data_architect',
          participationMode: 'required',
          whyNeeded: 'Owns the data lineage, freshness, and access posture for the prioritized wave.',
          suggestedFocus: [
            'Walk lineage for each input the use case depends on.',
            'Name access and freshness gaps that block progress.',
          ],
        },
        {
          role: 'workflow_owner',
          participationMode: 'optional',
          whyNeeded: 'Adjudicates which gaps materially block the use case the workflow owns.',
          suggestedFocus: [
            'Confirm which gaps stop the workflow today.',
            'Confirm which gaps the team can mitigate with manual handling.',
          ],
        },
      ];
    case 'value_framing':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'value_lead',
          participationMode: 'required',
          whyNeeded: 'Owns the projected value, baseline anchor, and confidence band.',
          suggestedFocus: [
            'Lock the baseline anchor with the source-of-truth measurement.',
            'Frame the projected value with an honest confidence band.',
          ],
        },
        {
          role: 'workflow_owner',
          participationMode: 'required',
          whyNeeded: 'Owns the operating baseline and the target metric.',
          suggestedFocus: [
            'Confirm the baseline metric the program will improve against.',
            'Confirm the target metric the program will be measured on.',
          ],
        },
      ];
    case 'governance_risk_review':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'security_governance_lead',
          participationMode: 'required',
          whyNeeded: 'Owns the regulatory, security, and responsible-AI posture.',
          suggestedFocus: [
            'Walk the regulatory map for the program archetype.',
            'Name the controls the design pack must carry before approval.',
          ],
        },
        {
          role: 'data_architect',
          participationMode: 'optional',
          whyNeeded: 'Maps controls to data inputs and lineage so governance lands at the right boundary.',
          suggestedFocus: [
            'Confirm which inputs trigger which controls.',
            'Flag inputs that cannot be controlled at the current boundary.',
          ],
        },
      ];
    case 'architecture_solution_design':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'solution_architect',
          participationMode: 'required',
          whyNeeded: 'Owns the target architecture, vendor stance, and integration boundary.',
          suggestedFocus: [
            'Walk the candidate target architecture and the trade-offs.',
            'Lock the integration boundary the design pack will publish.',
          ],
        },
        {
          role: 'vendor_startup_expert',
          participationMode: 'advisory',
          whyNeeded: 'Carries vendor and startup landscape evidence for the candidate stack.',
          suggestedFocus: [
            'Surface comparable vendor evaluations.',
            'Flag startup risks worth raising before the room locks.',
          ],
        },
        {
          role: 'data_architect',
          participationMode: 'optional',
          whyNeeded: 'Confirms data plane and integration assumptions land in the design.',
          suggestedFocus: [
            'Confirm the data plane the integration depends on.',
            'Flag any data movement that crosses tenant or compliance boundaries.',
          ],
        },
      ];
    case 'operating_model_alignment':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'workflow_owner',
          participationMode: 'required',
          whyNeeded: 'Owns the run-state operating model for the workflow.',
          suggestedFocus: [
            'Walk the run-state RACI for the workflow.',
            'Name the on-call boundary between platform and business.',
          ],
        },
        {
          role: 'change_adoption_lead',
          participationMode: 'optional',
          whyNeeded: 'Aligns the operating model with the adoption curve.',
          suggestedFocus: [
            'Surface adoption signals the operating model must serve.',
            'Flag training the operating model assumes is already in place.',
          ],
        },
      ];
    case 'adoption_change_readiness':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'change_adoption_lead',
          participationMode: 'required',
          whyNeeded: 'Owns the adoption, training, and change-readiness posture.',
          suggestedFocus: [
            'Walk the readiness rubric the room must accept as gating.',
            'Surface where training and change coverage is thinner than the rubric requires.',
          ],
        },
        {
          role: 'workflow_owner',
          participationMode: 'required',
          whyNeeded: 'Owns the pilot population and the workflow change must land where work happens.',
          suggestedFocus: [
            'Confirm the pilot population represents the scale population.',
            'Confirm the workflow integration the pilot exposes.',
          ],
        },
      ];
    case 'executive_decision_review':
      return [
        CLIENT_MAESTRO_SLOT,
        ABARVA_MAESTRO_SLOT,
        {
          role: 'value_lead',
          participationMode: 'required',
          whyNeeded: 'Owns the value evidence the executive decision is grounded in.',
          suggestedFocus: [
            'Walk the value-ledger entries that frame the outcome.',
            'Flag deferred items the executive readout must call out.',
          ],
        },
        {
          role: 'security_governance_lead',
          participationMode: 'optional',
          whyNeeded: 'Confirms the governance posture the decision relies on.',
          suggestedFocus: [
            'Confirm the controls landed in the design pack.',
            'Flag governance items the executive readout must call out.',
          ],
        },
      ];
  }
}

// ---------------------------------------------------------------------
// Reason composition
// ---------------------------------------------------------------------

function pickFailureModeForWorkshop(
  type: WorkshopType,
): AiProgramFailureMode | null {
  // Pick a deterministic, canonical failure mode per workshop type
  // anchored on the workshop's purpose. We do not try to enumerate
  // every plausible link — a single canonical anchor keeps the panel
  // calm and the reason caption defensible.
  const all = listAiProgramFailureModes();
  const desiredKey = canonicalFailureKeyForWorkshop(type);
  if (desiredKey === null) return null;
  for (const m of all) {
    if (m.key === desiredKey) return m;
  }
  return null;
}

function canonicalFailureKeyForWorkshop(type: WorkshopType): string | null {
  switch (type) {
    case 'current_state_discovery':
      return 'poor_use_case_framing';
    case 'use_case_framing':
      return 'poor_use_case_framing';
    case 'data_foundation_assessment':
      return 'weak_data_foundation';
    case 'value_framing':
      return 'no_measurable_baseline';
    case 'governance_risk_review':
      return 'missing_governance_risk';
    case 'architecture_solution_design':
      return 'tool_first_thinking';
    case 'operating_model_alignment':
      return 'no_operating_model_for_scale';
    case 'adoption_change_readiness':
      return 'no_adoption_change_plan';
    case 'executive_decision_review':
      return 'no_value_ledger';
    default:
      return null;
  }
}

function archetypeAnchorForProgramCode(programCode: string): string | null {
  // The first two characters of the program code carry the archetype
  // hint in the seed plan (ST / WA / PM / AP / OO). Map onto a stable
  // archetype anchor label without inventing tenant-specific data.
  const prefix = programCode.slice(0, 2).toUpperCase();
  switch (prefix) {
    case 'ST':
      return 'strategic_transformation';
    case 'WA':
      return 'workflow_automation';
    case 'PM':
      return 'platform_modernization';
    case 'AP':
      return 'ai_product_enablement';
    case 'OO':
      return 'operational_optimization';
    default:
      return null;
  }
}

function pickEvidenceGapForSlot(
  role: SmeRole,
  workshop: WorkshopReadiness,
): string | null {
  // Pick the first required evidence label whose semantic anchor lines
  // up with the SME role. If nothing lines up, return the first
  // required evidence label as the deterministic anchor; if no required
  // evidence exists, return null.
  const required = workshop.evidenceToCapture.filter((e) => e.required);
  if (required.length === 0) return null;
  const lower = (s: string) => s.toLowerCase();
  const matchers: Record<SmeRole, ReadonlyArray<string>> = {
    client_maestro: ['decision', 'outcome', 'record'],
    abarva_maestro: ['template', 'rubric', 'reference'],
    domain_sme: ['domain', 'taxonomy', 'glossary', 'use-case'],
    data_architect: ['data', 'inventory', 'lineage', 'gap'],
    security_governance_lead: ['risk', 'control', 'regulatory', 'governance'],
    value_lead: ['value', 'ledger', 'baseline', 'projected'],
    workflow_owner: ['workflow', 'operating', 'baseline', 'roster'],
    change_adoption_lead: ['adoption', 'readiness', 'training', 'pilot'],
    solution_architect: ['architecture', 'integration', 'design', 'trade-off', 'tradeoff'],
    vendor_startup_expert: ['vendor', 'evaluation', 'memo'],
    clinical_sme: ['clinical', 'care', 'patient'],
    engineering_productivity_lead: ['engineering', 'productivity', 'developer'],
  };
  const hints = matchers[role];
  for (const e of required) {
    const labelL = lower(e.label);
    for (const h of hints) {
      if (labelL.includes(h)) return e.label;
    }
  }
  return required[0].label;
}

function phaseRationaleFor(type: WorkshopType): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Discovery requires owners who can defend the operating reality without fabrication.';
    case 'use_case_framing':
      return 'Framing requires owners who can defend prioritization with operating evidence.';
    case 'data_foundation_assessment':
      return 'Data assessment requires owners who can name lineage and freshness honestly.';
    case 'value_framing':
      return 'Value framing requires owners who can defend the baseline anchor and confidence band.';
    case 'governance_risk_review':
      return 'Governance review requires owners who carry regulatory and responsible-AI posture.';
    case 'architecture_solution_design':
      return 'Architecture design requires owners who can lock target boundaries and vendor stance.';
    case 'operating_model_alignment':
      return 'Operating-model alignment requires owners who carry RACI and on-call boundaries.';
    case 'adoption_change_readiness':
      return 'Adoption review requires owners who can stress-test pilot signals against scale.';
    case 'executive_decision_review':
      return 'Executive review requires owners of the value ledger and the governance posture.';
  }
}

// ---------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------

function roleLabel(role: SmeRole): string {
  switch (role) {
    case 'client_maestro':
      return 'Client Maestro';
    case 'abarva_maestro':
      return 'AbarVa Maestro';
    case 'domain_sme':
      return 'Domain SME';
    case 'data_architect':
      return 'Data Architect';
    case 'security_governance_lead':
      return 'Security and Governance Lead';
    case 'value_lead':
      return 'Value Lead';
    case 'workflow_owner':
      return 'Workflow Owner';
    case 'change_adoption_lead':
      return 'Change and Adoption Lead';
    case 'solution_architect':
      return 'Solution Architect';
    case 'vendor_startup_expert':
      return 'Vendor and Startup Expert';
    case 'clinical_sme':
      return 'Clinical SME';
    case 'engineering_productivity_lead':
      return 'Engineering Productivity Lead';
  }
}

function organizationForRole(role: SmeRole): 'client' | 'abarva' {
  switch (role) {
    case 'client_maestro':
    case 'workflow_owner':
    case 'data_architect':
    case 'security_governance_lead':
    case 'change_adoption_lead':
    case 'value_lead':
    case 'clinical_sme':
    case 'engineering_productivity_lead':
      return 'client';
    case 'abarva_maestro':
    case 'domain_sme':
    case 'solution_architect':
    case 'vendor_startup_expert':
      return 'abarva';
  }
}

function readinessForSlot(
  role: SmeRole,
  participationMode: SmeParticipationMode,
): SmeReadiness {
  // Deterministic readiness derivation. The Client Maestro is always
  // confirmed because the program could not have reached this point
  // without one. AbarVa Maestro is confirmed for required slots and
  // tentative for advisory slots. All other roles default to
  // awaiting_outreach so the Maestro can adjudicate confirmation in
  // the room.
  if (role === 'client_maestro') return 'confirmed';
  if (role === 'abarva_maestro') {
    return participationMode === 'required' ? 'confirmed' : 'tentative';
  }
  if (participationMode === 'required') return 'awaiting_outreach';
  if (participationMode === 'optional') return 'tentative';
  return 'tentative';
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByRole(): Record<SmeRole, number> {
  return {
    client_maestro: 0,
    abarva_maestro: 0,
    domain_sme: 0,
    data_architect: 0,
    security_governance_lead: 0,
    value_lead: 0,
    workflow_owner: 0,
    change_adoption_lead: 0,
    solution_architect: 0,
    vendor_startup_expert: 0,
    clinical_sme: 0,
    engineering_productivity_lead: 0,
  };
}

function emptyByParticipationMode(): Record<SmeParticipationMode, number> {
  return {
    required: 0,
    optional: 0,
    advisory: 0,
  };
}

function emptyByReadiness(): Record<SmeReadiness, number> {
  return {
    confirmed: 0,
    tentative: 0,
    awaiting_outreach: 0,
    unstaffed: 0,
  };
}

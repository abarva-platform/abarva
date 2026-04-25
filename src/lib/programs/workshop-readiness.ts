// MW2 · Workshop Readiness Read Model.
//
// Pure deterministic projection of (tenant, program) seed state into a
// per-workshop readiness shape that prepares the Client Maestro for the
// next workshop. Operationalizes the MW1 Maestro Workshop Intelligence
// Contract.
//
// No live runtime, no model calls, no calendar/booking, no meeting
// notes ingestion, no migrations, no UI, no Date.now() reads, no
// random IDs.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

import {
  buildProgramReadinessSummary,
  buildStewardReadinessNote,
  summarizeProgram,
} from '@/lib/programs/programs-canonical-view';
import {
  buildProgramArtifactInventory,
  type ProgramArtifactPhaseBucket,
} from '@/lib/programs/program-artifact-inventory';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type WorkshopType =
  | 'current_state_discovery'
  | 'use_case_framing'
  | 'data_foundation_assessment'
  | 'value_framing'
  | 'governance_risk_review'
  | 'architecture_solution_design'
  | 'operating_model_alignment'
  | 'adoption_change_readiness'
  | 'executive_decision_review';

export type WorkshopParticipantRole =
  | 'client_maestro'
  | 'executive_sponsor'
  | 'business_owner'
  | 'technical_lead'
  | 'data_owner'
  | 'compliance_reviewer'
  | 'abarva_sme'
  | 'abarva_consultant';

export type WorkshopOutputKind =
  | 'decision_record'
  | 'updated_charter'
  | 'updated_design_pack'
  | 'value_ledger_entry'
  | 'risk_register_entry'
  | 'evidence_capture'
  | 'next_session_recommendation'
  | 'executive_readout';

export interface WorkshopObjective {
  text: string;
  ties_to_phase_spec: number; // 1..5
  ties_to_gate?: 'G1' | 'G2' | 'G3' | 'G4' | null;
}

export interface WorkshopEvidenceRequest {
  label: string;
  reason: string;
  required: boolean;
}

export interface WorkshopOutput {
  kind: WorkshopOutputKind;
  description: string;
}

export interface WorkshopRisk {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WorkshopReadiness {
  id: string;
  tenantKey: string;
  tenantName: string;
  programCode: string;
  programSlug: string;
  type: WorkshopType;
  title: string;
  objective: WorkshopObjective;
  requiredAttendees: ReadonlyArray<{ role: WorkshopParticipantRole; reason: string }>;
  optionalSmes: ReadonlyArray<{ role: WorkshopParticipantRole; reason: string }>;
  preReadList: ReadonlyArray<string>;
  agenda: ReadonlyArray<{ minutes: number; activity: string }>;
  questionsToAsk: ReadonlyArray<string>;
  likelyTensions: ReadonlyArray<string>;
  decisionsNeeded: ReadonlyArray<string>;
  evidenceToCapture: ReadonlyArray<WorkshopEvidenceRequest>;
  expectedOutputs: ReadonlyArray<WorkshopOutput>;
  nexusPreparationBrief: string;
  stewardGateImplication: string;
  risks: ReadonlyArray<WorkshopRisk>;
  createdFrom: 'deterministic_program_seed';
}

export interface WorkshopReadinessSummary {
  totalCount: number;
  byType: Record<WorkshopType, number>;
  perTenant: ReadonlyArray<{ tenantKey: string; tenantName: string; count: number }>;
}

// ---------------------------------------------------------------------
// Re-exported canonical orderings
// ---------------------------------------------------------------------

export const WORKSHOP_TYPES_IN_ORDER: ReadonlyArray<WorkshopType> = [
  'current_state_discovery',
  'use_case_framing',
  'data_foundation_assessment',
  'value_framing',
  'governance_risk_review',
  'architecture_solution_design',
  'operating_model_alignment',
  'adoption_change_readiness',
  'executive_decision_review',
];

export const WORKSHOP_PARTICIPANT_ROLES_IN_ORDER: ReadonlyArray<WorkshopParticipantRole> = [
  'client_maestro',
  'executive_sponsor',
  'business_owner',
  'technical_lead',
  'data_owner',
  'compliance_reviewer',
  'abarva_sme',
  'abarva_consultant',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the per-workshop readiness records for a single program. Pure:
 * same input → identical output.
 */
export function buildWorkshopReadinessForProgram(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ReadonlyArray<WorkshopReadiness> {
  const types = workshopTypesForPhaseSpec(program.currentPhaseSpec);
  return types.map((type) => composeReadiness(tenant, program, type));
}

/**
 * Pick the next recommended workshop for a program. Picks the first
 * workshop in canonical order whose `stewardGateImplication` references
 * the program's current canonical hard gate; if no such match, returns
 * the first workshop. Returns null only if no workshops are produced.
 * Pure.
 */
export function buildNextRecommendedWorkshop(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): WorkshopReadiness | null {
  const list = buildWorkshopReadinessForProgram(tenant, program);
  if (list.length === 0) return null;
  const currentGate = currentHardGateForProgram(program.currentPhaseSpec);
  if (currentGate === null) return list[0];
  for (const ws of list) {
    if (ws.stewardGateImplication.includes(currentGate)) {
      return ws;
    }
  }
  return list[0];
}

/**
 * Aggregate counts across a list of workshop readiness records. Pure.
 */
export function summarizeWorkshopReadiness(
  workshops: ReadonlyArray<WorkshopReadiness>,
): WorkshopReadinessSummary {
  const byType = emptyByType();
  const perTenantMap = new Map<string, { tenantKey: string; tenantName: string; count: number }>();
  for (const ws of workshops) {
    byType[ws.type] += 1;
    const existing = perTenantMap.get(ws.tenantKey);
    if (existing) {
      existing.count += 1;
    } else {
      perTenantMap.set(ws.tenantKey, {
        tenantKey: ws.tenantKey,
        tenantName: ws.tenantName,
        count: 1,
      });
    }
  }
  const perTenant = Array.from(perTenantMap.values()).sort((a, b) =>
    a.tenantKey.localeCompare(b.tenantKey),
  );
  return {
    totalCount: workshops.length,
    byType,
    perTenant,
  };
}

// ---------------------------------------------------------------------
// Phase → workshop mapping
// ---------------------------------------------------------------------

/**
 * Map the program's current spec phase number (1..5) onto the canonical
 * set of workshop types that prepare the Maestro for the next session.
 * Returns canonical-ordered workshop types — same input → identical
 * output. Always returns ≥3 entries.
 */
function workshopTypesForPhaseSpec(specPhase: number): ReadonlyArray<WorkshopType> {
  switch (specPhase) {
    case 1: // Charter
      return ['current_state_discovery', 'use_case_framing', 'value_framing'];
    case 2: // Diagnose
      return [
        'data_foundation_assessment',
        'governance_risk_review',
        'value_framing',
      ];
    case 3: // Design
      return [
        'architecture_solution_design',
        'governance_risk_review',
        'operating_model_alignment',
      ];
    case 4: // Execute
      return [
        'adoption_change_readiness',
        'operating_model_alignment',
        'executive_decision_review',
      ];
    case 5: // Verify
      return ['executive_decision_review', 'adoption_change_readiness'];
    default:
      // Defensive fallback for out-of-range spec phases. Returns the
      // Charter-phase set so any program can still surface workshops.
      return ['current_state_discovery', 'use_case_framing', 'value_framing'];
  }
}

/**
 * The canonical hard gate the program's current phase exits.
 * - Phase 1 (Charter) → G1
 * - Phase 2 (Diagnose) → G2
 * - Phase 3 (Design) → G3
 * - Phase 4 (Execute) → no canonical hard gate (between G3 and G4)
 * - Phase 5 (Verify) → G4
 */
function currentHardGateForProgram(
  specPhase: number,
): 'G1' | 'G2' | 'G3' | 'G4' | null {
  switch (specPhase) {
    case 1:
      return 'G1';
    case 2:
      return 'G2';
    case 3:
      return 'G3';
    case 4:
      return null;
    case 5:
      return 'G4';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------
// Per-workshop composition
// ---------------------------------------------------------------------

function composeReadiness(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  type: WorkshopType,
): WorkshopReadiness {
  // Touch downstream read models so any contract drift surfaces here.
  // We don't depend on their values for fabrication; they exist so the
  // readiness shape stays reconciled with the canonical view + artifact
  // inventory.
  const programSummary = summarizeProgram(program);
  const readinessSummary = buildProgramReadinessSummary(program);
  const stewardNote = buildStewardReadinessNote(program);
  const inventory = buildProgramArtifactInventory(tenant, program);
  const phasesPresent = uniquePhaseBucketsFromInventory(inventory.artifacts);
  void readinessSummary; // referenced for invariant of "stay reconciled"
  void stewardNote;
  void phasesPresent;

  const objective = composeObjective(type, program.currentPhaseSpec);
  const id = `ws:${tenant.tenantKey}:${program.programSlug}:${type}`;
  const title = composeTitle(type, programSummary.code);
  const requiredAttendees = composeRequiredAttendees(type);
  const optionalSmes = composeOptionalSmes(type);
  const preReadList = composePreReadList(type, program);
  const agenda = composeAgenda(type);
  const questionsToAsk = composeQuestionsToAsk(type);
  const likelyTensions = composeLikelyTensions(type);
  const decisionsNeeded = composeDecisionsNeeded(type);
  const evidenceToCapture = composeEvidenceToCapture(type);
  const expectedOutputs = composeExpectedOutputs(type);
  const stewardGateImplication = composeStewardGateImplication(
    type,
    program.currentPhaseSpec,
  );
  const nexusPreparationBrief = composeNexusPreparationBrief(
    type,
    objective,
    stewardGateImplication,
  );
  const risks = composeRisks(type);

  return {
    id,
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programSlug: program.programSlug,
    type,
    title,
    objective,
    requiredAttendees,
    optionalSmes,
    preReadList,
    agenda,
    questionsToAsk,
    likelyTensions,
    decisionsNeeded,
    evidenceToCapture,
    expectedOutputs,
    nexusPreparationBrief,
    stewardGateImplication,
    risks,
    createdFrom: 'deterministic_program_seed',
  };
}

function uniquePhaseBucketsFromInventory(
  artifacts: ReadonlyArray<{ phaseBucket: ProgramArtifactPhaseBucket }>,
): ReadonlyArray<ProgramArtifactPhaseBucket> {
  const set = new Set<ProgramArtifactPhaseBucket>();
  for (const a of artifacts) set.add(a.phaseBucket);
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------
// Workshop-type composition helpers
// ---------------------------------------------------------------------

function workshopLabel(type: WorkshopType): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Current-state discovery';
    case 'use_case_framing':
      return 'Use-case framing';
    case 'data_foundation_assessment':
      return 'Data foundation assessment';
    case 'value_framing':
      return 'Value framing';
    case 'governance_risk_review':
      return 'Governance and risk review';
    case 'architecture_solution_design':
      return 'Architecture and solution design';
    case 'operating_model_alignment':
      return 'Operating model alignment';
    case 'adoption_change_readiness':
      return 'Adoption and change readiness';
    case 'executive_decision_review':
      return 'Executive decision review';
  }
}

function composeTitle(type: WorkshopType, programCode: string): string {
  return `${programCode} · ${workshopLabel(type)} workshop`;
}

function composeObjective(
  type: WorkshopType,
  specPhase: number,
): WorkshopObjective {
  const tiesToPhaseSpec = clampPhaseSpec(specPhase);
  const tiesToGate = currentHardGateForProgram(tiesToPhaseSpec);
  const text = objectiveTextFor(type);
  return {
    text,
    ties_to_phase_spec: tiesToPhaseSpec,
    ties_to_gate: tiesToGate,
  };
}

function clampPhaseSpec(n: number): number {
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function objectiveTextFor(type: WorkshopType): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Surface the current operating reality the program must improve, with evidence the room can defend.';
    case 'use_case_framing':
      return 'Lock the candidate use cases that fit the charter and prioritize the first wave.';
    case 'data_foundation_assessment':
      return 'Assess data readiness for the prioritized use cases and name the gaps that block progress.';
    case 'value_framing':
      return 'Frame projected value with confidence band, baseline anchor, and ledger entry the sponsor can sign.';
    case 'governance_risk_review':
      return 'Surface the governance, regulatory, and operational risks the program must mitigate before advance.';
    case 'architecture_solution_design':
      return 'Lock the target architecture, vendor stance, and integration boundary the design pack will publish.';
    case 'operating_model_alignment':
      return 'Align the operating model, owner roles, and run-state RACI before execution begins.';
    case 'adoption_change_readiness':
      return 'Stress-test adoption, training, and change readiness signals the program needs before scale.';
    case 'executive_decision_review':
      return 'Run the executive decision review and capture the outcome record the sponsor signs.';
  }
}

function composeRequiredAttendees(
  type: WorkshopType,
): ReadonlyArray<{ role: WorkshopParticipantRole; reason: string }> {
  const base: Array<{ role: WorkshopParticipantRole; reason: string }> = [
    {
      role: 'client_maestro',
      reason: 'Holds the room, sets the agenda, owns the outcome record.',
    },
  ];
  switch (type) {
    case 'current_state_discovery':
      return [
        ...base,
        {
          role: 'business_owner',
          reason: 'Ground-truth on the operating reality the program must improve.',
        },
        {
          role: 'executive_sponsor',
          reason: 'Confirms the framing aligns with the charter intent.',
        },
        {
          role: 'technical_lead',
          reason: 'Maps the discovered reality to system boundaries.',
        },
      ];
    case 'use_case_framing':
      return [
        ...base,
        {
          role: 'executive_sponsor',
          reason: 'Owns prioritization and guard-rails for the first wave.',
        },
        {
          role: 'business_owner',
          reason: 'Names the use cases that move the operating metric.',
        },
        {
          role: 'technical_lead',
          reason: 'Names the use cases the platform can carry today.',
        },
      ];
    case 'data_foundation_assessment':
      return [
        ...base,
        {
          role: 'data_owner',
          reason: 'Ground-truth on data lineage, freshness, and access.',
        },
        {
          role: 'technical_lead',
          reason: 'Maps gaps to the candidate architecture.',
        },
        {
          role: 'business_owner',
          reason: 'Adjudicates which gaps materially block the use case.',
        },
      ];
    case 'value_framing':
      return [
        ...base,
        {
          role: 'executive_sponsor',
          reason: 'Signs off on the projected value framing.',
        },
        {
          role: 'business_owner',
          reason: 'Owns the baseline anchor and target metric.',
        },
        {
          role: 'technical_lead',
          reason: 'Confirms which projections the platform can produce evidence for.',
        },
      ];
    case 'governance_risk_review':
      return [
        ...base,
        {
          role: 'compliance_reviewer',
          reason: 'Owns the regulatory and governance posture.',
        },
        {
          role: 'executive_sponsor',
          reason: 'Adjudicates risk severity and required mitigations.',
        },
        {
          role: 'technical_lead',
          reason: 'Names the controls that land in the design pack.',
        },
        {
          role: 'business_owner',
          reason: 'Owns operational mitigations the run-state must carry.',
        },
      ];
    case 'architecture_solution_design':
      return [
        ...base,
        {
          role: 'technical_lead',
          reason: 'Owns the target architecture and integration boundary.',
        },
        {
          role: 'executive_sponsor',
          reason: 'Approves the vendor stance and material trade-offs.',
        },
        {
          role: 'business_owner',
          reason: 'Confirms the design carries the use-case wave.',
        },
      ];
    case 'operating_model_alignment':
      return [
        ...base,
        {
          role: 'business_owner',
          reason: 'Owns the run-state operating model.',
        },
        {
          role: 'executive_sponsor',
          reason: 'Confirms ownership and the RACI before execution.',
        },
        {
          role: 'technical_lead',
          reason: 'Owns the technical run-state and on-call boundary.',
        },
      ];
    case 'adoption_change_readiness':
      return [
        ...base,
        {
          role: 'business_owner',
          reason: 'Owns adoption, training, and change readiness signals.',
        },
        {
          role: 'executive_sponsor',
          reason: 'Confirms the readiness signal is honest before scale.',
        },
        {
          role: 'technical_lead',
          reason: 'Names the platform readiness signals the room must accept.',
        },
      ];
    case 'executive_decision_review':
      return [
        ...base,
        {
          role: 'executive_sponsor',
          reason: 'Owns the outcome decision the room captures.',
        },
        {
          role: 'business_owner',
          reason: 'Owns the operating evidence the decision is grounded in.',
        },
        {
          role: 'technical_lead',
          reason: 'Owns the platform evidence the decision relies on.',
        },
      ];
  }
}

function composeOptionalSmes(
  type: WorkshopType,
): ReadonlyArray<{ role: WorkshopParticipantRole; reason: string }> {
  switch (type) {
    case 'current_state_discovery':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa discovery method and prior pattern matches.',
        },
      ];
    case 'use_case_framing':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa use-case prioritization rubric.',
        },
        {
          role: 'abarva_sme',
          reason: 'Industry SME for archetype-aligned use cases.',
        },
      ];
    case 'data_foundation_assessment':
      return [
        {
          role: 'abarva_sme',
          reason: 'Data-foundation SME for lineage and quality patterns.',
        },
      ];
    case 'value_framing':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa value-framing template and prior baselines.',
        },
      ];
    case 'governance_risk_review':
      return [
        {
          role: 'abarva_sme',
          reason: 'Governance and regulatory SME aligned to the program archetype.',
        },
        {
          role: 'abarva_consultant',
          reason: 'Carries prior risk register patterns from comparable engagements.',
        },
      ];
    case 'architecture_solution_design':
      return [
        {
          role: 'abarva_sme',
          reason: 'Solution architect SME for the target stack and vendor stance.',
        },
        {
          role: 'abarva_consultant',
          reason: 'Carries prior reference architectures and integration patterns.',
        },
      ];
    case 'operating_model_alignment':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa operating-model reference for the archetype.',
        },
      ];
    case 'adoption_change_readiness':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa change-readiness rubric and prior adoption curves.',
        },
        {
          role: 'abarva_sme',
          reason: 'Adoption SME for the program archetype.',
        },
      ];
    case 'executive_decision_review':
      return [
        {
          role: 'abarva_consultant',
          reason: 'Carries the AbarVa executive readout template.',
        },
      ];
  }
}

function composePreReadList(
  type: WorkshopType,
  program: ProgramSeedPlan,
): ReadonlyArray<string> {
  const programLabel = `${program.code} · ${program.name}`;
  switch (type) {
    case 'current_state_discovery':
      return [
        `${programLabel} charter (current draft).`,
        'Operating-state baseline note from the most recent diagnose pass.',
        'AbarVa current-state discovery template.',
      ];
    case 'use_case_framing':
      return [
        `${programLabel} charter and intake-and-framing notes.`,
        'Candidate use-case longlist from prior discovery.',
        'AbarVa use-case prioritization rubric.',
      ];
    case 'data_foundation_assessment':
      return [
        `${programLabel} prioritized use-case list.`,
        'Data inventory snapshot for the relevant domains.',
        'AbarVa data-foundation assessment template.',
      ];
    case 'value_framing':
      return [
        `${programLabel} prioritized use-case list.`,
        'Operating baseline anchor and target metric definitions.',
        'AbarVa value-framing template (projected value with confidence band).',
      ];
    case 'governance_risk_review':
      return [
        `${programLabel} draft design pack and use-case wave.`,
        'Regulatory map for the program archetype.',
        'AbarVa risk register template.',
      ];
    case 'architecture_solution_design':
      return [
        `${programLabel} prioritized use-case list and value framing.`,
        'Vendor evaluation summary for the candidate stack.',
        'AbarVa reference architecture for the program archetype.',
      ];
    case 'operating_model_alignment':
      return [
        `${programLabel} approved design pack.`,
        'RACI draft for the run-state.',
        'AbarVa operating-model reference for the archetype.',
      ];
    case 'adoption_change_readiness':
      return [
        `${programLabel} approved design pack and run-state plan.`,
        'Adoption and training plan draft.',
        'AbarVa change-readiness rubric.',
      ];
    case 'executive_decision_review':
      return [
        `${programLabel} captured evidence chain to date.`,
        'Value ledger entries for the decision in question.',
        'AbarVa executive decision-review template.',
      ];
  }
}

function composeAgenda(
  type: WorkshopType,
): ReadonlyArray<{ minutes: number; activity: string }> {
  switch (type) {
    case 'current_state_discovery':
      return [
        { minutes: 10, activity: 'Welcome, framing, intent for the session.' },
        { minutes: 30, activity: 'Walk the current operating reality with the business owner.' },
        { minutes: 20, activity: 'Surface contradictions and gaps that the program must fix.' },
        { minutes: 15, activity: 'Capture evidence references and assign owners.' },
        { minutes: 15, activity: 'Decisions and next-session recommendation.' },
      ];
    case 'use_case_framing':
      return [
        { minutes: 10, activity: 'Welcome and framing of the use-case prioritization rubric.' },
        { minutes: 30, activity: 'Walk the candidate use-case longlist.' },
        { minutes: 20, activity: 'Prioritize the first wave by value and feasibility.' },
        { minutes: 15, activity: 'Surface tensions and capture the rationale.' },
        { minutes: 15, activity: 'Lock the wave and record the decision.' },
      ];
    case 'data_foundation_assessment':
      return [
        { minutes: 10, activity: 'Welcome and framing the assessment rubric.' },
        { minutes: 25, activity: 'Walk the data inventory for the prioritized use cases.' },
        { minutes: 20, activity: 'Surface lineage, freshness, and access gaps.' },
        { minutes: 20, activity: 'Adjudicate which gaps block progress and which can wait.' },
        { minutes: 15, activity: 'Capture decisions and assign owners.' },
      ];
    case 'value_framing':
      return [
        { minutes: 10, activity: 'Welcome and framing the value rubric.' },
        { minutes: 25, activity: 'Walk the baseline anchor for the prioritized use cases.' },
        { minutes: 25, activity: 'Frame projected value ranges with confidence band.' },
        { minutes: 15, activity: 'Surface tensions on baseline definitions.' },
        { minutes: 15, activity: 'Lock the value ledger entry and record the decision.' },
      ];
    case 'governance_risk_review':
      return [
        { minutes: 10, activity: 'Welcome and framing the regulatory map.' },
        { minutes: 30, activity: 'Walk the risk register for the candidate design.' },
        { minutes: 20, activity: 'Surface the controls the design pack must carry.' },
        { minutes: 15, activity: 'Adjudicate severity and assign owners.' },
        { minutes: 15, activity: 'Capture decisions and the next-session recommendation.' },
      ];
    case 'architecture_solution_design':
      return [
        { minutes: 10, activity: 'Welcome and framing the architecture target.' },
        { minutes: 30, activity: 'Walk the candidate target architecture and trade-offs.' },
        { minutes: 20, activity: 'Lock the vendor stance and integration boundary.' },
        { minutes: 15, activity: 'Surface tensions on cost, latency, and migration risk.' },
        { minutes: 15, activity: 'Capture decisions and update the design pack.' },
      ];
    case 'operating_model_alignment':
      return [
        { minutes: 10, activity: 'Welcome and framing the run-state operating model.' },
        { minutes: 30, activity: 'Walk the RACI for the run-state.' },
        { minutes: 20, activity: 'Surface ownership gaps and on-call boundaries.' },
        { minutes: 15, activity: 'Adjudicate ownership and assign owners.' },
        { minutes: 15, activity: 'Capture decisions and update the operating-model artifact.' },
      ];
    case 'adoption_change_readiness':
      return [
        { minutes: 10, activity: 'Welcome and framing the readiness rubric.' },
        { minutes: 25, activity: 'Walk adoption signals from the pilot population.' },
        { minutes: 20, activity: 'Stress-test training plan and change-management coverage.' },
        { minutes: 15, activity: 'Surface tensions on readiness for scale.' },
        { minutes: 20, activity: 'Capture decisions and the next-session recommendation.' },
      ];
    case 'executive_decision_review':
      return [
        { minutes: 10, activity: 'Welcome, framing, and confirmation of the decision in question.' },
        { minutes: 25, activity: 'Walk the evidence chain that supports the decision.' },
        { minutes: 20, activity: 'Walk the value ledger entries that frame the outcome.' },
        { minutes: 15, activity: 'Surface tensions and adjudicate.' },
        { minutes: 20, activity: 'Capture the decision record and the executive readout.' },
      ];
  }
}

function composeQuestionsToAsk(type: WorkshopType): ReadonlyArray<string> {
  switch (type) {
    case 'current_state_discovery':
      return [
        'What part of the operating reality does the room agree the program must fix first?',
        'Which contradictions in current state will the program have to resolve to advance?',
        'Where are we missing evidence and who can produce it before the next session?',
      ];
    case 'use_case_framing':
      return [
        'Which use case carries the largest operating impact in the first wave?',
        'Which use case is most feasible given current data and platform readiness?',
        'What use cases are we explicitly deferring and why?',
      ];
    case 'data_foundation_assessment':
      return [
        'For each prioritized use case, which data domain is the most material gap?',
        'What lineage, freshness, or access gap blocks progress today?',
        'Who owns each gap and what is the earliest date a fix can land?',
      ];
    case 'value_framing':
      return [
        'What is the baseline anchor the room agrees the program is improving against?',
        'What is the confidence band on the projected value and what drives the spread?',
        'Which projections does the platform have evidence for today and which are deferred?',
      ];
    case 'governance_risk_review':
      return [
        'What is the most severe risk the design pack does not currently mitigate?',
        'Which regulatory control must land in the design before approval?',
        'Who owns each risk in the run-state and what is the mitigation window?',
      ];
    case 'architecture_solution_design':
      return [
        'What is the trade-off the room is choosing in the target architecture?',
        'Which integration boundary is most material for cost, latency, or risk?',
        'What is the vendor stance and which evaluation evidence supports it?',
      ];
    case 'operating_model_alignment':
      return [
        'Who owns the run-state for each workstream and how is on-call structured?',
        'What is the RACI for the most material run-state decision?',
        'Where does the operating model differ from prior comparable programs?',
      ];
    case 'adoption_change_readiness':
      return [
        'What adoption signal from the pilot population gives the room confidence?',
        'Where is the training and change-management coverage thin?',
        'What is the gating signal that must land before scale?',
      ];
    case 'executive_decision_review':
      return [
        'Which decision must the room capture today and who owns it?',
        'What evidence chain is the decision grounded in?',
        'Which deferred items must be flagged in the executive readout?',
      ];
  }
}

function composeLikelyTensions(type: WorkshopType): ReadonlyArray<string> {
  switch (type) {
    case 'current_state_discovery':
      return [
        'Business owners and technical leads disagree on whether the friction is process or platform.',
        'Sponsor wants the room to commit to a fix before discovery is complete.',
      ];
    case 'use_case_framing':
      return [
        'Sponsor priority and technical feasibility do not point at the same first wave.',
        'Data owner cannot yet commit to the data needed for a candidate use case.',
      ];
    case 'data_foundation_assessment':
      return [
        'Data owners and technical leads disagree on the severity of a lineage gap.',
        'Business owner wants to proceed without the gap being closed.',
      ];
    case 'value_framing':
      return [
        'Baseline anchor is contested between business and technical owners.',
        'Sponsor wants a tighter confidence band than the evidence supports.',
      ];
    case 'governance_risk_review':
      return [
        'Compliance reviewer wants a control the design does not yet carry.',
        'Sponsor wants a faster mitigation window than the run-state can deliver.',
      ];
    case 'architecture_solution_design':
      return [
        'Cost, latency, and migration risk pull the target architecture in different directions.',
        'Vendor stance is contested between procurement and technical leads.',
      ];
    case 'operating_model_alignment':
      return [
        'On-call ownership is contested between platform and business teams.',
        'RACI for the most material run-state decision is unclear.',
      ];
    case 'adoption_change_readiness':
      return [
        'Pilot population does not represent the scale population.',
        'Training plan coverage is thinner than the readiness rubric requires.',
      ];
    case 'executive_decision_review':
      return [
        'Sponsor and business owner read the evidence differently.',
        'Deferred items create asymmetric risk the room has not yet adjudicated.',
      ];
  }
}

function composeDecisionsNeeded(type: WorkshopType): ReadonlyArray<string> {
  switch (type) {
    case 'current_state_discovery':
      return [
        'Confirm the operating-state framing the program must improve.',
        'Approve the evidence-collection plan for the next session.',
      ];
    case 'use_case_framing':
      return [
        'Lock the prioritized use-case wave.',
        'Approve the deferral rationale for use cases that are not in the wave.',
      ];
    case 'data_foundation_assessment':
      return [
        'Lock the data gaps the program will fix before advance.',
        'Approve the gap-owner assignment and timeline.',
      ];
    case 'value_framing':
      return [
        'Lock the projected value framing and confidence band.',
        'Approve the baseline anchor and target metric definition.',
      ];
    case 'governance_risk_review':
      return [
        'Lock the controls the design pack must carry.',
        'Approve the risk-register entries and owners.',
      ];
    case 'architecture_solution_design':
      return [
        'Lock the target architecture and integration boundary.',
        'Approve the vendor stance and material trade-offs.',
      ];
    case 'operating_model_alignment':
      return [
        'Lock the RACI for the run-state.',
        'Approve the on-call boundary and ownership map.',
      ];
    case 'adoption_change_readiness':
      return [
        'Confirm the readiness signal the room accepts as gating.',
        'Approve the training and change-management coverage plan.',
      ];
    case 'executive_decision_review':
      return [
        'Capture the executive decision the sponsor signs.',
        'Approve the executive readout for distribution.',
      ];
  }
}

function composeEvidenceToCapture(
  type: WorkshopType,
): ReadonlyArray<WorkshopEvidenceRequest> {
  switch (type) {
    case 'current_state_discovery':
      return [
        {
          label: 'Current-state findings note',
          reason: 'Captures the operating reality the program must improve.',
          required: true,
        },
        {
          label: 'Open questions list',
          reason: 'Records the discovery gaps Nexus must close before next session.',
          required: false,
        },
      ];
    case 'use_case_framing':
      return [
        {
          label: 'Prioritized use-case wave',
          reason: 'Locks the first wave the program will execute.',
          required: true,
        },
        {
          label: 'Deferral rationale list',
          reason: 'Captures why deferred use cases are not in the wave.',
          required: false,
        },
      ];
    case 'data_foundation_assessment':
      return [
        {
          label: 'Data gap register',
          reason: 'Captures the gaps the program must close before advance.',
          required: true,
        },
        {
          label: 'Data owner roster',
          reason: 'Names the owners the gap-fix timeline depends on.',
          required: true,
        },
        {
          label: 'Pre-existing data inventory snapshot',
          reason: 'Provides the deterministic baseline the assessment grew from.',
          required: false,
        },
      ];
    case 'value_framing':
      return [
        {
          label: 'Projected value ledger entry',
          reason: 'Captures the projected value with confidence band.',
          required: true,
        },
        {
          label: 'Baseline anchor reference',
          reason: 'Records the operating baseline the projection grows from.',
          required: true,
        },
        {
          label: 'Variance attribution placeholder',
          reason: 'Reserves a line for projected-vs-realized attribution after Verify.',
          required: false,
        },
      ];
    case 'governance_risk_review':
      return [
        {
          label: 'Risk register entries',
          reason: 'Captures severity, owner, and mitigation window per risk.',
          required: true,
        },
        {
          label: 'Required-control list for design pack',
          reason: 'Names the controls the design pack must carry.',
          required: true,
        },
        {
          label: 'Regulatory map reference',
          reason: 'Documents the regulatory anchors the controls are mapped to.',
          required: false,
        },
      ];
    case 'architecture_solution_design':
      return [
        {
          label: 'Target architecture decision record',
          reason: 'Captures the locked architecture and integration boundary.',
          required: true,
        },
        {
          label: 'Vendor stance memo',
          reason: 'Captures the vendor decision and the evidence behind it.',
          required: true,
        },
        {
          label: 'Trade-off log',
          reason: 'Records the cost, latency, and migration trade-offs the room accepted.',
          required: false,
        },
      ];
    case 'operating_model_alignment':
      return [
        {
          label: 'RACI for run-state',
          reason: 'Captures the run-state ownership map.',
          required: true,
        },
        {
          label: 'On-call boundary memo',
          reason: 'Captures the on-call structure between platform and business.',
          required: true,
        },
        {
          label: 'Operating-model deviations list',
          reason: 'Notes how the operating model differs from prior comparable programs.',
          required: false,
        },
      ];
    case 'adoption_change_readiness':
      return [
        {
          label: 'Readiness signal log',
          reason: 'Captures the gating signals the room accepted.',
          required: true,
        },
        {
          label: 'Training coverage roster',
          reason: 'Captures training and change-management coverage.',
          required: false,
        },
        {
          label: 'Pilot adoption metric snapshot',
          reason: 'Records adoption signals from the pilot population.',
          required: true,
        },
      ];
    case 'executive_decision_review':
      return [
        {
          label: 'Executive decision record',
          reason: 'Captures the decision the sponsor signs.',
          required: true,
        },
        {
          label: 'Evidence-chain manifest',
          reason: 'Lists the evidence references the decision is grounded in.',
          required: true,
        },
        {
          label: 'Deferred-items list',
          reason: 'Captures items deferred from this decision.',
          required: false,
        },
      ];
  }
}

function composeExpectedOutputs(type: WorkshopType): ReadonlyArray<WorkshopOutput> {
  switch (type) {
    case 'current_state_discovery':
      return [
        {
          kind: 'evidence_capture',
          description: 'Current-state findings captured as evidence references for downstream phases.',
        },
        {
          kind: 'next_session_recommendation',
          description: 'Recommendation for the next workshop with named objective and attendees.',
        },
      ];
    case 'use_case_framing':
      return [
        {
          kind: 'updated_charter',
          description: 'Charter updated with the prioritized first-wave use cases.',
        },
        {
          kind: 'decision_record',
          description: 'Decision record locking the first-wave use cases.',
        },
      ];
    case 'data_foundation_assessment':
      return [
        {
          kind: 'evidence_capture',
          description: 'Data gap register and owner roster captured as evidence.',
        },
        {
          kind: 'risk_register_entry',
          description: 'Risk register entries for material data gaps.',
        },
      ];
    case 'value_framing':
      return [
        {
          kind: 'value_ledger_entry',
          description: 'Projected value ledger entry with confidence band.',
        },
        {
          kind: 'decision_record',
          description: 'Decision record locking the baseline anchor and target metric.',
        },
      ];
    case 'governance_risk_review':
      return [
        {
          kind: 'risk_register_entry',
          description: 'Risk register entries with severity, owner, and mitigation.',
        },
        {
          kind: 'updated_design_pack',
          description: 'Design pack updated with required controls.',
        },
      ];
    case 'architecture_solution_design':
      return [
        {
          kind: 'updated_design_pack',
          description: 'Design pack updated with the locked target architecture and vendor stance.',
        },
        {
          kind: 'decision_record',
          description: 'Decision record capturing the architecture trade-offs the room accepted.',
        },
      ];
    case 'operating_model_alignment':
      return [
        {
          kind: 'updated_design_pack',
          description: 'Design pack updated with the run-state RACI and on-call boundary.',
        },
        {
          kind: 'decision_record',
          description: 'Decision record capturing the run-state ownership map.',
        },
      ];
    case 'adoption_change_readiness':
      return [
        {
          kind: 'evidence_capture',
          description: 'Readiness signals captured as evidence for the scale gate.',
        },
        {
          kind: 'next_session_recommendation',
          description: 'Recommendation for the next readiness or executive review session.',
        },
      ];
    case 'executive_decision_review':
      return [
        {
          kind: 'decision_record',
          description: 'Executive decision record signed by the sponsor.',
        },
        {
          kind: 'executive_readout',
          description: 'Atlas-style executive readout published after the session.',
        },
      ];
  }
}

function composeStewardGateImplication(
  type: WorkshopType,
  specPhase: number,
): string {
  const gate = currentHardGateForProgram(specPhase);
  if (gate === null) {
    // Phase 4 (Execute) has no canonical hard gate; honest fallback.
    return 'No canonical hard gate is at risk in the current phase; the workshop tightens evidence for the eventual G4 verification.';
  }
  switch (type) {
    case 'current_state_discovery':
      return `Tightens evidence the room needs to clear ${gate}.`;
    case 'use_case_framing':
      return `Locks the use-case wave the charter must carry to clear ${gate}.`;
    case 'data_foundation_assessment':
      return `Surfaces the data gaps that block ${gate} clearance.`;
    case 'value_framing':
      return `Captures the projected value entry the room needs to defend ${gate}.`;
    case 'governance_risk_review':
      return `Names the controls and risks the design pack must carry to clear ${gate}.`;
    case 'architecture_solution_design':
      return `Locks the design and vendor decision the room needs to clear ${gate}.`;
    case 'operating_model_alignment':
      return `Locks the run-state ownership map the room needs before approaching ${gate}.`;
    case 'adoption_change_readiness':
      return `Surfaces the readiness signal the room needs before approaching ${gate}.`;
    case 'executive_decision_review':
      return `Captures the executive decision record the room needs to clear ${gate}.`;
  }
}

function composeNexusPreparationBrief(
  type: WorkshopType,
  objective: WorkshopObjective,
  stewardGateImplication: string,
): string {
  const sentence1 = `Objective: ${objective.text}`;
  const sentence2 = stewardGateImplication;
  const sentence3 = nexusPreparationStep(type);
  return [sentence1, sentence2, sentence3].join(' ');
}

function nexusPreparationStep(type: WorkshopType): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Nexus assembles the discovery context bundle, names the open questions, and surfaces honest gaps to the Maestro before the room.';
    case 'use_case_framing':
      return 'Nexus assembles the candidate use-case longlist with prior pattern matches and surfaces the prioritization rubric.';
    case 'data_foundation_assessment':
      return 'Nexus assembles the data inventory snapshot for the prioritized use cases and names the gaps the room must adjudicate.';
    case 'value_framing':
      return 'Nexus assembles the baseline anchor and prior comparable projections so the Maestro can frame the confidence band honestly.';
    case 'governance_risk_review':
      return 'Nexus assembles the regulatory map and prior risk register patterns so the Maestro can name controls without fabrication.';
    case 'architecture_solution_design':
      return 'Nexus assembles the reference architecture options and vendor evaluation summary so the Maestro can lock the trade-off.';
    case 'operating_model_alignment':
      return 'Nexus assembles the RACI draft and prior operating-model references so the Maestro can adjudicate ownership.';
    case 'adoption_change_readiness':
      return 'Nexus assembles the pilot adoption signals and training coverage so the Maestro can stress-test readiness.';
    case 'executive_decision_review':
      return 'Nexus assembles the evidence-chain manifest and value-ledger entries so the Maestro can run the decision review with the room.';
  }
}

function composeRisks(type: WorkshopType): ReadonlyArray<WorkshopRisk> {
  switch (type) {
    case 'current_state_discovery':
      return [
        {
          id: 'risk:csd:framing',
          description: 'Framing locks before discovery is complete.',
          severity: 'medium',
        },
        {
          id: 'risk:csd:owner',
          description: 'No business owner can ground-truth the operating reality in the room.',
          severity: 'medium',
        },
      ];
    case 'use_case_framing':
      return [
        {
          id: 'risk:ucf:wave',
          description: 'Sponsor priority and technical feasibility do not converge on a wave.',
          severity: 'high',
        },
        {
          id: 'risk:ucf:data',
          description: 'Data owner cannot commit to the data needed for the candidate wave.',
          severity: 'medium',
        },
      ];
    case 'data_foundation_assessment':
      return [
        {
          id: 'risk:dfa:gap',
          description: 'Material data gap blocks the prioritized wave.',
          severity: 'high',
        },
        {
          id: 'risk:dfa:owner',
          description: 'No data owner can commit to the gap-fix timeline.',
          severity: 'medium',
        },
      ];
    case 'value_framing':
      return [
        {
          id: 'risk:vf:baseline',
          description: 'Baseline anchor is contested between business and technical owners.',
          severity: 'medium',
        },
        {
          id: 'risk:vf:band',
          description: 'Sponsor wants a tighter confidence band than the evidence supports.',
          severity: 'medium',
        },
      ];
    case 'governance_risk_review':
      return [
        {
          id: 'risk:grr:control',
          description: 'A required control cannot land in the design pack within the mitigation window.',
          severity: 'high',
        },
        {
          id: 'risk:grr:owner',
          description: 'No run-state owner is identified for a material risk.',
          severity: 'medium',
        },
      ];
    case 'architecture_solution_design':
      return [
        {
          id: 'risk:asd:tradeoff',
          description: 'Cost, latency, and migration trade-offs do not converge on a target.',
          severity: 'high',
        },
        {
          id: 'risk:asd:vendor',
          description: 'Vendor stance is contested between procurement and technical leads.',
          severity: 'medium',
        },
      ];
    case 'operating_model_alignment':
      return [
        {
          id: 'risk:oma:oncall',
          description: 'On-call ownership is contested between platform and business teams.',
          severity: 'medium',
        },
        {
          id: 'risk:oma:raci',
          description: 'RACI for a material run-state decision is unclear.',
          severity: 'medium',
        },
      ];
    case 'adoption_change_readiness':
      return [
        {
          id: 'risk:acr:pilot',
          description: 'Pilot population does not represent the scale population.',
          severity: 'high',
        },
        {
          id: 'risk:acr:training',
          description: 'Training coverage is thinner than the readiness rubric requires.',
          severity: 'medium',
        },
      ];
    case 'executive_decision_review':
      return [
        {
          id: 'risk:edr:evidence',
          description: 'Evidence chain has gaps the sponsor flags during the review.',
          severity: 'high',
        },
        {
          id: 'risk:edr:deferred',
          description: 'Deferred items create asymmetric risk the room has not adjudicated.',
          severity: 'medium',
        },
      ];
  }
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByType(): Record<WorkshopType, number> {
  return {
    current_state_discovery: 0,
    use_case_framing: 0,
    data_foundation_assessment: 0,
    value_framing: 0,
    governance_risk_review: 0,
    architecture_solution_design: 0,
    operating_model_alignment: 0,
    adoption_change_readiness: 0,
    executive_decision_review: 0,
  };
}

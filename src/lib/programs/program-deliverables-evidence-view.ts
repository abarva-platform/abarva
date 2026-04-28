// PROG13 · Program Deliverables × Evidence Trace Read Model.
//
// Pure deterministic projection: composes a fixed inventory of program
// deliverables grouped by canonical phase (discovery → operate) and
// annotates each with version state, evidence state, missing inputs,
// and a one-line approval implication.
//
// Read-only and additive over the existing PDEL inventory + EVID2
// ledger; this slice does NOT mutate either, does NOT fabricate
// citations, does NOT call the Model Gateway, and does NOT call
// Date.now / Math.random / new Date / fetch. The "approval implication"
// strings are advisory copy only — no approval state is changed by
// this module.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type DeliverableVersionState =
  | 'draft'
  | 'in-review'
  | 'approved'
  | 'superseded';

export type DeliverableEvidenceState = 'complete' | 'partial' | 'missing';

export type DeliverablePhaseId =
  | 'discovery'
  | 'synthesis'
  | 'design'
  | 'build'
  | 'activate'
  | 'operate';

export interface DeliverableEntry {
  deliverableId: string;
  label: string;
  phaseId: DeliverablePhaseId;
  versionLabel: string;
  versionState: DeliverableVersionState;
  evidenceState: DeliverableEvidenceState;
  missingInputs: string[];
  approvalImplication: string;
  isCurrent: boolean;
}

export interface DeliverablePhaseGroup {
  phaseId: DeliverablePhaseId;
  phaseLabel: string;
  order: number;
  deliverables: DeliverableEntry[];
}

export interface ProgramDeliverablesEvidenceViewModel {
  programLabel: string;
  currentDeliverableId: string | null;
  phaseGroups: DeliverablePhaseGroup[];
  totalDeliverables: number;
  evidenceCoveragePercent: number;
  caveat: string;
  generatedAt: string;
}

export interface ProgramDeliverablesEvidenceInput {
  programLabel?: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const DEFAULT_PROGRAM_LABEL = 'Apex Retail · CDP Activation';

const CAVEAT =
  'Deliverable inventory is deterministic and seed-backed. No file storage, no live downloads, no model-generated content. Approvals shown reflect seed state only — no actual approval is performed here.';

const GENERATED_AT = '2026-04-26';

const CURRENT_DELIVERABLE_ID = 'synthesis-decision-log-v1';

const PHASE_LABELS: Record<DeliverablePhaseId, string> = {
  discovery: 'Discovery',
  synthesis: 'Synthesis',
  design: 'Design',
  build: 'Build',
  activate: 'Activate',
  operate: 'Operate',
};

const PHASE_ORDER: Record<DeliverablePhaseId, number> = {
  discovery: 1,
  synthesis: 2,
  design: 3,
  build: 4,
  activate: 5,
  operate: 6,
};

export const DELIVERABLE_VERSION_STATES: readonly DeliverableVersionState[] = [
  'draft',
  'in-review',
  'approved',
  'superseded',
];

export const DELIVERABLE_EVIDENCE_STATES: readonly DeliverableEvidenceState[] = [
  'complete',
  'partial',
  'missing',
];

export const DELIVERABLE_PHASE_IDS: readonly DeliverablePhaseId[] = [
  'discovery',
  'synthesis',
  'design',
  'build',
  'activate',
  'operate',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export function buildProgramDeliverablesEvidenceView(
  input?: ProgramDeliverablesEvidenceInput,
): ProgramDeliverablesEvidenceViewModel {
  const programLabel =
    input?.programLabel && input.programLabel.trim().length > 0
      ? input.programLabel
      : DEFAULT_PROGRAM_LABEL;

  const phaseGroups = composePhaseGroups();
  const totalDeliverables = phaseGroups.reduce(
    (sum, group) => sum + group.deliverables.length,
    0,
  );

  return {
    programLabel,
    currentDeliverableId: CURRENT_DELIVERABLE_ID,
    phaseGroups,
    totalDeliverables,
    evidenceCoveragePercent: 36,
    caveat: CAVEAT,
    generatedAt: GENERATED_AT,
  };
}

// ---------------------------------------------------------------------
// Internal composition
// ---------------------------------------------------------------------

function composePhaseGroups(): DeliverablePhaseGroup[] {
  return [
    makeGroup('discovery', [
      makeEntry({
        deliverableId: 'discovery-brief',
        label: 'Discovery brief',
        phaseId: 'discovery',
        versionLabel: 'v1.3',
        versionState: 'approved',
        evidenceState: 'complete',
        missingInputs: [],
        approvalImplication: 'Approved — feeds synthesis',
      }),
      makeEntry({
        deliverableId: 'discovery-stakeholder-map',
        label: 'Stakeholder map',
        phaseId: 'discovery',
        versionLabel: 'v1.0',
        versionState: 'approved',
        evidenceState: 'complete',
        missingInputs: [],
        approvalImplication: 'Approved — used for synthesis attendees',
      }),
      makeEntry({
        deliverableId: 'discovery-findings-report',
        label: 'Discovery findings report',
        phaseId: 'discovery',
        versionLabel: 'v1.2',
        versionState: 'approved',
        evidenceState: 'partial',
        missingInputs: ['Privacy office sign-off'],
        approvalImplication: 'Used for value hypothesis',
      }),
    ]),
    makeGroup('synthesis', [
      makeEntry({
        deliverableId: 'synthesis-value-hypothesis-v1',
        label: 'Value hypothesis v1',
        phaseId: 'synthesis',
        versionLabel: 'v0.8',
        versionState: 'in-review',
        evidenceState: 'partial',
        missingInputs: ['Workshop 5 outputs'],
        approvalImplication: 'Blocks design phase',
      }),
      makeEntry({
        deliverableId: 'synthesis-scope-guardrails',
        label: 'Scope guardrails',
        phaseId: 'synthesis',
        versionLabel: 'v0.5',
        versionState: 'draft',
        evidenceState: 'partial',
        missingInputs: ['Sponsor confirmation', 'Privacy boundary'],
        approvalImplication: 'Blocks design phase',
      }),
      makeEntry({
        deliverableId: CURRENT_DELIVERABLE_ID,
        label: 'Decision log v1',
        phaseId: 'synthesis',
        versionLabel: 'v1.0',
        versionState: 'in-review',
        evidenceState: 'complete',
        missingInputs: [],
        approvalImplication: 'Awaiting Steward approval',
        isCurrent: true,
      }),
    ]),
    makeGroup('design', [
      makeEntry({
        deliverableId: 'design-target-architecture',
        label: 'Target architecture brief',
        phaseId: 'design',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Synthesis decision log approval', 'Data domain map'],
        approvalImplication: 'Awaits synthesis approval before review',
      }),
      makeEntry({
        deliverableId: 'design-data-contracts',
        label: 'Data contracts catalog',
        phaseId: 'design',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Source system inventory'],
        approvalImplication: 'Awaits synthesis approval before review',
      }),
    ]),
    makeGroup('build', [
      makeEntry({
        deliverableId: 'build-runbook',
        label: 'Build runbook',
        phaseId: 'build',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Target architecture brief'],
        approvalImplication: 'Awaits design phase',
      }),
      makeEntry({
        deliverableId: 'build-test-strategy',
        label: 'Test strategy',
        phaseId: 'build',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Acceptance criteria from design'],
        approvalImplication: 'Awaits design phase',
      }),
    ]),
    makeGroup('activate', [
      makeEntry({
        deliverableId: 'activate-rollout-plan',
        label: 'Rollout plan',
        phaseId: 'activate',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Build sign-off'],
        approvalImplication: 'Awaits build phase',
      }),
      makeEntry({
        deliverableId: 'activate-enablement-pack',
        label: 'Enablement pack',
        phaseId: 'activate',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Persona journey map'],
        approvalImplication: 'Awaits build phase',
      }),
    ]),
    makeGroup('operate', [
      makeEntry({
        deliverableId: 'operate-runbook',
        label: 'Operate runbook',
        phaseId: 'operate',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Rollout sign-off'],
        approvalImplication: 'Awaits activate phase',
      }),
      makeEntry({
        deliverableId: 'operate-value-tracker',
        label: 'Value tracker',
        phaseId: 'operate',
        versionLabel: 'v0.1',
        versionState: 'draft',
        evidenceState: 'missing',
        missingInputs: ['Baseline metrics'],
        approvalImplication: 'Awaits activate phase',
      }),
    ]),
  ];
}

function makeGroup(
  phaseId: DeliverablePhaseId,
  deliverables: DeliverableEntry[],
): DeliverablePhaseGroup {
  return {
    phaseId,
    phaseLabel: PHASE_LABELS[phaseId],
    order: PHASE_ORDER[phaseId],
    deliverables,
  };
}

function makeEntry(input: {
  deliverableId: string;
  label: string;
  phaseId: DeliverablePhaseId;
  versionLabel: string;
  versionState: DeliverableVersionState;
  evidenceState: DeliverableEvidenceState;
  missingInputs: string[];
  approvalImplication: string;
  isCurrent?: boolean;
}): DeliverableEntry {
  return {
    deliverableId: input.deliverableId,
    label: input.label,
    phaseId: input.phaseId,
    versionLabel: input.versionLabel,
    versionState: input.versionState,
    evidenceState: input.evidenceState,
    missingInputs: input.missingInputs,
    approvalImplication: input.approvalImplication,
    isCurrent: input.isCurrent === true,
  };
}

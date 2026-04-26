// PROG12 · Nexus Workshop / Center Canvas view-model.
//
// Pure deterministic helper that composes the workshop briefing surface
// rendered at the center of the Program page. Read-only: no model calls,
// no fetch, no Date.now / Math.random / new Date, no live notes ingestion,
// no fake decisions, no runtime persistence. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts
//
// The view-model is consumed exclusively by NexusWorkshopCanvas.tsx.

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type WorkshopReadinessState = 'ready' | 'partial' | 'blocked';

export type SmeRole =
  | 'business-sponsor'
  | 'data-architect'
  | 'change-lead'
  | 'platform-owner'
  | 'analytics-lead'
  | 'product-lead'
  | 'security-officer'
  | 'finance-partner';

export const SME_ROLES: ReadonlyArray<SmeRole> = [
  'business-sponsor',
  'data-architect',
  'change-lead',
  'platform-owner',
  'analytics-lead',
  'product-lead',
  'security-officer',
  'finance-partner',
];

export interface WorkshopAgendaItem {
  itemId: string;
  label: string;
  durationMinutes: number;
  questionToAsk: string;
}

export interface WorkshopAttendeeRow {
  role: SmeRole;
  required: boolean;
  confirmed: boolean;
  reasonIfMissing: string | null;
}

export interface WorkshopTension {
  tensionId: string;
  label: string;
  description: string;
}

export interface WorkshopDecisionNeeded {
  decisionId: string;
  label: string;
  rationale: string;
}

export interface WorkshopEvidenceToCapture {
  evidenceId: string;
  label: string;
  source: string;
}

export interface WorkshopExpectedOutput {
  outputId: string;
  label: string;
  artifactType: string;
}

export interface NexusWorkshopCanvasViewModel {
  programLabel: string;
  workshopTitle: string;
  workshopNumber: number;
  phaseLabel: string;
  readinessState: WorkshopReadinessState;
  objective: string;
  agenda: WorkshopAgendaItem[];
  attendees: WorkshopAttendeeRow[];
  tensions: WorkshopTension[];
  decisionsNeeded: WorkshopDecisionNeeded[];
  evidenceToCapture: WorkshopEvidenceToCapture[];
  expectedOutputs: WorkshopExpectedOutput[];
  proposedUpdatesPlaceholder: string;
  caveat: string;
  generatedAt: string;
}

export interface NexusWorkshopCanvasInput {
  programLabel?: string;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

const DEFAULT_PROGRAM_LABEL = 'Apex Retail · CDP Activation';

const AGENDA: ReadonlyArray<WorkshopAgendaItem> = [
  {
    itemId: 'agenda-1',
    label: 'Discovery findings recap',
    durationMinutes: 15,
    questionToAsk: 'Which findings are highest-confidence?',
  },
  {
    itemId: 'agenda-2',
    label: 'Value hypothesis review',
    durationMinutes: 25,
    questionToAsk: 'Does the hypothesis hold for all in-scope segments?',
  },
  {
    itemId: 'agenda-3',
    label: 'Scope guardrails',
    durationMinutes: 20,
    questionToAsk: 'What is explicitly out of scope?',
  },
  {
    itemId: 'agenda-4',
    label: 'Decision register update',
    durationMinutes: 15,
    questionToAsk: 'Which decisions can we close today?',
  },
  {
    itemId: 'agenda-5',
    label: 'Open questions parking',
    durationMinutes: 10,
    questionToAsk: 'What needs SME follow-up?',
  },
];

const ATTENDEES: ReadonlyArray<WorkshopAttendeeRow> = [
  {
    role: 'business-sponsor',
    required: true,
    confirmed: false,
    reasonIfMissing: 'Schedule conflict with quarterly review',
  },
  {
    role: 'data-architect',
    required: true,
    confirmed: true,
    reasonIfMissing: null,
  },
  {
    role: 'change-lead',
    required: true,
    confirmed: true,
    reasonIfMissing: null,
  },
  {
    role: 'platform-owner',
    required: true,
    confirmed: false,
    reasonIfMissing: 'Out of office until 2026-04-29',
  },
  {
    role: 'analytics-lead',
    required: true,
    confirmed: true,
    reasonIfMissing: null,
  },
];

const TENSIONS: ReadonlyArray<WorkshopTension> = [
  {
    tensionId: 'tension-1',
    label: 'Scope vs timeline',
    description:
      'Business sponsor wants broader scope; platform owner concerned about Q3 timeline.',
  },
  {
    tensionId: 'tension-2',
    label: 'Privacy stance vs personalisation',
    description:
      'Privacy officer requires consent boundaries; analytics lead wants richer signals.',
  },
];

const DECISIONS_NEEDED: ReadonlyArray<WorkshopDecisionNeeded> = [
  {
    decisionId: 'decision-1',
    label: 'Lock primary value hypothesis',
    rationale: 'Cannot proceed to design without locked hypothesis',
  },
  {
    decisionId: 'decision-2',
    label: 'Confirm BAFO commercial posture',
    rationale: 'Atlas needs posture for negotiation prep',
  },
  {
    decisionId: 'decision-3',
    label: 'Confirm out-of-scope items',
    rationale: 'Steward needs scope clarity for gate',
  },
];

const EVIDENCE_TO_CAPTURE: ReadonlyArray<WorkshopEvidenceToCapture> = [
  {
    evidenceId: 'evidence-1',
    label: 'Discovery interview themes',
    source: 'Discovery transcripts',
  },
  {
    evidenceId: 'evidence-2',
    label: 'Use case prioritisation rubric',
    source: 'Working group outputs',
  },
  {
    evidenceId: 'evidence-3',
    label: 'Privacy boundary statement',
    source: 'Privacy office input',
  },
  {
    evidenceId: 'evidence-4',
    label: 'Commercial posture preference',
    source: 'Sponsor + Atlas alignment',
  },
];

const EXPECTED_OUTPUTS: ReadonlyArray<WorkshopExpectedOutput> = [
  {
    outputId: 'output-1',
    label: 'Validated value hypothesis v1',
    artifactType: 'Hypothesis document',
  },
  {
    outputId: 'output-2',
    label: 'Locked scope guardrails',
    artifactType: 'Scope document',
  },
  {
    outputId: 'output-3',
    label: 'Decision log entries (3)',
    artifactType: 'Decision log',
  },
];

const PROPOSED_UPDATES_PLACEHOLDER =
  'Proposed program updates synthesised from meeting notes will appear ' +
  'here once meeting-notes-to-program-updates is wired into this canvas. ' +
  'Today this view is read-only.';

const CAVEAT =
  'Workshop canvas is deterministic and seed-backed. No live notes, no ' +
  'model summarisation, no fake decisions or persistence. Attendee ' +
  'confirmations are illustrative.';

const GENERATED_AT = '2026-04-26';

/**
 * Build the deterministic Nexus Workshop Canvas view-model. Pure function:
 * same input → identical output. Hardcoded demo content reflects the
 * canonical "Apex Retail · CDP Activation" Synthesis Workshop briefing.
 */
export function buildNexusWorkshopCanvasView(
  input?: NexusWorkshopCanvasInput,
): NexusWorkshopCanvasViewModel {
  const programLabel =
    input?.programLabel && input.programLabel.length > 0
      ? input.programLabel
      : DEFAULT_PROGRAM_LABEL;

  return {
    programLabel,
    workshopTitle: 'Synthesis Workshop — Value Hypothesis Validation',
    workshopNumber: 5,
    phaseLabel: 'Synthesis',
    readinessState: 'partial',
    objective:
      'Consolidate Discovery findings into a validated value hypothesis. ' +
      'Confirm primary use cases, scope guardrails, and BAFO posture for ' +
      'downstream design phase.',
    agenda: AGENDA.map((item) => ({ ...item })),
    attendees: ATTENDEES.map((row) => ({ ...row })),
    tensions: TENSIONS.map((t) => ({ ...t })),
    decisionsNeeded: DECISIONS_NEEDED.map((d) => ({ ...d })),
    evidenceToCapture: EVIDENCE_TO_CAPTURE.map((e) => ({ ...e })),
    expectedOutputs: EXPECTED_OUTPUTS.map((o) => ({ ...o })),
    proposedUpdatesPlaceholder: PROPOSED_UPDATES_PLACEHOLDER,
    caveat: CAVEAT,
    generatedAt: GENERATED_AT,
  };
}

// PROG10 · Program Flagship View Model.
//
// Pure TypeScript view-model that powers the flagship Program detail
// experience (ProgramFlagshipPage). Deterministic, seed-backed, no
// React imports, no DB calls, no model calls, no Date.now() reads.
//
// The flagship surface is the reference example for the AbarVa
// operating experience: executive program brief → workflow
// orientation → what the page knows / what's missing → composed
// slot sections (phase gate, workshop canvas, deliverables /
// evidence, action / mission strip) provided by sibling lanes
// PROG11–14.
//
// What this module deliberately does NOT do:
//   - No persistence, no DB writes, no live program telemetry.
//   - No model invocation. No timestamps. No randomness. No network IO.
//   - No fabricated decisions or evidence. Everything that is not
//     seed-derivable surfaces as a deterministic placeholder string.

export type ProgramFlagshipPhaseStatus =
  | 'not-started'
  | 'in-progress'
  | 'gate-pending'
  | 'complete';

export type ProgramHealthState =
  | 'healthy'
  | 'attention'
  | 'at-risk'
  | 'unknown';

export interface ProgramFlagshipBrief {
  programName: string;
  tenantLabel: string;
  programCode: string;
  currentPhaseLabel: string;
  programHealth: ProgramHealthState;
  briefSummary: string;
  asOf: string;
}

export interface ProgramFlagshipKnowsRow {
  key: string;
  label: string;
  value: string;
}

export interface ProgramFlagshipMissingRow {
  key: string;
  label: string;
  reason: string;
  unblockedBy: 'nexus' | 'sentinel' | 'atlas' | 'steward';
}

export interface ProgramFlagshipNextAction {
  verb: string;
  target: string;
  rationale: string;
}

export interface ProgramFlagshipViewModel {
  pageQuestion: string;
  primaryAgent: 'nexus';
  brief: ProgramFlagshipBrief;
  whatThePageKnows: ProgramFlagshipKnowsRow[];
  whatThePageIsMissing: ProgramFlagshipMissingRow[];
  recommendedNextAction: ProgramFlagshipNextAction;
  caveat: string;
  generatedAt: string;
}

export interface ProgramFlagshipBuilderInput {
  tenantSlug: string;
  programSlug: string;
  programName?: string;
  tenantLabel?: string;
  programCode?: string;
}

const FLAGSHIP_AS_OF = '2026-04-26';

export function buildProgramFlagshipView(
  input: ProgramFlagshipBuilderInput,
): ProgramFlagshipViewModel {
  const programName = input.programName ?? 'Apex Retail · CDP Activation';
  const tenantLabel = input.tenantLabel ?? 'Apex Retail';
  const programCode = input.programCode ?? 'APX-CDP-2026';

  const brief: ProgramFlagshipBrief = {
    programName,
    tenantLabel,
    programCode,
    currentPhaseLabel: 'Discovery → Synthesis',
    programHealth: 'attention',
    briefSummary:
      'Discovery workshops complete. Synthesis underway. Gate readiness pending evidence consolidation. Two SMEs have not yet confirmed availability for the next workshop.',
    asOf: FLAGSHIP_AS_OF,
  };

  const whatThePageKnows: ProgramFlagshipKnowsRow[] = [
    {
      key: 'current-phase',
      label: 'Current phase',
      value: 'Discovery → Synthesis',
    },
    {
      key: 'journey-progress',
      label: 'Journey progress',
      value: '3 of 6 phases',
    },
    {
      key: 'workshops-completed',
      label: 'Workshops completed',
      value: '4 of 6',
    },
    {
      key: 'deliverables-produced',
      label: 'Deliverables produced',
      value: '12',
    },
    {
      key: 'evidence-items-captured',
      label: 'Evidence items captured',
      value: '47',
    },
    {
      key: 'open-agent-missions',
      label: 'Open agent missions',
      value: '3',
    },
  ];

  const whatThePageIsMissing: ProgramFlagshipMissingRow[] = [
    {
      key: 'synthesis-attendees',
      label: 'Synthesis workshop attendees confirmed',
      reason:
        'Two named SMEs have not yet confirmed availability for the next workshop session.',
      unblockedBy: 'steward',
    },
    {
      key: 'value-hypothesis-evidence-trace',
      label: 'Evidence trace for value-hypothesis deliverable',
      reason:
        'Source citations for the value-hypothesis deliverable have not been consolidated into a single evidence trace.',
      unblockedBy: 'sentinel',
    },
    {
      key: 'sponsor-bafo-position',
      label: 'Executive sponsor BAFO position',
      reason:
        'The executive sponsor has not recorded a Best-And-Final-Offer position to anchor commercial framing.',
      unblockedBy: 'atlas',
    },
  ];

  const recommendedNextAction: ProgramFlagshipNextAction = {
    verb: 'Schedule synthesis workshop',
    target: 'Workshop 5 · Synthesis',
    rationale: 'Discovery is complete; synthesis is the next gate input.',
  };

  const caveat =
    'Program data is deterministic and seed-backed. Live program telemetry, attendee confirmations, and persistence are deferred to later waves. No fabricated decisions or evidence.';

  return {
    pageQuestion:
      'Where is this program in its journey, and what should happen next?',
    primaryAgent: 'nexus',
    brief,
    whatThePageKnows,
    whatThePageIsMissing,
    recommendedNextAction,
    caveat,
    generatedAt: FLAGSHIP_AS_OF,
  };
}

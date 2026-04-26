// MW9 · Workshop 5 Outcome Seed + Gate Narrative
//
// Pure deterministic helper that provides Workshop 5 (Value Hypothesis Validation)
// outcomes so the Synthesis → Design gate has a narrative instead of being
// permanently blocked without story.
//
// No model calls, no fetch, no Date.now / Math.random / new Date, no DB writes.
// Same input → identical output. deterministicSeed: true on every output object.

// ---------------------------------------------------------------------
// Status types
// ---------------------------------------------------------------------

export type WorkshopOutcomeDecisionStatus = 'reached' | 'deferred' | 'pending';
export type WorkshopOutcomeTensionStatus = 'resolved' | 'open' | 'partially_resolved';
export type WorkshopOutcomeEvidenceStatus = 'captured' | 'missing' | 'candidate';

// ---------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------

export interface WorkshopDecision {
  id: string;
  decision: string;
  status: WorkshopOutcomeDecisionStatus;
  owner: string;
  note: string;
  deterministicSeed: true;
}

export interface WorkshopTension {
  id: string;
  tension: string;
  status: WorkshopOutcomeTensionStatus;
  resolution: string | null;
  deterministicSeed: true;
}

export interface WorkshopEvidenceItem {
  id: string;
  label: string;
  status: WorkshopOutcomeEvidenceStatus;
  note: string;
  deterministicSeed: true;
}

export interface WorkshopFiveOutcomes {
  workshopId: string;
  workshopTitle: string;
  sessionDate: string;
  programCode: string;
  tenantSlug: string;
  decisionsReached: WorkshopDecision[];
  tensionsResolved: WorkshopTension[];
  evidenceCaptured: WorkshopEvidenceItem[];
  remainingMissingEvidence: string[];
  gateNarrative: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------

export function buildWorkshopFiveOutcomes(): WorkshopFiveOutcomes {
  const decisionsReached: WorkshopDecision[] = [
    {
      id: 'wd-5-1',
      decision:
        'Prioritise customer data platform readiness before personalisation use cases',
      status: 'reached',
      owner: 'Programme Director',
      note: 'Agreed sequencing prevents capability debt accumulation.',
      deterministicSeed: true,
    },
    {
      id: 'wd-5-2',
      decision:
        'Use AMS vendor consolidation as a commercial readiness input to programme delivery planning',
      status: 'reached',
      owner: 'Nexus',
      note: 'AMS sourcing event linked to programme commercial readiness signal.',
      deterministicSeed: true,
    },
    {
      id: 'wd-5-3',
      decision: 'Require value hypothesis evidence baseline before Design gate approval',
      status: 'reached',
      owner: 'Steward',
      note: 'Gate remains pending until value baseline confirmed.',
      deterministicSeed: true,
    },
  ];

  const tensionsResolved: WorkshopTension[] = [
    {
      id: 'wt-5-1',
      tension: 'Platform sequencing vs business use-case urgency',
      status: 'resolved',
      resolution:
        'Sequencing agreed: CDP platform readiness precedes personalisation activation. Business urgency addressed via phased pilot plan.',
      deterministicSeed: true,
    },
  ];

  const evidenceCaptured: WorkshopEvidenceItem[] = [
    {
      id: 'we-5-1',
      label: 'Stakeholder Alignment Note — Workshop 5',
      status: 'captured',
      note: 'Session notes documenting agreement on sequencing, commercial input, and gate criteria.',
      deterministicSeed: true,
    },
    {
      id: 'we-5-2',
      label: 'Draft Value Hypothesis Evidence Candidate',
      status: 'candidate',
      note: 'Preliminary value hypothesis document identified. Requires approval and platform owner confirmation before gate.',
      deterministicSeed: true,
    },
  ];

  const remainingMissingEvidence: string[] = [
    'Approved value baseline (quantified and signed off)',
    'Platform owner confirmation (2 of 5 attendees unconfirmed)',
    'Final BAFO commercial evidence from AMS vendor consolidation',
  ];

  const gateNarrative =
    'Workshop 5 completed on 2026-04-18. Three decisions reached and one tension resolved. The Synthesis → Design gate remains pending: two evidence items captured, three remain missing. Gate will progress when value baseline is approved, platform owner confirmation is received, and final BAFO commercial evidence is available from the AMS sourcing event.';

  return {
    workshopId: 'workshop-5-synthesis',
    workshopTitle: 'Value Hypothesis Validation',
    sessionDate: '2026-04-18',
    programCode: 'APX-CDP-2026',
    tenantSlug: 'apex-retail',
    decisionsReached,
    tensionsResolved,
    evidenceCaptured,
    remainingMissingEvidence,
    gateNarrative,
    deterministicSeed: true,
  };
}

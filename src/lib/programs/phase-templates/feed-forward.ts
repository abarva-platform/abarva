// Moves — deterministic, transition-aware feed-forward ("a phase never starts
// blank"). Derives what the NEXT phase inherits from the CURRENT phase's real
// move state (maturity + gaps + readiness + evidence/gate + any downstream
// decisions). Pure + structurally typed → decoupled, unit-testable, NO model,
// NO fabrication. A section with no real data is marked "Needs confirmation" /
// "Missing" — never invented. Covers P2→P3, P3→P4, P4→P5, P5→Tower.

export type GapSeverity = 'foundational' | 'high' | 'medium' | 'low';

/** All optional: absent signals surface as "Needs confirmation", never faked. */
export interface FeedForwardSignals {
  // Current-state intelligence (richest at P2).
  whereToStart?: string | null;
  maturity?: Array<{ label: string; score: number | null }>;
  gaps?: Array<{ capability: string; severity: GapSeverity }>;
  hardGaps?: string[];
  softGaps?: string[];
  coverageScore?: number | null;
  // Real evidence / gate state.
  missingEvidence?: string[];
  openGateCriteria?: string[];
  // Downstream decision state (usually absent until the phase produces it).
  selectedApproach?: string | null;
  deferredOptions?: string[];
  controlConstraints?: string[];
  workstreams?: string[];
  owners?: string[];
  metrics?: string[];
}

export type SectionStatus = 'ready' | 'needs_confirmation';

export interface FeedForwardSection {
  title: string;
  items: string[];
  status: SectionStatus;
  /** Shown when there is no real data yet. */
  emptyLabel: string;
}

export interface FeedForwardPack {
  fromPhase: number;
  nextPhaseLabel: string;
  headline: string;
  /** Top-level "AbarVa will carry forward:" bullets. */
  carriesForward: string[];
  sections: FeedForwardSection[];
  isBlank: boolean;
}

const SEVERITY_RANK: Record<GapSeverity, number> = {
  foundational: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const clean = (xs?: string[]): string[] =>
  Array.from(new Set((xs ?? []).map((s) => s.trim()).filter((s) => s.length > 0)));

function section(title: string, items: string[], emptyLabel = 'Needs confirmation'): FeedForwardSection {
  const cleaned = clean(items);
  return {
    title,
    items: cleaned,
    status: cleaned.length > 0 ? 'ready' : 'needs_confirmation',
    emptyLabel,
  };
}

function sortedGapLabels(gaps: FeedForwardSignals['gaps'], severities?: GapSeverity[]): string[] {
  return [...(gaps ?? [])]
    .filter((g) => (severities ? severities.includes(g.severity) : true))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .map((g) => g.capability);
}

export function buildFeedForwardPack(
  fromPhase: number,
  nextPhaseLabel: string,
  s: FeedForwardSignals,
): FeedForwardPack {
  const gapLabels = sortedGapLabels(s.gaps);
  const severeGaps = sortedGapLabels(s.gaps, ['foundational', 'high']);
  const readinessConstraints = clean(s.hardGaps);
  const evidenceGaps = clean([...(s.missingEvidence ?? []), ...(s.softGaps ?? [])]);
  const controls = clean(s.controlConstraints);
  const openQuestions = clean([...(s.softGaps ?? []), ...(s.openGateCriteria ?? [])]);

  let sections: FeedForwardSection[];
  let carriesForward: string[];

  if (fromPhase <= 2) {
    // P2 → P3 Design Future State
    sections = [
      section('Design inputs', [...gapLabels, ...readinessConstraints, ...controls]),
      section('Evidence gaps', evidenceGaps, 'No evidence gaps recorded'),
      section(
        'Risks to consider',
        [
          ...severeGaps.map((g) => `Unaddressed: ${g}`),
          controls.length > 0 ? 'Do not over-automate high-control decisions' : '',
        ].filter(Boolean),
      ),
      section(`Recommended ${nextPhaseLabel} focus`, [
        'Compare solution options (process-first vs. embedded assist vs. orchestration) against the gaps and controls above',
      ]),
    ];
    carriesForward = [
      'Current-state gaps',
      'Readiness constraints',
      'Evidence still missing',
      'Control constraints',
      'Open questions for solution design',
    ];
  } else if (fromPhase === 3) {
    // P3 → P4 Roadmap & Business Case
    sections = [
      section('Selected approach', s.selectedApproach ? [s.selectedApproach] : []),
      section('Workstream candidates', s.workstreams?.length ? s.workstreams : gapLabels),
      section('Constraints & controls', [...controls, ...readinessConstraints]),
      section(`Recommended ${nextPhaseLabel} focus`, [
        'Sequence the workstreams, assign owners, and size the effort',
      ]),
    ];
    carriesForward = [
      'Selected solution approach',
      'Deferred options',
      'Architecture constraints',
      'Controls to preserve',
      'Value assumptions to validate',
    ];
  } else if (fromPhase === 4) {
    // P4 → P5 Approval & Mobilization
    sections = [
      section('Workstreams & owners', s.workstreams ?? []),
      section('Launch readiness', clean(s.openGateCriteria)),
      section('Risks to consider', severeGaps.map((g) => `Unaddressed: ${g}`)),
      section(`Recommended ${nextPhaseLabel} focus`, [
        'Confirm RACI, approval conditions, and change/training readiness',
      ]),
    ];
    carriesForward = [
      'Workstreams and owners',
      'Dependencies',
      'Launch readiness items',
      'Risks',
      'Tower metric candidates',
    ];
  } else {
    // P5 → Tower Track Outcomes
    sections = [
      section('Metrics to track', s.metrics ?? []),
      section('Metric owners', s.owners ?? []),
      section('Risks to consider', ['Avoid overclaiming hard savings before finance attests']),
      section(`Recommended ${nextPhaseLabel} focus`, [
        'Set baselines, metric owners, review cadence, and escalation thresholds',
      ]),
    ];
    carriesForward = [
      'Measurement contract',
      'Metric owners',
      'Review cadence',
      'Escalation thresholds',
      'Adoption tracking',
    ];
  }

  // Blank only if EVERY section is unpopulated and there are no open questions.
  const isBlank = sections.every((sec) => sec.items.length === 0) && openQuestions.length === 0;

  return {
    fromPhase,
    nextPhaseLabel,
    headline: `Prepared for ${nextPhaseLabel}`,
    carriesForward,
    sections,
    isBlank,
  };
}

import type {
  ContradictionAudience,
  ContradictionCategory,
  ContradictionDisclosureMode,
  ContradictionLegacySeverity,
  ContradictionRecord,
  ContradictionSensitivity,
  ContradictionSeverityLabel,
  DeduplicationCandidate,
  FoundationalRuleDefinition,
} from './types';

export const CATEGORY_DEFAULT_SENSITIVITY: Record<ContradictionCategory, ContradictionSensitivity> = {
  A_strategy_allocation: 'medium',
  B_commitment_pace: 'high',
  C_sponsor_behavior: 'severe',
  D_budget_priority: 'medium',
  E_external_internal_messaging: 'high',
};

export const FOUNDATIONAL_CONTRADICTION_RULES: FoundationalRuleDefinition[] = [
  {
    id: 'A-R1',
    name: 'Top-3 Priority Capital Inversion',
    category: 'A_strategy_allocation',
    description:
      'Fire when a top-3 strategic priority receives less than 20% of discretionary capital and trails a priority ranked 6+.',
    temporalWindow: 'current plan year',
    runSchedule: 'continuous',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1,
  },
  {
    id: 'A-R2',
    name: 'Stated-Priority Leadership Time Gap',
    category: 'A_strategy_allocation',
    description: 'Fire when a declared priority receives less than 5% of measurable leadership time in the trailing 90 days.',
    temporalWindow: '90 days',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.9,
  },
  {
    id: 'A-R3',
    name: 'Priority-Program Orphan',
    category: 'A_strategy_allocation',
    description: 'Fire when a top-3 strategic priority has no formal active program structure attached to it.',
    temporalWindow: 'current planning cycle',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.9,
  },
  {
    id: 'B-R1',
    name: 'Earnings-Call Commitment vs Internal Pace',
    category: 'B_commitment_pace',
    description: 'Fire when internal initiative pace cannot reach a quantified public commitment by its stated deadline.',
    temporalWindow: 'rolling 4 quarters',
    runSchedule: 'event_driven',
    applicableSectors: ['healthcare', 'financial_services', 'utilities', 'retail'],
    applicableCompanyScales: ['enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1.1,
  },
  {
    id: 'B-R2',
    name: 'Board-Declared Timeline vs Program Plan',
    category: 'B_commitment_pace',
    description: 'Fire when a board timeline slips by more than 60 days without a corresponding reforecast.',
    temporalWindow: '12 months',
    runSchedule: 'event_driven',
    applicableSectors: ['healthcare', 'financial_services', 'utilities', 'retail'],
    applicableCompanyScales: ['enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1,
  },
  {
    id: 'B-R3',
    name: 'External Promise vs KPI Trajectory',
    category: 'B_commitment_pace',
    description: 'Fire when KPI trajectory does not support a public endpoint without acceleration.',
    temporalWindow: 'rolling 2 quarters',
    runSchedule: 'event_driven',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1,
  },
  {
    id: 'C-R1',
    name: 'Declared Sponsor Steering Committee Absence',
    category: 'C_sponsor_behavior',
    description: 'Fire when a declared sponsor misses more than half of the last 6 scheduled steering meetings.',
    temporalWindow: 'last 6 steering meetings',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1.1,
  },
  {
    id: 'C-R2',
    name: 'Sponsor Calendar-Time Decline',
    category: 'C_sponsor_behavior',
    description: 'Fire when trailing 90-day sponsor time drops below 40% of the prior 90-day baseline.',
    temporalWindow: '180 days',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.95,
  },
  {
    id: 'C-R3',
    name: 'Sponsor Public Communication Absence',
    category: 'C_sponsor_behavior',
    description: 'Fire when no sponsor-signed communication exists for 120 days and no formal delegate is named.',
    temporalWindow: '120 days',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.9,
  },
  {
    id: 'D-R1',
    name: 'Top-2 Priority Budget Inversion',
    category: 'D_budget_priority',
    description: 'Fire when a top-2 priority receives less budget than a priority ranked 4+ without structural justification.',
    temporalWindow: 'current plan year',
    runSchedule: 'continuous',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1,
  },
  {
    id: 'D-R2',
    name: 'Priority-Budget Decay',
    category: 'D_budget_priority',
    description: 'Fire when a top-3 priority budget share declines more than 20% relative to the prior period with no rationale.',
    temporalWindow: '2 budget periods',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.95,
  },
  {
    id: 'D-R3',
    name: 'Emerging Priority Capital Gap',
    category: 'D_budget_priority',
    description: 'Fire when an emerging priority is declared but material capital has not shifted within 6 months.',
    temporalWindow: '6 months',
    runSchedule: 'daily',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 0.95,
  },
  {
    id: 'E-R1',
    name: 'Public Capability Claim vs Internal Maturity',
    category: 'E_external_internal_messaging',
    description: 'Fire when public capability positioning materially outpaces internally measured maturity.',
    temporalWindow: 'current quarter',
    runSchedule: 'event_driven',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1.05,
  },
  {
    id: 'E-R2',
    name: 'Public Performance Claim vs Internal KPI',
    category: 'E_external_internal_messaging',
    description: 'Fire when external performance statements diverge more than 15% from the internal KPI on the same dimension.',
    temporalWindow: 'current quarter',
    runSchedule: 'event_driven',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['upper_mid_market', 'enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1.05,
  },
  {
    id: 'E-R3',
    name: 'Public Commitment vs Internal Risk Register',
    category: 'E_external_internal_messaging',
    description: 'Fire when the internal risk register shows high-probability blockers to a public commitment without acknowledgment.',
    temporalWindow: 'current quarter',
    runSchedule: 'event_driven',
    applicableSectors: ['retail', 'healthcare', 'financial_services', 'utilities'],
    applicableCompanyScales: ['enterprise', 'regulated_enterprise'],
    confidenceMultiplier: 1.1,
  },
];

export function severityLabelFromStakes(stakesScore: number): ContradictionSeverityLabel {
  if (stakesScore >= 65) return 'material';
  if (stakesScore >= 40) return 'significant';
  return 'minor';
}

export function legacySeverityFromLabel(label: ContradictionSeverityLabel): ContradictionLegacySeverity {
  if (label === 'material') return 'high';
  if (label === 'significant') return 'medium';
  return 'low';
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function overlapRatio(left: string[], right: string[]): number {
  const a = new Set(left.map(normalizeToken).filter(Boolean));
  const b = new Set(right.map(normalizeToken).filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return overlap / Math.max(a.size, b.size);
}

export function deduplicateContradictionCandidate(
  existing: DeduplicationCandidate[],
  candidate: DeduplicationCandidate,
): { deduped: boolean; matchedIndex: number } {
  const candidateEntities = [
    ...candidate.implicatedPriorityRefs,
    ...candidate.implicatedInitiativeRefs,
    ...candidate.implicatedPersonNames,
    ...candidate.implicatedKpiIds,
    ...candidate.implicatedExternalEventIds,
  ];
  for (let index = 0; index < existing.length; index += 1) {
    const row = existing[index];
    if (row.category !== candidate.category) continue;
    if (row.temporalState !== candidate.temporalState) continue;
    const existingEntities = [
      ...row.implicatedPriorityRefs,
      ...row.implicatedInitiativeRefs,
      ...row.implicatedPersonNames,
      ...row.implicatedKpiIds,
      ...row.implicatedExternalEventIds,
    ];
    if (overlapRatio(existingEntities, candidateEntities) >= 0.7) {
      return { deduped: true, matchedIndex: index };
    }
  }
  return { deduped: false, matchedIndex: -1 };
}

export function selectWhatAmIMissing(
  contradictions: ContradictionRecord[],
  maxItems = 3,
): ContradictionRecord[] {
  const ranked = [...contradictions].sort((left, right) => {
    if (right.surfacingPriority !== left.surfacingPriority) {
      return right.surfacingPriority - left.surfacingPriority;
    }
    return right.stakesScore - left.stakesScore;
  });

  const chosen: ContradictionRecord[] = [];
  const seenCategories = new Set<ContradictionCategory>();
  for (const row of ranked) {
    if (!seenCategories.has(row.category)) {
      chosen.push(row);
      seenCategories.add(row.category);
    }
    if (chosen.length === maxItems) return chosen;
  }

  for (const row of ranked) {
    if (chosen.some((candidate) => candidate.id === row.id)) continue;
    chosen.push(row);
    if (chosen.length === maxItems) break;
  }
  return chosen;
}

export function buildStakeholderBrief(
  contradictions: ContradictionRecord[],
  stakeholderName: string,
): ContradictionRecord[] {
  const normalizedStakeholder = normalizeToken(stakeholderName);
  return contradictions
    .filter((row) => row.implicatedPersonNames.some((name) => normalizeToken(name) === normalizedStakeholder))
    .sort((left, right) => right.stakesScore - left.stakesScore);
}

export function findStrategicDiscussionContradictions(
  contradictions: ContradictionRecord[],
  conversationText: string,
): ContradictionRecord[] {
  const haystack = normalizeToken(conversationText);
  return contradictions
    .filter((row) => {
      const priorityHit = row.implicatedPriorityRefs.some((ref) => haystack.includes(normalizeToken(ref)));
      const titleHit = haystack.includes(normalizeToken(row.shortTitle));
      const contextHit = haystack.includes(normalizeToken(row.recommendedConversationContext));
      return priorityHit || titleHit || contextHit;
    })
    .sort((left, right) => right.surfacingPriority - left.surfacingPriority);
}

export function getDisclosureMode(
  contradiction: Pick<ContradictionRecord, 'sensitivity'>,
  audience: ContradictionAudience,
): ContradictionDisclosureMode {
  if (contradiction.sensitivity === 'low') return 'full';
  if (contradiction.sensitivity === 'medium') {
    return audience === 'cross_program' ? 'informed_indirection' : 'full';
  }
  if (contradiction.sensitivity === 'high') {
    if (audience === 'program_lead' || audience === 'executive_sponsor') return 'full';
    return 'informed_indirection';
  }
  if (audience === 'executive_sponsor') return 'full';
  return 'reasoning_only';
}

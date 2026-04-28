// Shell-native Intelligence surface fixture
// Backs the AppShell-native /intelligence index page.

export interface IntelligencePattern {
  id: string;
  name: string;
  tier: 'T1' | 'T2' | 'T3';
  status: 'validated' | 'emerging' | 'deprecated' | 'in-review' | 'candidate';
  lastReviewed: string;
  usedInPrograms: number;
  description: string;
}

export interface IntelligenceIndexView {
  patterns: IntelligencePattern[];
  agentQuote: string;
  agentContext: string;
  actions: Array<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

export type IntelligenceLibraryFilterKey = 'all' | 'm' | 't1' | 't3' | 'in-review' | 'candidate' | 'validated';

export interface IntelligenceLibraryFilter {
  key: IntelligenceLibraryFilterKey;
  label: string;
  href: string;
  catalogEntry: string;
}

export const INTELLIGENCE_LIBRARY_FILTERS: IntelligenceLibraryFilter[] = [
  { key: 'all', label: 'All', href: '/intelligence', catalogEntry: 'INT-IDX-DEFAULT' },
  { key: 'm', label: 'M · Meta', href: '/intelligence?filter=m', catalogEntry: 'INT-IDX-FILTERED-M' },
  { key: 't1', label: 'T1 · Craft', href: '/intelligence?filter=t1', catalogEntry: 'INT-IDX-FILTERED-T1' },
  { key: 't3', label: 'T3 · Use-case', href: '/intelligence?filter=t3', catalogEntry: 'INT-IDX-FILTERED-T3' },
  { key: 'in-review', label: 'In review', href: '/intelligence?filter=in-review', catalogEntry: 'INT-IDX-FILTERED-INREVIEW' },
  { key: 'candidate', label: 'Candidates', href: '/intelligence?filter=candidate', catalogEntry: 'INT-IDX-FILTERED-CANDIDATE' },
];

export function normalizeIntelligenceLibraryFilter(filter: string | null | undefined): IntelligenceLibraryFilterKey {
  if (filter === 'm' || filter === 't2' || filter === 'meta') return 'm';
  if (filter === 't1') return 't1';
  if (filter === 't3') return 't3';
  if (filter === 'in-review') return 'in-review';
  if (filter === 'candidate' || filter === 'candidates') return 'candidate';
  if (filter === 'validated') return 'validated';
  return 'all';
}

export function filterIntelligencePatterns(
  patterns: IntelligencePattern[],
  filter: IntelligenceLibraryFilterKey,
): IntelligencePattern[] {
  if (filter === 'all') return patterns;
  if (filter === 'm') return patterns.filter((pattern) => pattern.tier === 'T2');
  if (filter === 't1') return patterns.filter((pattern) => pattern.tier === 'T1');
  if (filter === 't3') return patterns.filter((pattern) => pattern.tier === 'T3');
  if (filter === 'in-review') return patterns.filter((pattern) => pattern.status === 'in-review');
  if (filter === 'candidate') return patterns.filter((pattern) => pattern.status === 'candidate');
  if (filter === 'validated') return patterns.filter((pattern) => pattern.status === 'validated');
  return patterns;
}

export function getIntelligenceLibraryFilterLabel(filter: IntelligenceLibraryFilterKey): string {
  if (filter === 'validated') return 'Validated';
  return INTELLIGENCE_LIBRARY_FILTERS.find((entry) => entry.key === filter)?.label ?? 'All';
}

export const INTELLIGENCE_INDEX_VIEW: IntelligenceIndexView = {
  patterns: [
    {
      id: 'T3-H01',
      name: 'Ambient AI in Retail',
      tier: 'T3',
      status: 'validated',
      lastReviewed: 'Apr 22 2026',
      usedInPrograms: 4,
      description: 'Instruments store environment passively — surfaces real-time decisions without staff queries.',
    },
    {
      id: 'T3-H02',
      name: 'Predictive Demand Sensing',
      tier: 'T3',
      status: 'validated',
      lastReviewed: 'Apr 18 2026',
      usedInPrograms: 2,
      description: 'Combines POS velocity, weather, and event signals to sharpen 7-day demand forecasts.',
    },
    {
      id: 'T2-C01',
      name: 'Customer Lifetime Value Uplift',
      tier: 'T2',
      status: 'emerging',
      lastReviewed: 'Apr 10 2026',
      usedInPrograms: 1,
      description: 'CLV modelling used to prioritize marketing spend and loyalty offer depth.',
    },
    {
      id: 'T2-C02',
      name: 'Contact Center AI Deflection',
      tier: 'T2',
      status: 'validated',
      lastReviewed: 'Apr 14 2026',
      usedInPrograms: 1,
      description: 'LLM-powered resolution of top-10 contact drivers before human escalation.',
    },
    {
      id: 'T1-F01',
      name: 'Unified Customer Identity',
      tier: 'T1',
      status: 'validated',
      lastReviewed: 'Mar 30 2026',
      usedInPrograms: 3,
      description: 'Foundation pattern: identity graph stitching across POS, loyalty, and digital channels.',
    },
    {
      id: 'T3-H03',
      name: 'Unified Loyalty Intelligence',
      tier: 'T3',
      status: 'in-review',
      lastReviewed: 'Apr 25 2026',
      usedInPrograms: 2,
      description: 'Consolidates loyalty transaction signals with CDP identity graph to personalize promotions at point-of-sale in real time.',
    },
    {
      id: 'T1-F02',
      name: 'AI Governance Baseline',
      tier: 'T1',
      status: 'candidate',
      lastReviewed: '—',
      usedInPrograms: 0,
      description: 'Foundational governance framework: model cards, bias audits, and human-in-the-loop thresholds for retail AI deployments.',
    },
    {
      id: 'T2-C03',
      name: 'Rules-Based Recommendation Engine',
      tier: 'T2',
      status: 'deprecated',
      lastReviewed: 'Jan 2026',
      usedInPrograms: 0,
      description: 'Legacy rules-based product recommendation approach. Superseded by ML-based personalization patterns.',
    },
  ],
  agentQuote: 'Eight patterns in this library — five active, one in-review, one candidate, one archived as deprecated. T3-H01 leads program citations. T3-H03 Loyalty Intelligence is in review with strong evidence coverage.',
  agentContext: 'Sentinel · Pattern Library · 8 patterns · Apr 27 2026',
  actions: [
    { letter: 'A', text: 'Show validation evidence', detail: 'Pull the evidence ledger for all validated patterns' },
    { letter: 'B', text: 'Surface emerging signals', detail: 'T2-C01 is gaining evidence — flag for promotion review' },
    { letter: 'C', text: 'Add a new pattern', detail: 'Open the pattern authoring template in Synthesis' },
  ],
};

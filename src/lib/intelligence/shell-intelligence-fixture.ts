export interface PatternItem {
  id: string;
  name: string;
  tier: 'M' | 'T1' | 'T3';
  status: 'validated' | 'in-review' | 'candidate' | 'deprecated';
  sentinelNote: string;
  usedInPrograms?: number;
  lastReviewed: string;
  featured?: boolean;
}

const patterns: PatternItem[] = [
  // Tier M — Meta, foundational frameworks
  {
    id: 'M1',
    name: 'Value Hypothesis Framework',
    tier: 'M',
    status: 'validated',
    sentinelNote: 'Anchor framework across all 4 Apex programs; no conflicts detected.',
    lastReviewed: 'Apr 22 2026',
  },
  {
    id: 'M2',
    name: 'Data Readiness Assessment',
    tier: 'M',
    status: 'validated',
    sentinelNote: 'Consistently applied at gate 0; 100% coverage across active programs.',
    lastReviewed: 'Apr 20 2026',
  },
  {
    id: 'M3',
    name: 'AI Program Governance Model',
    tier: 'M',
    status: 'in-review',
    sentinelNote: 'Two candidate submissions may duplicate sections 3–5; pending resolution.',
    lastReviewed: 'Apr 18 2026',
  },
  {
    id: 'M4',
    name: 'Stakeholder Alignment Canvas',
    tier: 'M',
    status: 'validated',
    sentinelNote: 'Used in executive alignment sessions; no revision triggers found.',
    lastReviewed: 'Apr 15 2026',
  },

  // Tier T1 — Craft, how-to
  {
    id: 'T1-H01',
    name: 'Program Charter Template',
    tier: 'T1',
    status: 'validated',
    sentinelNote: 'Standard charter used in all programs; formatting stable.',
    lastReviewed: 'Apr 21 2026',
  },
  {
    id: 'T1-H02',
    name: 'Workshop Facilitation Guide',
    tier: 'T1',
    status: 'validated',
    sentinelNote: 'Cited in 3 programs; no structural gaps observed.',
    lastReviewed: 'Apr 19 2026',
  },
  {
    id: 'T1-H03',
    name: 'Evidence Collection Playbook',
    tier: 'T1',
    status: 'in-review',
    sentinelNote: 'Overlap with M3 governance sections flagged; awaiting author review.',
    lastReviewed: 'Apr 17 2026',
  },
  {
    id: 'T1-H04',
    name: 'Gate Review Checklist',
    tier: 'T1',
    status: 'validated',
    sentinelNote: 'Covers all 5 gates; used in Contact Center AI and CDP programs.',
    lastReviewed: 'Apr 16 2026',
  },
  {
    id: 'T1-H05',
    name: 'Contradiction Resolution Protocol',
    tier: 'T1',
    status: 'validated',
    sentinelNote: 'Invoked once in Demand Forecasting review; resolution documented.',
    lastReviewed: 'Apr 14 2026',
  },

  // Tier T3 — Use-case, applied templates
  {
    id: 'T3-H01',
    name: 'Ambient AI in Retail',
    tier: 'T3',
    status: 'validated',
    sentinelNote: 'Strongest signal in library — cited in 4 active programs; ready for promotion.',
    usedInPrograms: 4,
    lastReviewed: 'Apr 22 2026',
    featured: true,
  },
  {
    id: 'T3-H02',
    name: 'CDP Activation Pattern',
    tier: 'T3',
    status: 'validated',
    sentinelNote: 'Core pattern for CDP program; evidence base is solid.',
    usedInPrograms: 1,
    lastReviewed: 'Apr 20 2026',
  },
  {
    id: 'T3-H03',
    name: 'Contact Center AI Transformation',
    tier: 'T3',
    status: 'validated',
    sentinelNote: 'Fully validated across 3 deployment cohorts; no drift.',
    usedInPrograms: 1,
    lastReviewed: 'Apr 19 2026',
  },
  {
    id: 'T3-H04',
    name: 'Demand Forecasting AI',
    tier: 'T3',
    status: 'validated',
    sentinelNote: 'SKU-level accuracy benchmarks meet threshold; validation complete.',
    usedInPrograms: 1,
    lastReviewed: 'Apr 18 2026',
  },
  {
    id: 'T3-H05',
    name: 'Store Associate Productivity AI',
    tier: 'T3',
    status: 'in-review',
    sentinelNote: 'Pilot cohort data collected; formal validation not yet opened.',
    usedInPrograms: 1,
    lastReviewed: 'Apr 15 2026',
  },
  {
    id: 'T3-H06',
    name: 'Customer Churn Prediction',
    tier: 'T3',
    status: 'in-review',
    sentinelNote: 'Feature overlap with CDP pattern noted; differentiation needed.',
    lastReviewed: 'Apr 12 2026',
  },
  {
    id: 'T3-H07',
    name: 'Markdown Revenue Optimization',
    tier: 'T3',
    status: 'candidate',
    sentinelNote: 'Submitted by Apex team; structural review not yet started.',
    lastReviewed: 'Apr 10 2026',
  },
  {
    id: 'T3-H08',
    name: 'Loyalty Platform Modernization',
    tier: 'T3',
    status: 'candidate',
    sentinelNote: 'Initial outline received; scope needs narrowing before review.',
    lastReviewed: 'Apr 8 2026',
  },
];

export const INTELLIGENCE_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote:
    'T3-H01 Ambient is the strongest signal in this library — cited in 4 active programs and ready for promotion. Two recent submissions may duplicate M3; I need your call before they enter review.',
  agentContext: 'Sentinel · Pattern Library · 17 patterns catalogued',
  actions: [
    {
      letter: 'A' as const,
      text: 'Promote T3-H01 to featured status',
      detail: 'Cited in 4 programs — validation criteria met',
    },
    {
      letter: 'B' as const,
      text: 'Review M3 + T1-H03 duplicates',
      detail: '2 candidate submissions overlap with these entries',
    },
    {
      letter: 'C' as const,
      text: 'Open T3-H05 for review',
      detail: 'Store Assoc Productivity AI needs validation',
    },
  ],
  tiers: {
    M: patterns.filter((p) => p.tier === 'M'),
    T1: patterns.filter((p) => p.tier === 'T1'),
    T3: patterns.filter((p) => p.tier === 'T3'),
  },
  allPatterns: patterns,
};

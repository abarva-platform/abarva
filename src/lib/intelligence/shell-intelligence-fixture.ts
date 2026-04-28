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
  ],
  agentQuote: '7 patterns in the library. T3-H01 leads program citations. T3-H03 Loyalty Intelligence is in review — evidence coverage is strong. T1-F02 AI Governance is a new candidate requiring initial review.',
  agentContext: 'Sentinel · Pattern Library · 5 patterns · Apr 27 2026',
  actions: [
    { letter: 'A', text: 'Show validation evidence', detail: 'Pull the evidence ledger for all validated patterns' },
    { letter: 'B', text: 'Surface emerging signals', detail: 'T2-C01 is gaining evidence — flag for promotion review' },
    { letter: 'C', text: 'Add a new pattern', detail: 'Open the pattern authoring template in Synthesis' },
  ],
};

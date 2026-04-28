// Shell-native Intelligence solutions index fixture
// Backs the /intelligence/solutions surface.
// Archetypes are curated for Apex Retail context from the canonical solution archetype registry.

export interface SolutionArchetypeCard {
  id: string;
  name: string;
  domain: string;        // e.g. "Customer Data"
  description: string;
  patterns: string[];    // pattern IDs this solution builds on
  programCount: number;  // how many programs use this archetype
  maturity: 'proven' | 'emerging' | 'experimental';
}

export interface SolutionsIndexView {
  archetypes: SolutionArchetypeCard[];
  agentQuote: string;
  agentContext: string;
  actions: Array<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

export const SOLUTIONS_INDEX_VIEW: SolutionsIndexView = {
  archetypes: [
    {
      id: 'cdp-activation',
      name: 'CDP Activation',
      domain: 'Customer Data',
      description: 'Unified identity graph stitching across POS, loyalty, and digital channels — enabling real-time personalization and audience segmentation for retail AI programs.',
      patterns: ['T1-F01', 'T3-H01'],
      programCount: 3,
      maturity: 'proven',
    },
    {
      id: 'contact-center-ai',
      name: 'Contact Center AI Transformation',
      domain: 'Customer Engagement',
      description: 'LLM-powered deflection and agent assist for top contact drivers — reducing handle time and first-contact resolution costs while maintaining CSAT under governance.',
      patterns: ['T2-C02'],
      programCount: 1,
      maturity: 'emerging',
    },
    {
      id: 'demand-forecasting',
      name: 'Demand Forecasting',
      domain: 'Supply Chain',
      description: 'Combines POS velocity, weather signals, and event calendars to generate 7-day demand forecasts. Feeds inventory replenishment and promotional planning.',
      patterns: ['T3-H02'],
      programCount: 2,
      maturity: 'proven',
    },
    {
      id: 'ai-governance',
      name: 'AI Governance Operating Model',
      domain: 'Risk & Compliance',
      description: 'Cross-program governance framework covering model cards, bias audits, human-in-the-loop thresholds, and incident log cadence. Prerequisite for regulated AI deployments.',
      patterns: ['T1-F02'],
      programCount: 0,
      maturity: 'experimental',
    },
    {
      id: 'loyalty-intelligence',
      name: 'Loyalty Intelligence',
      domain: 'Customer Loyalty',
      description: 'Merges loyalty transaction signals with CDP identity graph to surface real-time promotions at point-of-sale. Requires 30%+ loyalty penetration and near-real-time POS API integration.',
      patterns: ['T3-H03', 'T1-F01'],
      programCount: 2,
      maturity: 'emerging',
    },
  ],
  agentQuote: 'Five solution archetypes in scope for Apex Retail. CDP Activation and Demand Forecasting are proven — three and two programs respectively running against them. Loyalty Intelligence is gaining evidence fast; Contact Center AI is active. AI Governance is experimental — T1-F02 must be validated before this archetype can anchor a production program.',
  agentContext: 'Sentinel · Solution Archetypes · 5 archetypes · Apr 27 2026',
  actions: [
    { letter: 'A' as const, text: 'View CDP Activation detail', detail: 'Open the full archetype blueprint for CDP Activation' },
    { letter: 'B' as const, text: 'Check pattern coverage', detail: 'Show which patterns each archetype depends on and their validation status' },
    { letter: 'C' as const, text: 'Promote AI Governance', detail: 'Open evidence collection cycle for T1-F02 to unblock AI Governance archetype' },
  ],
};

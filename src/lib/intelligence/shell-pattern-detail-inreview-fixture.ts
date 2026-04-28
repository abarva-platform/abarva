// Shell-native Intelligence pattern detail fixture
// Backs the T3-H03 Unified Loyalty Intelligence pattern detail reading view (in-review).

export const T3_H03_PATTERN = {
  id: 'T3-H03',
  name: 'Unified Loyalty Intelligence',
  tier: 'T3' as const,
  status: 'in-review' as const,
  lastReviewed: 'Apr 25 2026',
  usedInPrograms: 2,

  // Sentinel verdict
  sentinelVerdict: {
    status: 'in-review' as const,
    confidence: 'medium' as const,
    verdictDate: 'Apr 25 2026',
    evidenceSources: 2,
    note: 'Pattern is under active review. Two programs (APX-CDP-2026 and APX-LPM-2026) have applied it with positive early signal. Evidence coverage is at 64% — promotion to Validated is expected after Q2 results.',
  },

  // Reading sections
  sections: [
    {
      heading: 'What it does',
      body: 'Unified Loyalty Intelligence merges transactional loyalty data (points, redemptions, tier status) with the CDP identity graph to enable real-time personalization at point-of-sale. When a known customer is identified at checkout — via app scan, card swipe, or biometric — the system surfaces a promotion or message tailored to their purchase history and predicted next-best-action.',
    },
    {
      heading: 'When to use',
      body: 'Use when the tenant has an established loyalty program with at least 12 months of transaction history, a CDP (or identity resolution layer) in scope, and a POS system capable of receiving API signals at checkout. Effective uplift requires at least 30% loyalty member penetration in the target store cohort.',
    },
    {
      heading: 'Authoring guidance',
      body: 'The value hypothesis must quantify the basket uplift or redemption rate improvement expected. Define the feedback loop: how will actual basket data be captured post-promotion? Sentinel will require evidence of this loop before promoting the pattern to Validated status.',
    },
    {
      heading: 'Anti-patterns',
      body: 'Do not apply this pattern to anonymous transactions — the identity resolution step is load-bearing. Do not use batch-processed loyalty scores (must be real-time or near-real-time). Avoid over-personalization that surfaces promotions on every visit — cadence control is a required design constraint.',
    },
  ],

  // Used by programs
  usedByPrograms: [
    { id: 'apx-cdp-2026', displayId: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', phase: 2, phaseLabel: 'Synthesis', href: '/programs/apx-cdp-2026' },
    { id: 'apx-lpm-2026', displayId: 'APX-LPM-2026', name: 'Loyalty Program Migration', phase: 3, phaseLabel: 'Design', href: '/programs/apx-lpm-2026' },
  ],

  // Sentinel agent voice for detail
  agentQuote: 'T3-H03 is under active review with strong early signal. Two programs are running against it with 64% evidence coverage. Promotion to Validated is expected post Q2.',
  agentContext: 'Sentinel · T3-H03 · in-review Apr 25 2026',
  actions: [
    { letter: 'A' as const, text: 'Review evidence sources', detail: 'Pull the two evidence sources for APX-CDP-2026 and APX-LPM-2026' },
    { letter: 'B' as const, text: 'Flag for Q2 promotion', detail: 'Schedule Sentinel review for after Q2 program results are captured' },
    { letter: 'C' as const, text: 'Submit authoring revision', detail: 'Propose updates to authoring guidance based on field experience' },
  ],
};

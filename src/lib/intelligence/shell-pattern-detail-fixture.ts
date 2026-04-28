// Shell-native Intelligence pattern detail fixture
// Backs the T3-H01 Ambient AI in Retail pattern detail reading view.

export const T3_H01_PATTERN = {
  id: 'T3-H01',
  name: 'Ambient AI in Retail',
  tier: 'T3' as const,
  status: 'validated' as const,
  lastReviewed: 'Apr 22 2026',
  usedInPrograms: 4,

  // Sentinel verdict
  sentinelVerdict: {
    status: 'validated' as const,
    confidence: 'high' as const,
    verdictDate: 'Apr 22 2026',
    evidenceSources: 4,
    note: 'Validated across 4 active programs with consistent positive signal. Recommended for promotion to featured status. No counter-evidence found in the evidence ledger.',
  },

  // Reading sections (the pattern content)
  sections: [
    {
      heading: 'What it does',
      body: 'Ambient AI instruments the existing store environment — POS data, foot traffic sensors, shelf cameras, and associate mobile devices — to surface real-time decisions without requiring staff to query a system. The AI operates passively until a decision threshold is crossed, then surfaces a recommendation inline in the workflow the associate is already using.',
    },
    {
      heading: 'When to use',
      body: 'Use when the target workflow is already digitized (POS, mobile device, or display terminal present), when decision frequency exceeds 50 decisions per associate per shift, and when the cost of a delayed or wrong decision exceeds the cost of inference. Do not use when workflow compliance is the primary goal — Ambient AI increases decision quality, not compliance rate.',
    },
    {
      heading: 'Authoring guidance',
      body: 'The value hypothesis must specify the decision being augmented (not replaced), the latency budget for inference, and the feedback loop for outcome capture. Failure to define the outcome capture mechanism is the single most common reason Ambient AI programs stall in Synthesis — Nexus will flag this as a gate blocker.',
    },
    {
      heading: 'Anti-patterns',
      body: 'Do not use Ambient AI as a general-purpose "AI assistant" surface. Do not route all decisions through inference — model only the decisions where human latency is the binding constraint. Do not deploy without a defined rollback path: if the model drifts, the associate must be able to revert to manual decision-making without losing their workflow state.',
    },
  ],

  // Used by programs
  usedByPrograms: [
    { id: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', phase: 'P2 Synthesis' },
    { id: 'APX-CC-2026', name: 'Contact Center AI Transformation', phase: 'P4 Build' },
    { id: 'APX-SAP-2026', name: 'Store Associate Productivity AI', phase: 'P1 Discovery' },
    { id: 'APX-LPM-2026', name: 'Loyalty Platform Modernization', phase: 'P3 Design' },
  ],

  // Programs applying this pattern
  usingPrograms: [] as Array<{ id: string; displayId: string; name: string; phase: string; context: string; href: string; }>,

  // Sentinel agent voice for detail
  agentQuote: 'T3-H01 is the strongest validated signal in this library. Four active programs cite it, all with consistent positive evidence. The anti-patterns section is the most referenced section — maestros are using it to scope out Ambient AI proposals that lack outcome capture.',
  agentContext: 'Sentinel · T3-H01 · validated Apr 22 2026',
  actions: [
    { letter: 'A' as const, text: 'Promote to featured status', detail: 'Adds ★ to index listing · signals highest confidence' },
    { letter: 'B' as const, text: 'Link to APX-CDP-2026', detail: 'Cite this pattern in the Design gate evidence for APX-CDP-2026' },
    { letter: 'C' as const, text: 'Submit revision', detail: 'Propose an update to authoring guidance based on field experience' },
  ],
};

export const SOURCE_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote: 'AMS Vendor Consolidation 2026 is at BAFO — three vendors submitted, Vendor C pricing normalizes 14% below median. Steward flagged a SOC-2 attestation gap on Vendor B that must be resolved before award. This event links to APX-CDP-2026\'s Design phase.',
  agentContext: 'Nexus · Source · commercial intelligence',
  actions: [
    { letter: 'A' as const, text: 'Review BAFO pricing normalization', detail: 'Vendor C is 14% below median — confirm before award recommendation' },
    { letter: 'B' as const, text: 'Resolve Vendor B SOC-2 gap', detail: 'Steward flag must clear before award stage' },
    { letter: 'C' as const, text: 'Brief APX-CDP-2026 team', detail: 'Vendor architecture decision affects CDP data layer scope' },
  ],
};

export const AMS_SOURCE_EVENT = {
  id: 'ams-vendor-2026',
  displayId: 'SRC-AMS-2026',
  name: 'AMS Vendor Consolidation 2026',
  description: 'Enterprise vendor consolidation for AI/ML infrastructure and managed services.',
  stages: ['Plan', 'RFI', 'Shortlist', 'RFP', 'Q&A', 'Initial-Bid', 'BAFO', 'Selection', 'Award', 'Onboard'],
  activeStage: 'BAFO',
  linkedProgramId: 'APX-CDP-2026',
  linkedProgramName: 'Apex Retail CDP Activation',
  linkedProgramPhase: 'P2 Synthesis',
  vendorCount: 3,
  riskFlag: 'Vendor B · SOC-2 attestation gap',
  lastActivity: '2h ago',
};

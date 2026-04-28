export const SOURCE_INDEX_VIEW = {
  tenant: 'Apex Retail Group',
  agentQuote: 'AMS Vendor Consolidation 2026 is at BAFO — Vendor C selected, integration contract in final review. The award unblocks the CDP data layer scope for APX-CDP-2026 P3 Design. Vendor B SOC-2 attestation remains open but is not on the award critical path.',
  agentContext: 'Sentinel · Source · commercial intelligence',
  actions: [
    { letter: 'A' as const, text: 'Review BAFO award status', detail: 'Vendor C selected — integration contract in final review' },
    { letter: 'B' as const, text: 'Open AMS sourcing event', detail: 'Stage 7 BAFO · linked to APX-CDP-2026 P3 Design' },
    { letter: 'C' as const, text: 'Resolve Vendor B SOC-2 gap', detail: 'Not blocking award — but required before onboarding' },
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
  linkedProgramPhase: 'P3 Design',
  vendorCount: 3,
  riskFlag: 'Vendor B · SOC-2 attestation gap',
  lastActivity: '2h ago',
};

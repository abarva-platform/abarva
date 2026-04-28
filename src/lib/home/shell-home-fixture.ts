export const HOME_VIEW = {
  tenant: 'Apex Retail Group',
  tenantLocked: true,
  greeting: 'Good morning, David.',
  subgreeting: 'Here\'s where Apex Retail stands today.',
  dateString: 'Monday, April 27 2026',

  // Stats row (4 cards)
  stats: [
    { label: 'Active programs', value: '6', detail: '1 in Design sprint', detailColor: 'mint' as const },
    { label: 'Open pressures', value: '2', detail: '1 high severity', detailColor: 'peach' as const },
    { label: 'Evidence coverage', value: '100%', detail: 'APX-CDP-2026 gate cleared', detailColor: 'mint' as const },
    { label: 'Pattern library', value: '17', detail: '3 new this month', detailColor: 'mint' as const },
  ],

  // Top program digest (3 programs from fixture)
  topPrograms: [
    { id: 'apx-cdp-2026', displayId: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', phase: 3, phaseLabel: 'Design', gateStatus: 'cleared' as const, href: '/programs/apx-cdp-2026' },
    { id: 'apx-cc-2026', displayId: 'APX-CC-2026', name: 'Contact Center AI', phase: 4, phaseLabel: 'Build', gateStatus: 'open' as const, href: '/programs/apx-cc-2026' },
    { id: 'apx-sap-2026', displayId: 'APX-SAP-2026', name: 'Store Associate Productivity', phase: 1, phaseLabel: 'Discovery', gateStatus: 'open' as const, href: '/programs/apx-sap-2026' },
  ],

  // Top pressure
  topPressure: {
    title: 'AI Cloud Spend',
    severity: 'high' as const,
    heroStat: '$2.4M',
    heroLabel: 'vs $1.8M budget · +33%',
    atlasSentence: 'LLM inference is the top driver — a negotiated rate card would recover $180K annually.',
    href: '/tower/pressures/twr-ai-cloud-spend',
  },

  // Source highlight
  sourceEvent: {
    id: 'src-ams-2026',
    name: 'AMS Vendor Consolidation 2026',
    stage: 'BAFO',
    stageNumber: 7,
    linkedProgram: 'APX-CDP-2026',
    href: '/source/ams-vendor-2026',
  },

  // Agent voice (Nexus as home guide)
  agentQuote: 'CDP Design gate is cleared — architecture sprint is active. Vendor C contract is in final review; that\'s the near-term critical path. AI Cloud Spend pressure needs a rate card decision. AMS BAFO award is unblocked and tied to CDP data layer.',
  agentContext: 'Nexus · Executive summary',
  actions: [
    { letter: 'A' as const, text: 'Review CDP architecture sprint', detail: 'P3 Design · Vendor C contract in final review' },
    { letter: 'B' as const, text: 'Review AI Cloud Spend', detail: 'LLM rate card — $180K/yr recovery available' },
    { letter: 'C' as const, text: 'Check AMS BAFO award status', detail: 'Unblocked · Vendor C integration contract' },
  ],
};

export const HOME_VIEW = {
  tenant: 'Apex Retail Group',
  tenantLocked: true,
  greeting: 'Good morning, David.',
  subgreeting: 'Here\'s where Apex Retail stands today.',
  dateString: 'Monday, April 27 2026',

  // Stats row (4 cards)
  stats: [
    { label: 'Active programs', value: '6', detail: '1 gate pending', detailColor: 'peach' as const },
    { label: 'Open pressures', value: '2', detail: '1 high severity', detailColor: 'peach' as const },
    { label: 'Evidence coverage', value: '36%', detail: 'APX-CDP-2026', detailColor: 'amber' as const },
    { label: 'Pattern library', value: '17', detail: '3 new this month', detailColor: 'mint' as const },
  ],

  // Top program digest (3 programs from fixture)
  topPrograms: [
    { id: 'apx-cdp-2026', displayId: 'APX-CDP-2026', name: 'Apex Retail CDP Activation', phase: 2, phaseLabel: 'Synthesis', gateStatus: 'pending' as const, href: '/programs/apx-cdp-2026' },
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
    href: '/tower',
  },

  // Source highlight
  sourceEvent: {
    id: 'src-ams-2026',
    name: 'AMS Vendor Consolidation 2026',
    stage: 'BAFO',
    stageNumber: 7,
    linkedProgram: 'APX-CDP-2026',
    href: '/source',
  },

  // Agent voice (Nexus as home guide)
  agentQuote: 'Workshop 5 is blocking the CDP Design gate — that\'s the highest-leverage action today. AI Cloud Spend needs a rate card decision by end of week. AMS BAFO and CDP are linked — a vendor architecture decision here constrains the CDP data layer.',
  agentContext: 'Nexus · Executive summary',
  actions: [
    { letter: 'A' as const, text: 'Clear Workshop 5 blocker', detail: 'Unlocks CDP Design gate (P2 → P3)' },
    { letter: 'B' as const, text: 'Review AI Cloud Spend', detail: 'Path B: LLM rate card — $180K/yr recovery' },
    { letter: 'C' as const, text: 'Check AMS BAFO status', detail: 'Stage 7 decisions constrain CDP data layer' },
  ],
};

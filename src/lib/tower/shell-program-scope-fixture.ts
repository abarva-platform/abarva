export interface KPICard {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendNote?: string;
  status: 'on-track' | 'at-risk' | 'off-track' | 'not-set';
}

export interface TrendPoint { month: string; value: number; }

export interface ConnectedPressure {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  relevance: string;
}

export const APX_CDP_SCOPE = {
  programId: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  programName: 'Apex Retail CDP Activation',
  phase: 'P3 Design',
  gateStatus: 'cleared' as const,
  evidenceCoverage: 100,

  // Atlas agent voice
  agentQuote: 'APX-CDP-2026 cleared the Design gate on Apr 27. Architecture sprint is now active. Vendor C confirmed as managed CDP layer — in-house build scope reduced ~40%. Build gate (P3→P4) readiness is the next milestone.',
  agentContext: 'Atlas · APX-CDP-2026 · program-scope view',
  actions: [
    { letter: 'A' as const, text: 'Review architecture blueprint', detail: 'Vendor C managed CDP layer — scope confirmed' },
    { letter: 'B' as const, text: 'Check vendor contract status', detail: 'AMS BAFO selected Vendor C — contract execution in progress' },
    { letter: 'C' as const, text: 'View Build gate criteria', detail: 'Next milestone: P3→P4 Build gate readiness' },
  ],

  kpis: [
    { label: 'Evidence Coverage', value: '100', unit: '%', trend: 'up', trendNote: 'Design gate cleared Apr 27', status: 'on-track' },
    { label: 'Gate Readiness', value: '5 of 5', unit: 'criteria met', trend: 'up', trendNote: 'Design gate cleared Apr 27', status: 'on-track' },
    { label: 'Budget Tracking', value: '$0 variance', trend: 'flat', trendNote: 'On budget through P3', status: 'on-track' },
    { label: 'Schedule', value: 'On track', unit: '', trend: 'up', trendNote: 'Architecture sprint active', status: 'on-track' },
  ] as KPICard[],

  evidenceTrend: [
    { month: 'Jan', value: 8 }, { month: 'Feb', value: 14 }, { month: 'Mar', value: 22 },
    { month: 'Apr-early', value: 36 }, { month: 'Apr 27', value: 100 },
  ] as TrendPoint[],

  phaseTimeline: [
    { phase: 'P0 Originate', status: 'done', completedDate: 'Jan 8 2026' },
    { phase: 'P1 Discovery', status: 'done', completedDate: 'Feb 14 2026' },
    { phase: 'P2 Synthesis', status: 'done', completedDate: 'Apr 27 2026' },
    { phase: 'P3 Design', status: 'current', startDate: 'Apr 27 2026', note: 'Architecture sprint active' },
    { phase: 'P4 Build', status: 'locked', estDuration: '10 weeks' },
    { phase: 'P5 Activate', status: 'locked', estDuration: '4 weeks' },
    { phase: 'P6 Operate', status: 'locked', estDuration: 'ongoing' },
  ],

  connectedPressures: [
    { id: 'twr-vendor-risk', title: 'Vendor Risk', severity: 'medium', relevance: 'AMS BAFO decision affects P4 data layer scope' },
    { id: 'twr-ai-cloud-spend', title: 'AI Cloud Spend', severity: 'high', relevance: 'CDP personalization layer is a top LLM inference driver — +18% spike on deployment' },
  ] as ConnectedPressure[],

  activityLog: [
    { timestamp: 'Apr 27', actor: 'Steward', event: 'Design gate (P2→P3) approved by Steward' },
    { timestamp: 'Apr 27', actor: 'Nexus', event: 'Vendor C selected as managed CDP layer via AMS BAFO' },
    { timestamp: 'Apr 27', actor: 'Atlas', event: 'Architecture sprint initiated — Build gate criteria shared' },
    { timestamp: 'Apr 21', actor: 'Nexus', event: 'Design gate evaluation started' },
    { timestamp: 'Apr 14', actor: 'Nexus', event: 'P2 Synthesis entered — 6 workshops planned' },
  ],
};

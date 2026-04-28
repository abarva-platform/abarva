export interface KPICard {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendNote?: string;
  status: 'on-track' | 'at-risk' | 'off-track' | 'tbd';
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
  phase: 'P2 Synthesis',
  gateStatus: 'pending' as const,
  evidenceCoverage: 36,

  // Atlas agent voice
  agentQuote: 'APX-CDP-2026 is on the critical path. Evidence coverage at 36% is the primary risk — the Design gate cannot clear until Workshop 5 closes. The value hypothesis is intact but unvalidated. No cost overruns yet; budget tracking is clean through P2.',
  agentContext: 'Atlas · APX-CDP-2026 · program-scope view',
  actions: [
    { letter: 'A' as const, text: 'Drill into gate blockers', detail: 'Workshop 5 + value hypothesis + privacy boundary' },
    { letter: 'B' as const, text: 'View AMS vendor timeline', detail: 'BAFO decision affects CDP data layer scope' },
    { letter: 'C' as const, text: 'Forecast P3–P5 timeline', detail: 'Atlas model: 18 weeks from gate clear to Activate' },
  ],

  kpis: [
    { label: 'Evidence Coverage', value: '36', unit: '%', trend: 'flat', trendNote: 'Unchanged 2 weeks', status: 'at-risk' },
    { label: 'Gate Readiness', value: '2 of 5', unit: 'criteria met', trend: 'flat', trendNote: 'Blocked on Workshop 5', status: 'off-track' },
    { label: 'Budget Tracking', value: '$0 variance', trend: 'flat', trendNote: 'On budget through P2', status: 'on-track' },
    { label: 'Schedule', value: '6 days', unit: 'gate overdue', trend: 'up', trendNote: 'Gate pending since Apr 21', status: 'at-risk' },
  ] as KPICard[],

  evidenceTrend: [
    { month: 'Jan', value: 8 }, { month: 'Feb', value: 14 }, { month: 'Mar', value: 22 },
    { month: 'Apr', value: 29 }, { month: 'May', value: 36 },
  ] as TrendPoint[],

  phaseTimeline: [
    { phase: 'P0 Originate', status: 'done', completedDate: 'Jan 8 2026' },
    { phase: 'P1 Discovery', status: 'done', completedDate: 'Feb 14 2026' },
    { phase: 'P2 Synthesis', status: 'current', startDate: 'Feb 14 2026', note: 'Gate pending' },
    { phase: 'P3 Design', status: 'pending', estDuration: '6 weeks' },
    { phase: 'P4 Build', status: 'locked', estDuration: '10 weeks' },
    { phase: 'P5 Activate', status: 'locked', estDuration: '4 weeks' },
    { phase: 'P6 Operate', status: 'locked', estDuration: 'ongoing' },
  ],

  connectedPressures: [
    { id: 'twr-vendor-risk', title: 'Vendor Risk', severity: 'medium', relevance: 'AMS BAFO decision affects P4 data layer scope' },
  ] as ConnectedPressure[],

  activityLog: [
    { timestamp: '2h ago', actor: 'Nexus', event: 'Workshop 5 deadline reminder sent to sponsor' },
    { timestamp: '1d ago', actor: 'Steward', event: 'Privacy boundary confirmation request logged' },
    { timestamp: '3d ago', actor: 'Sentinel', event: 'Value hypothesis evidence flagged as incomplete' },
    { timestamp: 'Apr 21', actor: 'Nexus', event: 'Design gate evaluation started' },
    { timestamp: 'Apr 14', actor: 'Nexus', event: 'P2 Synthesis entered — 6 workshops planned' },
  ],
};

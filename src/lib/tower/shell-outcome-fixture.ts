export interface OutcomeMetric {
  label: string;
  projected: string;
  actual: string;
  delta: string;
  deltaDir: 'good' | 'neutral' | 'miss';
  phase: number;
}

export interface ProgramOutcome {
  id: string;
  displayId: string;
  name: string;
  phase: number;
  phaseLabel: string;
  launchDate: string;
  status: 'tracking' | 'projected' | 'at-risk';
  metrics: OutcomeMetric[];
  atlasNote: string;
  href: string;
}

export const OUTCOME_FIXTURE: ProgramOutcome[] = [
  {
    id: 'apx-dfv2-2025',
    displayId: 'APX-DFV2-2025',
    name: 'Demand Forecasting v2',
    phase: 6,
    phaseLabel: 'Operate',
    launchDate: 'Nov 2025',
    status: 'tracking',
    metrics: [
      { label: 'Forecast accuracy', projected: '82%', actual: '87%', delta: '+5pp', deltaDir: 'good', phase: 6 },
      { label: 'Inventory waste reduction', projected: '$1.2M/yr', actual: '$1.4M/yr', delta: '+$200K', deltaDir: 'good', phase: 6 },
      { label: 'Planner hours saved', projected: '120 hrs/mo', actual: '114 hrs/mo', delta: '–6 hrs', deltaDir: 'neutral', phase: 6 },
      { label: 'System uptime', projected: '99.5%', actual: '99.8%', delta: '+0.3pp', deltaDir: 'good', phase: 6 },
    ],
    atlasNote: 'Demand Forecasting v2 is outperforming on accuracy and savings — inventory waste reduction is 17% ahead of projection.',
    href: '/programs/apx-dfv2-2025',
  },
  {
    id: 'apx-cc-2026',
    displayId: 'APX-CC-2026',
    name: 'Contact Center AI',
    phase: 4,
    phaseLabel: 'Build',
    launchDate: 'Q3 2026 projected',
    status: 'projected',
    metrics: [
      { label: 'Handle time reduction', projected: '–22%', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 4 },
      { label: 'CSAT improvement', projected: '+8 pts', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 4 },
      { label: 'Agent capacity freed', projected: '40 FTE-equiv', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 4 },
      { label: 'Churn reduction', projected: '–1.5pp', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 4 },
    ],
    atlasNote: 'Contact Center AI is on track. NLP classifier hit 94% accuracy in Build — outlook is strong for projected handle time gains.',
    href: '/programs/apx-cc-2026',
  },
];

export const OUTCOME_AGENT_VOICE = {
  quote: 'Demand Forecasting v2 is outperforming projections — inventory waste reduction is $200K ahead. Contact Center AI pre-launch projections remain strong. Combined projected value: $3.4M annually.',
  agentContext: 'Atlas · Value Lens · outcome realization',
  actions: [
    { letter: 'A' as const, text: 'Review DFv2 steady-state metrics', detail: 'Full 12-month actuals vs baseline available' },
    { letter: 'B' as const, text: 'Update CC-AI outcome model', detail: 'NLP accuracy gain may lift handle time projection' },
    { letter: 'C' as const, text: 'Brief CFO on value realization', detail: '$1.4M DFv2 savings is audit-ready' },
  ],
};

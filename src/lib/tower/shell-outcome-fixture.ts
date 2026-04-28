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
    id: 'apx-cdp-2026',
    displayId: 'APX-CDP-2026',
    name: 'CDP Activation',
    phase: 3,
    phaseLabel: 'Design',
    launchDate: 'Q1 2027 projected',
    status: 'projected',
    metrics: [
      { label: 'Personalization revenue lift', projected: '+$3.2M/yr', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 3 },
      { label: 'Email marketing ROI', projected: '+18%', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 3 },
      { label: 'Customer lifetime value', projected: '+$42/customer', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 3 },
      { label: 'Data platform cost reduction', projected: '–$280K/yr', actual: '—', delta: 'Projected', deltaDir: 'neutral', phase: 3 },
    ],
    atlasNote: 'CDP projections are based on P3 Design business case. Actuals available post-Q1 2027 launch. Build gate approval is the near-term critical path.',
    href: '/programs/apx-cdp-2026',
  },
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
  quote: 'Demand Forecasting v2 is outperforming — inventory waste $200K ahead of projection. CDP Activation projects $3.2M/yr revenue lift post-launch. Combined portfolio value target: $6.8M annually.',
  agentContext: 'Atlas · Value Lens · outcome realization',
  actions: [
    { letter: 'A' as const, text: 'Review DFv2 steady-state metrics', detail: 'Full 12-month actuals vs baseline — audit-ready' },
    { letter: 'B' as const, text: 'Validate CDP business case', detail: '$3.2M/yr projection — confirm model assumptions for Build gate' },
    { letter: 'C' as const, text: 'Update CC-AI outcome model', detail: 'NLP accuracy gain may lift handle time projection' },
  ],
};

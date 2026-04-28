export interface Phase {
  id: string;
  label: string;
  position: number; // 0-5
  marketingMessage: string;
}

export const PHASES: readonly Phase[] = [
  {
    id: 'discovery',
    label: 'Discovery',
    position: 0,
    marketingMessage:
      "Tenant context loaded. Atlas reads everything you've already documented.",
  },
  {
    id: 'synthesis',
    label: 'Synthesis',
    position: 1,
    marketingMessage:
      'Atlas synthesizes 60 patterns and 30 signals into a 150-word answer with citations.',
  },
  {
    id: 'design',
    label: 'Design',
    position: 2,
    marketingMessage:
      'Architecture artifacts surface as patterns apply. The corpus IS the design library.',
  },
  {
    id: 'build',
    label: 'Build',
    position: 3,
    marketingMessage:
      'Six waves shipping. Two active. Sentinel validates every PR before merge.',
  },
  {
    id: 'activate',
    label: 'Activate',
    position: 4,
    marketingMessage:
      'Sponsor sign-off. Activation gate. Atlas surfaces the contradictions you should resolve first.',
  },
  {
    id: 'operate',
    label: 'Operate',
    position: 5,
    marketingMessage:
      'Drift signals flag attribution gaps. KPI panel updates in real time. The corpus learns.',
  },
];

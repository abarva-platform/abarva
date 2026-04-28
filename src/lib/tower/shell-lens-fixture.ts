// ─── Adoption Lens ────────────────────────────────────────────────────────────

export interface AdoptionMetric {
  program: string;
  displayId: string;
  phase: number;
  phaseLabel: string;
  adoptionRate: string;  // e.g. "68%"
  activeUsers: string;
  targetUsers: string;
  trainingComplete: boolean;
  lastActivity: string;
}

export const ADOPTION_METRICS: AdoptionMetric[] = [
  { program: 'Contact Center AI', displayId: 'APX-CC-2026', phase: 4, phaseLabel: 'Build', adoptionRate: '—', activeUsers: '0', targetUsers: '200 agents', trainingComplete: false, lastActivity: 'Pre-launch' },
  { program: 'Demand Forecasting v2', displayId: 'APX-DFV2-2025', phase: 6, phaseLabel: 'Operate', adoptionRate: '94%', activeUsers: '47', targetUsers: '50 planners', trainingComplete: true, lastActivity: 'Today' },
  { program: 'Store Associate Productivity', displayId: 'APX-SAP-2026', phase: 1, phaseLabel: 'Discovery', adoptionRate: '—', activeUsers: '0', targetUsers: 'TBD', trainingComplete: false, lastActivity: 'Pre-design' },
];

export const ADOPTION_AGENT_VOICE = {
  quote: 'Only Demand Forecasting v2 has live adoption data — 47 of 50 planners active (94%). Contact Center AI is pre-launch. Store Associate Productivity is still in Discovery — adoption targets not yet set.',
  agentContext: 'Atlas · Adoption Lens',
  actions: [
    { letter: 'A' as const, text: 'Finalize CC-AI adoption plan', detail: 'Target: 200 agents in Phase 1 rollout (Week 1 of Activate)' },
    { letter: 'B' as const, text: 'Review DFv2 lagging 3 planners', detail: '47 of 50 active — identify and re-engage 3 non-users' },
    { letter: 'C' as const, text: 'Set SAP adoption baseline', detail: 'Requires user research output from P1 Discovery' },
  ],
};

// ─── Risk Lens ────────────────────────────────────────────────────────────────

export interface RiskItem {
  id: string;
  title: string;
  program: string;
  displayId: string;
  riskType: 'execution' | 'vendor' | 'privacy' | 'model' | 'budget';
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'mitigated' | 'watching';
  description: string;
  mitigation: string;
  owner: string;
}

export const RISK_ITEMS: RiskItem[] = [
  { id: 'r1', title: 'CDP privacy boundary unconfirmed', program: 'Apex Retail CDP Activation', displayId: 'APX-CDP-2026', riskType: 'privacy', severity: 'high', status: 'open', description: 'Privacy boundary between CDP and loyalty data has not been formally confirmed. This is a gate blocker for P2 → P3.', mitigation: 'Complete Workshop 5 privacy boundary exercise — assign to David Chen by Apr 30', owner: 'David Chen' },
  { id: 'r2', title: 'Vendor B SOC-2 report pending', program: 'AMS Vendor Consolidation 2026', displayId: 'AMS-2026', riskType: 'vendor', severity: 'medium', status: 'open', description: 'Vendor B has not submitted SOC-2 Type II report. BAFO evaluation cannot be fully completed without it.', mitigation: 'Escalate to Vendor B procurement contact — deadline Apr 30', owner: 'Priya Sharma' },
  { id: 'r3', title: 'AI Cloud Spend over budget', program: 'Multiple programs', displayId: 'Cross-program', riskType: 'budget', severity: 'high', status: 'open', description: 'LLM inference spend at $2.4M vs $1.8M budget (+33%). Rate card negotiation is the highest-leverage action.', mitigation: 'Negotiate LLM provider rate card — estimated $180K/yr recovery', owner: 'David Chen' },
  { id: 'r4', title: 'IVR migration dependency risk', program: 'Contact Center AI', displayId: 'APX-CC-2026', riskType: 'execution', severity: 'medium', status: 'watching', description: 'IVR migration is on the critical path for Build gate. 3 sprints remaining — no buffer.', mitigation: 'Weekly sprint review tracking. Escalate if slips.', owner: 'Marcus Webb' },
];

export const RISK_AGENT_VOICE = {
  quote: '4 open risk items — 2 high, 2 medium. CDP privacy boundary and AI Cloud Spend are the most urgent. The privacy boundary issue directly blocks the CDP Design gate.',
  agentContext: 'Atlas · Risk Lens',
  actions: [
    { letter: 'A' as const, text: 'Resolve CDP privacy boundary', detail: 'High severity · blocks P2 → P3 gate · due Apr 30' },
    { letter: 'B' as const, text: 'Negotiate LLM rate card', detail: 'High severity · $180K/yr recovery potential' },
    { letter: 'C' as const, text: 'Chase Vendor B SOC-2', detail: 'Medium · BAFO evaluation blocked' },
  ],
};

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
  { id: 'r1', title: 'CDP privacy boundary confirmed', program: 'Apex Retail CDP Activation', displayId: 'APX-CDP-2026', riskType: 'privacy', severity: 'high', status: 'mitigated', description: 'Privacy boundary between CDP and loyalty data was formally confirmed as part of the Design gate approval on Apr 27. Gate blocker cleared.', mitigation: 'Privacy boundary exercise completed — Design gate (P2→P3) approved Apr 27', owner: 'David Chen' },
  { id: 'r2', title: 'Vendor B SOC-2 report pending', program: 'AMS Vendor Consolidation 2026', displayId: 'AMS-2026', riskType: 'vendor', severity: 'medium', status: 'open', description: 'Vendor B has not submitted SOC-2 Type II report. BAFO evaluation cannot be fully completed without it.', mitigation: 'Escalate to Vendor B procurement contact — deadline Apr 30', owner: 'Priya Sharma' },
  { id: 'r3', title: 'AI Cloud Spend over budget', program: 'Multiple programs', displayId: 'Cross-program', riskType: 'budget', severity: 'high', status: 'open', description: 'LLM inference spend at $2.4M vs $1.8M budget (+33%). Rate card negotiation is the highest-leverage action.', mitigation: 'Negotiate LLM provider rate card — estimated $180K/yr recovery', owner: 'David Chen' },
  { id: 'r4', title: 'IVR migration dependency risk', program: 'Contact Center AI', displayId: 'APX-CC-2026', riskType: 'execution', severity: 'medium', status: 'watching', description: 'IVR migration is on the critical path for Build gate. 3 sprints remaining — no buffer.', mitigation: 'Weekly sprint review tracking. Escalate if slips.', owner: 'Marcus Webb' },
];

export const RISK_AGENT_VOICE = {
  quote: '3 open risk items — 1 high, 2 medium. AI Cloud Spend is the most urgent. CDP privacy boundary resolved with Design gate approval on Apr 27.',
  agentContext: 'Atlas · Risk Lens',
  actions: [
    { letter: 'A' as const, text: 'Negotiate LLM rate card', detail: 'High severity · $180K/yr recovery potential' },
    { letter: 'B' as const, text: 'Chase Vendor B SOC-2', detail: 'Medium · BAFO evaluation blocked' },
    { letter: 'C' as const, text: 'Review IVR migration sprint status', detail: 'Medium · APX-CC-2026 critical path · no buffer' },
  ],
};

// ─── Cost Lens ────────────────────────────────────────────────────────────────

export interface CostItem {
  id: string;
  program: string;
  vendor: string;
  programType: string;
  annualSpend: number;
  spendVariancePct: number;     // +/- vs plan; positive = over budget
  pctOfAiBudget: number;        // 0–1
  effectivePerUserCostMo: number | null; // USD/user/month; null if no active users
  topDept: string;
  deptAllocation: ReadonlyArray<{ dept: string; pct: number }>;
  trajectory: 'up' | 'flat' | 'down';
  renewalInDays: number | null;
}

export const COST_ITEMS: readonly CostItem[] = [
  {
    id: 'cost-m365',
    program: 'M365 Copilot',
    vendor: 'Microsoft',
    programType: 'Productivity agent',
    annualSpend: 5_000_000,
    spendVariancePct: 0,
    pctOfAiBudget: 0.432,
    effectivePerUserCostMo: Math.round(5_000_000 / 2976 / 12),
    topDept: 'Enterprise-wide',
    deptAllocation: [
      { dept: 'Engineering', pct: 0.31 },
      { dept: 'Finance', pct: 0.14 },
      { dept: 'Legal', pct: 0.12 },
      { dept: 'Operations', pct: 0.24 },
      { dept: 'Other', pct: 0.19 },
    ],
    trajectory: 'flat',
    renewalInDays: 47,
  },
  {
    id: 'cost-claude',
    program: 'Claude Code',
    vendor: 'Anthropic',
    programType: 'Coding agent',
    annualSpend: 400_000,
    spendVariancePct: -0.05,
    pctOfAiBudget: 0.035,
    effectivePerUserCostMo: Math.round(400_000 / 176 / 12),
    topDept: 'Engineering',
    deptAllocation: [
      { dept: 'Engineering', pct: 0.92 },
      { dept: 'Platform', pct: 0.08 },
    ],
    trajectory: 'up',
    renewalInDays: 214,
  },
  {
    id: 'cost-now',
    program: 'ServiceNow Now Assist',
    vendor: 'ServiceNow',
    programType: 'Service desk AI',
    annualSpend: 2_800_000,
    spendVariancePct: 0.12,
    pctOfAiBudget: 0.242,
    effectivePerUserCostMo: null,
    topDept: 'IT Operations',
    deptAllocation: [
      { dept: 'IT Operations', pct: 0.78 },
      { dept: 'HR', pct: 0.22 },
    ],
    trajectory: 'flat',
    renewalInDays: 112,
  },
  {
    id: 'cost-joule',
    program: 'SAP Joule',
    vendor: 'SAP',
    programType: 'ERP agent',
    annualSpend: 1_500_000,
    spendVariancePct: 0.03,
    pctOfAiBudget: 0.130,
    effectivePerUserCostMo: null,
    topDept: 'Finance',
    deptAllocation: [
      { dept: 'Finance', pct: 0.55 },
      { dept: 'Procurement', pct: 0.28 },
      { dept: 'Supply Chain', pct: 0.17 },
    ],
    trajectory: 'flat',
    renewalInDays: 548,
  },
  {
    id: 'cost-fow',
    program: 'AI Fluency Program',
    vendor: 'Internal',
    programType: 'Future-of-work',
    annualSpend: 2_000_000,
    spendVariancePct: 0.08,
    pctOfAiBudget: 0.173,
    effectivePerUserCostMo: Math.round(2_000_000 / 3040 / 12),
    topDept: 'All departments',
    deptAllocation: [
      { dept: 'Engineering', pct: 0.22 },
      { dept: 'Operations', pct: 0.28 },
      { dept: 'Finance', pct: 0.18 },
      { dept: 'HR', pct: 0.16 },
      { dept: 'Other', pct: 0.16 },
    ],
    trajectory: 'up',
    renewalInDays: null,
  },
];

export const COST_AGENT_VOICE = {
  quote: 'Total AI spend $11.7M annualized. Microsoft concentration risk: 43.2% of budget across M365 Copilot. Claude Code is the highest ROI at $140/user/mo effective — expand before Microsoft renewal (47 days). Now Assist is 12% over plan with no active-user denominator to absorb cost.',
  agentContext: 'Nexus · Cost Lens',
  actions: [
    { letter: 'A' as const, text: 'Prepare Microsoft renewal brief', detail: '47 days · $5M at stake · Copilot + M365 bundle leverage' },
    { letter: 'B' as const, text: 'Review Now Assist cost overrun', detail: '+12% vs plan · $336K annualized variance · no user base to dilute' },
    { letter: 'C' as const, text: 'Model Claude Code expansion ROI', detail: '280 → 350 seats · $57K incremental spend · $570K projected lift' },
  ],
};

// Tower Wave T1 · AI Program Portfolio Fixture
//
// Vendor-anchored AI program inventory for the AI Control Tower.
// Distinct from ai-portfolio-inventory.ts (generic use-case inventory).
// This models vendor rollouts — Copilot, Claude Code, Now Assist, etc. —
// with value models, adoption metrics, and typed pressures per §6 of
// TOWER_DESIGN_SPEC.md.
//
// Deterministic seed-only. No live integrations, no model calls,
// no timestamp-dependent values, no randomness.

// ---------------------------------------------------------------------------
// Program types (T-CODE / T-PROD / T-SVC / T-ERP / T-OPS / T-CUST / T-FOW)
// ---------------------------------------------------------------------------

export const AI_PROGRAM_TYPES = [
  'T-CODE',
  'T-PROD',
  'T-SVC',
  'T-ERP',
  'T-OPS',
  'T-CUST',
  'T-FOW',
] as const;

export type AiProgramType = (typeof AI_PROGRAM_TYPES)[number];

export const AI_PROGRAM_TYPE_LABELS: Record<AiProgramType, string> = {
  'T-CODE': 'Coding agent',
  'T-PROD': 'Productivity agent',
  'T-SVC': 'Service desk AI',
  'T-ERP': 'ERP agent',
  'T-OPS': 'Operations AI',
  'T-CUST': 'Custom internal AI',
  'T-FOW': 'Future-of-work',
};

// ---------------------------------------------------------------------------
// Attribution confidence (per §6 value model framework)
// ---------------------------------------------------------------------------

export type AttributionConfidence = 'high' | 'medium' | 'low';

export const CONFIDENCE_HAIRCUT: Record<AttributionConfidence, number> = {
  high: 1.0,    // experimental / A-B test
  medium: 0.6,  // cohort-match
  low: 0.3,     // survey / self-report
};

// ---------------------------------------------------------------------------
// Pressure types (§7 of TOWER_DESIGN_SPEC.md)
// ---------------------------------------------------------------------------

export const PRESSURE_TYPES = [
  'P-COST',
  'P-ADOPT',
  'P-VALUE',
  'P-DUPL',
  'P-RISK',
  'P-VEND',
  'P-TLNT',
  'P-SUB',
] as const;

export type PressureType = (typeof PRESSURE_TYPES)[number];

export const PRESSURE_TYPE_LABELS: Record<PressureType, string> = {
  'P-COST':  'Cost overrun',
  'P-ADOPT': 'Adoption gap (shelfware)',
  'P-VALUE': 'Value not materializing',
  'P-DUPL':  'Tool duplication',
  'P-RISK':  'Compliance / security risk',
  'P-VEND':  'Vendor concentration / lock-in',
  'P-TLNT':  'Talent / change fatigue',
  'P-SUB':   'Shadow substitution',
};

// ---------------------------------------------------------------------------
// Decision types
// ---------------------------------------------------------------------------

export const DECISION_TYPES = [
  'kill',
  'scale',
  'consolidate',
  'renegotiate',
  'pivot',
  'defer',
  'pilot-extend',
] as const;

export type DecisionType = (typeof DECISION_TYPES)[number];

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface ProgramPressure {
  readonly id: string;
  readonly type: PressureType;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly dollarImpact: number;    // annualized $ impact
  readonly daysOpen: number;
  readonly summary: string;
}

export interface AiProgram {
  readonly id: string;
  readonly name: string;
  readonly vendor: string;
  readonly programType: AiProgramType;
  readonly owner: string;
  readonly lifecyclePhase: 'pilot' | 'rollout' | 'steady-state' | 'at-risk';

  // Spend
  readonly annualSpend: number;           // USD

  // Value model output
  readonly valueCaptures: number;         // USD trailing 12mo, attributed
  readonly attributionConfidence: AttributionConfidence;
  readonly attributionMethod: string;

  // Derived
  readonly roi: number;                   // (valueCaptures - annualSpend) / annualSpend
  readonly riskAdjustedRoi: number;       // roi × CONFIDENCE_HAIRCUT[confidence]

  // Adoption
  readonly eligibleUsers: number;
  readonly activeUsers: number;
  readonly adoptionPct: number;           // activeUsers / eligibleUsers

  // Pressures
  readonly pressures: readonly ProgramPressure[];

  // Provenance
  readonly createdFrom: 'deterministic_ai_program_seed';
}

// ---------------------------------------------------------------------------
// Portfolio-level types
// ---------------------------------------------------------------------------

export interface AiPortfolioKpis {
  readonly totalAnnualSpend: number;
  readonly totalValueCaptured: number;
  readonly portfolioRoi: number;
  readonly activePressuresCount: number;
  readonly decisionsPendingCount: number;
}

export interface AiProgramPortfolioView {
  readonly kpis: AiPortfolioKpis;
  readonly programs: readonly AiProgram[];
  readonly agentQuote: string;
  readonly agentContext: string;
  readonly actions: ReadonlyArray<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

// ---------------------------------------------------------------------------
// Decision log types
// ---------------------------------------------------------------------------

export interface PortfolioDecision {
  readonly id: string;
  readonly title: string;
  readonly type: DecisionType;
  readonly date: string;
  readonly decidedBy: string;
  readonly programId: string;
  readonly dollarImpact: number;
  readonly status: 'active' | 'superseded' | 'reversed';
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Seed data · 5 programs anchored to real AI vendors
// ---------------------------------------------------------------------------

const SEED_PROGRAMS: readonly AiProgram[] = [
  // -------------------------------------------------------------------------
  // M365 Copilot · T-PROD · underperforming (ROI < 1x)
  // -------------------------------------------------------------------------
  {
    id: 'twr-prog-m365-copilot',
    name: 'M365 Copilot',
    vendor: 'Microsoft',
    programType: 'T-PROD',
    owner: 'Chief Information Officer',
    lifecyclePhase: 'rollout',
    annualSpend: 5_000_000,
    valueCaptures: 3_600_000,
    attributionConfidence: 'low',
    attributionMethod: 'survey + usage log (0.4 haircut applied)',
    roi: (3_600_000 - 5_000_000) / 5_000_000,        // -0.28x
    riskAdjustedRoi: ((3_600_000 - 5_000_000) / 5_000_000) * CONFIDENCE_HAIRCUT.low,
    eligibleUsers: 12_400,
    activeUsers: 2_976,
    adoptionPct: 0.24,
    pressures: [
      {
        id: 'p-copilot-adopt',
        type: 'P-ADOPT',
        severity: 'high',
        dollarImpact: 1_600_000,
        daysOpen: 47,
        summary: '76% of licensed seats inactive — $1.6M annualized shelfware at current adoption trajectory.',
      },
      {
        id: 'p-copilot-dupl',
        type: 'P-DUPL',
        severity: 'medium',
        dollarImpact: 800_000,
        daysOpen: 31,
        summary: 'Summarization use cases overlap 60% with Now Assist; duplicate spend ~$800K/yr.',
      },
    ],
    createdFrom: 'deterministic_ai_program_seed',
  },

  // -------------------------------------------------------------------------
  // Claude Code · T-CODE · top performer (ROI 9.6x)
  // -------------------------------------------------------------------------
  {
    id: 'twr-prog-claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    programType: 'T-CODE',
    owner: 'VP Engineering',
    lifecyclePhase: 'steady-state',
    annualSpend: 400_000,
    valueCaptures: 4_030_000,
    attributionConfidence: 'medium',
    attributionMethod: 'cohort-matched DORA baseline (pre/post 90-day)',
    roi: (4_030_000 - 400_000) / 400_000,             // 9.08x
    riskAdjustedRoi: ((4_030_000 - 400_000) / 400_000) * CONFIDENCE_HAIRCUT.medium,
    eligibleUsers: 200,
    activeUsers: 176,
    adoptionPct: 0.88,
    pressures: [
      {
        id: 'p-claude-vend',
        type: 'P-VEND',
        severity: 'low',
        dollarImpact: 0,
        daysOpen: 8,
        summary: 'Current enterprise commitment covers 280 seats; expansion to 350 requires renegotiation.',
      },
    ],
    createdFrom: 'deterministic_ai_program_seed',
  },

  // -------------------------------------------------------------------------
  // ServiceNow Now Assist · T-SVC · significantly under-delivering
  // -------------------------------------------------------------------------
  {
    id: 'twr-prog-now-assist',
    name: 'ServiceNow Now Assist',
    vendor: 'ServiceNow',
    programType: 'T-SVC',
    owner: 'VP IT Operations',
    lifecyclePhase: 'at-risk',
    annualSpend: 2_800_000,
    valueCaptures: 1_116_000,
    attributionConfidence: 'high',
    attributionMethod: 'ticket log deflection rate (objective)',
    roi: (1_116_000 - 2_800_000) / 2_800_000,         // -0.60x
    riskAdjustedRoi: ((1_116_000 - 2_800_000) / 2_800_000) * CONFIDENCE_HAIRCUT.high,
    eligibleUsers: 0,
    activeUsers: 0,
    adoptionPct: 0,
    pressures: [
      {
        id: 'p-now-value',
        type: 'P-VALUE',
        severity: 'critical',
        dollarImpact: 1_684_000,
        daysOpen: 62,
        summary: 'Deflection rate 28% vs 40% promised — $1.7M annual shortfall. KB integration at 60% completeness is capping ceiling.',
      },
      {
        id: 'p-now-dupl',
        type: 'P-DUPL',
        severity: 'medium',
        dollarImpact: 600_000,
        daysOpen: 31,
        summary: '30% of current usage duplicates M365 Copilot FAQ summarization — ~$600K/yr overlap.',
      },
    ],
    createdFrom: 'deterministic_ai_program_seed',
  },

  // -------------------------------------------------------------------------
  // SAP Joule · T-ERP · strategic, medium confidence
  // -------------------------------------------------------------------------
  {
    id: 'twr-prog-sap-joule',
    name: 'SAP Joule',
    vendor: 'SAP',
    programType: 'T-ERP',
    owner: 'Chief Financial Officer',
    lifecyclePhase: 'rollout',
    annualSpend: 1_500_000,
    valueCaptures: 1_350_000,
    attributionConfidence: 'medium',
    attributionMethod: 'cohort-match (integration depth = strong)',
    roi: (1_350_000 - 1_500_000) / 1_500_000,         // -0.10x
    riskAdjustedRoi: ((1_350_000 - 1_500_000) / 1_500_000) * CONFIDENCE_HAIRCUT.medium,
    eligibleUsers: 0,
    activeUsers: 0,
    adoptionPct: 0,
    pressures: [
      {
        id: 'p-joule-vend',
        type: 'P-VEND',
        severity: 'medium',
        dollarImpact: 0,
        daysOpen: 14,
        summary: 'Tied to SAP S/4HANA core — switching cost extreme. Renewal 18 months out; no near-term decision needed.',
      },
    ],
    createdFrom: 'deterministic_ai_program_seed',
  },

  // -------------------------------------------------------------------------
  // Future-of-Work Program · T-FOW · strategic bet, low confidence
  // -------------------------------------------------------------------------
  {
    id: 'twr-prog-fow',
    name: 'AI Fluency Program',
    vendor: 'Internal',
    programType: 'T-FOW',
    owner: 'Chief People Officer',
    lifecyclePhase: 'pilot',
    annualSpend: 2_000_000,
    valueCaptures: 600_000,
    attributionConfidence: 'low',
    attributionMethod: 'composite leading indicators (skills coverage, training completion)',
    roi: (600_000 - 2_000_000) / 2_000_000,            // -0.70x (leading indicators only)
    riskAdjustedRoi: ((600_000 - 2_000_000) / 2_000_000) * CONFIDENCE_HAIRCUT.low,
    eligibleUsers: 8_000,
    activeUsers: 3_040,
    adoptionPct: 0.38,
    pressures: [
      {
        id: 'p-fow-tlnt',
        type: 'P-TLNT',
        severity: 'medium',
        dollarImpact: 0,
        daysOpen: 21,
        summary: 'Skills coverage 38% vs 60% target. Lagging indicators (retention, productivity) won\'t be readable for 6–9 months.',
      },
    ],
    createdFrom: 'deterministic_ai_program_seed',
  },
];

// ---------------------------------------------------------------------------
// Decision log seed
// ---------------------------------------------------------------------------

const SEED_DECISIONS: readonly PortfolioDecision[] = [
  {
    id: 'dec-001',
    title: 'Extend Claude Code pilot to 200 engineers',
    type: 'scale',
    date: '2026-03-12',
    decidedBy: 'VP Engineering',
    programId: 'twr-prog-claude-code',
    dollarImpact: 400_000,
    status: 'active',
    summary: 'Pilot cohort showed 38% PR throughput lift with cohort-matched baseline. Expanded to full engineering org.',
  },
  {
    id: 'dec-002',
    title: 'Defer Now Assist scope reduction pending KB completion',
    type: 'defer',
    date: '2026-02-28',
    decidedBy: 'VP IT Operations',
    programId: 'twr-prog-now-assist',
    dollarImpact: -200_000,
    status: 'active',
    summary: 'KB integration at 60% — completing integration before descoping. Revisit at Q3 renewal if deflection hasn\'t hit 38%.',
  },
  {
    id: 'dec-003',
    title: 'Launch M365 Finance adoption sprint',
    type: 'pilot-extend',
    date: '2026-04-01',
    decidedBy: 'Chief Information Officer',
    programId: 'twr-prog-m365-copilot',
    dollarImpact: 1_100_000,
    status: 'active',
    summary: 'Finance adoption at 14% vs org-wide 24%. 90-day sprint to lift Finance to 50% — projected to add $1.1M value.',
  },
];

// ---------------------------------------------------------------------------
// Portfolio KPI aggregation
// ---------------------------------------------------------------------------

function computeKpis(programs: readonly AiProgram[]): AiPortfolioKpis {
  const totalAnnualSpend = programs.reduce((s, p) => s + p.annualSpend, 0);
  const totalValueCaptured = programs.reduce((s, p) => s + p.valueCaptures, 0);
  const portfolioRoi = totalAnnualSpend > 0
    ? (totalValueCaptured - totalAnnualSpend) / totalAnnualSpend
    : 0;
  const activePressuresCount = programs.reduce((s, p) => s + p.pressures.length, 0);
  return {
    totalAnnualSpend,
    totalValueCaptured,
    portfolioRoi,
    activePressuresCount,
    decisionsPendingCount: SEED_DECISIONS.length,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildAiProgramPortfolioView(): AiProgramPortfolioView {
  const kpis = computeKpis(SEED_PROGRAMS);

  return {
    kpis,
    programs: SEED_PROGRAMS,
    agentQuote:
      'Portfolio at $11.7M annualized · value captured $10.7M trailing 12-mo · ROI −0.09x. Three pressures above $1M: M365 Copilot adoption gap ($1.6M), Now Assist value shortfall ($1.7M), and Now Assist/Copilot duplication ($600K). Claude Code is your highest-ROI program at 9.1x — expansion request pending. Microsoft renewal window opens in 47 days.',
    agentContext: 'Nexus · AI Portfolio · $11.7M across 5 programs · 7 active pressures',
    actions: [
      { letter: 'A', text: 'Review M365 Copilot adoption pressure', detail: 'Finance dept at 14% — sprint decision needed' },
      { letter: 'B', text: 'Now Assist renewal strategy', detail: 'Value shortfall critical; KB path or descope by Q3' },
      { letter: 'C', text: 'Scale Claude Code seats', detail: '280 → 350 requires renegotiation with Anthropic' },
    ],
  };
}

export function buildAiProgramPortfolioDecisions(): readonly PortfolioDecision[] {
  return SEED_DECISIONS;
}

export function getAiProgramById(id: string): AiProgram | undefined {
  return SEED_PROGRAMS.find((p) => p.id === id);
}

export function getAiProgramsByType(type: AiProgramType): readonly AiProgram[] {
  return SEED_PROGRAMS.filter((p) => p.programType === type);
}

export function getAllPressures(): readonly ProgramPressure[] {
  return SEED_PROGRAMS.flatMap((p) => p.pressures as ProgramPressure[]);
}

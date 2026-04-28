// Tower Wave T4 · AI Pressure Detail Fixture
//
// Extended per-pressure data for TWR-DTL-PRESSURE.
// Supplements the ProgramPressure type in ai-program-portfolio-fixture.ts.
// Deterministic seed-only. No model calls, no Date.now, no Math.random.

import {
  getAllPressures,
  type ProgramPressure,
  PRESSURE_TYPE_LABELS,
} from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PressureDriver {
  readonly label: string;
  readonly dollarImpact: number;
  readonly detail: string;
}

export interface PressureProjection {
  readonly days: number;
  readonly dollarImpact: number;
  readonly note: string;
}

export interface PressureAction {
  readonly rank: 1 | 2 | 3;
  readonly title: string;
  readonly estimatedRecovery: string;
  readonly effort: 'low' | 'medium' | 'high';
  readonly timeToImpact: string;
}

export interface AiPressureDetailView {
  readonly pressure: ProgramPressure;
  readonly pressureTypeLabel: string;
  readonly programName: string;
  readonly programId: string;
  readonly trajectory: 'worsening' | 'stable' | 'resolving';
  readonly drivers: readonly PressureDriver[];
  readonly projections: readonly PressureProjection[];
  readonly actions: readonly PressureAction[];
  readonly nexusQuote: string;
  readonly nexusContext: string;
  readonly nexusActions: ReadonlyArray<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

// ---------------------------------------------------------------------------
// Seed data indexed by pressure ID
// ---------------------------------------------------------------------------

const PRESSURE_DETAIL_SEED: Record<string, Omit<AiPressureDetailView, 'pressure' | 'pressureTypeLabel'>> = {
  'p-copilot-adopt': {
    programName: 'M365 Copilot',
    programId: 'twr-prog-m365-copilot',
    trajectory: 'stable',
    drivers: [
      { label: 'Low Finance dept adoption (14%)', dollarImpact: 600_000, detail: 'Finance has 1,400 eligible users; 196 active. Lowest-adoption major dept.' },
      { label: 'Low Legal dept adoption (12%)', dollarImpact: 400_000, detail: 'Legal 72 active of 600 eligible. High-value use case (contract review) untapped.' },
      { label: 'No change management program for non-technical users', dollarImpact: 600_000, detail: 'Engineering had structured onboarding; Finance/Legal did not.' },
    ],
    projections: [
      { days: 30, dollarImpact: 1_600_000, note: 'No change at current trajectory — adoption plateau.' },
      { days: 90, dollarImpact: 1_800_000, note: 'Worsening if renewal locks in current seat count without usage mandate.' },
      { days: 365, dollarImpact: 2_400_000, note: 'Cumulative shelfware cost if no adoption sprint launched before Q3.' },
    ],
    actions: [
      { rank: 1, title: 'Launch 90-day Finance adoption sprint', estimatedRecovery: '$1.1M/yr', effort: 'medium', timeToImpact: '90 days' },
      { rank: 2, title: 'Mandate Legal contract review use case', estimatedRecovery: '$400K/yr', effort: 'low', timeToImpact: '30 days' },
      { rank: 3, title: 'Negotiate seat right-sizing at renewal', estimatedRecovery: '$800K/yr', effort: 'high', timeToImpact: '47 days (renewal)' },
    ],
    nexusQuote: 'M365 Copilot shelfware: 76% of 12,400 licensed seats inactive, annualized at $1.6M. Finance at 14% and Legal at 12% are the largest untapped opportunities. The Microsoft renewal in 47 days is the leverage window — right-size or accelerate.',
    nexusContext: 'Nexus · P-ADOPT · M365 Copilot · $1.6M impact',
    nexusActions: [
      { letter: 'A', text: 'Launch Finance sprint', detail: '14% → 50% target · $1.1M/yr recovery' },
      { letter: 'B', text: 'Right-size at renewal', detail: 'Reduce licensed seats to 8,000 matching realistic target' },
      { letter: 'C', text: 'Mandate Legal contract review', detail: '30 days · $400K/yr · low effort' },
    ],
  },

  'p-copilot-dupl': {
    programName: 'M365 Copilot',
    programId: 'twr-prog-m365-copilot',
    trajectory: 'stable',
    drivers: [
      { label: 'Meeting summarization overlap', dollarImpact: 480_000, detail: 'Both Copilot and Now Assist offer meeting recap / ticket summary. 60% use-case overlap confirmed in audit.' },
      { label: 'FAQ deflection duplication', dollarImpact: 320_000, detail: 'M365 Copilot used for FAQ queries in Operations; Now Assist handles same in IT. No boundary defined.' },
    ],
    projections: [
      { days: 30, dollarImpact: 800_000, note: 'Stable — both tools running in parallel.' },
      { days: 90, dollarImpact: 800_000, note: 'No change without explicit use-case boundary setting.' },
      { days: 365, dollarImpact: 800_000, note: 'Cumulative $800K/yr if overlap persists through both renewals.' },
    ],
    actions: [
      { rank: 1, title: 'Define use-case ownership matrix', estimatedRecovery: '$800K/yr', effort: 'low', timeToImpact: '14 days' },
      { rank: 2, title: 'Assign FAQ deflection to Now Assist only', estimatedRecovery: '$320K/yr', effort: 'low', timeToImpact: '30 days' },
      { rank: 3, title: 'Renegotiate M365 scope at renewal', estimatedRecovery: '$480K/yr', effort: 'medium', timeToImpact: '47 days (renewal)' },
    ],
    nexusQuote: 'M365 Copilot and Now Assist have 60% use-case overlap — $800K/yr in duplicated spend with no clear owner boundary. Define the matrix before the Microsoft renewal window closes in 47 days.',
    nexusContext: 'Nexus · P-DUPL · M365 / Now Assist · $800K impact',
    nexusActions: [
      { letter: 'A', text: 'Define use-case ownership matrix', detail: '14 days · $800K/yr recovery · low effort' },
      { letter: 'B', text: 'Reassign FAQ deflection to Now Assist', detail: 'Cleaner boundary; reduces M365 dependency' },
      { letter: 'C', text: 'Use duplication evidence at renewal', detail: 'Negotiation leverage against Microsoft bundle' },
    ],
  },

  'p-now-value': {
    programName: 'ServiceNow Now Assist',
    programId: 'twr-prog-now-assist',
    trajectory: 'stable',
    drivers: [
      { label: 'Knowledge Base at 60% completeness', dollarImpact: 1_200_000, detail: 'Incomplete KB means 40% of queries fall to human agents. Root cause confirmed by ServiceNow support.' },
      { label: 'Agent handle time improvement below target', dollarImpact: 484_000, detail: '11% handle time reduction vs 25% promised. Agent workflow integration not fully deployed.' },
    ],
    projections: [
      { days: 30, dollarImpact: 1_684_000, note: 'Stable — KB completion stalled at 60% for 3 months.' },
      { days: 90, dollarImpact: 1_684_000, note: 'Stable unless KB sprint is launched. Renewal in 112 days.' },
      { days: 365, dollarImpact: 1_684_000, note: 'Cumulative $1.7M shortfall annually at current performance.' },
    ],
    actions: [
      { rank: 1, title: 'Complete KB integration to 90%', estimatedRecovery: '$900K/yr if deflection lifts to 36%', effort: 'high', timeToImpact: '90 days' },
      { rank: 2, title: 'Negotiate SLA penalty compensation', estimatedRecovery: '$250K one-time', effort: 'medium', timeToImpact: '45 days' },
      { rank: 3, title: 'Descope to IT-only, renegotiate rate', estimatedRecovery: '$600K/yr', effort: 'high', timeToImpact: '112 days (renewal)' },
    ],
    nexusQuote: 'Now Assist value shortfall: $1.7M/yr with high confidence (ticket logs, objective). Root cause is KB at 60% — every query in the uncovered 40% costs $32 as a human-handled ticket. KB completion is the only path to hitting the promised 40% deflection rate before the 112-day renewal.',
    nexusContext: 'Nexus · P-VALUE · Now Assist · $1.7M impact · CRITICAL',
    nexusActions: [
      { letter: 'A', text: 'Launch KB completion sprint', detail: '60% → 90% · 90-day sprint · $900K/yr recovery' },
      { letter: 'B', text: 'Engage ServiceNow on SLA breach', detail: 'Formal SLA miss documented · $250K compensation target' },
      { letter: 'C', text: 'Model descope scenario', detail: 'IT-only scope at 60% current rate · $600K/yr savings' },
    ],
  },

  'p-now-dupl': {
    programName: 'ServiceNow Now Assist',
    programId: 'twr-prog-now-assist',
    trajectory: 'stable',
    drivers: [
      { label: 'FAQ summarization overlap with M365 Copilot', dollarImpact: 600_000, detail: '30% of Now Assist usage is FAQ summarization that M365 Copilot also handles. No use-case boundary exists.' },
    ],
    projections: [
      { days: 30, dollarImpact: 600_000, note: 'Stable — no boundary definition in progress.' },
      { days: 90, dollarImpact: 600_000, note: 'Use-case ownership matrix needed before Now Assist renewal in 112 days.' },
      { days: 365, dollarImpact: 600_000, note: '$600K/yr ongoing without boundary enforcement.' },
    ],
    actions: [
      { rank: 1, title: 'Assign IT FAQ to Now Assist exclusively', estimatedRecovery: '$600K/yr', effort: 'low', timeToImpact: '14 days' },
      { rank: 2, title: 'Remove M365 Copilot from IT Operations scope', estimatedRecovery: '$300K/yr', effort: 'medium', timeToImpact: '30 days' },
      { rank: 3, title: 'Consolidate at nearest renewal (M365, 47 days)', estimatedRecovery: '$600K/yr', effort: 'high', timeToImpact: '47 days' },
    ],
    nexusQuote: 'Now Assist and M365 Copilot overlap on IT FAQ summarization — $600K/yr in duplicated capability. Resolve before the M365 renewal in 47 days. Low effort: assign IT FAQ exclusively to Now Assist, remove M365 from IT Operations scope.',
    nexusContext: 'Nexus · P-DUPL · Now Assist / M365 · $600K impact',
    nexusActions: [
      { letter: 'A', text: 'Assign IT FAQ to Now Assist', detail: 'Exclusive ownership · $600K/yr · 14 days' },
      { letter: 'B', text: 'Remove M365 from IT Operations', detail: '30 days · prevents further overlap growth' },
      { letter: 'C', text: 'Consolidate at M365 renewal', detail: '47 days · negotiation leverage for bundle scope reduction' },
    ],
  },

  'p-claude-vend': {
    programName: 'Claude Code',
    programId: 'twr-prog-claude-code',
    trajectory: 'stable',
    drivers: [
      { label: 'Current 280-seat commitment at capacity', dollarImpact: 0, detail: '176 active users of 200 eligible. Expansion to 350 seats (new hires) requires renegotiation.' },
    ],
    projections: [
      { days: 30, dollarImpact: 0, note: 'No dollar risk — vendor concentration is strategic, not financial.' },
      { days: 90, dollarImpact: 0, note: 'Expansion decision needed before headcount grows past 280 eligible.' },
      { days: 365, dollarImpact: 0, note: 'If expansion is not negotiated, new engineers will be unlicensed.' },
    ],
    actions: [
      { rank: 1, title: 'Expand seats 280 → 350 via renegotiation', estimatedRecovery: '+$570K/yr value at current ROI', effort: 'low', timeToImpact: '30 days' },
      { rank: 2, title: 'Activate 24 non-users on current list', estimatedRecovery: '+$77K/yr value', effort: 'low', timeToImpact: '14 days' },
      { rank: 3, title: 'Elevate attribution to HIGH via A/B test', estimatedRecovery: 'Confidence unlock for board reporting', effort: 'medium', timeToImpact: '90 days' },
    ],
    nexusQuote: 'Claude Code expansion is low-risk, high-return: $57K incremental spend for ~$570K projected value at the current 9.1x ROI. Vendor concentration risk is strategic (single-provider for coding agents), not financial. Renegotiate before headcount exceeds the 280-seat commitment.',
    nexusContext: 'Nexus · P-VEND · Claude Code · Strategic · Low severity',
    nexusActions: [
      { letter: 'A', text: 'Expand to 350 seats', detail: '$57K spend · ~$570K projected lift · 30 days' },
      { letter: 'B', text: 'Activate 24 unlicensed engineers', detail: 'Low effort · $77K/yr additional value' },
      { letter: 'C', text: 'Evaluate GitHub Copilot as alternative', detail: 'Due diligence only — not a replacement signal' },
    ],
  },

  'p-joule-vend': {
    programName: 'SAP Joule',
    programId: 'twr-prog-sap-joule',
    trajectory: 'stable',
    drivers: [
      { label: 'Deep S/4HANA integration creates extreme switching cost', dollarImpact: 0, detail: 'SAP Joule is embedded in Finance, Procurement, and Supply Chain ERP workflows. Estimated switching cost $4–8M.' },
    ],
    projections: [
      { days: 30, dollarImpact: 0, note: 'No near-term risk. Renewal 548 days out.' },
      { days: 90, dollarImpact: 0, note: 'Monitor Year 1 metrics (Finance close cycle time) — 12-month checkpoint is Oct 2026.' },
      { days: 365, dollarImpact: 0, note: 'Renewal window opens ~Jan 2028. Switching cost will grow with additional integration depth.' },
    ],
    actions: [
      { rank: 1, title: 'Document switching cost estimate formally', estimatedRecovery: 'Strategic optionality', effort: 'low', timeToImpact: '30 days' },
      { rank: 2, title: 'Set 12-month value attribution checkpoint', estimatedRecovery: 'Attribution confidence uplift', effort: 'low', timeToImpact: '90 days (Oct 2026)' },
      { rank: 3, title: 'Assess AI vendor diversity posture', estimatedRecovery: 'Reduced concentration risk', effort: 'medium', timeToImpact: '90 days' },
    ],
    nexusQuote: 'SAP Joule lock-in is a strategic watch item — no near-term dollar risk with renewal 548 days out. The watch is: every quarter of deeper integration increases the switching cost. Document the $4–8M estimate now while it\'s still a planning number, not a sunk cost.',
    nexusContext: 'Nexus · P-VEND · SAP Joule · Strategic watch · Low severity',
    nexusActions: [
      { letter: 'A', text: 'Formalize switching cost estimate', detail: '$4–8M range · lock in methodology now' },
      { letter: 'B', text: 'Set Oct 2026 value checkpoint', detail: '12-month Finance close cycle data will be definitive' },
      { letter: 'C', text: 'Review AI vendor diversity posture', detail: 'SAP + Microsoft = 57% of AI budget — concentration flag' },
    ],
  },

  'p-fow-tlnt': {
    programName: 'AI Fluency Program',
    programId: 'twr-prog-fow',
    trajectory: 'stable',
    drivers: [
      { label: 'Skills coverage at 38% vs 60% target', dollarImpact: 0, detail: 'Operations and Engineering cohorts lagging. Competing change initiatives (ERP rollout, Contact Center AI) absorbing bandwidth.' },
    ],
    projections: [
      { days: 30, dollarImpact: 0, note: 'No near-term dollar risk — leading indicator program.' },
      { days: 90, dollarImpact: 0, note: 'Without acceleration, lagging indicators (retention, productivity) will not be readable until late 2027.' },
      { days: 365, dollarImpact: 0, note: 'Opportunity cost risk: $2M/yr spend with no measurable ROI until instrumentation is deployed.' },
    ],
    actions: [
      { rank: 1, title: 'Accelerate Operations cohort to close gap', estimatedRecovery: 'Lagging indicator unlock', effort: 'medium', timeToImpact: '90 days' },
      { rank: 2, title: 'Deploy AI-task ratio instrumentation', estimatedRecovery: 'Year 2 value case enablement', effort: 'medium', timeToImpact: '45 days' },
      { rank: 3, title: 'Pre-register retention study methodology', estimatedRecovery: '2027 attrition cohort analysis', effort: 'low', timeToImpact: '30 days' },
    ],
    nexusQuote: 'AI Fluency talent pressure: 38% skills coverage vs 60% target, with competing change initiatives (ERP, CC-AI) slowing enrollment. No dollar impact today, but the window to build the lagging indicator evidence is closing — retention data won\'t be readable until 2027 at earliest.',
    nexusContext: 'Nexus · P-TLNT · AI Fluency · Leading indicator risk',
    nexusActions: [
      { letter: 'A', text: 'Sprint Operations cohort completion', detail: '90 days · unlock lagging indicator visibility' },
      { letter: 'B', text: 'Deploy AI-task ratio tooling', detail: '45 days · required for Year 2 ROI case' },
      { letter: 'C', text: 'Pre-register retention study now', detail: '30 days · protects 2027 evidence quality' },
    ],
  },
};

// Mapping from pressure ID → program ID (derived from fixture structure)
const PRESSURE_TO_PROGRAM: Record<string, string> = {
  'p-copilot-adopt': 'twr-prog-m365-copilot',
  'p-copilot-dupl': 'twr-prog-m365-copilot',
  'p-now-value': 'twr-prog-now-assist',
  'p-now-dupl': 'twr-prog-now-assist',
  'p-claude-vend': 'twr-prog-claude-code',
  'p-joule-vend': 'twr-prog-sap-joule',
  'p-fow-tlnt': 'twr-prog-fow',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildAiPressureDetailView(pressureId: string): AiPressureDetailView | null {
  const allPressures = getAllPressures();
  const pressure = allPressures.find((p) => p.id === pressureId);
  if (!pressure) return null;

  const seed = PRESSURE_DETAIL_SEED[pressureId];
  if (!seed) return null;

  return {
    pressure,
    pressureTypeLabel: PRESSURE_TYPE_LABELS[pressure.type],
    ...seed,
  };
}

export function isAiPressureId(id: string): boolean {
  return id in PRESSURE_DETAIL_SEED;
}

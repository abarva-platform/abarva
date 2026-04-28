// Tower Wave T5 · AI Decision Detail Fixture
// Extended provenance + rationale data for each decision in SEED_DECISIONS.
// Deterministic seed-only. No model calls, no Date.now, no Math.random.

import { buildAiProgramPortfolioDecisions, type PortfolioDecision } from '@/lib/tower/ai-program-portfolio-fixture';

export interface DecisionEvidence {
  readonly label: string;
  readonly value: string;
  readonly source: string;
}

export interface DecisionDetailView extends PortfolioDecision {
  readonly rationale: string;
  readonly evidence: readonly DecisionEvidence[];
  readonly alternatives: ReadonlyArray<{ label: string; reason: string }>;
  readonly reviewedBy: readonly string[];
  readonly nextCheckpoint: string;
  readonly nexusQuote: string;
  readonly nexusContext: string;
  readonly nexusActions: ReadonlyArray<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

const DECISION_DETAIL_SEED: Record<string, Omit<DecisionDetailView, keyof PortfolioDecision>> = {
  'dec-001': {
    rationale: 'Pilot cohort of 50 engineers showed 38% PR throughput improvement against a cohort-matched control group over a 90-day baseline window. Confidence is medium (cohort-match) — randomised A/B was not feasible for this rollout. The signal is strong enough to justify full expansion; attribution will be upgraded to high after a 6-month A/B test run against a holdout group.',
    evidence: [
      { label: 'PR throughput lift', value: '+38%', source: 'DORA cohort baseline · 90 days' },
      { label: 'Pilot cohort size', value: '50 engineers', source: 'Engineering org roster · Jan 2026' },
      { label: 'Control group match', value: 'Propensity-matched on tenure/complexity', source: 'Data team · Feb 2026' },
      { label: 'Annualised value', value: '$4.03M', source: 'Cohort lift × FTE cost model' },
    ],
    alternatives: [
      { label: 'Keep pilot at 50 seats', reason: 'Rejected: strong signal, low switching cost — no reason to delay expansion.' },
      { label: 'Expand to 350 seats (full org)', reason: 'Deferred: 200 seats cover all active engineers. 350-seat amendment tabled for Q3 once A/B test runs.' },
    ],
    reviewedBy: ['VP Engineering', 'CTO', 'Finance'],
    nextCheckpoint: '2026-09-12 · 6-month A/B test · attribution upgrade to high',
    nexusQuote: 'Claude Code is the highest-ROI vendor in the portfolio at 9.1x. Expansion to 350 seats is the next action — pending Q3 contract amendment.',
    nexusContext: 'Nexus · dec-001 · Claude Code expansion · $400K → $457K',
    nexusActions: [
      { letter: 'A', text: 'Amend contract to 350 seats', detail: '$57K incremental · projected $570K additional value' },
      { letter: 'B', text: 'Schedule 6-month A/B checkpoint', detail: 'Sep 12 · upgrade attribution to high confidence' },
      { letter: 'C', text: 'Identify the 24 non-users', detail: 'Approved list · activate before seat amendment' },
    ],
  },
  'dec-002': {
    rationale: 'KB integration is at 60% completeness due to a missed milestone (18 months late). Deflection rate sits at 28% vs 40% promised. Descoping Now Assist scope before KB completes would lock in the underperformance permanently. Completing KB integration first gives a path to 40%+ deflection, which would reduce the value shortfall from $1.7M to ~$500K. Q3 renewal is the hard deadline.',
    evidence: [
      { label: 'Current deflection rate', value: '28%', source: 'ServiceNow ticket log · rolling 30 days' },
      { label: 'Promised deflection rate', value: '40%', source: 'Original contract SLA · 2024-06' },
      { label: 'KB completeness', value: '60%', source: 'ServiceNow milestone tracker · Apr 2026' },
      { label: 'Annual value shortfall', value: '$1.68M', source: 'Ticket deflection model · high confidence' },
    ],
    alternatives: [
      { label: 'Descope Now Assist immediately', reason: 'Rejected: locks in underperformance; KB completion could recover $1.2M.' },
      { label: 'Invoke SLA breach penalty now', reason: 'Tabled: formal notice being prepared; will open penalty clause discussion in parallel.' },
    ],
    reviewedBy: ['VP IT Operations', 'Chief Information Officer', 'Legal'],
    nextCheckpoint: '2026-07-28 · Q3 renewal trigger · descope decision if deflection < 38%',
    nexusQuote: 'ServiceNow is at-risk. KB completion is the last lever before renewal. If deflection doesn\'t reach 38% by Q3, the descope-and-renegotiate path is the only recovery.',
    nexusContext: 'Nexus · dec-002 · Now Assist defer · Q3 renewal trigger',
    nexusActions: [
      { letter: 'A', text: 'Engage ServiceNow on KB sprint', detail: '90-day completion commitment · penalty clause if missed' },
      { letter: 'B', text: 'Prepare formal SLA breach notice', detail: 'Opens $560K penalty or 20% fee reduction path' },
      { letter: 'C', text: 'Set Q3 renewal go/no-go checkpoint', detail: 'Jul 28 · 38% deflection threshold · scale or descope' },
    ],
  },
  'dec-003': {
    rationale: 'Finance department adoption at 14% — the lowest of any department. Identified causes: no Finance-specific prompts deployed, low manager buy-in, and no measurement of time saved on month-end close. A 90-day focused sprint (prompt library, champion program, 3 measure points) projects Finance adoption at 50%, adding ~$1.1M annualized value. If the sprint fails, the right-sizing decision at renewal is reinforced.',
    evidence: [
      { label: 'Finance adoption rate', value: '14%', source: 'M365 usage telemetry · Apr 2026' },
      { label: 'Org-wide adoption rate', value: '24%', source: 'M365 usage telemetry · Apr 2026' },
      { label: 'Sprint projected adoption', value: '50%', source: 'Manager survey + comparable Finance sprint at Apex ANZ' },
      { label: 'Projected value add', value: '$1.1M/yr', source: 'Value model extrapolation · low confidence' },
    ],
    alternatives: [
      { label: 'Descope Finance from Copilot at renewal', reason: 'Deferred: sprint is lower-risk first step. Descope remains an option if sprint fails.' },
      { label: 'Expand to all Finance users immediately', reason: 'Rejected: 14% base suggests structural barriers; sprint must diagnose before scaling.' },
    ],
    reviewedBy: ['Chief Information Officer', 'CFO', 'VP Finance Operations'],
    nextCheckpoint: '2026-06-30 · Sprint 90-day checkpoint · measure Finance adoption vs 50% target',
    nexusQuote: 'Finance sprint is the make-or-break for M365 Copilot renewal. If adoption reaches 50%, the renewal case improves. If it falls short, right-sizing from 12,400 to 8,000 seats is the lever.',
    nexusContext: 'Nexus · dec-003 · M365 Finance sprint · 47-day renewal window',
    nexusActions: [
      { letter: 'A', text: 'Deploy Finance prompt library', detail: '30-day milestone · unlock month-end close use cases' },
      { letter: 'B', text: 'Appoint Finance AI champions', detail: '5 champions across AP/AR/FP&A/Treasury/Close' },
      { letter: 'C', text: 'Set 90-day sprint checkpoint', detail: 'Jun 30 · 50% threshold · renewal right-sizing decision' },
    ],
  },
};

export function buildAiDecisionDetailView(decisionId: string): DecisionDetailView | null {
  const decisions = buildAiProgramPortfolioDecisions();
  const base = decisions.find((d) => d.id === decisionId);
  if (!base) return null;
  const ext = DECISION_DETAIL_SEED[decisionId];
  if (!ext) return null;
  return { ...base, ...ext };
}

export function isAiDecisionId(id: string): boolean {
  return id in DECISION_DETAIL_SEED;
}

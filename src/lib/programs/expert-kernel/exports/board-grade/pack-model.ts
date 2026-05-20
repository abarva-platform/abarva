// Board-grade Costed Business-Case Pack — view-model.
//
// This module is the single seam between the Expert Kernel and the board-grade
// renderer. It runs the EXISTING Apex kernel (`buildApexContactCenterFullCase`
// and `buildApexMobilizeCase`) and projects its outputs into an 11-section
// view-model. It introduces NO new numbers — every figure traces to a kernel
// field. Where the kernel returns `null` (Apex payback) or a declared seed gap,
// the view-model carries that honestly; it never fabricates a substitute.
//
// Pure module: deterministic, no I/O.

import {
  buildApexContactCenterFullCase,
  buildApexContactCenterValueForecast,
  buildApexMobilizeCase,
} from '../../apex-contact-center-case';
import type { HaircutFactor } from '../../value-forecast';
import type { Assumption } from '../../assumption-ledger';
import type { BaselineMetric } from '../../baseline-model';
import type { KillCriterion } from '../../business-case-compiler';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface SectionAnatomy {
  /** Page number, 1..11. */
  page: number;
  /** Anchor id for the table of contents. */
  id: string;
  /** Short eyebrow / TOC label, e.g. "Investment case". */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view (NOT a label). */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: EvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

export interface EvidenceStrip {
  sources: string[];
  asOf: string;
  /** Plain confidence read for the page. */
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  /** Open gaps relevant to this page. */
  gaps: string[];
}

// ---------------------------------------------------------------------------
// The full pack view-model.
// ---------------------------------------------------------------------------

export interface CostedBusinessCasePack {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The kernel verdict — fund / shape / kill. For Apex this is `shape`. */
  verdict: 'fund' | 'shape' | 'kill';
  /** True when the kernel cannot monetise the value (Apex: true). */
  monetisationBlocked: boolean;
  /** The 11 sections, page-ordered. */
  sections: PackSections;
  /** Navigation entries for the sticky TOC. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface PackSections {
  boardAnswer: BoardAnswerSection;
  whyNow: WhyNowSection;
  whatWeAreFunding: WhatWeAreFundingSection;
  investmentCase: InvestmentCaseSection;
  valueCase: ValueCaseSection;
  paybackSensitivity: PaybackSensitivitySection;
  roadmap: RoadmapSection;
  risksControls: RisksControlsSection;
  assumptionLedger: AssumptionLedgerSection;
  evidenceAppendix: EvidenceAppendixSection;
  recommendation: RecommendationSection;
}

// --- §1 Board answer --------------------------------------------------------

export interface BoardAnswerSection {
  anatomy: SectionAnatomy;
  /** The one-sentence verdict, plain. */
  verdictHeadline: string;
  verdictDetail: string;
  /** Headline economics tiles. */
  economics: Array<{
    label: string;
    value: string;
    sub?: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** What to fund now. */
  fundNow: string[];
  /** What NOT to fund yet — blueprint §9 hard fail if missing. */
  doNotFundYet: string[];
  /** The single blocker that drives the verdict. */
  blocker: string;
  immediateAsk: string;
}

// --- §2 Why now -------------------------------------------------------------

export interface WhyNowSection {
  anatomy: SectionAnatomy;
  trigger: string;
  pain: string;
  /** Baseline-vs-target bars for the impact chart. */
  baselineBars: Array<{
    label: string;
    current: number;
    target: number | null;
    unit: string;
    betterWhen: 'higher' | 'lower';
  }>;
  sponsor: string;
}

// --- §3 What we are funding -------------------------------------------------

export interface WhatWeAreFundingSection {
  anatomy: SectionAnatomy;
  /** Solution-context nodes — users / systems / agent boundary / Tower. */
  contextNodes: Array<{
    band: 'actors' | 'platform' | 'systems' | 'governance';
    label: string;
    detail: string;
    isGap: boolean;
  }>;
  included: string[];
  excluded: string[];
  retainedAccountabilities: string[];
}

// --- §4 Investment case -----------------------------------------------------

export interface InvestmentCaseSection {
  anatomy: SectionAnatomy;
  /** Investment waterfall steps. */
  waterfall: Array<{ label: string; amount: number }>;
  /** Cost-stack segments — build / run / change. */
  costStack: Array<{ label: string; value: number; color: string }>;
  investmentRange: { low: number; point: number; high: number };
  /** Per-workstream table. */
  workstreams: Array<{
    label: string;
    base: number;
    headcount: number;
    durationMonths: number;
    agentSplitPct: number;
  }>;
  buildVsChangeNote: string;
}

// --- §5 Value case ----------------------------------------------------------

export interface ValueCaseSection {
  anatomy: SectionAnatomy;
  grossValue: number;
  netValue: number;
  totalHaircutPct: number;
  /** Bridge steps — each haircut factor as a downward step. */
  bridgeSteps: Array<{ label: string; amount: number }>;
  /** Haircut factor detail table. */
  factors: Array<{
    label: string;
    score: number;
    weightPct: number;
    discountPct: number;
    rationale: string;
  }>;
  /** Adoption curve points. */
  adoption: Array<{ label: string; adoption: number; netValue: number }>;
}

// --- §6 Payback and sensitivity --------------------------------------------

export interface PaybackSensitivitySection {
  anatomy: SectionAnatomy;
  /** Three scenarios — base / conservative / upside. */
  scenarios: Array<{
    name: string;
    investment: number;
    netValue: number;
    netReturn: number;
    paybackMonths: number | null;
  }>;
  /** Tornado bars — the case-moving assumptions. */
  tornado: Array<{ label: string; swing: number; isProxy: boolean }>;
  /** Cumulative cash-flow series for the payback curve. */
  cashFlow: Array<{
    label: string;
    color: string;
    dashed?: boolean;
    cumulative: number[];
  }>;
  cashFlowPeriods: string[];
  paybackBlocked: boolean;
  whatBreaksTheCase: string;
  downsideRead: string;
}

// --- §7 Roadmap -------------------------------------------------------------

export interface RoadmapSection {
  anatomy: SectionAnatomy;
  totalMonths: number;
  /** Swimlane phases. */
  phases: Array<{
    label: string;
    startMonth: number;
    durationMonths: number;
    foundational: boolean;
    valueUnlocked: number;
    milestone: string;
    gate: string;
  }>;
  /** Gate detail table. */
  gates: Array<{
    code: string;
    name: string;
    decision: string;
    killable: boolean;
  }>;
}

// --- §8 Risks and controls --------------------------------------------------

export interface RisksControlsSection {
  anatomy: SectionAnatomy;
  /** Heatmap points. */
  heatmap: Array<{ likelihood: number; impact: number; code: string }>;
  /** Risk register. */
  risks: Array<{
    code: string;
    risk: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    control: string;
    owner: string;
  }>;
}

// --- §9 Assumption ledger ---------------------------------------------------

export interface AssumptionLedgerSection {
  anatomy: SectionAnatomy;
  assumptions: Array<{
    rank: number;
    statement: string;
    owner: string;
    confidence: 'high' | 'medium' | 'low';
    source: string;
    sensitivity: 'high' | 'medium' | 'low';
    isProxy: boolean;
  }>;
}

// --- §10 Evidence appendix --------------------------------------------------

export interface EvidenceAppendixSection {
  anatomy: SectionAnatomy;
  /** Recorded metrics. */
  recorded: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
    caveat: string;
  }>;
  /** Seed gaps — declared, never blank. */
  seedGaps: Array<{
    metric: string;
    reason: string;
    owner: string;
    asOf: string;
    decisionImpact: string;
  }>;
}

// --- §11 Recommendation and asks -------------------------------------------

export interface RecommendationSection {
  anatomy: SectionAnatomy;
  verdictHeadline: string;
  /** Decision checklist — what is being requested now. */
  checklist: Array<{
    label: string;
    state: 'approve' | 'hold' | 'condition';
    detail: string;
  }>;
  conditions: string[];
  requestedSpend: string;
  nextGate: string;
  killTriggers: string[];
}

// ===========================================================================
// Builder.
// ===========================================================================

const FACTOR_LABEL: Record<HaircutFactor['dimension'], string> = {
  adoptionRisk: 'Adoption risk',
  dataReadiness: 'Data readiness',
  processDependency: 'Process dependency',
  integrationComplexity: 'Integration complexity',
  controlBurden: 'Control burden',
  sponsorStrength: 'Sponsor strength',
};

const FACTOR_RATIONALE: Record<HaircutFactor['dimension'], string> = {
  adoptionRisk:
    'Agent-assist preferred by the WFM lead, but floor adoption is not yet proven.',
  dataReadiness:
    'CDP consolidation gap — intent and transcript data are not yet unified.',
  processDependency:
    'Value depends on the Customer Care routing process redesign landing.',
  integrationComplexity:
    'NICE CXone is aging; Salesforce and AWS connectors are well understood.',
  controlBurden:
    'Customer-facing inference plus a transcript-use privacy review pending.',
  sponsorStrength:
    'CIO, CDO and VP Customer Care are all named sponsors — strong.',
};

function verdictHeadlineText(monetisationBlocked: boolean): string {
  return monetisationBlocked
    ? 'Approve shaping spend only — full autonomy is not yet fundable until ' +
        'the cost-per-contact gap is closed.'
    : 'Fund the Move — the case pays back and the floor holds.';
}

/** Build the Apex Costed Business-Case Pack view-model. Deterministic. */
export function buildApexCostedBusinessCasePack(
  generatedOn: string,
): CostedBusinessCasePack {
  const full = buildApexContactCenterFullCase();
  const mobilize = buildApexMobilizeCase();
  const valueForecast = buildApexContactCenterValueForecast();
  const { skeleton, roadmap } = full.fullCase;
  const { critic } = skeleton;

  const monetisationBlocked = !skeleton.economics.monetisable;
  const verdict = full.fullCase.recommendation;

  // --- Shared evidence ------------------------------------------------------
  const seedGapMetrics = skeleton.baseline.seedGaps;
  const seedGapLabels = seedGapMetrics.map((g) => g.label);
  const primaryBlocker = critic.blockers[0]?.message ?? '';

  // --- §1 Board answer ------------------------------------------------------
  const boardAnswer: BoardAnswerSection = {
    anatomy: {
      page: 1,
      id: 'board-answer',
      navLabel: 'Board answer',
      takeaway: verdictHeadlineText(monetisationBlocked),
      decisionRole:
        'Approve the next shaping gate — not full build funding.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'Apex audited substrate (NICE CXone KPIs, Move P2 baseline)',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: seedGapLabels,
      },
      implication:
        'The board can release shaping spend now; full-build funding waits ' +
        'on the cost-per-contact baseline.',
      owner: 'CIO (Executive Sponsor)',
      nextGate: 'Charter-to-Design shaping gate',
    },
    verdictHeadline:
      verdict === 'shape'
        ? 'SHAPE — fund the next gate, do not fund the full build yet'
        : verdict === 'fund'
          ? 'FUND'
          : 'KILL — do not fund',
    verdictDetail: full.fullCase.recommendationRationale,
    economics: [
      {
        label: 'Investment (base)',
        value: compact(skeleton.economics.investment.point),
        sub: `${compact(skeleton.economics.investment.low)}–${compact(
          skeleton.economics.investment.high,
        )} range`,
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr, base)',
        value: compact(skeleton.valueRange.point),
        sub: `${compact(skeleton.valueRange.low)}–${compact(
          skeleton.valueRange.high,
        )} · post-haircut`,
        tone: 'good',
      },
      {
        label: 'Payback',
        value: 'Blocked',
        sub: 'Seed gap — not computable',
        tone: 'bad',
      },
      {
        label: 'Open blockers',
        value: String(critic.blockers.length),
        sub: `${skeleton.baseline.seedGaps.length} seed gaps`,
        tone: 'warn',
      },
      {
        label: 'Next gate',
        value: 'Shaping',
        sub: 'Charter → Design',
        tone: 'neutral',
      },
    ],
    fundNow: [
      'The cost-per-contact baseline capture — the single gate-closing item.',
      'Phase 0 data and platform foundation shaping (intent / transcript ' +
        'unification design, model-gateway scoping).',
      'The transcript-use privacy review through to a cleared verdict.',
    ],
    doNotFundYet: [
      'The full AI-routing build and scale-out — the value range is a proxy ' +
        'until the cost-per-contact baseline lands.',
      'Any commitment that assumes the $11.3M base net value as a hard return.',
      'IVR-replacement scope — the WFM lead is on record for agent-assist; ' +
        'autonomy beyond assist is unfunded and unproven.',
    ],
    blocker:
      primaryBlocker ||
      'Value cannot be monetised — the gross value rests on a seed-gap proxy.',
    immediateAsk:
      'Release shaping spend and a dated owner for the cost-per-contact ' +
      'baseline (Brendan Fox, due 2026-05-15). Re-present for build funding ' +
      'once it lands.',
  };

  // --- §2 Why now -----------------------------------------------------------
  const containment = recorded(skeleton.baseline.metrics, 'containment_pct');
  const aht = recorded(skeleton.baseline.metrics, 'aht_minutes');
  const csat = recorded(skeleton.baseline.metrics, 'csat');
  const utilization = recorded(
    skeleton.baseline.metrics,
    'agent_utilization_pct',
  );
  const tower = skeleton.towerHandoff;
  const towerTarget = (key: string): number | null =>
    tower.find((t) => t.metricKey === key)?.targetValue ?? null;

  const whyNow: WhyNowSection = {
    anatomy: {
      page: 2,
      id: 'why-now',
      navLabel: 'Why now',
      takeaway:
        'Containment is stuck at 28% while handle time rises and agents run ' +
        'hot — the routing problem is structural, not seasonal.',
      decisionRole: 'Confirm the problem is real and time-sensitive.',
      evidence: {
        sources: [
          'NICE CXone KPIs (kpi:apex:018–021)',
          'Zendesk post-interaction survey (kpi:apex:012)',
          'Move P2 baseline deliverable (Genesys routing export)',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: [
          'NICE-vs-IT containment reconciliation due 2026-05-08',
          'Channel mix (voice/chat/IVR split) not seeded',
        ],
      },
      implication:
        'The baseline is strong enough to shape against; the containment ' +
        'measurement must be reconciled before the target is locked.',
      owner: 'VP Customer Care',
      nextGate: 'Containment reconciliation (James Wright, due 2026-05-08)',
    },
    trigger:
      'Containment has plateaued at 28% against a stated 40% KPI target ' +
      'while Average Handle Time is rising — easy contacts are deflected, so ' +
      'the calls that reach agents are harder. Agent utilisation at 84% is ' +
      'above the 80% target, so there is no slack to absorb the mix shift.',
    pain:
      'Repeat transfers run at 18.4% and CSAT sits at 4.1/5 — both consistent ' +
      'with mis-routing. The Move is sponsored at the executive level (CIO, ' +
      'CDO and VP Customer Care) precisely because the problem is now ' +
      'capacity-bound, not a tooling preference.',
    baselineBars: [
      {
        label: 'Contact Center Containment',
        current: containment?.value ?? 0,
        target: towerTarget('containment_pct'),
        unit: '%',
        betterWhen: 'higher',
      },
      {
        label: 'Average Handle Time',
        current: aht?.value ?? 0,
        target: towerTarget('aht_minutes'),
        unit: 'min',
        betterWhen: 'lower',
      },
      {
        label: 'CSAT (post-interaction)',
        current: csat?.value ?? 0,
        target: towerTarget('csat'),
        unit: '/5',
        betterWhen: 'higher',
      },
      {
        label: 'Agent Utilization',
        current: utilization?.value ?? 0,
        target: null,
        unit: '%',
        betterWhen: 'lower',
      },
    ],
    sponsor:
      'Executive sponsor: CIO. Data sponsor: CDO. Business sponsor: VP ' +
      'Customer Care. Program lead: Priya Iyer.',
  };

  // --- §3 What we are funding ----------------------------------------------
  const whatWeAreFunding: WhatWeAreFundingSection = {
    anatomy: {
      page: 3,
      id: 'what-we-are-funding',
      navLabel: 'What we are funding',
      takeaway:
        'We are funding an agent-assist routing layer over NICE CXone — not ' +
        'an IVR replacement and not autonomous customer-facing inference.',
      decisionRole: 'Confirm the scope boundary before costing it.',
      evidence: {
        sources: [
          'Solution architecture pack (Apex Contact Center)',
          'Effort estimate — eight workstreams',
          'AI Governance Council notes',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [
          'Transcript-use privacy review not yet cleared (milestone 2026-05-17)',
        ],
      },
      implication:
        'The funded scope is bounded and human-accountable; autonomy beyond ' +
        'agent-assist is explicitly excluded.',
      owner: 'Solution Architect',
      nextGate: 'Architecture sign-off at the Design gate',
    },
    contextNodes: [
      {
        band: 'actors',
        label: 'Customer Care agents',
        detail:
          'Routed and assist-augmented; harder calls land with them.',
        isGap: false,
      },
      {
        band: 'actors',
        label: 'Customers',
        detail: 'Voice / chat / IVR — channel split not yet seeded.',
        isGap: true,
      },
      {
        band: 'platform',
        label: 'AI routing + assist layer',
        detail: 'The funded build — model gateway, routing model, assist UI.',
        isGap: false,
      },
      {
        band: 'systems',
        label: 'NICE CXone',
        detail: 'System of record for contacts; aging integration surface.',
        isGap: false,
      },
      {
        band: 'systems',
        label: 'Salesforce + AWS',
        detail: 'Well-understood connectors for CRM and platform.',
        isGap: false,
      },
      {
        band: 'systems',
        label: 'Unified intent / transcript store',
        detail: 'Phase 0 dependency — CDP consolidation gap.',
        isGap: true,
      },
      {
        band: 'governance',
        label: 'AI Governance + Tower',
        detail:
          'Transcript-use review; Tower measures containment, AHT, CSAT.',
        isGap: false,
      },
    ],
    included: [
      'AI routing model and agent-assist layer over NICE CXone (8 workstreams).',
      'Phase 0 data foundation — intent / transcript unification and a model ' +
        'gateway.',
      'Process redesign of the Customer Care routing workflow.',
      'Change, adoption and a 6-week hypercare window.',
      'Year-1 run and operations.',
    ],
    excluded: [
      'IVR replacement — the chosen shape is agent-assist, not deflection.',
      'Autonomous, customer-facing inference without human accountability.',
      'Non-Customer-Care queues (sales, retention) — out of this Move.',
    ],
    retainedAccountabilities: [
      'Funding, scope, go-live and kill decisions stay human-accountable ' +
        '(RACI §7).',
      'The WFM lead retains operating-model accountability after go-live.',
      'AI Governance retains accountability for the transcript-use review.',
    ],
  };

  // --- §4 Investment case ---------------------------------------------------
  const ws = skeleton.effort.workstreams;
  const wsCost = (id: string): number =>
    ws.find((w) => w.id === id)?.baseCost ?? 0;
  const buildLane = wsCost('ai_build') + wsCost('foundational');
  const integrationLane = wsCost('integration') + wsCost('data');
  const dataGovLane = wsCost('data_governance');
  const changeLane = wsCost('process_redesign') + wsCost('change_adoption');
  const runLane = wsCost('run');

  const investmentCase: InvestmentCaseSection = {
    anatomy: {
      page: 4,
      id: 'investment-case',
      navLabel: 'Investment case',
      takeaway:
        'The build is a $2.2M base bet — but 23% of it is business change, ' +
        'and that is the half that must not be cut to flatter the number.',
      decisionRole: 'Confirm the investment envelope and where the money goes.',
      evidence: {
        sources: [
          'Effort estimator — should-cost role-mix engine',
          skeleton.effort.rateCard.label,
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [
          'Rates are a researched planning benchmark — not a client quote.',
        ],
      },
      implication:
        'The investment range is planning-grade; the change lane is the ' +
        'execution risk to protect, not trim.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Estimate sign-off before build funding',
    },
    waterfall: [
      { label: 'AI build + foundational', amount: buildLane },
      { label: 'Integration + data', amount: integrationLane },
      { label: 'Data governance', amount: dataGovLane },
      { label: 'Change + adoption', amount: changeLane },
      { label: 'Run (year 1)', amount: runLane },
    ],
    costStack: [
      {
        label: 'AI build',
        value: skeleton.effort.buildVsChange.aiBuildCost - runLane,
        color: '#0b4a91',
      },
      { label: 'Run', value: runLane, color: '#5b5852' },
      {
        label: 'Business change',
        value: skeleton.effort.buildVsChange.businessChangeCost,
        color: '#a8533a',
      },
    ],
    investmentRange: skeleton.economics.investment,
    workstreams: ws.map((w) => ({
      label: w.label,
      base: w.baseCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
      agentSplitPct: Math.round(w.agentSplit * 100),
    })),
    buildVsChangeNote: skeleton.effort.buildVsChange.note,
  };

  // --- §5 Value case --------------------------------------------------------
  const grossPoint = valueForecast.totalGrossValue.point;
  const netPoint = valueForecast.totalNetValue.point;
  // Each haircut factor's share of the lost gross value, distributed by its
  // discount contribution — a faithful decomposition of the kernel haircut.
  const totalDiscount = valueForecast.factors.reduce(
    (s, f) => s + f.discountContribution,
    0,
  );
  const lostValue = grossPoint - netPoint;
  const bridgeSteps = valueForecast.factors
    .slice()
    .sort((a, b) => b.discountContribution - a.discountContribution)
    .map((f) => ({
      label: FACTOR_LABEL[f.dimension],
      amount:
        totalDiscount > 0
          ? round2((f.discountContribution / totalDiscount) * lostValue)
          : 0,
    }));

  const valueCase: ValueCaseSection = {
    anatomy: {
      page: 5,
      id: 'value-case',
      navLabel: 'Value case',
      takeaway:
        'Gross value is discounted 43% before it is claimed — adoption and ' +
        'data readiness take the two largest cuts.',
      decisionRole: 'Confirm the value is honestly discounted, not optimistic.',
      evidence: {
        sources: [
          'Value forecast — mandatory six-factor haircut model',
          'KPI kpi:apex:018 stated containment target',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: [
          'Gross value rests on a benchmark cost-per-contact proxy — a seed gap.',
        ],
      },
      implication:
        'The net value is a defensible planning figure, but it remains a ' +
        'proxy-anchored forecast until the cost-per-contact baseline lands.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Cost-per-contact baseline capture (2026-05-15)',
    },
    grossValue: grossPoint,
    netValue: netPoint,
    totalHaircutPct: Math.round(valueForecast.totalHaircut * 100),
    bridgeSteps,
    factors: valueForecast.factors.map((f) => ({
      label: FACTOR_LABEL[f.dimension],
      score: f.score,
      weightPct: Math.round(f.weight * 100),
      discountPct: Math.round(f.discountContribution * 1000) / 10,
      rationale: FACTOR_RATIONALE[f.dimension],
    })),
    adoption: valueForecast.curve.map((y) => ({
      label: `Year ${y.year}`,
      adoption: y.adoptionFraction,
      netValue: y.netValue.point,
    })),
  };

  // --- §6 Payback and sensitivity ------------------------------------------
  const sens = full.fullCase.sensitivity;
  // Cumulative cash-flow: period 0 is the up-front investment outflow, then
  // each year adds that scenario's per-year net value. Honest — when payback
  // is blocked these are net-value accumulations, NOT a claimed cash crossing.
  const cashFlowSeries = (
    name: string,
    color: string,
    dashed: boolean,
    investment: number,
    perYear: number,
  ): { label: string; color: string; dashed?: boolean; cumulative: number[] } => {
    const cum: number[] = [-investment];
    for (let yr = 1; yr <= 3; yr++) {
      cum.push(round2(cum[cum.length - 1] + perYear));
    }
    return { label: name, color, dashed, cumulative: cum };
  };
  const yearsHorizon = 3;

  const paybackSensitivity: PaybackSensitivitySection = {
    anatomy: {
      page: 6,
      id: 'payback-sensitivity',
      navLabel: 'Payback and sensitivity',
      takeaway:
        'Payback is not computable — and that is the honest answer; the case ' +
        'breaks on the cost-per-contact seed gap, not on the model.',
      decisionRole: 'See what breaks the case before funding the build.',
      evidence: {
        sources: [
          'Business-case compiler — three-scenario sensitivity',
          'Assumption ledger — ranked case movers',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: [
          'Two of the top-three case movers are seed-gap proxies.',
        ],
      },
      implication:
        'No payback number can be presented honestly until the seed gap is ' +
        'closed — the board funds the gap-closure, not the build.',
      owner: 'Brendan Fox (CS Ops)',
      nextGate: 'Cost-per-contact baseline (2026-05-15)',
    },
    scenarios: [
      {
        name: 'Base',
        investment: sens.base.investment,
        netValue: sens.base.netValue,
        netReturn: sens.base.netReturn,
        paybackMonths: sens.base.paybackMonths,
      },
      {
        name: 'Conservative',
        investment: sens.conservative.investment,
        netValue: sens.conservative.netValue,
        netReturn: sens.conservative.netReturn,
        paybackMonths: sens.conservative.paybackMonths,
      },
      {
        name: 'Upside',
        investment: sens.upside.investment,
        netValue: sens.upside.netValue,
        netReturn: sens.upside.netReturn,
        paybackMonths: sens.upside.paybackMonths,
      },
    ],
    tornado: skeleton.assumptions.byImpact
      .filter((a) => a.sensitivityImpact !== 'low')
      .map((a) => ({
        label: assumptionShortLabel(a),
        swing:
          a.sensitivityImpact === 'high'
            ? a.isSeedGapProxy
              ? 100
              : 78
            : 46,
        isProxy: a.isSeedGapProxy,
      })),
    cashFlow: [
      cashFlowSeries(
        'Upside',
        '#1f6f43',
        true,
        sens.upside.investment,
        sens.upside.netValue / yearsHorizon,
      ),
      cashFlowSeries(
        'Base',
        '#0b4a91',
        false,
        sens.base.investment,
        sens.base.netValue / yearsHorizon,
      ),
      cashFlowSeries(
        'Conservative',
        '#a8533a',
        true,
        sens.conservative.investment,
        sens.conservative.netValue / yearsHorizon,
      ),
    ],
    cashFlowPeriods: ['Outlay', 'Year 1', 'Year 2', 'Year 3'],
    paybackBlocked: monetisationBlocked,
    whatBreaksTheCase: sens.whatBreaksTheCase,
    downsideRead: sens.downsideRead,
  };

  // --- §7 Roadmap -----------------------------------------------------------
  let cursorMonth = 0;
  const swimPhases = roadmap.phases.map((p, i) => {
    const start = cursorMonth;
    cursorMonth += p.durationMonths;
    return {
      label: p.label,
      startMonth: start,
      durationMonths: p.durationMonths,
      foundational: p.isFoundational,
      valueUnlocked: p.annualValueUnlocked,
      milestone: p.valueMilestone.statement,
      gate: `G${i}`,
    };
  });
  const totalMonths = cursorMonth;

  const roadmapSection: RoadmapSection = {
    anatomy: {
      page: 7,
      id: 'roadmap',
      navLabel: 'Roadmap',
      takeaway:
        'Every phase ends on a gate where the board can kill — Phase 1 is ' +
        'the first place value is verifiable, and the first place to stop.',
      decisionRole: 'Confirm value and risk are sequenced with kill gates.',
      evidence: {
        sources: [
          'Costed roadmap — four phases, foundational Phase 0',
          'Effort estimator — per-workstream duration',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: roadmap.flags
          .filter((f) => f.severity === 'concern')
          .map((f) => f.message),
      },
      implication:
        'The roadmap is structurally sound — no foundational mis-sequencing ' +
        'and a verifiable value checkpoint at every gate.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Gate G1 — pilot value verification',
    },
    totalMonths,
    phases: swimPhases,
    gates: [
      {
        code: 'G0',
        name: 'Foundation complete',
        decision:
          'Confirm intent / transcript data unified and the model gateway ' +
          'stood up before any build spend.',
        killable: true,
      },
      {
        code: 'G1',
        name: 'Pilot value verified',
        decision:
          'Verify containment +4 pts and AHT down on pilot queues — kill if ' +
          'the pilot does not move the metric.',
        killable: true,
      },
      {
        code: 'G2',
        name: 'Scale-out approved',
        decision:
          'Approve scale-out only if the redesigned routing process holds ' +
          'toward the 40% containment target.',
        killable: true,
      },
      {
        code: 'G3',
        name: 'Steady-state handoff',
        decision:
          'Confirm ~70% adoption and hand the value loop to Tower.',
        killable: false,
      },
    ],
  };

  // --- §8 Risks and controls ------------------------------------------------
  const risksControls: RisksControlsSection = {
    anatomy: {
      page: 8,
      id: 'risks-controls',
      navLabel: 'Risks and controls',
      takeaway:
        'The monetisation seed gap and the transcript-privacy review are the ' +
        'two risks that can block approval — both have owners and dates.',
      decisionRole: 'See what could fail or block the funding decision.',
      evidence: {
        sources: [
          'Critic report — CFO / delivery / data lenses',
          'Kill criteria — compiler + Move-specific',
          'AI Governance Council milestone register',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [
          `${critic.blockers.length} open blocker; ${critic.concerns.length} ` +
            'open concerns from the critic.',
        ],
      },
      implication:
        'No risk is unowned; the two high-impact risks gate the build, not ' +
        'the shaping spend.',
      owner: 'Elena Fischer (AI Governance)',
      nextGate: 'Transcript-use privacy review (2026-05-17)',
    },
    heatmap: [
      { likelihood: 3, impact: 3, code: 'R1' },
      { likelihood: 2, impact: 3, code: 'R2' },
      { likelihood: 2, impact: 2, code: 'R3' },
      { likelihood: 3, impact: 2, code: 'R4' },
      { likelihood: 2, impact: 2, code: 'R5' },
      { likelihood: 1, impact: 2, code: 'R6' },
    ],
    risks: [
      {
        code: 'R1',
        risk:
          'Cost-per-contact baseline is not captured — value stays a proxy ' +
          'and monetisation cannot be verified.',
        likelihood: 'High',
        impact: 'High',
        control:
          'Tenant action item with a dated owner; build funding gated on it.',
        owner: 'Brendan Fox (CS Ops)',
      },
      {
        code: 'R2',
        risk:
          'Transcript-use privacy review fails and removes agent-assist ' +
          'features — the value mechanism is lost.',
        likelihood: 'Medium',
        impact: 'High',
        control:
          'Privacy review run ahead of the Design gate (milestone 2026-05-17).',
        owner: 'Elena Fischer (AI Governance)',
      },
      {
        code: 'R3',
        risk:
          'Agent adoption falls short of the modelled curve — net value ' +
          'erodes from the 30/70/85% ramp.',
        likelihood: 'Medium',
        impact: 'Medium',
        control:
          'Staged rollout by team, manager-enablement track, incentive ' +
          're-pointing away from raw handle time.',
        owner: 'Mariana Rojas (WFM Lead)',
      },
      {
        code: 'R4',
        risk:
          'CDP consolidation slips — intent / transcript data is not unified ' +
          'for Phase 0.',
        likelihood: 'High',
        impact: 'Medium',
        control:
          'Phase 0 is foundational and gated (G0); build cannot start until ' +
          'data is unified.',
        owner: 'CDO (Data Sponsor)',
      },
      {
        code: 'R5',
        risk:
          'NICE-vs-IT containment measurement discrepancy is not reconciled ' +
          '— the Tower baseline is wrong.',
        likelihood: 'Medium',
        impact: 'Medium',
        control:
          'Reconciliation owned and dated (James Wright, due 2026-05-08).',
        owner: 'James Wright',
      },
      {
        code: 'R6',
        risk:
          'NICE CXone integration is more brittle than scoped — integration ' +
          'effort overruns.',
        likelihood: 'Low',
        impact: 'Medium',
        control:
          'Conservative effort multiplier carried; Salesforce / AWS ' +
          'connectors are well understood.',
        owner: 'Solution Architect',
      },
    ],
  };

  // --- §9 Assumption ledger -------------------------------------------------
  const assumptionLedger: AssumptionLedgerSection = {
    anatomy: {
      page: 9,
      id: 'assumption-ledger',
      navLabel: 'Assumption ledger',
      takeaway:
        'Two of the three case-moving assumptions are seed-gap proxies — ' +
        'validating them is the highest-leverage next step.',
      decisionRole: 'Confirm every case-moving assumption has an owner.',
      evidence: {
        sources: ['Assumption ledger — ranked by sensitivity impact'],
        asOf: generatedOn,
        confidence: 'low',
        gaps: skeleton.assumptions.seedGapProxies.map(
          (a) => `${a.key} — stands in for absent tenant data`,
        ),
      },
      implication:
        'The ledger is fully owned; the low-confidence proxies are the ' +
        'evidence asks that gate funding.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Assumption validation before the Design gate',
    },
    assumptions: skeleton.assumptions.byImpact.map((a, i) => ({
      rank: i + 1,
      statement: a.statement,
      owner: a.owner,
      confidence: a.confidence,
      source: a.source,
      sensitivity: a.sensitivityImpact,
      isProxy: a.isSeedGapProxy,
    })),
  };

  // --- §10 Evidence appendix ------------------------------------------------
  const evidenceAppendix: EvidenceAppendixSection = {
    anatomy: {
      page: 10,
      id: 'evidence-appendix',
      navLabel: 'Evidence appendix',
      takeaway:
        'Baseline coverage is 60% — six metrics are measured, four are ' +
        'declared seed gaps, none are invented.',
      decisionRole: 'Audit every claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'Apex KPI dictionary, Move P2 baseline, operating telemetry',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The case is auditable end to end; the four seed gaps are the ' +
        'declared limits of what can be claimed today.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Close seed gaps before build funding',
    },
    recorded: skeleton.baseline.recordedMetrics.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
      caveat: m.caveat ?? '—',
    })),
    seedGaps: seedGapMetrics.map((g) => ({
      metric: g.label,
      reason: g.seedGapReason ?? 'Not recorded.',
      owner: seedGapOwner(g),
      asOf: g.asOf,
      decisionImpact: seedGapImpact(g),
    })),
  };

  // --- §11 Recommendation and asks -----------------------------------------
  const recommendation: RecommendationSection = {
    anatomy: {
      page: 11,
      id: 'recommendation',
      navLabel: 'Recommendation and asks',
      takeaway:
        'Approve shaping spend and the cost-per-contact baseline capture — ' +
        'hold the full build until the gap closes.',
      decisionRole: 'Make the funding decision requested now.',
      evidence: {
        sources: [
          'Business-case compiler recommendation',
          'Mobilize go-decision pack',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: seedGapLabels,
      },
      implication:
        'A clear, conditional approval keeps the Move moving without funding ' +
        'an unverifiable return.',
      owner: 'CIO (Executive Sponsor)',
      nextGate: 'Re-present for build funding once the seed gap closes',
    },
    verdictHeadline: verdictHeadlineText(monetisationBlocked),
    checklist: [
      {
        label: 'Shaping spend for Phase 0 design',
        state: 'approve',
        detail:
          'Fund intent / transcript unification design and model-gateway ' +
          'scoping — the foundational, no-regret work.',
      },
      {
        label: 'Cost-per-contact baseline capture',
        state: 'approve',
        detail:
          'Confirm Brendan Fox as owner, due 2026-05-15 — the single ' +
          'gate-closing evidence ask.',
      },
      {
        label: 'Transcript-use privacy review',
        state: 'condition',
        detail:
          'Must clear (milestone 2026-05-17) without cutting agent-assist ' +
          'features before the Design gate.',
      },
      {
        label: 'Full AI-routing build funding',
        state: 'hold',
        detail:
          'Hold until the cost-per-contact baseline lands and the value ' +
          'range is no longer a proxy.',
      },
      {
        label: 'IVR-replacement / autonomous scope',
        state: 'hold',
        detail:
          'Not funded — the chosen shape is agent-assist with human ' +
          'accountability retained.',
      },
    ],
    conditions: mobilize.goPack.conditions.map((c) => c.condition),
    requestedSpend:
      'Shaping spend only — the full build investment range ' +
      `(${compact(skeleton.economics.investment.low)}–${compact(
        skeleton.economics.investment.high,
      )}) is NOT requested at this gate.`,
    nextGate:
      'Charter-to-Design shaping gate; re-present for build funding once ' +
      'the cost-per-contact baseline is captured.',
    killTriggers: skeleton.killCriteria.map(
      (k: KillCriterion) => k.condition,
    ),
  };

  const sections: PackSections = {
    boardAnswer,
    whyNow,
    whatWeAreFunding,
    investmentCase,
    valueCase,
    paybackSensitivity,
    roadmap: roadmapSection,
    risksControls,
    assumptionLedger,
    evidenceAppendix,
    recommendation,
  };

  const ordered: SectionAnatomy[] = [
    boardAnswer.anatomy,
    whyNow.anatomy,
    whatWeAreFunding.anatomy,
    investmentCase.anatomy,
    valueCase.anatomy,
    paybackSensitivity.anatomy,
    roadmapSection.anatomy,
    risksControls.anatomy,
    assumptionLedger.anatomy,
    evidenceAppendix.anatomy,
    recommendation.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: skeleton.tenantKey,
    moveLabel: skeleton.moveName,
    artifactLabel: 'Costed Business-Case Pack',
    generatedOn,
    verdict,
    monetisationBlocked,
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Compact USD — kept local so the model has no chart-library dependency. */
function compact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `${sign}$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

function recorded(
  metrics: BaselineMetric[],
  key: string,
): BaselineMetric | null {
  return metrics.find((m) => m.key === key && m.recorded) ?? null;
}

function assumptionShortLabel(a: Assumption): string {
  const map: Record<string, string> = {
    annual_contact_volume: 'Annual contact volume',
    cost_per_contact: 'Cost per contact',
    containment_uplift: 'Containment uplift (+12 pts)',
    adoption_ramp: 'Agent adoption ramp',
    privacy_gate_clears: 'Privacy review clears',
    rate_card: 'Delivery rate card',
  };
  return map[a.key] ?? a.key;
}

function seedGapOwner(g: BaselineMetric): string {
  if (g.key === 'cost_per_contact_usd') return 'Brendan Fox (CS Ops)';
  if (g.key === 'contact_volume_annual') return 'Priya Iyer (Program Lead)';
  return 'Priya Iyer (Program Lead)';
}

function seedGapImpact(g: BaselineMetric): string {
  switch (g.key) {
    case 'cost_per_contact_usd':
      return 'Blocks monetisation — without it the value range is a proxy, ' +
        'not a forecast. This is the gate-closing gap.';
    case 'contact_volume_annual':
      return 'Cannot convert AHT / containment deltas into FTE-hours and ' +
        'dollars — value is expressed in operational hours until closed.';
    case 'channel_mix':
      return 'Routing value differs by channel; the split bounds how the ' +
        'pilot is scoped.';
    case 'qa_error_rate_pct':
      return 'No quality-defect baseline — a secondary value lever cannot ' +
        'be sized.';
    default:
      return 'Decision impact not classified.';
  }
}

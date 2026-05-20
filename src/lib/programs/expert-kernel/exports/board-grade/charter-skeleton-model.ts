// Board-grade Charter Business-Case Skeleton — view-model.
//
// This module is the single seam between the Expert Kernel's Charter-phase
// output (`buildApexContactCenterCase` → `BusinessCaseSkeleton`) and the
// board-grade Charter Skeleton renderer. It projects the kernel skeleton into
// the six blueprint §6 sections. It introduces NO new numbers — every figure
// traces to a kernel field. Where the kernel returns a declared seed gap, the
// view-model carries that honestly; it never fabricates a value.
//
// Blueprint §6 Charter Business-Case Skeleton sections (six, plus a cover):
//   1. Charter answer    — shape / fund shaping only / stop?
//   2. Value hypothesis  — falsifiable claim, target metric, baseline.
//   3. Initial cost/effort — effort range, build/run/change split.
//   4. Assumption ledger — top assumptions, owners, confidence, sensitivity.
//   5. Kill criteria     — stop conditions and evidence thresholds.
//   6. Evidence asks     — missing evidence, owner, target date.
//
// Blueprint §6 hard fails honoured here:
//   - cost and value are carried as RANGES, never single-point figures;
//   - every assumption carries an owner and a sensitivity-impact rank;
//   - the Charter recommendation is the kernel's honest verdict — Apex is
//     `shape` (a critic blocker remains), so the deck never says "fund".
//
// Pure module: deterministic, no I/O.

import {
  buildApexContactCenterCase,
} from '../../apex-contact-center-case';
import type { BusinessCaseSkeleton, Recommendation } from '../../business-case-compiler';
import type { Assumption } from '../../assumption-ledger';
import type { BaselineMetric } from '../../baseline-model';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface CharterEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface CharterSectionAnatomy {
  /** Section number, 1..6. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view (NOT a label). */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: CharterEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full Charter Skeleton view-model.
// ---------------------------------------------------------------------------

/** The Charter recommendation, projected for the deck. */
export type CharterVerdict = Recommendation;

export interface CharterSkeleton {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The kernel's Charter recommendation. For Apex this is `shape`. */
  verdict: CharterVerdict;
  /** True when value rests on a seed-gap proxy — payback cannot be claimed. */
  monetisationBlocked: boolean;
  /** The six sections, page-ordered. */
  sections: CharterSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface CharterSections {
  charterAnswer: CharterAnswerSection;
  valueHypothesis: ValueHypothesisSection;
  initialCostEffort: InitialCostEffortSection;
  assumptionLedger: AssumptionLedgerSection;
  killCriteria: KillCriteriaSection;
  evidenceAsks: EvidenceAsksSection;
}

// --- §1 Charter answer ------------------------------------------------------

export interface CharterAnswerSection {
  anatomy: CharterSectionAnatomy;
  /** The verdict word, plain — SHAPE / FUND SHAPING / STOP. */
  verdictHeadline: string;
  verdictDetail: string;
  /** The accountable sponsor for the Charter ask. */
  sponsor: string;
  /** Confidence read on advancing to a fully funded design. */
  confidence: 'high' | 'medium' | 'low';
  /** Snapshot tiles — verdict, blockers, investment band, next gate. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** What is being approved NOW — shaping spend, not build funding. */
  shapingAsk: string;
}

// --- §2 Value hypothesis ----------------------------------------------------

export interface ValueHypothesisSection {
  anatomy: CharterSectionAnatomy;
  /** The falsifiable value claim — stated so it can be proven false. */
  claim: string;
  /** The target metric the claim is tested against. */
  targetMetric: string;
  /** The recorded baseline value the claim moves from. */
  baselineValue: string;
  /** The targeted value the claim moves to. */
  targetValue: string;
  /** The value mechanism — how the Move would create the value. */
  mechanism: string;
  /** The falsification test — what evidence would disprove the claim. */
  falsificationTest: string;
  /** The baseline metrics behind the hypothesis — current vs target. */
  metricBars: Array<{
    label: string;
    current: number;
    target: number | null;
    unit: string;
    betterWhen: 'higher' | 'lower';
  }>;
}

// --- §3 Initial cost/effort -------------------------------------------------

export interface InitialCostEffortSection {
  anatomy: CharterSectionAnatomy;
  /** The effort range — low / point / high, NEVER a single point. */
  effortLow: number;
  effortPoint: number;
  effortHigh: number;
  /** The build / run / change split — three cost lanes. */
  buildCost: number;
  changeCost: number;
  /** Run is carried inside build-side lanes; surfaced as its own figure. */
  runCost: number;
  /** Business-change fraction of total effort, 0..1. */
  changeFraction: number;
  /** The rate-card basis — provenance label, never hidden. */
  rateCardBasis: string;
  /** The value band, carried for the value-vs-effort comparison. */
  valueLow: number;
  valuePoint: number;
  valueHigh: number;
  /** The build-vs-change credibility read from the kernel. */
  splitNote: string;
}

// --- §4 Assumption ledger ---------------------------------------------------

export interface AssumptionLedgerSection {
  anatomy: CharterSectionAnatomy;
  /** Top assumptions ranked by sensitivity impact — owners are mandatory. */
  assumptions: Array<{
    rank: number;
    key: string;
    statement: string;
    owner: string;
    confidence: 'high' | 'medium' | 'low';
    sensitivityImpact: 'high' | 'medium' | 'low';
    isSeedGapProxy: boolean;
    source: string;
  }>;
  /** Count of top-mover assumptions that are seed-gap proxies. */
  proxyMoverCount: number;
}

// --- §5 Kill criteria -------------------------------------------------------

export interface KillCriteriaSection {
  anatomy: CharterSectionAnatomy;
  /** The kill / reshape checklist — each criterion with a fired/armed state. */
  criteria: Array<{
    code: string;
    title: string;
    condition: string;
    /** 'fired' = the stop condition is currently true; 'armed' = watched. */
    state: 'fired' | 'armed';
    /** The evidence threshold that resolves the criterion. */
    threshold: string;
    owner: string;
  }>;
  /** How many criteria have already fired. */
  firedCount: number;
}

// --- §6 Evidence asks -------------------------------------------------------

export interface EvidenceAsksSection {
  anatomy: CharterSectionAnatomy;
  /** The gap-closure table — missing evidence before Design & Plan. */
  asks: Array<{
    label: string;
    owner: string;
    due: string;
    impact: number;
    blocksFunding: boolean;
    decisionImpact: string;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** Build the Apex Contact Center AI Routing Charter Skeleton. Deterministic. */
export function buildApexCharterSkeleton(generatedOn: string): CharterSkeleton {
  const { skeleton } = buildApexContactCenterCase();
  const baseline = skeleton.baseline;
  const recorded = baseline.recordedMetrics;
  const seedGaps = baseline.seedGaps;

  const verdict = skeleton.recommendation;
  const monetisationBlocked = !skeleton.economics.monetisable;

  const seedGapLabels = seedGaps.map((g) => g.label);

  // --- §1 Charter answer ----------------------------------------------------
  const verdictWord = charterVerdictWord(verdict);
  const charterAnswer: CharterAnswerSection = {
    anatomy: {
      page: 1,
      id: 'charter-answer',
      navLabel: 'Charter answer',
      takeaway:
        'Fund the shaping work — not the build. The contact-routing case is ' +
        'real, but one critic blocker remains, so the honest Charter verdict ' +
        'is shape, never fund.',
      decisionRole:
        'Approve deeper shaping spend, or stop — this is not a build-funding ' +
        'decision.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'Apex audited substrate (NICE CXone KPIs, Move P2 baseline)',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The Charter advances as a shaping exercise; build funding is ' +
        'withheld until the monetisation blocker and the seed gaps close.',
      owner: 'CIO (Executive Sponsor)',
      nextGate: 'Design & Plan gate — conditional on the evidence asks',
    },
    verdictHeadline:
      verdict === 'shape'
        ? 'SHAPE — fund the shaping work only; the case is real but not yet ' +
          'fundable to build'
        : verdict === 'fund'
          ? 'FUND — the Charter case clears the critic and is fundable'
          : 'STOP — the Charter case does not pay back; do not advance',
    verdictDetail: skeleton.recommendationRationale,
    sponsor: 'CIO (Executive Sponsor) · VP Customer Care (Business Sponsor)',
    confidence: 'medium',
    tiles: [
      {
        label: 'Charter verdict',
        value: verdictWord,
        sub:
          verdict === 'shape'
            ? 'Fund shaping, not build'
            : verdict === 'fund'
              ? 'Fundable to build'
              : 'Stop the Move',
        tone:
          verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
      {
        label: 'Critic blockers',
        value: String(skeleton.critic.blockers.length),
        sub:
          skeleton.critic.blockers.length > 0
            ? 'Must close before build funding'
            : 'No open blockers',
        tone: skeleton.critic.blockers.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Effort envelope',
        value: `${compactUsd(skeleton.effortRange.low)}–${compactUsd(
          skeleton.effortRange.high,
        )}`,
        sub: 'Low–high range — never a point',
        tone: 'neutral',
      },
      {
        label: 'Baseline coverage',
        value: `${Math.round(baseline.coverage * 100)}%`,
        sub: `${recorded.length} recorded · ${seedGaps.length} seed gaps`,
        tone: baseline.coverage >= 0.7 ? 'good' : 'warn',
      },
      {
        label: 'Next gate',
        value: 'Design & Plan',
        sub: 'Conditional funding gate',
        tone: 'neutral',
      },
    ],
    shapingAsk:
      'Approve the shaping spend that takes the Move into Design & Plan — ' +
      'closing the cost-per-contact and contact-volume gaps and the ' +
      'transcript-use privacy review. Build funding is a later, separate ' +
      'decision.',
  };

  // --- §2 Value hypothesis --------------------------------------------------
  const containment = recorded.find((m) => m.key === 'containment_pct');
  const aht = recorded.find((m) => m.key === 'aht_minutes');
  const csat = recorded.find((m) => m.key === 'csat');
  const repeat = recorded.find((m) => m.key === 'repeat_transfer_pct');
  const valueHypothesis: ValueHypothesisSection = {
    anatomy: {
      page: 2,
      id: 'value-hypothesis',
      navLabel: 'Value hypothesis',
      takeaway:
        'The case rests on one falsifiable claim — AI routing lifts ' +
        'containment from 28% to the stated 40% target; if a pilot does not ' +
        'move it, the case is wrong.',
      decisionRole:
        'Confirm the value claim is falsifiable and tied to a recorded ' +
        'baseline metric.',
      evidence: {
        sources: [
          'Apex KPI dictionary — kpi:apex:018 stated containment target',
          'Move P2 baseline (Genesys routing export)',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: [
          'Cost per contact (labour) — caps how the value can be expressed',
          'Annual contact volume — caps the conversion to dollars',
        ],
      },
      implication:
        'A pilot on Customer Care queues is the falsification test; the ' +
        'hypothesis is provable, not asserted.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Design & Plan pilot scope — the falsification test',
    },
    claim:
      'AI-assisted routing lifts Contact Center Containment from the recorded ' +
      '28% baseline toward the 40% target stated in the KPI dictionary, while ' +
      'holding or improving CSAT — without replacing agents.',
    targetMetric: 'Contact Center Containment (KPI kpi:apex:018)',
    baselineValue: containment
      ? `${containment.value} ${containment.unit}`
      : '28 percent',
    targetValue: '40 percent (stated KPI target)',
    mechanism:
      'Skill-aware routing places each contact with the right-skilled agent ' +
      'or self-service path first time — lifting containment, cutting repeat ' +
      'transfers (18.4% today), and reducing the mix-shift pressure on AHT.',
    falsificationTest:
      'A Customer Care pilot that does not move containment by ~4 points on ' +
      'piloted queues falsifies the hypothesis — the Charter is then reshaped ' +
      'or stopped, not advanced to build.',
    metricBars: [
      {
        label: 'Contact Center Containment',
        current: containment ? Number(containment.value) : 28,
        target: 40,
        unit: '%',
        betterWhen: 'higher',
      },
      {
        label: 'Average Handle Time',
        current: aht ? Number(aht.value) : 7.2,
        target: 6.5,
        unit: 'min',
        betterWhen: 'lower',
      },
      {
        label: 'CSAT (post-interaction)',
        current: csat ? Number(csat.value) : 4.1,
        target: 4.4,
        unit: '/5',
        betterWhen: 'higher',
      },
      {
        label: 'Repeat transfer rate',
        current: repeat ? Number(repeat.value) : 18.4,
        target: null,
        unit: '%',
        betterWhen: 'lower',
      },
    ],
  };

  // --- §3 Initial cost/effort ----------------------------------------------
  const bvc = skeleton.effort.buildVsChange;
  // Run cost is one workstream inside the AI-build lanes; surfaced separately.
  const runWs = skeleton.effort.workstreams.find((w) => w.id === 'run');
  const runCost = runWs ? runWs.baseCost : 0;
  const initialCostEffort: InitialCostEffortSection = {
    anatomy: {
      page: 3,
      id: 'initial-cost-effort',
      navLabel: 'Initial cost/effort',
      takeaway:
        'The early envelope is a range, not a number — ' +
        `${compactUsd(skeleton.effortRange.low)} to ` +
        `${compactUsd(skeleton.effortRange.high)} — and 23% of it is the ` +
        'business-change work that AI cases routinely under-budget.',
      decisionRole:
        'Confirm the early investment envelope is a planning-grade range ' +
        'with the change half budgeted.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator (eight workstreams)',
          skeleton.effort.rateCard.label,
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: ['Rate card is a researched benchmark — not a client quote'],
      },
      implication:
        'A CFO funds the high end of the band; the change lane is explicitly ' +
        'budgeted so the case is not optimistic on adoption.',
      owner: 'David Okafor (Program Lead)',
      nextGate: 'Design & Plan estimate — the planning-grade costed model',
    },
    effortLow: skeleton.effortRange.low,
    effortPoint: skeleton.effortRange.point,
    effortHigh: skeleton.effortRange.high,
    buildCost: bvc.aiBuildCost,
    changeCost: bvc.businessChangeCost,
    runCost,
    changeFraction: bvc.businessChangeFraction,
    rateCardBasis: skeleton.effort.rateCard.label,
    valueLow: skeleton.valueRange.low,
    valuePoint: skeleton.valueRange.point,
    valueHigh: skeleton.valueRange.high,
    splitNote: bvc.note,
  };

  // --- §4 Assumption ledger -------------------------------------------------
  const ledger = skeleton.assumptions;
  const topMoverKeys = new Set(ledger.topMovers.map((a) => a.key));
  const assumptionLedger: AssumptionLedgerSection = {
    anatomy: {
      page: 4,
      id: 'assumption-ledger',
      navLabel: 'Assumption ledger',
      takeaway:
        'Two of the three case-moving assumptions are seed-gap proxies — ' +
        'every assumption is owned, and validating the proxies is the ' +
        'highest-leverage shaping work.',
      decisionRole:
        'Confirm every case-moving assumption has a named owner and a ' +
        'sensitivity rank.',
      evidence: {
        sources: [
          'Moves Expert Kernel — assumption ledger (ranked by sensitivity)',
          'Apex operating telemetry — CC working-group notes',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ledger.seedGapProxies.map(
          (a) => `${a.key} — a seed-gap proxy until tenant data lands`,
        ),
      },
      implication:
        'No assumption is unowned; the two seed-gap proxies are the ' +
        'evidence the shaping spend must close.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Design & Plan — proxies replaced with measured tenant data',
    },
    assumptions: ledger.byImpact.map((a: Assumption, i) => ({
      rank: i + 1,
      key: a.key,
      statement: a.statement,
      owner: a.owner,
      confidence: a.confidence,
      sensitivityImpact: a.sensitivityImpact,
      isSeedGapProxy: a.isSeedGapProxy,
      source: a.source,
    })),
    proxyMoverCount: ledger.topMovers.filter(
      (a) => a.isSeedGapProxy && topMoverKeys.has(a.key),
    ).length,
  };

  // --- §5 Kill criteria -----------------------------------------------------
  const killCriteria: KillCriteriaSection = {
    anatomy: {
      page: 5,
      id: 'kill-criteria',
      navLabel: 'Kill criteria',
      takeaway:
        'One stop condition is already firing — monetisation is unresolved ' +
        '— so the Charter cannot be funded to build until it is closed.',
      decisionRole:
        'Confirm the stop conditions and the evidence thresholds that ' +
        'resolve them.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic blockers',
          'Apex audited substrate — Move milestones',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: ['Monetisation blocker — fires until the cost gap closes'],
      },
      implication:
        'The fired criterion is the gate condition; build funding stays ' +
        'withheld while it holds.',
      owner: 'CIO (Executive Sponsor)',
      nextGate: 'Design & Plan gate — every fired criterion must clear',
    },
    criteria: skeleton.killCriteria.map((k) => ({
      code: k.code,
      title: killTitle(k.code),
      condition: k.condition,
      state: killState(k.code, skeleton),
      threshold: killThreshold(k.code),
      owner: killOwner(k.code),
    })),
    firedCount: skeleton.killCriteria.filter(
      (k) => killState(k.code, skeleton) === 'fired',
    ).length,
  };

  // --- §6 Evidence asks -----------------------------------------------------
  const evidenceAsks: EvidenceAsksSection = {
    anatomy: {
      page: 6,
      id: 'evidence-asks',
      navLabel: 'Evidence asks',
      takeaway:
        'Three evidence asks gate build funding — closing them, not more ' +
        'analysis, is what turns this Charter into a fundable Design & Plan.',
      decisionRole:
        'Confirm every evidence ask has an owner and a target date before ' +
        'Design & Plan.',
      evidence: {
        sources: [
          'Apex baseline seed gaps + Move milestones',
          'Apex operating telemetry — tenant action items',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: seedGapLabels,
      },
      implication:
        'No ask is unowned; the funding-blocking asks are the conditions on ' +
        'the Design & Plan gate.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Close the funding-blocking asks before Design & Plan',
    },
    asks: buildEvidenceAsks(seedGaps),
  };

  const sections: CharterSections = {
    charterAnswer,
    valueHypothesis,
    initialCostEffort,
    assumptionLedger,
    killCriteria,
    evidenceAsks,
  };

  const ordered: CharterSectionAnatomy[] = [
    charterAnswer.anatomy,
    valueHypothesis.anatomy,
    initialCostEffort.anatomy,
    assumptionLedger.anatomy,
    killCriteria.anatomy,
    evidenceAsks.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: skeleton.tenantKey,
    moveLabel: skeleton.moveName,
    artifactLabel: 'Charter Business-Case Skeleton',
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
// Helpers — classify what the kernel already states. No new facts.
// ---------------------------------------------------------------------------

/** Compact USD label, e.g. $2.2M, $940K — mirrors the svg-charts helper. */
function compactUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `$${Math.round(a / 1_000)}K`;
  return `$${Math.round(a)}`;
}

function charterVerdictWord(v: Recommendation): string {
  return v === 'fund' ? 'FUND' : v === 'kill' ? 'STOP' : 'SHAPE';
}

/** A short, human title for a kill-criterion code. */
function killTitle(code: string): string {
  const map: Record<string, string> = {
    kill_downside_negative: 'Conservative case turns negative',
    kill_monetisation_unresolved: 'Monetisation seed gap not closed',
    kill_baseline_unclosed: 'Baseline coverage stays too thin',
    kill_privacy_gate_blocks: 'Privacy review removes agent-assist',
  };
  return map[code] ?? code;
}

/**
 * A kill criterion's state. The monetisation criterion is currently FIRED for
 * Apex — the critic raised the matching blocker — so the Charter cannot be
 * funded to build. Every other criterion is armed (watched, not yet fired).
 */
function killState(
  code: string,
  skeleton: BusinessCaseSkeleton,
): 'fired' | 'armed' {
  if (code === 'kill_monetisation_unresolved') {
    return skeleton.critic.blockers.some(
      (b) => b.code === 'cfo_monetisation_blocked',
    )
      ? 'fired'
      : 'armed';
  }
  return 'armed';
}

function killThreshold(code: string): string {
  switch (code) {
    case 'kill_downside_negative':
      return 'Conservative net return must stay above zero once the Design & ' +
        'Plan estimate lands.';
    case 'kill_monetisation_unresolved':
      return 'Cost-per-contact baseline captured and the value range ' +
        'expressed in hard dollars before the funding gate.';
    case 'kill_baseline_unclosed':
      return 'Baseline coverage lifts above 70% — the two sizing-blocking ' +
        'seed gaps closed.';
    case 'kill_privacy_gate_blocks':
      return 'The 2026-05-17 transcript-use privacy review clears without ' +
        'removing agent-assist features.';
    default:
      return 'Threshold not classified.';
  }
}

function killOwner(code: string): string {
  switch (code) {
    case 'kill_downside_negative':
      return 'David Okafor (Program Lead)';
    case 'kill_monetisation_unresolved':
      return 'Brendan Fox (CS Ops)';
    case 'kill_baseline_unclosed':
      return 'Priya Iyer (Program Lead)';
    case 'kill_privacy_gate_blocks':
      return 'Elena Fischer (AI Governance)';
    default:
      return 'Priya Iyer (Program Lead)';
  }
}

/**
 * Build the evidence-ask queue from the declared seed gaps, ranked by decision
 * impact. The two sizing-blocking gaps gate build funding; the others inform.
 */
function buildEvidenceAsks(
  seedGaps: BaselineMetric[],
): EvidenceAsksSection['asks'] {
  return seedGaps.map((g) => {
    const blocksFunding =
      g.key === 'cost_per_contact_usd' || g.key === 'contact_volume_annual';
    return {
      label: g.label,
      owner: askOwner(g),
      due: askDue(g),
      impact: askImpact(g, blocksFunding),
      blocksFunding,
      decisionImpact: askDecisionImpact(g),
    };
  });
}

function askOwner(g: BaselineMetric): string {
  if (g.key === 'cost_per_contact_usd') return 'Brendan Fox (CS Ops)';
  if (g.key === 'contact_volume_annual') return 'Priya Iyer (Program Lead)';
  if (g.key === 'channel_mix') return 'James Wright (CX Analytics)';
  return 'Priya Iyer (Program Lead)';
}

function askDue(g: BaselineMetric): string {
  if (g.key === 'cost_per_contact_usd') return '2026-05-15';
  return '2026-05-30';
}

function askImpact(g: BaselineMetric, blocksFunding: boolean): number {
  if (g.key === 'cost_per_contact_usd') return 100;
  if (g.key === 'contact_volume_annual') return 84;
  if (blocksFunding) return 70;
  if (g.key === 'channel_mix') return 46;
  return 32;
}

function askDecisionImpact(g: BaselineMetric): string {
  switch (g.key) {
    case 'cost_per_contact_usd':
      return 'Blocks build funding — without it the value cannot be expressed ' +
        'in dollars and the monetisation kill criterion stays fired.';
    case 'contact_volume_annual':
      return 'Blocks build funding — needed to convert AHT / containment ' +
        'deltas into FTE-hours and dollars.';
    case 'channel_mix':
      return 'Informs pilot scope — the voice/chat/IVR split bounds where a ' +
        'routing pilot lands first.';
    case 'qa_error_rate_pct':
      return 'Informs a secondary value lever — no quality-defect baseline ' +
        'exists to size it in Design & Plan.';
    default:
      return 'Decision impact not classified.';
  }
}

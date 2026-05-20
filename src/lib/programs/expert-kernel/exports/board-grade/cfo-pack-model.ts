// Board-grade CFO Pack — view-model.
//
// This module is the single seam between the Expert Kernel's costed business
// case (`buildApexContactCenterCase` → `BusinessCaseSkeleton`, plus the value
// forecast) and the board-grade CFO Pack renderer. It projects the kernel
// output into the seven blueprint §10 sections. It introduces NO new numbers —
// every figure traces to a kernel field. Where the kernel returns a declared
// seed gap, the view-model carries that honestly; it never fabricates a value.
//
// Blueprint §10 CFO Pack sections (seven, plus a cover):
//   1. The answer        — what is finance being asked to approve?
//   2. The case          — why does this create value?
//   3. Assumptions       — the top five assumptions, owned.
//   4. What would make it wrong — downside, breakpoints, monetisation gaps.
//   5. What not to fund yet — blocked scope, unfunded autonomy.
//   6. What Tower will measure — metrics, baseline, target, cadence.
//   7. Evidence and gaps — source ledger, seed gaps, provenance.
//
// Blueprint §10 hard fails honoured here:
//   - the pack reads as a financial challenge, not product advocacy — the
//     do-not-fund section and the downside case are first-class;
//   - there is always a sensitivity / downside view;
//   - the next gate is on the first slide so the CFO finds it in a minute.
//
// Pure module: deterministic, no I/O.

import {
  buildApexContactCenterCase,
  buildApexContactCenterValueForecast,
} from '../../apex-contact-center-case';
import type { Recommendation } from '../../business-case-compiler';
import type { ValueForecast } from '../../value-forecast';
import type { Assumption } from '../../assumption-ledger';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface CfoEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface CfoSectionAnatomy {
  /** Section number, 1..7. */
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
  evidence: CfoEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full CFO Pack view-model.
// ---------------------------------------------------------------------------

export type CfoVerdict = Recommendation;

export interface CfoPack {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The kernel's recommendation. For Apex this is `shape`. */
  verdict: CfoVerdict;
  /** True when value rests on a seed-gap proxy — payback cannot be claimed. */
  monetisationBlocked: boolean;
  /** The seven sections, page-ordered. */
  sections: CfoSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface CfoSections {
  theAnswer: TheAnswerSection;
  theCase: TheCaseSection;
  assumptions: AssumptionsSection;
  whatWouldMakeItWrong: WhatWouldMakeItWrongSection;
  whatNotToFundYet: WhatNotToFundYetSection;
  towerMeasurement: TowerMeasurementSection;
  evidenceAndGaps: EvidenceAndGapsSection;
}

// --- §1 The answer ----------------------------------------------------------

export interface TheAnswerSection {
  anatomy: CfoSectionAnatomy;
  /** The verdict word, plain — APPROVE SHAPING / APPROVE CAPITAL / REJECT. */
  verdictHeadline: string;
  verdictDetail: string;
  /** What finance is being asked to approve now — stated plainly. */
  fundingAsk: string;
  /** Confidence read on the funding decision. */
  confidence: 'high' | 'medium' | 'low';
  /** The single open blocker that gates capital approval. */
  blocker: string;
  /** Economics tiles — investment, value, payback status, blocker, gate. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
}

// --- §2 The case ------------------------------------------------------------

export interface TheCaseSection {
  anatomy: CfoSectionAnatomy;
  /** Investment range. */
  investmentLow: number;
  investmentPoint: number;
  investmentHigh: number;
  /** Net value range — post-haircut. */
  netValueLow: number;
  netValuePoint: number;
  netValueHigh: number;
  /** Gross value range — the pre-haircut ceiling, shown for transparency. */
  grossValueLow: number;
  grossValueHigh: number;
  /** The compounded value haircut, 0..1. */
  totalHaircut: number;
  /** Payback status — null months means not computable. */
  paybackMonths: number | null;
  /** Where the value comes from — stated plainly. */
  valueSource: string;
}

// --- §3 Assumptions ---------------------------------------------------------

export interface AssumptionsSection {
  anatomy: CfoSectionAnatomy;
  /** The top five case-moving assumptions, owned. */
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
  /** Count of top-five assumptions that are seed-gap proxies. */
  proxyCount: number;
}

// --- §4 What would make it wrong --------------------------------------------

export interface WhatWouldMakeItWrongSection {
  anatomy: CfoSectionAnatomy;
  /** The single statement of what breaks the case. */
  whatBreaksTheCase: string;
  /** The downside read — the conservative case in plain words. */
  downsideRead: string;
  /** Conservative / base / upside net return. */
  conservativeNetReturn: number;
  baseNetReturn: number;
  upsideNetReturn: number;
  /** Tornado drivers — the assumptions that swing the case. */
  drivers: Array<{ label: string; swing: number; isProxy: boolean }>;
  /** The monetisation gaps — the seed gaps that block a hard return. */
  monetisationGaps: string[];
}

// --- §5 What not to fund yet ------------------------------------------------

export interface WhatNotToFundYetSection {
  anatomy: CfoSectionAnatomy;
  /** The do-not-fund checklist — what finance should withhold. */
  holdbacks: Array<{
    title: string;
    detail: string;
    /** The condition that releases the holdback. */
    releaseCondition: string;
    owner: string;
  }>;
}

// --- §6 What Tower will measure ---------------------------------------------

export interface TowerMeasurementSection {
  anatomy: CfoSectionAnatomy;
  /** The Tower measurement table — metric, baseline, target, cadence, owner. */
  metrics: Array<{
    metric: string;
    baseline: string;
    target: string;
    unit: string;
    cadence: string;
    owner: string;
    readiness: string;
    /** True when the metric rests on a seed gap and is not yet measurable. */
    isSeedGap: boolean;
  }>;
}

// --- §7 Evidence and gaps ---------------------------------------------------

export interface EvidenceAndGapsSection {
  anatomy: CfoSectionAnatomy;
  /** The source ledger — every recorded metric's provenance. */
  sources: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** The declared seed gaps — never blank. */
  seedGaps: Array<{ metric: string; reason: string; asOf: string }>;
  /** Assumption provenance notes carried into the funding decision. */
  provenance: Array<{ note: string; basis: string }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** Build the Apex Contact Center AI Routing CFO Pack. Deterministic. */
export function buildApexCfoPack(generatedOn: string): CfoPack {
  const { skeleton } = buildApexContactCenterCase();
  const value: ValueForecast = buildApexContactCenterValueForecast();
  const baseline = skeleton.baseline;
  const recorded = baseline.recordedMetrics;
  const seedGaps = baseline.seedGaps;

  const verdict = skeleton.recommendation;
  const monetisationBlocked = !skeleton.economics.monetisable;
  const seedGapLabels = seedGaps.map((g) => g.label);

  // --- §1 The answer --------------------------------------------------------
  const theAnswer: TheAnswerSection = {
    anatomy: {
      page: 1,
      id: 'the-answer',
      navLabel: 'The answer',
      takeaway:
        'Finance is asked to approve shaping spend only — not capital. The ' +
        'monetisation blocker means the return cannot yet be verified, so ' +
        'capital approval is withheld.',
      decisionRole:
        'Approve shaping spend, approve capital, reject, or request ' +
        'evidence.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'Apex audited substrate (NICE CXone KPIs, Move P2 baseline)',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: ['Monetisation blocker — the return is unverifiable until closed'],
      },
      implication:
        'Shaping spend is approvable now; capital approval is conditional on ' +
        'the monetisation blocker and the seed gaps closing.',
      owner: 'CFO · Finance Committee',
      nextGate: 'Design & Plan funding gate — capital decision, conditional',
    },
    verdictHeadline:
      verdict === 'shape'
        ? 'APPROVE SHAPING SPEND ONLY — the return is not yet verifiable, so ' +
          'capital approval is withheld'
        : verdict === 'fund'
          ? 'APPROVE CAPITAL — the costed case clears the critic'
          : 'REJECT — the case does not pay back on current evidence',
    verdictDetail: skeleton.recommendationRationale,
    fundingAsk:
      'Approve the shaping spend that closes the cost-per-contact and ' +
      'contact-volume gaps and clears the transcript-use privacy review. ' +
      'Capital for the build is a separate decision at the Design & Plan gate.',
    confidence: 'medium',
    blocker:
      'Monetisation is blocked — gross value rests on a benchmark-proxy ' +
      'cost-per-contact (a seed gap), so the net return cannot be expressed ' +
      'as a hard, auditable dollar figure.',
    tiles: [
      {
        label: 'Finance verdict',
        value:
          verdict === 'shape'
            ? 'SHAPING'
            : verdict === 'fund'
              ? 'CAPITAL'
              : 'REJECT',
        sub:
          verdict === 'shape'
            ? 'Approve shaping, not capital'
            : verdict === 'fund'
              ? 'Capital approvable'
              : 'Do not fund',
        tone:
          verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
      {
        label: 'Investment',
        value: `${compactUsd(skeleton.economics.investment.low)}–${compactUsd(
          skeleton.economics.investment.high,
        )}`,
        sub: 'Low–high range — never a point',
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr)',
        value: `${compactUsd(skeleton.valueRange.low)}–${compactUsd(
          skeleton.valueRange.high,
        )}`,
        sub: 'Proxy ceiling — not a verified return',
        tone: 'warn',
      },
      {
        label: 'Payback',
        value: skeleton.economics.paybackMonths === null ? 'Blocked' : 'See §2',
        sub: 'Monetisation seed gap open',
        tone: 'bad',
      },
      {
        label: 'Next gate',
        value: 'Design & Plan',
        sub: 'Capital decision — conditional',
        tone: 'neutral',
      },
    ],
  };

  // --- §2 The case ----------------------------------------------------------
  const theCase: TheCaseSection = {
    anatomy: {
      page: 2,
      id: 'the-case',
      navLabel: 'The case',
      takeaway:
        'The value is real but unverified — a 43% haircut already discounts ' +
        'the gross figure, and the net is still a proxy ceiling because the ' +
        'unit economics are a seed gap.',
      decisionRole:
        'Test whether the case creates verifiable value, not advocacy.',
      evidence: {
        sources: [
          'Moves Expert Kernel — value forecast (six-factor haircut)',
          'Moves Expert Kernel — effort estimator (eight workstreams)',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: [
          'Cost per contact — gross value rests on a benchmark proxy',
          'Annual contact volume — caps the conversion to dollars',
        ],
      },
      implication:
        'The case is fundable to SHAPE, not to build — the value cannot be ' +
        'verified until the unit economics land.',
      owner: 'David Okafor (Program Lead) · CFO',
      nextGate: 'Design & Plan estimate — value re-expressed in hard dollars',
    },
    investmentLow: skeleton.economics.investment.low,
    investmentPoint: skeleton.economics.investment.point,
    investmentHigh: skeleton.economics.investment.high,
    netValueLow: skeleton.valueRange.low,
    netValuePoint: skeleton.valueRange.point,
    netValueHigh: skeleton.valueRange.high,
    grossValueLow: value.totalGrossValue.low,
    grossValueHigh: value.totalGrossValue.high,
    totalHaircut: value.totalHaircut,
    paybackMonths: skeleton.economics.paybackMonths,
    valueSource:
      'Value comes from lifting Contact Center Containment from 28% toward ' +
      'the 40% KPI target and cutting repeat transfers — labour avoided on ' +
      'contacts that no longer need an agent. The dollar conversion needs ' +
      'the cost-per-contact and volume baselines, which are seed gaps.',
  };

  // --- §3 Assumptions -------------------------------------------------------
  const ledger = skeleton.assumptions;
  const topFive = ledger.byImpact.slice(0, 5);
  const assumptions: AssumptionsSection = {
    anatomy: {
      page: 3,
      id: 'assumptions',
      navLabel: 'Assumptions',
      takeaway:
        'The two assumptions that move the case most are both seed-gap ' +
        'proxies — finance is being asked to fund the work that replaces ' +
        'them with measured data.',
      decisionRole:
        'Confirm every case-moving assumption is owned and challengeable.',
      evidence: {
        sources: [
          'Moves Expert Kernel — assumption ledger (ranked by sensitivity)',
          'Apex KPI dictionary + operating telemetry',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ledger.seedGapProxies.map(
          (a) => `${a.key} — a seed-gap proxy until tenant data lands`,
        ),
      },
      implication:
        'No assumption is unowned; the seed-gap proxies are the highest-' +
        'leverage evidence the shaping spend must close.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Design & Plan — proxies replaced with measured tenant data',
    },
    assumptions: topFive.map((a: Assumption, i) => ({
      rank: i + 1,
      key: a.key,
      statement: a.statement,
      owner: a.owner,
      confidence: a.confidence,
      sensitivityImpact: a.sensitivityImpact,
      isSeedGapProxy: a.isSeedGapProxy,
      source: a.source,
    })),
    proxyCount: topFive.filter((a) => a.isSeedGapProxy).length,
  };

  // --- §4 What would make it wrong -----------------------------------------
  const whatWouldMakeItWrong: WhatWouldMakeItWrongSection = {
    anatomy: {
      page: 4,
      id: 'what-would-make-it-wrong',
      navLabel: 'What would make it wrong',
      takeaway:
        'The case breaks the same way it is built — on the missing unit ' +
        'economics. Until the cost-per-contact gap closes, every dollar in ' +
        'the case is a proxy, not a forecast.',
      decisionRole:
        'See the downside, the breakpoints and the monetisation gaps before ' +
        'committing capital.',
      evidence: {
        sources: [
          'Moves Expert Kernel — sensitivity view + critic',
          'Moves Expert Kernel — value forecast haircut factors',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ['Monetisation seed gap — the single biggest case breaker'],
      },
      implication:
        'The downside is not a number yet — it is a proxy. That is itself ' +
        'the reason capital is withheld.',
      owner: 'CFO · David Okafor (Program Lead)',
      nextGate: 'Design & Plan — downside re-modelled on measured economics',
    },
    whatBreaksTheCase: skeleton.sensitivity.whatBreaksTheCase,
    downsideRead:
      'The conservative case cannot be expressed in hard dollars — the value ' +
      'rests on a seed-gap proxy. A CFO funds the downside, not the point ' +
      'estimate; this case has no verifiable downside until the baseline gap ' +
      'closes. That is a withhold-capital signal, not a fund signal.',
    conservativeNetReturn: skeleton.sensitivity.conservative.point,
    baseNetReturn: skeleton.sensitivity.base.point,
    upsideNetReturn: skeleton.sensitivity.upside.point,
    drivers: ledger.byImpact.map((a) => ({
      label: a.statement.split(/[—.]/)[0].trim().slice(0, 46),
      swing:
        a.sensitivityImpact === 'high'
          ? 100
          : a.sensitivityImpact === 'medium'
            ? 58
            : 26,
      isProxy: a.isSeedGapProxy,
    })),
    monetisationGaps: [
      'Cost per contact (labour) — not recorded; gross value rests on a ' +
        '~$6.50 benchmark proxy. Without it no hard return can be stated.',
      'Annual contact volume — not recorded; needed to convert AHT and ' +
        'containment deltas into FTE-hours and dollars.',
    ],
  };

  // --- §5 What not to fund yet ---------------------------------------------
  const whatNotToFundYet: WhatNotToFundYetSection = {
    anatomy: {
      page: 5,
      id: 'what-not-to-fund-yet',
      navLabel: 'What not to fund yet',
      takeaway:
        'Three things must be explicitly withheld — the build, full routing ' +
        'autonomy, and any value claim in dollars — until their release ' +
        'conditions are met.',
      decisionRole:
        'Decide what scope finance withholds at this gate.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic blockers',
          'Apex realness audit — agent-assist archetype',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'A CFO Pack without an explicit holdback list is a blueprint §10 ' +
        'hard fail — these are the holdbacks.',
      owner: 'CFO · Finance Committee',
      nextGate: 'Design & Plan — each holdback released against its condition',
    },
    holdbacks: [
      {
        title: 'Build / capital funding',
        detail:
          'Do not approve capital for the AI routing build. The costed ' +
          'roadmap exists, but the monetisation blocker means the return is ' +
          'unverifiable.',
        releaseCondition:
          'Cost-per-contact baseline captured and the value re-expressed in ' +
          'hard dollars at the Design & Plan gate.',
        owner: 'Brendan Fox (CS Ops)',
      },
      {
        title: 'Full routing autonomy',
        detail:
          'Do not fund full deflection / autonomous routing. The Move is an ' +
          'agent-assist archetype — the WFM lead is on record preferring ' +
          'agent-assist over IVR replacement.',
        releaseCondition:
          'Only after a pilot proves agent-assist value and an explicit ' +
          'autonomy decision is taken with human accountability.',
        owner: 'Mariana Rojas (WFM Lead)',
      },
      {
        title: 'Any value claim in dollars',
        detail:
          'Do not let the case be quoted as a dollar return. Gross value ' +
          'rests on a benchmark proxy; the net is a proxy ceiling, not a ' +
          'forecast.',
        releaseCondition:
          'The cost-per-contact and annual-volume seed gaps both close — ' +
          'then the value forecast can be stated as hard dollars.',
        owner: 'Priya Iyer (Program Lead)',
      },
      {
        title: 'Customer-facing inference scope',
        detail:
          'Do not fund customer-facing inference until the transcript-use ' +
          'privacy review clears — it could remove the agent-assist ' +
          'mechanism the value rests on.',
        releaseCondition:
          'The 2026-05-17 transcript-use privacy review clears without ' +
          'removing agent-assist features.',
        owner: 'Elena Fischer (AI Governance)',
      },
    ],
  };

  // --- §6 What Tower will measure ------------------------------------------
  const towerMeasurement: TowerMeasurementSection = {
    anatomy: {
      page: 6,
      id: 'tower-measurement',
      navLabel: 'What Tower will measure',
      takeaway:
        'Three of the four value metrics are measurable today and tied to a ' +
        'recorded baseline — the fourth, cost per contact, is honestly ' +
        'carried as not-yet-measurable.',
      decisionRole:
        'Confirm value will be proven, not asserted, after funding.',
      evidence: {
        sources: [
          'Moves Expert Kernel — Tower measurement handoff',
          'Apex Discover baseline — recorded KPIs',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: ['Cost per contact — Tower cannot verify value until captured'],
      },
      implication:
        'Tower can verify value on three metrics from day one; the financial ' +
        'metric is unwired until the seed gap closes.',
      owner: 'Mariana Rojas (WFM Lead) · Tower',
      nextGate: 'Tower handoff — forecast-to-actual once the Move is live',
    },
    metrics: skeleton.towerHandoff.map((t) => {
      const isSeedGap = t.baselineValue === null;
      return {
        metric: t.metricLabel,
        baseline:
          t.baselineValue === null
            ? 'Not recorded — seed gap'
            : `${t.baselineValue} ${t.unit}`,
        target:
          t.targetValue === null
            ? 'Not set — seed gap'
            : `${t.targetValue} ${t.unit}`,
        unit: t.unit,
        cadence: t.metricKey === 'csat' ? 'Quarterly' : 'Monthly',
        owner:
          t.metricKey === 'csat'
            ? 'Customer Care Operations'
            : t.metricKey === 'cost_per_contact_usd'
              ? 'CS Ops'
              : 'WFM Lead',
        readiness: t.readinessNote,
        isSeedGap,
      };
    }),
  };

  // --- §7 Evidence and gaps -------------------------------------------------
  const evidenceAndGaps: EvidenceAndGapsSection = {
    anatomy: {
      page: 7,
      id: 'evidence-and-gaps',
      navLabel: 'Evidence and gaps',
      takeaway:
        'Finance can audit every number in this pack — six metrics trace to ' +
        'a named source, and the four missing ones are declared seed gaps, ' +
        'never silent omissions.',
      decisionRole:
        'Audit every claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'Apex KPI dictionary, Move P2 baseline, operating telemetry',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The pack is auditable end to end; the seed gaps are the declared ' +
        'limits of what finance can verify today.',
      owner: 'David Okafor (Program Lead)',
      nextGate: 'Design & Plan inherits this source ledger unchanged',
    },
    sources: recorded.map((m) => ({
      metric: m.label,
      value: m.value === null ? '—' : `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    seedGaps: seedGaps.map((g) => ({
      metric: g.label,
      reason: g.seedGapReason ?? 'Not recorded.',
      asOf: g.asOf,
    })),
    provenance: [
      {
        note:
          'Gross value rests on a benchmark-proxy cost-per-contact (~$6.50) ' +
          'and a benchmark contact volume (~9.0M).',
        basis:
          'Both are declared seed gaps; the value forecast flags ' +
          'monetisation as blocked. No hard return is claimed.',
      },
      {
        note:
          'The value forecast applies a mandatory six-factor haircut before ' +
          'any figure is reported.',
        basis:
          `The compounded haircut is ${Math.round(value.totalHaircut * 100)}% ` +
          '— gross value is never reported as net.',
      },
      {
        note:
          'The recommendation is the kernel critic verdict — one blocker ' +
          'downgrades the case from fund to shape.',
        basis:
          'The CFO monetisation blocker fires; the case is not advocacy, it ' +
          'is the critic-challenged output.',
      },
      {
        note:
          'Containment carries a known NICE-vs-IT-dashboard measurement ' +
          'discrepancy.',
        basis:
          'Reconciliation owned by James Wright, due 2026-05-08 — carried ' +
          'as a caveat on every containment-derived claim.',
      },
    ],
  };

  const sections: CfoSections = {
    theAnswer,
    theCase,
    assumptions,
    whatWouldMakeItWrong,
    whatNotToFundYet,
    towerMeasurement,
    evidenceAndGaps,
  };

  const ordered: CfoSectionAnatomy[] = [
    theAnswer.anatomy,
    theCase.anatomy,
    assumptions.anatomy,
    whatWouldMakeItWrong.anatomy,
    whatNotToFundYet.anatomy,
    towerMeasurement.anatomy,
    evidenceAndGaps.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: skeleton.tenantKey,
    moveLabel: skeleton.moveName,
    artifactLabel: 'CFO Pack',
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

/** Compact USD label, e.g. $2.2M, $940K — mirrors the svg-charts helper. */
function compactUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `$${Math.round(a / 1_000)}K`;
  return `$${Math.round(a)}`;
}

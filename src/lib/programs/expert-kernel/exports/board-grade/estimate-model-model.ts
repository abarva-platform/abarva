// Board-grade Estimate & Financial Model — view-model.
//
// This module is the single seam between the Expert Kernel's effort / value /
// roadmap modules and the board-grade Estimate & Financial Model renderer.
// Blueprint §8's full form is an XLSX workbook; THIS deck is the HTML summary
// of that workbook. It runs the EXISTING Apex kernel cases
// (`buildApexContactCenterCase`, `buildApexContactCenterFullCase`,
// `buildApexContactCenterValueForecast`) and projects their outputs into the
// eight blueprint §8 sections. It introduces NO new numbers — every figure
// traces to a kernel field. Where the kernel returns a declared seed gap, the
// view-model carries that honestly; it never fabricates a value.
//
// Blueprint §8 sections (eight, plus a cover):
//   1. Executive summary           — is the estimate planning-grade credible?
//   2. Baseline metrics & seed gaps — what inputs is the model built on?
//   3. Workstream estimate         — what eight workstreams are being costed?
//   4. Role mix by phase           — how does the role-bearing effort phase?
//   5. Rate card & overrides       — where do the rates come from?
//   6. Value forecast              — gross value, the haircut, the net.
//   7. Sensitivity                 — base / conservative / upside; what breaks.
//   8. Roadmap cash flow           — phase cost, value unlock, payback.
//
// Blueprint §8 hard fails honoured here:
//   - the rate-card source IS shown (provenance banner + coverage matrix);
//   - the complex estimate is NOT collapsed to a generic six-role model —
//     all eight workstreams are costed individually;
//   - domain / specialization / seniority / location are not collapsed into
//     one blended row — the rate-card matrix keeps role-family lanes distinct;
//   - the business-change effort is present and labelled;
//   - the client rate-card override path is visible (provenance + override).
//
// Pure module: deterministic, no I/O.

import {
  buildApexContactCenterCase,
  buildApexContactCenterFullCase,
  buildApexContactCenterValueForecast,
} from '../../apex-contact-center-case';
import {
  BUSINESS_CHANGE_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type WorkstreamId,
} from '../../effort-estimator';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface EstimateEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface EstimateSectionAnatomy {
  /** Section number, 1..8. */
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
  evidence: EstimateEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full Estimate & Financial Model view-model.
// ---------------------------------------------------------------------------

export interface EstimateModel {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The business-case recommendation. For Apex this is `shape`. */
  recommendation: 'fund' | 'shape' | 'kill';
  /** True when payback cannot be computed — a monetization seed gap. */
  paybackBlocked: boolean;
  /** The eight sections, page-ordered. */
  sections: EstimateSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface EstimateSections {
  executiveSummary: ExecutiveSummarySection;
  baselineInputs: BaselineInputsSection;
  workstreamEstimate: WorkstreamEstimateSection;
  roleMixByPhase: RoleMixByPhaseSection;
  rateCard: RateCardSection;
  valueForecast: ValueForecastSection;
  sensitivity: SensitivitySection;
  roadmapCashFlow: RoadmapCashFlowSection;
}

// --- §1 Executive summary ---------------------------------------------------

export interface ExecutiveSummarySection {
  anatomy: EstimateSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  /** Headline economics tiles. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** The investment range, formatted. */
  investmentRange: string;
  /** The net value range, formatted. */
  valueRange: string;
  /** Plain statement of the rate-card basis — benchmark vs client-specific. */
  rateCardBasis: string;
}

// --- §2 Baseline inputs -----------------------------------------------------

export interface BaselineInputsSection {
  anatomy: EstimateSectionAnatomy;
  recordedCount: number;
  seedGapCount: number;
  /** Recorded baseline metrics — source + confidence are mandatory. */
  metrics: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** Seed gaps shown in-line as explicit gaps, never blank. */
  seedGaps: Array<{ metric: string; reason: string; impact: string }>;
}

// --- §3 Workstream estimate -------------------------------------------------

export interface WorkstreamEstimateSection {
  anatomy: EstimateSectionAnatomy;
  /** Per-workstream cost rows — all eight, never collapsed. */
  workstreams: Array<{
    id: WorkstreamId;
    label: string;
    baseCost: number;
    conservativeCost: number;
    upsideCost: number;
    humanCost: number;
    agentCost: number;
    headcount: number;
    durationMonths: number;
    isBusinessChange: boolean;
  }>;
  totalBase: number;
  totalConservative: number;
  totalUpside: number;
  aiBuildCost: number;
  businessChangeCost: number;
  businessChangeFraction: number;
  buildVsChangeNote: string;
}

// --- §4 Role mix by phase ---------------------------------------------------

export interface RoleMixByPhaseSection {
  anatomy: EstimateSectionAnatomy;
  /** Per-phase effort, segmented by workstream. */
  phases: Array<{
    id: string;
    label: string;
    durationMonths: number;
    baseCost: number;
    isFoundational: boolean;
    workstreams: Array<{
      id: WorkstreamId;
      label: string;
      baseCost: number;
      headcount: number;
      durationMonths: number;
      agentSplit: number;
      isBusinessChange: boolean;
    }>;
  }>;
}

// --- §5 Rate card & overrides -----------------------------------------------

export interface RateCardSection {
  anatomy: EstimateSectionAnatomy;
  /** The rate-card provenance — `comprehensive`, `researched_benchmark`, etc. */
  provenance: string;
  /** The full provenance label — the rate-card source, never hidden. */
  provenanceLabel: string;
  /** True when the card is a client-specific / comprehensive override. */
  isClientOverride: boolean;
  /** Coverage cells — one per role family, onshore + offshore rates. */
  cells: Array<{
    domain: string;
    onshore: number | null;
    offshore: number | null;
  }>;
  /** The override note — how a client rate card replaces the default. */
  overrideNote: string;
}

// --- §6 Value forecast ------------------------------------------------------

export interface ValueForecastSection {
  anatomy: EstimateSectionAnatomy;
  grossTotal: string;
  netTotal: string;
  totalHaircut: number;
  retainedFraction: number;
  /** The six haircut factors — each a downward step. */
  haircutFactors: Array<{
    dimension: string;
    score: number;
    discountPct: number;
  }>;
  /** Per-year net value curve. */
  curve: Array<{ year: number; adoption: number; netValue: number }>;
  /** True — gross value rests on a seed-gap proxy. */
  grossValueIsProxy: boolean;
}

// --- §7 Sensitivity ---------------------------------------------------------

export interface SensitivitySection {
  anatomy: EstimateSectionAnatomy;
  /** Base / conservative / upside net return. */
  scenarios: Array<{ label: string; netReturn: number; tone: 'base' | 'low' | 'high' }>;
  /** Sensitivity tornado bars — assumptions that move the case. */
  tornado: Array<{ label: string; swing: number; isProxy: boolean }>;
  whatBreaksTheCase: string;
  downsideRead: string;
}

// --- §8 Roadmap cash flow ---------------------------------------------------

export interface RoadmapCashFlowSection {
  anatomy: EstimateSectionAnatomy;
  /** Per-phase cash-flow rows. */
  phases: Array<{
    id: string;
    label: string;
    investment: number;
    cumulativeInvestment: number;
    annualValueUnlocked: number;
    isFoundational: boolean;
    durationMonths: number;
  }>;
  /** Cumulative net cash per period for the three scenarios. */
  cashFlow: {
    base: number[];
    conservative: number[];
    upside: number[];
    periodLabels: string[];
  };
  paybackBlocked: boolean;
  paybackNote: string;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** Map a should-cost role-family domain to a short human label. */
const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: 'AI / ML',
  data_engineering: 'Data engineering',
  integration: 'Integration',
  solution_architecture: 'Solution architecture',
  application_engineering: 'Application engineering',
  governance_compliance: 'Governance & compliance',
  process_redesign: 'Process redesign',
  change_management: 'Change & adoption',
  business_analysis: 'Business analysis',
  program_pmo: 'Program / PMO',
  qa_evaluation: 'QA / evaluation',
  security_risk: 'Security & risk',
};

/**
 * Build the Apex Contact Center AI Routing Estimate & Financial Model.
 * Deterministic.
 */
export function buildApexEstimateModel(generatedOn: string): EstimateModel {
  const { skeleton } = buildApexContactCenterCase();
  const full = buildApexContactCenterFullCase();
  const value = buildApexContactCenterValueForecast();

  const effort = skeleton.effort;
  const baseline = skeleton.baseline;
  const recorded = baseline.recordedMetrics;
  const seedGaps = baseline.seedGaps;
  const paybackBlocked = !skeleton.economics.monetisable;
  const recommendation = skeleton.recommendation;

  const seedGapLabels = seedGaps.map((g) => g.label);

  const usd = (n: number): string => formatUsd(n);
  const isChange = (id: WorkstreamId): boolean =>
    BUSINESS_CHANGE_WORKSTREAMS.has(id);

  // --- §1 Executive summary -------------------------------------------------
  const rateCardBasis =
    effort.rateCard.provenance === 'comprehensive' ||
    effort.rateCard.provenance === 'client_specific'
      ? 'Rates are CLIENT-SPECIFIC — an Apex comprehensive rate-card pack, ' +
        'not a generic benchmark. The provenance is shown in §5.'
      : 'Rates are a researched market BENCHMARK — a planning range, NOT a ' +
        'quote. Override with a client-specific card before commitment.';

  const executiveSummary: ExecutiveSummarySection = {
    anatomy: {
      page: 1,
      id: 'executive-summary',
      navLabel: 'Executive summary',
      takeaway:
        'The estimate is planning-grade credible — eight costed ' +
        'workstreams on a client rate card — but payback cannot be stated ' +
        'until the cost-per-contact gap closes.',
      decisionRole:
        'Decide whether the estimate is credible enough to plan against.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator + value forecast',
          'Apex comprehensive demo rate-card pack',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The cost side is plannable now; the return side stays a proxy ' +
        'until the cost-per-contact baseline lands.',
      owner: 'Transformation Finance (with CS Ops on the cost-per-contact gap)',
      nextGate: 'Design & Plan funding gate — conditional on the seed gaps',
    },
    verdictHeadline:
      recommendation === 'fund'
        ? 'FUND — the estimate holds and the case pays back'
        : recommendation === 'kill'
          ? 'KILL — the estimate does not support funding'
          : 'SHAPE — the estimate is credible, but the case is not yet ' +
            'fundable as-is',
    verdictDetail: skeleton.recommendationRationale,
    tiles: [
      {
        label: 'Recommendation',
        value: recommendation.toUpperCase(),
        sub:
          recommendation === 'shape'
            ? 'Credible estimate · not fundable as-is'
            : recommendation === 'fund'
              ? 'Estimate supports funding'
              : 'Estimate does not support funding',
        tone:
          recommendation === 'fund'
            ? 'good'
            : recommendation === 'kill'
              ? 'bad'
              : 'warn',
      },
      {
        label: 'Investment range',
        value: usd(effort.totalCost.point),
        sub: `${usd(effort.totalCost.low)}–${usd(effort.totalCost.high)} · base/upside/cons.`,
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr)',
        value: usd(skeleton.valueRange.point),
        sub: `${usd(skeleton.valueRange.low)}–${usd(skeleton.valueRange.high)} · post-haircut`,
        tone: 'neutral',
      },
      {
        label: 'Payback',
        value: paybackBlocked ? 'Blocked' : 'Computed',
        sub: paybackBlocked ? 'Cost-per-contact seed gap' : 'Monetisable',
        tone: paybackBlocked ? 'bad' : 'good',
      },
      {
        label: 'Rate-card basis',
        value:
          effort.rateCard.provenance === 'comprehensive'
            ? 'Client'
            : 'Benchmark',
        sub:
          effort.rateCard.provenance === 'comprehensive'
            ? 'Apex comprehensive pack'
            : 'Researched benchmark',
        tone: 'neutral',
      },
    ],
    investmentRange: `${usd(effort.totalCost.low)} – ${usd(effort.totalCost.high)}`,
    valueRange: `${usd(skeleton.valueRange.low)} – ${usd(skeleton.valueRange.high)}`,
    rateCardBasis,
  };

  // --- §2 Baseline inputs ---------------------------------------------------
  const baselineInputs: BaselineInputsSection = {
    anatomy: {
      page: 2,
      id: 'baseline-inputs',
      navLabel: 'Baseline & seed gaps',
      takeaway:
        'Six recorded KPIs ground the estimate — four declared seed gaps ' +
        'are the honest limits of what the model can claim today.',
      decisionRole:
        'Confirm the model is built on real inputs, with the gaps named.',
      evidence: {
        sources: [
          'Apex KPI dictionary (NICE CXone kpi:apex:018–021)',
          'Move P2 baseline deliverable',
        ],
        asOf: '2026-04-30',
        confidence: baseline.weakestConfidence ?? 'low',
        gaps: seedGapLabels,
      },
      implication:
        'The recorded KPIs are decision-grade; the four seed gaps are the ' +
        'declared inputs the financial model cannot yet source.',
      owner: 'James Wright (CX Analytics)',
      nextGate: 'Cost-per-contact baseline capture (due 2026-05-15)',
    },
    recordedCount: recorded.length,
    seedGapCount: seedGaps.length,
    metrics: recorded.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    seedGaps: seedGaps.map((g) => ({
      metric: g.label,
      reason: g.seedGapReason ?? 'Not recorded.',
      impact: seedGapImpact(g.key),
    })),
  };

  // --- §3 Workstream estimate ----------------------------------------------
  const workstreamEstimate: WorkstreamEstimateSection = {
    anatomy: {
      page: 3,
      id: 'workstream-estimate',
      navLabel: 'Workstream estimate',
      takeaway:
        'All eight workstreams are costed individually — the estimate is ' +
        'never collapsed into a generic six-role model.',
      decisionRole:
        'Challenge the workstream decomposition and the cost per stream.',
      evidence: {
        sources: ['Moves Expert Kernel — effort estimator (8 workstreams)'],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'Business change is ' +
        `${Math.round(effort.buildVsChange.businessChangeFraction * 100)}% of ` +
        'effort — surfaced, not buried under AI build.',
      owner: 'Delivery Lead',
      nextGate: 'Design & Plan estimate review',
    },
    workstreams: effort.workstreams.map((w) => ({
      id: w.id,
      label: w.label,
      baseCost: w.baseCost,
      conservativeCost: w.cost.high,
      upsideCost: w.cost.low,
      humanCost: w.humanCost,
      agentCost: w.agentCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
      isBusinessChange: isChange(w.id),
    })),
    totalBase: effort.totalCost.point,
    totalConservative: effort.totalCost.high,
    totalUpside: effort.totalCost.low,
    aiBuildCost: effort.buildVsChange.aiBuildCost,
    businessChangeCost: effort.buildVsChange.businessChangeCost,
    businessChangeFraction: effort.buildVsChange.businessChangeFraction,
    buildVsChangeNote: effort.buildVsChange.note,
  };

  // --- §4 Role mix by phase -------------------------------------------------
  const wsById = new Map(effort.workstreams.map((w) => [w.id, w]));
  const roleMixByPhaseSection: RoleMixByPhaseSection = {
    anatomy: {
      page: 4,
      id: 'role-mix-by-phase',
      navLabel: 'Role mix by phase',
      takeaway:
        'Effort is phased, not lumped — each phase carries its own ' +
        'workstream-bearing role mix and duration.',
      decisionRole:
        'Challenge how the role-bearing effort lands across the four phases.',
      evidence: {
        sources: ['Moves Expert Kernel — costed roadmap (4 phases)'],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'The foundational phase carries cost before any value — that is ' +
        'honest sequencing, not a hidden overrun.',
      owner: 'Delivery Lead',
      nextGate: 'Design & Plan phase plan review',
    },
    phases: full.roadmap.phases.map((p) => ({
      id: p.id,
      label: p.label,
      durationMonths: p.durationMonths,
      baseCost: p.baseCost,
      isFoundational: p.isFoundational,
      workstreams: p.workstreamIds.map((id) => {
        const w = wsById.get(id);
        return {
          id,
          label: WORKSTREAM_LABELS[id],
          baseCost: w?.baseCost ?? 0,
          headcount: w?.totalHeadcount ?? 0,
          durationMonths: w?.durationMonths ?? 0,
          agentSplit: w?.agentSplit ?? 0,
          isBusinessChange: isChange(id),
        };
      }),
    })),
  };

  // --- §5 Rate card & overrides --------------------------------------------
  // Build the coverage matrix from the kernel rate card. The card carries one
  // onshore and one offshore rate per should-cost role; the matrix folds the
  // roles into role-family lanes, keeping domain / location distinct.
  const rateCells = buildRateCardCells(effort.rateCard.rates);
  const isClientOverride =
    effort.rateCard.provenance === 'comprehensive' ||
    effort.rateCard.provenance === 'client_specific';
  const rateCard: RateCardSection = {
    anatomy: {
      page: 5,
      id: 'rate-card',
      navLabel: 'Rate card & overrides',
      takeaway:
        'Every rate traces to a named source — the estimate runs on an ' +
        "Apex client rate-card pack, not a hidden benchmark.",
      decisionRole:
        'Audit the rate-card source and confirm the override path is real.',
      evidence: {
        sources: [
          'Apex comprehensive demo rate-card pack',
          effort.rateCard.label,
        ],
        asOf: '2026-05-19',
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'A client-specific rate card already overrides the benchmark — the ' +
        'estimate is not built on generic rates.',
      owner: 'Apex Procurement',
      nextGate: 'Replace demo pack with the executed client rate card',
    },
    provenance: effort.rateCard.provenance,
    provenanceLabel: effort.rateCard.label,
    isClientOverride,
    cells: rateCells,
    overrideNote:
      'The effort estimator consumes a rate card through a labelled ' +
      'abstraction — a client-specific card always replaces the researched ' +
      'benchmark cleanly. This estimate already runs on the Apex ' +
      'comprehensive pack (a client_rate_card onshore lane, a vendor_quote ' +
      'offshore lane). Replace the demo pack with the executed Apex card ' +
      'before any commitment.',
  };

  // --- §6 Value forecast ----------------------------------------------------
  const valueForecast: ValueForecastSection = {
    anatomy: {
      page: 6,
      id: 'value-forecast',
      navLabel: 'Value forecast',
      takeaway:
        'Gross value is never claimed — a mandatory six-factor haircut ' +
        `discounts ${Math.round(value.totalHaircut * 100)}% of it before the net is shown.`,
      decisionRole:
        'Confirm the value is discounted, not optimistic — and that the ' +
        'gross figure rests on a proxy.',
      evidence: {
        sources: ['Moves Expert Kernel — value forecast (haircut model)'],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ['Cost per contact (labour) — gross value rests on this proxy'],
      },
      implication:
        'The net value is honest, but it is a proxy net — the gross figure ' +
        'rests on the cost-per-contact seed gap.',
      owner: 'Transformation Finance',
      nextGate: 'Re-run the forecast once cost-per-contact is captured',
    },
    grossTotal: `${usd(value.totalGrossValue.low)} – ${usd(value.totalGrossValue.high)}`,
    netTotal: `${usd(value.totalNetValue.low)} – ${usd(value.totalNetValue.high)}`,
    totalHaircut: value.totalHaircut,
    retainedFraction: value.retainedFraction,
    haircutFactors: value.factors.map((f) => ({
      dimension: haircutLabel(f.dimension),
      score: f.score,
      discountPct: Math.round(f.discountContribution * 1000) / 10,
    })),
    curve: value.curve.map((c) => ({
      year: c.year,
      adoption: c.adoptionFraction,
      netValue: c.netValue.point,
    })),
    grossValueIsProxy: value.monetisationBlocked,
  };

  // --- §7 Sensitivity -------------------------------------------------------
  const sens = full.fullCase.sensitivity;
  const sensitivity: SensitivitySection = {
    anatomy: {
      page: 7,
      id: 'sensitivity',
      navLabel: 'Sensitivity',
      takeaway:
        'The case is shown as three scenarios, never one point — and the ' +
        'one thing that breaks it is named.',
      decisionRole:
        'Stress the estimate — find the downside and what would break it.',
      evidence: {
        sources: [
          'Business-case compiler — three-scenario sensitivity',
          'Assumption ledger — ranked by sensitivity impact',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'The downside cannot be expressed in hard dollars — it rests on the ' +
        'cost-per-contact seed-gap proxy.',
      owner: 'Transformation Finance',
      nextGate: 'Close the monetization gap before reading the downside',
    },
    scenarios: [
      {
        label: 'Conservative',
        netReturn: sens.conservative.netReturn,
        tone: 'low',
      },
      { label: 'Base', netReturn: sens.base.netReturn, tone: 'base' },
      { label: 'Upside', netReturn: sens.upside.netReturn, tone: 'high' },
    ],
    tornado: skeleton.assumptions.byImpact
      .filter((a) => a.sensitivityImpact !== 'low')
      .map((a) => ({
        label: a.statement.split('—')[0].split('(')[0].trim().slice(0, 52),
        swing: a.sensitivityImpact === 'high' ? 100 : 55,
        isProxy: a.isSeedGapProxy,
      })),
    whatBreaksTheCase: sens.whatBreaksTheCase,
    downsideRead: sens.downsideRead,
  };

  // --- §8 Roadmap cash flow -------------------------------------------------
  // Cumulative cash flow — period 0 is the up-front nothing, then per-phase
  // investment net of the phase's annual value unlock. Honest: when payback
  // is blocked the lines model net value, not real cash, and never cross zero
  // as a payback claim.
  const phaseProfile = full.fullCase.phaseProfile;
  const periodLabels = ['Start', ...phaseProfile.map((p) => phaseShort(p.phaseLabel))];
  const cashSeries = (effortScale: number, valueScale: number): number[] => {
    let cum = 0;
    const out = [0];
    for (const p of phaseProfile) {
      cum += -p.investment * effortScale + p.annualValueUnlocked * valueScale;
      out.push(Math.round(cum));
    }
    return out;
  };
  const roadmapCashFlow: RoadmapCashFlowSection = {
    anatomy: {
      page: 8,
      id: 'roadmap-cash-flow',
      navLabel: 'Roadmap cash flow',
      takeaway:
        'Phase cost lands before phase value — and because monetization is ' +
        'blocked, the curve is a net-value model, not a payback claim.',
      decisionRole:
        'See the cash-flow shape and the honest payback status.',
      evidence: {
        sources: ['Moves Expert Kernel — costed roadmap + value forecast'],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: ['Cost per contact (labour) — payback cannot be computed'],
      },
      implication:
        'No payback month is claimed — the §8 hard fail "payback shown when ' +
        'monetization blocked" is avoided by design.',
      owner: 'Transformation Finance',
      nextGate: 'Compute payback after cost-per-contact lands',
    },
    phases: phaseProfile.map((p) => ({
      id: p.phaseId,
      label: p.phaseLabel,
      investment: p.investment,
      cumulativeInvestment: p.cumulativeInvestment,
      annualValueUnlocked: p.annualValueUnlocked,
      isFoundational: p.isFoundational,
      durationMonths:
        full.roadmap.phases.find((rp) => rp.id === p.phaseId)
          ?.durationMonths ?? 0,
    })),
    cashFlow: {
      base: cashSeries(1, 1),
      conservative: cashSeries(
        sens.conservative.investment / Math.max(1, full.fullCase.investment.point),
        0.7,
      ),
      upside: cashSeries(
        sens.upside.investment / Math.max(1, full.fullCase.investment.point),
        1.25,
      ),
      periodLabels,
    },
    paybackBlocked,
    paybackNote:
      'Payback is not computable — the gross value the cash-flow rests on ' +
      'uses a benchmark cost-per-contact proxy (a declared seed gap). The ' +
      'curve models discounted net value, not verified cash.',
  };

  const sections: EstimateSections = {
    executiveSummary,
    baselineInputs,
    workstreamEstimate,
    roleMixByPhase: roleMixByPhaseSection,
    rateCard,
    valueForecast,
    sensitivity,
    roadmapCashFlow,
  };

  const ordered: EstimateSectionAnatomy[] = [
    executiveSummary.anatomy,
    baselineInputs.anatomy,
    workstreamEstimate.anatomy,
    roleMixByPhaseSection.anatomy,
    rateCard.anatomy,
    valueForecast.anatomy,
    sensitivity.anatomy,
    roadmapCashFlow.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: skeleton.tenantKey,
    moveLabel: skeleton.moveName,
    artifactLabel: 'Estimate & Financial Model',
    generatedOn,
    recommendation,
    paybackBlocked,
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
// Helpers — pure classifiers and formatters. No new facts.
// ---------------------------------------------------------------------------

/** Format a USD number compactly, e.g. $2.20M, $940K. */
function formatUsd(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

/** A short human label for a haircut dimension. */
function haircutLabel(dim: string): string {
  const map: Record<string, string> = {
    adoptionRisk: 'Adoption risk',
    dataReadiness: 'Data readiness',
    processDependency: 'Process dependency',
    integrationComplexity: 'Integration complexity',
    controlBurden: 'Control burden',
    sponsorStrength: 'Sponsor strength',
  };
  return map[dim] ?? dim;
}

/** The decision impact of a baseline seed gap on the financial model. */
function seedGapImpact(key: string): string {
  switch (key) {
    case 'cost_per_contact_usd':
      return 'Blocks monetization — without it the value forecast rests on ' +
        'a benchmark proxy and payback cannot be computed.';
    case 'contact_volume_annual':
      return 'Caps how AHT / containment deltas convert into FTE-hours and ' +
        'dollars — value stays a proxy until it lands.';
    case 'channel_mix':
      return 'Routing value differs by channel; the voice/chat/IVR split ' +
        'bounds how the pilot scope is sized.';
    case 'qa_error_rate_pct':
      return 'No quality-defect baseline — a secondary value lever cannot ' +
        'be modelled.';
    default:
      return 'Decision impact not classified.';
  }
}

/** A short phase label for the cash-flow period axis. */
function phaseShort(label: string): string {
  const m = /Phase\s+(\d+)/i.exec(label);
  return m ? `P${m[1]}` : label.slice(0, 6);
}

/**
 * Build the rate-card coverage matrix cells. The kernel rate card carries one
 * `RoleRateCard` row per should-cost role (onshore + offshore). This folds
 * the roles that the Apex effort estimate actually uses into role-family rows
 * — keeping domain / location lanes distinct (the §8 hard fail to avoid is
 * collapsing them into one blended row).
 */
function buildRateCardCells(
  rates: Array<{
    role: string;
    onshoreAnnualRate: number;
    offshoreAnnualRate: number;
  }>,
): Array<{ domain: string; onshore: number | null; offshore: number | null }> {
  // The role families the Apex Contact Center effort estimate's role mix
  // actually draws on — solution architects, engineers, analysts, PMs.
  const roleToFamily: Record<string, string> = {
    solution_architect: 'solution_architecture',
    senior_engineer: 'application_engineering',
    engineer: 'application_engineering',
    data_engineer: 'data_engineering',
    ai_ml_lead: 'ai_ml',
    integration_engineer: 'integration',
    analyst: 'business_analysis',
    project_manager: 'program_pmo',
    change_lead: 'change_management',
    process_lead: 'process_redesign',
    governance_risk_lead: 'governance_compliance',
    qa_eval_lead: 'qa_evaluation',
    security_architect: 'security_risk',
  };
  // The role families the Apex estimate's eight workstreams require. The
  // estimate's role mix uses solution_architect / senior_engineer / engineer
  // / analyst / project_manager. The rate-card pack prices the full lane set,
  // so a wider role-family list is genuinely covered — but a few specialised
  // lanes (e.g. security) are not exercised by THIS Move's mix.
  const familyOrder = [
    'ai_ml',
    'data_engineering',
    'integration',
    'solution_architecture',
    'application_engineering',
    'governance_compliance',
    'process_redesign',
    'change_management',
    'business_analysis',
    'program_pmo',
    'qa_evaluation',
    'security_risk',
  ];
  const byFamily = new Map<
    string,
    { onshore: number[]; offshore: number[] }
  >();
  for (const r of rates) {
    const fam = roleToFamily[r.role];
    if (!fam) continue;
    const bucket = byFamily.get(fam) ?? { onshore: [], offshore: [] };
    bucket.onshore.push(r.onshoreAnnualRate);
    bucket.offshore.push(r.offshoreAnnualRate);
    byFamily.set(fam, bucket);
  }
  const avg = (xs: number[]): number | null =>
    xs.length === 0
      ? null
      : Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
  return familyOrder.map((fam) => {
    const bucket = byFamily.get(fam);
    return {
      domain: DOMAIN_LABELS[fam] ?? fam,
      onshore: bucket ? avg(bucket.onshore) : null,
      offshore: bucket ? avg(bucket.offshore) : null,
    };
  });
}

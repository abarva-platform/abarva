// First Capital × Fraud & financial crime — the bet-selection binding.
//
// First Capital's tenant binding for the function-aware Intelligence bet-
// selection surface. Supplies the same audited substrate as
// `firstcapital-decision-home.ts` plus the banking-named copy that frames the
// ranking in a Chief Risk Officer's own language.
//
// SAME SUBSTRATE AS THE DECISION HOME — the two surfaces must read off the
// same First Capital, not invent a second, divergent picture.
//
// Pure, deterministic, typed module — no I/O.

import type {
  BetSelectionHeadline,
  RankingGate,
} from './meridian-vbc-bet-selection';
import { buildVbcBetSelection } from './meridian-vbc-bet-selection';
import type {
  TenantMetricObservation,
  TenantSubstrate,
} from './tenant-substrate';
import {
  type BetSelectionBinding,
  type BetSelectionBindingContext,
  type BetSelectionGroundedBlocks,
  registerBetSelectionBinding,
} from './tenant-binding-registry';

// ─────────────────────────────────────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────────────────────────────────────

export const FIRSTCAPITAL_INDUSTRY_KEY = 'financial-services' as const;
export const FIRSTCAPITAL_FUNCTION_KEY = 'fraud_financial_crime' as const;
export const FIRSTCAPITAL_TENANT_KEY = 'arcturus' as const;

// ─────────────────────────────────────────────────────────────────────────────
// First Capital substrate — the audited fraud / financial-crime evidence base
// ─────────────────────────────────────────────────────────────────────────────

/**
 * First Capital's audited fraud / financial-crime substrate for bet-selection
 * scoring. Identical (in metric keys and values) to the decision-home
 * binding's observations, minus the `read` field that only the decision-home
 * view consumes — only the citation and the seed-gap reason are needed here.
 */
const FIRSTCAPITAL_FRAUD_OBSERVATIONS: readonly TenantMetricObservation[] = [
  {
    metricKey: 'alert_to_sar_conversion',
    value: 6,
    source:
      'First Capital evidence base — derived from KPI fc-kpi-013 (OCC MRA-2: ' +
      'AML false-positive rate 94%, peer median 45%). At a 94% false-' +
      'positive rate ≈6% of investigated alerts convert to a filed SAR.',
  },
  {
    metricKey: 'sar_filing_timeliness',
    value: 92,
    source:
      'First Capital evidence base — derived from KPI fc-kpi-015 (OCC MRA-2: ' +
      'SAR filings past deadline 8% in Q1 2026, peer median 0%).',
  },
  {
    metricKey: 'fraud_loss_basis_points',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'First Capital reports card fraud losses at $2.1M (fc-kpi-012, peer ' +
      '$1.2M) and a Q1 run-rate of $1.8M (fc-kpi-022) but the transaction-' +
      'volume denominator is not seeded — the basis-points figure cannot ' +
      'be computed. Sourced from the fraud-management and finance systems.',
  },
  {
    metricKey: 'fraud_detection_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'The catch-rate of the detection estate (share of fraudulent value ' +
      'stopped before settlement) is not separately seeded. Sourced from ' +
      'the fraud-management system.',
  },
  {
    metricKey: 'false_positive_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'First Capital measures the AML false-positive rate at 94% but the ' +
      'Function Pack’s false-positive-per-confirmed-fraud ratio — the ' +
      'investigator-burden measure — is not directly seeded. Sourced from ' +
      'the fraud-management and case systems.',
  },
  {
    metricKey: 'fraud_decision_latency',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Real-time fraud decisioning latency is not in the KPI dictionary. ' +
      'Sourced from the real-time fraud-decisioning and payment-' +
      'authorisation systems.',
  },
  {
    metricKey: 'alert_investigation_cycle_time',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Cycle time from alert raised to documented disposition is not ' +
      'seeded. Sourced from the financial-crime case-management system.',
  },
  {
    metricKey: 'sanctions_screening_false_positive',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'The sanctions-screening false-match rate is not in the KPI ' +
      'dictionary. Sourced from the sanctions-screening and case systems.',
  },
  {
    metricKey: 'account_takeover_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Confirmed account-takeover and identity-fraud events per thousand ' +
      'accounts are not seeded. Sourced from the fraud-management, ' +
      'identity, and authentication systems.',
  },
  {
    metricKey: 'investigator_productivity',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Dispositioned alerts per investigator per period is not seeded. ' +
      'Annual alert volume and the investigator headcount are themselves ' +
      'seed gaps. Sourced from the case-management system.',
  },
  {
    metricKey: 'financial_crime_cost_ratio',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Programme cost is committed at $1.8M (FC-FRAUD-2026) but the fraud-' +
      'loss-addressed denominator is not seeded. Sourced from finance and ' +
      'the fraud-management system.',
  },
  {
    metricKey: 'kyc_onboarding_cycle_time',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Hours from customer application to completed customer due ' +
      'diligence is not seeded. Sourced from the KYC / onboarding system.',
  },
] as const;

export const FIRSTCAPITAL_GROUNDED_FRAUD_BET_METRIC_KEYS: ReadonlySet<string> =
  new Set(
    FIRSTCAPITAL_FRAUD_OBSERVATIONS.filter((o) => o.value !== null).map(
      (o) => o.metricKey,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// The First Capital × fraud bet-selection binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * First Capital's tenant binding for the function-aware bet-selection
 * surface. The binding ships the audited fraud substrate plus the
 * banking-named headline + gates. The top bet — AML transaction-monitoring
 * uplift and alert triage — earns its rank by being the only candidate whose
 * moved metrics include First Capital's grounded ones AND that is the most
 * mature adoption profile among the grounded candidates. The gates name, in
 * plain language, the audited seed gaps that would re-order this list.
 */
export const FIRSTCAPITAL_BET_SELECTION_BINDING: BetSelectionBinding = {
  industryKey: FIRSTCAPITAL_INDUSTRY_KEY,
  functionKey: FIRSTCAPITAL_FUNCTION_KEY,
  tenantBindingKey: 'firstcapital-fraud',
  substrate: FIRSTCAPITAL_FRAUD_OBSERVATIONS,
  buildBlocks(ctx: BetSelectionBindingContext): BetSelectionGroundedBlocks {
    const { topBetName, topBetRead, totalBets, heldBetCount } = ctx;

    const headline: BetSelectionHeadline = {
      eyebrow: 'Fraud & financial crime · the bet to make first',
      question:
        'Which fraud / financial-crime AI bet should First Capital make first?',
      answer:
        topBetRead === 'fund_first'
          ? `Make the ${topBetName} bet first.`
          : `The most fundable bet today is ${topBetName} — but shape it before funding.`,
      rationale:
        `Of the fraud-and-financial-crime function’s ${totalBets} AI ` +
        `use-case archetypes, ${topBetName} is the one First Capital’s ` +
        `audited substrate makes most fundable now: it moves alert-to-SAR ` +
        `conversion (currently ~6%, derived from the OCC MRA-2-cited 94% ` +
        `AML false-positive rate, peer median 45%) and SAR timeliness ` +
        `(currently 92%, with an 8% past-deadline finding against a peer ` +
        `median of 0%). Both metrics are measured AND under active ` +
        `supervisory remediation — value visibly on the table, with the ` +
        `regulator setting the deadline.`,
      honestyClause:
        `This ranking is honest about its own limits. ${heldBetCount} ` +
        `of the ${totalBets} bets — the real-time transaction-fraud, ` +
        `account-takeover, and sanctions-screening archetypes — move only ` +
        `metrics First Capital has not seeded (net fraud loss in basis ` +
        `points, the detection rate, decision latency, the ATO rate, ` +
        `sanctions-screening false-match rate). They are held for ` +
        `evidence, not ranked on a fabricated number. The card-fraud ` +
        `dollar loss IS audited at $2.1M (peer $1.2M) but cannot yet be ` +
        `tied to a per-transaction basis-points figure. The gates that ` +
        `would re-order this list are named in full below.`,
    };

    const gates: RankingGate[] = [
      {
        key: 'gate_real_time_fraud_substrate',
        title: 'The real-time-fraud substrate is unseeded',
        description:
          'The Fraud-and-Financial-Crime Function Pack expects net fraud ' +
          'loss in basis points, the detection rate (value caught), ' +
          'decision latency in milliseconds, and the account-takeover rate ' +
          'per 1,000 accounts — all sourced from the fraud-management, ' +
          'authorisation, and identity systems. First Capital has the ' +
          'dollar loss baseline ($2.1M card fraud, peer $1.2M, fc-kpi-012) ' +
          'but not the transaction-volume denominator, the detection ' +
          'split, the latency distribution, or the ATO measurement.',
        whatItWouldMove:
          'Seeding the real-time-fraud substrate would let the real-time ' +
          'transaction-fraud-detection bet and the account-takeover-and-' +
          'identity-fraud-detection bet be ranked on measured downside ' +
          'rather than held for evidence — they could rise into fundable ' +
          'positions alongside the AML-monitoring-uplift bet.',
      },
      {
        key: 'gate_investigation_throughput',
        title: 'Investigation throughput and cost economics are unseeded',
        description:
          'Alert and case investigation cycle time, dispositioned alerts ' +
          'per investigator, and the financial-crime cost ratio (programme ' +
          'cost per dollar of fraud loss addressed) are not seeded. ' +
          'Programme cost is committed at $1.8M (FC-FRAUD-2026) but the ' +
          'fraud-loss-addressed denominator that converts it to a ratio is ' +
          'not. Sourced from the case-management system and finance.',
        whatItWouldMove:
          'Seeding investigation throughput would tighten the AML-' +
          'monitoring-uplift dollar case from a Function-Pack planning ' +
          'range to First Capital’s own throughput economics, and would ' +
          'expose whether the committed programme cost is well-sized ' +
          'against the loss it addresses.',
      },
      {
        key: 'gate_sanctions_screening_telemetry',
        title: 'Sanctions-screening telemetry is unseeded',
        description:
          'The sanctions and watch-list screening false-match rate — ' +
          'structurally very high (90–99% planning band) and a major ' +
          'operating cost — is not in First Capital’s KPI dictionary. The ' +
          'sanctions-screening-optimisation bet has no measured baseline ' +
          'to move against. Sourced from the sanctions-screening and case ' +
          'systems.',
        whatItWouldMove:
          'Seeding the sanctions false-match rate would move the ' +
          'sanctions-screening-optimisation bet out of hold-for-evidence ' +
          'and let it be ranked on a measured operations-cost baseline.',
      },
      {
        key: 'gate_kyc_onboarding_cycle_time',
        title: 'KYC onboarding cycle time is unseeded',
        description:
          'Hours from application to completed customer due diligence are ' +
          'not seeded. Without this baseline the entity-resolution-and-' +
          'network-risk bet — which lifts KYC sharpness alongside detection ' +
          '— cannot be sized against First Capital’s actual onboarding ' +
          'tempo. Sourced from the KYC / onboarding system.',
        whatItWouldMove:
          'A seeded KYC cycle-time baseline would tighten the value case ' +
          'for the entity-resolution-and-network-risk bet and would expose ' +
          'how much of the onboarding window is investigator time vs. ' +
          'data-assembly time.',
      },
    ];

    return { headline, gates };
  },
};

// Register First Capital's binding eagerly on module load.
registerBetSelectionBinding(FIRSTCAPITAL_BET_SELECTION_BINDING);

// ─────────────────────────────────────────────────────────────────────────────
// Thin public shim
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the bet selection for the First Capital × fraud binding.
 *
 * @param tenantName The resolved tenant display name (e.g. "First Capital Financial").
 */
export function buildFirstCapitalFraudBetSelection(tenantName: string) {
  return buildVbcBetSelection(
    FIRSTCAPITAL_INDUSTRY_KEY,
    FIRSTCAPITAL_FUNCTION_KEY,
    tenantName,
  );
}

/** Re-export the substrate for tests that want to inspect FC's evidence. */
export const FIRSTCAPITAL_FRAUD_BET_OBSERVATIONS_PUBLIC: TenantSubstrate =
  FIRSTCAPITAL_FRAUD_OBSERVATIONS;

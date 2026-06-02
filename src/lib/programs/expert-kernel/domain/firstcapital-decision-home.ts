// First Capital Financial × Fraud & financial crime — the decision-home binding.
//
// First Capital's tenant binding for the function-aware decision home. The
// generic `buildVbcDecisionHome` (in `meridian-vbc-decision-home.ts`) is
// already generic over `(industryKey, functionKey)`; this module supplies the
// substrate that grounds it for a First Capital fraud / AML operator AND the
// banking-named copy that frames the four §4 blocks in a Chief Risk Officer's
// own language.
//
// SPINE FUNCTION — First Capital's most decision-relevant function for "which
// AI bet first" is fraud & financial crime: it carries the live Fraud
// Detection Enhancement Move, the active OCC MRA-2 findings on AML monitoring
// and SAR timeliness, and the audited card-fraud-loss baseline (FC-FRAUD-2026,
// status on-track per program inventory). The companion spine
// `lending_credit_underwriting` is the credit-cycle lever, but fraud /
// financial crime is where First Capital's audited substrate lives and where
// the regulatory clock runs against the operating tempo — so fraud is the
// primary binding.
//
// GROUNDING DISCIPLINE — every non-null observation below traces to First
// Capital's audited evidence base (the KPI dictionary fc-kpi-*, the OCC MRA-2
// findings, and the Fraud Detection Enhancement program baseline FC-FRAUD-2026).
// Where the Fraud-and-Financial-Crime Function Pack expects a metric First
// Capital has not measured, the observation carries `value: null` and a
// precise `seedGapReason` naming what is missing and what its absence blocks.
//
// Pure, deterministic, typed module — no I/O. The generic builder reads its
// substrate and grounded-blocks builder through the tenant-binding registry.

import type {
  CadenceBlock,
  CadenceStage,
  DecisionCard,
  DecisionHomeHeadline,
} from './meridian-vbc-decision-home';
import { buildVbcDecisionHome } from './meridian-vbc-decision-home';
import type {
  TenantMetricObservation,
  TenantSubstrate,
} from './tenant-substrate';
import {
  type DecisionHomeBinding,
  type DecisionHomeGroundedBlocks,
  registerDecisionHomeBinding,
} from './tenant-binding-registry';

// ─────────────────────────────────────────────────────────────────────────────
// Keys
// ─────────────────────────────────────────────────────────────────────────────

/** First Capital's industry — the financial-services vertical. */
export const FIRSTCAPITAL_INDUSTRY_KEY = 'financial-services' as const;

/**
 * The spine function — fraud & financial crime. Per the route's
 * `INDUSTRY_SPINE_FUNCTION_KEY` map this is the function the surface should
 * bind by default for a financial-services tenant whose Move has not yet
 * classified a function key. (See `/intelligence/decision/page.tsx`.)
 */
export const FIRSTCAPITAL_FUNCTION_KEY = 'fraud_financial_crime' as const;

/** The First Capital tenant key — matches `client-config.ts`. */
export const FIRSTCAPITAL_TENANT_KEY = 'arcturus' as const;

// ─────────────────────────────────────────────────────────────────────────────
// First Capital substrate — the audited fraud / financial-crime evidence base
// ─────────────────────────────────────────────────────────────────────────────

/**
 * First Capital Financial's audited fraud / financial-crime substrate,
 * expressed against the Fraud-and-Financial-Crime Function Pack's operating-
 * metric vocabulary.
 *
 * GROUNDING DISCIPLINE — every non-null value below traces to First Capital's
 * audited evidence base (the KPI dictionary `fc-kpi-*` and the Fraud
 * Detection Enhancement program baseline `FC-FRAUD-2026`, status on-track in
 * P4 Value Tracking). The numbers themselves are the audited substrate First
 * Capital's living Move already runs against (`src/lib/programs/expert-kernel/
 * living-move-cases.ts` → `firstCapitalBaseline`).
 *
 * What is measured, mapped to the Fraud-and-Financial-Crime Function Pack:
 *   • Alert-to-SAR conversion — First Capital's inferred conversion rate from
 *     the OCC-cited 94% AML false-positive rate. At ~6% conversion this sits
 *     in the LOWER half of the function's 2–20 planning band — in-range but
 *     signal-poor, the classic "AML monitoring is noise" diagnostic.
 *   • SAR filing timeliness — derived from the OCC MRA-2-cited 8% past-
 *     deadline figure: ~92% on time, in-range on the 80–99 band but in its
 *     LOWER half against a peer median of 100%.
 *
 * What is NOT measured — declared seed gaps with their expected data source:
 *   • Net fraud loss in basis points — First Capital reports a card-fraud
 *     loss of $2.1M against a peer median of $1.2M and a Q1 run-rate of
 *     $1.8M, but transaction-volume denominator is not seeded, so the
 *     headline basis-points figure cannot be computed.
 *   • Fraud detection rate (value caught) — gross fraud detected vs. total
 *     confirmed fraud is not seeded as a separate metric.
 *   • Fraud false-positive rate (per confirmed fraud) — the AML false-
 *     positive percentage is recorded but the per-confirmed-fraud ratio is
 *     not directly seeded.
 *   • Real-time fraud decision latency — not in the KPI dictionary.
 *   • Alert and case investigation cycle time — not seeded; FC has an
 *     investigator backlog signal but no documented disposition-to-receipt
 *     latency.
 *   • Sanctions-screening false-positive rate — not seeded.
 *   • Account-takeover and identity-fraud rate — not seeded.
 *   • Investigator productivity (alerts per FTE) — alert volume is itself a
 *     seed gap.
 *   • Financial-crime cost ratio — fully-loaded programme cost is committed
 *     ($1.8M) but the fraud-loss-addressed denominator is not seeded.
 *   • KYC onboarding cycle time — not in the KPI dictionary.
 */
const FIRSTCAPITAL_FRAUD_OBSERVATIONS: readonly TenantMetricObservation[] = [
  {
    metricKey: 'alert_to_sar_conversion',
    value: 6,
    source:
      'First Capital evidence base — derived from KPI fc-kpi-013 (OCC MRA-2: ' +
      'AML false-positive rate 94%, peer median 45%). At a 94% false-' +
      'positive rate ≈6% of investigated alerts convert to a filed SAR.',
    read:
      'Alert-to-SAR conversion at 6% sits in the lower half of the Function ' +
      'Pack’s 2–20 planning band — in-range, but the underlying 94% AML ' +
      'false-positive rate (peer median 45%) is well outside any peer ' +
      'reference. The monitoring estate is generating overwhelmingly benign ' +
      'alerts — the central inefficiency the Function Pack warns about.',
  },
  {
    metricKey: 'sar_filing_timeliness',
    value: 92,
    source:
      'First Capital evidence base — derived from KPI fc-kpi-015 (OCC MRA-2: ' +
      'SAR filings past deadline 8% in Q1 2026, peer median 0%). 100% − 8% ' +
      '= 92% on time with the standing assumption of a defensible narrative.',
    read:
      'SAR timeliness at 92% sits inside the Function Pack’s 80–99 planning ' +
      'band but in its LOWER half — and the OCC peer benchmark is 100%. The ' +
      'measure is in-range but the MRA-2 finding makes any miss a direct ' +
      'BSA / AML regulatory exposure rather than an operating-metric slip.',
  },
  {
    metricKey: 'fraud_loss_basis_points',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'First Capital reports card fraud annualised losses at $2.1M ' +
      '(fc-kpi-012, peer median $1.2M) and a Q1 run-rate of $1.8M ' +
      '(fc-kpi-022), but the transaction-volume denominator that converts ' +
      'those dollars into basis points is not seeded. Sourced from the ' +
      'fraud-management and finance systems netting gross loss against ' +
      'recoveries over transaction volume.',
  },
  {
    metricKey: 'fraud_detection_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'The catch-rate of the detection estate — share of fraudulent value ' +
      'stopped before settlement vs. value crystallised as loss — is not ' +
      'separately seeded. Sourced from the fraud-management system, ' +
      'comparing detected-and-stopped fraud against total confirmed fraud.',
  },
  {
    metricKey: 'false_positive_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'First Capital measures the AML false-positive rate at 94% but the ' +
      'Function Pack’s false-positive-per-confirmed-fraud ratio — the ' +
      'investigator-burden measure — is not directly seeded with a paired ' +
      'confirmed-fraud denominator. Sourced from the fraud-management and ' +
      'case systems, comparing flagged-and-cleared events against ' +
      'confirmed fraud.',
  },
  {
    metricKey: 'fraud_decision_latency',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Real-time fraud decisioning latency — milliseconds from transaction ' +
      'receipt to approve / decline / step-up — is not in First Capital’s ' +
      'KPI dictionary. Without it, the case for real-time decisioning ' +
      'cannot be sized against the faster-payments authorisation window. ' +
      'Sourced from the real-time fraud-decisioning and payment-' +
      'authorisation systems.',
  },
  {
    metricKey: 'alert_investigation_cycle_time',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Cycle time from alert raised to documented disposition is not ' +
      'seeded — the Q1 SAR-past-deadline figure is consequence, not the ' +
      'underlying throughput measure. Sourced from the financial-crime ' +
      'case-management system timestamping alert creation against ' +
      'documented disposition.',
  },
  {
    metricKey: 'sanctions_screening_false_positive',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'The sanctions-screening false-match rate is not in the KPI ' +
      'dictionary. Sourced from the sanctions-screening and case systems ' +
      'comparing screening hits against confirmed true matches.',
  },
  {
    metricKey: 'account_takeover_rate',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Confirmed account-takeover and identity-fraud events per thousand ' +
      'accounts are not seeded — ATO is the fastest-growing fraud vector ' +
      'and a structural sensitivity for any digital-channel bet. Sourced ' +
      'from the fraud-management, identity, and authentication systems.',
  },
  {
    metricKey: 'investigator_productivity',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Dispositioned alerts per investigator per period — the throughput ' +
      'of the investigation workforce — is not seeded. Annual alert volume ' +
      'and the investigator headcount are themselves seed gaps. Sourced ' +
      'from the case-management system tracking dispositioned alerts ' +
      'against investigator headcount.',
  },
  {
    metricKey: 'financial_crime_cost_ratio',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'First Capital has a committed programme cost of $1.8M (FC-FRAUD-2026 ' +
      'inventory) but the fraud-loss-addressed denominator that converts it ' +
      'to a cost ratio is not seeded — without it the question of whether ' +
      'the programme is mis-sized cannot be answered against a peer band. ' +
      'Sourced from finance and the fraud-management system.',
  },
  {
    metricKey: 'kyc_onboarding_cycle_time',
    value: null,
    source: 'seed gap — not in First Capital’s audited substrate.',
    seedGapReason:
      'Hours from customer application to completed customer due diligence ' +
      'is not seeded. Sourced from the KYC / onboarding system against the ' +
      'application timestamp.',
  },
] as const;

/** The metric keys First Capital has grounded — exported for tests. */
export const FIRSTCAPITAL_GROUNDED_FRAUD_METRIC_KEYS: ReadonlySet<string> =
  new Set(
    FIRSTCAPITAL_FRAUD_OBSERVATIONS.filter((o) => o.value !== null).map(
      (o) => o.metricKey,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// The First Capital × fraud decision-home binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * First Capital's tenant binding for the function-aware decision home. The
 * binding ships its audited fraud / financial-crime substrate plus the
 * banking-operator-named copy that grounds the four §4 blocks — the answer is
 * the AML transaction-monitoring uplift, the cadence is the BSA / AML
 * supervisory rhythm and the active OCC MRA-2 remediation.
 */
export const FIRSTCAPITAL_DECISION_HOME_BINDING: DecisionHomeBinding = {
  industryKey: FIRSTCAPITAL_INDUSTRY_KEY,
  functionKey: FIRSTCAPITAL_FUNCTION_KEY,
  tenantBindingKey: 'firstcapital-fraud',
  expectedClientKey: 'arcturus',
  substrate: FIRSTCAPITAL_FRAUD_OBSERVATIONS,
  buildBlocks(): DecisionHomeGroundedBlocks {
    // Block 1 — the one thing. First Capital's audited substrate carries two
    // measured fraud / AML metrics — alert-to-SAR conversion at 6% and SAR
    // timeliness at 92% — both in-range on the Function Pack's planning bands
    // BUT both with active OCC MRA-2 findings against them. The headline
    // asserts only what the substrate supports and names the structural seed
    // gaps that bound any value-on-the-table claim.
    const headline: DecisionHomeHeadline = {
      eyebrow: 'Fraud & financial crime',
      statement:
        'First Capital’s AML monitoring is generating noise — alert-to-SAR ' +
        'conversion sits at ~6% (inferred from a 94% false-positive rate, ' +
        'peer median 45%), and SAR timeliness at 92% sits in the lower half ' +
        'of the function’s 80–99 band with an active OCC MRA-2 finding. The ' +
        'regulatory clock is the operating tempo.',
      honestyClause:
        'This is the one truth First Capital’s audited substrate (the ' +
        'fc-kpi-* dictionary + the OCC MRA-2 findings + the Fraud Detection ' +
        'Enhancement program baseline FC-FRAUD-2026) can assert today. The ' +
        'real-time-decisioning economics — net fraud loss in basis points, ' +
        'detection rate, decision latency, account-takeover rate — are NOT ' +
        'yet seeded; they render below as explicit seed gaps, not as ' +
        'numbers. The AML-monitoring-uplift bet is the right one to ground ' +
        'first; the real-time card-fraud case needs substrate before it ' +
        'can be ranked on measured value.',
      cadenceAnchor:
        'The BSA / AML supervisory cycle and the active OCC MRA-2 ' +
        'remediation milestones are the deadlines this depends on.',
    };

    // Block 2 — decisions that need you. Each card is answer-first and
    // grounded: action, stake, one evidence line, one gesture deeper.
    const decisions: DecisionCard[] = [
      {
        key: 'uplift_aml_monitoring',
        urgency: 'decide_now',
        recommendedAction:
          'Fund the AML-monitoring-uplift-and-alert-triage Move — replace ' +
          'the legacy rule pack with risk-based, model-supported scenarios ' +
          'and a triage layer that ranks alerts by composite risk and ' +
          'evidence weight, ahead of the next OCC MRA-2 review milestone.',
        stake:
          'AML false-positive at 94% (peer median 45%) means investigators ' +
          'are burning their hours on noise — the bet directly moves alert-' +
          'to-SAR conversion off the bottom of the band, frees investigator ' +
          'capacity for the work that actually clears the MRA findings, ' +
          'and lifts SAR timeliness above the regulatory deadline window.',
        evidence:
          'First Capital evidence base KPI fc-kpi-013: AML false-positive ' +
          '94% on OCC MRA-2 findings, peer median 45%. The alert noise is ' +
          'real and externally validated by the regulator.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the AML-monitoring-uplift case',
        gestureHref: '/moves',
      },
      {
        key: 'lift_sar_timeliness',
        urgency: 'this_cycle',
        recommendedAction:
          'Stand up the SAR / investigation copilot — assemble evidence ' +
          'against the BSA narrative, draft and quality-check the SAR ' +
          'before review, and route the investigator queue by deadline ' +
          'risk — so SAR timeliness clears the 95%+ band the regulator ' +
          'expects.',
        stake:
          'SAR-past-deadline at 8% (peer median 0%, fc-kpi-015 on OCC ' +
          'MRA-2) is direct supervisory exposure — every missed filing is ' +
          'a documented finding, not an operating-metric slip. The Function ' +
          'Pack values the copilot at a 30–60% cycle-time reduction ' +
          '(planning range) and is the lever that lifts timeliness without ' +
          'expanding the investigator team.',
        evidence:
          'First Capital evidence base KPI fc-kpi-015: 8% of SARs filed ' +
          'past the regulatory deadline in Q1 2026 (OCC MRA-2). Real and ' +
          'measured against the statutory window.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the SAR / investigation copilot decision',
        gestureHref: '/moves',
      },
      {
        key: 'seed_real_time_fraud_substrate',
        urgency: 'decide_now',
        recommendedAction:
          'Commission the real-time-fraud measurement baseline — net fraud ' +
          'loss in basis points (paired with transaction volume), the ' +
          'detection rate, the decision-latency distribution, and the ' +
          'account-takeover rate per 1,000 accounts — from the fraud-' +
          'management system and the authorisation logs before any real-' +
          'time card-fraud Move value forecast is underwritten.',
        stake:
          'Without these, the decision home can show First Capital’s AML ' +
          'standing but not its real-time card-fraud standing — and the ' +
          'live $2.1M card-fraud loss vs. the $1.2M peer median (fc-kpi-012) ' +
          'cannot be tied to a per-transaction basis-points figure the CFO ' +
          'can underwrite. A forecast built without these would be ' +
          'fabricated, not measured.',
        evidence:
          'The Fraud-and-Financial-Crime Function Pack expects all four ' +
          'metrics from the fraud-management, authorisation, and identity ' +
          'systems; First Capital’s audited substrate carries none of them ' +
          'yet — a precise, named seed gap.',
        evidenceRestsOnSeedGap: true,
        gestureLabel: 'Review the real-time-fraud seed gaps',
        gestureHref: '/admin/data-trust',
      },
    ];

    // Block 4 — where you are in the cadence. The BSA / AML supervisory
    // cycle — the OCC examination rhythm and the SAR filing deadline — is the
    // calendar this function actually runs on, overlaid with the active
    // MRA-2 remediation milestones for First Capital.
    const stages: CadenceStage[] = [
      {
        key: 'mra_open_remediation',
        label: 'MRA / examination findings — open remediation',
        demands:
          'The OCC MRA-2 cycle is open: AML monitoring tuning, SAR ' +
          'timeliness, and the supporting case workflow are under ' +
          'documented remediation against a supervisor-set deadline. The ' +
          'fraud function operates under the discipline of an active ' +
          'finding.',
        isCurrent: true,
      },
      {
        key: 'sar_filing_window',
        label: 'SAR filing window — statutory clock',
        demands:
          'The BSA SAR filing deadline (30 / 60 days depending on ' +
          'continuing-activity status) is a hard regulatory clock. Every ' +
          'alert disposed past deadline is a finding, not a metric — a ' +
          'standing demand on investigator capacity.',
        isCurrent: false,
      },
      {
        key: 'aml_independent_test',
        label: 'Annual AML programme independent test',
        demands:
          'The mandatory annual independent test reviews the programme’s ' +
          'design, the monitoring scenarios, the training, and the case ' +
          'workflow. New tooling adopted now is what the test reads in the ' +
          'next cycle.',
        isCurrent: false,
      },
      {
        key: 'fraud_loss_quarterly_review',
        label: 'Quarterly fraud-loss and detection review',
        demands:
          'Card and digital-channel fraud-loss run-rates are reviewed ' +
          'quarterly against the program baseline. First Capital is on ' +
          'track in P4 Value Tracking (FC-FRAUD-2026) but the gap from ' +
          '$2.1M to the $1.2M peer median is not yet closed.',
        isCurrent: false,
      },
    ];
    const cadence: CadenceBlock = {
      frameName: 'BSA / AML supervisory cycle + OCC MRA-2 remediation',
      framing:
        'First Capital’s fraud function runs on a regulatory tempo first: ' +
        'the OCC examination cycle, the active MRA-2 remediation, the ' +
        'statutory SAR filing deadline, and the annual independent AML ' +
        'test set when the work must land. The fraud-loss rhythm is ' +
        'secondary but real.',
      stages,
      currentDemand:
        'First Capital is mid-MRA remediation — the supervisor is reading ' +
        'whether the AML monitoring estate has been tuned and whether SAR ' +
        'timeliness has cleared. Both measured metrics that sit low in ' +
        'their planning bands are addressable from here; the real-time-' +
        'card-fraud substrate must be seeded before that case can be ' +
        'made beside this one.',
    };

    return { headline, decisions, cadence };
  },
};

// Register First Capital's binding eagerly on module load.
registerDecisionHomeBinding(FIRSTCAPITAL_DECISION_HOME_BINDING);

// ─────────────────────────────────────────────────────────────────────────────
// Thin public shim
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the decision home for the First Capital × fraud binding.
 *
 * A thin shim over the generic `buildVbcDecisionHome` that calls it with the
 * First Capital constants.
 *
 * @param tenantName The resolved tenant display name (e.g. "First Capital Financial").
 */
export function buildFirstCapitalFraudDecisionHome(tenantName: string) {
  return buildVbcDecisionHome(
    FIRSTCAPITAL_INDUSTRY_KEY,
    FIRSTCAPITAL_FUNCTION_KEY,
    tenantName,
  );
}

/** Re-export the substrate for tests that want to inspect FC's evidence. */
export const FIRSTCAPITAL_FRAUD_OBSERVATIONS_PUBLIC: TenantSubstrate =
  FIRSTCAPITAL_FRAUD_OBSERVATIONS;

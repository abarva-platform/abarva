// Apex Retail × Customer care & service operations — the bet-selection binding.
//
// Apex Retail's tenant binding for the function-aware Intelligence bet-
// selection surface. The generic `buildVbcBetSelection` (in
// `meridian-vbc-bet-selection.ts`) is already generic over `(industryKey,
// functionKey)`; this module supplies the substrate that grounds it for an
// Apex contact-centre operator AND the retail-named copy that frames the
// ranking in language a CXO of Apex actually uses.
//
// SAME SUBSTRATE AS THE DECISION HOME — the bet-selection facet must agree
// with the decision home, not invent a second, divergent picture of Apex.
// The observations below are intentionally identical (in metric keys and
// values) to `apex-decision-home.ts`'s `APEX_CUSTOMER_CARE_OBSERVATIONS`,
// minus the `read` field that the decision-home view consumes — only the
// citation and the seed-gap reason are needed here.
//
// Pure, deterministic, typed module — no I/O.

import type { BetSelectionHeadline, RankingGate } from './meridian-vbc-bet-selection';
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

/** Apex Retail's industry — the retail vertical. */
export const APEX_INDUSTRY_KEY = 'retail' as const;
/** The spine function — customer care. */
export const APEX_FUNCTION_KEY = 'customer_care' as const;
/** The Apex tenant key. */
export const APEX_TENANT_KEY = 'apexretail' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Apex Retail substrate — the audited contact-centre evidence base
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apex's audited customer-care substrate for bet-selection scoring. The
 * observations are the same audited values the decision-home binding
 * grounds against — the two surfaces must read off the same Apex.
 */
const APEX_CUSTOMER_CARE_OBSERVATIONS: readonly TenantMetricObservation[] = [
  {
    metricKey: 'self_service_resolution_rate',
    value: 28,
    source:
      'Apex evidence base — KPI kpi:apex:018 (NICE CXone contact-centre ' +
      'containment), as-of 2026-04-30.',
  },
  {
    metricKey: 'first_contact_resolution',
    value: 68,
    source:
      'Apex evidence base — KPI kpi:apex:020 (NICE CXone first-call ' +
      'resolution), as-of 2026-04-30.',
  },
  {
    metricKey: 'customer_satisfaction_score',
    value: 82,
    source:
      'Apex evidence base — KPI kpi:apex:012 (Zendesk post-interaction ' +
      'survey, 4.1 / 5 → 82%), as-of 2026-04-30.',
  },
  {
    metricKey: 'average_handle_time',
    value: 7.2,
    source:
      'Apex evidence base — KPI kpi:apex:019 (NICE CXone average handle ' +
      'time, minutes per contact), as-of 2026-04-30.',
  },
  {
    metricKey: 'escalation_rate',
    value: 18.4,
    source:
      'Apex evidence base — Move P2 baseline deliverable (Genesys routing ' +
      'export, repeat-transfer rate), as-of 2026-05-03.',
  },
  {
    metricKey: 'cost_per_contact',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Cost per contact is not recorded in Apex’s KPI dictionary. The ' +
      'tenant action item "Capture cost-per-contact baseline" (owner ' +
      'Brendan Fox, due 2026-05-15) is the explicit blocker. Sourced from ' +
      'the contact-centre cost ledger and the workforce-management system.',
  },
  {
    metricKey: 'contacts_per_order',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'No annual contact volume and no order-to-contact join are seeded — ' +
      'the failure-demand framing has no numerator. Sourced from the OMS ' +
      '+ contact-centre platforms joined on customer and order identifiers.',
  },
  {
    metricKey: 'service_level',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Service level (% of contacts answered in target wait) is not in ' +
      'Apex’s KPI dictionary. Sourced from the NICE CXone / Genesys ACD ' +
      'telemetry.',
  },
  {
    metricKey: 'contact_abandonment_rate',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Contact abandonment is not seeded — the deflection-quality discipline ' +
      'rests on it being measured. Sourced from the contact-centre platform.',
  },
  {
    metricKey: 'avoidable_contact_share',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'No contact-driver coding is in place: Apex cannot quantify the share ' +
      'of contact volume traced to a preventable upstream defect. Sourced ' +
      'from contact-reason coding joined to OMS / delivery exception data.',
  },
  {
    metricKey: 'service_nps',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Apex measures CSAT but not a post-service NPS — so the loyalty-' +
      'verdict lever cannot be sized. Sourced from the customer-experience ' +
      'survey platform on the post-service flow.',
  },
  {
    metricKey: 'agent_attrition_rate',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Agent attrition (annualised turnover) is not seeded. Sourced from ' +
      'the HR / WFM system against the agent headcount.',
  },
] as const;

/** The metric keys Apex has grounded — exported for tests. */
export const APEX_GROUNDED_CUSTOMER_CARE_BET_METRIC_KEYS: ReadonlySet<string> =
  new Set(
    APEX_CUSTOMER_CARE_OBSERVATIONS.filter((o) => o.value !== null).map(
      (o) => o.metricKey,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// The Apex × customer-care bet-selection binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apex's tenant binding for the function-aware bet-selection surface. The
 * binding ships the audited customer-care substrate plus the retail-operator-
 * named headline + gates that frame the ranking. The top bet — conversational
 * self-service — earns its rank on the one measured, off-benchmark metric Apex
 * carries (containment 28% vs. 30–70). The gates name, in plain language, the
 * audited seed gaps that would re-order this list if closed.
 */
export const APEX_BET_SELECTION_BINDING: BetSelectionBinding = {
  industryKey: APEX_INDUSTRY_KEY,
  functionKey: APEX_FUNCTION_KEY,
  tenantBindingKey: 'apex-customer-care',
  expectedClientKey: 'apexretail',
  substrate: APEX_CUSTOMER_CARE_OBSERVATIONS,
  buildBlocks(ctx: BetSelectionBindingContext): BetSelectionGroundedBlocks {
    const { topBetName, topBetRead, totalBets, heldBetCount } = ctx;

    const headline: BetSelectionHeadline = {
      eyebrow: 'Customer care & service operations · the bet to make first',
      question:
        'Which customer-care AI bet should Apex Retail make first?',
      answer:
        topBetRead === 'fund_first'
          ? `Make the ${topBetName} bet first.`
          : `The most fundable bet today is ${topBetName} — but shape it before funding.`,
      rationale:
        `Of the customer-care function’s ${totalBets} AI use-case ` +
        `archetypes, ${topBetName} is the one Apex’s audited substrate ` +
        `(NICE CXone + Zendesk + the Move P2 Genesys baseline) makes ` +
        `fundable now: it moves a metric Apex has measured and that is ` +
        `sitting below the function’s planning band — contact-centre ` +
        `containment at 28% against a 30–70% band (KPI kpi:apex:018). ` +
        `That is recurring cost-to-serve visibly on the table, and ` +
        `genuine (not contained) deflection is the lever that lifts it. ` +
        `It is also a mainstream bet — the lower-risk first move with ` +
        `Apex’s live Contact Center AI Routing Move already in flight.`,
      honestyClause:
        `This ranking is honest about its own limits. ${heldBetCount} ` +
        `of the ${totalBets} bets — the service-demand-forecasting-and-` +
        `scheduling archetype — move only metrics Apex has not seeded ` +
        `(service level, abandonment, cost per contact, agent attrition). ` +
        `It is held for evidence, not ranked on a fabricated number. The ` +
        `cost-per-contact baseline (tenant action item due 2026-05-15) is ` +
        `the single seed gap that bounds every grounded bet’s dollar ` +
        `forecast; the others are named in full below.`,
    };

    const gates: RankingGate[] = [
      {
        key: 'gate_cost_per_contact_baseline',
        title: 'The cost-per-contact baseline is unseeded',
        description:
          'The Customer-care Function Pack expects a fully-loaded cost per ' +
          'contact — agent labour, technology, and overhead allocated to ' +
          'contact volume by channel — from the contact-centre cost ledger ' +
          'and the workforce-management system. Apex has not yet seeded it; ' +
          'the tenant action item "Capture cost-per-contact baseline" ' +
          '(owner Brendan Fox, due 2026-05-15) is the explicit blocker.',
        whatItWouldMove:
          'Seeding cost per contact would convert containment lift, agent-' +
          'assist productivity, and scheduling sharpness into Apex’s own ' +
          'dollars rather than the kernel benchmark proxy — every grounded ' +
          'bet’s value forecast becomes a CFO-defensible figure rather than ' +
          'a labelled planning range.',
      },
      {
        key: 'gate_contact_driver_coding',
        title: 'Contact-driver coding and avoidable-contact share are unseeded',
        description:
          'No contact-reason taxonomy or contact-driver attribution is in ' +
          'place. The Function Pack’s contact-driver-and-quality-' +
          'intelligence archetype rests on this being measured — without it ' +
          'Apex cannot quantify the share of contact volume traced to ' +
          'preventable upstream defects (broken delivery promises, ' +
          'confusing returns policy, website errors). Sourced from contact-' +
          'reason coding joined to OMS / delivery exception data.',
        whatItWouldMove:
          'Seeding the contact-driver view would move the contact-driver-' +
          'and-quality-intelligence bet out of shape into a candidate ' +
          'fundable position — and would let the proactive-service-outreach ' +
          'bet target a real avoidable-contact volume rather than ' +
          'reasoning about it from inference.',
      },
      {
        key: 'gate_service_demand_telemetry',
        title: 'Service-level, abandonment, and demand telemetry are unseeded',
        description:
          'The classic "X% answered in Y seconds" service level, the ' +
          'contact-abandonment rate, and a structured intraday demand ' +
          'forecast are not in Apex’s KPI dictionary. Sourced from the ' +
          'NICE CXone / Genesys ACD telemetry. Their absence means staffing ' +
          'discipline cannot be evaluated and the demand-forecasting bet ' +
          'has no demand signal to forecast.',
        whatItWouldMove:
          'Seeding the ACD telemetry would let the service-demand-' +
          'forecasting-and-scheduling bet be ranked on measured volatility ' +
          'rather than held for evidence — and it would surface ' +
          'abandonment as the honesty check on the containment number that ' +
          'currently drives the headline.',
      },
      {
        key: 'gate_service_nps_attrition',
        title: 'Service NPS and agent attrition are unseeded',
        description:
          'Apex carries Zendesk CSAT (4.1 / 5) but no post-service NPS, ' +
          'and no annualised agent-turnover figure from the HR / WFM ' +
          'system. Both are core sensitivities — service-driven retention ' +
          'value and the agent-experience tax that bounds the agent-assist ' +
          'forecast.',
        whatItWouldMove:
          'A seeded service NPS would let the retention lever in the ' +
          'value model be sized against Apex’s own loyalty data; a seeded ' +
          'agent attrition baseline would let the agent-assist case carry ' +
          'a measured productivity-and-tenure haircut rather than a ' +
          'benchmark band.',
      },
    ];

    return { headline, gates };
  },
};

// Register Apex's binding eagerly on module load.
registerBetSelectionBinding(APEX_BET_SELECTION_BINDING);

// ─────────────────────────────────────────────────────────────────────────────
// Thin public shim
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the bet selection for the Apex × customer-care binding.
 *
 * A thin shim over the generic `buildVbcBetSelection` that calls it with the
 * Apex constants.
 *
 * @param tenantName The resolved tenant display name (e.g. "Apex Retail").
 */
export function buildApexCustomerCareBetSelection(tenantName: string) {
  return buildVbcBetSelection(APEX_INDUSTRY_KEY, APEX_FUNCTION_KEY, tenantName);
}

/** Re-export the substrate for tests that want to inspect Apex's evidence. */
export const APEX_CUSTOMER_CARE_BET_OBSERVATIONS_PUBLIC: TenantSubstrate =
  APEX_CUSTOMER_CARE_OBSERVATIONS;

// Apex Retail × Customer care & service operations — the decision-home binding.
//
// Apex Retail's tenant binding for the function-aware decision home. The
// generic `buildVbcDecisionHome` (in `meridian-vbc-decision-home.ts`) is
// already generic over `(industryKey, functionKey)`; this module supplies the
// substrate that grounds it for an Apex contact-centre operator.
//
// SPINE FUNCTION — Apex's most decision-relevant function for "which AI bet
// first" is customer care: it carries the live Contact Center AI Routing Move,
// the audited KPI dictionary (NICE CXone + Zendesk + Genesys), and the
// containment / FCR / AHT / repeat-transfer telemetry. The companion spine
// `pricing_promotions` is the margin lever, but customer care is where Apex's
// audited operating-metric substrate lives and where the first AI Move is
// already in flight — so customer care is the primary binding.
//
// GROUNDING DISCIPLINE — every non-null observation below traces to Apex's
// audited evidence base (the KPI dictionary kpi:apex:* and the Move P2
// baseline). Where the Customer-care Function Pack expects a metric Apex has
// not measured, the observation carries `value: null` and a precise
// `seedGapReason` naming what is missing and what its absence blocks. That is
// the spec's §3 "honest by construction" bar — Apex's surface shows what it
// truly knows and is plainly honest about the rest.
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

/** Apex Retail's industry — the retail vertical. */
export const APEX_INDUSTRY_KEY = 'retail' as const;

/**
 * The spine function the decision-home binding picks for Apex Retail —
 * customer care & service operations. Per
 * `/intelligence/decision/page.tsx`'s `INDUSTRY_SPINE_FUNCTION_KEY` map this is
 * the default function the surface binds when a Move has not yet classified a
 * function key for a retail tenant.
 */
export const APEX_FUNCTION_KEY = 'customer_care' as const;

/** The Apex tenant key — matches `client-config.ts` and `active-client.ts`. */
export const APEX_TENANT_KEY = 'apexretail' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Apex Retail substrate — the audited contact-centre evidence base
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apex Retail's audited customer-care substrate, expressed against the
 * Customer-care Function Pack's operating-metric vocabulary.
 *
 * GROUNDING DISCIPLINE — every non-null value traces to Apex's audited KPI
 * dictionary (`kpi:apex:*`, sourced from NICE CXone, Zendesk, and the Move P2
 * Genesys routing export) or the live Contact Center AI Routing Move
 * baseline. The numbers themselves are the audited substrate Apex's living
 * Move already runs against (`src/lib/programs/expert-kernel/living-move-cases.ts`
 * → `apexBaseline`).
 *
 * What is measured, mapped to the customer-care Function Pack:
 *   • Self-service resolution rate — Apex containment at 28% (kpi:apex:018).
 *     This sits BELOW the function's 30–70 planning band — the one
 *     measured-and-off metric the headline asserts.
 *   • First-contact resolution — Apex FCR at 68% (kpi:apex:020).
 *   • CSAT — Apex 82% (Zendesk 4.1/5, kpi:apex:012).
 *   • Average handle time — Apex AHT 7.2 min (kpi:apex:019).
 *   • Escalation rate — Apex repeat-transfer 18.4% (Move P2 baseline).
 *
 * What is NOT measured — declared seed gaps with their expected data source:
 *   • Cost per contact — not recorded in the KPI dictionary; the Apex tenant
 *     action item to capture a fully-loaded cost-per-contact baseline is the
 *     one explicit blocker for the Move's value forecast.
 *   • Contacts per order — annual contact volume is itself a seed gap, so the
 *     orders-to-contacts ratio cannot be computed.
 *   • Service level (% in target wait) — not seeded.
 *   • Contact abandonment rate — not seeded.
 *   • Avoidable-contact share — no contact-driver attribution exists.
 *   • Service NPS — Zendesk CSAT is seeded but a service-NPS survey is not.
 *   • Agent attrition rate — not seeded.
 */
const APEX_CUSTOMER_CARE_OBSERVATIONS: readonly TenantMetricObservation[] = [
  {
    metricKey: 'self_service_resolution_rate',
    value: 28,
    source:
      'Apex evidence base — KPI kpi:apex:018 (NICE CXone contact-centre ' +
      'containment), as-of 2026-04-30. Known NICE-vs-IT-dashboard ' +
      'discrepancy is on James Wright’s reconciliation owner list (due ' +
      '2026-05-08).',
    read:
      'At 28%, Apex containment sits BELOW the Function Pack’s 30–70 ' +
      'planning band — fourth-quartile on assisted-service maturity. The ' +
      'easy traffic is already deflected; the residual is voice contact ' +
      'that the IVR and chatbot can no longer handle without a richer ' +
      'conversational layer.',
  },
  {
    metricKey: 'first_contact_resolution',
    value: 68,
    source:
      'Apex evidence base — KPI kpi:apex:020 (NICE CXone first-call ' +
      'resolution), as-of 2026-04-30.',
    read:
      'FCR at 68% sits in the lower-middle of the Function Pack’s 65–85 ' +
      'planning band — workable, but the repeat-transfer rate (18.4%, Move ' +
      'P2 baseline) signals a quiet stream of re-contacts the assist tooling ' +
      'has not yet closed.',
  },
  {
    metricKey: 'customer_satisfaction_score',
    value: 82,
    source:
      'Apex evidence base — KPI kpi:apex:012 (Zendesk post-interaction ' +
      'survey, scored 4.1 / 5 → 82%), as-of 2026-04-30. 22% response rate ' +
      'is the standing caveat — biased toward extreme experiences.',
    read:
      'CSAT at 82% sits comfortably inside the 75–92 band, but the 22% ' +
      'response rate caveat means it is the least-load-bearing measured ' +
      'metric — a healthy headline that does not yet tell Apex which issue ' +
      'types are eroding the relationship.',
  },
  {
    metricKey: 'average_handle_time',
    value: 7.2,
    source:
      'Apex evidence base — KPI kpi:apex:019 (NICE CXone average handle ' +
      'time, minutes per agent-handled contact), as-of 2026-04-30. ' +
      'Documented caveat: AHT is rising because the easy calls are already ' +
      'deflected and the harder ones reach agents.',
    read:
      'AHT at 7.2 minutes sits inside the 4–12 planning band but is ' +
      'rising — a cleanly-described mix-shift effect, not a productivity ' +
      'failure. The handle-time number cannot be cut without sacrificing ' +
      'resolution; the agent-assist bet is the lever that lifts FCR ' +
      'underneath it.',
  },
  {
    metricKey: 'escalation_rate',
    value: 18.4,
    source:
      'Apex evidence base — Move P2 baseline deliverable (Genesys routing ' +
      'export, repeat-transfer rate, promotion weeks excluded), as-of ' +
      '2026-05-03.',
    read:
      'Repeat-transfer at 18.4% sits at the top end of the Function Pack’s ' +
      '5–20 planning band — close to off. It corroborates the FCR gap: ' +
      'work that is not resolved first-time is being handed sideways or up.',
  },
  {
    metricKey: 'cost_per_contact',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Cost per contact is not recorded in Apex’s KPI dictionary or in the ' +
      'Move P2 baseline. The tenant action item "Capture cost-per-contact ' +
      'baseline" (owner Brendan Fox, due 2026-05-15) is the explicit blocker. ' +
      'Without a fully-loaded cost-per-contact the deflection economics of ' +
      'the conversational-self-service bet cannot be quantified — the gross ' +
      'value runs on a benchmark proxy until Apex attests a figure.',
  },
  {
    metricKey: 'contacts_per_order',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Apex’s KPI dictionary carries no annual contact volume and no ' +
      'order-to-contact join. Without a contacts-per-order baseline the ' +
      'failure-demand framing — care volume as a symptom of upstream defect ' +
      'rather than a fixed cost — has no numerator. Sourced from the OMS + ' +
      'contact-centre platforms joined on customer and order identifiers.',
  },
  {
    metricKey: 'service_level',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Service level — the classic "X% answered in Y seconds" measure — ' +
      'is not in Apex’s KPI dictionary. Its absence means staffing-to-' +
      'demand discipline cannot be evaluated against a target wait. ' +
      'Sourced from the NICE CXone / Genesys ACD telemetry.',
  },
  {
    metricKey: 'contact_abandonment_rate',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Contact abandonment is not seeded. Without it Apex cannot tell ' +
      'genuine self-service deflection from customers who simply gave up — ' +
      'the deflection-quality discipline rests on this number being ' +
      'measured. Sourced from the contact-centre platform.',
  },
  {
    metricKey: 'avoidable_contact_share',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'No contact-driver coding is in place: Apex cannot quantify the share ' +
      'of contact volume traced to a preventable upstream defect (broken ' +
      'delivery promise, confusing policy, website error). The contact-' +
      'driver-and-quality-intelligence bet rests on closing this gap. ' +
      'Sourced from contact-reason coding joined to OMS / delivery exception ' +
      'data.',
  },
  {
    metricKey: 'service_nps',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Apex measures CSAT (Zendesk 4.1 / 5) but not a post-service NPS — ' +
      'so the loyalty-verdict lever (retained-customer value from faster, ' +
      'first-time resolution) cannot be sized. Sourced from the customer-' +
      'experience survey platform on the post-service flow.',
  },
  {
    metricKey: 'agent_attrition_rate',
    value: null,
    source: 'seed gap — not in Apex’s audited substrate.',
    seedGapReason:
      'Agent attrition is a structural cost of any retail contact-centre ' +
      'and a core sensitivity for the agent-assist bet, but Apex has not ' +
      'seeded an annualised turnover figure. Sourced from the HR / WFM ' +
      'system against the agent headcount.',
  },
] as const;

/** The metric keys Apex has grounded with substrate — exported for tests. */
export const APEX_GROUNDED_CUSTOMER_CARE_METRIC_KEYS: ReadonlySet<string> =
  new Set(
    APEX_CUSTOMER_CARE_OBSERVATIONS.filter((o) => o.value !== null).map(
      (o) => o.metricKey,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// The Apex × customer-care decision-home binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apex Retail's tenant binding for the function-aware decision home. The
 * binding ships its audited customer-care substrate plus the retail-operator-
 * named copy that grounds the four §4 blocks — the answer is the conversational
 * self-service bet, the cadence is the retail promotional / peak-season rhythm.
 */
export const APEX_DECISION_HOME_BINDING: DecisionHomeBinding = {
  industryKey: APEX_INDUSTRY_KEY,
  functionKey: APEX_FUNCTION_KEY,
  tenantBindingKey: 'apex-customer-care',
  expectedClientKey: 'apexretail',
  substrate: APEX_CUSTOMER_CARE_OBSERVATIONS,
  buildBlocks(): DecisionHomeGroundedBlocks {
    // Block 1 — the one thing. The headline asserts only audited truth:
    // containment at 28% sits below the Function Pack's 30–70 band — the one
    // measured-and-off metric Apex's customer-care substrate carries today.
    // The honesty clause names, in the same breath, the structural cost-per-
    // contact gap that bounds the deflection economics until it is seeded.
    const headline: DecisionHomeHeadline = {
      eyebrow: 'Customer care & service operations',
      statement:
        'Apex’s contact-centre containment sits at 28% — BELOW the function’s ' +
        '30–70% planning band — and the easy traffic is already deflected. ' +
        'The residual voice volume is the harder calls that the current IVR ' +
        'and chatbot cannot handle, and average handle time is rising ' +
        'underneath it as that mix shifts.',
      honestyClause:
        'This is the one truth Apex’s audited substrate (NICE CXone + ' +
        'Zendesk + the Move P2 Genesys baseline) can assert today. The cost-' +
        'per-contact baseline that converts containment lift into dollars is ' +
        'not yet seeded — it is the explicit tenant action item due ' +
        '2026-05-15. The conversational-self-service bet is the right one to ' +
        'fund first; its DOLLAR forecast is bounded by that seed gap until ' +
        'the baseline lands.',
      cadenceAnchor:
        'The retail peak-season ramp — Black Friday, Cyber Monday, and the ' +
        'holiday delivery window — is the deadline this depends on.',
    };

    // Block 2 — decisions that need you. Each card is answer-first and
    // grounded: action, stake, one evidence line, one gesture deeper.
    const decisions: DecisionCard[] = [
      {
        key: 'fund_conversational_self_service',
        urgency: 'decide_now',
        recommendedAction:
          'Fund the conversational-self-service Move — extend the assisted-' +
          'service layer to resolve bounded service journeys end to end ' +
          '(order status, returns initiation, simple policy questions) ' +
          'with a warm, context-rich transfer for anything outside scope, ' +
          'before the peak-season volume ramp.',
        stake:
          'Containment at 28% vs. the 30–70 band means Apex is sitting on ' +
          'recurring cost-to-serve the function values at a 10–35% relative ' +
          'reduction (planning range). Every percentage point of genuine ' +
          'resolution removed from the agent queue compounds across the ' +
          'volume spike at peak.',
        evidence:
          'Apex evidence base KPI kpi:apex:018: NICE CXone containment 28%, ' +
          'fourth-quartile on assisted-service maturity. The gap to the ' +
          'function’s planning band is real and measured, even with the ' +
          'pending NICE-vs-IT dashboard reconciliation.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the costed Contact Center AI Routing case',
        gestureHref: '/moves',
      },
      {
        key: 'close_repeat_transfer_loop',
        urgency: 'this_cycle',
        recommendedAction:
          'Stand up the agent-assist and intent-aware-routing pair — give ' +
          'every agent a single workspace with the resolved customer and ' +
          'order context, a grounded knowledge-base copilot, and routing ' +
          'that classifies intent and complexity before the next-available ' +
          'queue does.',
        stake:
          'Repeat-transfer at 18.4% (Move P2 baseline) is brushing the top ' +
          'of the function’s 5–20 escalation band. Every transfer is a ' +
          'second contact whose cost is being absorbed silently — and the ' +
          'rising AHT signals the front line is no longer enabled for the ' +
          'harder traffic the deflection layer is leaving behind.',
        evidence:
          'Apex evidence base KPI kpi:apex:019 (AHT 7.2 min, rising) and ' +
          'Move P2 baseline (repeat-transfer 18.4%, Genesys routing export). ' +
          'The cost is real and measured, even if the cost-per-contact is ' +
          'still a seed gap.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the agent-assist + routing decision',
        gestureHref: '/moves',
      },
      {
        key: 'seed_cost_per_contact_baseline',
        urgency: 'decide_now',
        recommendedAction:
          'Commission the fully-loaded cost-per-contact baseline — agent ' +
          'labour, technology, and overhead allocated to contact volume by ' +
          'channel — before any contact-centre AI Move value forecast is ' +
          'underwritten beyond the kernel benchmark proxy.',
        stake:
          'Without a measured cost-per-contact the Move’s gross value runs ' +
          'on a benchmark proxy (a labelled planning range), not on Apex’s ' +
          'own economics. A forecast built on the proxy alone is not what a ' +
          'CFO can defend to the board — it is a hypothesis, not a case.',
        evidence:
          'Tenant action item "Capture cost-per-contact baseline" (owner ' +
          'Brendan Fox, due 2026-05-15) is the documented blocker. The ' +
          'Function Pack expects the metric from the contact-centre cost ' +
          'ledger and WFM system; Apex’s audited substrate does not yet ' +
          'carry it — a precise, named seed gap.',
        evidenceRestsOnSeedGap: true,
        gestureLabel: 'Review the cost-per-contact seed gap',
        gestureHref: '/admin/data-trust',
      },
    ];

    // Block 4 — where you are in the cadence. The retail peak-season rhythm —
    // promotional ramp through Black Friday / Cyber Monday into the holiday
    // delivery window — is the calendar this function actually runs on.
    const stages: CadenceStage[] = [
      {
        key: 'shoulder_steady_state',
        label: 'Shoulder / steady state — assist layer in flight',
        demands:
          'The non-peak window where the assisted-service layer can be ' +
          'extended, the agent-assist tooling trained, and the knowledge ' +
          'base remediated against actual contact reasons — the work that ' +
          'must land before volume ramps.',
        isCurrent: false,
      },
      {
        key: 'pre_peak_ramp',
        label: 'Pre-peak ramp — promotional run-up',
        demands:
          'The capture window where containment lift, FCR uplift, and ' +
          'agent-assist adoption must be locked in. This is where Apex ' +
          'sits: containment at 28% and repeat-transfer at 18.4% are both ' +
          'still moveable, but the runway is short and the cost-per-' +
          'contact baseline must be in hand to underwrite the case.',
        isCurrent: true,
      },
      {
        key: 'peak_season',
        label: 'Peak season — Black Friday / Cyber Monday / holiday',
        demands:
          'Volume multiplies and the resilience of every change is tested ' +
          'on live customers. New experiments do not ship in this window; ' +
          'the operation runs on what was hardened in pre-peak.',
        isCurrent: false,
      },
      {
        key: 'post_peak_returns',
        label: 'Post-peak — returns and reverse-logistics tail',
        demands:
          'The contact mix shifts to returns, refund disputes, and delivery ' +
          'exceptions — the failure-demand window where contact-driver ' +
          'intelligence is most diagnostic, and where the avoidable-' +
          'contact share would be most decision-relevant if it were seeded.',
        isCurrent: false,
      },
    ];
    const cadence: CadenceBlock = {
      frameName: 'Retail peak-season operating cadence',
      framing:
        'The retail year runs on a promotional and peak rhythm — the ' +
        'pre-peak ramp is when contact-centre AI investment must harden ' +
        'before volume tests it; the holiday window is when the resilience ' +
        'of the assist layer is judged on live customers.',
      stages,
      currentDemand:
        'Apex is in the pre-peak ramp — the last stretch where containment ' +
        'and repeat-transfer can still be moved before volume tests them at ' +
        'peak. Both measured metrics that are off or near-off are ' +
        'addressable from here; after peak they are fixed for the cycle.',
    };

    return { headline, decisions, cadence };
  },
};

// Register Apex's binding eagerly on module load. The generic builder consults
// the registry; Apex is one tenant binding among several.
registerDecisionHomeBinding(APEX_DECISION_HOME_BINDING);

// ─────────────────────────────────────────────────────────────────────────────
// Thin public shim — symmetry with `buildMeridianVbcDecisionHome`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the decision home for the Apex × customer-care binding.
 *
 * A thin shim over the generic `buildVbcDecisionHome` that calls it with the
 * Apex constants. Symmetric with `buildMeridianVbcDecisionHome` — existing
 * callers and tests that prefer the tenant-named builder over the generic
 * `(industryKey, functionKey, tenantName)` form keep working uniformly.
 *
 * @param tenantName The resolved tenant display name (e.g. "Apex Retail").
 */
export function buildApexCustomerCareDecisionHome(tenantName: string) {
  return buildVbcDecisionHome(APEX_INDUSTRY_KEY, APEX_FUNCTION_KEY, tenantName);
}

/** Re-export the substrate for tests that want to inspect Apex's evidence. */
export const APEX_CUSTOMER_CARE_OBSERVATIONS_PUBLIC: TenantSubstrate =
  APEX_CUSTOMER_CARE_OBSERVATIONS;

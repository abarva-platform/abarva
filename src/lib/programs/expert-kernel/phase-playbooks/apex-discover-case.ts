// Expert Kernel — Apex Contact Center AI Routing · Discover deliverables.
//
// Builds the four Discover-phase deliverables for the real Apex Move, grounded
// in the audited substrate (`docs/strategy/APEX-REALNESS-AUDIT-CONTACT-CENTER.md`).
//
// Recorded baseline metrics come from `src/scripts/setup-data/apex-data/` KPIs
// and the Move P2 baseline deliverable. The four absent items
// (cost-per-contact, contact volume, channel mix, QA error rate) are declared
// honest seed gaps — never fabricated. As a result the opportunity can only be
// expressed directionally, and the go/no-go returns 'reshape', not 'go'.
//
// Pure module: deterministic, no I/O.

import {
  buildDiscoverDeliverables,
  type DiscoverDeliverables,
} from './discover';

const TENANT = 'apex-retail';
const MOVE = 'Contact Center AI Routing';

/**
 * Build the Apex Contact Center AI Routing Discover deliverables. The
 * archetype is `human_in_loop_agent` per the Apex audit (agent-assist first,
 * not full deflection). Deterministic.
 */
export function buildApexContactCenterDiscover(): DiscoverDeliverables {
  return buildDiscoverDeliverables({
    moveName: MOVE,
    tenantKey: TENANT,
    archetype: 'human_in_loop_agent',
    problemStatement:
      'Contact-centre containment sits at 28% against a 40% target while ' +
      'average handle time is rising (7.2 min, up from 6.4) — easy contacts ' +
      'are deflected, leaving agents the hard ones, so cost-to-serve and ' +
      'repeat-transfer (18.4%) are climbing without a routing intelligence ' +
      'layer.',
    anchorMetricKey: 'containment_pct',
    // Recorded metrics — audited Apex substrate. Seed gaps declared honestly.
    baselineMetrics: [
      {
        key: 'aht_minutes',
        label: 'Average Handle Time',
        value: 7.2,
        unit: 'minutes',
        source: 'KPI kpi:apex:019 (NICE CXone)',
        sourceQuality: 'measured',
        asOf: '2026-04-30',
        confidence: 'high',
        caveat:
          'Rising because easy calls are deflected; harder calls reach agents.',
      },
      {
        key: 'containment_pct',
        label: 'Contact Center Containment',
        value: 28,
        unit: 'percent',
        source: 'KPI kpi:apex:018 (NICE CXone)',
        sourceQuality: 'measured',
        asOf: '2026-04-30',
        confidence: 'medium',
        caveat:
          'Known NICE-vs-IT-dashboard measurement discrepancy; reconciliation ' +
          'owned by James Wright, due 2026-05-08.',
      },
      {
        key: 'repeat_transfer_pct',
        label: 'Repeat transfer rate',
        value: 18.4,
        unit: 'percent',
        source: 'Move P2 baseline deliverable (Genesys routing export)',
        sourceQuality: 'measured',
        asOf: '2026-05-03',
        confidence: 'medium',
        caveat: 'Promotion weeks excluded.',
      },
      {
        key: 'agent_utilization_pct',
        label: 'Agent Utilization',
        value: 84,
        unit: 'percent',
        source: 'KPI kpi:apex:021 (NICE CXone)',
        sourceQuality: 'measured',
        asOf: '2026-04-30',
        confidence: 'high',
        caveat: 'Above the 80% target — capacity strain bounds labour takeout.',
      },
      // --- Declared seed gaps — honest "not recorded" (see the audit) ------
      {
        key: 'cost_per_contact_usd',
        label: 'Cost per contact (labour)',
        value: null,
        unit: 'usd',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not recorded. Tenant action item "Capture cost-per-contact ' +
          'baseline" (owner Brendan Fox) is due 2026-05-15 — see operating ' +
          'telemetry. The single highest-leverage missing input.',
      },
      {
        key: 'contact_volume_annual',
        label: 'Annual contact volume',
        value: null,
        unit: 'contacts_per_year',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not recorded in the KPI dictionary, telemetry, or the Move ' +
          'baseline. Needed to convert AHT/containment deltas into FTE-hours.',
      },
      {
        key: 'channel_mix',
        label: 'Channel mix (voice/chat/IVR split)',
        value: null,
        unit: 'percent_split',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Containment note references "IVR + chatbot" but no structured ' +
          'split is seeded.',
      },
      {
        key: 'qa_error_rate_pct',
        label: 'QA error rate',
        value: null,
        unit: 'percent',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'No contact-centre quality-defect metric is seeded for Apex.',
      },
    ],
    opportunityStatement:
      'Lifting containment 28% → 40% with intelligent routing and agent ' +
      'assist would re-route the easy-contact load away from agents and cut ' +
      'repeat transfers — but the opportunity can only be stated ' +
      'directionally until annual contact volume and cost-per-contact are ' +
      'recorded.',
    // No compliance kill is observed — the 2026-05-17 privacy review is
    // expected to clear (per the Apex audit), so it is NOT passed here. The
    // data-driven volume/cost triggers fire automatically from the seed gaps.
  });
}

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSeedClient, loadSeedEnv, TENANTS, type TenantKey } from './seed-wave-lib';

interface ClientRow {
  id: string;
  name: string;
}

interface PersonRow {
  id: string;
  name: string;
}

interface BriefingSeed {
  id: string;
  preferenceId: string;
  tenantKey: TenantKey;
  personName: string;
  generatedAt: string;
  lastTouchpointAt: string;
  compositionMode: 'full_briefing' | 'catch_up' | 'quick_update' | 'event_driven';
  targetReadingTimeSeconds: number;
  estimatedReadingTimeSeconds: number;
  openingLine: string;
  closingRecommendation: string;
  voiceProfileApplied: string;
  sectionCount: number;
  itemCount: number;
  sourceEntitiesConsidered: number;
  sourceEventsConsidered: number;
  preferenceLength: 'brief' | 'standard' | 'deep';
  sectionData: Array<{
    id: string;
    category: 'kpi_drift' | 'pattern_shift' | 'peer_move' | 'regulatory_change' | 'commitment_status' | 'contradiction_emergence';
    headline: string;
    readingTimeSeconds: number;
    items: Array<{
      id: string;
      headline: string;
      context: string;
      whyItMatters: string;
      recommendedAction: string;
      priorityScore: number;
      urgencyScore: number;
      familiarityToUser: 'known' | 'sensed' | 'new';
      primarySourceEntity: string;
      supportingEvidence: string[];
      linkedEntities: string[];
      reasoningScopeId: string | null;
      disclosureScopeId: string | null;
      disclosureMode: 'full' | 'informed_indirection' | 'reasoning_only_acknowledge' | 'suppressed';
    }>;
  }>;
}

async function resolveClient(sb: SupabaseClient, tenantKey: TenantKey): Promise<ClientRow> {
  const tenant = TENANTS[tenantKey];
  for (const field of [
    { column: 'name', value: tenant.shortName },
    { column: 'name', value: tenant.canonicalName },
    { column: 'legal_name', value: tenant.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error(`Client missing for ${tenant.canonicalName}. Run base seeds first.`);
}

async function resolvePerson(sb: SupabaseClient, organization: string, name: string): Promise<PersonRow> {
  const { data, error } = await sb
    .from('persons')
    .select('id, name')
    .eq('organization', organization)
    .eq('name', name)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Person missing: ${name} in ${organization}`);
  return data as PersonRow;
}

async function upsertRows(sb: SupabaseClient, table: string, rows: Array<Record<string, unknown>>, onConflict = 'id'): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 50;
  for (let idx = 0; idx < rows.length; idx += batchSize) {
    const batch = rows.slice(idx, idx + batchSize);
    const { error } = await sb.from(table).upsert(batch, { onConflict });
    if (error) throw error;
  }
}

const BRIEFINGS: BriefingSeed[] = [
  {
    id: '00000000-0000-0000-0000-00000000a001',
    preferenceId: '10000000-0000-0000-0000-00000000a001',
    tenantKey: 'apex',
    personName: 'Vincent Okafor',
    generatedAt: '2026-04-21T08:00:00Z',
    lastTouchpointAt: '2026-04-18T15:00:00Z',
    compositionMode: 'full_briefing',
    targetReadingTimeSeconds: 240,
    estimatedReadingTimeSeconds: 225,
    openingLine: 'Good morning, Vincent. Four things worth about four minutes of your attention this morning, and one of them is genuinely new.',
    closingRecommendation: 'The owned-brand move is the item to pull forward. I would stack a CFO plus customer-and-digital conversation this week.',
    voiceProfileApplied: 'Vincent Okafor',
    sectionCount: 4,
    itemCount: 4,
    sourceEntitiesConsidered: 42,
    sourceEventsConsidered: 11,
    preferenceLength: 'standard',
    sectionData: [
      {
        id: '00000000-0000-0000-0000-00000000b001',
        category: 'kpi_drift',
        headline: 'Fulfillment acceleration looks real, but still needs validation',
        readingTimeSeconds: 55,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c001',
            headline: 'Same-day fulfillment moved faster than plan',
            context: 'Same-day fulfillment moved from 42% to 46% over the last two weeks, concentrated in drive-up categories where operational changes landed first.',
            whyItMatters: 'If the acceleration is durable, it strengthens the external credibility of the digital-commerce story and narrows the path to the FY26 commitment.',
            recommendedAction: 'Have the digital and store-ops teams validate what changed before resetting expectations upward.',
            priorityScore: 84,
            urgencyScore: 73,
            familiarityToUser: 'known',
            primarySourceEntity: 'apex_same_day_fulfillment_pct',
            supportingEvidence: ['evidence_apex_same_day_fulfillment_pct'],
            linkedEntities: ['apex_same_day_fulfillment_pct'],
            reasoningScopeId: 'apex_scope_broad',
            disclosureScopeId: 'apex_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b002',
        category: 'pattern_shift',
        headline: 'Fulfillment decisioning pattern is moving from concern to active constraint',
        readingTimeSeconds: 60,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c002',
            headline: 'Omnichannel fulfillment decisioning intensified again',
            context: 'Additional evidence this week includes CSAT erosion in affected categories and greater cross-node inventory variance at the stores driving abandonment.',
            whyItMatters: 'The pattern is now directly shaping customer experience, not just back-office efficiency.',
            recommendedAction: 'Force an investment-versus-accept-the-CSAT-trajectory decision in the next steering forum.',
            priorityScore: 88,
            urgencyScore: 81,
            familiarityToUser: 'sensed',
            primarySourceEntity: 'apex_pattern_omnichannel_fulfillment_decisioning_gap',
            supportingEvidence: ['evidence_apex_pattern_omnichannel_fulfillment_decisioning_gap'],
            linkedEntities: ['apex_pattern_omnichannel_fulfillment_decisioning_gap', 'apex_csat_omnichannel'],
            reasoningScopeId: 'apex_scope_broad',
            disclosureScopeId: 'apex_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b003',
        category: 'peer_move',
        headline: 'Peer capital moves are widening the owned-brand bar',
        readingTimeSeconds: 55,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c003',
            headline: 'Target escalated owned-brand investment again',
            context: 'A competing retailer announced a three-year capital commitment that materially raises the ambition benchmark on owned-brand penetration and supporting infrastructure.',
            whyItMatters: 'Apex will be compared against this benchmark by the board and by investors who already view owned-brand as an unfinished growth lever.',
            recommendedAction: 'Revisit whether the response is to accelerate the roadmap or reframe the ambition clearly before the next board cycle.',
            priorityScore: 90,
            urgencyScore: 78,
            familiarityToUser: 'new',
            primarySourceEntity: 'apex_event_analyst_day_targets',
            supportingEvidence: ['evidence_apex_event_analyst_day_targets'],
            linkedEntities: ['apex_event_analyst_day_targets', 'apex_owned_brand_penetration'],
            reasoningScopeId: 'apex_scope_broad',
            disclosureScopeId: 'apex_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b004',
        category: 'commitment_status',
        headline: 'The public fulfillment commitment remains credible',
        readingTimeSeconds: 40,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c004',
            headline: 'The FY26 same-day commitment is still on track',
            context: 'Current trajectory keeps the commitment intact so long as the recent acceleration proves repeatable across the next two quarters.',
            whyItMatters: 'This is one of the few places where the external story and internal signal are currently aligned.',
            recommendedAction: 'No action this week beyond validating sustainability.',
            priorityScore: 67,
            urgencyScore: 42,
            familiarityToUser: 'known',
            primarySourceEntity: 'apex_same_day_fulfillment_pct',
            supportingEvidence: ['evidence_apex_same_day_fulfillment_pct'],
            linkedEntities: ['apex_same_day_fulfillment_pct'],
            reasoningScopeId: 'apex_scope_broad',
            disclosureScopeId: 'apex_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-00000000a002',
    preferenceId: '10000000-0000-0000-0000-00000000a002',
    tenantKey: 'keystone',
    personName: 'Jonathan Aldridge',
    generatedAt: '2026-04-21T08:05:00Z',
    lastTouchpointAt: '2026-04-19T18:00:00Z',
    compositionMode: 'full_briefing',
    targetReadingTimeSeconds: 240,
    estimatedReadingTimeSeconds: 210,
    openingLine: 'Morning, Jonathan. Three items this morning, two operational and one regulatory. The regulatory one matters most.',
    closingRecommendation: 'Start with the FERC implication and use it to sharpen the next operating-model decision, not to delay it.',
    voiceProfileApplied: 'Jonathan Aldridge',
    sectionCount: 3,
    itemCount: 3,
    sourceEntitiesConsidered: 39,
    sourceEventsConsidered: 13,
    preferenceLength: 'standard',
    sectionData: [
      {
        id: '00000000-0000-0000-0000-00000000b011',
        category: 'regulatory_change',
        headline: 'A regulatory move just changed the contour of a live strategic choice',
        readingTimeSeconds: 65,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c011',
            headline: 'A new FERC ruling reshaped part of the interconnection strategy',
            context: 'The latest PJM-related ruling constrains one of the co-location structures under active consideration for large-load growth programs.',
            whyItMatters: 'It changes customer-communication and capital-sequencing logic immediately, not later.',
            recommendedAction: 'Pull Rachel Navarro and James Oppenheim into a 30-minute readout before the next executive committee.',
            priorityScore: 92,
            urgencyScore: 88,
            familiarityToUser: 'new',
            primarySourceEntity: 'keystone_event_ferc_order_2025_14',
            supportingEvidence: ['evidence_keystone_event_ferc_order_2025_14'],
            linkedEntities: ['keystone_event_ferc_order_2025_14'],
            reasoningScopeId: 'keystone_scope_broad',
            disclosureScopeId: 'keystone_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b012',
        category: 'pattern_shift',
        headline: 'The storm-response coordination pattern is no longer episodic',
        readingTimeSeconds: 55,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c012',
            headline: 'Storm-response fragmentation intensified after the last event',
            context: 'The latest debrief surfaced another cluster of coordination failures across subsidiary handoffs that overlap with prior after-action findings.',
            whyItMatters: 'The organization is repeating a known failure pattern, which makes the operating-model decision more urgent.',
            recommendedAction: 'Bring three decision-ready options to the next committee instead of another diagnostic review.',
            priorityScore: 86,
            urgencyScore: 77,
            familiarityToUser: 'sensed',
            primarySourceEntity: 'keystone_pattern_storm_response_coordination_fragmentation',
            supportingEvidence: ['evidence_keystone_pattern_storm_response_coordination_fragmentation'],
            linkedEntities: ['keystone_pattern_storm_response_coordination_fragmentation'],
            reasoningScopeId: 'keystone_scope_broad',
            disclosureScopeId: 'keystone_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b013',
        category: 'kpi_drift',
        headline: 'One labor signal finally moved in the right direction',
        readingTimeSeconds: 40,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c013',
            headline: 'Transmission-engineering turnover stabilized this month',
            context: 'The monthly exit rate dropped off the recent running average, which may signal the workforce interventions are starting to land.',
            whyItMatters: 'It is early, but this is one of the few signals currently pointing toward operating traction rather than further slippage.',
            recommendedAction: 'Have Derek hold the line and recheck next month before calling a trend.',
            priorityScore: 61,
            urgencyScore: 35,
            familiarityToUser: 'known',
            primarySourceEntity: 'keystone_transmission_engineering_attrition',
            supportingEvidence: ['evidence_keystone_transmission_engineering_attrition'],
            linkedEntities: ['keystone_transmission_engineering_attrition'],
            reasoningScopeId: 'keystone_scope_broad',
            disclosureScopeId: 'keystone_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-00000000a003',
    preferenceId: '10000000-0000-0000-0000-00000000a003',
    tenantKey: 'meridian',
    personName: 'Linda Chen-Winters',
    generatedAt: '2026-04-21T08:10:00Z',
    lastTouchpointAt: '2026-04-20T15:30:00Z',
    compositionMode: 'full_briefing',
    targetReadingTimeSeconds: 240,
    estimatedReadingTimeSeconds: 215,
    openingLine: 'Good morning, Dr. Chen-Winters. Three items to run through, all health-plan-side and all with cross-system implications.',
    closingRecommendation: 'The MLR movement is the operational priority. Everything else can wait a week if needed.',
    voiceProfileApplied: 'Linda Chen-Winters',
    sectionCount: 3,
    itemCount: 3,
    sourceEntitiesConsidered: 44,
    sourceEventsConsidered: 10,
    preferenceLength: 'standard',
    sectionData: [
      {
        id: '00000000-0000-0000-0000-00000000b021',
        category: 'kpi_drift',
        headline: 'The plan P&L moved quickly enough to matter',
        readingTimeSeconds: 60,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c021',
            headline: 'Medical loss ratio moved 120 bps in the wrong direction',
            context: 'The trailing-three-month MLR stepped up against forecast, driven by utilization, specialty-drug cost pressure, and one reopened high-cost case.',
            whyItMatters: 'If the pattern persists, the quarterly forecast and the star-rating improvement agenda start pulling against each other.',
            recommendedAction: 'Pull the Meridian Health Plans CFO into a standing review this week to validate whether the move is transitory or forecast-relevant.',
            priorityScore: 91,
            urgencyScore: 85,
            familiarityToUser: 'sensed',
            primarySourceEntity: 'meridian_plan_mlr',
            supportingEvidence: ['evidence_meridian_plan_mlr'],
            linkedEntities: ['meridian_plan_mlr'],
            reasoningScopeId: 'meridian_scope_broad',
            disclosureScopeId: 'meridian_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b022',
        category: 'commitment_status',
        headline: 'The VBC commitment still sits ahead of the delivery path',
        readingTimeSeconds: 55,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c022',
            headline: 'The 68% VBC revenue commitment remains 16 points ahead of plan',
            context: 'No material movement this week changed the gap between the public endpoint and the current internal trajectory.',
            whyItMatters: 'The next capital-reallocation window is closing, and after that the credible options narrow to reforecasting or external explanation.',
            recommendedAction: 'Take an acceleration-versus-reforecast recommendation to the next VBC steering forum.',
            priorityScore: 93,
            urgencyScore: 80,
            familiarityToUser: 'known',
            primarySourceEntity: 'meridian_vbc_revenue_pct',
            supportingEvidence: ['evidence_meridian_vbc_revenue_pct'],
            linkedEntities: ['meridian_vbc_revenue_pct'],
            reasoningScopeId: 'meridian_scope_broad',
            disclosureScopeId: 'meridian_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b023',
        category: 'peer_move',
        headline: 'A peer quality move created a usable template',
        readingTimeSeconds: 45,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c023',
            headline: 'A peer MA recovery plan is worth studying immediately',
            context: 'A regional peer’s public quality-recovery playbook landed just as Meridian Health Plans is trying to move from 4.0 to 4.5 stars.',
            whyItMatters: 'The interventions are concrete enough to inform Meridian’s own roadmap rather than just serve as abstract benchmarking.',
            recommendedAction: 'Have Erin’s team assess which interventions should be pulled into the current quality plan.',
            priorityScore: 77,
            urgencyScore: 59,
            familiarityToUser: 'new',
            primarySourceEntity: 'meridian_event_ma_star_recovery_peer',
            supportingEvidence: ['evidence_meridian_event_ma_star_recovery_peer'],
            linkedEntities: ['meridian_event_ma_star_recovery_peer', 'meridian_ma_star_rating'],
            reasoningScopeId: 'meridian_scope_broad',
            disclosureScopeId: 'meridian_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-00000000a004',
    preferenceId: '10000000-0000-0000-0000-00000000a004',
    tenantKey: 'first_capital',
    personName: 'Elaine Burakovsky-Park',
    generatedAt: '2026-04-21T08:15:00Z',
    lastTouchpointAt: '2026-04-18T17:00:00Z',
    compositionMode: 'full_briefing',
    targetReadingTimeSeconds: 240,
    estimatedReadingTimeSeconds: 220,
    openingLine: 'Good morning, Elaine. Three items this morning: one balance-sheet, one franchise, and one I can only frame carefully.',
    closingRecommendation: 'Start with the deposit-cost math, then decide how much cross-franchise capacity you want to preserve for the AML path.',
    voiceProfileApplied: 'Elaine Burakovsky-Park',
    sectionCount: 3,
    itemCount: 3,
    sourceEntitiesConsidered: 46,
    sourceEventsConsidered: 12,
    preferenceLength: 'standard',
    sectionData: [
      {
        id: '00000000-0000-0000-0000-00000000b031',
        category: 'kpi_drift',
        headline: 'Deposit economics continue to be the near-term pressure point',
        readingTimeSeconds: 60,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c031',
            headline: 'Cost of deposits is still outrunning what the NIM target can absorb',
            context: 'Deposit cost remains elevated while NIM sits below peer median, which keeps the margin-protection agenda under stress even before any additional capital or compliance demands.',
            whyItMatters: 'The pressure is both financial and strategic because it limits room to maneuver elsewhere.',
            recommendedAction: 'Use the weekly scorecard to force a tighter deposit-mix and franchise-pricing conversation with treasury and consumer banking.',
            priorityScore: 92,
            urgencyScore: 84,
            familiarityToUser: 'known',
            primarySourceEntity: 'firstcap_cost_of_deposits',
            supportingEvidence: ['evidence_firstcap_cost_of_deposits'],
            linkedEntities: ['firstcap_cost_of_deposits', 'firstcap_nim'],
            reasoningScopeId: 'firstcap_scope_broad',
            disclosureScopeId: 'firstcap_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b032',
        category: 'peer_move',
        headline: 'Peers are moving faster on the wealth-and-relationship play',
        readingTimeSeconds: 45,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c032',
            headline: 'Cross-franchise wealth plays are accelerating across the peer set',
            context: 'Peer super-regionals are putting more weight behind advisor-led household deepening and fee-income expansion.',
            whyItMatters: 'It raises the pressure on First Capital to make the consumer-plus-commercial-to-wealth motion real rather than rhetorical.',
            recommendedAction: 'Have Sophia Delaney and the consumer banking lead define where relationship handoff is still breaking down.',
            priorityScore: 74,
            urgencyScore: 57,
            familiarityToUser: 'new',
            primarySourceEntity: 'firstcap_event_peer_wealth_push',
            supportingEvidence: ['evidence_firstcap_event_peer_wealth_push'],
            linkedEntities: ['firstcap_event_peer_wealth_push', 'firstcap_wealth_net_new_households'],
            reasoningScopeId: 'firstcap_scope_broad',
            disclosureScopeId: 'firstcap_scope_broad',
            disclosureMode: 'full',
          },
        ],
      },
      {
        id: '00000000-0000-0000-0000-00000000b033',
        category: 'regulatory_change',
        headline: 'The highest-stakes program remains tightly scoped',
        readingTimeSeconds: 55,
        items: [
          {
            id: '00000000-0000-0000-0000-00000000c033',
            headline: 'The AML modernization path is active, but specifics stay inside the program boundary',
            context: 'The program is executing against the current remediation path. I can see that it still shapes operating decisions elsewhere, but the detailed program state sits inside a legal-privileged boundary.',
            whyItMatters: 'You still need to plan around the dependency even when the program details cannot travel broadly.',
            recommendedAction: 'Coordinate directly with Marcus Blythe and legal if another workstream depends on the remediation schedule.',
            priorityScore: 88,
            urgencyScore: 71,
            familiarityToUser: 'sensed',
            primarySourceEntity: 'firstcap_legal_ctx_bsa_aml_consent_order',
            supportingEvidence: ['evidence_firstcap_bsa_aml_dashboard'],
            linkedEntities: ['firstcap_legal_ctx_bsa_aml_consent_order', 'firstcap_bsa_aml_dashboard'],
            reasoningScopeId: 'firstcap_scope_program_scoped_legal_privileged',
            disclosureScopeId: 'firstcap_scope_program_scoped_legal_privileged',
            disclosureMode: 'informed_indirection',
          },
        ],
      },
    ],
  },
];

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const clients = new Map<TenantKey, ClientRow>();
  const people = new Map<string, PersonRow>();
  for (const seed of BRIEFINGS) {
    if (!clients.has(seed.tenantKey)) {
      clients.set(seed.tenantKey, await resolveClient(sb, seed.tenantKey));
    }
    const tenant = TENANTS[seed.tenantKey];
    const personKey = `${seed.tenantKey}:${seed.personName}`;
    if (!people.has(personKey)) {
      people.set(personKey, await resolvePerson(sb, tenant.canonicalName, seed.personName));
    }
  }

  const preferenceRows: Array<Record<string, unknown>> = [];
  const briefingRows: Array<Record<string, unknown>> = [];
  const sectionRows: Array<Record<string, unknown>> = [];
  const itemRows: Array<Record<string, unknown>> = [];
  const compositionRows: Array<Record<string, unknown>> = [];

  for (const briefing of BRIEFINGS) {
    const client = clients.get(briefing.tenantKey)!;
    const person = people.get(`${briefing.tenantKey}:${briefing.personName}`)!;

    preferenceRows.push({
      id: briefing.preferenceId,
      user_id: person.id,
      client_id: client.id,
      preferred_length: briefing.preferenceLength,
      category_weights: {
        kpi_drift: 1,
        pattern_shift: 1,
        peer_move: 1,
        regulatory_change: briefing.tenantKey === 'first_capital' ? 1.1 : 1,
        commitment_status: briefing.tenantKey === 'meridian' ? 1.1 : 1,
        contradiction_emergence: 0.9,
      },
      always_include_entities: [],
      never_include_entities: [],
      preferred_generation_time: '7am local',
      delivery_channel: 'in_app',
      metadata: { source: 'wave2 seed briefing' },
    });

    briefingRows.push({
      id: briefing.id,
      client_id: client.id,
      user_id: person.id,
      generated_at: briefing.generatedAt,
      last_user_touchpoint_at: briefing.lastTouchpointAt,
      next_scheduled_refresh_at: briefing.generatedAt,
      composition_mode: briefing.compositionMode,
      target_reading_time_seconds: briefing.targetReadingTimeSeconds,
      estimated_reading_time_seconds: briefing.estimatedReadingTimeSeconds,
      opening_line: briefing.openingLine,
      closing_recommendation: briefing.closingRecommendation,
      voice_profile_applied: briefing.voiceProfileApplied,
      source_entities_considered: briefing.sourceEntitiesConsidered,
      source_events_considered: briefing.sourceEventsConsidered,
      ranking_model_version: 'wave2-v1',
      personalization_model_version: 'wave2-v1',
      metadata: { seeded_example: true, source_spec: 'whats-changed-briefing-engine.md' },
    });

    for (let i = 0; i < briefing.sectionData.length; i += 1) {
      const section = briefing.sectionData[i];
      sectionRows.push({
        id: section.id,
        briefing_id: briefing.id,
        category: section.category,
        included: true,
        item_count: section.items.length,
        section_headline: section.headline,
        section_reading_time_seconds: section.readingTimeSeconds,
        ordinal: i,
        metadata: { seeded_example: true },
      });

      for (let j = 0; j < section.items.length; j += 1) {
        const item = section.items[j];
        itemRows.push({
          id: item.id,
          briefing_id: briefing.id,
          section_id: section.id,
          category: section.category,
          headline: item.headline,
          context: item.context,
          why_it_matters: item.whyItMatters,
          recommended_action: item.recommendedAction,
          primary_source_entity: item.primarySourceEntity,
          supporting_evidence: item.supportingEvidence,
          linked_entities: item.linkedEntities,
          priority_score: item.priorityScore,
          urgency_score: item.urgencyScore,
          familiarity_to_user: item.familiarityToUser,
          reasoning_scope_id: item.reasoningScopeId,
          disclosure_scope_id: item.disclosureScopeId,
          disclosure_mode: item.disclosureMode,
          ordinal: j,
          metadata: { seeded_example: true },
        });
      }
    }

    compositionRows.push({
      briefing_id: briefing.id,
      composition_steps: [
        { step_name: 'scope_determination', step_duration_ms: 210, notes: 'Seeded example scope.' },
        { step_name: 'change_detection', step_duration_ms: 680, notes: 'Seeded example deltas.' },
        { step_name: 'prioritization', step_duration_ms: 240, notes: 'Seeded familiarity spread.' },
        { step_name: 'composition', step_duration_ms: 430, notes: 'Seeded narrative rendering.' },
      ],
      total_composition_time_ms: 1560,
      total_source_entities_scanned: briefing.sourceEntitiesConsidered,
      filtering_applied: [{ filter: 'dual_scope', result: 'seeded' }],
    });
  }

  await upsertRows(sb, 'user_briefing_preferences', preferenceRows);
  await upsertRows(sb, 'briefings', briefingRows);
  await upsertRows(sb, 'briefing_sections', sectionRows);
  await upsertRows(sb, 'briefing_items', itemRows);
  await upsertRows(sb, 'briefing_compositions', compositionRows, 'briefing_id');

  console.log('\nBriefings seeded');
  console.log(`  preferences  · ${preferenceRows.length}`);
  console.log(`  briefings    · ${briefingRows.length}`);
  console.log(`  sections     · ${sectionRows.length}`);
  console.log(`  items        · ${itemRows.length}`);
  console.log(`  compositions · ${compositionRows.length}`);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

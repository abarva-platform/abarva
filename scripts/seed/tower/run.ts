import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ATLAS_OBSERVATIONS,
  ATLAS_THREADS,
  COHORT_BENCHMARKS,
  COHORT_COMPUTED_AT,
  COHORT_PEERS,
  COHORT_SEGMENT_HASH,
  DATA_INTEGRATIONS,
  PORTFOLIO_AGGREGATES,
  SEED_TAG,
  SIGNAL_CATALOG,
  SIGNAL_FIRINGS,
  TRUSTWORTHINESS_SEEDS,
} from './data';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

type ClientRow = { id: string; name: string };
type PersonRow = { id: string; name: string };
type UseCaseRow = { id: string; name: string };
type SignalCatalogRow = { id: string; key: string };
type SignalFiringRow = { id: string; headline: string };
type AtlasThreadRow = { id: string; title: string };
type DataIntegrationRow = { id: string; provider_name: string; integration_type: string };

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function resolveApexClientId(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb.from('clients').select('id,name').in('name', ['Apex Retail', 'Apex Retail Group']);
  assertNoError(error, 'resolve client');
  const apex = ((data as ClientRow[] | null) ?? []).find((row) => /apex retail/i.test(row.name));
  if (!apex) throw new Error('Could not find Apex Retail client. Seed the Pack J enterprise portfolio first.');
  return apex.id;
}

async function resolvePeople(sb: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await sb
    .from('persons')
    .select('id,name')
    .or('organization.ilike.%Apex Retail%,organization.ilike.%Apex Retail Group%');
  assertNoError(error, 'resolve people');
  return new Map(((data as PersonRow[] | null) ?? []).map((row) => [row.name, row.id]));
}

async function resolveUseCases(sb: SupabaseClient, clientId: string): Promise<Map<string, string>> {
  const signalNames = SIGNAL_FIRINGS.flatMap((entry) => ('use_case_name' in entry && entry.use_case_name ? [entry.use_case_name] : []));
  const atlasNames = ATLAS_THREADS.flatMap((entry) => ('use_case_name' in entry && entry.use_case_name ? [entry.use_case_name] : []));
  const names = [...new Set([...signalNames, ...atlasNames, ...TRUSTWORTHINESS_SEEDS.map((entry) => entry.use_case_name)])];
  const { data, error } = await sb
    .from('use_cases')
    .select('id,name')
    .eq('client_id', clientId)
    .in('name', names as string[]);
  assertNoError(error, 'resolve use cases');
  const map = new Map(((data as UseCaseRow[] | null) ?? []).map((row) => [row.name, row.id]));
  for (const name of names) {
    if (!map.has(name as string)) {
      throw new Error(`Required Apex use case "${name}" is missing. Run the Pack J enterprise seed first.`);
    }
  }
  return map;
}

async function wipeSeededAtlas(sb: SupabaseClient, clientId: string) {
  const titles = ATLAS_THREADS.map((entry) => entry.title);
  const { data: threads, error: threadError } = await sb
    .from('atlas_threads')
    .select('id,title')
    .eq('client_id', clientId)
    .in('title', titles);
  assertNoError(threadError, 'load seeded atlas threads');
  const threadIds = ((threads as AtlasThreadRow[] | null) ?? []).map((row) => row.id);
  if (threadIds.length > 0) {
    const { error: traceDeleteError } = await sb.from('atlas_message_traces').delete().in('atlas_thread_id', threadIds);
    assertNoError(traceDeleteError, 'delete seeded atlas traces');
  }
  const summaries = ATLAS_OBSERVATIONS.map((entry) => entry.summary);
  const { error: observationDeleteError } = await sb.from('atlas_observations').delete().eq('client_id', clientId).in('summary', summaries);
  assertNoError(observationDeleteError, 'delete seeded atlas observations');
  if (threadIds.length > 0) {
    const { error: threadDeleteError } = await sb.from('atlas_threads').delete().in('id', threadIds);
    assertNoError(threadDeleteError, 'delete seeded atlas threads');
  }
}

async function wipeSeededSignals(sb: SupabaseClient, clientId: string) {
  const headlines = SIGNAL_FIRINGS.map((entry) => entry.headline);
  const { data: firings, error } = await sb
    .from('signal_firings')
    .select('id,headline')
    .eq('client_id', clientId)
    .in('headline', headlines);
  assertNoError(error, 'load seeded signal firings');
  const ids = ((firings as SignalFiringRow[] | null) ?? []).map((row) => row.id);
  if (ids.length > 0) {
    const { error: evidenceDeleteError } = await sb.from('signal_evidence_chains').delete().in('signal_firing_id', ids);
    assertNoError(evidenceDeleteError, 'delete seeded signal evidence');
    const { error: firingDeleteError } = await sb.from('signal_firings').delete().in('id', ids);
    assertNoError(firingDeleteError, 'delete seeded signal firings');
  }
}

async function seedCohortPeers(sb: SupabaseClient) {
  const names = COHORT_PEERS.map((entry) => entry.display_name);
  const { error: deleteError } = await sb.from('cohort_peers').delete().in('display_name', names);
  assertNoError(deleteError, 'delete cohort peers');

  const payload = COHORT_PEERS.map((entry) => ({
    ...entry,
    portfolio_profile: { ...entry.portfolio_profile, seed_tag: SEED_TAG },
    metric_snapshot: { ...entry.metric_snapshot, seed_tag: SEED_TAG },
  }));
  const { error: insertError } = await sb.from('cohort_peers').insert(payload);
  assertNoError(insertError, 'insert cohort peers');
  console.log(`  ✓ cohort peers (${payload.length})`);
}

async function seedCohortBenchmarks(sb: SupabaseClient) {
  const metricNames = COHORT_BENCHMARKS.map((entry) => entry.metric_name);
  const { error: deleteError } = await sb
    .from('cohort_benchmarks')
    .delete()
    .eq('cohort_segment_hash', COHORT_SEGMENT_HASH)
    .in('metric_name', metricNames);
  assertNoError(deleteError, 'delete cohort benchmarks');

  const payload = COHORT_BENCHMARKS.map((entry) => ({
    cohort_definition: {
      seed_tag: SEED_TAG,
      label: 'Retail peers · $10B-$50B revenue · n=7',
      industry_code: 'retail',
      revenue_band: '$10B-$50B',
    },
    cohort_segment_hash: COHORT_SEGMENT_HASH,
    pillar: entry.pillar,
    metric_name: entry.metric_name,
    sample_size: entry.sample_size,
    p25: entry.p25,
    p50: entry.p50,
    p75: entry.p75,
    p90: entry.p90,
    mean_value: entry.mean_value,
    stddev_value: entry.stddev_value,
    computation_notes: {
      seed_tag: SEED_TAG,
      apex_percentile: entry.percentile,
      apex_value: entry.apex_value,
      note: entry.note,
    },
    computed_at: COHORT_COMPUTED_AT,
    valid_until: '2026-07-31T23:59:59.000Z',
  }));
  const { error: insertError } = await sb.from('cohort_benchmarks').insert(payload);
  assertNoError(insertError, 'insert cohort benchmarks');
  console.log(`  ✓ cohort benchmarks (${payload.length})`);
}

async function seedSignalCatalog(sb: SupabaseClient): Promise<Map<string, string>> {
  const payload = SIGNAL_CATALOG.map((entry) => ({
    ...entry,
    state_model: ['new', 'triaged', 'actioned', 'resolved', 'suppressed'],
    evidence_schema: { ...entry.evidence_schema, seed_tag: SEED_TAG },
    routing_defaults: { ...entry.routing_defaults, seed_tag: SEED_TAG },
    rule_logic: { ...entry.rule_logic, seed_tag: SEED_TAG },
  }));

  const { error: upsertError } = await sb.from('signal_catalog').upsert(payload, { onConflict: 'key' });
  assertNoError(upsertError, 'upsert signal catalog');

  const { data, error } = await sb.from('signal_catalog').select('id,key').in('key', SIGNAL_CATALOG.map((entry) => entry.key));
  assertNoError(error, 'reload signal catalog');
  const map = new Map(((data as SignalCatalogRow[] | null) ?? []).map((row) => [row.key, row.id]));
  console.log(`  ✓ signal catalog (${map.size})`);
  return map;
}

async function seedSignalFirings(sb: SupabaseClient, clientId: string, catalogMap: Map<string, string>, useCaseMap: Map<string, string>): Promise<Map<string, string>> {
  await wipeSeededSignals(sb, clientId);

  const payload = SIGNAL_FIRINGS.map((entry) => ({
    client_id: clientId,
    signal_catalog_id: catalogMap.get(entry.key),
    use_case_id: 'use_case_name' in entry && entry.use_case_name ? useCaseMap.get(entry.use_case_name) ?? null : null,
    severity: entry.severity,
    state: entry.state,
    headline: entry.headline,
    narrative_jsonb: entry.narrative_jsonb,
    impact_usd: entry.impact_usd,
    evidence_summary_jsonb: entry.evidence_summary_jsonb,
    cohort_context_jsonb: entry.cohort_context_jsonb,
    fired_at: entry.fired_at,
    first_seen_at: entry.fired_at,
    last_seen_at: entry.fired_at,
    triaged_at: entry.state === 'triaged' ? entry.fired_at : null,
  }));

  for (const row of payload) {
    if (!row.signal_catalog_id) throw new Error(`Missing signal catalog entry for ${row.headline}.`);
  }

  const { data, error } = await sb.from('signal_firings').insert(payload).select('id,headline');
  assertNoError(error, 'insert signal firings');
  const inserted = new Map(((data as SignalFiringRow[] | null) ?? []).map((row) => [row.headline, row.id]));

  const evidencePayload = SIGNAL_FIRINGS.flatMap((entry) => {
    const signalFiringId = inserted.get(entry.headline);
    if (!signalFiringId) return [];
    return entry.evidence.map((evidence) => ({
      signal_firing_id: signalFiringId,
      ...evidence,
    }));
  });

  const { error: evidenceError } = await sb.from('signal_evidence_chains').insert(evidencePayload);
  assertNoError(evidenceError, 'insert signal evidence');
  console.log(`  ✓ signal firings (${payload.length}) and evidence (${evidencePayload.length})`);

  return new Map(SIGNAL_FIRINGS.map((entry) => [entry.key, inserted.get(entry.headline) as string]));
}

async function seedAtlas(sb: SupabaseClient, clientId: string, peopleMap: Map<string, string>, useCaseMap: Map<string, string>, signalMap: Map<string, string>) {
  await wipeSeededAtlas(sb, clientId);

  const observationPayload = ATLAS_OBSERVATIONS.map((entry) => ({
    client_id: clientId,
    pillar: entry.pillar,
    observation_kind: entry.observation_kind,
    severity: entry.severity,
    summary: entry.summary,
    details_jsonb: entry.details_jsonb,
    route_type: entry.route_type,
    signal_firing_id:
      entry.details_jsonb.trigger_context && typeof entry.details_jsonb.trigger_context === 'object' && 'signal' in entry.details_jsonb.trigger_context
        ? signalMap.get((entry.details_jsonb.trigger_context as Record<string, string>).signal) ?? null
        : null,
  }));

  const { data: observations, error: observationError } = await sb.from('atlas_observations').insert(observationPayload).select('id,summary');
  assertNoError(observationError, 'insert atlas observations');
  const observationMap = new Map(((observations as Array<{ id: string; summary: string }> | null) ?? []).map((row) => [row.summary, row.id]));

  const threadPayload = ATLAS_THREADS.map((entry) => ({
    person_id: peopleMap.get('Jake Chen') ?? null,
    client_id: clientId,
    title: entry.title,
    context_scope: entry.context_scope,
    signal_firing_id: 'signal_key' in entry && entry.signal_key ? signalMap.get(entry.signal_key) ?? null : null,
    use_case_id: 'use_case_name' in entry && entry.use_case_name ? useCaseMap.get(entry.use_case_name) ?? null : null,
    last_message_at: '2026-04-21T06:47:00.000Z',
  }));

  const { data: threads, error: threadError } = await sb.from('atlas_threads').insert(threadPayload).select('id,title');
  assertNoError(threadError, 'insert atlas threads');
  const threadMap = new Map(((threads as AtlasThreadRow[] | null) ?? []).map((row) => [row.title, row.id]));

  const tracePayload = ATLAS_THREADS.flatMap((entry) => {
    const atlasThreadId = threadMap.get(entry.title);
    if (!atlasThreadId) return [];
    const atlasObservationId =
      'signal_key' in entry && entry.signal_key === 'shadow_ai_detected'
        ? observationMap.get('Shadow AI is still the loudest issue at $2.3M annualized across three tools.') ?? null
        : 'use_case_name' in entry && entry.use_case_name === 'Demand forecasting'
          ? observationMap.get('The Demand Forecasting attestation is 31 days overdue and Jake Chen has already asked for status twice.') ?? null
          : observationMap.get('Three things need attention before the first executive call: Shadow AI is loudest, Demand Forecasting is 31 days late on attestation, and Returns Fraud still needs a retraining window.') ?? null;
    return entry.traces.map((trace) => ({
      atlas_thread_id: atlasThreadId,
      atlas_observation_id: trace.role === 'atlas' ? atlasObservationId : null,
      ...trace,
      content_jsonb: { ...trace.content_jsonb, seed_tag: SEED_TAG },
    }));
  });

  const { error: traceError } = await sb.from('atlas_message_traces').insert(tracePayload);
  assertNoError(traceError, 'insert atlas traces');
  console.log(`  ✓ atlas observations (${observationPayload.length}), threads (${threadPayload.length}), traces (${tracePayload.length})`);
}

async function seedTrustworthiness(sb: SupabaseClient, clientId: string, useCaseMap: Map<string, string>, peopleMap: Map<string, string>) {
  const useCaseIds = TRUSTWORTHINESS_SEEDS.map((entry) => useCaseMap.get(entry.use_case_name) as string);
  const { error: observationDeleteError } = await sb.from('trustworthiness_observations').delete().eq('client_id', clientId).like('source_ref', 'tower-seed:%');
  assertNoError(observationDeleteError, 'delete trustworthiness observations');

  if (useCaseIds.length > 0) {
    const { error: scoreDeleteError } = await sb
      .from('trustworthiness_scores')
      .delete()
      .eq('client_id', clientId)
      .eq('computed_at', COHORT_COMPUTED_AT)
      .in('use_case_id', useCaseIds);
    assertNoError(scoreDeleteError, 'delete trustworthiness scores');
  }

  const observationPayload = TRUSTWORTHINESS_SEEDS.flatMap((entry) => {
    const useCaseId = useCaseMap.get(entry.use_case_name);
    if (!useCaseId) return [];
    return entry.observations.map((observation, index) => ({
      client_id: clientId,
      use_case_id: useCaseId,
      observation_type: observation.observation_type,
      observation_state: observation.observation_state,
      points_awarded: observation.points_awarded,
      attester_person_id: entry.attesters[index % entry.attesters.length] ? peopleMap.get(entry.attesters[index % entry.attesters.length]) ?? null : null,
      observed_at: `2026-04-${String(14 + index).padStart(2, '0')}T09:00:00.000Z`,
      source_ref: observation.source_ref,
      details_jsonb: observation.details_jsonb,
    }));
  });

  const { error: observationInsertError } = await sb.from('trustworthiness_observations').insert(observationPayload);
  assertNoError(observationInsertError, 'insert trustworthiness observations');

  const scorePayload = TRUSTWORTHINESS_SEEDS.map((entry) => {
    const useCaseId = useCaseMap.get(entry.use_case_name);
    if (!useCaseId) throw new Error(`Missing use case for trustworthiness seed ${entry.use_case_name}.`);
    return {
      client_id: clientId,
      use_case_id: useCaseId,
      score: entry.score,
      confidence: entry.confidence,
      ...entry.points,
      explanation_jsonb: entry.explanation_jsonb,
      computed_at: COHORT_COMPUTED_AT,
    };
  });

  const { error: scoreInsertError } = await sb.from('trustworthiness_scores').insert(scorePayload);
  assertNoError(scoreInsertError, 'insert trustworthiness scores');
  console.log(`  ✓ trustworthiness observations (${observationPayload.length}) and scores (${scorePayload.length})`);
}

async function seedIntegrations(sb: SupabaseClient, clientId: string, peopleMap: Map<string, string>) {
  const integrationPayload = DATA_INTEGRATIONS.map((entry) => ({
    client_id: clientId,
    integration_type: entry.integration_type,
    provider_name: entry.provider_name,
    status: entry.status,
    connection_ref: entry.connection_ref,
    sync_frequency_minutes: entry.sync_frequency_minutes,
    last_synced_at: entry.last_synced_at,
    next_sync_at: entry.next_sync_at,
    config_jsonb: entry.config_jsonb,
    metadata_jsonb: entry.metadata_jsonb,
    created_by_person_id: peopleMap.get('Jake Chen') ?? null,
    disconnected_at: entry.status === 'pending' ? null : null,
  }));

  const { error: integrationUpsertError } = await sb
    .from('data_integrations')
    .upsert(integrationPayload, { onConflict: 'client_id,provider_name,integration_type' });
  assertNoError(integrationUpsertError, 'upsert data integrations');

  const { data: integrations, error: integrationLoadError } = await sb
    .from('data_integrations')
    .select('id,provider_name,integration_type')
    .eq('client_id', clientId)
    .in('provider_name', DATA_INTEGRATIONS.map((entry) => entry.provider_name));
  assertNoError(integrationLoadError, 'reload data integrations');
  const integrationMap = new Map(((integrations as DataIntegrationRow[] | null) ?? []).map((row) => [`${row.provider_name}::${row.integration_type}`, row.id]));

  const integrationIds = [...integrationMap.values()];
  if (integrationIds.length > 0) {
    const { error: healthDeleteError } = await sb.from('integration_health').delete().in('integration_id', integrationIds);
    assertNoError(healthDeleteError, 'delete integration health');
  }

  const healthPayload = DATA_INTEGRATIONS.map((entry) => ({
    integration_id: integrationMap.get(`${entry.provider_name}::${entry.integration_type}`),
    ...entry.health,
  }));
  const { error: healthInsertError } = await sb.from('integration_health').insert(healthPayload);
  assertNoError(healthInsertError, 'insert integration health');
  console.log(`  ✓ data integrations (${integrationPayload.length}) and health snapshots (${healthPayload.length})`);
}

async function seedPortfolioAggregates(sb: SupabaseClient, clientId: string) {
  const payload = PORTFOLIO_AGGREGATES.map((entry) => ({
    client_id: clientId,
    ...entry,
  }));
  const { error } = await sb.from('portfolio_aggregates').upsert(payload, { onConflict: 'client_id,aggregate_date' });
  assertNoError(error, 'upsert portfolio aggregates');
  console.log(`  ✓ portfolio aggregates (${payload.length})`);
}

async function verifySeed(sb: SupabaseClient, clientId: string) {
  const [{ data: latestAggregate, error: aggregateError }, { data: signals, error: signalError }, { data: integrations, error: integrationError }, { data: scores, error: scoreError }, { data: cohort, error: cohortError }] = await Promise.all([
    sb.from('portfolio_aggregates').select('aggregate_date,active_use_case_count,critical_signal_count,warning_signal_count,governed_ai_spend_usd,shadow_ai_spend_usd,realized_value_usd,average_trustworthiness_score,aggregate_jsonb').eq('client_id', clientId).order('aggregate_date', { ascending: false }).limit(1).maybeSingle(),
    sb.from('signal_firings').select('headline,severity,state,impact_usd').eq('client_id', clientId).order('headline'),
    sb.from('data_integrations').select('provider_name,status').eq('client_id', clientId).order('provider_name'),
    sb.from('trustworthiness_scores').select('score').eq('client_id', clientId).eq('computed_at', COHORT_COMPUTED_AT),
    sb.from('cohort_benchmarks').select('metric_name,computation_notes').eq('cohort_segment_hash', COHORT_SEGMENT_HASH).order('metric_name'),
  ]);
  assertNoError(aggregateError, 'verify aggregate');
  assertNoError(signalError, 'verify signals');
  assertNoError(integrationError, 'verify integrations');
  assertNoError(scoreError, 'verify scores');
  assertNoError(cohortError, 'verify cohort');

  console.log('\nVerification snapshot');
  console.log(JSON.stringify({
    latestAggregate,
    signals,
    integrations,
    trustworthinessAverage:
      scores && scores.length > 0 ? scores.reduce((sum, row) => sum + (row as { score: number }).score, 0) / scores.length : null,
    cohortMetrics: cohort,
  }, null, 2));
}

async function main() {
  const sb = getClient();
  console.log('Tower W4 seed · Apex Retail');
  console.log(`Seed tag: ${SEED_TAG}\n`);

  const clientId = await resolveApexClientId(sb);
  const peopleMap = await resolvePeople(sb);
  const useCaseMap = await resolveUseCases(sb, clientId);

  await seedCohortPeers(sb);
  await seedCohortBenchmarks(sb);
  const catalogMap = await seedSignalCatalog(sb);
  const signalMap = await seedSignalFirings(sb, clientId, catalogMap, useCaseMap);
  await seedAtlas(sb, clientId, peopleMap, useCaseMap, signalMap);
  await seedTrustworthiness(sb, clientId, useCaseMap, peopleMap);
  await seedIntegrations(sb, clientId, peopleMap);
  await seedPortfolioAggregates(sb, clientId);
  await verifySeed(sb, clientId);

  console.log('\nTower W4 seed complete.');
}

main().catch((error) => {
  console.error('\nTower W4 seed failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { randomUUID } from 'node:crypto';
import { buildTowerViewModel } from '@/lib/tower/aggregate';
import { getServerSupabase } from '@/lib/supabase-server';
import { validateAtlasCitationList, type AtlasCitation } from '@/lib/tower/atlas-citation-validator';
import type {
  AtlasBenchmark,
  AtlasBenchmarkPoint,
  AtlasEvidenceItem,
  AtlasObservation,
  AtlasPortfolioSummary,
  AtlasRouteType,
  AtlasSignalDetail,
  AtlasSignalSummary,
  AtlasTenancyCtx,
} from '@/lib/atlas/types';

type JsonObject = Record<string, unknown>;

export type AtlasReasoningTraceTrigger =
  | 'tower_right_rail_render'
  | 'atlas_chat_turn'
  | 'metric_explanation';

export interface AtlasReasoningTraceInputSummary {
  initiativesCount: number;
  vendorsCount: number;
  pressuresCount: number;
  bandConfidenceFloor: 'high' | 'med' | 'low' | 'none';
  lens: string;
  todayIso: string;
  metricKey?: string;
}

export interface AtlasReasoningTraceObservation {
  number: number;
  topic: string;
  body: string;
  confidenceFloor: 'HIGH' | 'MED' | 'LOW';
  citationsCount: number;
  actionsCount: number;
}

export interface AtlasReasoningTraceInput {
  threadId?: string | null;
  tenantId: string;
  userId?: string | null;
  trigger: AtlasReasoningTraceTrigger;
  inputSummary: AtlasReasoningTraceInputSummary;
  patternsFired: ReadonlyArray<string>;
  patternsSkipped: ReadonlyArray<{ pattern: string; reason: string }>;
  observations: ReadonlyArray<AtlasReasoningTraceObservation>;
  ifYouOnlyDoOneToday?: string | null;
  citations: ReadonlyArray<AtlasCitation>;
  interpretationConfidence: 'high' | 'med' | 'low';
  fallbackUsed: boolean;
  fallbackReason?: string | null;
  latencyMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  model: string;
  promptVersion: string;
  packageVersion: string;
}

const SIGNAL_METRIC_MAP: Record<string, string> = {
  shadow_ai_detected: 'shadow_ai_annual_spend_usd',
  stale_attestation: 'value_attainment_pct_avg',
  model_drift: 'value_attainment_pct_avg',
  vendor_concentration: 'distinct_ai_vendors_count',
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringify(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function getClientName(clientId: string): Promise<string> {
  const { data } = await getServerSupabase().from('clients').select('name').eq('id', clientId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? 'Active client';
}

function buildLegacySignal(apps: Array<{ id: string; name: string; vendor: string | null; criticality: string | null; annual_cost_usd: number | null }>): AtlasSignalSummary | null {
  if (apps.length === 0) return null;
  const totalSpend = apps.reduce((sum, item) => sum + Number(item.annual_cost_usd ?? 0), 0);
  return {
    id: 'legacy-shadow-ai',
    headline: `Shadow AI detected across ${apps.slice(0, 3).map((item) => item.vendor ?? item.name).join(', ')}`,
    severity: 'critical',
    state: 'new',
    impactUsd: totalSpend || null,
    firedAt: null,
    signalKey: 'shadow_ai_detected',
    signalTitle: 'Shadow AI detected',
    pillar: 'cost',
    cohortLabel: 'Legacy fallback · cohort context pending',
    percentile: null,
    evidenceSummary: {
      unmanaged_tool_count: apps.length,
      annualized_shadow_spend_usd: totalSpend,
    },
  };
}

async function listLegacyShadowApps(clientId: string) {
  const { data } = await getServerSupabase()
    .from('applications')
    .select('id, name, vendor, criticality, annual_cost_usd')
    .eq('client_id', clientId)
    .eq('business_function', 'Shadow AI')
    .order('annual_cost_usd', { ascending: false })
    .limit(6);
  return ((data as Array<{ id: string; name: string; vendor: string | null; criticality: string | null; annual_cost_usd: number | null }> | null) ?? []);
}

export async function getAtlasPortfolioSummary(ctx: AtlasTenancyCtx): Promise<AtlasPortfolioSummary> {
  const sb = getServerSupabase();
  const clientName = await getClientName(ctx.clientId);
  const { data } = await sb
    .from('portfolio_aggregates')
    .select('*')
    .eq('client_id', ctx.clientId)
    .order('aggregate_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    const row = data as {
      client_id: string;
      aggregate_date: string;
      active_use_case_count: number;
      critical_signal_count: number;
      warning_signal_count: number;
      governed_ai_spend_usd: number;
      shadow_ai_spend_usd: number;
      estimated_value_usd: number;
      realized_value_usd: number;
      average_trustworthiness_score: number | null;
      stale_integration_count: number;
      aggregate_jsonb: JsonObject;
    };

    return {
      clientId: row.client_id,
      clientName,
      activeUseCaseCount: row.active_use_case_count,
      criticalSignalCount: row.critical_signal_count,
      warningSignalCount: row.warning_signal_count,
      governedAiSpendUsd: Number(row.governed_ai_spend_usd ?? 0),
      shadowAiSpendUsd: Number(row.shadow_ai_spend_usd ?? 0),
      estimatedValueUsd: Number(row.estimated_value_usd ?? 0),
      realizedValueUsd: Number(row.realized_value_usd ?? 0),
      averageTrustworthinessScore: toNumber(row.average_trustworthiness_score),
      staleIntegrationCount: row.stale_integration_count,
      adoptionPenetrationPctAvg: toNumber(row.aggregate_jsonb.adoption_penetration_pct_avg),
      trackedActiveUsers: toNumber(row.aggregate_jsonb.tracked_active_users),
      distinctAiVendorsCount: toNumber(row.aggregate_jsonb.distinct_ai_vendors_count),
      valueAttainmentPctAvg: toNumber(row.aggregate_jsonb.value_attainment_pct_avg),
      adoptionPercentile: toNumber(row.aggregate_jsonb.adoption_percentile),
      spendIntensityPercentile: toNumber(row.aggregate_jsonb.spend_intensity_percentile),
      valueAttainmentPercentile: toNumber(row.aggregate_jsonb.value_attainment_percentile),
      vendorCountPercentile: toNumber(row.aggregate_jsonb.vendor_count_percentile),
      asOf: row.aggregate_date,
    };
  }

  const vm = await buildTowerViewModel(ctx.clientId);
  return {
    clientId: ctx.clientId,
    clientName,
    activeUseCaseCount: vm?.inventory.total ?? 0,
    criticalSignalCount: vm?.contradictions.filter((row) => row.severity === 'high').length ?? 0,
    warningSignalCount: vm?.contradictions.filter((row) => row.severity === 'medium').length ?? 0,
    governedAiSpendUsd: vm?.cost.monthlySpendUsd ?? 0,
    shadowAiSpendUsd: 0,
    estimatedValueUsd: vm?.value.projectedUsd ?? 0,
    realizedValueUsd: vm?.value.verifiedUsd ?? 0,
    averageTrustworthinessScore: null,
    staleIntegrationCount: 0,
    adoptionPenetrationPctAvg: vm?.adoption.avgPenetrationPct ?? null,
    trackedActiveUsers: vm?.adoption.totalDau ?? null,
    distinctAiVendorsCount: null,
    valueAttainmentPctAvg: null,
    adoptionPercentile: null,
    spendIntensityPercentile: null,
    valueAttainmentPercentile: null,
    vendorCountPercentile: null,
    asOf: null,
  };
}

export async function listAtlasSignals(ctx: AtlasTenancyCtx, limit = 5): Promise<AtlasSignalSummary[]> {
  const { data } = await getServerSupabase()
    .from('signal_firings')
    .select(
      'id, headline, severity, state, impact_usd, fired_at, evidence_summary_jsonb, cohort_context_jsonb, signal_catalog:signal_catalog_id(key, title, pillar)',
    )
    .eq('client_id', ctx.clientId)
    .in('state', ['new', 'triaged', 'actioned'])
    .order('impact_usd', { ascending: false, nullsFirst: false })
    .order('fired_at', { ascending: false })
    .limit(limit);

  const signals = ((data as Array<{
    id: string;
    headline: string;
    severity: 'critical' | 'warning' | 'info';
    state: 'new' | 'triaged' | 'actioned' | 'resolved' | 'suppressed';
    impact_usd: number | null;
    fired_at: string | null;
    evidence_summary_jsonb: JsonObject;
    cohort_context_jsonb: JsonObject;
    signal_catalog: { key: string; title: string; pillar: AtlasSignalSummary['pillar'] } | null;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    headline: row.headline,
    severity: row.severity,
    state: row.state,
    impactUsd: toNumber(row.impact_usd),
    firedAt: row.fired_at,
    signalKey: row.signal_catalog?.key ?? 'signal',
    signalTitle: row.signal_catalog?.title ?? row.headline,
    pillar: row.signal_catalog?.pillar ?? 'cross_pillar',
    cohortLabel: stringify(row.cohort_context_jsonb.label),
    percentile: toNumber(row.cohort_context_jsonb.percentile),
    evidenceSummary: row.evidence_summary_jsonb ?? {},
  }));

  if (signals.length > 0) return signals;

  const legacyApps = await listLegacyShadowApps(ctx.clientId);
  const legacy = buildLegacySignal(legacyApps);
  return legacy ? [legacy] : [];
}

export async function getAtlasBenchmark(ctx: AtlasTenancyCtx, metricName: string): Promise<AtlasBenchmark | null> {
  const sb = getServerSupabase();
  const [benchmarkRes, peerRes, portfolio] = await Promise.all([
    sb
      .from('cohort_benchmarks')
      .select('*')
      .eq('metric_name', metricName)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('cohort_peers').select('display_name, metric_snapshot').eq('active', true).limit(7),
    getAtlasPortfolioSummary(ctx),
  ]);

  const benchmarkRow = benchmarkRes.data as {
    pillar: AtlasBenchmark['pillar'];
    metric_name: string;
    cohort_definition: JsonObject;
    sample_size: number;
    p25: number | null;
    p50: number | null;
    p75: number | null;
    p90: number | null;
    computation_notes: JsonObject;
  } | null;

  const peerRows =
    (peerRes.data as Array<{ display_name: string; metric_snapshot: JsonObject }> | null) ?? [];

  const peerPoints = peerRows
    .map((row) => {
      const value = toNumber(row.metric_snapshot[metricName]);
      if (typeof value !== 'number') return null;
      const point: AtlasBenchmarkPoint = {
        label: row.display_name,
        value,
        kind: 'peer',
      };
      return point;
    })
    .filter((row): row is AtlasBenchmarkPoint => row !== null)
    .sort((a, b) => a.value - b.value)
    .slice(0, 7);

  const apexFallbackMap: Record<string, number | null> = {
    adoption_penetration_pct_avg: portfolio.adoptionPenetrationPctAvg,
    ai_spend_pct_of_revenue: null,
    shadow_ai_annual_spend_usd: portfolio.shadowAiSpendUsd,
    value_attainment_pct_avg: portfolio.valueAttainmentPctAvg,
    distinct_ai_vendors_count: portfolio.distinctAiVendorsCount,
  };

  if (!benchmarkRow) {
    if (peerPoints.length === 0) return null;
    return {
      metricName,
      pillar: 'cross_pillar',
      label: null,
      sampleSize: peerPoints.length,
      p25: null,
      p50: null,
      p75: null,
      p90: null,
      apexValue: apexFallbackMap[metricName] ?? null,
      apexPercentile: null,
      note: null,
      peers: peerPoints,
    };
  }

  return {
    metricName: benchmarkRow.metric_name,
    pillar: benchmarkRow.pillar,
    label: stringify(benchmarkRow.cohort_definition.label),
    sampleSize: benchmarkRow.sample_size,
    p25: toNumber(benchmarkRow.p25),
    p50: toNumber(benchmarkRow.p50),
    p75: toNumber(benchmarkRow.p75),
    p90: toNumber(benchmarkRow.p90),
    apexValue: toNumber(benchmarkRow.computation_notes.apex_value) ?? apexFallbackMap[metricName] ?? null,
    apexPercentile: toNumber(benchmarkRow.computation_notes.apex_percentile),
    note: stringify(benchmarkRow.computation_notes.note),
    peers: peerPoints,
  };
}

export async function getAtlasSignalDetail(ctx: AtlasTenancyCtx, signalId: string): Promise<AtlasSignalDetail | null> {
  if (signalId === 'legacy-shadow-ai') {
    const apps = await listLegacyShadowApps(ctx.clientId);
    const legacySignal = buildLegacySignal(apps);
    if (!legacySignal) return null;
    return {
      ...legacySignal,
      narrative: {},
      evidence: apps.map((app, index) => ({
        id: app.id,
        position: index + 1,
        evidenceType: 'inventory_registry',
        sourceLabel: 'Legacy application registry',
        artifactRef: null,
        vendorName: app.vendor,
        title: app.name,
        summary: 'Legacy fallback generated from Shadow AI application entries.',
        amountUsd: toNumber(app.annual_cost_usd),
        metricValue: null,
        metricUnit: null,
        confidence: 'medium',
        metadata: {},
      })),
      cohortContext: { label: 'Legacy fallback · no cohort benchmark loaded' },
      benchmark: null,
      recommendedActions: ['Review renewal exposure', 'Originate governance program'],
    };
  }

  const sb = getServerSupabase();
  const { data } = await sb
    .from('signal_firings')
    .select(
      'id, headline, severity, state, impact_usd, fired_at, narrative_jsonb, evidence_summary_jsonb, cohort_context_jsonb, signal_catalog:signal_catalog_id(key, title, pillar, routing_defaults)',
    )
    .eq('client_id', ctx.clientId)
    .eq('id', signalId)
    .maybeSingle();

  const row = data as {
    id: string;
    headline: string;
    severity: 'critical' | 'warning' | 'info';
    state: 'new' | 'triaged' | 'actioned' | 'resolved' | 'suppressed';
    impact_usd: number | null;
    fired_at: string | null;
    narrative_jsonb: JsonObject;
    evidence_summary_jsonb: JsonObject;
    cohort_context_jsonb: JsonObject;
    signal_catalog: { key: string; title: string; pillar: AtlasSignalSummary['pillar']; routing_defaults?: JsonObject } | null;
  } | null;

  if (!row) return null;

  const evidenceRes = await sb
    .from('signal_evidence_chains')
    .select('*')
    .eq('signal_firing_id', signalId)
    .order('position', { ascending: true });

  const evidence = ((evidenceRes.data as Array<{
    id: string;
    position: number;
    evidence_type: string;
    source_label: string;
    artifact_ref: string | null;
    vendor_name: string | null;
    title: string;
    summary: string | null;
    amount_usd: number | null;
    metric_value: number | null;
    metric_unit: string | null;
    confidence: AtlasEvidenceItem['confidence'];
    metadata_jsonb: JsonObject;
  }> | null) ?? []).map((item) => ({
    id: item.id,
    position: item.position,
    evidenceType: item.evidence_type,
    sourceLabel: item.source_label,
    artifactRef: item.artifact_ref,
    vendorName: item.vendor_name,
    title: item.title,
    summary: item.summary,
    amountUsd: toNumber(item.amount_usd),
    metricValue: toNumber(item.metric_value),
    metricUnit: item.metric_unit,
    confidence: item.confidence,
    metadata: item.metadata_jsonb ?? {},
  }));

  const benchmarkMetric = SIGNAL_METRIC_MAP[row.signal_catalog?.key ?? ''] ?? 'shadow_ai_annual_spend_usd';
  const benchmark = await getAtlasBenchmark(ctx, benchmarkMetric);

  const recommendedActions = [
    stringify(row.signal_catalog?.routing_defaults?.primary_action),
    stringify(row.narrative_jsonb.recommended_action),
    stringify(row.cohort_context_jsonb.recommended_action),
  ].filter((item): item is string => !!item);

  if (recommendedActions.length === 0 && row.signal_catalog?.key === 'shadow_ai_detected') {
    recommendedActions.push('Originate AI Supplier Consolidation', 'Review renewal windows');
  }

  return {
    id: row.id,
    headline: row.headline,
    severity: row.severity,
    state: row.state,
    impactUsd: toNumber(row.impact_usd),
    firedAt: row.fired_at,
    signalKey: row.signal_catalog?.key ?? 'signal',
    signalTitle: row.signal_catalog?.title ?? row.headline,
    pillar: row.signal_catalog?.pillar ?? 'cross_pillar',
    cohortLabel: stringify(row.cohort_context_jsonb.label),
    percentile: toNumber(row.cohort_context_jsonb.percentile),
    evidenceSummary: row.evidence_summary_jsonb ?? {},
    narrative: row.narrative_jsonb ?? {},
    evidence,
    cohortContext: row.cohort_context_jsonb ?? {},
    benchmark,
    recommendedActions,
  };
}

export async function listAtlasObservations(ctx: AtlasTenancyCtx, limit = 6): Promise<AtlasObservation[]> {
  const { data } = await getServerSupabase()
    .from('atlas_observations')
    .select('id, summary, severity, observation_kind, route_type, details_jsonb, created_at')
    .eq('client_id', ctx.clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data as Array<{
    id: string;
    summary: string;
    severity: AtlasObservation['severity'];
    observation_kind: AtlasObservation['observationKind'];
    route_type: AtlasObservation['routeType'];
    details_jsonb: JsonObject;
    created_at: string;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    summary: row.summary,
    severity: row.severity,
    observationKind: row.observation_kind,
    routeType: row.route_type,
    details: row.details_jsonb ?? {},
    createdAt: row.created_at,
  }));
}

export async function listAtlasPrograms(ctx: AtlasTenancyCtx, limit = 6) {
  const { data } = await getServerSupabase()
    .from('engagements')
    .select('id, name, current_phase, status, origin_source')
    .eq('client_id', ctx.clientId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return ((data as Array<{
    id: string;
    name: string;
    current_phase: number | null;
    status: string | null;
    origin_source: string | null;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    currentPhase: row.current_phase,
    status: row.status,
    originSource: row.origin_source,
  }));
}

export async function listAtlasUseCases(ctx: AtlasTenancyCtx, limit = 8) {
  const { data } = await getServerSupabase()
    .from('use_cases')
    .select('id, name, stage, business_unit, vendor')
    .eq('client_id', ctx.clientId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return ((data as Array<{
    id: string;
    name: string;
    stage: string | null;
    business_unit: string | null;
    vendor: string | null;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    stage: row.stage,
    businessUnit: row.business_unit,
    vendor: row.vendor,
  }));
}

export async function getOrCreateAtlasThread(
  ctx: AtlasTenancyCtx,
  input: { threadId?: string | null; title?: string | null; signalId?: string | null },
) {
  const sb = getServerSupabase();

  if (input.threadId) {
    const { data } = await sb
      .from('atlas_threads')
      .select('id')
      .eq('id', input.threadId)
      .eq('client_id', ctx.clientId)
      .maybeSingle();
    if (data) return data as { id: string };
  }

  const { data, error } = await sb
    .from('atlas_threads')
    .insert({
      client_id: ctx.clientId,
      person_id: ctx.userId ?? null,
      title: input.title ?? null,
      signal_firing_id: input.signalId ?? null,
      context_scope: input.signalId ? 'signal' : 'portfolio',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create Atlas thread');
  return data as { id: string };
}

export async function touchAtlasThread(threadId: string) {
  await getServerSupabase().from('atlas_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);
}

export async function nextAtlasTurnIndex(threadId: string): Promise<number> {
  const { data } = await getServerSupabase()
    .from('atlas_message_traces')
    .select('turn_index')
    .eq('atlas_thread_id', threadId)
    .order('turn_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { turn_index?: number } | null)?.turn_index ?? -1) + 1;
}

export async function appendAtlasTrace(input: {
  threadId: string;
  role: 'user' | 'atlas' | 'system';
  routeType: AtlasRouteType;
  content: JsonObject;
  toolsUsed?: string[];
  modelName?: string | null;
  promptVersion?: string | null;
  latencyMs?: number | null;
  observationId?: string | null;
}) {
  const turnIndex = await nextAtlasTurnIndex(input.threadId);
  const { error } = await getServerSupabase().from('atlas_message_traces').insert({
    atlas_thread_id: input.threadId,
    atlas_observation_id: input.observationId ?? null,
    turn_index: turnIndex,
    role: input.role,
    route_type: input.routeType,
    content_jsonb: input.content,
    tools_used: input.toolsUsed ?? [],
    model_name: input.modelName ?? null,
    prompt_version: input.promptVersion ?? null,
    latency_ms: input.latencyMs ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function appendAtlasReasoningTrace(input: AtlasReasoningTraceInput) {
  const citationErrors = validateAtlasCitationList(input.citations);
  if (citationErrors.length > 0) {
    throw new Error(`Invalid Atlas reasoning trace citations: ${citationErrors.join('; ')}`);
  }

  const { error } = await getServerSupabase().from('atlas_reasoning_traces').insert({
    trace_id: `atlas_rt_${randomUUID()}`,
    thread_id: input.threadId ?? null,
    tenant_id: input.tenantId,
    user_id: input.userId ?? null,
    trigger: input.trigger,
    input_summary: input.inputSummary,
    patterns_fired: input.patternsFired,
    patterns_skipped: input.patternsSkipped,
    observations: input.observations,
    if_you_only_do_one: input.ifYouOnlyDoOneToday ?? null,
    citations: input.citations,
    interpretation_confidence: input.interpretationConfidence,
    fallback_used: input.fallbackUsed,
    fallback_reason: input.fallbackReason ?? null,
    latency_ms: input.latencyMs ?? null,
    prompt_tokens: input.promptTokens ?? null,
    completion_tokens: input.completionTokens ?? null,
    model: input.model,
    prompt_version: input.promptVersion,
    package_version: input.packageVersion,
  });
  if (error) throw new Error(error.message);
}

export async function createAtlasObservation(input: {
  ctx: AtlasTenancyCtx;
  threadId?: string | null;
  signalId?: string | null;
  pillar?: AtlasSignalSummary['pillar'] | null;
  observationKind: AtlasObservation['observationKind'];
  severity?: AtlasObservation['severity'];
  summary: string;
  details?: JsonObject;
  routeType: AtlasRouteType | 'rule';
}) {
  const { data, error } = await getServerSupabase()
    .from('atlas_observations')
    .insert({
      client_id: input.ctx.clientId,
      atlas_thread_id: input.threadId ?? null,
      signal_firing_id: input.signalId ?? null,
      pillar: input.pillar ?? null,
      observation_kind: input.observationKind,
      severity: input.severity ?? null,
      summary: input.summary,
      details_jsonb: input.details ?? {},
      route_type: input.routeType,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create observation');
  return (data as { id: string }).id;
}

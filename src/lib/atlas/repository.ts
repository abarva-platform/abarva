import { randomUUID } from 'node:crypto';
import { buildTowerViewModel } from '@/lib/tower/aggregate';
import { selectAtlasRepositoryReadAdapter } from '@/lib/data-plane/read-adapters/atlasRepositoryReadAdapter';
import { selectAtlasRepositoryWriteAdapter } from '@/lib/data-plane/write-adapters/atlasRepositoryWriteAdapter';
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

// Slice 9: the 15+ physical reads and the thread/trace/observation writes that
// used to call Supabase directly now route through the data-plane seam — reads
// via `atlasRepositoryReadAdapter`, writes via `atlasRepositoryWriteAdapter`.
// This module keeps the orchestration: every row→view-model mapping, the
// legacy-fallback branching, and the two functions that genuinely interleave a
// read and a write (`getOrCreateAtlasThread`, `appendAtlasTrace`) stay here and
// call BOTH adapters. A read adapter never writes; a write adapter never reads.
// Function signatures and return shapes are byte-identical to the pre-seam
// repository, so every caller keeps working unchanged.

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
  const row = await selectAtlasRepositoryReadAdapter().getClientName(clientId);
  return row?.name ?? 'Active client';
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
  return selectAtlasRepositoryReadAdapter().listLegacyShadowApps(clientId);
}

export async function getAtlasPortfolioSummary(ctx: AtlasTenancyCtx): Promise<AtlasPortfolioSummary> {
  const reader = selectAtlasRepositoryReadAdapter();
  const clientName = await getClientName(ctx.clientId);
  const row = await reader.getLatestPortfolioAggregate(ctx.clientId);

  if (row) {
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
  const rows = await selectAtlasRepositoryReadAdapter().listSignalFirings(ctx.clientId, limit);

  const signals = rows.map((row) => ({
    id: row.id,
    headline: row.headline,
    severity: row.severity,
    state: row.state,
    impactUsd: toNumber(row.impact_usd),
    firedAt: row.fired_at,
    signalKey: row.signal_catalog?.key ?? 'signal',
    signalTitle: row.signal_catalog?.title ?? row.headline,
    pillar: (row.signal_catalog?.pillar as AtlasSignalSummary['pillar']) ?? 'cross_pillar',
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
  const reader = selectAtlasRepositoryReadAdapter();
  const [benchmarkRow, peerRows, portfolio] = await Promise.all([
    reader.getCohortBenchmark(metricName),
    reader.listCohortPeers(),
    getAtlasPortfolioSummary(ctx),
  ]);

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
    pillar: benchmarkRow.pillar as AtlasBenchmark['pillar'],
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

  const reader = selectAtlasRepositoryReadAdapter();
  const row = await reader.getSignalFiringDetail(ctx.clientId, signalId);

  if (!row) return null;

  const evidenceRows = await reader.listSignalEvidence(signalId);

  const evidence = evidenceRows.map((item) => ({
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
    confidence: item.confidence as AtlasEvidenceItem['confidence'],
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
    pillar: (row.signal_catalog?.pillar as AtlasSignalSummary['pillar']) ?? 'cross_pillar',
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
  const rows = await selectAtlasRepositoryReadAdapter().listObservations(ctx.clientId, limit);

  return rows.map((row) => ({
    id: row.id,
    summary: row.summary,
    severity: row.severity as AtlasObservation['severity'],
    observationKind: row.observation_kind as AtlasObservation['observationKind'],
    routeType: row.route_type as AtlasObservation['routeType'],
    details: row.details_jsonb ?? {},
    createdAt: row.created_at,
  }));
}

export async function listAtlasPrograms(ctx: AtlasTenancyCtx, limit = 6) {
  const rows = await selectAtlasRepositoryReadAdapter().listEngagements(ctx.clientId, limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    currentPhase: row.current_phase,
    status: row.status,
    originSource: row.origin_source,
  }));
}

export async function listAtlasUseCases(ctx: AtlasTenancyCtx, limit = 8) {
  const rows = await selectAtlasRepositoryReadAdapter().listUseCases(ctx.clientId, limit);

  return rows.map((row) => ({
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
  // Genuine read+write interleave: a thread lookup (read) followed by a
  // conditional insert (write). The orchestration stays in the repository;
  // the read adapter performs the lookup and the write adapter the insert.
  if (input.threadId) {
    const existing = await selectAtlasRepositoryReadAdapter().findThreadId(
      input.threadId,
      ctx.clientId,
    );
    if (existing) return existing;
  }

  const outcome = await selectAtlasRepositoryWriteAdapter().insertThread({
    clientId: ctx.clientId,
    personId: ctx.userId ?? null,
    title: input.title ?? null,
    signalFiringId: input.signalId ?? null,
    contextScope: input.signalId ? 'signal' : 'portfolio',
    lastMessageAtIso: new Date().toISOString(),
  });

  if (!outcome.ok || !outcome.data) {
    throw new Error(outcome.error ?? 'Failed to create Atlas thread');
  }
  return { id: outcome.data.id };
}

export async function touchAtlasThread(threadId: string) {
  await selectAtlasRepositoryWriteAdapter().touchThread(threadId, new Date().toISOString());
}

export async function nextAtlasTurnIndex(threadId: string): Promise<number> {
  const maxIndex = await selectAtlasRepositoryReadAdapter().getMaxTurnIndex(threadId);
  return (maxIndex ?? -1) + 1;
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
  // Genuine read+write interleave: resolve the next turn index (read), then
  // insert the trace row at that index (write). Orchestration stays here.
  const turnIndex = await nextAtlasTurnIndex(input.threadId);
  const outcome = await selectAtlasRepositoryWriteAdapter().insertMessageTrace({
    atlasThreadId: input.threadId,
    atlasObservationId: input.observationId ?? null,
    turnIndex,
    role: input.role,
    routeType: input.routeType,
    contentJsonb: input.content,
    toolsUsed: input.toolsUsed ?? [],
    modelName: input.modelName ?? null,
    promptVersion: input.promptVersion ?? null,
    latencyMs: input.latencyMs ?? null,
  });
  if (!outcome.ok) throw new Error(outcome.error ?? 'Failed to append Atlas trace');
}

export async function appendAtlasReasoningTrace(input: AtlasReasoningTraceInput) {
  const citationErrors = validateAtlasCitationList(input.citations);
  if (citationErrors.length > 0) {
    throw new Error(`Invalid Atlas reasoning trace citations: ${citationErrors.join('; ')}`);
  }

  const outcome = await selectAtlasRepositoryWriteAdapter().insertReasoningTrace({
    traceId: `atlas_rt_${randomUUID()}`,
    threadId: input.threadId ?? null,
    tenantId: input.tenantId,
    userId: input.userId ?? null,
    trigger: input.trigger,
    inputSummary: input.inputSummary as unknown as JsonObject,
    patternsFired: input.patternsFired,
    patternsSkipped: input.patternsSkipped,
    observations: input.observations as unknown as ReadonlyArray<JsonObject>,
    ifYouOnlyDoOne: input.ifYouOnlyDoOneToday ?? null,
    citations: input.citations as unknown as ReadonlyArray<JsonObject>,
    interpretationConfidence: input.interpretationConfidence,
    fallbackUsed: input.fallbackUsed,
    fallbackReason: input.fallbackReason ?? null,
    latencyMs: input.latencyMs ?? null,
    promptTokens: input.promptTokens ?? null,
    completionTokens: input.completionTokens ?? null,
    model: input.model,
    promptVersion: input.promptVersion,
    packageVersion: input.packageVersion,
  });
  if (!outcome.ok) throw new Error(outcome.error ?? 'Failed to append Atlas reasoning trace');
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
  const outcome = await selectAtlasRepositoryWriteAdapter().insertObservation({
    clientId: input.ctx.clientId,
    atlasThreadId: input.threadId ?? null,
    signalFiringId: input.signalId ?? null,
    pillar: input.pillar ?? null,
    observationKind: input.observationKind,
    severity: input.severity ?? null,
    summary: input.summary,
    detailsJsonb: input.details ?? {},
    routeType: input.routeType,
  });
  if (!outcome.ok || !outcome.data) {
    throw new Error(outcome.error ?? 'Failed to create observation');
  }
  return outcome.data.id;
}

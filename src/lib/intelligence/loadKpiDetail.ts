import { getServerSupabase } from '@/lib/supabase-server';

export interface KpiRow {
  id: string;
  client_id: string;
  ordinal_ref: string | null;
  name: string;
  short_name: string | null;
  definition: string | null;
  category: string | null;
  subcategory: string | null;
  owner_role_title: string | null;
  owner_person_id: string | null;
  owner_person_name: string | null;
  business_unit_name: string | null;
  strategic_priority_ref: string | null;
  target_value: number | null;
  target_unit: string | null;
  target_as_of_date: string | null;
  target_period: string | null;
  current_value: number | null;
  current_unit: string | null;
  current_as_of_date: string | null;
  trend_direction: string | null;
  trend_magnitude_pct: number | null;
  trend_period: string | null;
  trend_summary: string | null;
  benchmark_median: number | null;
  benchmark_top_quartile: number | null;
  benchmark_bottom_quartile: number | null;
  benchmark_peer_cohort_id: string | null;
  benchmark_as_of_date: string | null;
  benchmark_confidence: string | null;
  gap_to_median_pct: number | null;
  gap_to_top_quartile_pct: number | null;
  peer_position_quartile: string | null;
  linked_initiative_refs: string[];
  linked_pattern_ids: string[];
  upstream_kpi_ids: string[];
  downstream_kpi_ids: string[];
  conflicting_kpi_ids: string[];
  data_source: string | null;
  data_source_type: string | null;
  freshness_sla: string | null;
  last_refresh_timestamp: string | null;
  confidence_level: string | null;
  why_it_matters: string | null;
  methodology_notes: string | null;
  common_objections: Array<Record<string, unknown>>;
  known_issues: Array<Record<string, unknown>>;
  evidence_ids: string[];
  metadata: Record<string, unknown>;
}

export interface KpiEvidenceRow {
  id: string;
  title: string;
  summary: string;
  evidence_type: string;
  observed_at: string | null;
  methodology_notes: string | null;
  confidence_level: string | null;
  evidence_payload: Record<string, unknown>;
}

export interface TelemetrySourceRow {
  id: string;
  name: string;
  description: string | null;
  modality: string;
  connector_type: string | null;
  refresh_schedule: string | null;
  scope_description: string | null;
  data_format: string | null;
  residency_mode: string | null;
  compliance_tags: string[];
  regulatory_notes: string | null;
  confidence_level: string | null;
  last_refreshed_at: string | null;
}

export interface PatternAssociationRow {
  id: string;
  name: string;
  short_description: string | null;
  confidence_level: string | null;
}

export interface RelatedKpiRow {
  id: string;
  name: string;
  category: string | null;
  current_value: number | null;
  current_unit: string | null;
}

export interface BenchmarkCohortRow {
  id: string;
  cohort_name: string;
  sector: string | null;
  subsector: string | null;
}

export interface KpiDetailBundle {
  kpi: KpiRow;
  evidence: KpiEvidenceRow[];
  telemetrySources: TelemetrySourceRow[];
  patterns: PatternAssociationRow[];
  relatedKpis: RelatedKpiRow[];
  benchmarkCohort: BenchmarkCohortRow | null;
}

export async function loadKpiDetail(kpiId: string, clientId: string): Promise<KpiDetailBundle | null> {
  const sb = getServerSupabase();
  const { data: row } = await sb
    .from('kpis')
    .select('*')
    .eq('id', kpiId)
    .eq('client_id', clientId)
    .maybeSingle();

  const kpi = (row as KpiRow | null) ?? null;
  if (!kpi) return null;

  const relatedIds = Array.from(
    new Set([
      ...kpi.upstream_kpi_ids,
      ...kpi.downstream_kpi_ids,
      ...kpi.conflicting_kpi_ids,
    ]),
  );

  const [evidenceQ, telemetryQ, patternsQ, relatedQ, benchmarkQ] = await Promise.all([
    sb
      .from('evidence')
      .select('id, title, summary, evidence_type, observed_at, methodology_notes, confidence_level, evidence_payload')
      .eq('client_id', clientId)
      .eq('related_entity_type', 'kpi')
      .eq('related_entity_id', kpi.id)
      .order('observed_at', { ascending: false }),
    sb
      .from('telemetry_sources')
      .select('id, name, description, modality, connector_type, refresh_schedule, scope_description, data_format, residency_mode, compliance_tags, regulatory_notes, confidence_level, last_refreshed_at')
      .eq('client_id', clientId)
      .overlaps('kpi_ids_populated', [kpi.id]),
    kpi.linked_pattern_ids.length > 0
      ? sb
          .from('pattern_packs')
          .select('id, name, short_description, confidence_level')
          .eq('client_id', clientId)
          .in('id', kpi.linked_pattern_ids)
      : Promise.resolve({ data: [] as PatternAssociationRow[] }),
    relatedIds.length > 0
      ? sb
          .from('kpis')
          .select('id, name, category, current_value, current_unit')
          .eq('client_id', clientId)
          .in('id', relatedIds)
      : Promise.resolve({ data: [] as RelatedKpiRow[] }),
    kpi.benchmark_peer_cohort_id
      ? sb
          .from('benchmark_cohorts')
          .select('id, cohort_name, sector, subsector')
          .eq('id', kpi.benchmark_peer_cohort_id)
          .maybeSingle()
      : Promise.resolve({ data: null as BenchmarkCohortRow | null }),
  ]);

  return {
    kpi,
    evidence: ((evidenceQ.data ?? []) as KpiEvidenceRow[]),
    telemetrySources: ((telemetryQ.data ?? []) as TelemetrySourceRow[]),
    patterns: ((patternsQ.data ?? []) as PatternAssociationRow[]),
    relatedKpis: ((relatedQ.data ?? []) as RelatedKpiRow[]),
    benchmarkCohort: (benchmarkQ.data as BenchmarkCohortRow | null) ?? null,
  };
}

export async function loadKpiIndex(clientId: string): Promise<KpiRow[]> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('kpis')
    .select('*')
    .eq('client_id', clientId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  return (data ?? []) as KpiRow[];
}

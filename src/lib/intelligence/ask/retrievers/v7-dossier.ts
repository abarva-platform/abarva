import {
  appClientKeyForTenant,
  tenantProfileForClientKey,
} from '@/lib/tenant/aliases';
import {
  createDefaultSession,
  type SessionRunner,
} from '@/lib/data-plane/read-adapters/azureSession';
import type { AskSource, AskSurfaceContext, RetrievalResult } from '../types';

type JsonRecord = Record<string, unknown>;

interface V7RunRow {
  tenant_key: string;
  tenant_name: string;
  contract_version: string;
  row_count: number;
  field_count: number;
  graph_node_count: number;
  relationship_edge_count: number;
  chunk_count: number;
  loaded_at: string;
}

interface V7RecordRow {
  record_name: string | null;
  dimension_key: string;
  source_file: string;
  source_artifact_name: string | null;
  source_validation_status: string | null;
  values_json: JsonRecord;
}

interface V7RetrievalOptions {
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
  session?: SessionRunner;
  contractVersion?: string;
}

const V7_TENANT_BY_APP_CLIENT: Record<string, string> = {
  apexretail: 'apex-retail',
  firstcapital: 'first-capital-financial',
  lakeshore: 'lakeshore-industries',
  meridian: 'meridian-health',
  skyharbor: 'skyharbor-air',
};

const DIMENSION_LABELS: Record<string, string> = {
  v7_01_enterprise_profile: 'Enterprise profile',
  v7_02_business_functions: 'Business functions',
  v7_03_org_ownership: 'Org ownership and decision rights',
  v7_04_workforce_personas: 'Workforce personas',
  v7_05_applications_systems: 'Applications and systems',
  v7_06_data_assets_integrations: 'Data assets and integrations',
  v7_07_vendors_contracts: 'Vendors and contracts',
  v7_08_spend_value: 'Spend and value',
  v7_09_programs_initiatives_business_priorities: 'Programs and business priorities',
  v7_10_ai_initiatives: 'AI initiatives',
  v7_11_operations_risk_controls: 'Operations, risk, and controls',
  v7_12_relationships_graph_edges: 'Relationship graph',
  v7_13_source_evidence_registry: 'Source evidence registry',
  v7_14_metric_definitions: 'Metric definitions',
  v7_15_industry_market_knowledge_patterns: 'Industry and market patterns',
  v7_16_expert_lenses: 'Expert lenses',
  v7_17_client_rate_card_cost_basis: 'Client rate card and cost basis',
  v7_18_function_system_data_vendor_bridge: 'Function-system-data-vendor bridge',
  v7_19_service_tower_managed_services_scope: 'Service tower and managed services scope',
  v7_20_chunk_retrieval_registry: 'Retrieval registry',
  v7_21_graph_registry_relationship_dictionary: 'Graph relationship dictionary',
  v7_22_operational_evidence_process_intelligence: 'Operational process evidence',
  v7_23_external_benchmark_market_corpus: 'External benchmark and market corpus',
  v7_24_infrastructure_cloud_estate: 'Infrastructure and cloud estate',
};

const FIELD_PRIORITY: Record<string, string[]> = {
  v7_01_enterprise_profile: [
    'company_name',
    'industry',
    'revenue_usd',
    'revenue_basis',
    'employee_count',
    'total_direct_technology_budget_usd',
    'technology_budget_basis',
    'ai_data_budget_usd',
  ],
  v7_02_business_functions: [
    'function_name',
    'business_function_name',
    'executive_owner',
    'critical_processes_structured',
    'primary_kpis_structured',
    'known_business_pain_points',
    'ai_opportunity_areas',
  ],
  v7_03_org_ownership: [
    'org_unit',
    'leader_role',
    'reports_to_role',
    'decision_rights',
    'budget_authority',
    'owned_system_refs',
    'approval_rights',
  ],
  v7_05_applications_systems: [
    'system_name',
    'system_category',
    'vendor_product',
    'hosting_model',
    'business_functions_supported',
    'business_function_refs',
    'critical_process_refs',
    'decision_relevance',
    'criticality',
    'technical_owner_role',
    'data_domains',
    'known_gaps',
    'system_business_context',
    'pain_points_constraints',
    'future_state_role',
    'business_owner',
  ],
  v7_06_data_assets_integrations: [
    'data_asset_name',
    'asset_type',
    'data_owner',
    'system_of_record',
    'integration_type',
    'consumer_refs',
    'business_question_supported',
    'quality_posture',
    'data_quality_status',
    'lineage_status',
    'freshness_sla',
    'refresh_frequency',
    'ai_readiness_status',
    'ai_consumption_readiness',
    'minimum_validation_needed',
    'known_gaps',
  ],
  v7_07_vendors_contracts: [
    'vendor_name',
    'vendor_category',
    'contract_name',
    'scope_summary',
    'annual_cost_usd',
    'renewal_date',
    'contract_risk',
    'commercial_owner',
  ],
  v7_08_spend_value: [
    'amount_usd',
    'amount_type',
    'spend_category',
    'service_tower_or_function',
    'run_change',
    'spend_owner',
    'value_linkage',
    'finance_validation_status',
  ],
  v7_09_programs_initiatives_business_priorities: [
    'priority_name',
    'priority_type',
    'business_sponsor',
    'technology_sponsor',
    'target_outcome',
    'current_status',
    'dependency_blockers',
    'stage_gate',
  ],
  v7_10_ai_initiatives: [
    'ai_use_case',
    'business_function_ref',
    'tool_or_model',
    'production_status',
    'data_readiness',
    'model_risk_tier',
    'measured_value_usd',
    'scale_hold_stop_recommendation',
    'decision_needed',
  ],
  v7_11_operations_risk_controls: [
    'process_control_name',
    'process',
    'volume',
    'cycle_time',
    'sla_breach_rate',
    'risk_category',
    'severity',
    'status',
    'business_impact',
  ],
  v7_15_industry_market_knowledge_patterns: [
    'pattern_name',
    'industry_domain',
    'applicability_conditions',
    'signals',
    'benchmark_range',
    'recommended_actions',
  ],
  v7_16_expert_lenses: [
    'expert_lens_name',
    'lens_domain',
    'question_families',
    'required_evidence',
    'output_artifacts',
    'decision_criteria',
    'caveats',
  ],
  v7_17_client_rate_card_cost_basis: [
    'rate_source_provenance',
    'service_tower',
    'role_family',
    'specialization',
    'delivery_location',
    'rate_usd_per_hour',
    'committed_budget_usd',
    'validation_status',
  ],
  v7_18_function_system_data_vendor_bridge: [
    'function_ref',
    'dependency_type',
    'object_ref',
    'role_in_function',
    'criticality_to_function',
    'process_supported',
    'data_exchanged',
  ],
  v7_22_operational_evidence_process_intelligence: [
    'operational_evidence_source',
    'work_item_type',
    'process',
    'volume',
    'cycle_time',
    'sla_breach_rate',
    'system_service_ref',
    'bottleneck',
    'automation_candidate',
  ],
  v7_23_external_benchmark_market_corpus: [
    'benchmark_name',
    'industry',
    'geography',
    'applicability_conditions',
    'range_low',
    'range_high',
    'confidence_basis',
    'do_not_apply_when',
  ],
  v7_24_infrastructure_cloud_estate: [
    'estate_area',
    'hosting_model',
    'cloud_provider',
    'platform_name',
    'business_services_supported',
    'data_platform_role',
    'operational_constraints',
    'migration_posture',
    'known_gaps',
  ],
};

const defaultSession = createDefaultSession('intelligence-v7-dossier');

export async function retrieveV7DossierSources(
  query: string,
  opts: V7RetrievalOptions = {},
): Promise<RetrievalResult> {
  const tenantKey = resolveV7TenantKey(opts);
  if (!tenantKey) return { sources: [], averageConfidence: 0 };

  const dimensions = selectDimensions(query);
  const contractVersion = opts.contractVersion?.trim() || null;
  const session = opts.session ?? defaultSession;

  try {
    return await session(async (run) => {
      const runs = await run<V7RunRow>(
        contractVersion
          ? `select run.tenant_key, run.tenant_name, run.contract_version, run.row_count::int, run.field_count::int,
          run.graph_node_count::int, run.relationship_edge_count::int, run.chunk_count::int, run.loaded_at::text
         from intelligence_v7.tenant_pack_runs run
         join intelligence_v7.active_tenant_contract_versions active
           on active.tenant_key = run.tenant_key
          and active.active_contract_version = run.contract_version
          and active.promotion_status = 'active'
         where run.tenant_key = $1 and run.contract_version = $2 and run.load_status in ('loaded', 'validated')
         order by loaded_at desc
         limit 1`
          : `select run.tenant_key, run.tenant_name, run.contract_version, run.row_count::int, run.field_count::int,
          run.graph_node_count::int, run.relationship_edge_count::int, run.chunk_count::int, run.loaded_at::text
         from intelligence_v7.tenant_pack_runs run
         join intelligence_v7.active_tenant_contract_versions active
           on active.tenant_key = run.tenant_key
          and active.active_contract_version = run.contract_version
          and active.promotion_status = 'active'
         where run.tenant_key = $1 and run.load_status in ('loaded', 'validated')
         limit 1`,
        contractVersion ? [tenantKey, contractVersion] : [tenantKey],
      );
      const runRow = runs[0];
      if (!runRow) return { sources: [], averageConfidence: 0 };
      const activeContractVersion = runRow.contract_version;

      const rows = await run<V7RecordRow>(
        `select record_name, dimension_key, source_file, source_artifact_name,
          source_validation_status, values_json
         from intelligence_v7.business_records
         where tenant_key = $1 and contract_version = $2 and dimension_key = any($3::text[])
         order by array_position($3::text[], dimension_key), source_row_number asc
         limit 96`,
        [tenantKey, activeContractVersion, dimensions],
      );

      const grouped = groupRows(rows);
      const sources: AskSource[] = [
        buildOverviewSource(runRow, dimensions),
        ...dimensions
          .map((dimension) => buildDimensionSource(dimension, grouped.get(dimension) ?? []))
          .filter((source): source is AskSource => Boolean(source)),
      ];
      const averageConfidence = sources.reduce((sum, source) => sum + (source.confidence ?? 0), 0) / sources.length;
      return { sources, averageConfidence };
    });
  } catch {
    return { sources: [], averageConfidence: 0 };
  }
}

function resolveV7TenantKey(opts: V7RetrievalOptions): string | null {
  const raw =
    opts.tenantInventoryKey ??
    opts.surfaceContext?.clientKey ??
    opts.surfaceContext?.activeClient ??
    null;
  if (!raw) return null;
  const appClientKey = appClientKeyForTenant(raw) ?? raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const profile = tenantProfileForClientKey(appClientKey);
  return V7_TENANT_BY_APP_CLIENT[profile.appClientKey] ?? V7_TENANT_BY_APP_CLIENT[appClientKey] ?? null;
}

function selectDimensions(query: string): string[] {
  const normalized = query.toLowerCase();
  const selected = new Set<string>([
    'v7_01_enterprise_profile',
    'v7_02_business_functions',
    'v7_10_ai_initiatives',
    'v7_15_industry_market_knowledge_patterns',
    'v7_16_expert_lenses',
  ]);

  if (/\b(ai|automation|copilot|agent|model|scale|hold|stop|fund|prioriti[sz]e|investment|portfolio|readiness)\b/.test(normalized)) {
    selected.add('v7_09_programs_initiatives_business_priorities');
    selected.add('v7_05_applications_systems');
    selected.add('v7_06_data_assets_integrations');
    selected.add('v7_07_vendors_contracts');
    selected.add('v7_22_operational_evidence_process_intelligence');
    selected.add('v7_23_external_benchmark_market_corpus');
    selected.add('v7_24_infrastructure_cloud_estate');
  }
  if (/\b(hr|human resources|finance|fp&a|treasury|kyriba|legal|procurement|shared services?|back[-\s]?office|function|process)\b/.test(normalized)) {
    selected.add('v7_03_org_ownership');
    selected.add('v7_11_operations_risk_controls');
    selected.add('v7_18_function_system_data_vendor_bridge');
  }
  if (
    /\b(agent assist|copilot|virtual agent|contact.?center|call.?center|customer service|member service|patient access|service triage|case management|knowledge base|telephony|crm)\b/.test(
      normalized,
    )
  ) {
    selected.add('v7_05_applications_systems');
    selected.add('v7_06_data_assets_integrations');
    selected.add('v7_11_operations_risk_controls');
    selected.add('v7_18_function_system_data_vendor_bridge');
    selected.add('v7_24_infrastructure_cloud_estate');
  }
  if (
    /\b(system|application|erp|sap|data|integration|vendor|contract|cloud|infrastructure|cost|spend|rate|budget|analytics|reporting|bi|dashboard|lakehouse|clinical|claims|pharmacy|epic|clarity|caboodle|tableau|power bi|sas|sql)\b/.test(
      normalized,
    ) ||
    /\b(reporting|analytics)\s+estate\b/.test(normalized)
  ) {
    selected.add('v7_05_applications_systems');
    selected.add('v7_06_data_assets_integrations');
    selected.add('v7_07_vendors_contracts');
    selected.add('v7_08_spend_value');
    selected.add('v7_17_client_rate_card_cost_basis');
  }
  if (/\b(industry|benchmark|market|peer|trend|pattern|case study|external)\b/.test(normalized)) {
    selected.add('v7_15_industry_market_knowledge_patterns');
    selected.add('v7_23_external_benchmark_market_corpus');
  }
  if (/\b(evidence|proof|source|validated|confidence|claim|board|audit|governance|control)\b/.test(normalized)) {
    selected.add('v7_13_source_evidence_registry');
    selected.add('v7_14_metric_definitions');
    selected.add('v7_22_operational_evidence_process_intelligence');
  }

  return Array.from(selected).slice(0, 14);
}

function buildOverviewSource(run: V7RunRow, dimensions: string[]): AskSource {
  return {
    type: 'TENANT',
    name: `${run.tenant_name} active context dossier`,
    id: `${run.tenant_key}:active-context-dossier`,
    confidence: 0.92,
    detail: [
      `${run.tenant_name} has a readback-validated active enterprise context pack.`,
      `Context coverage: ${formatNumber(run.row_count)} business records, ${formatNumber(run.field_count)} field facts, ${formatNumber(run.graph_node_count)} graph nodes, ${formatNumber(run.relationship_edge_count)} relationship edges, and ${formatNumber(run.chunk_count)} retrieval chunks.`,
      `Selected for this question: ${dimensions.map((dimension) => DIMENSION_LABELS[dimension] ?? dimension).join('; ')}.`,
      'Boundary: the active context pack is demo-depth planning context until client validated; use it for directional demo intelligence, decision framing, evidence gaps, and client-to-confirm prompts. Do not describe planning assumptions as client-approved facts.',
    ].join('\n'),
  };
}

function buildDimensionSource(dimension: string, rows: V7RecordRow[]): AskSource | null {
  if (rows.length === 0) return null;
  const label = DIMENSION_LABELS[dimension] ?? humanize(dimension);
  const records = rows.slice(0, 8).map((row) => summarizeRecord(dimension, row)).filter(Boolean);
  if (records.length === 0) return null;

  return {
    type: dimension === 'v7_15_industry_market_knowledge_patterns' ? 'PATTERN' : dimension === 'v7_23_external_benchmark_market_corpus' ? 'BENCHMARK' : 'TENANT',
    name: label,
    id: `context-dimension:${slugify(label)}`,
    confidence: dimension === 'v7_23_external_benchmark_market_corpus' ? 0.76 : 0.84,
    detail: [
      `${label} from the active enterprise context pack (${displaySourceName(rows[0], label)}).`,
      ...records.map((record) => `- ${record}`),
      'Use these as business-language grounding. Keep source boundaries clear: demo-depth planning context until client validated.',
    ].join('\n'),
  };
}

function summarizeRecord(dimension: string, row: V7RecordRow): string {
  const values = row.values_json ?? {};
  const title = firstValue(values, [
    'ai_use_case',
    'function_name',
    'business_function_name',
    'priority_name',
    'system_name',
    'vendor_name',
    'data_asset_name',
    'process_control_name',
    'process',
    'pattern_name',
    'benchmark_name',
    'expert_lens_name',
    'record_name',
  ]) || row.record_name || 'record';
  const fields = (FIELD_PRIORITY[dimension] ?? Object.keys(values).slice(0, 8))
    .map((key) => [humanize(key), stringifyValue(values[key])] as const)
    .filter(([, value]) => value && value !== title)
    .slice(0, 8);

  const fieldText = fields.map(([key, value]) => `${key}: ${value}`).join('; ');
  const source = [
    displaySourceName(row, DIMENSION_LABELS[dimension] ?? humanize(dimension)),
    row.source_validation_status ? `validation: ${row.source_validation_status}` : null,
  ].filter(Boolean).join(', ');
  return `${title}${fieldText ? ` — ${fieldText}` : ''}${source ? ` (${source})` : ''}`;
}

function displaySourceName(row: V7RecordRow | undefined, fallbackLabel: string): string {
  const raw = row?.source_artifact_name ?? row?.source_file ?? '';
  if (!raw) return `${fallbackLabel} source`;
  return raw
    .replace(/^V\d+_\d+_?/i, '')
    .replace(/^v\d+_\d+_?/i, '')
    .replace(/\.(csv|xlsx|json)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase()) || `${fallbackLabel} source`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function firstValue(values: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = stringifyValue(values[key]);
    if (value) return value;
  }
  return null;
}

function stringifyValue(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join(', ');
  if (typeof value === 'object') return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function groupRows(rows: V7RecordRow[]): Map<string, V7RecordRow[]> {
  const grouped = new Map<string, V7RecordRow[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.dimension_key) ?? [];
    bucket.push(row);
    grouped.set(row.dimension_key, bucket);
  }
  return grouped;
}

function humanize(value: string): string {
  return value
    .replace(/^v7_\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';

export type SemanticRuntimeModule =
  | 'home'
  | 'moves'
  | 'source'
  | 'control_tower'
  | 'tower'
  | 'ava'
  | 'intelligence'
  | 'context_layer_admin';

export type SemanticRuntimeIntent =
  | 'inventory'
  | 'process_intelligence'
  | 'bottlenecks'
  | 'application_friction'
  | 'value'
  | 'readiness'
  | 'governance'
  | 'vendors_finance'
  | 'data_quality'
  | 'cross_dimension'
  | 'summary';

export interface SemanticRuntimeAskInput {
  tenantKey: string;
  question: string;
  module?: SemanticRuntimeModule;
  userId?: string | null;
}

export interface SemanticRuntimeCitation {
  label: string;
  sourceTable: string;
  dimensionKey: string;
  recordCount: number;
  syntheticDemo: boolean;
  confidenceScore: number | null;
}

export interface SemanticRuntimeAnswer {
  serviceName: 'Enterprise Semantic Question Layer';
  tenantKey: string;
  question: string;
  module: SemanticRuntimeModule;
  intent: SemanticRuntimeIntent;
  directAnswer: string;
  basis: string;
  facts: Array<{ label: string; value: string | number; unit?: string }>;
  citations: SemanticRuntimeCitation[];
  caveats: string[];
  clientToComplete: string[];
  confidence: 'high' | 'medium' | 'low';
  readinessStatus: 'answerable' | 'partially_answerable' | 'not_answerable' | 'needs_clarification';
  generatedAt: string;
}

interface VolumetricRow {
  tenant_key: string;
  source_type: string;
  dimension_key: string;
  family_key: string;
  evidence_type: string;
  record_count: number | string;
  entity_count: number | string;
  distinct_application_count: number | string;
  distinct_process_count: number | string;
  distinct_vendor_count: number | string;
  distinct_owner_count: number | string;
  freshness_status: string;
  coverage_status: string;
  confidence_score: number | string | null;
  synthetic_demo_flag: boolean;
  finance_validated_flag: boolean;
  notes: string | null;
}

interface DimensionCoverageRow {
  tenant_key: string;
  dimension_key: string;
  available: boolean;
  queryable_structured: boolean;
  searchable_unstructured: boolean;
  metric_ready: boolean;
  citation_ready: boolean;
  record_count: number | string;
  freshness_status: string;
  confidence_score: number | string | null;
  caveats: string[] | null;
  recommended_client_action: string | null;
}

interface QuestionReadinessRow {
  tenant_key: string;
  question_pattern: string;
  intent_type: string;
  readiness_status: SemanticRuntimeAnswer['readinessStatus'];
  confidence_score: number | string | null;
  missing_data: string[] | null;
  caveat_text: string | null;
  suggested_next_action: string | null;
}

export interface SemanticRuntimeDeps {
  read?: Pick<AzureReadClient, 'query'>;
  now?: () => Date;
}

const SEMANTIC_TENANT_ALIASES: Record<string, string[]> = {
  'skyharbor-air': ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
  skyharbor: ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
  lakeshore: ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
  'lakeshore-holdings': ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
  'lakeshore-industries': ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
};

const INTENT_DIMENSIONS: Record<SemanticRuntimeIntent, string[]> = {
  inventory: [
    'enterprise_context_source',
    'enterprise_context_file',
    'enterprise_context_record',
    'enterprise_context_fact',
    'enterprise_context_chunk',
    'enterprise_context_relationship',
    'private_pattern',
  ],
  process_intelligence: [
    'operational_work_item',
    'operational_event',
    'process_observation',
    'system_service_map',
    'automation_opportunity',
    'human_agent_responsibility',
    'value_estimate',
    'operational_insight',
  ],
  bottlenecks: ['process_observation', 'operational_event', 'operational_work_item'],
  application_friction: ['system_service_map', 'operational_work_item', 'operational_event'],
  value: ['value_estimate', 'benefit_realization', 'spend_contract'],
  readiness: ['move_evidence_slot', 'program_evidence_item'],
  governance: ['risk_governance', 'control_evidence_item', 'program_evidence_item', 'enterprise_context_fact'],
  vendors_finance: ['spend_contract', 'enterprise_context_fact', 'enterprise_context_record', 'program_evidence_item'],
  data_quality: ['enterprise_context_fact', 'enterprise_context_relationship', 'enterprise_context_record', 'enterprise_context_chunk'],
  cross_dimension: [],
  summary: [],
};

const INTENT_LABELS: Record<SemanticRuntimeIntent, string> = {
  inventory: 'loaded-context inventory',
  process_intelligence: 'process-intelligence',
  bottlenecks: 'bottleneck',
  application_friction: 'application-friction',
  value: 'value',
  readiness: 'readiness',
  governance: 'governance and risk',
  vendors_finance: 'vendor and finance',
  data_quality: 'data-quality and lineage',
  cross_dimension: 'cross-dimension',
  summary: 'semantic-context',
};

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function semanticRuntimeTenantKeys(tenantKey: string): string[] {
  const normalized = tenantKey.trim().toLowerCase();
  return SEMANTIC_TENANT_ALIASES[normalized] ?? [normalized];
}

export function inferSemanticRuntimeIntent(question: string): SemanticRuntimeIntent {
  const normalized = question.toLowerCase();
  if (/\b(connect|together|cross[- ]domain|cross[- ]dimension|move to moves|move to source|enough for a decision|expert consultant|single most important caveat)\b/.test(normalized)) return 'cross_dimension';
  if (/\b(data quality|lineage|data[- ]product|owner fields?|data readiness|quality score|quality signal|evidence is incomplete)\b/.test(normalized)) return 'data_quality';
  if (/\b(vendor|spend|contract|run versus change|run vs change|commercial|rate[- ]card|finance|financial|funding|roi)\b/.test(normalized)) return 'vendors_finance';
  if (/\b(governance|risk|control|compliance|human-approved|should not be inferred)\b/.test(normalized)) return 'governance';
  if (/\b(value|savings|benefit|cost|estimate|payback)\b/.test(normalized)) return 'value';
  if (/\b(repetitive|automate|automation|opportunit|process|process intelligence|recurring work|tickets?|events?|workflows?|operational evidence)\b/.test(normalized)) return 'process_intelligence';
  if (/\b(bottlenecks?|handoffs?|wait|queues?|stuck|delay|delays|constraint|constraints)\b/.test(normalized)) return 'bottlenecks';
  if (/\b(apps?|applications?|app portfolio|cmdb|systems?|technology areas?|modernization|friction|noisy|operational signal)\b/.test(normalized)) return 'application_friction';
  if (/\b(readiness|ready|coverage|can answer|answerable|not answerable|missing|gaps?|client load next|client-to-complete|client to complete)\b/.test(normalized)) return 'readiness';
  if (/\b(what data|what do we have|inventory|datasets?|sources?|loaded|volumetric|volume)\b/.test(normalized)) return 'inventory';
  return 'summary';
}

export function shouldUseEnterpriseSemanticLayer(question: string): boolean {
  const normalized = question.toLowerCase();
  return /\b(what data|what do we have|inventory|datasets?|sources?|loaded|volumetric|volume|semantic|evidence readiness|readiness|service now|servicenow|jira|cmdb|tickets?|operational evidence|process intelligence|repetitive|recurring work|bottlenecks?|handoffs?|friction|automate first|automation opportunit|value estimate|rate card)\b/.test(normalized);
}

function pickRowsForIntent(rows: VolumetricRow[], intent: SemanticRuntimeIntent): VolumetricRow[] {
  const dims = INTENT_DIMENSIONS[intent];
  if (dims.length === 0) return rows;
  const filtered = rows.filter((row) => dims.includes(row.dimension_key));
  return filtered.length > 0 ? filtered : rows;
}

function confidenceFrom(readiness: QuestionReadinessRow | null, rows: VolumetricRow[]): SemanticRuntimeAnswer['confidence'] {
  if (readiness?.readiness_status === 'not_answerable') return rows.length > 0 ? 'medium' : 'low';
  if (readiness?.readiness_status === 'needs_clarification') return 'low';
  const readinessConfidence = asNumber(readiness?.confidence_score);
  const total = rows.reduce((sum, row) => sum + asNumber(row.record_count), 0);
  if ((readiness?.readiness_status === 'answerable' && readinessConfidence >= 0.7) || total >= 1000) return 'high';
  if (readiness?.readiness_status === 'partially_answerable' || total > 0) return 'medium';
  return 'low';
}

function rankReadiness(intent: SemanticRuntimeIntent, readinessRows: QuestionReadinessRow[]): QuestionReadinessRow | null {
  if (readinessRows.length === 0) return null;
  const statusRank: Record<QuestionReadinessRow['readiness_status'], number> = {
    answerable: 3,
    partially_answerable: 2,
    needs_clarification: 1,
    not_answerable: 0,
  };
  const intentMatches = readinessRows.filter((row) => row.intent_type === intent || row.question_pattern.toLowerCase().includes(intent.replace('_', ' ')));
  const candidates = intentMatches.length > 0 ? intentMatches : readinessRows;
  return [...candidates].sort((a, b) => {
    const statusDelta = statusRank[b.readiness_status] - statusRank[a.readiness_status];
    if (statusDelta !== 0) return statusDelta;
    return asNumber(b.confidence_score) - asNumber(a.confidence_score);
  })[0] ?? null;
}

function summarizeRows(rows: VolumetricRow[]): string {
  if (rows.length === 0) return 'No semantic volumetric rows are loaded for this tenant yet.';
  const total = rows.reduce((sum, row) => sum + asNumber(row.record_count), 0);
  const dimensions = new Set(rows.map((row) => row.dimension_key)).size;
  const sources = new Set(rows.map((row) => row.source_type)).size;
  const synthetic = rows.some((row) => row.synthetic_demo_flag);
  return `${formatNumber(total)} records are available in the governed semantic layer across ${dimensions} ${dimensions === 1 ? 'dimension' : 'dimensions'} and ${sources} ${sources === 1 ? 'source table' : 'source tables'}${synthetic ? '; synthetic demo evidence is clearly labeled' : ''}.`;
}

function topRows(rows: VolumetricRow[], count = 3): VolumetricRow[] {
  const aggregated = new Map<string, VolumetricRow>();
  for (const row of rows) {
    const key = `${row.dimension_key}:${row.source_type}`;
    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, { ...row });
      continue;
    }
    existing.record_count = asNumber(existing.record_count) + asNumber(row.record_count);
    existing.entity_count = asNumber(existing.entity_count) + asNumber(row.entity_count);
    existing.synthetic_demo_flag = existing.synthetic_demo_flag || row.synthetic_demo_flag;
    existing.finance_validated_flag = existing.finance_validated_flag || row.finance_validated_flag;
    existing.confidence_score = Math.max(asNumber(existing.confidence_score), asNumber(row.confidence_score));
  }
  return [...aggregated.values()].sort((a, b) => asNumber(b.record_count) - asNumber(a.record_count)).slice(0, count);
}

function topEvidencePhrase(rows: VolumetricRow[]): string {
  const top = topRows(rows);
  if (top.length === 0) return 'No leading evidence source is available.';
  return top
    .map((row) => `${humanizeKey(row.dimension_key)} via ${humanizeKey(row.source_type)} (${formatNumber(asNumber(row.record_count))} records)`)
    .join('; ');
}

function missingDataPhrase(readiness: QuestionReadinessRow | null): string {
  const missing = readiness?.missing_data?.filter(Boolean) ?? [];
  if (missing.length === 0) return 'the specific source fields, joins, or client-approved measures needed for this question';
  return missing.map(humanizeKey).join(', ');
}

function buildDirectAnswer(intent: SemanticRuntimeIntent, rows: VolumetricRow[], readiness: QuestionReadinessRow | null): string {
  const summary = summarizeRows(rows);
  const evidence = topEvidencePhrase(rows);
  const label = INTENT_LABELS[intent];
  const status = readiness?.readiness_status;

  if (rows.length === 0) {
    return `I cannot support a ${label} answer yet. The gap is explicit: no semantic volumetric rows are loaded for the tenant, so the client needs to load source records before Ava should synthesize a response.`;
  }

  if (status === 'not_answerable' || status === 'needs_clarification') {
    return `I can show related ${label} evidence, but I would not treat the exact answer as client-ready yet. Evidence available: ${summary} The strongest related sources are ${evidence}. Specific gap: ${missingDataPhrase(readiness)}. Next move: ${readiness?.suggested_next_action ?? 'load or validate the missing fields, then rerun the semantic readiness check before using this in Home, Intelligence, Moves, or Source.'}`;
  }

  if (intent === 'inventory') return `Read: the loaded-context inventory is strong enough for factual lookup. ${summary} Start with ${evidence}; those are the safest citation anchors before moving into narrative synthesis.`;
  if (intent === 'process_intelligence') return `Read: process-intelligence questions should be grounded in work items, operational events, process observations, automation opportunities, human-agent responsibilities, and value estimates. ${summary} Current evidence anchors: ${evidence}. Use this for discovery; keep scale decisions gated until the missing operational joins are closed.`;
  if (intent === 'bottlenecks') return `Read: bottleneck answers should come from process observations, event timing, work-item queues, and handoff evidence. ${summary} Current evidence anchors: ${evidence}. If queue timestamps or source-to-target handoffs are missing, call that a gap instead of inventing a delay pattern.`;
  if (intent === 'application_friction') return `Read: application-friction analysis should connect systems to work items, operational events, ownership, and service impact. ${summary} Current evidence anchors: ${evidence}. This supports evidence review; modernization priority still needs app-to-process and owner joins.`;
  if (intent === 'value') return `Read: value can be discussed only as evidence-backed planning, not a funded business case, unless finance validation exists. ${summary} Current evidence anchors: ${evidence}. Keep realized value, run/change split, and benefit ownership visible as client-to-complete items.`;
  if (intent === 'readiness') return `Read: semantic readiness is ${readiness?.readiness_status ?? 'partially_answerable'}. ${summary} Current evidence anchors: ${evidence}. Client-to-complete: ${readiness?.suggested_next_action ?? missingDataPhrase(readiness)}`;
  if (intent === 'governance') return `Read: governance and risk claims must stay tied to loaded controls, risk evidence, program evidence, and source citations. ${summary} Current evidence anchors: ${evidence}. Do not infer compliance posture where control evidence, owner approval, or audit lineage is missing.`;
  if (intent === 'vendors_finance') return `Read: vendor and finance answers should separate loaded spend/contract evidence from planning estimates. ${summary} Current evidence anchors: ${evidence}. Do not rank vendor risk or make funding claims without run/change split, contract lineage, and finance validation.`;
  if (intent === 'data_quality') return `Read: data-quality and lineage answers should name what is structured, what is searchable, and which owner or lineage fields are missing. ${summary} Current evidence anchors: ${evidence}. Treat missing owner, source-to-target, or quality-score fields as explicit gaps.`;
  if (intent === 'cross_dimension') return `Read: the cross-dimension story should connect systems, data, vendors, operations, and value only where the semantic layer has citations. ${summary} Current evidence anchors: ${evidence}. The consultant-grade answer is to say what is proven, what is related, and which join is still missing before a decision surface uses it.`;
  return `Read: ${summary} Current evidence anchors: ${evidence}. Use the citations and gaps before generating any executive answer.`;
}

function buildCitations(rows: VolumetricRow[]): SemanticRuntimeCitation[] {
  return [...rows]
    .sort((a, b) => asNumber(b.record_count) - asNumber(a.record_count))
    .slice(0, 8)
    .map((row) => ({
      label: `${row.dimension_key} via ${row.source_type}`,
      sourceTable: row.source_type,
      dimensionKey: row.dimension_key,
      recordCount: asNumber(row.record_count),
      syntheticDemo: row.synthetic_demo_flag,
      confidenceScore: row.confidence_score == null ? null : asNumber(row.confidence_score),
    }));
}

function buildFacts(rows: VolumetricRow[], coverageRows: DimensionCoverageRow[]): SemanticRuntimeAnswer['facts'] {
  const total = rows.reduce((sum, row) => sum + asNumber(row.record_count), 0);
  const sources = new Set(rows.map((row) => row.source_type)).size;
  const dimensions = new Set(rows.map((row) => row.dimension_key)).size;
  const syntheticSources = rows.filter((row) => row.synthetic_demo_flag).length;
  const structuredReady = coverageRows.filter((row) => row.queryable_structured).length;
  return [
    { label: 'Semantic record count', value: total, unit: 'records' },
    { label: 'Source tables represented', value: sources, unit: 'tables' },
    { label: 'Dimensions represented', value: dimensions, unit: 'dimensions' },
    { label: 'Structured dimensions queryable', value: structuredReady, unit: 'dimensions' },
    { label: 'Rows marked synthetic demo', value: syntheticSources, unit: 'volumetric rows' },
  ];
}

function buildCaveats(rows: VolumetricRow[], readiness: QuestionReadinessRow | null, coverageRows: DimensionCoverageRow[]): string[] {
  const caveats = new Set<string>();
  if (rows.some((row) => row.synthetic_demo_flag)) caveats.add('Synthetic demo evidence is present and must not be treated as client-approved production truth.');
  if (rows.some((row) => row.dimension_key === 'value_estimate' && !row.finance_validated_flag)) caveats.add('Value/estimate evidence may require finance or client rate-card validation before funding decisions.');
  if (readiness?.caveat_text) caveats.add(readiness.caveat_text);
  for (const row of coverageRows) {
    for (const caveat of row.caveats ?? []) {
      if (caveat) caveats.add(caveat);
    }
  }
  if (caveats.size === 0) caveats.add('Answer is based on structured semantic-layer counts, not raw file payloads.');
  return [...caveats];
}

function clientToComplete(readiness: QuestionReadinessRow | null, coverageRows: DimensionCoverageRow[]): string[] {
  const actions = new Set<string>();
  if (readiness?.suggested_next_action) actions.add(readiness.suggested_next_action);
  for (const row of coverageRows) {
    if (row.recommended_client_action) actions.add(row.recommended_client_action);
  }
  return [...actions].slice(0, 6);
}

export async function answerEnterpriseSemanticQuestionFromAzure(
  input: SemanticRuntimeAskInput,
  deps: SemanticRuntimeDeps = {},
): Promise<SemanticRuntimeAnswer> {
  const read = deps.read ?? azureRead;
  const runtimeModule = input.module ?? 'ava';
  const intent = inferSemanticRuntimeIntent(input.question);
  const tenantKeys = semanticRuntimeTenantKeys(input.tenantKey);
  const primaryTenantKey = tenantKeys[0] ?? input.tenantKey;

  const [volumetrics, coverageRows, readinessRows] = await Promise.all([
    read.query<VolumetricRow>(
      `SELECT tenant_key, source_type, dimension_key, family_key, evidence_type, record_count, entity_count,
              distinct_application_count, distinct_process_count, distinct_vendor_count, distinct_owner_count,
              freshness_status, coverage_status, confidence_score, synthetic_demo_flag, finance_validated_flag, notes
         FROM tenant_data_volumetrics
        WHERE tenant_key = ANY($1::text[])
        ORDER BY record_count DESC, source_type ASC`,
      [tenantKeys],
      { missingTable: 'empty' },
    ),
    read.query<DimensionCoverageRow>(
      `SELECT tenant_key, dimension_key, available, queryable_structured, searchable_unstructured,
              metric_ready, citation_ready, record_count, freshness_status, confidence_score, caveats, recommended_client_action
         FROM tenant_dimension_coverage
        WHERE tenant_key = ANY($1::text[])
        ORDER BY record_count DESC, dimension_key ASC`,
      [tenantKeys],
      { missingTable: 'empty' },
    ),
    read.query<QuestionReadinessRow>(
      `SELECT tenant_key, question_pattern, intent_type, readiness_status, confidence_score,
              missing_data, caveat_text, suggested_next_action
         FROM tenant_question_readiness
        WHERE tenant_key = ANY($1::text[])
        ORDER BY confidence_score DESC NULLS LAST, question_pattern ASC`,
      [tenantKeys],
      { missingTable: 'empty' },
    ),
  ]);

  const selectedRows = pickRowsForIntent(volumetrics, intent);
  const readiness = rankReadiness(intent, readinessRows);
  const readinessStatus = readiness?.readiness_status ?? (selectedRows.length > 0 ? 'partially_answerable' : 'not_answerable');

  return {
    serviceName: 'Enterprise Semantic Question Layer',
    tenantKey: primaryTenantKey,
    question: input.question,
    module: runtimeModule,
    intent,
    directAnswer: buildDirectAnswer(intent, selectedRows, readiness),
    basis: 'Deterministic Azure/Postgres semantic-layer projection: tenant_data_volumetrics, tenant_dimension_coverage, and tenant_question_readiness.',
    facts: buildFacts(selectedRows, coverageRows),
    citations: buildCitations(selectedRows),
    caveats: buildCaveats(selectedRows, readiness, coverageRows),
    clientToComplete: clientToComplete(readiness, coverageRows),
    confidence: confidenceFrom(readiness, selectedRows),
    readinessStatus,
    generatedAt: (deps.now ?? (() => new Date()))().toISOString(),
  };
}

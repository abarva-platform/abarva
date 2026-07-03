import { createDefaultSession, type SessionRunner } from '@/lib/data-plane/read-adapters/azureSession';
import { appClientKeyForTenant, tenantProfileForClientKey } from '@/lib/tenant/aliases';

export interface V7HomeAskInput {
  tenantKey: string;
  tenantDisplayName?: string | null;
  question: string;
  includeTrace?: boolean;
  userId?: string | null;
  session?: SessionRunner;
}

interface V7TopicConfig {
  intent: string;
  primaryDimension: string;
  relatedDimensions: string[];
  tableHeaders: string[];
  tableColumns: string[];
  handoffTarget?: string | null;
  handoffReason?: string;
}

interface V7RunRow {
  tenant_key: string;
  tenant_name: string;
  contract_version: string;
  source_dataset: string;
  row_count: number;
  field_count: number;
  graph_node_count: number;
  relationship_edge_count: number;
  chunk_count: number;
  loaded_at: string;
}

interface V7RecordRow {
  record_name: string | null;
  source_file: string;
  source_row_number: number;
  source_artifact_name: string | null;
  source_validation_status: string | null;
  values_json: Record<string, unknown>;
}

interface V7CitationRow {
  source_file: string;
  count: number;
}

const CONTRACT_VERSION = 'v7.0.0-synthetic-depth-v2-20260703';

const V7_TENANT_BY_APP_CLIENT: Record<string, string> = {
  apexretail: 'apex-retail',
  firstcapital: 'first-capital-financial',
  arcturus: 'first-capital-financial',
  lakeshore: 'lakeshore-industries',
  meridian: 'meridian-health',
  skyharbor: 'skyharbor-air',
};

const TOPICS: Record<string, V7TopicConfig> = {
  loaded_context: topic('loaded_context', 'v7_01_enterprise_profile', ['v7_13_source_evidence_registry'], ['Record', 'Industry/model', 'Priority/context'], ['company_name', 'industry', 'strategic_priorities']),
  business_areas: topic('business_areas', 'v7_02_business_functions', ['v7_03_org_ownership'], ['Business area', 'Executive owner', 'Critical processes'], ['business_function_name', 'executive_owner', 'critical_processes']),
  it_org: topic('it_org', 'v7_03_org_ownership', ['v7_02_business_functions'], ['IT/domain area', 'Leader role', 'Decision rights'], ['org_unit_name', 'role_title', 'decision_rights']),
  apps_systems: topic('apps_systems', 'v7_05_applications_systems', ['v7_18_function_system_data_vendor_bridge', 'v7_06_data_assets_integrations'], ['System', 'Owner', 'Criticality', 'Lifecycle'], ['system_name', 'system_owner', 'criticality', 'lifecycle_status']),
  infrastructure: topic('infrastructure', 'v7_24_infrastructure_cloud_estate', ['v7_05_applications_systems'], ['Platform', 'Hosting', 'Provider', 'Criticality'], ['platform_name', 'hosting_model', 'provider', 'criticality']),
  data_estate: topic('data_estate', 'v7_06_data_assets_integrations', ['v7_05_applications_systems', 'v7_20_chunk_retrieval_registry'], ['Data asset', 'Owner', 'Integration', 'Governance'], ['data_asset_name', 'data_owner', 'integration_type', 'governance_status']),
  relationships: topic('relationships', 'v7_12_relationships_graph_edges', ['v7_21_graph_registry_relationship_dictionary'], ['From', 'Relationship', 'To', 'Strength'], ['from_object_ref', 'relationship_type', 'to_object_ref', 'relationship_strength']),
  vendors_contracts: topic('vendors_contracts', 'v7_07_vendors_contracts', ['v7_08_spend_value'], ['Vendor', 'Service', 'Renewal', 'Contract risk'], ['vendor_name', 'service_category', 'renewal_date', 'contract_risk']),
  budget_spend: topic('budget_spend', 'v7_08_spend_value', ['v7_01_enterprise_profile'], ['Spend record', 'Amount', 'Type', 'Owner'], ['spend_id', 'amount_usd', 'amount_type', 'owner']),
  programs: topic('programs', 'v7_09_programs_initiatives_business_priorities', ['v7_22_operational_evidence_process_intelligence'], ['Program/priority', 'Sponsor', 'Status', 'Value'], ['program_name', 'sponsor', 'status', 'value_hypothesis']),
  ai_footprint: topic('ai_footprint', 'v7_10_ai_initiatives', ['v7_16_expert_lenses'], ['Use case/tool', 'Users', 'Adoption', 'Readiness'], ['use_case', 'licensed_users', 'active_users', 'data_readiness']),
  operations: topic('operations', 'v7_11_operations_risk_controls', ['v7_22_operational_evidence_process_intelligence'], ['Process/control', 'Severity/status', 'Affected systems', 'Impact'], ['process', 'severity', 'affected_systems', 'business_impact']),
  metrics: topic('metrics', 'v7_14_metric_definitions', ['v7_15_industry_market_knowledge_patterns'], ['Metric', 'Definition', 'Owner', 'Cadence'], ['metric_name', 'metric_definition', 'metric_owner', 'cadence']),
  source_trail: topic('source_trail', 'v7_13_source_evidence_registry', ['v7_20_chunk_retrieval_registry'], ['Evidence', 'Type', 'Location', 'Strength'], ['evidence_title', 'evidence_type', 'source_location', 'evidence_confidence']),
  handoff_intelligence: topic('handoff_intelligence', 'v7_16_expert_lenses', ['v7_15_industry_market_knowledge_patterns'], ['Lens', 'Expertise', 'Action', 'Boundary'], ['lens_name', 'expertise_area', 'recommended_actions', 'claim_boundary'], 'intelligence', 'Intelligence owns advisory synthesis and pattern-backed executive recommendations.'),
  handoff_source: topic('handoff_source', 'v7_07_vendors_contracts', ['v7_13_source_evidence_registry'], ['Vendor/evidence', 'Renewal/type', 'Risk', 'Source basis'], ['vendor_name', 'renewal_date', 'contract_risk', 'source_basis'], 'source', 'Source owns sourcing events, vendor evidence, renewal decisions, and partner tradeoffs.'),
  handoff_moves: topic('handoff_moves', 'v7_09_programs_initiatives_business_priorities', ['v7_12_relationships_graph_edges'], ['Program', 'Phase/status', 'Owner', 'Move relevance'], ['program_name', 'phase', 'owner', 'move_relevance'], 'moves', 'Moves owns governed change framing, ownership, sequencing, and mobilization.'),
  handoff_tower: topic('handoff_tower', 'v7_10_ai_initiatives', ['v7_08_spend_value'], ['Use case', 'Readiness', 'Value', 'Decision'], ['use_case', 'data_readiness', 'measured_value_usd', 'scale_hold_stop'], 'tower', 'Tower owns portfolio execution, spend, adoption, readiness, and value tracking.'),
};

const defaultSession = createDefaultSession('home-v7-know-ask');

export async function answerHomeKnowFromV7(input: V7HomeAskInput) {
  const appClientKey = appClientKeyForTenant(input.tenantKey) ?? 'apexretail';
  const profile = tenantProfileForClientKey(appClientKey);
  const tenantKey = V7_TENANT_BY_APP_CLIENT[profile.appClientKey];
  if (!tenantKey) throw new Error(`No V7 tenant mapping for ${input.tenantKey}.`);

  const question = input.question.trim();
  const topicKey = classifyQuestion(question);
  const config = TOPICS[topicKey] ?? TOPICS.loaded_context;
  const session = input.session ?? defaultSession;

  return session(async (run) => {
    await run("select set_config('app.tenant_key', $1, false)", [tenantKey]);

    const runs = await run<V7RunRow>(
      `select tenant_key, tenant_name, contract_version, source_dataset, row_count::int, field_count::int,
        graph_node_count::int, relationship_edge_count::int, chunk_count::int, loaded_at::text
       from intelligence_v7.tenant_pack_runs
       where tenant_key = $1 and contract_version = $2 and load_status in ('loaded', 'validated')
       order by loaded_at desc limit 1`,
      [tenantKey, CONTRACT_VERSION],
    );
    const runRow = runs[0];
    if (!runRow) throw new Error(`V7 pack is not loaded for ${tenantKey}.`);

    const rows = await run<V7RecordRow>(
      `select record_name, source_file, source_row_number::int, source_artifact_name, source_validation_status, values_json
       from intelligence_v7.business_records
       where tenant_key = $1 and contract_version = $2 and dimension_key = $3
       order by source_row_number asc
       limit 12`,
      [tenantKey, CONTRACT_VERSION, config.primaryDimension],
    );
    const citations = await run<V7CitationRow>(
      `select source_file, count(*)::int as count
       from intelligence_v7.business_records
       where tenant_key = $1 and contract_version = $2 and dimension_key = $3
       group by source_file
       order by source_file`,
      [tenantKey, CONTRACT_VERSION, config.primaryDimension],
    );

    const gaps = buildGaps(rows);
    const table = buildTable(rows, config);
    const displayName = runRow.tenant_name || input.tenantDisplayName || profile.displayName;
    const paragraphs = buildParagraphs({
      displayName,
      run: runRow,
      config,
      topicKey,
      rows,
      gaps,
    });
    const answer = {
      mode: 'home_know',
      answerSource: 'v7_dataset_contract',
      directAnswer: paragraphs.join('\n\n'),
      answerParagraphs: paragraphs,
      artifactPlan: table ? ['prose', 'table'] : ['prose'],
      citations: citations.map((citation) => ({
        label: citation.source_file,
        sourceKey: 'intelligence_v7.business_records',
        count: citation.count,
      })),
      gaps,
      table,
      branchOptions: config.relatedDimensions.map((dimensionKey) => ({
        label: humanize(dimensionKey),
        summary: `Inspect the related V7 ${humanize(dimensionKey).toLowerCase()} records and graph links.`,
        dimensionKey,
      })),
      followUpQuestion: 'Which V7 dimension should aVa inspect next?',
      answerBoundary: {
        canAnswer: [
          'Answer from intelligence_v7 business records, source lineage, graph edges, and registered field facts.',
          'Show loaded facts, explicit gaps, source files, readiness, and handoff boundaries.',
        ],
        cannotAnswer: [
          'Borrow facts from V4/V5/V6 or retired semantic layers.',
          'Show raw internal row IDs, chunk IDs, or synthetic flags in the executive answer.',
          'Let Claude add unsupported amounts, leaders, systems, vendors, or statuses.',
        ],
        handoffTarget: config.handoffTarget ?? null,
        handoffReason: config.handoffReason,
      },
      primaryDimension: config.primaryDimension,
      relatedDimensions: config.relatedDimensions,
      sourceFamiliesIncluded: [config.primaryDimension],
    };

    const result = {
      ok: true,
      endpoint: '/api/home/know/ask',
      tenant: {
        appClientKey: profile.appClientKey,
        canonicalKey: profile.canonicalKey,
        displayName,
        datasetDir: runRow.source_dataset,
      },
      user: { signedIn: Boolean(input.userId) },
      answer,
      proof: {
        source: 'v7_azure_schema',
        oldSemanticLayersSunset: true,
        semantic2Loaded: false,
        dossierAttached: false,
        composerUsed: 'home-v7-dataset-answer',
        fallbackUsed: false,
        model: 'deterministic-v7-contract',
        auditId: `home-v7-${profile.appClientKey}-${topicKey}-${hash(question).slice(0, 8)}`,
        promptVersion: 'home-v7-dataset-contract-v1',
        answerPromptVersion: 'home-v7-dataset-contract-v1',
        datasetDir: runRow.source_dataset,
        generatedAt: runRow.loaded_at,
        questionIntent: config.intent,
        selectedFiles: [config.primaryDimension],
        selectedRows: rows.length,
        selectedFacts: countFacts(rows),
        gapCount: gaps.length,
        citationCount: citations.length,
        qualityGate: visibleQualityGate(answer.directAnswer),
        answerSource: {
          answerSource: 'v7_dataset_contract',
          claudeInvoked: false,
          claudeSelected: false,
          fallbackUsed: false,
          fallbackReason: null,
          hardValidationFailures: [],
          softValidationWarnings: [],
          sanitizerChanges: [],
          rawClaudePreserved: false,
        },
      },
    };

    if (!input.includeTrace) return result;
    return {
      ...result,
      trace: {
        traceVersion: 'home-v7-answer-trace-v1',
        route: '/api/home/know/ask',
        surface: 'home',
        timestamp: new Date().toISOString(),
        session: {
          tenant: result.tenant,
          user: input.userId ? { signedIn: true, id: input.userId } : { signedIn: false },
          question,
        },
        router: {
          selectedEndpoint: '/api/home/know/ask',
          surface: 'home',
          intent: config.intent,
          primaryDimension: config.primaryDimension,
          secondaryDimensions: config.relatedDimensions,
          answerMode: 'home_v7_dataset',
          fallbackEligibility: true,
        },
        evidenceSelection: {
          selectedDatasetDir: runRow.source_dataset,
          selectedFiles: [config.primaryDimension],
          selectedFacts: rows.slice(0, 20).map((row) => row.values_json),
          selectedGaps: gaps,
          selectedCitations: citations,
          artifactPlan: answer.artifactPlan,
        },
        modelCall: {
          provider: 'none',
          model: 'deterministic-v7-contract',
          promptVersion: 'home-v7-dataset-contract-v1',
          finalPrompt: [
            'Answer from intelligence_v7 only.',
            `Tenant: ${tenantKey}`,
            `Dimension: ${config.primaryDimension}`,
            `Question: ${question}`,
          ].join('\n'),
          rawResponse: null,
          fallbackUsed: false,
          fallbackReason: null,
        },
        apiPayload: { ok: true, endpoint: '/api/home/know/ask', answer },
      },
    };
  });
}

function topic(intent: string, primaryDimension: string, relatedDimensions: string[], tableHeaders: string[], tableColumns: string[], handoffTarget?: string | null, handoffReason?: string): V7TopicConfig {
  return { intent, primaryDimension, relatedDimensions, tableHeaders, tableColumns, handoffTarget, handoffReason };
}

function classifyQuestion(question: string): keyof typeof TOPICS {
  const q = question.toLowerCase();
  if (/business areas|business functions|available business|organization structure/.test(q)) return 'business_areas';
  if (/technology leaders|it organization|it org|structured today|roles|accountability/.test(q)) return 'it_org';
  if (/application|core systems|systems context|apps|erp|sap|mainframe/.test(q)) return 'apps_systems';
  if (/infrastructure|cloud|data center|network|hosting|aws|azure/.test(q)) return 'infrastructure';
  if (/data|analytics|teradata|tableau|lake|databricks/.test(q) && !/data-thin|thin/.test(q)) return 'data_estate';
  if (/relationship|graph|connect|dependency/.test(q)) return 'relationships';
  if (/vendor|contract/.test(q) && /source|sourcing/.test(q)) return 'handoff_source';
  if (/vendor|contract/.test(q)) return 'vendors_contracts';
  if (/budget|spend|financial|cost/.test(q)) return 'budget_spend';
  if (/priority|program|initiative|project|transformation/.test(q) && /moves|move/.test(q)) return 'handoff_moves';
  if (/priority|program|initiative|project|transformation/.test(q)) return 'programs';
  if (/ai|automation|agent|copilot/.test(q) && /tower|scale|hold|stop/.test(q)) return 'handoff_tower';
  if (/ai|automation|agent|copilot/.test(q)) return 'ai_footprint';
  if (/operations|service management|risk|control|reliability/.test(q)) return 'operations';
  if (/metric|kpi|outcome/.test(q)) return 'metrics';
  if (/source trail|citation|citation basis|evidence/.test(q)) return 'source_trail';
  if (/intelligence/.test(q) && /hand|instead|advis/.test(q)) return 'handoff_intelligence';
  return 'loaded_context';
}

function buildTable(rows: V7RecordRow[], config: V7TopicConfig) {
  const selected = rows.slice(0, 8);
  if (!selected.length) return null;
  return {
    headers: config.tableHeaders,
    rows: selected.map((row) => config.tableColumns.map((column) => display(row.values_json[column]))),
  };
}

function buildGaps(rows: V7RecordRow[]) {
  const gaps = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.values_json)) {
      const text = String(value ?? '').toLowerCase();
      if (text.includes('needs evidence') || text.includes('data_thin')) {
        gaps.set(key, (gaps.get(key) ?? 0) + 1);
      }
    }
  }
  return [...gaps.entries()].slice(0, 6).map(([label, count]) => ({
    label: humanize(label),
    impact: `${count} loaded V7 ${count === 1 ? 'record needs' : 'records need'} stronger client evidence for this field.`,
    remediation: `Confirm ${humanize(label).toLowerCase()} from the client source owner or source file.`,
  }));
}

function buildParagraphs(args: {
  displayName: string;
  run: V7RunRow;
  config: V7TopicConfig;
  topicKey: string;
  rows: V7RecordRow[];
  gaps: Array<{ label: string; impact: string }>;
}) {
  const samples = args.rows
    .map((row) => display(row.record_name) || display(firstMeaningfulValue(row.values_json)))
    .filter((value) => value !== 'Needs evidence')
    .slice(0, 6);
  const dimensionLabel = humanize(args.config.primaryDimension).toLowerCase();
  const sampleSentence = samples.length
    ? `${args.displayName}'s loaded ${dimensionLabel} context shows ${joinList(samples)}.`
    : `${args.displayName}'s loaded ${dimensionLabel} context is present, but the preview rows need stronger client-readable names.`;
  return [
    `${sampleSentence} Home can use this as current-state evidence while keeping source confidence and validation boundaries visible.`,
    `Behind this view, the governed context pack includes ${formatNumber(args.run.row_count)} business records, ${formatNumber(args.run.field_count)} field facts, ${formatNumber(args.run.graph_node_count)} graph nodes, ${formatNumber(args.run.relationship_edge_count)} graph edges, and ${formatNumber(args.run.chunk_count)} retrieval chunks.`,
    args.config.handoffTarget
      ? `${surfaceName(args.config.handoffTarget)} should take over when the user wants decisions, recommendations, or execution moves; Home should stay focused on loaded facts and evidence boundaries.`
      : args.gaps[0]
        ? `Important evidence gap: ${args.gaps[0].label}. ${args.gaps[0].impact}`
        : 'No explicit evidence gap appears in the selected preview records, but client validation is still required before board-grade use.',
  ];
}

function visibleQualityGate(text: string) {
  const issues: string[] = [];
  if (/intelligence_v7\.record_fields|record_key|chunk_key|source_row_number|values_json/i.test(text)) issues.push('raw_internal_marker');
  if (/\bv7_\d+_/i.test(text)) issues.push('raw_dimension_key');
  if (/semantic2|enterprise_context_|datasets\//i.test(text)) issues.push('stale_layer_marker');
  return { passed: issues.length === 0, issues, visibleAnswerContract: { passed: issues.length === 0, issues } };
}

function countFacts(rows: V7RecordRow[]): number {
  return rows.reduce((sum, row) => sum + Object.values(row.values_json).filter((value) => display(value) !== 'Needs evidence').length, 0);
}

function firstMeaningfulValue(record: Record<string, unknown>): string {
  for (const [key, value] of Object.entries(record)) {
    if (/id|tenant|created|updated|source|flag/i.test(key)) continue;
    const displayed = display(value);
    if (displayed !== 'Needs evidence') return displayed;
  }
  return '';
}

function display(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text || /^data_thin:/i.test(text) || /^needs evidence$/i.test(text)) return 'Needs evidence';
  if (/^(synthetic_demo|v4_synthetic_pack|static_snapshot|confidential)$/i.test(text)) return 'Needs evidence';
  return text.replace(/_/g, ' ').replace(/\|/g, ', ').replace(/\s+/g, ' ').trim();
}

function humanize(value: string): string {
  return value.replace(/^v7_\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function joinList(values: string[]): string {
  const clean = values.filter(Boolean).slice(0, 8);
  if (!clean.length) return 'no evidence-ready values in the selected V7 rows';
  if (clean.length === 1) return clean[0]!;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function surfaceName(value: string): string {
  if (value === 'source') return 'Source';
  if (value === 'tower') return 'Tower';
  if (value === 'moves') return 'Moves';
  if (value === 'intelligence') return 'Intelligence';
  return value;
}

function hash(value: string): string {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (Math.imul(31, result) + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result).toString(16);
}

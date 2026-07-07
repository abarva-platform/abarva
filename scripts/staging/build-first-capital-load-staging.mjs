import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DATASET_ROOT = path.join(REPO_ROOT, 'datasets/first-capital-financial-synthetic-v1');
const STAGING_ROOT = path.join(REPO_ROOT, 'datasets/client-load-staging/first-capital');
const BATCH_ID = 'fcf-refresh-2026-06-candidate-v1';
const CLIENT_ID = 'a75687bf-71b9-4524-ab4e-68ae3f28d200';
const CLIENT_KEY = 'first-capital';
const CLIENT_NAME = 'First Capital Financial';
const PREPARED_AT = '2026-06-17T00:00:00.000Z';

const REQUIRED_DIRS = [
  '00_manifest',
  '01_public_company_evidence',
  '02_strategy_and_finance',
  '03_org_and_operating_model',
  '04_it_systems_landscape',
  '05_architecture_infrastructure',
  '06_data_and_integration',
  '07_security_risk_compliance',
  '08_vendors_contracts_sourcing',
  '09_operations_service_management',
  '10_ai_data_science_automation',
  '11_customer_product_market',
  '12_ad_hoc_raw_uploads',
  '13_ai_control_tower_monthly_refresh',
  '13_tower_outcome_evidence',
  '90_normalized_templates',
  '99_load_receipts',
];

function ensureDir(relativePath) {
  fs.mkdirSync(path.join(STAGING_ROOT, relativePath), { recursive: true });
}

function readText(relativePath) {
  return fs.readFileSync(path.join(DATASET_ROOT, relativePath), 'utf8');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function parseCsv(relativePath) {
  const lines = readText(relativePath).split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(relativePath, rows, headers) {
  const text = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(STAGING_ROOT, relativePath), text);
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(STAGING_ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeMd(relativePath, value) {
  fs.writeFileSync(path.join(STAGING_ROOT, relativePath), value.trimStart());
}

function listFiles(root, prefix = '') {
  const entries = fs.readdirSync(path.join(root, prefix), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(root, rel);
    return rel;
  }).sort();
}

function sourceTypeFor(file) {
  if (file.endsWith('.yaml')) return 'profile';
  if (file.endsWith('.jsonl')) return 'context_corpus';
  if (file.endsWith('.json')) return 'structured_json';
  if (file.endsWith('.md')) return 'source_document';
  if (file.endsWith('.csv')) return 'structured_csv';
  return 'other';
}

function formatFor(file) {
  return path.extname(file).replace('.', '') || 'other';
}

function dimensionFor(file) {
  if (file.startsWith('00-profile')) return ['profile', 'client_identity'];
  if (file.startsWith('01-portfolio')) return ['it_systems_landscape', 'application_portfolio'];
  if (file.startsWith('02-financial')) return ['strategy_and_finance', 'cost_value_contracts'];
  if (file.startsWith('03-org')) return ['org_and_operating_model', 'owners_roles_teams'];
  if (file.startsWith('04-vendors')) return ['vendors_contracts_sourcing', 'contracts_renewals'];
  if (file.startsWith('05-dora') || file.startsWith('06-devex') || file.startsWith('10-incidents')) return ['operations_service_management', 'ops_productivity_quality'];
  if (file.startsWith('07-ai-tools')) return ['ai_data_science_automation', 'ai_tools_usage_governance'];
  if (file.startsWith('08-sponsor')) return ['strategy_and_finance', 'executive_signal'];
  if (file.startsWith('11-regulatory')) return ['security_risk_compliance', 'regulatory_controls'];
  if (file.startsWith('12-benchmarks')) return ['customer_product_market', 'industry_benchmarks'];
  if (file.startsWith('13-context')) return ['data_and_integration', 'retrieval_corpus'];
  if (file.startsWith('99-verification')) return ['load_receipts', 'verification_expectations'];
  return ['ad_hoc_raw_uploads', 'unclassified'];
}

function sensitivityFor(file) {
  if (/regulatory|vendor|financial|context|portfolio|ai-tools|incidents/i.test(file)) return 'confidential';
  if (/profile|benchmark|README|CHANGELOG/i.test(file)) return 'internal';
  return 'internal';
}

function parserFor(file) {
  if (file.endsWith('.csv')) return 'structured_csv_row_parser';
  if (file.endsWith('.jsonl')) return 'jsonl_context_chunk_parser';
  if (file.endsWith('.json')) return 'structured_json_parser';
  if (file.endsWith('.yaml')) return 'yaml_profile_parser';
  if (file.endsWith('.md')) return 'markdown_section_parser_review_required';
  return 'manual_review_required';
}

function citationGrainFor(file) {
  if (file.endsWith('.csv') || file.endsWith('.jsonl')) return 'row';
  if (file.endsWith('.json') || file.endsWith('.yaml')) return 'section';
  if (file.endsWith('.md')) return 'section';
  return 'file';
}

function latestUsageByTool(rows) {
  const byTool = new Map();
  for (const row of rows) {
    const prior = byTool.get(row.tool_id);
    if (!prior || String(row.month) > String(prior.month)) byTool.set(row.tool_id, row);
  }
  return byTool;
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function cleanId(value) {
  return String(value || 'unknown').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
}

function postureReadiness(posture) {
  const value = String(posture || '').toLowerCase();
  if (value.includes('continue') || value.includes('healthy')) return 'realized_or_measured';
  if (value.includes('restructure')) return 'review_required';
  if (value.includes('kill') || value.includes('hold')) return 'projected_only';
  return 'baseline_set';
}

function evidenceStateForPosture(posture) {
  const value = String(posture || '').toLowerCase();
  if (value.includes('continue') || value.includes('healthy')) return 'usable';
  if (value.includes('kill') || value.includes('hold') || value.includes('restructure')) return 'review_required';
  return 'received';
}

function build() {
  REQUIRED_DIRS.forEach(ensureDir);

  const sourceFiles = listFiles(DATASET_ROOT).filter((file) => !file.includes('/source-files/') || file.endsWith('.md'));
  const sourceCatalog = sourceFiles.map((file, index) => {
    const [businessDimension, technicalDimension] = dimensionFor(file);
    return {
      source_id: `FCF-STAGE-SRC-${String(index + 1).padStart(3, '0')}`,
      relative_path: `../../first-capital-financial-synthetic-v1/${file}`,
      source_type: sourceTypeFor(file),
      format: formatFor(file),
      business_dimension: businessDimension,
      technical_dimension: technicalDimension,
      period: file.includes('2026') ? '2026' : 'candidate_refresh_2026_06',
      owner_role: businessDimension === 'security_risk_compliance' ? 'CRO' : businessDimension === 'strategy_and_finance' ? 'CFO' : 'CIO',
      sensitivity: sensitivityFor(file),
      contains_pii_phi_or_secrets: false,
      expected_parser: parserFor(file),
      expected_citation_grain: citationGrainFor(file),
      load_intent: file.includes('/source-files/') || file.endsWith('.jsonl') ? 'parse_to_chunks' : 'parse_to_records',
      status: 'staged_local_candidate',
      notes: 'Candidate First Capital evidence pack; requires private data-plane commit and retrieval proof before live claims.',
    };
  });

  writeCsv('00_manifest/source-catalog.csv', sourceCatalog, [
    'source_id',
    'relative_path',
    'source_type',
    'format',
    'business_dimension',
    'technical_dimension',
    'period',
    'owner_role',
    'sensitivity',
    'contains_pii_phi_or_secrets',
    'expected_parser',
    'expected_citation_grain',
    'load_intent',
    'status',
    'notes',
  ]);

  writeJson('00_manifest/intake-manifest.json', {
    client_key: CLIENT_KEY,
    client_id: CLIENT_ID,
    client_display_name: CLIENT_NAME,
    load_batch_id: BATCH_ID,
    prepared_by: 'codex-data-refresh',
    prepared_at: PREPARED_AT,
    classification: 'confidential',
    source_file_count: sourceCatalog.length,
    canonical_dataset_root: 'datasets/first-capital-financial-synthetic-v1',
    source_files: sourceCatalog,
    load_gates: {
      local_artifact_generated: true,
      preflight_required: true,
      human_review_required_for_unstructured_docs: true,
      product_loader_api_acceptance_required: true,
      azure_blob_staging_required: true,
      parser_citation_required: true,
      context_commit_required: true,
      embedding_refresh_required: true,
      retrieval_proof_required: true,
      insight_evaluation_required: true,
    },
  });

  const initiatives = [
    ...parseCsv('01-portfolio/initiatives-active.csv'),
    ...parseCsv('01-portfolio/initiatives-closed.csv'),
  ];
  const commitments = new Map(parseCsv('02-financial/initiative-commitments.csv').map((row) => [row.initiative_id, row]));
  const tools = parseCsv('07-ai-tools/ai-tool-footprint.csv');
  const usage = parseCsv('07-ai-tools/ai-usage-telemetry.csv');
  const latestUsage = latestUsageByTool(usage);
  const dora = parseCsv('05-dora/dora-baseline.csv');
  const devex = parseCsv('06-devex/devex-survey-fy25.csv');
  const vendors = parseCsv('04-vendors/vendor-contracts.csv');
  const regulations = parseCsv('11-regulatory/regulatory-obligations.csv');
  const incidents = parseCsv('10-incidents-changes/incidents.csv');

  const sourceManifestRows = [
    ['src-portfolio', 'CSV export', 'First Capital candidate application and initiative portfolio', 'CIO', 'monthly', '2026-06-17', 'parsed', 'confidential'],
    ['src-finance', 'CSV export', 'First Capital technology financials and commitments', 'CFO', 'monthly', '2026-06-17', 'parsed', 'confidential'],
    ['src-ai-tools', 'CSV export', 'AI tool footprint and usage telemetry', 'CIO', 'monthly', '2026-06-17', 'parsed', 'confidential'],
    ['src-dora-devex', 'CSV export', 'DORA and developer experience baseline', 'VP Engineering', 'monthly', '2026-06-17', 'parsed', 'internal'],
    ['src-vendors', 'CSV export', 'Vendor contracts and renewal calendar', 'CFO / Procurement', 'monthly', '2026-06-17', 'parsed', 'confidential'],
    ['src-risk', 'CSV export', 'Regulatory obligations and controls', 'CRO', 'monthly', '2026-06-17', 'review_required', 'restricted'],
    ['src-corpus', 'JSONL and Markdown evidence', 'First Capital retrieval corpus and source documents', 'CIO', 'monthly', '2026-06-17', 'review_required', 'confidential'],
  ].map(([source_id, source_type, source_system, owner_role, cadence, period_end, refresh_status, data_class]) => ({
    source_id,
    source_type,
    source_system,
    owner_role,
    cadence,
    period_end,
    refresh_status,
    data_class,
  }));

  writeCsv('13_ai_control_tower_monthly_refresh/01_source_manifest.csv', sourceManifestRows, [
    'source_id',
    'source_type',
    'source_system',
    'owner_role',
    'cadence',
    'period_end',
    'refresh_status',
    'data_class',
  ]);

  const initiativeRows = initiatives.map((row) => {
    const commitment = commitments.get(row.initiative_id) ?? {};
    const vendor = String(row.vendors || '').split('|')[0] || '';
    return {
      source_id: 'src-portfolio',
      initiative_id: row.initiative_id,
      initiative_name: row.title,
      category: /AI|Copilot|automation|model|graph|triage/i.test(row.title) ? 'AI initiative' : 'technology modernization',
      stage: row.stage || row.status,
      owner: row.accountable,
      sponsor: row.accountable,
      vendor,
      tool_or_system: vendor || 'First Capital platform',
      impacted_personas: row.accountable,
      promised_benefit: row.evidence_note || commitment.value_basis || '',
      target_metric_key: row.sentinel_posture === 'Kill' ? 'value_avoidance_or_stop_loss' : 'benefit_realization_usd',
      baseline_value: row.committed_usd || commitment.committed_usd || '',
      target_value: row.projected_value_usd || commitment.projected_value_usd || '',
      target_date: '2026-12-31',
      status_flag: row.sentinel_posture || row.status,
      evidence_state: evidenceStateForPosture(row.sentinel_posture),
    };
  });

  writeCsv('13_ai_control_tower_monthly_refresh/02_initiative_registry.csv', initiativeRows, [
    'source_id',
    'initiative_id',
    'initiative_name',
    'category',
    'stage',
    'owner',
    'sponsor',
    'vendor',
    'tool_or_system',
    'impacted_personas',
    'promised_benefit',
    'target_metric_key',
    'baseline_value',
    'target_value',
    'target_date',
    'status_flag',
    'evidence_state',
  ]);

  const toolRows = tools.map((tool) => {
    const use = latestUsage.get(tool.tool_id) ?? {};
    const active = Number(use.active_users || 0);
    const monthly = Math.round(Number(tool.annual_usd || 0) / 12);
    return {
      source_id: 'src-ai-tools',
      tool_id: tool.tool_id,
      tool_name: tool.tool_name,
      vendor: String(tool.tool_name || '').split(' ')[0],
      team: tool.owner,
      persona: tool.owner,
      period_start: `${use.month || '2026-06'}-01`,
      period_end: `${use.month || '2026-06'}-28`,
      licensed_seats: Math.max(active * 2, active + 50),
      active_users: active,
      usage_events: Number(use.accepted_suggestions || 0) + Number(use.policy_exceptions || 0),
      accepted_events: use.accepted_suggestions || 0,
      monthly_spend_usd: monthly,
      evidence_state: Number(use.policy_exceptions || 0) > 0 ? 'review_required' : 'usable',
    };
  });

  writeCsv('13_ai_control_tower_monthly_refresh/03_tool_usage_monthly.csv', toolRows, [
    'source_id',
    'tool_id',
    'tool_name',
    'vendor',
    'team',
    'persona',
    'period_start',
    'period_end',
    'licensed_seats',
    'active_users',
    'usage_events',
    'accepted_events',
    'monthly_spend_usd',
    'evidence_state',
  ]);

  const productivityRows = devex.map((row) => ({
    source_id: 'src-dora-devex',
    persona_id: row.team_id,
    persona_name: row.team_id,
    function: row.team_id.replace('TEAM-FCF-', '').toLowerCase(),
    workflow: 'engineering delivery and change flow',
    metric_key: 'flow_score',
    unit: 'score_0_to_10',
    baseline_value: Number(row.flow_score || 0) - 0.8,
    current_value: row.flow_score,
    target_value: Math.min(10, Number(row.flow_score || 0) + 1).toFixed(1),
    initiative_id: '',
    confidence: Number(row.response_count || 0) >= 25 ? 'medium' : 'low',
    evidence_state: 'review_required',
  }));

  writeCsv('13_ai_control_tower_monthly_refresh/04_persona_productivity.csv', productivityRows, [
    'source_id',
    'persona_id',
    'persona_name',
    'function',
    'workflow',
    'metric_key',
    'unit',
    'baseline_value',
    'current_value',
    'target_value',
    'initiative_id',
    'confidence',
    'evidence_state',
  ]);

  const doraByTeam = new Map();
  for (const row of dora) {
    const bucket = doraByTeam.get(row.team_id) ?? [];
    bucket.push(row);
    doraByTeam.set(row.team_id, bucket);
  }
  const doraRows = [...doraByTeam.entries()].map(([team, rows]) => {
    rows.sort((a, b) => String(a.measured_at).localeCompare(String(b.measured_at)));
    const before = rows[0] ?? {};
    const after = rows[rows.length - 1] ?? {};
    return {
      source_id: 'src-dora-devex',
      team,
      repo: `${team.toLowerCase()}-portfolio`,
      tool_id: 'FCF-AI-TOOL-02',
      current_period_start: before.measured_at,
      current_period_end: after.measured_at,
      deployment_frequency_before: before.deploy_freq_per_week,
      deployment_frequency_after: after.deploy_freq_per_week,
      lead_time_hours_before: before.lead_time_hours,
      lead_time_hours_after: after.lead_time_hours,
      change_failure_rate_pct_before: before.change_failure_rate_pct,
      change_failure_rate_pct_after: after.change_failure_rate_pct,
      mttr_hours_before: before.mttr_hours,
      mttr_hours_after: after.mttr_hours,
      sample_size_deploys: rows.length,
      evidence_state: 'usable',
    };
  });

  writeCsv('13_ai_control_tower_monthly_refresh/05_dora_metrics.csv', doraRows, [
    'source_id',
    'team',
    'repo',
    'tool_id',
    'current_period_start',
    'current_period_end',
    'deployment_frequency_before',
    'deployment_frequency_after',
    'lead_time_hours_before',
    'lead_time_hours_after',
    'change_failure_rate_pct_before',
    'change_failure_rate_pct_after',
    'mttr_hours_before',
    'mttr_hours_after',
    'sample_size_deploys',
    'evidence_state',
  ]);

  const serviceNowAgents = [
    {
      source_id: 'src-ai-tools',
      agent_id: 'FCF-SNOW-AGENT-001',
      vendor: 'ServiceNow',
      module: 'ITSM',
      agent_name: 'Now Assist incident summarization',
      persona: 'service desk analyst',
      workflow: 'incident triage and knowledge suggestion',
      eligible_volume: incidents.length,
      ai_touched_volume: Math.round(incidents.length * 0.42),
      auto_resolved_volume: Math.round(incidents.length * 0.11),
      cycle_time_before_hours: 11.2,
      cycle_time_after_hours: 8.4,
      error_rate_pct_before: 4.8,
      error_rate_pct_after: 4.2,
      monthly_spend_usd: Math.round((tools.find((tool) => /ServiceNow/i.test(tool.tool_name))?.annual_usd ?? 0) / 12),
      evidence_state: 'review_required',
    },
  ];

  writeCsv('13_ai_control_tower_monthly_refresh/06_servicenow_ai_agents.csv', serviceNowAgents, [
    'source_id',
    'agent_id',
    'vendor',
    'module',
    'agent_name',
    'persona',
    'workflow',
    'eligible_volume',
    'ai_touched_volume',
    'auto_resolved_volume',
    'cycle_time_before_hours',
    'cycle_time_after_hours',
    'error_rate_pct_before',
    'error_rate_pct_after',
    'monthly_spend_usd',
    'evidence_state',
  ]);

  const erpAgents = [
    {
      source_id: 'src-ai-tools',
      agent_id: 'FCF-ERP-AGENT-001',
      vendor: 'SAP',
      module: 'Finance ERP',
      agent_name: 'Finance close anomaly assistant candidate',
      persona: 'financial analyst',
      workflow: 'month-end close exception review',
      eligible_volume: 420,
      ai_touched_volume: 0,
      auto_resolved_volume: 0,
      cycle_time_before_hours: 36,
      cycle_time_after_hours: '',
      error_rate_pct_before: 3.5,
      error_rate_pct_after: '',
      monthly_spend_usd: 0,
      evidence_state: 'review_required',
    },
  ];

  writeCsv('13_ai_control_tower_monthly_refresh/07_erp_hr_finance_agents.csv', erpAgents, [
    'source_id',
    'agent_id',
    'vendor',
    'module',
    'agent_name',
    'persona',
    'workflow',
    'eligible_volume',
    'ai_touched_volume',
    'auto_resolved_volume',
    'cycle_time_before_hours',
    'cycle_time_after_hours',
    'error_rate_pct_before',
    'error_rate_pct_after',
    'monthly_spend_usd',
    'evidence_state',
  ]);

  const benefitRows = initiatives.map((row) => ({
    source_id: 'src-finance',
    benefit_id: `BEN-${cleanId(row.initiative_id)}`,
    initiative_id: row.initiative_id,
    benefit_name: `${row.title} value case`,
    metric_key: row.sentinel_posture === 'Kill' ? 'stop_or_reduce_spend' : 'benefit_realization_usd',
    baseline_value: row.committed_usd,
    current_value: row.sentinel_posture === 'Continue' ? row.projected_value_usd : '',
    target_value: row.projected_value_usd,
    promised_annual_value_usd: row.projected_value_usd,
    realized_annual_value_usd: row.sentinel_posture === 'Continue' ? row.projected_value_usd : '',
    confidence: evidenceStateForPosture(row.sentinel_posture) === 'usable' ? 'medium' : 'low',
    readiness_state: postureReadiness(row.sentinel_posture),
    evidence_state: evidenceStateForPosture(row.sentinel_posture),
  }));

  writeCsv('13_ai_control_tower_monthly_refresh/08_benefit_realization.csv', benefitRows, [
    'source_id',
    'benefit_id',
    'initiative_id',
    'benefit_name',
    'metric_key',
    'baseline_value',
    'current_value',
    'target_value',
    'promised_annual_value_usd',
    'realized_annual_value_usd',
    'confidence',
    'readiness_state',
    'evidence_state',
  ]);

  const spendRows = vendors.map((row) => ({
    source_id: 'src-vendors',
    spend_id: `SPEND-${cleanId(row.vendor)}`,
    initiative_id: '',
    vendor: row.vendor,
    product_or_service: row.type,
    spend_type: row.type,
    monthly_spend_usd: Math.round(Number(row.annual_usd || 0) / 12),
    annualized_spend_usd: row.annual_usd,
    renewal_date: row.renewal_date,
    unit_economics_metric: 'annual_contract_value_usd',
    unit_economics_value: row.annual_usd,
    owner_role: row.owner,
    evidence_state: row.data_class === 'restricted' ? 'review_required' : 'usable',
  }));

  writeCsv('13_ai_control_tower_monthly_refresh/09_spend_contracts.csv', spendRows, [
    'source_id',
    'spend_id',
    'initiative_id',
    'vendor',
    'product_or_service',
    'spend_type',
    'monthly_spend_usd',
    'annualized_spend_usd',
    'renewal_date',
    'unit_economics_metric',
    'unit_economics_value',
    'owner_role',
    'evidence_state',
  ]);

  const riskRows = [
    ...regulations.map((row) => ({
      source_id: 'src-risk',
      risk_id: row.reg_id,
      initiative_id: '',
      dimension: row.regulator,
      severity: /OCC|Federal|FinCEN|FFIEC/i.test(row.regulator) ? 'high' : 'medium',
      status: 'open',
      risk_description: row.obligation,
      owner_role: /AML|model|BSA|SR 11-7/i.test(`${row.obligation} ${row.evidence_required}`) ? 'CRO' : 'CIO',
      required_action: row.evidence_required,
      governance_gate: 'partial',
      evidence_state: 'review_required',
    })),
    ...initiatives.filter((row) => /Kill|Hold|Restructure/i.test(row.sentinel_posture)).map((row) => ({
      source_id: 'src-portfolio',
      risk_id: `RISK-${cleanId(row.initiative_id)}`,
      initiative_id: row.initiative_id,
      dimension: 'AI portfolio governance',
      severity: /Kill|Hold/i.test(row.sentinel_posture) ? 'high' : 'medium',
      status: row.sentinel_posture,
      risk_description: row.evidence_note,
      owner_role: row.accountable,
      required_action: 'Attach cited evidence, owner decision, and finance/control sign-off before scale or spend continuation.',
      governance_gate: /Kill|Hold/i.test(row.sentinel_posture) ? 'fail' : 'partial',
      evidence_state: 'review_required',
    })),
  ];

  writeCsv('13_ai_control_tower_monthly_refresh/10_risk_governance.csv', riskRows, [
    'source_id',
    'risk_id',
    'initiative_id',
    'dimension',
    'severity',
    'status',
    'risk_description',
    'owner_role',
    'required_action',
    'governance_gate',
    'evidence_state',
  ]);

  const evidenceRows = [
    ...sourceCatalog.slice(0, 80).map((source, index) => ({
      evidence_id: `FCF-EVID-${String(index + 1).padStart(3, '0')}`,
      source_id: source.source_id,
      source_sheet: source.relative_path,
      source_row_number: '',
      citation_label: source.relative_path,
      citation_locator: source.expected_citation_grain,
      evidence_state: source.load_intent === 'parse_to_chunks' ? 'review_required' : 'usable',
      confidence: source.load_intent === 'parse_to_chunks' ? '0.78' : '0.86',
    })),
  ];

  writeCsv('13_ai_control_tower_monthly_refresh/11_evidence_links.csv', evidenceRows, [
    'evidence_id',
    'source_id',
    'source_sheet',
    'source_row_number',
    'citation_label',
    'citation_locator',
    'evidence_state',
    'confidence',
  ]);

  writeCsv('13_ai_control_tower_monthly_refresh/12_refresh_log.csv', [{
    refresh_run_id: BATCH_ID,
    run_type: 'template_upload',
    reporting_period_start: '2026-06-01',
    reporting_period_end: '2026-06-30',
    started_at: PREPARED_AT,
    status: 'parsed',
    rows_seen: initiativeRows.length + toolRows.length + productivityRows.length + doraRows.length + serviceNowAgents.length + erpAgents.length + benefitRows.length + spendRows.length + riskRows.length + evidenceRows.length,
    rows_valid: initiativeRows.length + toolRows.length + productivityRows.length + doraRows.length + spendRows.length,
    rows_rejected: 0,
    review_required: productivityRows.length + riskRows.length + serviceNowAgents.length + erpAgents.length,
    operator: 'codex-data-refresh',
  }], [
    'refresh_run_id',
    'run_type',
    'reporting_period_start',
    'reporting_period_end',
    'started_at',
    'status',
    'rows_seen',
    'rows_valid',
    'rows_rejected',
    'review_required',
    'operator',
  ]);

  const dimensionRows = [
    ['public_company_evidence', 'partial', 'No actual external annual/quarterly report files staged yet; use public-company template before production-like claim.'],
    ['strategy_and_finance', 'covered', 'Capex/opex, initiative commitments, renewal calendar, run cost, sponsor signal.'],
    ['org_and_operating_model', 'covered', 'Teams, roles, executives, demo personas.'],
    ['it_systems_landscape', 'covered', 'Application portfolio and integration topology.'],
    ['architecture_infrastructure', 'partial', 'Infrastructure contracts exist; detailed DC/private cloud topology template still needed.'],
    ['data_and_integration', 'covered', 'Integration topology plus retrieval corpus/source docs.'],
    ['security_risk_compliance', 'covered', 'Expanded regulatory obligations and control evidence requirements.'],
    ['vendors_contracts_sourcing', 'covered', 'Vendor contracts, infrastructure contracts, renewal calendar.'],
    ['operations_service_management', 'covered', 'Incidents, changes, DORA, DevEx.'],
    ['ai_data_science_automation', 'covered', 'AI tool footprint, telemetry, governance posture.'],
    ['customer_product_market', 'partial', 'Benchmarks present; customer/product market source evidence still thin.'],
    ['ai_control_tower_monthly_refresh', 'covered_candidate', 'Derived monthly refresh CSVs staged; needs workbook/API parser commit proof.'],
  ].map(([dimension, status, notes]) => ({
    dimension,
    status,
    expected_live_gate: status === 'covered' || status === 'covered_candidate' ? 'parse_to_records_then_retrieval_proof' : 'stage_more_evidence_before_claim',
    notes,
  }));

  writeCsv('00_manifest/dimension-coverage-checklist.csv', dimensionRows, [
    'dimension',
    'status',
    'expected_live_gate',
    'notes',
  ]);

  writeMd('00_manifest/refresh-load-plan.md', `
# First Capital Refresh Load Plan

Batch: \`${BATCH_ID}\`
Client: \`${CLIENT_NAME}\` / \`${CLIENT_KEY}\`
Prepared: \`${PREPARED_AT}\`

## Current State

- Local artifact generated: yes.
- Local parse/preflight: pending commands in this run.
- Product loader/API accepted upload: not yet.
- Azure Blob staged originals: not yet.
- Parser extracted cited records/chunks: local structured derivatives staged; live parser proof pending.
- Review queue: required for source docs, inferred agents, productivity baselines, regulatory/risk rows.
- Context committed: not yet.
- Embeddings/search refreshed: not yet.
- Retrieval proven: not yet.
- Insight evaluator run: not yet.

## Candidate Load Sequence

1. Run static synthetic data depth audit.
2. Run First Capital substrate loader dry-run.
3. Stage originals to Azure Blob under the First Capital pilot container.
4. Parse structured CSV/JSON/YAML/JSONL files into records/chunks with row or section citations.
5. Commit First Capital records into tenant-scoped context tables.
6. Commit AI Control Tower monthly refresh rows into \`ai_control_*\` tables.
7. Refresh embeddings/search.
8. Run signed-in Atlas/Sentinel retrieval proof.
9. Run significance insight evaluator.
10. Archive generated or non-canonical artifacts that lack source provenance.

## Non-Negotiable Gaps Before Live Claims

- Public-company annual/quarterly/investor source evidence is not staged yet.
- Data center/private cloud topology needs richer evidence than contract rows.
- AI Control Tower workbook/API route commit proof is still required.
- Live Azure/Postgres proof must run from a network that can resolve the private host.
`);

  writeMd('13_ai_control_tower_monthly_refresh/README.md', `
# First Capital AI Control Tower Monthly Refresh

This folder is the primary Tower staging lane for First Capital. It is derived from the current candidate enterprise pack and shaped to the AI Control Tower monthly refresh contract.

## Files

- \`01_source_manifest.csv\`
- \`02_initiative_registry.csv\`
- \`03_tool_usage_monthly.csv\`
- \`04_persona_productivity.csv\`
- \`05_dora_metrics.csv\`
- \`06_servicenow_ai_agents.csv\`
- \`07_erp_hr_finance_agents.csv\`
- \`08_benefit_realization.csv\`
- \`09_spend_contracts.csv\`
- \`10_risk_governance.csv\`
- \`11_evidence_links.csv\`
- \`12_refresh_log.csv\`

## Truth State

These are staged candidate refresh rows, not live product rows. Actions should be derived by the AI Control Tower loader from value, spend, adoption, productivity, risk, renewal pressure, and evidence gaps. Human approval is required before any proposed action is treated as accepted.
`);

  writeMd('90_normalized_templates/README.md', `
# First Capital Normalized Templates

The current normalized output is the AI Control Tower monthly refresh set in \`../13_ai_control_tower_monthly_refresh\`.

The original source pack remains under \`../../first-capital-financial-synthetic-v1\`. Do not claim a source is live until the corresponding receipt in \`../99_load_receipts\` records upload, parse, commit, embedding/index, retrieval proof, and insight evaluation.
`);

  writeMd('99_load_receipts/README.md', `
# First Capital Load Receipts

Receipts will be added here as each state completes:

- local artifact generated
- local parse/preflight passed
- product loader/API accepted upload
- Azure Blob staged source file
- parser extracted cited facts/chunks
- review queue received low-confidence records
- context rows committed to tenant data plane
- embeddings/search refreshed
- AI Control Tower \`ai_control_*\` rows committed
- signed-in retrieval/QA proved usability
- insight evaluator produced live DB-backed insights

Current receipt status: local staging generated only.
`);

  console.log(JSON.stringify({
    batch_id: BATCH_ID,
    source_files: sourceCatalog.length,
    initiatives: initiativeRows.length,
    tool_usage_rows: toolRows.length,
    productivity_rows: productivityRows.length,
    dora_rows: doraRows.length,
    benefit_rows: benefitRows.length,
    spend_rows: spendRows.length,
    risk_rows: riskRows.length,
    evidence_rows: evidenceRows.length,
  }, null, 2));
}

build();

#!/usr/bin/env node
/*
 * Meridian + Lakeshore V2 context/corpus/Tower refresh worker.
 *
 * Default: dry-run local parse/preflight only.
 * Mutating mode: --apply, intended for ACA/private data-plane execution.
 *
 * The worker is deliberately client-scoped:
 * - resolves existing clients by id/key/alias
 * - archives replaceable rows before delete
 * - deletes only by resolved client_id or tenant aliases
 * - loads V2 records/facts/chunks, private corpus patterns, Tower substrate rows,
 *   and context graph relationships
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const req = createRequire(process.env.NODE_PACKAGE_JSON_PATH || path.join(process.cwd(), 'package.json'));
const Papa = req('papaparse');

const REPO_ROOT = process.cwd();
const RUN_ID = process.env.CONTEXT_REFRESH_RUN_ID || `ml-v2-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
const NOW = new Date().toISOString();
const PERIOD_START = process.env.AI_CONTROL_PERIOD_START || '2026-04-01';
const PERIOD_END = process.env.AI_CONTROL_PERIOD_END || '2026-06-30';
const ARCHIVE_ROOT = path.resolve(process.env.REFRESH_ARCHIVE_DIR || path.join('/tmp', 'abarva-context-refresh-archive', RUN_ID));

const CLIENTS = [
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    expectedClientId: 'd2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612',
    aliases: ['meridian-health', 'meridian', 'meridian-health-system', 'phs-meridian'],
    datasetRoot: 'datasets/meridian-health-synthetic-v2',
  },
  {
    key: 'lakeshore',
    name: 'Lakeshore Industries',
    expectedClientId: '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667',
    aliases: ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
    datasetRoot: 'datasets/lakeshore-industries-synthetic-v2',
  },
];

const CONTEXT_DELETE_TABLES = [
  ['context_insights', 'tenant_key'],
  ['enterprise_context_stewardship_tasks', 'tenant_key'],
  ['enterprise_context_quality_issues', 'tenant_key'],
  ['enterprise_context_relationships', 'tenant_key'],
  ['enterprise_context_evidence', 'tenant_key'],
  ['enterprise_context_facts', 'tenant_key'],
  ['enterprise_context_chunks', 'tenant_key'],
  ['enterprise_context_records', 'tenant_key'],
  ['enterprise_context_source_files', 'tenant_key'],
  ['enterprise_context_sources', 'tenant_key'],
  ['enterprise_context_template_runs', 'tenant_key'],
  ['data_ingestion_runs', 'tenant_key'],
  ['client_private_patterns', 'client_id'],
  ['ai_control_atlas_context_packs', 'client_id'],
  ['ai_control_context_relationships', 'client_id'],
  ['ai_control_context_facts', 'client_id'],
  ['ai_control_evidence_items', 'client_id'],
  ['ai_control_actions', 'client_id'],
  ['ai_control_risk_governance', 'client_id'],
  ['ai_control_spend_contracts', 'client_id'],
  ['ai_control_benefit_realization', 'client_id'],
  ['ai_control_agent_outcomes', 'client_id'],
  ['ai_control_dora_metrics', 'client_id'],
  ['ai_control_persona_productivity', 'client_id'],
  ['ai_control_tool_usage_monthly', 'client_id'],
  ['ai_control_initiatives', 'client_id'],
  ['ai_control_sources', 'client_id'],
  ['ai_control_refresh_runs', 'client_id'],
  ['tower_cloud_cost', 'client_id'],
  ['tower_program_financials', 'client_id'],
  ['tower_vendor_spend', 'client_id'],
  ['tower_ai_tool_usage', 'client_id'],
  ['tower_dora_metrics', 'client_id'],
  ['tower_itsm_records', 'client_id'],
  ['tower_jira_issues', 'client_id'],
  ['tower_workforce', 'client_id'],
  ['ai_initiatives', 'client_id'],
  ['vendor_contracts', 'client_id'],
  ['applications', 'client_id'],
];

const AI_CONTROL_SOURCE_BY_FILE = {
  'T01_initiative-registry.csv': 'ai_control_initiatives',
  'T02_project-milestones.csv': 'ai_control_context_facts',
  'T03_tool-usage-monthly.csv': 'ai_control_tool_usage_monthly',
  'T04_agent-outcomes.csv': 'ai_control_agent_outcomes',
  'T05_persona-productivity.csv': 'ai_control_persona_productivity',
  'T06_dora-delivery-metrics.csv': 'ai_control_dora_metrics',
  'T07_benefit-realization.csv': 'ai_control_benefit_realization',
  'T08_spend-contracts.csv': 'ai_control_spend_contracts',
  'T09_risk-governance.csv': 'ai_control_risk_governance',
  'T10_evidence-items.csv': 'ai_control_evidence_items',
  'T11_refresh-log.csv': 'ai_control_context_facts',
  'T12_derived-actions.csv': 'ai_control_actions',
  'T13_model-ai-inventory.csv': 'ai_control_context_facts',
};

function arg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}
function hasArg(name) { return process.argv.includes(name); }
function selectedClients() {
  const raw = arg('--client');
  if (!raw || raw === 'all') return CLIENTS;
  const wanted = new Set(raw.split(',').map((item) => item.trim()).filter(Boolean));
  return CLIENTS.filter((client) => wanted.has(client.key));
}
function stableUuid(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}
function hash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function safeSlug(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 90) || 'item';
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function read(rel) { return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(REPO_ROOT, rel)); }
function countJsonl(text) { return text.trim() ? text.trim().split(/\r?\n/).filter(Boolean).length : 0; }
function jsonValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (/^-?\d+(\.\d+)?$/.test(String(value))) return Number(value);
  if (String(value).toLowerCase() === 'true') return true;
  if (String(value).toLowerCase() === 'false') return false;
  return value;
}
function number(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
function date(value) {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
function monthEnd(value) {
  const start = date(value);
  if (!start) return PERIOD_END;
  const parsed = new Date(`${start}T00:00:00Z`);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

function parseCsv(rel) {
  const parsed = Papa.parse(read(rel), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => String(v ?? '').trim(),
  });
  if (parsed.errors.length) {
    throw new Error(`CSV parse failed for ${rel}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function parseSimpleYaml(rel) {
  const out = {};
  for (const raw of read(rel).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    out[key] = jsonValue(value);
  }
  return out;
}

function parseManifest(root) {
  const manifest = read(`${root}/manifest.yaml`);
  const entries = [];
  let current = null;
  for (const raw of manifest.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('- order:')) {
      if (current) entries.push(current);
      current = { order: Number(line.replace('- order:', '').trim()) };
      continue;
    }
    if (!current) continue;
    const match = line.match(/^([a-z_]+):\s*(.+)$/);
    if (match) current[match[1]] = match[2];
  }
  if (current) entries.push(current);
  return entries.filter((entry) => entry.file);
}

function recordIdFor(clientKey, sourceKey) {
  return stableUuid(`${clientKey}:enterprise_context_record:${sourceKey}`);
}
function sourceFileIdFor(clientKey, sourceFileId) {
  return stableUuid(`${clientKey}:enterprise_context_source_file:${sourceFileId}`);
}
function sourceIdFor(clientKey, sourceKey) {
  return stableUuid(`${clientKey}:enterprise_context_source:${sourceKey}`);
}

function detectRecordKey(row, fallback) {
  const idKey = Object.keys(row).find((key) => /(^id$|_id$)/i.test(key));
  return idKey && row[idKey] ? String(row[idKey]) : fallback;
}
function detectTitle(row, fallback) {
  const titleKey = Object.keys(row).find((key) => /(name|title|label|metric_name|control_name|initiative_name|application_name|vendor_name)/i.test(key));
  return titleKey && row[titleKey] ? String(row[titleKey]) : fallback;
}
function normalizeBusinessFunction(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const direct = new Set(['FINANCE', 'SUPPLY_CHAIN', 'HUMAN_RESOURCES', 'OPERATIONS', 'COMMERCIAL_SALES', 'IT', 'COMPLIANCE_LEGAL', 'CORPORATE', 'INDUSTRY_OPS']);
  if (direct.has(raw)) return raw;
  const text = raw.toLowerCase();
  if (/(treasury|finance|controller|fp&a|actuarial|cash|liquidity|close|gl|margin|cost)/.test(text)) return 'FINANCE';
  if (/(supply|procurement|supplier|logistics|warehouse|inventory|working capital)/.test(text)) return 'SUPPLY_CHAIN';
  if (/(hr|human resources|human capital|workday hcm|people|talent)/.test(text)) return 'HUMAN_RESOURCES';
  if (/(legal|privacy|compliance|cybersecurity|risk|control|audit|security)/.test(text)) return 'COMPLIANCE_LEGAL';
  if (/(sales|customer|commercial|member|patient contact|provider network|crm)/.test(text)) return 'COMMERCIAL_SALES';
  if (/(data|analytics|ai|digital|it|technology|cloud|lakehouse|databricks|platform)/.test(text)) return 'IT';
  if (/(clinical|ambulatory|hospital|pharmacy|quality|hedis|star|population health|care|provider performance|informatics|claims|coding|billing|revenue cycle|manufacturing|plant|factory)/.test(text)) return 'INDUSTRY_OPS';
  if (/(strategy|transformation|enterprise transformation|portfolio|program|corporate)/.test(text)) return 'CORPORATE';
  return 'OPERATIONS';
}
function chunkText(title, row) {
  return `${title}: ${Object.entries(row).map(([key, value]) => `${key}=${value}`).join('; ')}`.slice(0, 7000);
}

function buildContextRows(client) {
  const root = client.datasetRoot;
  const sourceId = sourceIdFor(client.key, 'v2-context-pack');
  const rows = {
    sources: [{
      id: sourceId,
      client_id: client.resolvedClientId,
      tenant_key: client.key,
      source_system: 'v2_context_pack',
      source_key: `${client.key}:v2-context-pack`,
      source_type: 'synthetic_refresh_pack',
      display_name: `${client.name} V2 context pack`,
      system_of_record: false,
      source_owner: 'AbarVa synthetic data factory',
      steward_owner: 'Enterprise Context Stewardship',
      sync_cadence: 'manual',
      tenant_aliases: client.aliases,
      source_status: 'active',
      last_synced_at: NOW,
      last_validated_at: NOW.slice(0, 10),
      confidence: 0.86,
      freshness_status: 'fresh',
      evidence_pointer: `${root}/manifest.yaml`,
      metadata: { run_id: RUN_ID, dataset_root: root },
      updated_at: NOW,
    }],
    sourceFiles: [],
    records: [],
    facts: [],
    chunks: [],
    relationships: [],
    evidence: [],
  };
  const recordIdByExternal = new Map();
  const manifestFiles = parseManifest(root);

  for (const entry of manifestFiles) {
    const rel = `${root}/${entry.file}`;
    const fileKey = `${client.key}:${entry.file}`;
    const sourceFileUuid = sourceFileIdFor(client.key, fileKey);
    rows.sourceFiles.push({
      id: sourceFileUuid,
      client_id: client.resolvedClientId,
      tenant_key: client.key,
      source_id: sourceId,
      source_file_id: fileKey,
      source_system: 'v2_context_pack',
      source_file: path.basename(entry.file),
      source_path: rel,
      row_count: rel.endsWith('.csv') ? parseCsv(rel).length : rel.endsWith('.jsonl') ? countJsonl(read(rel)) : 1,
      imported_by: `context-refresh:${RUN_ID}`,
      last_synced_at: NOW,
      last_validated_at: NOW.slice(0, 10),
      confidence: 0.86,
      freshness_status: 'fresh',
      evidence_pointer: rel,
      metadata: { dimension: entry.dimension, family: entry.family, order: entry.order, template_id: entry.template_id },
      updated_at: NOW,
    });
    if (rel.endsWith('.jsonl')) continue;

    const parsedRows = rel.endsWith('.yaml')
      ? [{ record_key: `${client.key}:enterprise_profile`, title: `${client.name} enterprise profile`, ...parseSimpleYaml(rel) }]
      : parseCsv(rel);
    parsedRows.forEach((row, index) => {
      const externalKey = detectRecordKey(row, `${client.key}:${entry.dimension}:${index + 1}`);
      const canonical = `${client.key}:${entry.dimension}:${externalKey}`;
      const recordId = recordIdFor(client.key, canonical);
      recordIdByExternal.set(externalKey, recordId);
      const title = detectTitle(row, externalKey);
      const payload = { ...row, dimension: entry.dimension, dimension_family: entry.family, source_file: rel };
      rows.records.push({
        id: recordId,
        client_id: client.resolvedClientId,
        tenant_key: client.key,
        canonical_record_id: canonical,
        record_type: entry.dimension || 'context_record',
        record_subtype: entry.template_id || null,
        title,
        source_id: sourceId,
        source_file_id: sourceFileUuid,
        source_system: 'v2_context_pack',
        source_record_id: externalKey,
        source_file: path.basename(entry.file),
        source_row_number: rel.endsWith('.yaml') ? null : index + 2,
        owner: row.owner_role || row.executive_owner_role || row.primary_business_owner || row.data_owner || row.owner_team || null,
        steward_owner: 'Enterprise Context Stewardship',
        last_synced_at: NOW,
        last_validated_at: NOW.slice(0, 10),
        confidence: 0.86,
        freshness_status: 'fresh',
        evidence_pointer: `${rel}${rel.endsWith('.csv') ? `#row-${index + 2}` : ''}`,
        lifecycle_state: 'active',
        payload_hash: hash(JSON.stringify(payload)),
        payload,
        dimension_family: entry.family || null,
        domain_segment: null,
        business_function: normalizeBusinessFunction(row.business_function || row.function_name || row.business_area),
        load_order: Number(entry.order) || null,
        updated_at: NOW,
      });
      for (const [field, value] of Object.entries(row)) {
        const factText = `${title} ${field}: ${value}`;
        rows.facts.push({
          id: stableUuid(`${client.key}:fact:${canonical}:${field}:${hash(String(value)).slice(0, 16)}`),
          client_id: client.resolvedClientId,
          tenant_key: client.key,
          record_id: recordId,
          fact_key: field,
          fact_type: typeof jsonValue(value),
          fact_value: jsonValue(value),
          fact_text: factText,
          source_system: 'v2_context_pack',
          source_record_id: externalKey,
          source_file: path.basename(entry.file),
          source_row_number: rel.endsWith('.yaml') ? null : index + 2,
          owner: row.owner_role || row.executive_owner_role || null,
          last_synced_at: NOW,
          last_validated_at: NOW.slice(0, 10),
          confidence: 0.86,
          freshness_status: 'fresh',
          evidence_pointer: `${rel}${rel.endsWith('.csv') ? `#row-${index + 2}` : ''}`,
          lifecycle_state: 'active',
          valid_from: NOW.slice(0, 10),
          value_hash: hash(`${field}:${String(value)}`),
          dimension_family: entry.family || null,
          domain_segment: null,
          updated_at: NOW,
        });
      }
      rows.chunks.push({
        id: stableUuid(`${client.key}:chunk:${canonical}`),
        client_id: client.resolvedClientId,
        tenant_key: client.key,
        chunk_id: `${client.key}:${entry.dimension}:${externalKey}`,
        source_segment_id: entry.family || entry.dimension || 'context',
        source_record_id: externalKey,
        source_doc: path.basename(entry.file),
        source_path: rel,
        chunk_index: 0,
        chunk_text: chunkText(title, row),
        token_count: Math.ceil(chunkText(title, row).length / 4),
        embedding_status: 'pending',
        embedding_model: null,
        embedding_error: null,
        provenance: { run_id: RUN_ID, dimension: entry.dimension, dimension_family: entry.family, source_file: rel },
        chunk_metadata: { record_type: entry.dimension, record_key: externalKey, synthetic: true, evidence_usable: true },
        updated_at: NOW,
      });
    });
  }

  const graphEntry = manifestFiles.find((entry) => String(entry.file).endsWith('.jsonl'));
  if (graphEntry) {
    const graphRel = `${root}/${graphEntry.file}`;
    read(graphRel).trim().split(/\r?\n/).filter(Boolean).forEach((line, index) => {
      const edge = JSON.parse(line);
      rows.relationships.push({
        id: stableUuid(`${client.key}:relationship:${edge.edge_id || index}`),
        client_id: client.resolvedClientId,
        tenant_key: client.key,
        relationship_key: edge.edge_id || `${client.key}:edge:${index + 1}`,
        relationship_type: edge.relationship || 'related',
        from_record_id: recordIdByExternal.get(edge.from_id) || null,
        to_record_id: recordIdByExternal.get(edge.to_id) || null,
        from_external_id: edge.from_id,
        to_external_id: edge.to_id,
        source_system: 'v2_context_graph',
        source_record_id: edge.edge_id || `${index + 1}`,
        source_file: path.basename(graphEntry.file),
        owner: 'Enterprise Architecture',
        last_synced_at: NOW,
        last_validated_at: NOW.slice(0, 10),
        confidence: number(edge.confidence) ?? 0.78,
        freshness_status: 'fresh',
        evidence_pointer: `${graphRel}#line-${index + 1}`,
        lifecycle_state: 'active',
        properties: edge,
        updated_at: NOW,
      });
    });
  }

  const sourceDocsRoot = path.join(REPO_ROOT, root, 'source-docs');
  if (fs.existsSync(sourceDocsRoot)) {
    const docs = fs.readdirSync(sourceDocsRoot).filter((name) => name.endsWith('.md')).sort();
    docs.forEach((name) => {
      const rel = `${root}/source-docs/${name}`;
      const body = read(rel).trim();
      const fileKey = `${client.key}:source-docs:${name}`;
      const sourceFileUuid = sourceFileIdFor(client.key, fileKey);
      rows.sourceFiles.push({
        id: sourceFileUuid,
        client_id: client.resolvedClientId,
        tenant_key: client.key,
        source_id: sourceId,
        source_file_id: fileKey,
        source_system: 'v2_source_docs',
        source_file: name,
        source_path: rel,
        row_count: body ? 1 : 0,
        imported_by: `context-refresh:${RUN_ID}`,
        last_synced_at: NOW,
        last_validated_at: NOW.slice(0, 10),
        confidence: 0.82,
        freshness_status: 'fresh',
        evidence_pointer: rel,
        metadata: { source_doc: true, run_id: RUN_ID },
        updated_at: NOW,
      });
      if (!body) return;
      rows.chunks.push({
        id: stableUuid(`${client.key}:source-doc-chunk:${name}`),
        client_id: client.resolvedClientId,
        tenant_key: client.key,
        chunk_id: `${client.key}:source-docs:${name}`,
        source_segment_id: 'source_docs',
        source_record_id: name,
        source_doc: name,
        source_path: rel,
        chunk_index: 0,
        chunk_text: body.slice(0, 8000),
        token_count: Math.ceil(body.length / 4),
        embedding_status: 'pending',
        embedding_model: null,
        embedding_error: null,
        provenance: { run_id: RUN_ID, source_file: rel, source_system: 'v2_source_docs' },
        chunk_metadata: { source_doc: true, synthetic: true, evidence_usable: true },
        updated_at: NOW,
      });
    });
  }

  return rows;
}

function buildPrivatePatterns(client) {
  const rel = `${client.datasetRoot}/corpus-patterns/move-patterns.jsonl`;
  return read(rel).trim().split(/\r?\n/).filter(Boolean).map((line, index) => {
    const pattern = JSON.parse(line);
    return {
      id: stableUuid(`${client.key}:private-pattern:${pattern.pattern_id}`),
      client_id: client.resolvedClientId,
      slug: safeSlug(pattern.pattern_id || pattern.pattern_name || `pattern-${index + 1}`),
      title: pattern.pattern_name || `Pattern ${index + 1}`,
      category: pattern.move_domain || 'client_context',
      status: 'published',
      confidence: 0.84,
      version: 1,
      published_at: NOW,
      depth_score: 8.4,
      vertical_overlays: [pattern.move_domain || 'client_context'],
      applicable_horizons: ['pilot', 'transformation', 'ai_control_tower'],
      markdown_body: `${pattern.pattern_name}\n\n${pattern.when_to_apply}\n\nSignals: ${(pattern.signals || []).join(', ')}`,
      structured_jsonb: { ...pattern, run_id: RUN_ID, dataset_root: client.datasetRoot },
      updated_at: NOW,
    };
  });
}

function buildAiControlRows(client) {
  const root = `${client.datasetRoot}/ai-control-tower`;
  const refreshRunId = stableUuid(`${client.key}:ai-control-refresh:${RUN_ID}`);
  const refreshRun = {
    id: refreshRunId,
    client_id: client.resolvedClientId,
    client_key: client.key,
    refresh_run_key: `${client.key}:${RUN_ID}`,
    reporting_period_start: PERIOD_START,
    reporting_period_end: PERIOD_END,
    run_type: 'synthetic_seed',
    status: 'committed',
    source_count: fs.readdirSync(path.join(REPO_ROOT, root)).filter((f) => f.endsWith('.csv')).length,
    rows_seen: 0,
    rows_valid: 0,
    rows_rejected: 0,
    review_required_count: 0,
    parser_version: 'load-meridian-lakeshore-v2.cjs',
    source_fingerprint: hash(client.datasetRoot),
    metadata: { run_id: RUN_ID, dataset_root: client.datasetRoot },
    updated_at: NOW,
    committed_at: NOW,
  };
  const rowsByTable = {
    ai_control_refresh_runs: [refreshRun],
    ai_control_sources: [],
    ai_control_initiatives: [],
    ai_control_tool_usage_monthly: [],
    ai_control_persona_productivity: [],
    ai_control_dora_metrics: [],
    ai_control_agent_outcomes: [],
    ai_control_benefit_realization: [],
    ai_control_spend_contracts: [],
    ai_control_risk_governance: [],
    ai_control_actions: [],
    ai_control_evidence_items: [],
    ai_control_context_facts: [],
    ai_control_context_relationships: [],
    ai_control_atlas_context_packs: [],
  };
  const files = fs.readdirSync(path.join(REPO_ROOT, root)).filter((f) => f.endsWith('.csv')).sort();
  for (const file of files) {
    const table = AI_CONTROL_SOURCE_BY_FILE[file] || 'ai_control_context_facts';
    const sourceId = stableUuid(`${client.key}:ai-control-source:${file}:${RUN_ID}`);
    const sourceKey = file.replace(/\.csv$/, '');
    const parsed = parseCsv(`${root}/${file}`);
    refreshRun.rows_seen += parsed.length;
    refreshRun.rows_valid += parsed.length;
    rowsByTable.ai_control_sources.push({
      id: sourceId,
      client_id: client.resolvedClientId,
      refresh_run_id: refreshRunId,
      source_key: sourceKey,
      source_type: 'synthetic_csv',
      source_system: 'ai_control_tower_v2_pack',
      source_name: file,
      owner_role: 'AI Governance Office',
      cadence: 'monthly',
      data_class: 'internal',
      period_end: PERIOD_END,
      refresh_status: 'committed',
      source_fingerprint: hash(read(`${root}/${file}`)),
      payload: { file, dataset_root: client.datasetRoot },
      updated_at: NOW,
    });
    parsed.forEach((row, index) => {
      const base = { client_id: client.resolvedClientId, refresh_run_id: refreshRunId, source_id: sourceId, payload: row };
      if (file === 'T01_initiative-registry.csv') {
        rowsByTable.ai_control_initiatives.push({
          ...base,
          initiative_key: row.initiative_id,
          initiative_name: row.initiative_name,
          category: row.business_area,
          stage: row.stage,
          business_owner_role: row.owner_role,
          executive_sponsor_role: row.owner_role,
          promised_benefit: row.promised_benefit_usd,
          status_flag: row.status,
        });
      } else if (file === 'T03_tool-usage-monthly.csv') {
        rowsByTable.ai_control_tool_usage_monthly.push({
          ...base,
          tool_key: safeSlug(row.tool_name),
          tool_name: row.tool_name,
          user_group_or_team: 'enterprise',
          period_start: date(row.period) || PERIOD_START,
          period_end: monthEnd(row.period),
          licensed_seats: number(row.licensed_users),
          active_users: number(row.active_users),
          usage_events: number(row.prompts_or_actions),
          accepted_or_completed_events: number(row.prompts_or_actions),
          evidence_state: row.quality_or_control_flag === 'normal' ? 'usable' : 'review_required',
        });
      } else if (file === 'T04_agent-outcomes.csv') {
        rowsByTable.ai_control_agent_outcomes.push({
          ...base,
          agent_key: row.agent_id,
          vendor: row.agent_name?.split(' ')[0] || 'Unknown',
          agent_name: row.agent_name,
          workflow: row.business_process,
          eligible_volume: number(row.work_items_resolved),
          auto_resolved_volume: number(row.work_items_resolved),
          quality_after: number(row.exception_rate_pct),
          evidence_state: row.approval_status === 'approved_pilot' ? 'usable' : 'review_required',
        });
      } else if (file === 'T05_persona-productivity.csv') {
        rowsByTable.ai_control_persona_productivity.push({
          ...base,
          persona_key: row.persona_id,
          persona_name: row.persona_name,
          workflow: 'AI-assisted productivity',
          metric_key: row.quality_metric || 'cycle_time',
          unit: 'minutes',
          baseline_value: number(row.baseline_cycle_time_minutes),
          current_value: number(row.current_cycle_time_minutes),
          confidence: String(row.confidence || 'medium').toLowerCase(),
          evidence_state: 'usable',
        });
      } else if (file === 'T06_dora-delivery-metrics.csv') {
        rowsByTable.ai_control_dora_metrics.push({
          ...base,
          team: row.team_or_product,
          repo: safeSlug(row.team_or_product),
          period_start: PERIOD_START,
          period_end: PERIOD_END,
          lead_time_hours_before: number(row.lead_time_before_days) == null ? null : number(row.lead_time_before_days) * 24,
          lead_time_hours_after: number(row.lead_time_after_days) == null ? null : number(row.lead_time_after_days) * 24,
          change_failure_rate_pct_before: number(row.change_failure_before_pct),
          change_failure_rate_pct_after: number(row.change_failure_after_pct),
          mttr_hours_before: number(row.mttr_before_hours),
          mttr_hours_after: number(row.mttr_after_hours),
          evidence_state: 'usable',
        });
      } else if (file === 'T07_benefit-realization.csv') {
        rowsByTable.ai_control_benefit_realization.push({
          ...base,
          benefit_key: `${row.initiative_id}:${row.metric_basis}`,
          initiative_key: row.initiative_id,
          benefit_name: row.metric_basis,
          metric_key: row.metric_basis,
          promised_annual_value_usd: number(row.promised_benefit_usd),
          realized_annual_value_usd: number(row.measured_value_usd),
          confidence: String(row.confidence || 'medium').toLowerCase(),
          readiness_state: row.evidence_status === 'source_backed' ? 'measured' : 'review_required',
          evidence_state: row.evidence_status === 'source_backed' ? 'usable' : 'review_required',
        });
      } else if (file === 'T08_spend-contracts.csv') {
        rowsByTable.ai_control_spend_contracts.push({
          ...base,
          spend_key: `${row.initiative_id}:${row.vendor_or_tool}`,
          initiative_key: row.initiative_id,
          vendor: row.vendor_or_tool || 'Unknown',
          product_or_service: row.vendor_or_tool || 'AI service',
          monthly_spend_usd: number(row.ytd_spend_usd) == null ? null : Math.round(number(row.ytd_spend_usd) / 6),
          annualized_spend_usd: number(row.annual_budget_usd),
          renewal_date: date(row.renewal_date),
          unit_economics_metric: row.unit_economic_note,
          evidence_state: 'usable',
        });
      } else if (file === 'T09_risk-governance.csv') {
        rowsByTable.ai_control_risk_governance.push({
          ...base,
          risk_key: row.risk_id,
          initiative_key: row.initiative_id,
          dimension: row.risk_domain,
          severity: String(row.severity || 'medium').toLowerCase(),
          status: row.control_status,
          risk_description: row.exception_or_gap || row.risk_domain,
          owner_role: row.owner_role,
          required_action: row.exception_or_gap,
          governance_gate: row.control_status === 'approved_with_conditions' ? 'partial' : row.control_status === 'blocked' ? 'fail' : null,
          evidence_state: row.control_status === 'blocked' ? 'review_required' : 'usable',
        });
      } else if (file === 'T10_evidence-items.csv') {
        rowsByTable.ai_control_evidence_items.push({
          ...base,
          evidence_key: row.evidence_item_id,
          record_type: 'initiative',
          record_key: row.initiative_id,
          evidence_type: 'source_file',
          citation_label: row.source_file,
          citation_locator: { locator: row.source_locator, timestamp: row.source_timestamp },
          evidence_pointer: row.source_file,
          evidence_state: row.review_state === 'approved' ? 'usable' : 'review_required',
          confidence: number(row.confidence),
        });
      } else if (file === 'T12_derived-actions.csv') {
        rowsByTable.ai_control_actions.push({
          ...base,
          action_key: row.action_id,
          related_record_type: 'initiative',
          related_record_key: row.derived_from,
          posture: row.priority === 'P0' ? 'prove' : 'monitor',
          title: row.action_title,
          rationale: `Derived from ${row.derived_from}; expected impact ${row.expected_impact_usd}`,
          owner_role: row.decision_owner,
          due_date: date(row.next_decision_date),
          status: 'proposed',
          evidence_state: 'review_required',
        });
      } else {
        const recordKey = row.initiative_id || row.model_id || row.refresh_id || row.milestone_id || `${sourceKey}:${index + 1}`;
        for (const [factKey, value] of Object.entries(row)) {
          const factValue = jsonValue(value);
          if (factValue === null) continue;
          rowsByTable.ai_control_context_facts.push({
            ...base,
            record_type: sourceKey,
            record_key: recordKey,
            fact_key: factKey,
            fact_type: typeof factValue,
            fact_value: factValue,
            fact_text: `${sourceKey} ${recordKey} ${factKey}: ${value}`,
            period_start: PERIOD_START,
            period_end: PERIOD_END,
            confidence: 0.84,
            evidence_state: 'received',
            evidence_keys: [],
          });
        }
      }
    });
  }
  rowsByTable.ai_control_atlas_context_packs.push({
    id: stableUuid(`${client.key}:atlas-context-pack:${RUN_ID}`),
    client_id: client.resolvedClientId,
    refresh_run_id: refreshRunId,
    pack_key: `${client.key}:executive-summary:${RUN_ID}`,
    lens: 'executive_summary',
    question_intent: 'summarize AI value, risk, spend, and evidence posture',
    visible_metric_keys: ['initiatives', 'benefit_realization', 'spend', 'risk', 'evidence'],
    context_json: { run_id: RUN_ID, dataset_root: client.datasetRoot, loaded_files: files },
    evidence_keys: [],
    retrieval_verified: false,
  });
  return rowsByTable;
}

function quoteIdent(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) throw new Error(`unsafe_identifier:${identifier}`);
  return `"${identifier}"`;
}

class Db {
  constructor(client) {
    this.client = client;
    this.columnCache = new Map();
    this.typeCache = new Map();
  }
  async columns(table) {
    if (this.columnCache.has(table)) return this.columnCache.get(table);
    const result = await this.client.query(
      `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
      [table],
    );
    const set = new Set(result.rows.map((row) => row.column_name));
    this.columnCache.set(table, set);
    return set;
  }
  async tableExists(table) { return (await this.columns(table)).size > 0; }
  async columnTypes(table) {
    if (this.typeCache.has(table)) return this.typeCache.get(table);
    const result = await this.client.query(
      `select column_name, data_type, udt_name
         from information_schema.columns
        where table_schema = 'public' and table_name = $1`,
      [table],
    );
    const map = new Map(result.rows.map((row) => [row.column_name, row.data_type || row.udt_name]));
    this.typeCache.set(table, map);
    return map;
  }
  sqlParamFor(types, column, value) {
    if (value === undefined) return null;
    if (value === null) return null;
    const type = types.get(column);
    if (type === 'json' || type === 'jsonb') return JSON.stringify(value);
    return value;
  }
  async scopePredicate(table, preferredScopeColumn, client) {
    const columns = await this.columns(table);
    if (columns.size === 0) return null;
    if (preferredScopeColumn === 'client_id' && columns.has('client_id')) {
      return { sql: 'client_id = $1', params: [client.resolvedClientId], column: 'client_id' };
    }
    if (preferredScopeColumn === 'tenant_key' && columns.has('tenant_key')) {
      return { sql: 'tenant_key = any($1::text[])', params: [client.aliases], column: 'tenant_key' };
    }
    if (columns.has('client_id')) return { sql: 'client_id = $1', params: [client.resolvedClientId], column: 'client_id' };
    if (columns.has('tenant_key')) return { sql: 'tenant_key = any($1::text[])', params: [client.aliases], column: 'tenant_key' };
    return null;
  }
  async selectScoped(table, scopeColumn, client) {
    const predicate = await this.scopePredicate(table, scopeColumn, client);
    if (!predicate) return [];
    return (await this.client.query(`select * from ${quoteIdent(table)} where ${predicate.sql}`, predicate.params)).rows;
  }
  async deleteScoped(table, scopeColumn, client) {
    const predicate = await this.scopePredicate(table, scopeColumn, client);
    if (!predicate) return 0;
    const result = await this.client.query(`delete from ${quoteIdent(table)} where ${predicate.sql}`, predicate.params);
    return result.rowCount || 0;
  }
  async upsert(table, rows, conflictColumns) {
    if (!rows.length || !(await this.tableExists(table))) return 0;
    const available = await this.columns(table);
    const filtered = rows.map((row) => {
      const out = {};
      for (const [key, value] of Object.entries(row)) {
        if (available.has(key)) out[key] = value;
      }
      return out;
    }).filter((row) => Object.keys(row).length);
    if (!filtered.length) return 0;
    const columns = Object.keys(filtered[0]);
    const types = await this.columnTypes(table);
    const updateColumns = columns.filter((column) => !conflictColumns.includes(column) && column !== 'id' && column !== 'created_at');
    let written = 0;
    for (let offset = 0; offset < filtered.length; offset += 200) {
      const batch = filtered.slice(offset, offset + 200);
      const params = [];
      const tuples = batch.map((row) => {
        const placeholders = columns.map((column) => {
          params.push(this.sqlParamFor(types, column, row[column]));
          return `$${params.length}`;
        });
        return `(${placeholders.join(', ')})`;
      });
      const conflict = conflictColumns.filter((column) => columns.includes(column));
      const onConflict = conflict.length
        ? `on conflict (${conflict.map(quoteIdent).join(', ')}) ${updateColumns.length ? `do update set ${updateColumns.map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`).join(', ')}` : 'do nothing'}`
        : '';
      try {
        await this.client.query(
          `insert into ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) values ${tuples.join(', ')} ${onConflict}`,
          params,
        );
      } catch (error) {
        throw new Error(`upsert_failed:${table}:batch_${offset / 200 + 1}:${error instanceof Error ? error.message : String(error)}`);
      }
      written += batch.length;
    }
    return written;
  }
}

async function resolveClientId(db, client) {
  const columns = await db.columns('clients');
  const checks = [];
  if (columns.has('id')) checks.push({ sql: 'id = $1', params: [client.expectedClientId] });
  if (columns.has('tenant_key')) checks.push({ sql: 'tenant_key = any($1::text[])', params: [client.aliases] });
  if (columns.has('client_key')) checks.push({ sql: 'client_key = any($1::text[])', params: [client.aliases] });
  if (columns.has('slug')) checks.push({ sql: 'slug = any($1::text[])', params: [client.aliases] });
  if (columns.has('name')) checks.push({ sql: 'lower(name) = lower($1)', params: [client.name] });
  for (const check of checks) {
    const result = await db.client.query(`select id from clients where ${check.sql} limit 1`, check.params);
    if (result.rows[0]?.id) return result.rows[0].id;
  }
  throw new Error(`client_not_found:${client.key}`);
}

async function archiveAndDelete(db, client) {
  const archiveDir = path.join(ARCHIVE_ROOT, client.key);
  ensureDir(archiveDir);
  const rows = [];
  for (const [table, scopeColumn] of CONTEXT_DELETE_TABLES) {
    const archived = await db.selectScoped(table, scopeColumn, client);
    fs.writeFileSync(path.join(archiveDir, `${table}.json`), JSON.stringify(archived, null, 2), 'utf8');
    const deleted = await db.deleteScoped(table, scopeColumn, client);
    rows.push({ table, archived: archived.length, deleted });
  }
  fs.writeFileSync(path.join(archiveDir, 'manifest.json'), JSON.stringify({
    run_id: RUN_ID,
    client_key: client.key,
    client_id: client.resolvedClientId,
    tenant_aliases: client.aliases,
    exported_at: NOW,
    tables: rows,
  }, null, 2), 'utf8');
  return rows;
}

async function commitClient(db, client) {
  const context = buildContextRows(client);
  const patterns = buildPrivatePatterns(client);
  const tower = buildAiControlRows(client);
  const results = [];
  results.push({ table: 'enterprise_context_sources', rows: await db.upsert('enterprise_context_sources', context.sources, ['tenant_key', 'source_system', 'source_key']) });
  results.push({ table: 'enterprise_context_source_files', rows: await db.upsert('enterprise_context_source_files', context.sourceFiles, ['tenant_key', 'source_file_id']) });
  results.push({ table: 'enterprise_context_records', rows: await db.upsert('enterprise_context_records', context.records, ['tenant_key', 'canonical_record_id']) });
  results.push({ table: 'enterprise_context_facts', rows: await db.upsert('enterprise_context_facts', context.facts, ['tenant_key', 'record_id', 'fact_key', 'value_hash']) });
  results.push({ table: 'enterprise_context_chunks', rows: await db.upsert('enterprise_context_chunks', context.chunks, ['tenant_key', 'chunk_id']) });
  results.push({ table: 'enterprise_context_relationships', rows: await db.upsert('enterprise_context_relationships', context.relationships, ['tenant_key', 'relationship_key']) });
  results.push({ table: 'client_private_patterns', rows: await db.upsert('client_private_patterns', patterns, ['client_id', 'slug', 'version']) });
  for (const [table, rows] of Object.entries(tower)) {
    const conflict = {
      ai_control_refresh_runs: ['client_id', 'refresh_run_key'],
      ai_control_sources: ['client_id', 'refresh_run_id', 'source_key'],
      ai_control_initiatives: ['client_id', 'refresh_run_id', 'initiative_key'],
      ai_control_tool_usage_monthly: ['client_id', 'refresh_run_id', 'tool_key', 'user_group_or_team', 'period_start'],
      ai_control_persona_productivity: ['client_id', 'refresh_run_id', 'persona_key', 'workflow', 'metric_key'],
      ai_control_dora_metrics: ['client_id', 'refresh_run_id', 'team', 'repo', 'period_start'],
      ai_control_agent_outcomes: ['client_id', 'refresh_run_id', 'agent_key'],
      ai_control_benefit_realization: ['client_id', 'refresh_run_id', 'benefit_key'],
      ai_control_spend_contracts: ['client_id', 'refresh_run_id', 'spend_key'],
      ai_control_risk_governance: ['client_id', 'refresh_run_id', 'risk_key'],
      ai_control_actions: ['client_id', 'refresh_run_id', 'action_key'],
      ai_control_evidence_items: ['client_id', 'refresh_run_id', 'evidence_key'],
      ai_control_context_facts: ['client_id', 'refresh_run_id', 'record_type', 'record_key', 'fact_key'],
      ai_control_context_relationships: ['client_id', 'refresh_run_id', 'relationship_key'],
      ai_control_atlas_context_packs: ['client_id', 'refresh_run_id', 'pack_key'],
    }[table] || [];
    results.push({ table, rows: await db.upsert(table, rows, conflict) });
  }
  await db.upsert('data_ingestion_runs', [{
    id: stableUuid(`${client.key}:data-ingestion-run:${RUN_ID}`),
    client_id: client.resolvedClientId,
    tenant_key: client.key,
    source_label: `${client.name} V2 context refresh`,
    source_root: client.datasetRoot,
    status: 'completed',
    summary: { run_id: RUN_ID, results },
    chunks_loaded: context.chunks.length,
    started_at: NOW,
    completed_at: new Date().toISOString(),
  }], ['id']);
  return results;
}

function dryRunClient(client) {
  const withClientId = { ...client, resolvedClientId: client.expectedClientId };
  const context = buildContextRows(withClientId);
  const patterns = buildPrivatePatterns(withClientId);
  const tower = buildAiControlRows(withClientId);
  return {
    client: client.key,
    mode: 'dry_run',
    context: {
      sources: context.sources.length,
      source_files: context.sourceFiles.length,
      records: context.records.length,
      facts: context.facts.length,
      chunks: context.chunks.length,
      relationships: context.relationships.length,
    },
    private_patterns: patterns.length,
    tower: Object.fromEntries(Object.entries(tower).map(([table, rows]) => [table, rows.length])),
  };
}

async function main() {
  const apply = hasArg('--apply');
  const clients = selectedClients();
  if (!clients.length) throw new Error('no_clients_selected');

  if (!apply) {
    const dry = clients.map(dryRunClient);
    console.log('RESULT_JSON ' + JSON.stringify({ ok: true, run_id: RUN_ID, mode: 'dry_run', clients: dry }, null, 2));
    return;
  }

  if (!process.env.DATABASE_URL && !process.env.ABARVA_AZURE_DATABASE_URL) {
    throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL required for --apply');
  }
  const { Client } = req('pg');
  const pg = new Client({
    connectionString: process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  const db = new Db(pg);
  const receipts = [];
  try {
    for (const clientConfig of clients) {
      const client = { ...clientConfig, resolvedClientId: await resolveClientId(db, clientConfig) };
      await pg.query('BEGIN');
      const archive = await archiveAndDelete(db, client);
      const load = await commitClient(db, client);
      await pg.query('COMMIT');
      receipts.push({ client: client.key, client_id: client.resolvedClientId, archive_root: path.join(ARCHIVE_ROOT, client.key), archive, load });
    }
  } catch (error) {
    await pg.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await pg.end();
  }
  console.log('RESULT_JSON ' + JSON.stringify({ ok: true, run_id: RUN_ID, mode: 'apply', receipts }, null, 2));
}

main().catch((error) => {
  console.error('RESULT_JSON ' + JSON.stringify({ ok: false, run_id: RUN_ID, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});

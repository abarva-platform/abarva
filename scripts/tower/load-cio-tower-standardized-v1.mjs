#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const ROOT = process.cwd();
const PACKAGE_ROOT = path.join(ROOT, 'tower-standardized-v1');
const DRY_RUN = process.argv.includes('--dry-run') || !process.env.DATABASE_URL;
const TENANT_ARG = process.argv.find((arg) => arg.startsWith('--tenant='));
const TENANT_FILTER = TENANT_ARG ? new Set(TENANT_ARG.replace('--tenant=', '').split(',').map((s) => s.trim()).filter(Boolean)) : null;

const measureDefinitions = [
  {
    measure_key: 'total_it_budget_fy26',
    label: 'FY26 IT budget',
    description: 'Committed FY26 IT budget envelope. Headline rows only; component rows are excluded.',
    default_scope: 'enterprise_envelope',
    grain_filter: { view: 'it_budget', period: 'fy26', basis: 'committed', amount_type: 'none', component_of: '' },
    aggregation: 'sum',
    artifact_default: 'metric_card',
    formula: 'sum facts where view=it_budget, period=fy26, basis=committed, amount_type=none, component_of empty',
  },
  {
    measure_key: 'total_it_budget_fy25_baseline',
    label: 'FY25 IT budget baseline',
    description: 'Synthetic FY2025 IT budget trend baseline. Not client-attested.',
    default_scope: 'enterprise_envelope',
    grain_filter: { view: 'it_budget', period: 'fy25', basis: 'actual', amount_type: 'none', component_of: '' },
    aggregation: 'sum',
    artifact_default: 'metric_card',
    formula: 'sum synthetic trend baseline facts where view=it_budget, period=fy25, amount_type=none',
  },
  {
    measure_key: 'run_budget_fy26',
    label: 'FY26 run budget',
    description: 'Committed FY26 run component of IT budget where loaded.',
    default_scope: 'enterprise_envelope',
    grain_filter: { view: 'it_budget', period: 'fy26', basis: 'committed', amount_type: 'run' },
    aggregation: 'sum',
    artifact_default: 'chart',
    formula: 'sum run component facts only',
  },
  {
    measure_key: 'change_budget_fy26',
    label: 'FY26 change budget',
    description: 'Committed FY26 change component of IT budget where loaded.',
    default_scope: 'enterprise_envelope',
    grain_filter: { view: 'it_budget', period: 'fy26', basis: 'committed', amount_type: 'change' },
    aggregation: 'sum',
    artifact_default: 'chart',
    formula: 'sum change component facts only',
  },
  {
    measure_key: 'initiative_budget_fy26',
    label: 'FY26 initiative budget',
    description: 'Committed FY26 initiative budget from Tower initiative spend rows.',
    default_scope: 'initiative',
    grain_filter: { view: 'initiative_budget', period: 'fy26', basis: 'committed' },
    aggregation: 'sum',
    artifact_default: 'table',
    formula: 'sum initiative budget facts',
  },
  {
    measure_key: 'measured_value_ytd',
    label: 'Measured value YTD',
    description: 'Measured or realized value where loaded. Not a projection.',
    default_scope: 'initiative',
    grain_filter: { view: 'value', period: 'ytd', basis: 'actual' },
    aggregation: 'sum',
    artifact_default: 'metric_card',
    formula: 'sum value facts where period=ytd and basis=actual',
  },
  {
    measure_key: 'promised_value_fy26',
    label: 'Promised value FY26',
    description: 'FY26 promised or forecast value from loaded initiative records.',
    default_scope: 'initiative',
    grain_filter: { view: 'value', period: 'fy26', basis: 'forecast' },
    aggregation: 'sum',
    artifact_default: 'metric_card',
    formula: 'sum value facts where period=fy26 and basis=forecast',
  },
  {
    measure_key: 'actual_spend_ytd',
    label: 'Actual spend YTD',
    description: 'YTD actual spend where loaded. Does not invent spend when missing.',
    default_scope: 'initiative',
    grain_filter: { view: 'initiative_budget', period: 'ytd', basis: 'actual' },
    aggregation: 'sum',
    artifact_default: 'metric_card',
    formula: 'sum actual initiative spend facts',
  },
];

const questionContracts = [
  {
    contract_key: 'tower_top_it_programs_by_budget',
    intent: 'table',
    question_family: 'top_it_programs_by_budget',
    measure_key: 'initiative_budget_fy26',
    default_scope: 'initiative',
    dimensions: ['initiative', 'budget', 'owner', 'status'],
    required_fields: ['initiative_name', 'budget_fy26_usd', 'owner_role'],
    artifact_type: 'table',
    examples: ['give me the list of top 10 IT programs', 'what are the largest IT initiatives by budget?'],
  },
  {
    contract_key: 'tower_total_it_spend',
    intent: 'lookup',
    question_family: 'total_it_spend',
    measure_key: 'total_it_budget_fy26',
    default_scope: 'enterprise_envelope',
    dimensions: ['budget', 'period', 'basis'],
    required_fields: ['budget_fy26_usd'],
    artifact_type: 'metric_card',
    examples: ['what is my IT spend?', 'what is the FY26 IT budget?'],
  },
  {
    contract_key: 'tower_run_change_split',
    intent: 'chart',
    question_family: 'run_change_split',
    measure_key: 'run_budget_fy26',
    default_scope: 'enterprise_envelope',
    dimensions: ['run', 'change', 'budget'],
    required_fields: ['run_budget_fy26_usd', 'change_budget_fy26_usd'],
    artifact_type: 'chart',
    examples: ['show run versus change', 'what is the run/change split?'],
  },
  {
    contract_key: 'tower_value_realization',
    intent: 'diagnose',
    question_family: 'value_realization',
    measure_key: 'measured_value_ytd',
    default_scope: 'initiative',
    dimensions: ['value', 'initiative', 'evidence'],
    required_fields: ['measured_value_usd', 'evidence_status'],
    artifact_type: 'table',
    examples: ['which initiatives have measured value?', 'where is value lagging?'],
  },
  {
    contract_key: 'tower_trend_it_budget',
    intent: 'chart',
    question_family: 'it_budget_trend',
    measure_key: 'total_it_budget_fy25_baseline',
    default_scope: 'enterprise_envelope',
    dimensions: ['fy25', 'fy26', 'trend'],
    required_fields: ['amount_usd', 'period', 'formula_version'],
    artifact_type: 'chart',
    examples: ['show IT budget trend from FY25 to FY26', 'how is IT spend trending?'],
  },
  {
    contract_key: 'tower_outside_scope',
    intent: 'outside_scope',
    question_family: 'outside_tower_scope',
    measure_key: null,
    default_scope: 'outside_scope',
    dimensions: [],
    required_fields: [],
    artifact_type: 'handoff',
    examples: ['what is the capital of Spain?', 'write me a poem'],
  },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.filter((r) => r.some((cell) => cell.trim() !== '')).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function checksum(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function key(...parts) {
  return parts.filter(Boolean).join(':').replace(/[^a-zA-Z0-9:_./-]+/g, '_').slice(0, 240);
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '' || value === 'not_loaded') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function entityTypeFromNodeType(nodeType) {
  const normalized = String(nodeType || '').toLowerCase();
  if (normalized.includes('vendor')) return 'vendor';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('application')) return 'application';
  if (normalized.includes('system')) return 'system';
  if (normalized.includes('platform')) return 'platform';
  if (normalized.includes('capability')) return 'capability';
  if (normalized.includes('kpi')) return 'kpi';
  if (normalized.includes('risk')) return 'risk';
  if (normalized.includes('function')) return 'business_function';
  if (normalized.includes('team') || normalized.includes('org')) return 'org_unit';
  return 'system';
}

function collectPackage() {
  const tenants = fs.readdirSync(PACKAGE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((tenant) => !TENANT_FILTER || TENANT_FILTER.has(tenant))
    .sort();

  const out = {
    sources: [],
    entities: new Map(),
    entityAliases: new Map(),
    entityNaturalKeys: new Map(),
    facts: [],
    relationships: new Map(),
    relationshipNaturalKeys: new Map(),
    measureResults: [],
    tenants: {},
  };

  for (const tenantKey of tenants) {
    const tenantDir = path.join(PACKAGE_ROOT, tenantKey);
    const files = walk(tenantDir).filter((filePath) => filePath.endsWith('.csv') || filePath.endsWith('.yaml') || filePath.endsWith('.jsonl'));
    out.tenants[tenantKey] = { sourceFiles: files.length, facts: 0, entities: 0, relationships: 0 };
    for (const filePath of files) {
      const rel = path.relative(tenantDir, filePath);
      const rowCount = filePath.endsWith('.csv') ? Math.max(readCsv(filePath).length, 0) : undefined;
      out.sources.push({
        source_key: key(tenantKey, rel),
        tenant_key: tenantKey,
        source_system: rel.split('/')[0],
        source_file: rel,
        source_kind: filePath.endsWith('.csv') ? 'file' : 'file',
        source_version: 'tower_standardized_v1',
        upload_run_id: 'tower_standardized_v1_local',
        trust_tier: 'synthetic_demo',
        row_count: rowCount,
        checksum: checksum(filePath),
        metadata: { package_root: 'tower-standardized-v1' },
      });
    }

    loadEntities(out, tenantKey, tenantDir);
    loadFacts(out, tenantKey, tenantDir);
    loadRelationships(out, tenantKey, tenantDir);
  }

  for (const tenantKey of tenants) {
    computeMeasureResults(out, tenantKey);
    out.tenants[tenantKey].entities = [...out.entities.values()].filter((e) => e.tenant_key === tenantKey).length;
    out.tenants[tenantKey].facts = out.facts.filter((f) => f.tenant_key === tenantKey).length;
    out.tenants[tenantKey].relationships = [...out.relationships.values()].filter((r) => r.tenant_key === tenantKey).length;
  }
  return out;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function addEntity(out, entity) {
  if (!entity.entity_key || !entity.display_name) return;
  const naturalKey = key(entity.tenant_key, entity.entity_type, String(entity.display_name).trim().toLowerCase());
  const existingKey = out.entityNaturalKeys.get(naturalKey);
  if (existingKey) {
    out.entityAliases.set(entity.entity_key, existingKey);
    const existing = out.entities.get(existingKey);
    out.entities.set(existingKey, {
      ...existing,
      source_key: existing.source_key || entity.source_key || null,
      source_row: existing.source_row || entity.source_row || null,
      attributes: {
        ...(existing.attributes ?? {}),
        aliases: [...new Set([...(existing.attributes?.aliases ?? []), entity.entity_key])],
        source_rows: [...new Set([...(existing.attributes?.source_rows ?? []), entity.source_row].filter(Boolean))],
      },
    });
    return;
  }
  out.entityNaturalKeys.set(naturalKey, entity.entity_key);
  out.entityAliases.set(entity.entity_key, entity.entity_key);
  out.entities.set(entity.entity_key, {
    source_key: null,
    source_row: null,
    attributes: {},
    ...entity,
  });
}

function resolveEntityKey(out, entityKey) {
  if (!entityKey) return null;
  return out.entityAliases.get(entityKey) ?? entityKey;
}

function normalizedReference(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/-FY2025-.+$/, '');
}

function factEntityReferences(row) {
  const refs = [];
  if (row.view === 'initiative_budget') {
    refs.push(row.source_label, row.reconciles_to_record_id, row.is_rollup_of, row.source_record_id);
  } else {
    refs.push(row.source_record_id, row.reconciles_to_record_id, row.is_rollup_of, row.source_label);
  }
  return refs.map(normalizedReference).filter(Boolean);
}

function resolveFactEntityKey(out, tenantKey, row) {
  for (const ref of factEntityReferences(row)) {
    const candidate = resolveEntityKey(out, key(tenantKey, ref));
    if (out.entities.has(candidate)) return candidate;
  }
  return null;
}

function addRelationship(out, relationship) {
  if (!relationship.from_entity_key || !relationship.to_entity_key) return;
  const naturalKey = key(
    relationship.tenant_key,
    relationship.from_entity_key,
    relationship.to_entity_key,
    relationship.relationship_type,
  );
  const existingKey = out.relationshipNaturalKeys.get(naturalKey);
  if (existingKey) {
    const existing = out.relationships.get(existingKey);
    out.relationships.set(existingKey, {
      ...existing,
      confidence: strongerConfidence(existing.confidence, relationship.confidence),
      source_key: existing.source_key || relationship.source_key || null,
      source_row: existing.source_row || relationship.source_row || null,
      attributes: {
        ...(existing.attributes ?? {}),
        ...(relationship.attributes ?? {}),
        aliases: [...new Set([...(existing.attributes?.aliases ?? []), relationship.relationship_key])],
        source_rows: [...new Set([...(existing.attributes?.source_rows ?? []), relationship.source_row].filter(Boolean))],
      },
    });
    return;
  }
  out.relationshipNaturalKeys.set(naturalKey, relationship.relationship_key);
  out.relationships.set(relationship.relationship_key, relationship);
}

function loadEntities(out, tenantKey, tenantDir) {
  const dictionary = path.join(tenantDir, 'family-8-semantic-enrichment', 'F25_context-node-dictionary.csv');
  if (fs.existsSync(dictionary)) {
    for (const row of readCsv(dictionary)) {
      addEntity(out, {
        entity_key: key(tenantKey, row.node_id),
        tenant_key: tenantKey,
        entity_type: entityTypeFromNodeType(row.node_type),
        display_name: row.business_label || row.node_id,
        source_key: key(tenantKey, row.source_file || 'family-8-semantic-enrichment/F25_context-node-dictionary.csv'),
        source_row: row.source_row || null,
        attributes: { node_id: row.node_id, node_type: row.node_type, confidence: row.confidence, caveat: row.caveat },
      });
    }
  }

  const initiatives = path.join(tenantDir, 'ai-control-tower', 'T01_initiative-registry.csv');
  if (fs.existsSync(initiatives)) {
    for (const row of readCsv(initiatives)) {
      addEntity(out, {
        entity_key: key(tenantKey, row.initiative_id),
        tenant_key: tenantKey,
        entity_type: 'initiative',
        display_name: row.initiative_name || row.initiative_id,
        source_key: key(tenantKey, 'ai-control-tower/T01_initiative-registry.csv'),
        source_row: row.source_row || null,
        attributes: row,
      });
    }
  }

  const budget = path.join(tenantDir, 'family-4-financial-commercial', 'F12_it-budget-financials.csv');
  if (fs.existsSync(budget)) {
    for (const row of readCsv(budget)) {
      addEntity(out, {
        entity_key: key(tenantKey, row.line_id),
        tenant_key: tenantKey,
        entity_type: 'org_unit',
        display_name: row.budget_area || row.function_or_platform || row.line_id,
        source_key: key(tenantKey, 'family-4-financial-commercial/F12_it-budget-financials.csv'),
        source_row: row.source_row || null,
        attributes: row,
      });
    }
  }

  const spend = path.join(tenantDir, 'ai-control-tower', 'T08_spend-contracts.csv');
  if (fs.existsSync(spend)) {
    for (const row of readCsv(spend)) {
      if (!row.vendor_or_tool) continue;
      addEntity(out, {
        entity_key: key(tenantKey, 'vendor', row.vendor_or_tool),
        tenant_key: tenantKey,
        entity_type: 'vendor',
        display_name: row.vendor_or_tool,
        source_key: key(tenantKey, 'ai-control-tower/T08_spend-contracts.csv'),
        source_row: row.source_row || null,
        attributes: { vendor_or_tool: row.vendor_or_tool },
      });
    }
  }
}

function loadFacts(out, tenantKey, tenantDir) {
  for (const rel of ['derived/tower_financial_amounts.csv', 'derived/tower_financial_amounts_fy2025_trend.csv']) {
    const filePath = path.join(tenantDir, rel);
    if (!fs.existsSync(filePath)) continue;
    for (const row of readCsv(filePath)) {
      const value = numberOrNull(row.amount_usd);
      if (value === null) continue;
      const entityKey = resolveFactEntityKey(out, tenantKey, row);
      out.facts.push({
        fact_key: key(tenantKey, rel, row.source_record_id, row.view, row.amount_type, row.basis, row.period, row.source_row),
        tenant_key: tenantKey,
        entity_key: out.entities.has(entityKey) ? entityKey : null,
        entity_type: out.entities.get(entityKey)?.entity_type ?? null,
        measure: row.view,
        scope: scopeForView(row.view),
        view: row.view,
        amount_type: row.amount_type || 'none',
        basis: row.basis || 'committed',
        period: row.period || 'fy26',
        value_numeric: value,
        value_text: null,
        value_date: null,
        value_bool: null,
        unit: 'usd',
        value_source: row.value_source === 'tenant_file' ? 'tenant_file' : 'synthetic',
        confidence: row.value_source === 'tenant_file' ? 'high' : 'medium',
        source_key: key(tenantKey, row.source_file || rel),
        source_row: row.source_row || null,
        formula_key: row.formula || null,
        formula_version: row.formula_version || 'tower_standardized_v1',
        is_rollup_of: row.is_rollup_of || null,
        component_of: row.component_of || null,
        attributes: row,
      });
    }
  }
}

function scopeForView(view) {
  if (view === 'it_budget') return 'enterprise_envelope';
  if (view === 'initiative_budget' || view === 'value') return 'initiative';
  if (view === 'vendor_contract') return 'contract';
  return 'other';
}

function loadRelationships(out, tenantKey, tenantDir) {
  const spend = path.join(tenantDir, 'ai-control-tower', 'T08_spend-contracts.csv');
  if (fs.existsSync(spend)) {
    for (const row of readCsv(spend)) {
      const initiativeKey = resolveEntityKey(out, key(tenantKey, row.initiative_id));
      const vendorKey = resolveEntityKey(out, key(tenantKey, 'vendor', row.vendor_or_tool));
      if (out.entities.has(initiativeKey) && out.entities.has(vendorKey)) {
        addRelationship(out, {
          relationship_key: key(tenantKey, row.line_id, 'supplies'),
          tenant_key: tenantKey,
          from_entity_key: vendorKey,
          to_entity_key: initiativeKey,
          relationship_type: 'supplies',
          confidence: 'high',
          source_key: key(tenantKey, 'ai-control-tower/T08_spend-contracts.csv'),
          source_row: row.source_row || null,
          attributes: row,
        });
      }
    }
  }

  const vendorSystem = path.join(tenantDir, 'family-8-semantic-enrichment', 'F22_contract-system-service-map.csv');
  if (fs.existsSync(vendorSystem)) {
    for (const row of readCsv(vendorSystem)) {
      const vendorKey = resolveEntityKey(out, key(tenantKey, 'vendor', row.vendor_name));
      const systemKey = resolveEntityKey(out, key(tenantKey, row.supported_system_id));
      if (out.entities.has(vendorKey) && out.entities.has(systemKey)) {
        addRelationship(out, {
          relationship_key: key(tenantKey, row.map_id, 'supports'),
          tenant_key: tenantKey,
          from_entity_key: vendorKey,
          to_entity_key: systemKey,
          relationship_type: 'supports',
          confidence: confidence(row.confidence),
          source_key: key(tenantKey, 'family-8-semantic-enrichment/F22_contract-system-service-map.csv'),
          source_row: row.source_row || null,
          attributes: row,
        });
      }
    }
  }

  const capSystem = path.join(tenantDir, 'family-8-semantic-enrichment', 'F20_capability-system-dependency.csv');
  if (fs.existsSync(capSystem)) {
    for (const row of readCsv(capSystem)) {
      const capabilityKey = resolveEntityKey(out, key(tenantKey, row.capability_id));
      const systemKey = resolveEntityKey(out, key(tenantKey, row.system_id));
      if (out.entities.has(capabilityKey) && out.entities.has(systemKey)) {
        addRelationship(out, {
          relationship_key: key(tenantKey, row.dependency_id, 'depends_on'),
          tenant_key: tenantKey,
          from_entity_key: capabilityKey,
          to_entity_key: systemKey,
          relationship_type: 'depends_on',
          confidence: confidence(row.confidence),
          source_key: key(tenantKey, 'family-8-semantic-enrichment/F20_capability-system-dependency.csv'),
          source_row: row.source_row || null,
          attributes: row,
        });
      }
    }
  }
}

function confidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'medium';
  if (n >= 0.75) return 'high';
  if (n < 0.55) return 'low';
  return 'medium';
}

function strongerConfidence(left, right) {
  const rank = { low: 1, medium: 2, high: 3 };
  const l = confidenceRank(left, rank);
  const r = confidenceRank(right, rank);
  return l >= r ? confidenceLabel(left) : confidenceLabel(right);
}

function confidenceRank(value, rank) {
  return rank[confidenceLabel(value)] ?? rank.medium;
}

function confidenceLabel(value) {
  return value === 'high' || value === 'medium' || value === 'low' ? value : confidence(value);
}

function computeMeasureResults(out, tenantKey) {
  for (const measure of measureDefinitions) {
    const rows = out.facts.filter((fact) => fact.tenant_key === tenantKey && matchesFilter(fact, measure.grain_filter));
    const value = rows.reduce((sum, fact) => sum + Number(fact.value_numeric || 0), 0);
    out.measureResults.push({
      result_key: key(tenantKey, measure.measure_key, measure.grain_filter.period || 'all', measure.grain_filter.basis || 'all'),
      tenant_key: tenantKey,
      measure_key: measure.measure_key,
      scope: measure.default_scope,
      period: measure.grain_filter.period || 'all',
      basis: measure.grain_filter.basis || 'all',
      dimensions: measure.grain_filter,
      value_numeric: value,
      value_json: { row_count: rows.length },
      source_fact_keys: rows.map((row) => row.fact_key),
      formula_version: measure.formula_version || 'cio_tower_v1',
    });
  }
}

function matchesFilter(fact, filter) {
  for (const [field, expected] of Object.entries(filter)) {
    const actual = fact[field] ?? '';
    if (actual !== expected) return false;
  }
  return true;
}

async function writeToDb(payload) {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    await upsertSources(client, payload.sources);
    await upsertEntities(client, [...payload.entities.values()]);
    await upsertFacts(client, payload.facts);
    await upsertRelationships(client, [...payload.relationships.values()]);
    await upsertMeasures(client);
    await upsertQuestionContracts(client);
    await upsertMeasureResults(client, payload.measureResults);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function upsertSources(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO cio_tower.source_registry (source_key, tenant_key, source_system, source_file, source_kind, source_version, upload_run_id, trust_tier, row_count, checksum, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (source_key) DO UPDATE SET row_count=EXCLUDED.row_count, checksum=EXCLUDED.checksum, metadata=EXCLUDED.metadata, loaded_at=now()`,
      [row.source_key, row.tenant_key, row.source_system, row.source_file, row.source_kind, row.source_version, row.upload_run_id, row.trust_tier, row.row_count ?? null, row.checksum, row.metadata],
    );
  }
}

async function upsertEntities(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO cio_tower.entities (entity_key, tenant_key, entity_type, display_name, parent_entity_key, source_key, source_row, attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (entity_key) DO UPDATE SET display_name=EXCLUDED.display_name, source_key=EXCLUDED.source_key, source_row=EXCLUDED.source_row, attributes=EXCLUDED.attributes, updated_at=now()`,
      [row.entity_key, row.tenant_key, row.entity_type, row.display_name, row.parent_entity_key ?? null, row.source_key ?? null, row.source_row ?? null, row.attributes ?? {}],
    );
  }
}

async function upsertFacts(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO cio_tower.facts (fact_key, tenant_key, entity_key, entity_type, measure, scope, view, amount_type, basis, period, value_numeric, value_text, value_date, value_bool, unit, value_source, confidence, source_key, source_row, formula_key, formula_version, is_rollup_of, component_of, attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT (fact_key) DO UPDATE SET
         entity_key=EXCLUDED.entity_key,
         entity_type=EXCLUDED.entity_type,
         measure=EXCLUDED.measure,
         scope=EXCLUDED.scope,
         view=EXCLUDED.view,
         amount_type=EXCLUDED.amount_type,
         basis=EXCLUDED.basis,
         period=EXCLUDED.period,
         value_numeric=EXCLUDED.value_numeric,
         value_text=EXCLUDED.value_text,
         value_date=EXCLUDED.value_date,
         value_bool=EXCLUDED.value_bool,
         unit=EXCLUDED.unit,
         value_source=EXCLUDED.value_source,
         confidence=EXCLUDED.confidence,
         source_key=EXCLUDED.source_key,
         source_row=EXCLUDED.source_row,
         formula_key=EXCLUDED.formula_key,
         formula_version=EXCLUDED.formula_version,
         is_rollup_of=EXCLUDED.is_rollup_of,
         component_of=EXCLUDED.component_of,
         attributes=EXCLUDED.attributes`,
      [
        row.fact_key, row.tenant_key, row.entity_key, row.entity_type, row.measure, row.scope, row.view, row.amount_type, row.basis, row.period,
        row.value_numeric, row.value_text, row.value_date, row.value_bool, row.unit, row.value_source, row.confidence, row.source_key, row.source_row,
        row.formula_key, row.formula_version, row.is_rollup_of, row.component_of, row.attributes ?? {},
      ],
    );
  }
}

async function upsertRelationships(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO cio_tower.relationships (relationship_key, tenant_key, from_entity_key, to_entity_key, relationship_type, confidence, source_key, source_row, attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_key, from_entity_key, to_entity_key, relationship_type)
       DO UPDATE SET confidence=EXCLUDED.confidence, source_key=EXCLUDED.source_key, source_row=EXCLUDED.source_row, attributes=EXCLUDED.attributes`,
      [row.relationship_key, row.tenant_key, row.from_entity_key, row.to_entity_key, row.relationship_type, row.confidence, row.source_key ?? null, row.source_row ?? null, row.attributes ?? {}],
    );
  }
}

async function upsertMeasures(client) {
  for (const measure of measureDefinitions) {
    await client.query(
      `INSERT INTO cio_tower.measures (measure_key, label, description, default_scope, grain_filter, group_by, aggregation, honesty_rule, artifact_default, formula, formula_version, active)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,true)
       ON CONFLICT (measure_key) DO UPDATE SET label=EXCLUDED.label, description=EXCLUDED.description, grain_filter=EXCLUDED.grain_filter, artifact_default=EXCLUDED.artifact_default, formula=EXCLUDED.formula, updated_at=now(), active=true`,
      [
        measure.measure_key,
        measure.label,
        measure.description,
        measure.default_scope,
        JSON.stringify(measure.grain_filter),
        JSON.stringify([]),
        measure.aggregation,
        'return_not_loaded_when_no_matching_facts',
        measure.artifact_default,
        measure.formula,
        measure.formula_version || 'cio_tower_v1',
      ],
    );
  }
}

async function upsertQuestionContracts(client) {
  for (const contract of questionContracts) {
    await client.query(
      `INSERT INTO cio_tower.question_contracts (contract_key, surface, intent, question_family, measure_key, default_scope, dimensions, filters_schema, required_fields, artifact_type, outside_scope_rule, prompt_policy_key, examples, active)
       VALUES ($1,'tower',$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,'cio_tower_visible_answer_v1',$11::jsonb,true)
       ON CONFLICT (contract_key) DO UPDATE SET intent=EXCLUDED.intent, question_family=EXCLUDED.question_family, measure_key=EXCLUDED.measure_key, dimensions=EXCLUDED.dimensions, required_fields=EXCLUDED.required_fields, artifact_type=EXCLUDED.artifact_type, examples=EXCLUDED.examples, active=true`,
      [
        contract.contract_key,
        contract.intent,
        contract.question_family,
        contract.measure_key,
        contract.default_scope,
        JSON.stringify(contract.dimensions),
        JSON.stringify({}),
        JSON.stringify(contract.required_fields),
        contract.artifact_type,
        'refuse_and_offer_tower_scope',
        JSON.stringify(contract.examples),
      ],
    );
  }
}

async function upsertMeasureResults(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO cio_tower.measure_results (result_key, tenant_key, measure_key, scope, period, basis, dimensions, value_numeric, value_json, source_fact_keys, formula_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (tenant_key, measure_key, scope, period, basis, dimensions) DO UPDATE SET value_numeric=EXCLUDED.value_numeric, value_json=EXCLUDED.value_json, source_fact_keys=EXCLUDED.source_fact_keys, computed_at=now()`,
      [row.result_key, row.tenant_key, row.measure_key, row.scope, row.period, row.basis, row.dimensions, row.value_numeric, row.value_json, row.source_fact_keys, row.formula_version],
    );
  }
}

const payload = collectPackage();
const summary = {
  mode: DRY_RUN ? 'dry-run' : 'write',
  sourceCount: payload.sources.length,
  entityCount: payload.entities.size,
  factCount: payload.facts.length,
  relationshipCount: payload.relationships.size,
  measureCount: measureDefinitions.length,
  questionContractCount: questionContracts.length,
  measureResultCount: payload.measureResults.length,
  tenants: payload.tenants,
};

if (DRY_RUN) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  await writeToDb(payload);
  console.log(JSON.stringify({ ...summary, status: 'written' }, null, 2));
}

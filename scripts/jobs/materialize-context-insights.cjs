#!/usr/bin/env node
/*
 * Materialize tenant-scoped L2 context insights from committed
 * enterprise_context_records and enterprise_context_facts.
 *
 * Modes:
 *   plan   - read rows and print candidate insight counts, no writes
 *   apply  - replace this materializer's rule outputs for selected tenants
 *   verify - assert active insights exist and every row has fact/record IDs
 *
 * Required for DB modes: DATABASE_URL.
 */

const crypto = require('node:crypto');
const { Client } = require('pg');

const NOW = new Date(process.env.CONTEXT_INSIGHT_AS_OF || Date.now()).toISOString();
const AS_OF_DATE = NOW.slice(0, 10);
const MATERIALIZER = 'context-insight-materializer-v1';
const RULE_IDS = [
  'renewal-window-no-benchmark',
  'value-coverage-gap',
  'critical-platform-drag',
  'data-foundation-readiness-gap',
  'governed-ai-risk-gap',
  'operational-backlog-automation-pressure',
];

const CLIENTS = [
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    expectedClientId: 'd2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612',
    aliases: ['meridian-health', 'meridian', 'meridian-health-system', 'phs-meridian'],
  },
  {
    key: 'lakeshore',
    name: 'Lakeshore Industries',
    expectedClientId: '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667',
    aliases: ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
  },
];

function arg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

function command() {
  return process.argv.find((item) => ['plan', 'apply', 'verify'].includes(item)) || 'plan';
}

function selectedClients() {
  const raw = arg('--client') || process.env.CONTEXT_INSIGHT_CLIENTS || 'all';
  if (raw === 'all') return CLIENTS;
  const wanted = new Set(raw.split(',').map((item) => item.trim()).filter(Boolean));
  return CLIENTS.filter((client) => wanted.has(client.key) || client.aliases.some((alias) => wanted.has(alias)));
}

function stableUuid(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function number(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value ?? '').trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function dateDistanceDays(value, asOf = AS_OF_DATE) {
  const raw = text(value);
  if (!raw) return Number.POSITIVE_INFINITY;
  const target = new Date(`${raw.slice(0, 10)}T00:00:00Z`);
  const base = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return Number.POSITIVE_INFINITY;
  return Math.ceil((target.getTime() - base.getTime()) / 86_400_000);
}

function formatUsd(value) {
  const n = number(value);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${Math.round(n)}`;
}

function severityRank(value) {
  const t = lower(value);
  if (/critical|severe|red/.test(t)) return 3;
  if (/high|material|blocked|at.risk|at risk/.test(t)) return 2;
  if (/medium|amber|watch|attention/.test(t)) return 1;
  return 0;
}

function confidenceLabel(records) {
  const scores = records.map((record) => number(record.confidence)).filter((value) => value > 0);
  if (!scores.length) return 'medium';
  const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  if (avg >= 0.84) return 'high';
  if (avg >= 0.67) return 'medium';
  return 'low';
}

function freshnessLabel(records) {
  const statuses = new Set(records.map((record) => lower(record.freshness_status)));
  if (statuses.has('stale')) return 'stale';
  if (statuses.has('attention') || statuses.has('review')) return 'attention';
  if (statuses.has('fresh')) return 'fresh';
  return 'unknown';
}

function materiality(value) {
  return value >= 2 ? 'high' : value >= 1 ? 'medium' : 'low';
}

function primaryEvidence(record) {
  const file = record.source_file || record.payload?.source_file || 'enterprise_context_records';
  const row = record.source_row_number ? `row ${record.source_row_number}` : record.canonical_record_id;
  return `${file} · ${row}`;
}

function factIdsFor(records, factsByRecord) {
  const ids = [];
  for (const record of records) {
    for (const fact of factsByRecord.get(record.id) || []) ids.push(fact.id);
  }
  return [...new Set(ids)];
}

function insight(input) {
  const recordIds = [...new Set(input.records.map((record) => record.id))];
  const factIds = factIdsFor(input.records, input.factsByRecord);
  const key = `${input.tenantKey}:${input.ruleId}:${input.entityName || input.headline}`;
  return {
    id: stableUuid(`context-insight:${key}`),
    client_id: input.clientId,
    tenant_key: input.tenantKey,
    rule_id: input.ruleId,
    headline: input.headline,
    so_what: input.soWhat,
    domain: input.domain,
    materiality: input.materiality || 'medium',
    derived_from_record_ids: recordIds,
    derived_from_fact_ids: factIds,
    evidence: input.evidence || primaryEvidence(input.records[0]),
    confidence: input.confidence || confidenceLabel(input.records),
    freshness_status: input.freshnessStatus || freshnessLabel(input.records),
    lifecycle_state: input.lifecycleState || (factIds.length ? 'active' : 'blocked_by_gap'),
    action: input.action || 'See the facts',
    entity_name: input.entityName || null,
    entity_type: input.entityType || null,
    insight_payload: {
      materializer: MATERIALIZER,
      as_of_date: AS_OF_DATE,
      metrics: input.metrics || {},
      explanation: input.explanation || null,
    },
    updated_at: NOW,
  };
}

function topBy(rows, score, limit = 4) {
  return rows
    .map((row) => ({ row, score: score(row) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({ ...item.row, __score: item.score }));
}

function deriveInsightsFromRows(input) {
  const { tenantKey, clientId, records, factsByRecord = new Map() } = input;
  const byType = new Map();
  for (const record of records) {
    const bucket = byType.get(record.record_type) || [];
    bucket.push(record);
    byType.set(record.record_type, bucket);
  }

  const insights = [];

  for (const record of topBy(byType.get('vendors_contracts_licenses') || [], (row) => {
    const p = row.payload || {};
    const days = dateDistanceDays(p.renewal_date);
    const value = number(p.annual_contract_value_usd);
    const risk = severityRank(p.commercial_risk || p.criticality);
    return days >= 0 && days <= 240 ? risk * 10 + value / 1_000_000 : 0;
  })) {
    const p = record.payload || {};
    const days = dateDistanceDays(p.renewal_date);
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'renewal-window-no-benchmark',
      domain: 'Vendor',
      records: [record],
      headline: `${p.vendor_name || record.title} renewal has ${formatUsd(p.annual_contract_value_usd)} at risk within ${days} days`,
      soWhat: `The context layer sees a ${p.category || 'vendor'} renewal with ${p.commercial_risk || 'commercial risk'} before the next planning window closes. Sourcing and Tower should treat this as a decision clock, not background inventory.`,
      materiality: materiality(record.__score / 20),
      entityName: p.vendor_name || record.title,
      entityType: 'vendor_contract',
      action: 'Shape into Source event',
      metrics: { renewal_date: p.renewal_date, annual_contract_value_usd: number(p.annual_contract_value_usd), commercial_risk: p.commercial_risk },
    }));
  }

  for (const record of topBy([...(byType.get('initiatives_portfolio') || []), ...(byType.get('ai_automation_footprint') || [])], (row) => {
    const p = row.payload || {};
    const promised = number(p.promised_benefit_usd);
    const measured = number(p.measured_value_usd);
    const budget = number(p.budget_usd);
    if (promised + measured + budget <= 0) return 0;
    const gap = Math.max(promised - measured, budget - measured, 0);
    const evidenceRisk = /(missing|review|partial|unapproved|blocked|gap)/i.test(`${p.evidence_status || ''} ${p.risk_status || ''} ${p.next_gate || ''}`) ? 20 : 0;
    return gap / 1_000_000 + evidenceRisk + severityRank(p.risk_status) * 8;
  })) {
    const p = record.payload || {};
    const promised = number(p.promised_benefit_usd);
    const measured = number(p.measured_value_usd);
    const budget = number(p.budget_usd);
    const gap = Math.max(promised - measured, budget - measured, 0);
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'value-coverage-gap',
      domain: 'Cost',
      records: [record],
      headline: `${p.initiative_name || p.ai_asset_name || record.title} has ${formatUsd(gap)} value proof gap`,
      soWhat: `Spend or promised value is visible, but measured value/evidence is not yet strong enough to call this converted value. Tower should separate funded activity from defensible business impact.`,
      materiality: materiality(record.__score / 20),
      entityName: p.initiative_name || p.ai_asset_name || record.title,
      entityType: record.record_type,
      action: 'Add to Tower evidence review',
      metrics: { promised_benefit_usd: promised, measured_value_usd: measured, budget_usd: budget, value_gap_usd: gap },
    }));
  }

  for (const record of topBy(byType.get('applications_systems') || [], (row) => {
    const p = row.payload || {};
    const runCost = number(p.annual_run_cost_usd);
    const integrations = number(p.integration_count);
    const critical = /tier 1|critical|high/i.test(`${p.criticality || ''}`) ? 20 : 0;
    const legacy = /legacy|rationalize|modernize|technical debt|mainframe|custom/i.test(`${p.modernization_state || ''} ${p.platform_type || ''}`) ? 15 : 0;
    return critical + legacy + runCost / 1_000_000 + integrations / 5;
  })) {
    const p = record.payload || {};
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'critical-platform-drag',
      domain: 'Service',
      records: [record],
      headline: `${p.application_name || record.title} is a critical platform drag on transformation`,
      soWhat: `The system is business-critical, costly, and integration-heavy. Moves that depend on this estate need sequencing and simplification work before AI productivity claims will hold.`,
      materiality: materiality(record.__score / 25),
      entityName: p.application_name || record.title,
      entityType: 'application_system',
      action: 'Create dependency review',
      metrics: { annual_run_cost_usd: number(p.annual_run_cost_usd), integration_count: number(p.integration_count), criticality: p.criticality, modernization_state: p.modernization_state },
    }));
  }

  for (const record of topBy([...(byType.get('data_analytics_estate') || []), ...(byType.get('integrations_interfaces') || [])], (row) => {
    const p = row.payload || {};
    const qualityGap = Math.max(0, 90 - number(p.quality_score));
    const semanticGap = /(none|missing|draft|incomplete|manual|not)/i.test(`${p.semantic_layer_status || ''}`) ? 15 : 0;
    const freshnessGap = /(stale|batch|manual|delayed|weekly|monthly)/i.test(`${p.freshness || ''} ${p.cadence || ''}`) ? 8 : 0;
    const controlGap = text(p.control_gap) ? 12 : 0;
    return qualityGap + semanticGap + freshnessGap + controlGap;
  })) {
    const p = record.payload || {};
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'data-foundation-readiness-gap',
      domain: 'Data quality',
      records: [record],
      headline: `${p.data_asset_name || p.integration_id || record.title} is not ready for trusted automation yet`,
      soWhat: `The corpus can now name the exact data asset/interface where quality, freshness, semantics, or controls are weak. That turns a generic data-platform concern into a specific unblocker for Moves and AI Tower.`,
      materiality: materiality(record.__score / 30),
      entityName: p.data_asset_name || p.integration_id || record.title,
      entityType: record.record_type,
      action: 'Open data readiness action',
      metrics: { quality_score: number(p.quality_score), freshness: p.freshness, semantic_layer_status: p.semantic_layer_status, control_gap: p.control_gap },
    }));
  }

  for (const record of topBy([...(byType.get('ai_automation_footprint') || []), ...(byType.get('security_risk_compliance') || [])], (row) => {
    const p = row.payload || {};
    const risk = severityRank(p.risk_tier || p.risk_severity);
    const statusGap = /(missing|not approved|review|gap|open|exception|pending|blocked)/i.test(`${p.evidence_status || ''} ${p.status || ''} ${p.next_gate || ''} ${p.gap_or_condition || ''}`) ? 20 : 0;
    const regulated = /(phi|pii|financial|hipaa|sox|finra|privacy|model risk)/i.test(JSON.stringify(p)) ? 10 : 0;
    return risk * 15 + statusGap + regulated;
  })) {
    const p = record.payload || {};
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'governed-ai-risk-gap',
      domain: 'AI Value',
      records: [record],
      headline: `${p.ai_asset_name || p.control_name || record.title} is ahead of governance evidence`,
      soWhat: `The AI/control signal is visible, but approval, evidence, or policy conditions are not closed. The correct CXO action is not to stop AI broadly; it is to gate the specific use case until evidence catches up.`,
      materiality: materiality(record.__score / 35),
      entityName: p.ai_asset_name || p.control_name || record.title,
      entityType: record.record_type,
      action: 'Review governance gate',
      metrics: { risk_tier: p.risk_tier, risk_severity: p.risk_severity, evidence_status: p.evidence_status, next_gate: p.next_gate, status: p.status },
    }));
  }

  for (const record of topBy([...(byType.get('operations_service_management') || []), ...(byType.get('platform_volumetrics') || [])], (row) => {
    const p = row.payload || {};
    return number(p.monthly_volume) / 10_000 + number(p.backlog_count) / 100 + number(p.mttr_hours) / 10 + number(p.failure_rate_30d_pct) * 2;
  })) {
    const p = record.payload || {};
    insights.push(insight({
      tenantKey,
      clientId,
      factsByRecord,
      ruleId: 'operational-backlog-automation-pressure',
      domain: 'Service',
      records: [record],
      headline: `${p.service_or_process || p.platform_or_system || record.title} has automation pressure from volume and backlog`,
      soWhat: `The context layer connects service volume, backlog, MTTR, and automation candidacy. This is the kind of signal that should drive Moves prioritization instead of one-off anecdotes.`,
      materiality: materiality(record.__score / 20),
      entityName: p.service_or_process || p.platform_or_system || record.title,
      entityType: record.record_type,
      action: 'Shape into Move',
      metrics: { monthly_volume: number(p.monthly_volume), backlog_count: number(p.backlog_count), mttr_hours: number(p.mttr_hours), failure_rate_30d_pct: number(p.failure_rate_30d_pct) },
    }));
  }

  return insights.filter((row) => row.derived_from_record_ids.length > 0 && row.derived_from_fact_ids.length > 0);
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

class Db {
  constructor(client) {
    this.client = client;
    this.columnCache = new Map();
  }
  async columns(table) {
    if (this.columnCache.has(table)) return this.columnCache.get(table);
    const result = await this.client.query(
      `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
      [table],
    );
    const columns = new Set(result.rows.map((row) => row.column_name));
    this.columnCache.set(table, columns);
    return columns;
  }
  async tableExists(table) {
    return (await this.columns(table)).size > 0;
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
    const conflict = conflictColumns.filter((column) => filtered.some((row) => Object.prototype.hasOwnProperty.call(row, column)));
    const columns = Object.keys(filtered[0]);
    const updateColumns = columns.filter((column) => !conflict.includes(column) && column !== 'id' && column !== 'created_at');
    let written = 0;
    for (let offset = 0; offset < filtered.length; offset += 100) {
      const batch = filtered.slice(offset, offset + 100);
      const params = [];
      const tuples = batch.map((row) => {
        const placeholders = columns.map((column) => {
          const value = row[column];
          params.push(value && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : value);
          return `$${params.length}`;
        });
        return `(${placeholders.join(', ')})`;
      });
      const onConflict = conflict.length
        ? `on conflict (${conflict.map(quoteIdent).join(', ')}) ${updateColumns.length ? `do update set ${updateColumns.map((column) => `${quoteIdent(column)} = excluded.${quoteIdent(column)}`).join(', ')}` : 'do nothing'}`
        : '';
      await this.client.query(
        `insert into ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) values ${tuples.join(', ')} ${onConflict}`,
        params,
      );
      written += batch.length;
    }
    return written;
  }
}

async function resolveClientId(db, clientConfig) {
  const columns = await db.columns('clients');
  const checks = [];
  if (columns.has('id')) checks.push({ sql: 'id = $1', params: [clientConfig.expectedClientId] });
  if (columns.has('tenant_key')) checks.push({ sql: 'tenant_key = any($1::text[])', params: [clientConfig.aliases] });
  if (columns.has('client_key')) checks.push({ sql: 'client_key = any($1::text[])', params: [clientConfig.aliases] });
  if (columns.has('slug')) checks.push({ sql: 'slug = any($1::text[])', params: [clientConfig.aliases] });
  if (columns.has('name')) checks.push({ sql: 'lower(name) = lower($1)', params: [clientConfig.name] });
  for (const check of checks) {
    const result = await db.client.query(`select id from clients where ${check.sql} limit 1`, check.params);
    if (result.rows[0]?.id) return result.rows[0].id;
  }
  throw new Error(`client_not_found:${clientConfig.key}`);
}

async function loadTenantContext(db, clientConfig) {
  const clientId = await resolveClientId(db, clientConfig);
  const records = (await db.client.query(
    `select id::text, client_id::text, tenant_key, canonical_record_id, record_type, title,
            source_file, source_row_number, confidence, freshness_status, payload
       from enterprise_context_records
      where tenant_key = any($1::text[])
        and lifecycle_state = 'active'`,
    [clientConfig.aliases],
  )).rows;
  const facts = (await db.client.query(
    `select id::text, record_id::text, fact_key, fact_text, source_file, source_row_number, evidence_pointer
       from enterprise_context_facts
      where tenant_key = any($1::text[])
        and lifecycle_state = 'active'`,
    [clientConfig.aliases],
  )).rows;
  const factsByRecord = new Map();
  for (const fact of facts) {
    const bucket = factsByRecord.get(fact.record_id) || [];
    bucket.push(fact);
    factsByRecord.set(fact.record_id, bucket);
  }
  return { clientId, records, facts, factsByRecord };
}

async function replaceInsights(db, tenantKey, aliases, insights) {
  if (!(await db.tableExists('context_insights'))) {
    throw new Error('context_insights_table_missing');
  }
  await db.client.query(
    `delete from context_insights
      where tenant_key = any($1::text[])
        and rule_id = any($2::text[])`,
    [aliases, RULE_IDS],
  );
  return db.upsert('context_insights', insights, ['tenant_key', 'rule_id', 'entity_name']);
}

async function verifyInsights(db, clientConfig) {
  if (!(await db.tableExists('context_insights'))) {
    throw new Error('context_insights_table_missing');
  }
  const result = await db.client.query(
    `select
        count(*)::int as total,
        count(*) filter (where cardinality(derived_from_record_ids) > 0)::int as with_records,
        count(*) filter (where cardinality(derived_from_fact_ids) > 0)::int as with_facts,
        count(distinct rule_id)::int as rules
       from context_insights
      where tenant_key = $1
        and lifecycle_state = 'active'
        and rule_id = any($2::text[])`,
    [clientConfig.key, RULE_IDS],
  );
  const row = result.rows[0] || { total: 0, with_records: 0, with_facts: 0, rules: 0 };
  if (row.total < 6) throw new Error(`context_insights_verify_too_few:${clientConfig.key}:${row.total}`);
  if (row.total !== row.with_records) throw new Error(`context_insights_verify_missing_records:${clientConfig.key}`);
  if (row.total !== row.with_facts) throw new Error(`context_insights_verify_missing_facts:${clientConfig.key}`);
  return row;
}

async function run() {
  const mode = command();
  const clients = selectedClients();
  if (!clients.length) throw new Error('no_clients_selected');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const db = new Db(pg);
  try {
    const receipt = { event: 'context_insight_materializer', mode, as_of_date: AS_OF_DATE, tenants: {} };
    for (const clientConfig of clients) {
      const tenant = await loadTenantContext(db, clientConfig);
      const insights = deriveInsightsFromRows({
        tenantKey: clientConfig.key,
        clientId: tenant.clientId,
        records: tenant.records,
        factsByRecord: tenant.factsByRecord,
      });
      const byRule = insights.reduce((acc, row) => {
        acc[row.rule_id] = (acc[row.rule_id] || 0) + 1;
        return acc;
      }, {});
      const tenantReceipt = {
        client_id: tenant.clientId,
        records_read: tenant.records.length,
        facts_read: tenant.facts.length,
        candidate_insights: insights.length,
        by_rule: byRule,
      };
      if (mode === 'apply') {
        tenantReceipt.written = await replaceInsights(db, clientConfig.key, clientConfig.aliases, insights);
      }
      if (mode === 'verify') {
        tenantReceipt.verify = await verifyInsights(db, clientConfig);
      }
      receipt.tenants[clientConfig.key] = tenantReceipt;
    }
    console.log(JSON.stringify(receipt, null, 2));
  } finally {
    await pg.end();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(JSON.stringify({
      event: 'context_insight_materializer_failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    process.exit(1);
  });
}

module.exports = {
  deriveInsightsFromRows,
  RULE_IDS,
  stableUuid,
  dateDistanceDays,
  formatUsd,
};

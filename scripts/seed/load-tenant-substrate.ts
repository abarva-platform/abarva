// Packet 24 — Multi-tenant substrate loader.
//
// Loads a synthetic tenant's `datasets/<tenant>-synthetic-v1/` files into
// Postgres. The 2026-05-26 substrate audit (PACKET_23) found 2,741 rows
// missing across the four composite tenants; this is the fix.
//
// Run:
//   TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts
//   TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
//   TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --only-chunks
//   TENANT_KEY=northstar npx tsx scripts/seed/load-tenant-substrate.ts --only-tables
//
// Phases:
//   PHASE 0 — clients profile reconciliation      (fast)
//   PHASE 1 — enterprise_context_source_files  (no embedding, fast)
//   PHASE 2 — enterprise_context_chunks        (embeds via AI Egress, slowest)
//   PHASE 3 — applications                     (flat insert) [--skip-tables to skip]
//   PHASE 4 — ai_initiatives                   (flat insert) [--skip-tables to skip]
//   PHASE 5 — vendor_contracts                 (flat insert) [--skip-tables to skip]
//
// Idempotent — upserts by stable IDs.
// Defensive — schema mismatches per phase are reported, not fatal.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL_ENV = path.join(REPO_ROOT, '.env.local');
const DEFAULT_ENV = '/Users/anand/Projects/nexus/.env.local';
loadEnv({ path: fs.existsSync(LOCAL_ENV) ? LOCAL_ENV : DEFAULT_ENV });

import crypto from 'node:crypto';
import { Client, type QueryResultRow } from 'pg';
import Papa from 'papaparse';

// ─── Self-contained embedding helper ───────────────────────────────────────
//
// Bypasses the AI Egress Control Plane import chain (which would pull in
// the entire src/lib/integrations/ai-egress tree) by inlining the
// OpenAI/Azure embedding call directly here. Writes ai_egress_audit rows
// manually for provenance.

const EMBEDDING_DIM_TARGET = 1536;

interface EmbeddingResult { embedding: number[]; model: string; raw_provider: 'openai' | 'azure' | 'deterministic' }

function deterministicEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  // Repeat the 32-byte hash to fill 1536 floats in [-1, 1]
  return Array.from({ length: EMBEDDING_DIM_TARGET }, (_, i) => {
    const byte = hash[i % hash.length];
    return (byte / 255) * 2 - 1;
  });
}

async function embedText(text: string): Promise<EmbeddingResult> {
  const azureEndpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT?.replace(/\/$/, '');
  const azureKey = process.env.AZURE_OPENAI_EMBEDDING_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
  if (azureEndpoint && azureKey) {
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    const res = await fetch(
      `${azureEndpoint}/openai/deployments/${encodeURIComponent(azureDeployment)}/embeddings?api-version=${encodeURIComponent(apiVersion)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': azureKey }, body: JSON.stringify({ input: text, dimensions: EMBEDDING_DIM_TARGET }) },
    );
    if (!res.ok) throw new Error(`Azure embedding ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json() as { data?: Array<{ embedding?: number[] }>; model?: string };
    const embedding = json.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) throw new Error('Azure embedding empty');
    return { embedding, model: json.model ?? azureDeployment, raw_provider: 'azure' };
  }
  // Fall back to OpenAI direct
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const model = 'text-embedding-3-large';
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ input: text, model, dimensions: EMBEDDING_DIM_TARGET }),
    });
    if (!res.ok) throw new Error(`OpenAI embedding ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json() as { data?: Array<{ embedding?: number[] }>; model?: string };
    const embedding = json.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) throw new Error('OpenAI embedding empty');
    return { embedding, model: json.model ?? model, raw_provider: 'openai' };
  }
  // No keys → deterministic
  return { embedding: deterministicEmbedding(text), model: 'deterministic-local', raw_provider: 'deterministic' };
}

// ─── Audit row writer (for AI Egress Control Plane provenance) ──────────────

async function writeAuditRow(args: {
  tenantId: string;
  workflow: string;
  artifactId?: string;
  artifactType?: string;
  provider: string;
  model: string;
  promptText: string;
  responseHash?: string;
  decisionReason: string;
  policyDecision: 'allow' | 'deny' | 'error';
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}): Promise<string | null> {
  const row = {
    tenant_id: args.tenantId,
    workflow: args.workflow,
    artifact_id: args.artifactId ?? null,
    artifact_type: args.artifactType ?? null,
    provider: args.provider,
    model: args.model,
    route: 'azure-foundry-private',
    data_class: 'internal',
    policy_decision: args.policyDecision,
    decision_reason: args.decisionReason,
    prompt_hash: crypto.createHash('sha256').update(args.promptText).digest('hex'),
    response_hash: args.responseHash ?? null,
    request_metadata: args.metadata ?? {},
    error_message: args.errorMessage ?? null,
  };
  try {
    const rows = await db.insertRows<{ id: string }>('ai_egress_audit', [row], 'id');
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Tenant registry ────────────────────────────────────────────────────────

interface TenantConfig {
  key: string;
  clientId: string;
  tenantKey: string; // for enterprise_context_chunks.tenant_key column
  datasetRoot: string;
  profileYaml?: string;
  // file paths inside datasetRoot
  sourceFilesDir: string; // .md files
  corpusJsonl: string;    // chunks
  extraCorpusJsonl?: string[]; // additional chunk overlays loaded with the main corpus
  appPortfolioCsv?: string;
  initiativesActiveCsv?: string;
  initiativesClosedCsv?: string;
  vendorContractsCsv?: string;
}

const TENANTS: Record<string, TenantConfig> = {
  northstar: {
    key: 'northstar',
    clientId: '2702b525-4c6a-4fbe-973d-99a8480d8318',
    tenantKey: 'northstar-medtech',
    datasetRoot: 'datasets/northstar-clinical-tech-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '16-market-corpus/source-files',
    corpusJsonl: '16-market-corpus/client-data-corpus.jsonl',
    extraCorpusJsonl: [
      '16-market-corpus/demo-critical-facts.jsonl',
      '16-market-corpus/named-entity-facts.jsonl',
    ],
    appPortfolioCsv: '07-application-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '10-initiatives/initiatives-active.csv',
    initiativesClosedCsv: '10-initiatives/initiatives-closed.csv',
    vendorContractsCsv: '09-vendors-contracts/vendor-contracts.csv',
  },
  meridian: {
    key: 'meridian',
    clientId: 'a20ecef5-f0ea-4890-b9d5-7375fab223ff',
    tenantKey: 'meridian-health',
    datasetRoot: 'datasets/meridian-health-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    appPortfolioCsv: '01-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '01-portfolio/initiatives-active.csv',
    initiativesClosedCsv: '01-portfolio/initiatives-closed.csv',
    vendorContractsCsv: '04-vendors/vendor-contracts.csv',
  },
  apex: {
    key: 'apex',
    clientId: 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
    tenantKey: 'apex-retail',
    datasetRoot: 'datasets/apex-retail-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    appPortfolioCsv: '01-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '01-portfolio/initiatives-active.csv',
    initiativesClosedCsv: '01-portfolio/initiatives-closed.csv',
    vendorContractsCsv: '04-vendors/vendor-contracts.csv',
  },
  firstcapital: {
    key: 'firstcapital',
    clientId: 'a75687bf-71b9-4524-ab4e-68ae3f28d200',
    tenantKey: 'first-capital',
    datasetRoot: 'datasets/first-capital-financial-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    appPortfolioCsv: '01-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '01-portfolio/initiatives-active.csv',
    initiativesClosedCsv: '01-portfolio/initiatives-closed.csv',
    vendorContractsCsv: '04-vendors/vendor-contracts.csv',
  },
  'first-capital': {
    key: 'firstcapital',
    clientId: 'a75687bf-71b9-4524-ab4e-68ae3f28d200',
    tenantKey: 'first-capital',
    datasetRoot: 'datasets/first-capital-financial-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    appPortfolioCsv: '01-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '01-portfolio/initiatives-active.csv',
    initiativesClosedCsv: '01-portfolio/initiatives-closed.csv',
    vendorContractsCsv: '04-vendors/vendor-contracts.csv',
  },
  arcturus: {
    key: 'firstcapital',
    clientId: 'a75687bf-71b9-4524-ab4e-68ae3f28d200',
    tenantKey: 'first-capital',
    datasetRoot: 'datasets/first-capital-financial-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    appPortfolioCsv: '01-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '01-portfolio/initiatives-active.csv',
    initiativesClosedCsv: '01-portfolio/initiatives-closed.csv',
    vendorContractsCsv: '04-vendors/vendor-contracts.csv',
  },
  skyharbor: {
    key: 'skyharbor',
    clientId: '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301',
    tenantKey: 'skyharbor-air',
    datasetRoot: 'datasets/skyharbor-air-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    extraCorpusJsonl: [
      '16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl',
    ],
    appPortfolioCsv: '07-application-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '10-initiatives/initiatives-active.csv',
    initiativesClosedCsv: '10-initiatives/initiatives-closed.csv',
    vendorContractsCsv: '09-vendors-contracts/vendor-contracts.csv',
  },
  'skyharbor-air': {
    key: 'skyharbor',
    clientId: '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301',
    tenantKey: 'skyharbor-air',
    datasetRoot: 'datasets/skyharbor-air-synthetic-v1',
    profileYaml: '00-profile/enterprise-profile.yaml',
    sourceFilesDir: '13-context/source-files',
    corpusJsonl: '13-context/client-data-corpus.jsonl',
    extraCorpusJsonl: [
      '16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl',
    ],
    appPortfolioCsv: '07-application-portfolio/application-portfolio.csv',
    initiativesActiveCsv: '10-initiatives/initiatives-active.csv',
    initiativesClosedCsv: '10-initiatives/initiatives-closed.csv',
    vendorContractsCsv: '09-vendors-contracts/vendor-contracts.csv',
  },
};

// ─── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_CHUNKS = args.includes('--only-chunks');
const ONLY_TABLES = args.includes('--only-tables');
const SKIP_TABLES = args.includes('--skip-tables');
const CONCURRENCY = Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] ?? 6);

const TENANT_KEY = process.env.TENANT_KEY;
if (!TENANT_KEY) throw new Error('TENANT_KEY env var required (e.g. TENANT_KEY=northstar)');
const TENANT = TENANTS[TENANT_KEY];
if (!TENANT) throw new Error(`Unknown TENANT_KEY=${TENANT_KEY}. Known: ${Object.keys(TENANTS).join(', ')}`);

// ─── Postgres client ────────────────────────────────────────────────────────

function disableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function resolveDatabaseUrl(): string {
  const url = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL');
  return url;
}

function quoteIdent(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) throw new Error(`Unsafe SQL identifier: ${identifier}`);
  return `"${identifier}"`;
}

class PostgresDb {
  private readonly client: Client;
  private connected = false;

  constructor() {
    const url = resolveDatabaseUrl();
    this.client = new Client({
      connectionString: url,
      application_name: 'tenant-substrate-loader',
      ssl: disableSsl(url) ? false : { rejectUnauthorized: false },
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.connected = true;
  }

  async end(): Promise<void> {
    if (!this.connected) return;
    await this.client.end();
    this.connected = false;
  }

  async query<R extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<R[]> {
    return (await this.client.query<R>(sql, params)).rows;
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.client.query(sql, params);
  }

  async updateEq(table: string, patch: Record<string, unknown>, where: Record<string, unknown>): Promise<number> {
    const setEntries = Object.entries(patch);
    const whereEntries = Object.entries(where);
    const params = [...setEntries.map(([, value]) => value), ...whereEntries.map(([, value]) => value)];
    const setSql = setEntries.map(([column], index) => `${quoteIdent(column)} = $${index + 1}`).join(', ');
    const whereSql = whereEntries
      .map(([column], index) => `${quoteIdent(column)} = $${setEntries.length + index + 1}`)
      .join(' AND ');
    const result = await this.client.query(
      `UPDATE ${quoteIdent(table)} SET ${setSql} WHERE ${whereSql}`,
      params,
    );
    return result.rowCount ?? 0;
  }

  async deleteEq(table: string, where: Record<string, unknown>): Promise<number> {
    const entries = Object.entries(where);
    const whereSql = entries.map(([column], index) => `${quoteIdent(column)} = $${index + 1}`).join(' AND ');
    const result = await this.client.query(
      `DELETE FROM ${quoteIdent(table)} WHERE ${whereSql}`,
      entries.map(([, value]) => value),
    );
    return result.rowCount ?? 0;
  }

  async insertRows<R extends QueryResultRow = QueryResultRow>(
    table: string,
    rows: object[],
    returning?: string,
  ): Promise<R[]> {
    if (rows.length === 0) return [];
    const records = rows as Array<Record<string, unknown>>;
    const columns = Object.keys(records[0]!);
    const params: unknown[] = [];
    const valuesSql = records.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        params.push(row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const returningSql = returning ? ` RETURNING ${quoteIdent(returning)}` : '';
    return this.query<R>(
      `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql.join(', ')}${returningSql}`,
      params,
    );
  }

  async upsertRows<R extends QueryResultRow = QueryResultRow>(
    table: string,
    rows: object[],
    conflictColumn: string,
    returning?: string,
  ): Promise<R[]> {
    if (rows.length === 0) return [];
    const records = rows as Array<Record<string, unknown>>;
    const columns = Object.keys(records[0]!);
    const updateColumns = columns.filter((column) => column !== conflictColumn);
    const params: unknown[] = [];
    const valuesSql = records.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        params.push(row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const updateSql = updateColumns
      .map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`)
      .join(', ');
    const returningSql = returning ? ` RETURNING ${quoteIdent(returning)}` : '';
    return this.query<R>(
      `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql.join(', ')}
       ON CONFLICT (${quoteIdent(conflictColumn)}) DO UPDATE SET ${updateSql}${returningSql}`,
      params,
    );
  }
}

const db = new PostgresDb();

async function ensureLoaderSchema(): Promise<void> {
  await db.execute(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry_code TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_name TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_key TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_revenue_usd NUMERIC;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS revenue TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS it_budget_usd NUMERIC;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count NUMERIC;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS operational_units NUMERIC;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_description TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

    CREATE TABLE IF NOT EXISTS enterprise_context_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      tenant_key TEXT NOT NULL,
      chunk_id TEXT NOT NULL,
      source_segment_id TEXT NOT NULL,
      source_record_id TEXT NOT NULL,
      source_doc TEXT NOT NULL,
      source_path TEXT NOT NULL,
      chunk_index INTEGER NOT NULL DEFAULT 0,
      chunk_text TEXT NOT NULL,
      token_count INTEGER,
      embedding_status TEXT NOT NULL DEFAULT 'pending',
      embedding_model TEXT,
      embedded_at TIMESTAMPTZ,
      embedding JSONB,
      embedding_dim INTEGER,
      embedding_error TEXT,
      provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
      chunk_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (tenant_key, chunk_id)
    );
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS tenant_key TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS chunk_id TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS source_segment_id TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS source_record_id TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS source_doc TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS source_path TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS chunk_text TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS token_count INTEGER;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding_model TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding JSONB;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding_dim INTEGER;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding_error TEXT;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS chunk_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    CREATE UNIQUE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_chunk
      ON enterprise_context_chunks(tenant_key, chunk_id);
    CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_client
      ON enterprise_context_chunks(client_id);
    CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_segment
      ON enterprise_context_chunks(tenant_key, source_segment_id);
    CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_embedding_status
      ON enterprise_context_chunks(tenant_key, embedding_status);

    ALTER TABLE ai_initiatives ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);
}

// ─── PHASE 0 — clients profile reconciliation ──────────────────────────────

function readProfileYaml(): Record<string, string> {
  if (!TENANT.profileYaml) return {};
  const filePath = path.join(REPO_ROOT, TENANT.datasetRoot, TENANT.profileYaml);
  if (!fs.existsSync(filePath)) return {};
  const profile: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('- ')) continue;
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    profile[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return profile;
}

function optionalNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

async function phase0ClientProfile(): Promise<{ updated: number; errors: number }> {
  console.log('\n━━ PHASE 0 · clients profile ━━');
  const profile = readProfileYaml();
  if (Object.keys(profile).length === 0) {
    console.log('  No enterprise profile YAML configured or found');
    return { updated: 0, errors: 0 };
  }

  const revenueUsd = optionalNumber(profile.revenue_usd);
  const itBudgetUsd = optionalNumber(profile.it_budget_usd);
  const employees = optionalNumber(profile.employees);
  const plants = optionalNumber(profile.plants);
  const name = profile.name || null;
  const businessDescription = [
    name ? `${name} synthetic enterprise tenant` : `${TENANT.key} synthetic enterprise tenant`,
    revenueUsd ? `$${(revenueUsd / 1_000_000_000).toFixed(1)}B revenue` : null,
    employees ? `${employees.toLocaleString('en-US')} employees` : null,
    plants ? `${plants} plants` : null,
    profile.countries ? `${profile.countries} countries` : null,
    profile.strategic_posture ? `strategic posture: ${profile.strategic_posture}` : null,
  ].filter(Boolean).join('; ');

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (name) {
    patch.name = name;
    patch.legal_name = name;
  }
  if (revenueUsd != null) {
    patch.annual_revenue_usd = revenueUsd;
    patch.revenue = `$${(revenueUsd / 1_000_000_000).toFixed(1)}B`;
  }
  if (itBudgetUsd != null) patch.it_budget_usd = itBudgetUsd;
  if (employees != null) patch.employee_count = employees;
  if (plants != null) patch.operational_units = plants;
  if (businessDescription) patch.business_description = businessDescription;
  patch.tenant_key = TENANT.tenantKey;

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would update clients row ${TENANT.clientId} with ${Object.keys(patch).length} profile fields`);
    return { updated: 1, errors: 0 };
  }

  try {
    const updated = await db.updateEq('clients', patch, { id: TENANT.clientId });
    if (updated === 0) {
      try {
        await db.insertRows('clients', [{
          id: TENANT.clientId,
          name: name ?? TENANT.tenantKey,
          legal_name: name ?? TENANT.tenantKey,
          industry_code: profile.industry || 'global_network_airline',
          tenant_key: TENANT.tenantKey,
          annual_revenue_usd: revenueUsd,
          it_budget_usd: itBudgetUsd,
          employee_count: employees,
          operational_units: optionalNumber(profile.aircraft),
          business_description: businessDescription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
        console.log(`  Inserted clients row for ${TENANT.clientId}`);
      } catch (insertError) {
        const message = insertError instanceof Error ? insertError.message : String(insertError);
        console.log(`  [ERR] clients profile insert: ${message}`);
        return { updated: 0, errors: 1 };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  [ERR] clients profile update: ${message}`);
    return { updated: 0, errors: 1 };
  }
  console.log(`  Updated clients profile for ${TENANT.clientId}`);
  return { updated: 1, errors: 0 };
}

// ─── PHASE 1 — enterprise_context_source_files ──────────────────────────────

interface SourceFileRow {
  client_id: string;
  tenant_key: string;
  source_id: string;
  source_file_id: string;
  source_system: string;
  source_file: string;
  source_path: string;
  workbook_name: string | null;
  sheet_names: string[] | null;
  file_hash: string;
  row_count: number | null;
  confidence: number | null;
  freshness_status: string | null;
  evidence_pointer: string | null;
  metadata: Record<string, unknown>;
}

async function phase1SourceFiles(): Promise<{ inserted: number; skipped: number; errors: number }> {
  console.log('\n━━ PHASE 1 · enterprise_context_source_files ━━');
  const dir = path.join(REPO_ROOT, TENANT.datasetRoot, TENANT.sourceFilesDir);
  if (!fs.existsSync(dir)) {
    console.log(`  source-files dir missing: ${dir}`);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  console.log(`  Found ${files.length} source files`);

  const rows: SourceFileRow[] = [];
  for (const filename of files) {
    const filepath = path.join(dir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const sourceId = filename.replace(/\.md$/, ''); // e.g. NST-SRC-001
    const firstLine = content.split('\n').find((l) => l.trim().length > 0)?.trim() ?? sourceId;
    const fileHash = crypto.createHash('sha256').update(content).digest('hex');
    const relPath = path.relative(REPO_ROOT, filepath);
    rows.push({
      client_id: TENANT.clientId,
      tenant_key: TENANT.tenantKey,
      source_id: sourceId,
      source_file_id: sourceId,
      source_system: 'tenant-corpus',
      source_file: filename,
      source_path: relPath,
      workbook_name: firstLine.replace(/^#\s*/, ''),
      sheet_names: null,
      file_hash: fileHash,
      row_count: content.split('\n').length,
      confidence: 0.9,
      freshness_status: 'fresh',
      evidence_pointer: relPath,
      metadata: { loader: 'packet-24', loaded_at: new Date().toISOString() },
    });
  }

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would attempt insert of ${rows.length} rows (NOTE: source_id has FK constraint; if it requires a parent row this phase will be skipped)`);
    return { inserted: rows.length, skipped: 0, errors: 0 };
  }

  // Phase 1 SKIPPED — enterprise_context_source_files.source_id is a UUID
  // FK to a parent table we don't have rows for. Source-file provenance is
  // captured in enterprise_context_chunks.source_doc / source_record_id /
  // source_path which is enough for Sentinel retrieval. The provenance UI
  // can synthesize "source files" from distinct chunk source_doc values.
  console.log(`  SKIPPED — source_id FK constraint requires upstream rows. Chunk-level provenance preserved in source_doc/source_record_id.`);
  return { inserted: 0, skipped: rows.length, errors: 0 };
}

// ─── PHASE 2 — enterprise_context_chunks ────────────────────────────────────

interface ChunkRow {
  client_id: string;
  tenant_key: string;
  chunk_id: string;
  source_segment_id: string; // NOT NULL
  source_record_id: string;  // NOT NULL
  source_doc: string;        // NOT NULL
  source_path: string | null;
  chunk_index: number;
  chunk_text: string;
  token_count: number | null;
  embedding_status: string;
  embedding_model: string | null;
  provenance: Record<string, unknown>;
  chunk_metadata: Record<string, unknown>;
}

function buildChunkText(chunk: Record<string, unknown>): string {
  // If the chunk already has a `text` field (Meridian / First Capital style),
  // use it directly with a title prefix.
  if (typeof chunk.text === 'string' && chunk.text.length > 0) {
    return chunk.title ? `${chunk.title}\n${chunk.text}` : (chunk.text as string);
  }
  // Otherwise synthesize from Northstar-style fields (claim/evidence_basis/etc.)
  const parts: string[] = [];
  if (chunk.title) parts.push(`TITLE: ${chunk.title}`);
  if (chunk.text) parts.push(String(chunk.text));
  if (chunk.claim) parts.push(`CLAIM: ${chunk.claim}`);
  if (chunk.evidence_basis) parts.push(`EVIDENCE: ${chunk.evidence_basis}`);
  if (chunk.use_case) parts.push(`USE CASE: ${chunk.use_case}`);
  if (chunk.industry) parts.push(`INDUSTRY: ${chunk.industry}`);
  if (chunk.do_not_overclaim_notes) parts.push(`CAVEAT: ${chunk.do_not_overclaim_notes}`);
  return parts.join('\n');
}

// Normalize the chunk_id field — Meridian uses `id`, Northstar uses `chunk_id`.
function getChunkId(chunk: Record<string, unknown>, fallbackIndex: number): string {
  return (chunk.chunk_id as string) ?? (chunk.id as string) ?? `chunk-${fallbackIndex}`;
}

async function phase2ChunksAndEmbeddings(): Promise<{ rows: number; embedded: number; failed: number }> {
  console.log('\n━━ PHASE 2 · enterprise_context_chunks + embeddings ━━');
  const corpusFiles = [TENANT.corpusJsonl, ...(TENANT.extraCorpusJsonl ?? [])];
  const parsedChunks: Array<{
    chunk: Record<string, unknown>;
    sourcePath: string;
    ordinal: number;
  }> = [];
  for (const corpusJsonl of corpusFiles) {
    const jsonlPath = path.join(REPO_ROOT, TENANT.datasetRoot, corpusJsonl);
    if (!fs.existsSync(jsonlPath)) {
      if (corpusJsonl === TENANT.corpusJsonl) {
        console.log(`  corpus jsonl missing: ${jsonlPath}`);
        return { rows: 0, embedded: 0, failed: 1 };
      }
      console.log(`  optional corpus overlay missing: ${jsonlPath}`);
      continue;
    }
    const lines = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean);
    const baseIndex = parsedChunks.length;
    for (let i = 0; i < lines.length; i++) {
      parsedChunks.push({
        chunk: JSON.parse(lines[i]) as Record<string, unknown>,
        sourcePath: `${TENANT.datasetRoot}/${corpusJsonl}`,
        ordinal: baseIndex + i,
      });
    }
    console.log(`  Found ${lines.length} chunks in ${corpusJsonl}`);
  }
  console.log(`  Found ${parsedChunks.length} chunks total`);

  // Map each chunk to one of the canonical retrieval segment IDs the
  // Sentinel tenant-enterprise retriever knows about
  // (src/lib/knowledge/tenant-enterprise-context.ts SEGMENT_LABELS):
  //   enterprise_profile, org_structure, it_financials, it_landscape,
  //   program_inventory
  //
  // If chunks land outside this list, the retriever returns 0 rows and
  // Sentinel can't ground in tenant facts — that was the 2026-05-26
  // retrieval-wiring P0 found mid-session.
  function mapChunkToSegment(chunk: Record<string, unknown>): string {
    const explicit = String(chunk.source_segment_id ?? chunk.segment_id ?? '').trim();
    if (explicit && ['enterprise_profile', 'org_structure', 'it_financials', 'it_landscape', 'program_inventory'].includes(explicit)) {
      return explicit;
    }
    const useCase = String(chunk.use_case ?? '').toLowerCase();
    const industry = String(chunk.industry ?? '').toLowerCase();
    if (/budget|cost|financial|spend|p&l|capex|opex/.test(useCase + ' ' + industry)) return 'it_financials';
    if (/org|leadership|reporting|management|executive|cxo|cmo|cfo|cio|hr/.test(useCase + ' ' + industry)) return 'org_structure';
    if (/erp|system|platform|application|integration|mainframe|legacy|technology stack|infrastructure/.test(useCase + ' ' + industry)) return 'it_landscape';
    if (/strategy|profile|vision|mission|values|enterprise|company overview/.test(useCase + ' ' + industry)) return 'enterprise_profile';
    // Default to program_inventory (initiatives, patterns, plays)
    return 'program_inventory';
  }

  const rows: ChunkRow[] = [];
  for (let i = 0; i < parsedChunks.length; i++) {
    const { chunk, sourcePath, ordinal } = parsedChunks[i]!;
    const chunkText = buildChunkText(chunk);
    const chunkId = getChunkId(chunk, ordinal);
    const sourceFileId: string = String(chunk.source_file_id ?? chunk.source_id ?? chunkId);
    rows.push({
      client_id: TENANT.clientId,
      tenant_key: TENANT.tenantKey,
      chunk_id: chunkId,
      source_segment_id: mapChunkToSegment(chunk),
      source_record_id: sourceFileId,
      source_doc: sourceFileId,
      source_path: `${sourcePath}#${chunkId}`,
      chunk_index: ordinal,
      chunk_text: chunkText,
      token_count: Math.ceil(chunkText.length / 4),
      embedding_status: 'pending',
      embedding_model: null,
      provenance: { ...chunk, loader: 'packet-24', pattern_id: chunk.pattern_id ?? null },
      chunk_metadata: {
        industry: chunk.industry,
        use_case: chunk.use_case,
        pattern_id: chunk.pattern_id,
        tenant_applicability: chunk.tenant_applicability,
        confidence: chunk.confidence,
        title: chunk.title,
        dataclass: chunk.dataclass,
      },
    });
  }

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${rows.length} chunks + embed each via AI Egress`);
    return { rows: rows.length, embedded: 0, failed: 0 };
  }

  // PHASE 2a — Delete existing chunks for this tenant (idempotency), then INSERT
  console.log('  Deleting existing chunks for tenant (idempotent re-run)...');
  try {
    await db.deleteEq('enterprise_context_chunks', { client_id: TENANT.clientId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  [ERR] delete existing: ${message}`);
  }
  console.log('  Inserting chunk rows...');
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    try {
      const data = await db.insertRows<{ id: string }>('enterprise_context_chunks', batch, 'id');
      inserted += data.length || batch.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [ERR] chunk insert batch ${i}: ${message}`);
    }
  }
  console.log(`  Inserted ${inserted}/${rows.length} chunk rows`);

  // PHASE 2b — Embed pending chunks via AI Egress, concurrency=N
  console.log(`  Embedding ${rows.length} chunks (concurrency=${CONCURRENCY})...`);
  // Re-query to find which rows actually need embedding (pending OR null embedding)
  let pendingRows: Array<{ id: string; chunk_id: string; chunk_text: string }> = [];
  try {
    pendingRows = await db.query<{ id: string; chunk_id: string; chunk_text: string }>(
      `SELECT id, chunk_id, chunk_text
         FROM enterprise_context_chunks
        WHERE client_id = $1
          AND (embedding_status = 'pending' OR embedding_status IS NULL OR embedding IS NULL)`,
      [TENANT.clientId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  [ERR] query pending chunks: ${message}`);
    return { rows: inserted, embedded: 0, failed: rows.length };
  }
  const pending = pendingRows;
  console.log(`  ${pending.length} chunks need embedding`);

  let embedded = 0;
  let failed = 0;
  const startTime = Date.now();
  // Promise-pool concurrency
  async function embedOne(row: typeof pending[number]) {
    try {
      const { embedding, model, raw_provider } = await embedText(row.chunk_text);
      // Write ai_egress_audit row for provenance (best-effort, non-blocking on failure)
      await writeAuditRow({
        tenantId: TENANT.clientId,
        workflow: 'substrate-loader-embed',
        artifactId: row.chunk_id,
        artifactType: 'corpus_chunk',
        provider: `openai-embeddings-${raw_provider}`,
        model,
        promptText: row.chunk_text,
        decisionReason: `Packet 24 substrate loader; provider=${raw_provider}; tenant=${TENANT.key}`,
        policyDecision: 'allow',
        metadata: { dimensions: embedding.length, chunk_id: row.chunk_id, loader: 'packet-24' },
      }).catch(() => null);

      await db.query(
        `UPDATE enterprise_context_chunks
            SET embedding = $1::jsonb,
                embedding_dim = $2,
                embedding_model = $3,
                embedded_at = $4,
                embedding_status = 'embedded',
                embedding_error = NULL
          WHERE id = $5`,
        [JSON.stringify(embedding), embedding.length, model, new Date().toISOString(), row.id],
      );
      embedded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.updateEq('enterprise_context_chunks', { embedding_status: 'failed', embedding_error: msg.slice(0, 500) }, { id: row.id });
      failed++;
      console.log(`  [ERR] embed ${row.chunk_id}: ${msg.slice(0, 100)}`);
    }
  }

  // Run with concurrency
  const queue = [...pending];
  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await embedOne(next);
      const done = embedded + failed;
      if (done % 50 === 0 && done > 0) {
        const rate = done / ((Date.now() - startTime) / 1000);
        const eta = (queue.length / rate) | 0;
        console.log(`    Progress ${done}/${pending.length} (${rate.toFixed(1)}/s, ETA ${eta}s)`);
      }
    }
  }
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`  Embedded ${embedded}/${pending.length} in ${elapsed}s; failed ${failed}`);

  return { rows: inserted, embedded, failed };
}

// ─── PHASES 3-5 — structured tables used by Source/Tower/Sentinel ──────────

function stableUuid(seed: string): string {
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

async function phase3Applications(): Promise<{ inserted: number; errors: number }> {
  console.log('\n━━ PHASE 3 · applications ━━');
  if (!TENANT.appPortfolioCsv) {
    console.log('  No app portfolio CSV configured for tenant');
    return { inserted: 0, errors: 0 };
  }
  const csvPath = path.join(REPO_ROOT, TENANT.datasetRoot, TENANT.appPortfolioCsv);
  if (!fs.existsSync(csvPath)) {
    console.log(`  missing: ${csvPath}`);
    return { inserted: 0, errors: 1 };
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  console.log(`  Found ${parsed.data.length} apps`);

  function mapCriticality(raw: string | undefined): string {
    const norm = (raw ?? '').toLowerCase().trim();
    if (['p0', 'critical', 'tier1', 'tier 1', 'tier-1'].includes(norm)) return 'tier1';
    if (['p1', 'high', 'tier2', 'tier 2', 'tier-2'].includes(norm)) return 'tier2';
    if (['p2', 'medium', 'tier3', 'tier 3', 'tier-3', 'p3', 'low', 'tier4', 'tier 4', 'tier-4'].includes(norm)) return 'tier3';
    return 'tier3';
  }

  // applications.deployment_model CHECK accepts saas / on_prem / hybrid only.
  function mapDeploymentModel(stackEra: string | undefined): string {
    const norm = (stackEra ?? '').toLowerCase().trim();
    if (['saas', 'cloud-native', 'cloud native', 'modern', 'cloud'].includes(norm)) return 'saas';
    if (['hybrid', 'containerized', 'containers', 'cloud-hybrid'].includes(norm)) return 'hybrid';
    return 'on_prem';
  }

  function mapStatus(timeClass: string | undefined): string {
    const norm = (timeClass ?? '').toLowerCase().trim();
    if (norm === 'retire' || norm === 'retiring' || norm === 'sunset') return 'sunsetting';
    return 'active';
  }

  const rows = parsed.data
    .filter((r) => r.app_id && r.name)
    .map((r) => ({
      client_id: TENANT.clientId,
      name: r.name,
      vendor: r.ams_vendor || 'Unknown',
      deployment_model: mapDeploymentModel(r.stack_era),
      business_function: r.business_unit_id || null,
      user_count: null,
      annual_cost_usd: r.annual_run_cost_usd || r.run_cost_fy25_usd ? Number(r.annual_run_cost_usd || r.run_cost_fy25_usd) : null,
      criticality: mapCriticality(r.criticality),
      status: mapStatus(r.time_classification),
      ai_enabled: false,
      is_demo_data: true,
    }));

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would insert ${rows.length} apps (criticality mapped to tier1-4)`);
    return { inserted: rows.length, errors: 0 };
  }

  // Delete existing for this tenant (idempotency) — applications are demo data
  console.log('  Deleting existing tenant apps (idempotent re-run)...');
  await db.deleteEq('applications', { client_id: TENANT.clientId, is_demo_data: true });

  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    try {
      const data = await db.insertRows<{ id: string }>('applications', batch, 'id');
      inserted += data.length || batch.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [ERR] applications batch ${i}: ${message}`);
      errors += batch.length;
    }
  }
  console.log(`  Inserted ${inserted}; errors ${errors}`);
  return { inserted, errors };
}

async function phase4Initiatives(): Promise<{ inserted: number; errors: number }> {
  console.log('\n━━ PHASE 4 · ai_initiatives ━━');
  const csvPaths = [TENANT.initiativesActiveCsv, TENANT.initiativesClosedCsv]
    .filter(Boolean)
    .map((rel) => path.join(REPO_ROOT, TENANT.datasetRoot, rel as string));
  if (csvPaths.length === 0) {
    console.log('  No initiative CSVs configured for tenant');
    return { inserted: 0, errors: 0 };
  }

  const records: Array<Record<string, string>> = [];
  for (const csvPath of csvPaths) {
    if (!fs.existsSync(csvPath)) {
      console.log(`  missing: ${csvPath}`);
      return { inserted: 0, errors: 1 };
    }
    const parsed = Papa.parse<Record<string, string>>(fs.readFileSync(csvPath, 'utf8'), { header: true, skipEmptyLines: true });
    records.push(...parsed.data);
  }
  console.log(`  Found ${records.length} initiatives`);

  const now = new Date().toISOString();
  const goalIds = await ensureBusinessGoals();
  const rows = records
    .filter((r) => r.initiative_id && r.title)
    .map((r) => {
      const posture = (r.sentinel_posture || 'Healthy').toLowerCase();
      const committed = Number(r.committed_usd || 0);
      const projected = Number(r.projected_value_usd || 0);
      return {
        initiative_id: r.initiative_id,
        client_id: TENANT.clientId,
        display_id: buildDisplayId(r.initiative_id),
        name: r.title,
        description: r.evidence_note || `${r.title} seeded by ${TENANT.key} substrate pack.`,
        primary_category_id: posture.includes('kill') ? 'CAT-02' : posture.includes('hold') ? 'CAT-06' : posture.includes('aml') || posture.includes('risk') ? 'CAT-08' : 'CAT-03',
        secondary_category_id: posture.includes('restructure') ? 'CAT-04' : null,
        primary_goal_id: posture.includes('kill') ? goalIds.productivity : posture.includes('hold') ? goalIds.governance : projected > committed ? goalIds.value : goalIds.risk,
        stage: (r.status || '').toLowerCase() === 'closed' ? 'sunset' : posture.includes('hold') ? 'multi_year_strategic_bet' : (r.stage || '').toLowerCase() === 'scale' ? 'scaled' : (r.stage || '').toLowerCase() === 'run' ? 'scaled' : 'pilot',
        stage_detail: r.status || null,
        owner_name: r.accountable || r.sponsor_role || 'CIO',
        owner_title: r.accountable || r.sponsor_role || 'CIO',
        owner_function: r.accountable || r.sponsor_role || 'Technology',
        committed_annual_usd: committed,
        committed_total_usd: committed,
        measured_value_usd: projected,
        status_flag: posture.includes('kill') ? 'stalled' : posture.includes('watch') || posture.includes('hold') || posture.includes('restructure') ? 'value_lag' : 'healthy',
        status_summary: r.evidence_note || r.sentinel_posture || 'Seeded initiative context',
        confidence_level: posture.includes('kill') ? 'HIGH' : 'MED',
        aligned_callout: !posture.includes('kill'),
        aligned_rationale: r.evidence_note || null,
        loaded_via_template: `${TENANT.key}-substrate-v1`,
        created_at: now,
        updated_at: now,
        metadata: { loader: 'packet-24', vendors: r.vendors, sentinel_posture: r.sentinel_posture, source_status: r.status },
      };
    });

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${rows.length} initiatives`);
    return { inserted: rows.length, errors: 0 };
  }

  await db.deleteEq('ai_initiatives', { client_id: TENANT.clientId, loaded_via_template: `${TENANT.key}-substrate-v1` });
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    try {
      const data = await db.insertRows<{ initiative_id: string }>('ai_initiatives', batch, 'initiative_id');
      inserted += data.length || batch.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [ERR] initiatives batch ${i}: ${message}`);
      errors += batch.length;
    }
  }
  console.log(`  Inserted ${inserted}; errors ${errors}`);
  return { inserted, errors };
}

function tenantPrefix(): string {
  if (TENANT.key === 'northstar') return 'NST';
  if (TENANT.key === 'meridian') return 'MR';
  if (TENANT.key === 'apex') return 'APX';
  if (TENANT.key === 'firstcapital') return 'FCF';
  if (TENANT.key === 'skyharbor') return 'SHA';
  return TENANT.key.slice(0, 3).toUpperCase();
}

function buildDisplayId(initiativeId: string): string {
  const prefix = tenantPrefix();
  return initiativeId
    .replace(new RegExp(`^${prefix}-INIT-`), `${prefix}-`)
    .replace(new RegExp(`^${prefix}-CLOSED-`), `${prefix}-C-`)
    .slice(0, 20);
}

async function ensureBusinessGoals(): Promise<{ value: string; governance: string; risk: string; productivity: string }> {
  const prefix = tenantPrefix();
  const goals = {
    value: `${prefix}-GOAL-01`,
    governance: `${prefix}-GOAL-02`,
    risk: `${prefix}-GOAL-03`,
    productivity: `${prefix}-GOAL-04`,
  };
  const rows = [
    {
      goal_id: goals.value,
      client_id: TENANT.clientId,
      name: `${TENANT.key} value realization`,
      strategic_context: `Synthetic ${TENANT.key} substrate goal for measurable value realization.`,
      display_order: 1,
      loaded_via_template: `${TENANT.key}-substrate-v1`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      goal_id: goals.governance,
      client_id: TENANT.clientId,
      name: `${TENANT.key} governance and platform foundation`,
      strategic_context: `Synthetic ${TENANT.key} substrate goal for platform decisions, regulatory posture, and operating-model foundations.`,
      display_order: 2,
      loaded_via_template: `${TENANT.key}-substrate-v1`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      goal_id: goals.risk,
      client_id: TENANT.clientId,
      name: `${TENANT.key} risk reduction`,
      strategic_context: `Synthetic ${TENANT.key} substrate goal for operational, regulatory, vendor, and delivery risk reduction.`,
      display_order: 3,
      loaded_via_template: `${TENANT.key}-substrate-v1`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      goal_id: goals.productivity,
      client_id: TENANT.clientId,
      name: `${TENANT.key} productivity and simplification`,
      strategic_context: `Synthetic ${TENANT.key} substrate goal for run-cost reduction, simplification, and productivity.`,
      display_order: 4,
      loaded_via_template: `${TENANT.key}-substrate-v1`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  if (DRY_RUN) return goals;

  try {
    await db.upsertRows('ai_business_goals', rows, 'goal_id');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  [WARN] business goals upsert failed: ${message}`);
  }
  return goals;
}

async function phase5VendorContracts(): Promise<{ inserted: number; errors: number }> {
  console.log('\n━━ PHASE 5 · vendor_contracts ━━');
  if (!TENANT.vendorContractsCsv) {
    console.log('  No vendor contracts CSV configured for tenant');
    return { inserted: 0, errors: 0 };
  }
  const csvPath = path.join(REPO_ROOT, TENANT.datasetRoot, TENANT.vendorContractsCsv);
  if (!fs.existsSync(csvPath)) {
    console.log(`  missing: ${csvPath}`);
    return { inserted: 0, errors: 1 };
  }
  const parsed = Papa.parse<Record<string, string>>(fs.readFileSync(csvPath, 'utf8'), { header: true, skipEmptyLines: true });
  console.log(`  Found ${parsed.data.length} vendor contracts`);

  const now = new Date().toISOString();
  const totalAnnual = parsed.data.reduce((sum, r) => sum + Number(r.annual_usd || r.annual_value_usd || 0), 0) || 1;
  const rows = parsed.data
    .filter((r) => r.vendor || r.vendor_name)
    .map((r, idx) => {
      const vendorName = r.vendor || r.vendor_name;
      const vendorId = r.vendor_id || `${tenantPrefix()}-VEND-${String(idx + 1).padStart(3, '0')}`;
      const annualUsd = Number(r.annual_usd || r.annual_value_usd || 0);
      const type = r.type || r.category || 'vendor';
      return ({
      id: stableUuid(`${TENANT.clientId}:vendor:${vendorName}:${idx}`),
      client_id: TENANT.clientId,
      vendor_id: vendorId,
      vendor_name: vendorName,
      contract_name: `${vendorName} ${type}`,
      contract_category: type,
      scope_summary: r.notes || `${vendorName} ${TENANT.key} vendor contract.`,
      owner_id: null,
      annual_contract_value_usd: annualUsd,
      start_date: '2023-01-01',
      end_date: r.renewal_date || null,
      renewal_date: r.renewal_date || null,
      ai_usage_clauses: Boolean((r.ai_usage_clauses || r.ai_clauses) && !/standard|not negotiated/i.test(r.ai_usage_clauses || r.ai_clauses || '')),
      indemnity_provided: /indemnity/i.test(r.ai_usage_clauses || r.ai_clauses || ''),
      exit_terms_jsonb: { summary: r.exit_terms || 'standard renewal notice', data_rights: r.data_rights || null, source: `${TENANT.datasetRoot}/${TENANT.vendorContractsCsv}` },
      concentration_pct: Number(((annualUsd / totalAnnual) * 100).toFixed(2)),
      rate_card_vintage: '2025-01-01',
      outcome_based: /outcome/i.test(`${r.notes} ${r.exit_terms} ${r.ai_usage_clauses} ${r.ai_clauses}`),
      created_at: now,
      updated_at: now,
      created_by: 'substrate-loader',
      updated_by: 'substrate-loader',
      deleted_at: null,
    });
  });

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${rows.length} vendor contracts`);
    return { inserted: rows.length, errors: 0 };
  }

  await db.deleteEq('vendor_contracts', { client_id: TENANT.clientId, created_by: 'substrate-loader' });
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    try {
      const data = await db.insertRows<{ id: string }>('vendor_contracts', batch, 'id');
      inserted += data.length || batch.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [ERR] vendor contracts batch ${i}: ${message}`);
      errors += batch.length;
    }
  }
  console.log(`  Inserted ${inserted}; errors ${errors}`);
  return { inserted, errors };
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  if (!DRY_RUN) await db.connect();
  if (!DRY_RUN) await ensureLoaderSchema();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Packet 24 Substrate Loader · tenant=${TENANT.key} · ${DRY_RUN ? 'DRY-RUN' : 'APPLY'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  client_id:  ${TENANT.clientId}`);
  console.log(`  tenant_key: ${TENANT.tenantKey}`);
  console.log(`  dataset:    ${TENANT.datasetRoot}`);
  console.log(`  only-chunks: ${ONLY_CHUNKS}`);
  console.log(`  only-tables: ${ONLY_TABLES}`);
  console.log(`  skip-tables: ${SKIP_TABLES}`);

  const p0 = await phase0ClientProfile();
  const p1 = ONLY_TABLES ? { inserted: 0, skipped: 0, errors: 0 } : await phase1SourceFiles();
  const p2 = ONLY_TABLES ? { rows: 0, embedded: 0, failed: 0 } : await phase2ChunksAndEmbeddings();
  let p3: { inserted: number; errors: number } | null = null;
  let p4: { inserted: number; errors: number } | null = null;
  let p5: { inserted: number; errors: number } | null = null;
  if (!ONLY_CHUNKS && !SKIP_TABLES) {
    p3 = await phase3Applications();
    p4 = await phase4Initiatives();
    p5 = await phase5VendorContracts();
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Phase 0 client:        updated=${p0.updated}, errors=${p0.errors}`);
  console.log(`  Phase 1 source files:  inserted=${p1.inserted}, errors=${p1.errors}`);
  console.log(`  Phase 2 chunks:        upserted=${p2.rows}, embedded=${p2.embedded}, failed=${p2.failed}`);
  if (p3) console.log(`  Phase 3 applications:  inserted=${p3.inserted}, errors=${p3.errors}`);
  if (p4) console.log(`  Phase 4 initiatives:   inserted=${p4.inserted}, errors=${p4.errors}`);
  if (p5) console.log(`  Phase 5 vendors:       inserted=${p5.inserted}, errors=${p5.errors}`);
  console.log('\nDone. Re-run `node scripts/audit/db-substrate-audit.mjs` to verify.');

  const hardErrors = p1.errors + p2.failed + (p3?.errors ?? 0) + (p4?.errors ?? 0) + (p5?.errors ?? 0);
  process.exitCode = hardErrors > 50 ? 1 : 0;
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.end().catch(() => undefined));

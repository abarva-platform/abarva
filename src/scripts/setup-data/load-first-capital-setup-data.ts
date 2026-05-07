import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

type SegmentConfig = {
  familyNumber: number;
  segmentId: string;
  segmentName: string;
  dir: string;
  expectedRecordCount: number;
  expectedFreshnessDays: number;
  reasoningModes: string[];
};

type RecordSeed = {
  segmentId: string;
  recordId: string;
  title: string;
  recordKind: string;
  sourceDoc: string;
  sourcePath: string;
  sourceBasis: string;
  dataClassification: string;
  confidence: number | null;
  lastReviewed: string | null;
  recordText: string;
  recordPayload: Record<string, unknown>;
};

type GraphNode = {
  node_id: string;
  node_type: string;
  label: string;
  source_segment_id?: string;
  source_record_id?: string;
  source_doc?: string;
  data_classification?: string;
  confidence?: number | null;
  last_reviewed?: string | null;
  properties?: Record<string, unknown>;
};

type GraphEdge = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  source_segment_id?: string;
  source_record_id?: string;
  source_doc?: string;
  confidence?: number | null;
  properties?: Record<string, unknown>;
};

const TENANT_KEY = 'first-capital';
const SOURCE_BASIS = 'tenant_admin_upload';
const UPLOADED_BY = 'First Capital Financial synthetic dataset import · 2026-04-28';

const SEGMENTS: SegmentConfig[] = [
  { familyNumber: 1, segmentId: 'enterprise_profile', segmentName: 'Enterprise profile', dir: '01_enterprise_profile', expectedRecordCount: 1, expectedFreshnessDays: 90, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 2, segmentId: 'org_structure', segmentName: 'Org structure', dir: '02_org_structure', expectedRecordCount: 17, expectedFreshnessDays: 60, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 3, segmentId: 'it_landscape', segmentName: 'IT system landscape', dir: '03_it_landscape', expectedRecordCount: 22, expectedFreshnessDays: 90, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 4, segmentId: 'it_financials', segmentName: 'IT financials', dir: '04_it_financials', expectedRecordCount: 15, expectedFreshnessDays: 30, reasoningModes: ['tenant_grounded'] },
  { familyNumber: 5, segmentId: 'kpi_dictionary', segmentName: 'KPI dictionary', dir: '05_kpi_dictionary', expectedRecordCount: 90, expectedFreshnessDays: 60, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 6, segmentId: 'program_inventory', segmentName: 'Program inventory', dir: '06_program_inventory', expectedRecordCount: 5, expectedFreshnessDays: 14, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 7, segmentId: 'sourcing_artifacts', segmentName: 'Sourcing artifacts', dir: '07_sourcing_artifacts', expectedRecordCount: 15, expectedFreshnessDays: 14, reasoningModes: ['tenant_grounded'] },
  { familyNumber: 8, segmentId: 'program_deliverables', segmentName: 'Program deliverables', dir: '08_program_deliverables', expectedRecordCount: 5, expectedFreshnessDays: 14, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 9, segmentId: 'evidence_ledger', segmentName: 'Evidence ledger', dir: '09_evidence_ledger', expectedRecordCount: 20, expectedFreshnessDays: 30, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 10, segmentId: 'operating_telemetry', segmentName: 'Operating telemetry', dir: '10_operating_telemetry', expectedRecordCount: 25, expectedFreshnessDays: 7, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 11, segmentId: 'vendor_contracts', segmentName: 'Vendor and contract', dir: '11_vendor_contracts', expectedRecordCount: 22, expectedFreshnessDays: 60, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 12, segmentId: 'compliance', segmentName: 'Compliance and regulatory', dir: '12_compliance', expectedRecordCount: 25, expectedFreshnessDays: 90, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
  { familyNumber: 13, segmentId: 'industry_context', segmentName: 'Industry context', dir: '13_industry_context', expectedRecordCount: 1, expectedFreshnessDays: 90, reasoningModes: ['cross_corpus'] },
  { familyNumber: 14, segmentId: 'cross_program_signals', segmentName: 'Cross-program signals', dir: '14_cross_program_signals', expectedRecordCount: 11, expectedFreshnessDays: 7, reasoningModes: ['tenant_grounded', 'cross_corpus'] },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');
  const dryRun = args.includes('--dry-run');
  return {
    sourceRoot: sourceIdx >= 0 ? args[sourceIdx + 1] : path.resolve(process.cwd(), 'src/scripts/setup-data/first-capital-data'),
    dryRun,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function basenameNoExt(file: string): string {
  return path.basename(file, path.extname(file));
}

function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function confidenceFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1 ? value / 100 : value;
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('high')) return 0.9;
  if (normalized.includes('medium')) return 0.75;
  if (normalized.includes('low')) return 0.55;
  const number = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(number) ? (number > 1 ? number / 100 : number) : null;
}

function pickTitle(payload: Record<string, unknown>, fallback: string): string {
  for (const key of ['title', 'name', 'kpi_name', 'metric_name', 'vendor_name', 'tool_name', 'system_name', 'claim', 'decision', 'metric', 'category', 'template_id', 'id']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function pickId(payload: Record<string, unknown>, fallback: string): string {
  for (const key of ['id', 'record_id', 'signal_id', 'compliance_id', 'artifact_id', 'evidence_id', 'metric_id', 'deliverable_id', 'program_id', 'person_id', 'system_id', 'tool_id', 'kpi_id', 'contract_id', 'vendor_id', 'template_id']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return slugify(value.trim());
  }
  return slugify(fallback);
}

function textFromPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return Object.entries(payload as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
      .join('\n');
  }
  return JSON.stringify(payload, null, 2);
}

function readMarkdownTitle(text: string, fallback: string): string {
  const heading = text.split('\n').find((line) => line.trim().startsWith('#'));
  return heading ? heading.replace(/^#+/, '').trim() : fallback;
}

function makeRecord(params: {
  segment: SegmentConfig;
  relPath: string;
  sourceDoc: string;
  recordId: string;
  title: string;
  recordKind: string;
  payload: Record<string, unknown>;
  text: string;
  rootMeta?: Record<string, unknown>;
}): RecordSeed {
  const classification =
    (typeof params.payload.data_classification === 'string' && params.payload.data_classification) ||
    (typeof params.rootMeta?.data_classification === 'string' && params.rootMeta.data_classification) ||
    'Internal';
  const lastReviewed =
    (typeof params.payload.last_updated === 'string' && params.payload.last_updated) ||
    (typeof params.payload.last_reviewed === 'string' && params.payload.last_reviewed) ||
    (typeof params.rootMeta?.last_updated === 'string' && params.rootMeta.last_updated) ||
    '2026-04-29';
  return {
    segmentId: params.segment.segmentId,
    recordId: params.recordId,
    title: params.title,
    recordKind: params.recordKind,
    sourceDoc: params.sourceDoc,
    sourcePath: params.relPath,
    sourceBasis: SOURCE_BASIS,
    dataClassification: classification,
    confidence: confidenceFrom(params.payload.confidence ?? params.payload.confidence_in_measurement) ?? 0.82,
    lastReviewed,
    recordText: params.text,
    recordPayload: params.payload,
  };
}

async function collectFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles(full));
    else out.push(full);
  }
  return out.sort();
}

async function parseDataset(sourceRoot: string): Promise<RecordSeed[]> {
  const records: RecordSeed[] = [];
  for (const segment of SEGMENTS) {
    const segmentDir = path.join(sourceRoot, segment.dir);
    if (!existsSync(segmentDir)) continue;
    for (const file of await collectFiles(segmentDir)) {
      const relPath = path.relative(sourceRoot, file);
      const sourceDoc = path.basename(file);
      const ext = path.extname(file).toLowerCase();
      const fallbackTitle = titleize(basenameNoExt(file));
      if (ext === '.md') {
        const text = readFileSync(file, 'utf8');
        records.push(makeRecord({
          segment,
          relPath,
          sourceDoc,
          recordId: `${segment.segmentId}:${slugify(basenameNoExt(file))}`,
          title: readMarkdownTitle(text, fallbackTitle),
          recordKind: basenameNoExt(file),
          payload: { markdown: text, word_count: text.split(/\s+/).filter(Boolean).length },
          text,
        }));
      } else if (ext === '.csv') {
        const csv = Papa.parse<Record<string, string>>(readFileSync(file, 'utf8'), { header: true, skipEmptyLines: true });
        csv.data.forEach((row, idx) => {
          records.push(makeRecord({
            segment,
            relPath,
            sourceDoc,
            recordId: `${segment.segmentId}:${pickId(row, `${basenameNoExt(file)}:${idx + 1}`)}`,
            title: pickTitle(row, `${fallbackTitle} ${idx + 1}`),
            recordKind: basenameNoExt(file),
            payload: { ...row, _parse_warnings: csv.errors.map((error) => error.message) },
            text: textFromPayload(row),
          }));
        });
      } else if (ext === '.json') {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
        const rootMeta = Object.fromEntries(Object.entries(parsed).filter(([, value]) => !Array.isArray(value)));
        let emitted = false;
        for (const [key, value] of Object.entries(parsed)) {
          if (!Array.isArray(value)) continue;
          value.forEach((item, idx) => {
            const payload = item && typeof item === 'object' ? item as Record<string, unknown> : { value: item };
            records.push(makeRecord({
              segment,
              relPath,
              sourceDoc,
              recordId: `${segment.segmentId}:${pickId(payload, `${basenameNoExt(file)}:${key}:${idx + 1}`)}`,
              title: pickTitle(payload, `${titleize(key)} ${idx + 1}`),
              recordKind: key,
              payload: { ...payload, _source_array: key },
              text: textFromPayload(payload),
              rootMeta,
            }));
          });
          emitted = true;
        }
        if (!emitted) {
          records.push(makeRecord({
            segment,
            relPath,
            sourceDoc,
            recordId: `${segment.segmentId}:${slugify(basenameNoExt(file))}`,
            title: fallbackTitle,
            recordKind: basenameNoExt(file),
            payload: parsed,
            text: textFromPayload(parsed),
            rootMeta,
          }));
        }
      }
    }
  }
  return records;
}

function chunkRecord(record: RecordSeed) {
  const words = record.recordText.split(/\s+/).filter(Boolean);
  const maxWords = 850;
  const chunks: Array<{ chunkId: string; chunkIndex: number; text: string; tokenCount: number }> = [];
  for (let i = 0; i < Math.max(1, Math.ceil(words.length / maxWords)); i += 1) {
    const slice = words.slice(i * maxWords, (i + 1) * maxWords);
    const text = slice.length ? slice.join(' ') : record.title;
    chunks.push({
      chunkId: `${record.segmentId}:${record.recordId}:chunk:${i}`,
      chunkIndex: i,
      text,
      tokenCount: Math.ceil(text.length / 4),
    });
  }
  return chunks;
}

function buildGraph(records: RecordSeed[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const addNode = (node: GraphNode) => nodes.set(node.node_id, node);
  const addEdge = (edge: GraphEdge) => edges.set(edge.edge_id, edge);

  addNode({ node_id: 'enterprise:first-capital', node_type: 'enterprise', label: 'First Capital Financial Inc.', source_segment_id: 'enterprise_profile', source_record_id: 'enterprise_profile:enterprise-profile', source_doc: 'enterprise_profile.md', confidence: 0.9 });

  for (const record of records) {
    const p = record.recordPayload;
    if (typeof p.id === 'string' && p.id.startsWith('person:')) {
      addNode({ node_id: p.id, node_type: 'person', label: record.title, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      addEdge({ edge_id: `enterprise:first-capital:has-executive:${p.id}`, from_node_id: 'enterprise:first-capital', to_node_id: p.id, edge_type: 'HAS_EXECUTIVE', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      if (typeof p.reports_to === 'string' && p.reports_to) {
        addEdge({ edge_id: `${p.id}:reports-to:${p.reports_to}`, from_node_id: p.id, to_node_id: p.reports_to, edge_type: 'REPORTS_TO', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      }
    }

    if (typeof p.system_id === 'string') {
      addNode({ node_id: p.system_id, node_type: 'system', label: String(p.name ?? p.system_name ?? record.title), source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      if (typeof p.vendor === 'string' && p.vendor) {
        const vendorId = `vendor:fcfi:${slugify(p.vendor)}`;
        addNode({ node_id: vendorId, node_type: 'vendor', label: p.vendor, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence, properties: { vendor_name: p.vendor } });
        addEdge({ edge_id: `${p.system_id}:licensed-from:${vendorId}`, from_node_id: p.system_id, to_node_id: vendorId, edge_type: 'LICENSED_FROM', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      }
      const ownerId = typeof p.owner_id === 'string' && p.owner_id ? p.owner_id : typeof p.owner_person_id === 'string' && p.owner_person_id ? p.owner_person_id : null;
      if (ownerId) {
        addEdge({ edge_id: `${p.system_id}:owned-by:${ownerId}`, from_node_id: p.system_id, to_node_id: ownerId, edge_type: 'OWNED_BY', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      }
    }

    if (typeof p.kpi_id === 'string') {
      addNode({ node_id: p.kpi_id, node_type: 'kpi', label: record.title, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      const sourceSystemId = typeof p.source_system === 'string' && p.source_system ? p.source_system : typeof p.source_system_id === 'string' && p.source_system_id ? p.source_system_id : null;
      if (sourceSystemId) {
        addEdge({ edge_id: `${p.kpi_id}:measured-from:${sourceSystemId}`, from_node_id: p.kpi_id, to_node_id: sourceSystemId, edge_type: 'MEASURED_FROM', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      }
    }

    if (record.recordKind === 'active_programs' && typeof p.id === 'string') {
      addNode({ node_id: `program:${p.id}`, node_type: 'program', label: record.title, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      for (const key of ['sponsor_id', 'co_sponsor_id', 'program_lead_id']) {
        if (typeof p[key] === 'string') {
          addEdge({ edge_id: `program:${p.id}:${key}:${p[key]}`, from_node_id: `program:${p.id}`, to_node_id: p[key], edge_type: key === 'program_lead_id' ? 'LED_BY' : 'SPONSORED_BY', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
        }
      }
      if (Array.isArray(p.systems_touched)) {
        for (const systemId of p.systems_touched) {
          if (typeof systemId === 'string') {
            addEdge({ edge_id: `program:${p.id}:uses-system:${systemId}`, from_node_id: `program:${p.id}`, to_node_id: systemId, edge_type: 'USES_SYSTEM', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
          }
        }
      }
      if (Array.isArray(p.kpis_targeted)) {
        for (const kpiId of p.kpis_targeted) {
          if (typeof kpiId === 'string') {
            addEdge({ edge_id: `program:${p.id}:targets-kpi:${kpiId}`, from_node_id: `program:${p.id}`, to_node_id: kpiId, edge_type: 'TARGETS_KPI', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
          }
        }
      }
    }

    if (typeof p.vendor_id === 'string') {
      const vendorName = typeof p.vendor_name === 'string' ? p.vendor_name : record.title;
      addNode({ node_id: p.vendor_id, node_type: 'vendor', label: vendorName, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence, properties: p });
      if (typeof p.relationship_owner === 'string') {
        addEdge({ edge_id: `${p.vendor_id}:relationship-owner:${p.relationship_owner}`, from_node_id: p.vendor_id, to_node_id: p.relationship_owner, edge_type: 'RELATIONSHIP_OWNED_BY', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
      }
    }

    if (record.segmentId === 'evidence_ledger' && typeof p.id === 'string') {
      addNode({ node_id: p.id, node_type: 'evidence', label: record.title, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      if (Array.isArray(p.supports_claims_in)) {
        for (const supported of p.supports_claims_in) {
          if (typeof supported === 'string') {
            addEdge({ edge_id: `${p.id}:supports:${supported}`, from_node_id: p.id, to_node_id: supported.startsWith('fcfi-') ? `program:${supported}` : supported, edge_type: 'SUPPORTS_CLAIM_IN', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
          }
        }
      }
    }

    if (record.recordKind === 'integrations' && typeof p.integration_id === 'string' && typeof p.source_system_id === 'string' && typeof p.target_system_id === 'string') {
      addEdge({ edge_id: p.integration_id, from_node_id: p.source_system_id, to_node_id: p.target_system_id, edge_type: 'INTEGRATED_WITH', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence, properties: p });
    }

    if (record.segmentId === 'cross_program_signals' && typeof p.id === 'string') {
      addNode({ node_id: p.id, node_type: 'cross_program_signal', label: record.title, source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed, properties: p });
      if (Array.isArray(p.programs)) {
        for (const programId of p.programs) {
          if (typeof programId === 'string') {
            addEdge({ edge_id: `${p.id}:affects:${programId}`, from_node_id: p.id, to_node_id: `program:${programId}`, edge_type: 'AFFECTS_PROGRAM', source_segment_id: record.segmentId, source_record_id: record.recordId, source_doc: record.sourceDoc, confidence: record.confidence });
          }
        }
      }
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

function freshState(lastReviewed: string | null, segment: SegmentConfig): 'fresh' | 'attention' | 'stale' | 'unknown' {
  if (!lastReviewed) return 'unknown';
  const reviewed = new Date(`${lastReviewed}T00:00:00Z`).getTime();
  if (!Number.isFinite(reviewed)) return 'unknown';
  const asOf = new Date('2026-04-30T00:00:00Z').getTime();
  const days = Math.max(0, (asOf - reviewed) / 86_400_000);
  if (days <= segment.expectedFreshnessDays) return 'fresh';
  if (days <= segment.expectedFreshnessDays * 2) return 'attention';
  return 'stale';
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  return createClient(url.trim(), key.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
}

async function upsertBatch(client: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict: string) {
  const conflictKeys = onConflict.split(',').map((key) => key.trim()).filter(Boolean);
  const dedupedRows = [...new Map(rows.map((row) => [
    conflictKeys.map((key) => String(row[key] ?? '')).join('\u0000'),
    row,
  ])).values()];
  const batchSize = 250;
  for (let i = 0; i < dedupedRows.length; i += batchSize) {
    const batch = dedupedRows.slice(i, i + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

async function ensureClient(client: SupabaseClient) {
  const existing = await client
    .from('clients')
    .select('id')
    .or('name.eq.First Capital Financial,name.eq.First Capital,legal_name.eq.First Capital Financial Inc.,name.eq.Arcturus Financial')
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new Error(`First Capital client lookup failed: ${existing.error.message}`);
  if (existing.data?.id) return existing.data.id as string;

  const inserted = await client
    .from('clients')
    .insert({ name: 'First Capital Financial', legal_name: 'First Capital Financial Inc.', industry_code: 'FINSERV' })
    .select('id')
    .single();
  if (inserted.error) throw new Error(`First Capital client insert failed: ${inserted.error.message}`);
  return inserted.data.id as string;
}

async function main() {
  const { sourceRoot, dryRun } = parseArgs();
  const records = await parseDataset(sourceRoot);
  const graph = buildGraph(records);
  const bySegment = new Map(SEGMENTS.map((segment) => [segment.segmentId, records.filter((record) => record.segmentId === segment.segmentId)]));
  const chunks = records.flatMap((record) => chunkRecord(record).map((chunk) => ({ record, chunk })));

  const summary = {
    tenantKey: TENANT_KEY,
    sourceRoot,
    segments: SEGMENTS.map((segment) => ({ segmentId: segment.segmentId, records: bySegment.get(segment.segmentId)?.length ?? 0 })),
    records: records.length,
    chunks: chunks.length,
    graphNodes: graph.nodes.length,
    graphEdges: graph.edges.length,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const client = getClient();
  const clientId = await ensureClient(client);
  const runStart = await client.from('data_ingestion_runs').insert({ client_id: clientId, tenant_key: TENANT_KEY, source_label: 'First Capital Financial synthetic setup dataset', source_root: sourceRoot, status: 'started' }).select('id').single();
  if (runStart.error) throw new Error(`data_ingestion_runs insert failed: ${runStart.error.message}`);
  const runId = runStart.data.id as string;

  try {
    await upsertBatch(client, 'tenant_expected_baselines', SEGMENTS.map((segment) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      tenant_archetype: 'financial-services',
      segment_id: segment.segmentId,
      expected_record_count: segment.expectedRecordCount,
      expected_freshness_days: segment.expectedFreshnessDays,
      required_for_reasoning_modes: segment.reasoningModes,
      coverage_weight: 1,
      baseline_payload: { family_number: segment.familyNumber, segment_name: segment.segmentName },
    })), 'tenant_key,segment_id');

    await upsertBatch(client, 'data_inventory_segments', SEGMENTS.map((segment) => {
      const segmentRecords = bySegment.get(segment.segmentId) ?? [];
      const staleCount = segmentRecords.filter((record) => freshState(record.lastReviewed, segment) === 'stale').length;
      const coverage = Math.min(100, Math.round((segmentRecords.length / segment.expectedRecordCount) * 10000) / 100);
      return {
        client_id: clientId,
        tenant_key: TENANT_KEY,
        segment_id: segment.segmentId,
        segment_name: segment.segmentName,
        family_number: segment.familyNumber,
        expected_baseline: { expected_record_count: segment.expectedRecordCount, freshness_days: segment.expectedFreshnessDays, reasoning_modes: segment.reasoningModes },
        coverage_score: coverage,
        health_state: coverage >= 95 ? 'complete' : coverage >= 50 ? 'partial' : coverage > 0 ? 'sparse' : 'not_started',
        record_count: segmentRecords.length,
        stale_count: staleCount,
        missing_count: Math.max(0, segment.expectedRecordCount - segmentRecords.length),
        last_reviewed_at: '2026-04-29T00:00:00Z',
        last_ingested_at: new Date().toISOString(),
        provenance_summary: { source_basis: SOURCE_BASIS, uploaded_by: UPLOADED_BY, source_root: sourceRoot },
      };
    }), 'tenant_key,segment_id');

    await upsertBatch(client, 'data_inventory_records', records.map((record) => {
      const segment = SEGMENTS.find((candidate) => candidate.segmentId === record.segmentId)!;
      return {
        client_id: clientId,
        tenant_key: TENANT_KEY,
        segment_id: record.segmentId,
        record_id: record.recordId,
        title: record.title,
        record_kind: record.recordKind,
        source_doc: record.sourceDoc,
        source_path: record.sourcePath,
        source_basis: record.sourceBasis,
        uploaded_by: UPLOADED_BY,
        data_classification: record.dataClassification,
        confidence: record.confidence,
        last_reviewed: record.lastReviewed,
        freshness_state: freshState(record.lastReviewed, segment),
        ingestion_status: 'indexed',
        indexed_at: new Date().toISOString(),
        record_text: record.recordText,
        record_payload: record.recordPayload,
      };
    }), 'tenant_key,segment_id,record_id');

    await upsertBatch(client, 'enterprise_graph_nodes', graph.nodes.map((node) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      node_id: node.node_id,
      node_type: node.node_type,
      label: node.label,
      source_segment_id: node.source_segment_id,
      source_record_id: node.source_record_id,
      source_doc: node.source_doc,
      source_basis: SOURCE_BASIS,
      data_classification: node.data_classification ?? 'Internal',
      confidence: node.confidence ?? 0.82,
      last_reviewed: node.last_reviewed ?? '2026-04-29',
      properties: node.properties ?? {},
    })), 'tenant_key,node_id');

    await upsertBatch(client, 'enterprise_graph_edges', graph.edges.map((edge) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      edge_id: edge.edge_id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      edge_type: edge.edge_type,
      source_segment_id: edge.source_segment_id,
      source_record_id: edge.source_record_id,
      source_doc: edge.source_doc,
      source_basis: SOURCE_BASIS,
      confidence: edge.confidence ?? 0.82,
      properties: edge.properties ?? {},
    })), 'tenant_key,edge_id');

    await upsertBatch(client, 'enterprise_context_chunks', chunks.map(({ record, chunk }) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      chunk_id: chunk.chunkId,
      source_segment_id: record.segmentId,
      source_record_id: record.recordId,
      source_doc: record.sourceDoc,
      source_path: record.sourcePath,
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      embedding_status: 'pending',
      provenance: { source_basis: SOURCE_BASIS, uploaded_by: UPLOADED_BY, data_classification: record.dataClassification, confidence: record.confidence, last_reviewed: record.lastReviewed },
      chunk_metadata: { title: record.title, record_kind: record.recordKind },
    })), 'tenant_key,chunk_id');

    const existingAudit = await client
      .from('data_inventory_audit_log')
      .select('segment_id')
      .eq('tenant_key', TENANT_KEY)
      .eq('action', 'segment_imported')
      .eq('source_doc', 'first-capital-synthetic-dataset');
    if (existingAudit.error) throw new Error(`data_inventory_audit_log lookup failed: ${existingAudit.error.message}`);
    const auditedSegments = new Set((existingAudit.data ?? []).map((row) => row.segment_id as string));
    const auditRows = SEGMENTS
      .filter((segment) => !auditedSegments.has(segment.segmentId))
      .map((segment) => ({
        client_id: clientId,
        tenant_key: TENANT_KEY,
        actor_role: 'system_import',
        action: 'segment_imported',
        segment_id: segment.segmentId,
        record_id: null,
        after_state: { record_count: bySegment.get(segment.segmentId)?.length ?? 0, source_label: 'First Capital Financial synthetic setup dataset' },
        classification_at_action: 'Mixed',
        source_doc: 'first-capital-synthetic-dataset',
      }));
    if (auditRows.length) {
      const auditInsert = await client.from('data_inventory_audit_log').insert(auditRows);
      if (auditInsert.error) throw new Error(`data_inventory_audit_log insert failed: ${auditInsert.error.message}`);
    }

    const { error: runError } = await client.from('data_ingestion_runs').update({
      status: 'completed',
      records_loaded: records.length,
      chunks_loaded: chunks.length,
      nodes_loaded: graph.nodes.length,
      edges_loaded: graph.edges.length,
      summary,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);
    if (runError) throw new Error(`data_ingestion_runs update failed: ${runError.message}`);

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.from('data_ingestion_runs').update({ status: 'failed', error_message: error instanceof Error ? error.message : String(error), completed_at: new Date().toISOString() }).eq('id', runId);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

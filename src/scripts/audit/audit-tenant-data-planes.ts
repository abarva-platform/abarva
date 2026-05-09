// Multi-plane audit · for the founder's "what's loaded by category"
// question. Sweeps Supabase substrate, Supabase AI registry, Supabase
// programs/source, Pinecone vectors, and Neo4j graph for every demo
// tenant we ship, and prints a per-tenant + per-plane report so we
// can see exactly what's loaded vs missing.
//
// Run: npx tsx src/scripts/audit/audit-tenant-data-planes.ts
//
// Designed to fail-soft per plane: if Pinecone isn't reachable the
// other planes still report. The output is shell-friendly and the
// script returns 0 even when planes are unreachable (the report
// shows the gap; that's the point).


import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import neo4j, { type Driver } from 'neo4j-driver';

loadEnv({ path: '.env.local' });
loadEnv();

interface Tenant {
  brokerKey: string;        // tenant_key in Supabase
  clientKey: string;        // ClientKey in app
  industryCode: string;     // matches Pinecone `vertical` filter
  name: string;
  brand: string;
}

const TENANTS: ReadonlyArray<Tenant> = [
  { brokerKey: 'apex-retail',             clientKey: 'apexretail', industryCode: 'retail',     name: 'Apex Retail Group',         brand: 'burnt orange' },
  { brokerKey: 'meridian-health',         clientKey: 'meridian',   industryCode: 'healthcare', name: 'Meridian Health System',    brand: 'teal'        },
  { brokerKey: 'first-capital-financial', clientKey: 'arcturus',   industryCode: 'finserv',    name: 'First Capital Financial',   brand: 'navy'        },
];

// ── Supabase ───────────────────────────────────────────────────────────────

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

interface SegmentRow {
  segment_id: string;
  segment_name: string;
  family_number: number | null;
  record_count: number | null;
  health_state: string | null;
}

async function auditSupabase(sb: SupabaseClient, t: Tenant) {
  // Substrate
  const seg = await sb
    .from('data_inventory_segments')
    .select('segment_id, segment_name, family_number, record_count, health_state')
    .eq('tenant_key', t.brokerKey)
    .order('family_number', { ascending: true });
  const segments: SegmentRow[] = (seg.data ?? []) as SegmentRow[];
  const segError = seg.error?.message;
  const totalRecords = segments.reduce((acc, s) => acc + (s.record_count ?? 0), 0);

  const recCount = await sb
    .from('data_inventory_records')
    .select('record_id', { count: 'exact', head: true })
    .eq('tenant_key', t.brokerKey);

  // AI registry — clients table holds canonical client_id; resolve once.
  // Note: `clients.tenant_key` matches the app ClientKey
  // (apexretail / meridian / arcturus). There is no `key` column.
  const client = await sb
    .from('clients')
    .select('id, tenant_key, slug, name, industry_code')
    .eq('tenant_key', t.clientKey)
    .maybeSingle();
  const clientId = (client.data as { id?: string } | null)?.id ?? null;

  let aiInitiatives = 0;
  let aiGoals = 0;
  let aiVendors = 0;
  let aiKpis = 0;
  let aiDecisions = 0;
  let aiNotes = 0;
  let aiScenarios = 0;

  if (clientId) {
    const init = await sb.from('ai_initiatives').select('initiative_id', { count: 'exact', head: true }).eq('client_id', clientId);
    aiInitiatives = init.count ?? 0;

    const goals = await sb.from('ai_business_goals').select('goal_id', { count: 'exact', head: true }).eq('client_id', clientId);
    aiGoals = goals.count ?? 0;

    // Initiative-scoped tables — fetch initiative_ids first then count children
    if (aiInitiatives > 0) {
      const initIds = (await sb.from('ai_initiatives').select('initiative_id').eq('client_id', clientId)).data ?? [];
      const ids = (initIds as Array<{ initiative_id: string }>).map((r) => r.initiative_id);
      if (ids.length > 0) {
        const [v, k, n, d, s] = await Promise.all([
          sb.from('ai_initiative_vendors').select('vendor_id', { count: 'exact', head: true }).in('initiative_id', ids),
          sb.from('ai_initiative_kpis').select('kpi_id', { count: 'exact', head: true }).in('initiative_id', ids),
          sb.from('ai_initiative_stakeholder_notes').select('note_id', { count: 'exact', head: true }).in('initiative_id', ids),
          sb.from('ai_initiative_decisions').select('decision_id', { count: 'exact', head: true }).in('initiative_id', ids),
          sb.from('ai_initiative_scenarios').select('scenario_id', { count: 'exact', head: true }).in('initiative_id', ids),
        ]);
        aiVendors = v.count ?? 0;
        aiKpis = k.count ?? 0;
        aiNotes = n.count ?? 0;
        aiDecisions = d.count ?? 0;
        aiScenarios = s.count ?? 0;
      }
    }
  }

  // Programs (engagements) + Source events
  const [eng, src] = await Promise.all([
    clientId
      ? sb.from('engagements').select('id', { count: 'exact', head: true }).eq('client_id', clientId)
      : Promise.resolve({ count: 0 } as { count: number | null }),
    sb.from('source_events').select('id', { count: 'exact', head: true }).eq('client_key', t.clientKey),
  ]);
  const engagements = eng.count ?? 0;
  const sourceEvents = src.count ?? 0;

  // Audit log + ingestion run
  const [audit, ingest] = await Promise.all([
    sb.from('data_inventory_audit_log').select('action', { count: 'exact', head: true }).eq('tenant_key', t.brokerKey),
    sb.from('data_ingestion_runs')
      .select('source_label, records_loaded, chunks_loaded, nodes_loaded, edges_loaded, status, completed_at')
      .eq('tenant_key', t.brokerKey)
      .order('started_at', { ascending: false })
      .limit(1),
  ]);
  const auditEvents = audit.count ?? 0;
  const lastRun = (ingest.data?.[0] ?? null) as null | {
    source_label: string;
    records_loaded: number | null;
    chunks_loaded: number | null;
    nodes_loaded: number | null;
    edges_loaded: number | null;
    status: string;
    completed_at: string | null;
  };

  return {
    segments,
    segError,
    totalRecords,
    recordsCount: recCount.count ?? 0,
    clientId,
    aiInitiatives,
    aiGoals,
    aiVendors,
    aiKpis,
    aiNotes,
    aiDecisions,
    aiScenarios,
    engagements,
    sourceEvents,
    auditEvents,
    lastRun,
  };
}

// ── Pinecone ───────────────────────────────────────────────────────────────

function getPinecone(): { pc: Pinecone; idx: ReturnType<Pinecone['index']>; indexName: string } | null {
  const key = process.env.PINECONE_API_KEY;
  if (!key) return null;
  const indexName = process.env.PINECONE_INDEX ?? 'nexus-knowledge';
  const pc = new Pinecone({ apiKey: key });
  return { pc, idx: pc.index(indexName), indexName };
}

// Pinecone uses NAMESPACES (not metadata filters) to segregate
// industries: `industry-retail`, `industry-healthcare`,
// `industry-financial-services`, `cross-industry-patterns`,
// `lifecycle-substrate`, `vendor-implementations`,
// `deliverable-templates`, `public-patterns`, `__default__`.
const INDUSTRY_NAMESPACE: Record<string, string> = {
  retail: 'industry-retail',
  healthcare: 'industry-healthcare',
  finserv: 'industry-financial-services',
};

async function auditPinecone(t: Tenant) {
  const client = getPinecone();
  if (!client) return { ok: false as const, reason: 'PINECONE_API_KEY missing' };
  try {
    const stats = await client.idx.describeIndexStats();
    const totalVectors = stats.totalRecordCount ?? 0;
    const namespaces = stats.namespaces ?? {};
    // Per-namespace vector counts (this IS exposed in describeIndexStats)
    const nsCounts = Object.fromEntries(
      Object.entries(namespaces).map(([ns, info]) => [ns, (info as { recordCount?: number }).recordCount ?? 0]),
    );
    const industryNs = INDUSTRY_NAMESPACE[t.industryCode] ?? null;
    const tenantVectors = industryNs ? nsCounts[industryNs] ?? 0 : null;
    return {
      ok: true as const,
      indexName: client.indexName,
      totalVectors,
      industryNamespace: industryNs,
      tenantVectors,
      crossIndustryVectors: nsCounts['cross-industry-patterns'] ?? 0,
      lifecycleVectors: nsCounts['lifecycle-substrate'] ?? 0,
      vendorVectors: nsCounts['vendor-implementations'] ?? 0,
      deliverableVectors: nsCounts['deliverable-templates'] ?? 0,
      publicPatternVectors: nsCounts['public-patterns'] ?? 0,
      nsCounts,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false as const, reason: `Pinecone error · ${message}` };
  }
}

// ── Neo4j ──────────────────────────────────────────────────────────────────

function getNeo4j(): Driver | null {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME;
  const pass = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !pass) return null;
  return neo4j.driver(uri, neo4j.auth.basic(user, pass));
}

async function auditNeo4j(driver: Driver, t: Tenant) {
  const session = driver.session();
  try {
    // Engagements scoped by industry — closest available tenant proxy
    const engRes = await session.run(
      `MATCH (e:Engagement)-[:IN_INDUSTRY]->(i:Industry { code: $code })
       RETURN count(e) AS n`,
      { code: t.industryCode.toUpperCase() },
    );
    const engagements = (engRes.records[0]?.get('n') ?? 0).toString();

    const totalsRes = await session.run(
      `MATCH (e:Engagement)-[:IN_INDUSTRY]->(:Industry { code: $code })
       OPTIONAL MATCH (e)-[:TRIGGERED]->(p:GenomePattern)
       OPTIONAL MATCH (e)-[:MADE]->(d:Decision)
       OPTIONAL MATCH (d)-[:RESULTED_IN]->(o:Outcome)
       RETURN count(DISTINCT p) AS patterns,
              count(DISTINCT d) AS decisions,
              count(DISTINCT o) AS outcomes`,
      { code: t.industryCode.toUpperCase() },
    );
    const r = totalsRes.records[0];
    return {
      ok: true as const,
      engagements,
      patterns: (r?.get('patterns') ?? 0).toString(),
      decisions: (r?.get('decisions') ?? 0).toString(),
      outcomes: (r?.get('outcomes') ?? 0).toString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false as const, reason: `Neo4j error · ${message}` };
  } finally {
    await session.close();
  }
}

// ── Render ────────────────────────────────────────────────────────────────

function bar(width: number, value: number, max: number): string {
  if (max <= 0) return ' '.repeat(width);
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function main() {
  const sb = getSupabase();
  if (!sb) {
    console.error('Missing Supabase creds. Cannot run audit.');
    process.exit(1);
  }
  const driver = getNeo4j();

  const reports: Array<{
    tenant: Tenant;
    sbReport: Awaited<ReturnType<typeof auditSupabase>>;
    pineReport: Awaited<ReturnType<typeof auditPinecone>>;
    neoReport: Awaited<ReturnType<typeof auditNeo4j>> | null;
  }> = [];

  for (const t of TENANTS) {
    const sbReport = await auditSupabase(sb, t);
    const pineReport = await auditPinecone(t);
    const neoReport = driver ? await auditNeo4j(driver, t) : null;
    reports.push({ tenant: t, sbReport, pineReport, neoReport });
  }

  if (driver) await driver.close();

  // Print
  for (const r of reports) {
    const t = r.tenant;
    console.log('');
    console.log('═'.repeat(96));
    console.log(` ${t.name}  ·  client_key=${t.clientKey}  ·  broker=${t.brokerKey}  ·  industry=${t.industryCode}`);
    console.log('═'.repeat(96));

    // Substrate
    const s = r.sbReport;
    console.log('');
    console.log(' SUBSTRATE  ·  data_inventory_segments + records');
    console.log(' ' + '─'.repeat(94));
    if (s.segError) {
      console.log(`  ! query error: ${s.segError}`);
    } else {
      console.log(`  ${s.segments.length} segments · ${s.totalRecords} records (rolled-up) · ${s.recordsCount} record rows in DB`);
      console.log(`  audit log: ${s.auditEvents} events`);
      if (s.lastRun) {
        console.log(`  last ingest: ${s.lastRun.source_label} · ${s.lastRun.records_loaded ?? 0} records · ${s.lastRun.chunks_loaded ?? 0} chunks · ${s.lastRun.nodes_loaded ?? 0} nodes · ${s.lastRun.edges_loaded ?? 0} edges · ${s.lastRun.status}`);
      } else {
        console.log('  last ingest: (no ingestion runs recorded)');
      }
      if (s.segments.length > 0) {
        const max = Math.max(...s.segments.map((seg) => seg.record_count ?? 0));
        console.log('');
        console.log('  ' + pad('family · segment_name', 50) + 'records  health      ' + 'bar (relative records)');
        console.log('  ' + '─'.repeat(92));
        for (const seg of s.segments) {
          const fam = seg.family_number != null ? `F${String(seg.family_number).padStart(2, '0')}` : ' — ';
          const name = seg.segment_name ?? '(unnamed)';
          const records = seg.record_count ?? 0;
          const health = seg.health_state ?? '—';
          console.log(`  ${pad(`${fam} · ${name}`, 50)}${pad(String(records), 7)}  ${pad(health, 12)}${bar(20, records, max)}`);
        }
      }
    }

    // AI Initiatives Registry
    console.log('');
    console.log(' AI INITIATIVES REGISTRY  ·  ai_* tables');
    console.log(' ' + '─'.repeat(94));
    if (!s.clientId) {
      console.log('  (clients row not found for client_key — registry tables not queryable)');
    } else {
      console.log(`  initiatives: ${s.aiInitiatives}  ·  business goals: ${s.aiGoals}  ·  vendors: ${s.aiVendors}`);
      console.log(`  kpis: ${s.aiKpis}  ·  stakeholder notes: ${s.aiNotes}  ·  decisions: ${s.aiDecisions}  ·  scenarios: ${s.aiScenarios}`);
    }

    // Programs + Source
    console.log('');
    console.log(' PROGRAMS + SOURCE');
    console.log(' ' + '─'.repeat(94));
    console.log(`  engagements (programs): ${s.engagements}  ·  source_events: ${s.sourceEvents}`);

    // Pinecone
    console.log('');
    console.log(' PINECONE  ·  vector index');
    console.log(' ' + '─'.repeat(94));
    if (!r.pineReport.ok) {
      console.log(`  ! ${r.pineReport.reason}`);
    } else {
      console.log(`  index: ${r.pineReport.indexName}  ·  total vectors: ${r.pineReport.totalVectors}`);
      console.log(`  ${r.pineReport.industryNamespace ?? '—'}: ${r.pineReport.tenantVectors ?? '—'}  (this tenant's industry pool)`);
      console.log(`  cross-industry-patterns: ${r.pineReport.crossIndustryVectors}  ·  lifecycle-substrate: ${r.pineReport.lifecycleVectors}  ·  vendor-implementations: ${r.pineReport.vendorVectors}`);
      console.log(`  deliverable-templates: ${r.pineReport.deliverableVectors}  ·  public-patterns: ${r.pineReport.publicPatternVectors}`);
    }

    // Neo4j
    console.log('');
    console.log(' NEO4J  ·  graph');
    console.log(' ' + '─'.repeat(94));
    if (!r.neoReport) {
      console.log('  (NEO4J creds missing — skipped)');
    } else if (!r.neoReport.ok) {
      console.log(`  ! ${r.neoReport.reason}`);
    } else {
      console.log(`  engagements (industry-scoped): ${r.neoReport.engagements}  ·  patterns: ${r.neoReport.patterns}  ·  decisions: ${r.neoReport.decisions}  ·  outcomes: ${r.neoReport.outcomes}`);
    }
  }

  // Gap analysis
  console.log('');
  console.log('═'.repeat(96));
  console.log(' GAP ANALYSIS  ·  cross-tenant comparison');
  console.log('═'.repeat(96));
  console.log('');
  console.log(' tenant'.padEnd(32) + ' segments  records   inits  vendors  programs  src_evt  vectors  graph');
  console.log(' ' + '─'.repeat(94));
  for (const r of reports) {
    const t = r.tenant;
    const s = r.sbReport;
    const vec = r.pineReport.ok ? String(r.pineReport.tenantVectors ?? '?') : '—';
    const graph = r.neoReport && r.neoReport.ok ? r.neoReport.engagements : '—';
    console.log(
      ' ' + pad(t.name, 30) +
      ' ' + pad(String(s.segments.length), 9) +
      pad(String(s.totalRecords), 9) +
      pad(String(s.aiInitiatives), 8) +
      pad(String(s.aiVendors), 9) +
      pad(String(s.engagements), 10) +
      pad(String(s.sourceEvents), 9) +
      pad(vec, 9) +
      pad(String(graph), 8),
    );
  }
  console.log('');
}

void main().catch((err) => {
  console.error('audit failed:', err);
  process.exit(1);
});

// Audit · what financial + KPI data is actually loaded.
// Per founder challenge: "what kind of financial information and KPIs
// have we loaded? did we load sample annual or quarterly reports?"
//
// Looks at the financial/KPI families (F04, F05, F15, F18) plus the
// AI registry KPI tables, and prints sample record_payload shapes
// + KPI rows so we can see what's actually in there.
//
// Run: npx tsx src/scripts/audit/audit-financial-kpis.ts


import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv();

interface Tenant {
  brokerKey: string;
  clientKey: string;
  name: string;
}

const TENANTS: ReadonlyArray<Tenant> = [
  { brokerKey: 'apex-retail',     clientKey: 'apexretail', name: 'Apex Retail Group' },
  { brokerKey: 'meridian-health', clientKey: 'meridian',   name: 'Meridian Health System' },
];

// Families that carry financial / KPI / report data
const FINANCIAL_FAMILIES = [4, 5, 15, 18];
const FAMILY_LABEL: Record<number, string> = {
  4:  'IT financials',
  5:  'KPI dictionary',
  15: 'KPI quarterly history',
  18: 'Financial model',
};

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase creds');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

interface RecordRow {
  record_id: string;
  title: string;
  record_kind: string;
  record_payload: Record<string, unknown> | null;
  source_doc: string | null;
  family_number: number | null;
  segment_id: string | null;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function inspectFamily(sb: SupabaseClient, t: Tenant, family: number) {
  // Resolve segment_id for this (tenant, family) — there's exactly one
  // segment per (tenant, family_number) by convention.
  const segRes = await sb
    .from('data_inventory_segments')
    .select('segment_id, segment_name')
    .eq('tenant_key', t.brokerKey)
    .eq('family_number', family)
    .maybeSingle();
  const segmentId = (segRes.data as { segment_id?: string } | null)?.segment_id;
  const segmentName = (segRes.data as { segment_name?: string } | null)?.segment_name;
  if (!segmentId) {
    console.log('  (no segment for this family)');
    return;
  }
  console.log(`  segment_name: "${segmentName}"`);
  const { data, error } = await sb
    .from('data_inventory_records')
    .select('record_id, title, record_kind, record_payload, source_doc, segment_id')
    .eq('segment_id', segmentId)
    .limit(200);
  if (error) {
    console.log(`  ! query error: ${error.message}`);
    return;
  }
  const rows: RecordRow[] = (data ?? []) as RecordRow[];
  if (rows.length === 0) {
    console.log('  (no records)');
    return;
  }

  console.log(`  ${rows.length} records · sample: 5 / titles + payload keys + first values\n`);

  const sample = rows.slice(0, 5);
  for (const r of sample) {
    const keys = r.record_payload ? Object.keys(r.record_payload) : [];
    console.log(`  • ${r.title}`);
    console.log(`    kind=${r.record_kind} · keys=[${keys.join(', ')}]`);
    if (r.record_payload) {
      const preview = keys.slice(0, 4).map((k) => {
        const v = r.record_payload?.[k];
        if (v == null) return `${k}=null`;
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `${k}=${s.length > 60 ? s.slice(0, 57) + '…' : s}`;
      });
      console.log(`    sample: ${preview.join(' · ')}`);
    }
    if (r.source_doc) console.log(`    source: ${r.source_doc}`);
    console.log('');
  }

  // Distinct record_kinds across the full family — tells us the shape variety
  const kinds = new Map<string, number>();
  for (const r of rows) {
    kinds.set(r.record_kind, (kinds.get(r.record_kind) ?? 0) + 1);
  }
  if (kinds.size > 1) {
    console.log(`  record_kind distribution:`);
    for (const [k, n] of [...kinds.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${pad(k, 40)} ${n}`);
    }
  }
}

async function inspectAiKpis(sb: SupabaseClient, t: Tenant) {
  // Resolve client_id
  const c = await sb.from('clients').select('id').eq('tenant_key', t.clientKey).maybeSingle();
  const clientId = (c.data as { id?: string } | null)?.id ?? null;
  if (!clientId) {
    console.log('  (clients row not found)');
    return;
  }
  const initIds = (await sb.from('ai_initiatives').select('initiative_id, name').eq('client_id', clientId)).data ?? [];
  const ids = (initIds as Array<{ initiative_id: string; name: string }>).map((r) => r.initiative_id);
  if (ids.length === 0) {
    console.log('  (no initiatives)');
    return;
  }

  // Inspect ai_initiative_kpis schema (it varies across the registry)
  const sample = await sb.from('ai_initiative_kpis').select('*').in('initiative_id', ids).limit(20);
  if (sample.error) {
    console.log(`  ! ${sample.error.message}`);
    return;
  }
  const rows = (sample.data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) {
    console.log('  (no KPI rows)');
    return;
  }
  console.log(`  ${rows.length} sample KPI rows (column shape):`);
  const cols = Object.keys(rows[0]);
  console.log(`  columns: ${cols.join(' · ')}\n`);
  for (const r of rows.slice(0, 6)) {
    const initName = (initIds as Array<{ initiative_id: string; name: string }>).find((i) => i.initiative_id === r.initiative_id)?.name ?? '?';
    console.log(`  • [${initName}]`);
    for (const c of cols) {
      if (c === 'initiative_id' || c === 'kpi_id') continue;
      const v = r[c];
      if (v == null || v === '') continue;
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      console.log(`      ${pad(c, 18)} ${s.length > 70 ? s.slice(0, 67) + '…' : s}`);
    }
    console.log('');
  }
}

async function inspectInitiativeFinancials(sb: SupabaseClient, t: Tenant) {
  const c = await sb.from('clients').select('id').eq('tenant_key', t.clientKey).maybeSingle();
  const clientId = (c.data as { id?: string } | null)?.id ?? null;
  if (!clientId) return;
  const inits = await sb
    .from('ai_initiatives')
    .select('display_id, name, stage, committed_annual_usd, committed_total_usd, measured_value_usd, status_flag, confidence_level')
    .eq('client_id', clientId)
    .order('display_id');
  if (inits.error) return;
  const rows = (inits.data ?? []) as Array<{
    display_id: string;
    name: string;
    stage: string;
    committed_annual_usd: number | string | null;
    committed_total_usd: number | string | null;
    measured_value_usd: number | string | null;
    status_flag: string | null;
    confidence_level: string | null;
  }>;
  if (rows.length === 0) {
    console.log('  (no initiatives)');
    return;
  }
  console.log(`  ${rows.length} initiatives with financial commitments:\n`);
  console.log('  ' + pad('display_id', 14) + pad('initiative', 50) + pad('stage', 14) + pad('annual $', 14) + pad('total $', 14) + pad('measured $', 14));
  console.log('  ' + '─'.repeat(120));
  for (const r of rows) {
    const fmt = (v: number | string | null) => {
      if (v == null) return '—';
      const n = typeof v === 'string' ? Number.parseFloat(v) : v;
      if (!Number.isFinite(n)) return '—';
      if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
      return `$${n}`;
    };
    console.log(
      '  ' + pad(r.display_id, 14) + pad(r.name.slice(0, 48), 50) + pad(r.stage, 14) + pad(fmt(r.committed_annual_usd), 14) + pad(fmt(r.committed_total_usd), 14) + pad(fmt(r.measured_value_usd), 14),
    );
  }
}

async function main() {
  const sb = getSupabase();

  for (const t of TENANTS) {
    console.log('');
    console.log('═'.repeat(96));
    console.log(` ${t.name}  ·  tenant_key=${t.brokerKey}`);
    console.log('═'.repeat(96));

    for (const fam of FINANCIAL_FAMILIES) {
      console.log('');
      console.log(` F${String(fam).padStart(2, '0')} · ${FAMILY_LABEL[fam]}`);
      console.log(' ' + '─'.repeat(94));
      await inspectFamily(sb, t, fam);
    }

    console.log('');
    console.log(' AI Initiatives · committed financials');
    console.log(' ' + '─'.repeat(94));
    await inspectInitiativeFinancials(sb, t);

    console.log('');
    console.log(' AI Initiative KPIs · ai_initiative_kpis');
    console.log(' ' + '─'.repeat(94));
    await inspectAiKpis(sb, t);
  }
  console.log('');
}

void main().catch((err) => {
  console.error('audit failed:', err);
  process.exit(1);
});

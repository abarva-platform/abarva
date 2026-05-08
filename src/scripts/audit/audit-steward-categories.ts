// One-shot audit: dump the substrate inventory segments for every
// tenant we ship demo data for, so we can see whether the loaded
// `segment_name` values are the tenant-industry-natural categories
// the Steward orientation card wants to render — vs raw / generic
// names that would need a display-label bridge.
//
// Run: npx tsx src/scripts/audit/audit-steward-categories.ts
//
// PR-H10 follow-up · 2026-05-08


import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv(); // .env fallback

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const TENANTS: ReadonlyArray<{ key: string; label: string; color: string }> = [
  { key: 'apex-retail', label: 'Apex Retail Group', color: 'burnt orange' },
  { key: 'meridian-health', label: 'Meridian Health System', color: 'teal' },
  { key: 'first-capital-financial', label: 'First Capital Financial', color: 'navy' },
];

interface Row {
  segment_id: string;
  segment_name: string;
  family_number: number | null;
  record_count: number | null;
  coverage_score: number | null;
  health_state: string | null;
}

async function audit(tenantKey: string) {
  const { data, error } = await sb
    .from('data_inventory_segments')
    .select('segment_id, segment_name, family_number, record_count, coverage_score, health_state')
    .eq('tenant_key', tenantKey)
    .order('family_number', { ascending: true });
  if (error) {
    console.error(`  ! query error: ${error.message}`);
    return;
  }
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    console.log('  (no segments loaded for this tenant)');
    return;
  }
  const totalRecords = rows.reduce((acc, r) => acc + (r.record_count ?? 0), 0);
  const groundedCount = rows.filter((r) => r.health_state === 'mature' || r.health_state === 'grounded').length;
  const partialCount = rows.filter((r) => r.health_state === 'partial').length;
  const stubCount = rows.filter((r) => r.health_state === 'empty' || r.health_state === 'stub').length;
  const otherCount = rows.length - groundedCount - partialCount - stubCount;

  console.log(`  ${rows.length} segments · ${totalRecords} records total`);
  console.log(`  health: ${groundedCount} mature/grounded · ${partialCount} partial · ${stubCount} empty/stub${otherCount > 0 ? ` · ${otherCount} other` : ''}`);
  console.log('');
  console.log('  family · segment_name'.padEnd(58) + 'records  health');
  console.log('  ' + '─'.repeat(78));
  for (const r of rows) {
    const family = r.family_number != null ? `F${String(r.family_number).padStart(2, '0')}` : ' — ';
    const name = r.segment_name ?? '(unnamed)';
    const records = String(r.record_count ?? 0).padStart(6);
    const health = (r.health_state ?? '—').padEnd(9);
    console.log(`  ${family} · ${name}`.padEnd(58) + `${records}  ${health}`);
  }
}

async function main() {
  for (const t of TENANTS) {
    console.log('');
    console.log('═'.repeat(80));
    console.log(` ${t.label}  ·  tenant_key = "${t.key}"  ·  brand: ${t.color}`);
    console.log('═'.repeat(80));
    await audit(t.key);
  }
  console.log('');
}

void main();

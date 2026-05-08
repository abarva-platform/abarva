// Refresh Meridian's Net Patient Service Revenue values.
//
// The seed loaded NPSR at ~$610M–$661M / quarter, which annualizes
// to ~$2.6B — only 19% of Meridian's $14.2B top line. NPSR for an
// IDN should be 85–90% of revenue, i.e. ~$3.0B / quarter.
//
// Found 2026-05-08 via `audit-numbers-sanity.ts`. The trajectory
// (gentle 1% QoQ growth, dip in FY2024-Q3 → FY2025-Q1, recovery
// through FY2026-Q1) is internally consistent — the seed author
// just had the wrong base scale. We multiply every quarterly value
// by 4.7× to land FY2026_Q1 at ~$3.1B (annualized $12.4B = 87% of
// top-line, dead-center for an IDN).
//
// Run: npx tsx src/scripts/setup-data/refresh-meridian-npsr.ts
//
// Idempotent: rewrites the value, vs_plan and vs_prior_period are
// preserved (they're percentages — scale-invariant). Safe to re-run.


import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv();

const TENANT_KEY = 'meridian-health';
const SCALE_FACTOR = 4.7; // $661M × 4.7 = $3.1B → 87% of $14.2B top-line annualized
// kpi_id for these rows is `kpi:meridian:019` — kept in record_id and
// record_payload, no need to reference it directly during the rewrite.

function rescaleValue(s: string): { display: string; raw: number } | null {
  // Existing values look like "$612M", "$638M", "$661M". Parse the
  // millions number and rescale.
  const m = s.match(/^\$?([\d.]+)\s*M$/i);
  if (!m) return null;
  const millions = Number.parseFloat(m[1]);
  if (!Number.isFinite(millions)) return null;
  const newMillions = millions * SCALE_FACTOR;
  // Round to one decimal in $B
  const billions = newMillions / 1000;
  return {
    display: `$${billions.toFixed(2)}B`,
    raw: newMillions * 1_000_000,
  };
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await sb
    .from('data_inventory_records')
    .select('id, record_id, record_payload, title')
    .eq('tenant_key', TENANT_KEY)
    .ilike('title', '%Net Patient Service Revenue%');
  if (error) {
    console.error('query failed:', error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as Array<{
    id: string;
    record_id: string;
    record_payload: Record<string, unknown> | null;
    title: string;
  }>;
  console.log(`Found ${rows.length} NPSR rows for ${TENANT_KEY}`);

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const payload = row.record_payload ?? {};
    const oldValue = payload.value as string | undefined;
    if (!oldValue) {
      skipped++;
      continue;
    }
    // If already at $B scale, skip (idempotent guard)
    if (/\$?[\d.]+\s*B$/i.test(oldValue.trim())) {
      console.log(`  ${row.record_id} · already ${oldValue} (already rescaled, skip)`);
      skipped++;
      continue;
    }
    const rescaled = rescaleValue(oldValue);
    if (!rescaled) {
      console.log(`  ${row.record_id} · could not parse "${oldValue}" — skipping`);
      skipped++;
      continue;
    }
    const newPayload = { ...payload, value: rescaled.display };
    const { error: updErr } = await sb
      .from('data_inventory_records')
      .update({ record_payload: newPayload, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (updErr) {
      console.log(`  ${row.record_id} · update FAILED: ${updErr.message}`);
      continue;
    }
    console.log(`  ${row.record_id} · ${oldValue} → ${rescaled.display}`);
    updated++;
  }
  console.log('');
  console.log(`Done · updated ${updated} · skipped ${skipped}`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key);

async function main() {
  console.log('--- 1) Four tables reachable (row counts) ---');
  for (const t of ['persons', 'engagements', 'turns', 'relationship_notes'] as const) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (error) console.log(`  ✗ ${t}: ${error.message}`);
    else console.log(`  ✓ ${t}: ${count ?? 0} rows`);
  }

  console.log('\n--- 2) Seed engagement + sponsor ---');
  const { data: eng, error: engErr } = await sb
    .from('engagements')
    .select('name, current_phase, status, industry_code, sponsor:persons!engagements_sponsor_person_id_fkey(name)');
  if (engErr) console.log('  ✗ error:', engErr.message);
  else console.log(JSON.stringify(eng, null, 2));

  console.log('\n--- 3) graph_node_ids across persons + engagements ---');
  const [persons, engs] = await Promise.all([
    sb.from('persons').select('graph_node_id'),
    sb.from('engagements').select('graph_node_id'),
  ]);
  const ids = [
    ...(persons.data ?? []).map((r) => r.graph_node_id),
    ...(engs.data ?? []).map((r) => r.graph_node_id),
  ];
  console.log(JSON.stringify(ids, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const FORBIDDEN = [
  'CommonSpirit Health',
  'Retired Client',
  'HP Inc',
  'MD Anderson',
  'Meridian Health System',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: clients, error } = await sb
    .from('clients')
    .select('id, name')
    .in('name', FORBIDDEN);
  if (error) throw error;
  if (!clients || clients.length === 0) {
    console.log('No forbidden rows present. Nothing to delete.');
    return;
  }

  const idsToDelete: string[] = [];
  const blocked: Array<{ name: string; useCases: number; engagements: number }> = [];

  for (const c of clients) {
    const [{ count: ucCount }, { count: engCount }] = await Promise.all([
      sb.from('use_cases').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
      sb.from('engagements').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
    ]);
    if ((ucCount ?? 0) === 0 && (engCount ?? 0) === 0) {
      idsToDelete.push(c.id);
    } else {
      blocked.push({ name: c.name, useCases: ucCount ?? 0, engagements: engCount ?? 0 });
    }
  }

  if (blocked.length > 0) {
    console.error('BLOCKED — at least one row now has dependent rows. Aborting.');
    for (const b of blocked) console.error('  ·', b);
    process.exit(2);
  }

  console.log(`Deleting ${idsToDelete.length} client rows (all verified empty at execute-time):`);
  for (const c of clients) {
    if (idsToDelete.includes(c.id)) console.log('  ·', c.name, c.id);
  }

  const { error: delErr, count } = await sb
    .from('clients')
    .delete({ count: 'exact' })
    .in('id', idsToDelete);

  if (delErr) {
    console.error('DELETE failed — postgres surfaced an error (likely FK constraint):');
    console.error(delErr);
    process.exit(3);
  }

  console.log(`\n✓ Deleted ${count} rows.`);

  const { data: remain } = await sb
    .from('clients')
    .select('id, name')
    .in('name', FORBIDDEN);
  console.log(`Remaining forbidden-name rows: ${remain?.length ?? 0}`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

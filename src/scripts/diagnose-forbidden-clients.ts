import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const FORBIDDEN = [
  'CommonSpirit Health',
  'First Capital Financial',
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

  console.log(`\nFound ${clients?.length ?? 0} matching client rows.\n`);
  console.log('name'.padEnd(30), '| id'.padEnd(40), '| use_cases | engagements');
  console.log('-'.repeat(95));

  for (const c of clients ?? []) {
    const [{ count: ucCount }, { count: engCount }] = await Promise.all([
      sb.from('use_cases').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
      sb.from('engagements').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
    ]);
    console.log(
      String(c.name).padEnd(30),
      '|',
      String(c.id).padEnd(38),
      '|',
      String(ucCount ?? 0).padStart(9),
      '|',
      String(engCount ?? 0).padStart(11),
    );
  }
  console.log('');
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

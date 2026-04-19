import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const checks: Array<[string, () => Promise<boolean>]> = [
    ['023 · persons.maestro_profile column exists', async () => {
      const { error } = await sb.from('persons').select('id, maestro_profile').limit(1);
      return !error;
    }],
    ['023 · relationship_notes.subject_type column exists', async () => {
      const { error } = await sb.from('relationship_notes').select('id, subject_type').limit(1);
      return !error;
    }],
    ['024 · knowledge_sources table exists', async () => {
      const { error } = await sb.from('knowledge_sources').select('id').limit(1);
      return !error;
    }],
    ['024 · knowledge_chunks table exists', async () => {
      const { error } = await sb.from('knowledge_chunks').select('id').limit(1);
      return !error;
    }],
  ];

  for (const [label, check] of checks) {
    try {
      const ok = await check();
      console.log(`  ${ok ? '✓' : '✗'} ${label}`);
    } catch (err) {
      console.log(`  ✗ ${label} · ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FORBIDDEN_LOWER = [
  'commonspirit health',
  'first capital financial',
  'hp inc',
  'md anderson',
  'meridian health system',
  'cade',
  'accenture',
  'dell',
  'mckinsey',
  'deloitte',
  'bcg',
  'bain',
  'huron',
  'navigant',
  'presbyterian',
  'phs',
];

(async () => {
  const { data: allClients } = await sb.from('clients').select('id, name');
  const forbidden = ((allClients ?? []) as Array<{ id: string; name: string }>).filter((c) =>
    FORBIDDEN_LOWER.includes(c.name.trim().toLowerCase()),
  );

  if (forbidden.length === 0) {
    console.log('No forbidden-name rows present (case-insensitive). Nothing to delete.');
    return;
  }

  const idsToDelete: string[] = [];
  const blocked: Array<{ name: string; useCases: number; engagements: number }> = [];

  for (const c of forbidden) {
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
    console.error('BLOCKED — row has dependent data. Aborting:');
    for (const b of blocked) console.error('  ·', b);
    process.exit(2);
  }

  console.log(`Deleting ${idsToDelete.length} forbidden client rows (all verified empty):`);
  for (const c of forbidden) {
    if (idsToDelete.includes(c.id)) console.log(`  · ${c.name.padEnd(20)} ${c.id}`);
  }

  const { error, count } = await sb.from('clients').delete({ count: 'exact' }).in('id', idsToDelete);
  if (error) {
    console.error('DELETE failed:', error);
    process.exit(3);
  }

  console.log(`\n✓ Deleted ${count} rows.`);

  const { data: remain } = await sb.from('clients').select('id, name');
  const stillForbidden = ((remain ?? []) as Array<{ name: string }>).filter((c) =>
    FORBIDDEN_LOWER.includes(c.name.trim().toLowerCase()),
  );
  console.log(`Remaining forbidden-name rows: ${stillForbidden.length}`);
})();

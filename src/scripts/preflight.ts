import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FORBIDDEN_LOWER = ['commonspirit health', 'first capital financial', 'hp inc', 'md anderson', 'meridian health system'];

(async () => {
  // 033 turn_traces
  const { error: traceErr, count: traceCount } = await sb.from('turn_traces').select('*', { count: 'exact', head: true });
  console.log(`turn_traces  · ${traceErr ? '✗ NOT APPLIED ·' + traceErr.message : `✓ applied · ${traceCount} rows`}`);

  // Case-insensitive forbidden check
  const { data: allClients } = await sb.from('clients').select('id, name');
  const forbidden = ((allClients ?? []) as Array<{ id: string; name: string }>).filter((c) =>
    FORBIDDEN_LOWER.includes(c.name.trim().toLowerCase()),
  );
  console.log(`forbidden (case-insensitive) · ${forbidden.length} rows:`);
  for (const c of forbidden) {
    const [{ count: ucCount }, { count: engCount }] = await Promise.all([
      sb.from('use_cases').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
      sb.from('engagements').select('*', { count: 'exact', head: true }).eq('client_id', c.id),
    ]);
    console.log(`  · ${c.name.padEnd(24)} ${c.id}  use_cases=${ucCount ?? 0} engagements=${engCount ?? 0}`);
  }

  // Pack J two-client use case check
  const { count: fcUseCases } = await sb
    .from('use_cases')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', 'a75687bf-71b9-4524-ab4e-68ae3f28d200')
    .eq('source', 'seed');
  console.log(`Retired-client use_cases (source=seed) · ${fcUseCases}`);
})();

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data } = await sb.from('clients').select('id, name, industry_code').order('name');
  for (const r of (data ?? []) as Array<{ id: string; name: string; industry_code: string | null }>) {
    console.log(`  ${r.name.padEnd(30)} ${r.industry_code ?? '(none)'}  ${r.id}`);
  }
})();

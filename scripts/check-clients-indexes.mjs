import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Check indexes via information_schema
const { data, error } = await sb.rpc('exec_sql', {
  sql: "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'clients' ORDER BY indexname;"
}).catch(() => ({ data: null, error: 'no exec_sql rpc' }));
if (error) {
  console.log('(no exec_sql rpc · using direct query)');
  const { data: rows } = await sb.from('clients').select('name, legal_name').limit(10);
  console.log('clients sample:', rows);
} else {
  console.log('indexes:', data);
}

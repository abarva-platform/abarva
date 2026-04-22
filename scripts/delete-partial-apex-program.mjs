import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
if (!client) { console.error('Apex client missing'); process.exit(1); }
const { data: progs } = await sb.from('engagements').select('id, name').eq('client_id', client.id).in('name', [
  'Contact Center AI Transformation',
  'Unified Customer Data Platform',
  'Store Associate Productivity',
  'Demand Forecasting AI',
]);
console.log('programs to delete:', progs);
for (const p of progs ?? []) {
  const { error } = await sb.from('engagements').delete().eq('id', p.id);
  if (error) console.error(p.name, error);
  else console.log('deleted', p.name);
}

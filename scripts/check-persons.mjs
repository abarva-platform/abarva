import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: p } = await sb.from('persons').select('graph_node_id, name').in('graph_node_id', ['person_sarah_chen', 'person_james_park', 'person_anand_sundaram']);
console.log('persons by graph_node_id:', p);
const { data: teams } = await sb.from('teams').select('*').limit(5);
console.log('teams:', teams);

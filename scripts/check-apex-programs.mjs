import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
const { data: progs } = await sb.from('engagements').select('id, name, current_phase, status, program_archetype, origin_source').eq('client_id', client.id).order('created_at');
console.table(progs);
for (const p of progs ?? []) {
  const [{ count: mods }, { count: mils }, { count: wis }, { count: risks }, { count: dels }, { count: flags }] = await Promise.all([
    sb.from('program_modules').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
    sb.from('program_milestones').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
    sb.from('program_work_items').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
    sb.from('program_risks').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
    sb.from('deliverables_v2').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
    sb.from('maestro_oversight_flags').select('id', { count: 'exact', head: true }).eq('engagement_id', p.id),
  ]);
  console.log(`  ${p.name}: ${mods} modules · ${mils} milestones · ${wis} work items · ${risks} risks · ${dels} deliverables · ${flags} flags`);
}

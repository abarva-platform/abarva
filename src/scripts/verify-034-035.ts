import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = ['tech_stack_items', 'tech_projects', 'staff_augmentation', 'volumetrics_snapshots', 'person_client_memberships'];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${error ? '✗' : '✓'} ${t.padEnd(30)} ${error ? error.message : `${count} rows`}`);
  }

  console.log('\nClient financial profiles:');
  const { data: clients } = await sb
    .from('clients')
    .select('name, industry_code, annual_revenue_usd, it_budget_usd, ai_budget_usd, employee_count, operational_units')
    .in('name', ['Meridian Health', 'Apex Retail']);
  for (const c of (clients ?? []) as Array<Record<string, unknown>>) {
    const rev = c.annual_revenue_usd ? `$${((c.annual_revenue_usd as number) / 1e9).toFixed(1)}B` : '—';
    const it = c.it_budget_usd ? `$${((c.it_budget_usd as number) / 1e6).toFixed(0)}M IT` : '—';
    const ai = c.ai_budget_usd ? `$${((c.ai_budget_usd as number) / 1e6).toFixed(0)}M AI` : '—';
    console.log(`  ${String(c.name).padEnd(20)} ${rev} · ${it} · ${ai} · ${c.employee_count ?? '?'} FTE · ${c.operational_units ?? '?'} units`);
  }

  console.log('\nUser role check:');
  const { data: persons } = await sb
    .from('persons')
    .select('name, email, primary_role')
    .eq('primary_role', 'maestro');
  console.log(`  ${(persons ?? []).length} maestros:`);
  for (const p of (persons ?? []) as Array<Record<string, unknown>>) {
    console.log(`    · ${p.name} (${p.email})`);
  }

  const { count: memberCount } = await sb
    .from('person_client_memberships')
    .select('*', { count: 'exact', head: true });
  console.log(`  ${memberCount} person_client_memberships`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';
import { CLIENT_PROFILES } from './_shared/enterprise-profiles';
import { CLIENT_DATA, VOLUMETRICS_PROFILES } from './_shared/enterprise-data';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function wipe(sb: SupabaseClient, clientId: string) {
  await sb.from('volumetrics_snapshots').delete().eq('client_id', clientId).eq('is_demo_data', true);
  await sb.from('staff_augmentation').delete().eq('client_id', clientId).eq('is_demo_data', true);
  await sb.from('tech_projects').delete().eq('client_id', clientId).eq('is_demo_data', true);
  await sb.from('tech_stack_items').delete().eq('client_id', clientId).eq('is_demo_data', true);
}

async function main() {
  const sb = getSb();
  const days = 30;

  for (const profile of CLIENT_PROFILES) {
    const { data: row, error } = await sb
      .from('clients')
      .select('id')
      .eq('name', profile.clientName)
      .maybeSingle();
    if (error) {
      console.error(`✗ lookup failed for ${profile.clientName}: ${error.message}`);
      continue;
    }
    if (!row) {
      console.error(`✗ client "${profile.clientName}" not found — apply migration 020 + 022 first`);
      continue;
    }
    const clientId = (row as { id: string }).id;

    console.log(`\n▸ ${profile.clientName} (${clientId})`);

    const { error: updErr } = await sb
      .from('clients')
      .update({
        annual_revenue_usd: profile.annualRevenueUsd,
        it_budget_usd: profile.itBudgetUsd,
        ai_budget_usd: profile.aiBudgetUsd,
        employee_count: profile.employeeCount,
        operational_units: profile.operationalUnits,
        business_description: profile.businessDescription,
      })
      .eq('id', clientId);
    if (updErr) console.error(`  ✗ client profile update: ${updErr.message}`);
    else console.log('  ✓ client financial profile updated');

    await wipe(sb, clientId);

    const data = CLIENT_DATA[profile.clientName];
    if (!data) {
      console.error(`  ✗ no enterprise data registered for ${profile.clientName}`);
      continue;
    }

    const techRows = data.techStack.map((t) => ({
      client_id: clientId,
      category: t.category,
      vendor_name: t.vendor_name,
      product_name: t.product_name ?? null,
      deployment_model: t.deployment_model,
      annual_spend_usd: t.annual_spend_usd,
      seat_count: t.seat_count ?? null,
      owning_function: t.owning_function ?? null,
      touches_ai: t.touches_ai ?? false,
      status: 'active' as const,
      is_demo_data: true,
    }));
    const { error: tErr } = await sb.from('tech_stack_items').insert(techRows);
    if (tErr) console.error(`  ✗ tech_stack_items: ${tErr.message}`);
    else console.log(`  ✓ tech_stack_items · ${techRows.length} rows`);

    const projRows = data.projects.map((p) => ({
      client_id: clientId,
      name: p.name,
      description: p.description,
      program_domain: p.program_domain,
      status: p.status,
      total_budget_usd: p.total_budget_usd,
      spent_to_date_usd: p.spent_to_date_usd,
      exec_sponsor: p.exec_sponsor,
      touches_ai: p.touches_ai ?? false,
      is_demo_data: true,
    }));
    const { error: pErr } = await sb.from('tech_projects').insert(projRows);
    if (pErr) console.error(`  ✗ tech_projects: ${pErr.message}`);
    else console.log(`  ✓ tech_projects · ${projRows.length} rows`);

    const augRows = data.staffAug.map((s) => ({
      client_id: clientId,
      vendor_name: s.vendor_name,
      engagement_type: s.engagement_type,
      function_area: s.function_area,
      headcount_fte: s.headcount_fte,
      annual_spend_usd: s.annual_spend_usd,
      touches_ai: s.touches_ai ?? false,
      is_demo_data: true,
    }));
    const { error: sErr } = await sb.from('staff_augmentation').insert(augRows);
    if (sErr) console.error(`  ✗ staff_augmentation: ${sErr.message}`);
    else console.log(`  ✓ staff_augmentation · ${augRows.length} rows`);

    const vp = VOLUMETRICS_PROFILES[profile.industryCode];
    const today = new Date();
    const volRows: Array<Record<string, unknown>> = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = addDays(today, -i);
      // gentle day-to-day variance (±6% on api calls + tokens) to make the sparkline feel real
      const variance = 1 + (Math.sin(i / 3) * 0.06 + (Math.random() - 0.5) * 0.04);
      volRows.push({
        client_id: clientId,
        snapshot_date: iso(d),
        api_calls_millions: +(vp.apiCallsDailyMillions * variance).toFixed(2),
        tokens_billions: +(vp.tokensDailyBillions * variance).toFixed(2),
        storage_tb: vp.storageTb,
        queries_millions: +(vp.queriesDailyMillions * variance).toFixed(2),
        active_models: vp.activeModels,
        data_pipelines: vp.dataPipelines,
        is_demo_data: true,
      });
    }
    const { error: vErr } = await sb.from('volumetrics_snapshots').upsert(volRows, { onConflict: 'client_id,snapshot_date' });
    if (vErr) console.error(`  ✗ volumetrics_snapshots: ${vErr.message}`);
    else console.log(`  ✓ volumetrics_snapshots · ${volRows.length} days`);
  }
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

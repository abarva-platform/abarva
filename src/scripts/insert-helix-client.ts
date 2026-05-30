import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  const { data: existing } = await sb.from('clients').select('id').eq('name', 'Helix Therapeutics').maybeSingle();
  if (existing) {
    console.log(`✓ Helix Therapeutics already exists · ${(existing as { id: string }).id}`);
    const { error: updErr } = await sb
      .from('clients')
      .update({
        legal_name: 'Helix Therapeutics, Inc.',
        industry_code: 'HEALTHCARE_IDN',
        annual_revenue_usd: 22_000_000_000,
        it_budget_usd: 420_000_000,
        ai_budget_usd: 95_000_000,
        employee_count: 18_000,
        operational_units: 6,
        business_description:
          '$22B mid-cap biotech · 14 approved drugs · 280 pipeline compounds (Phase 1-4) · 340 active trials · 6 manufacturing sites · HQ US East Coast with research hubs in Basel + Singapore + Cambridge MA',
      })
      .eq('id', (existing as { id: string }).id);
    if (updErr) console.error('✗ profile update:', updErr.message);
    else console.log('✓ profile updated');
    return;
  }

  const { data, error } = await sb
    .from('clients')
    .insert({
      name: 'Helix Therapeutics',
      legal_name: 'Helix Therapeutics, Inc.',
      industry_code: 'HEALTHCARE_IDN',
      annual_revenue_usd: 22_000_000_000,
      it_budget_usd: 420_000_000,
      ai_budget_usd: 95_000_000,
      employee_count: 18_000,
      operational_units: 6,
      business_description:
        '$22B mid-cap biotech · 14 approved drugs · 280 pipeline compounds (Phase 1-4) · 340 active trials · 6 manufacturing sites · HQ US East Coast with research hubs in Basel + Singapore + Cambridge MA',
    })
    .select('id')
    .single();
  if (error) {
    console.error('✗ insert failed:', error.message);
    process.exit(1);
  }
  console.log(`✓ Helix Therapeutics inserted · ${(data as { id: string }).id}`);
})();

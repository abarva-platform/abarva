import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isVendorAllowed } from '@/lib/config/vendor-whitelist';
import { assertClientNameAllowed } from '@/lib/config/naming';
import type { ClientSeed, UseCaseSeed } from './types';

export function getSeedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function wipeClientSeedRows(sb: SupabaseClient, clientId: string) {
  const { data: ucs } = await sb.from('use_cases').select('id').eq('client_id', clientId).eq('source', 'seed');
  const ids = ((ucs as Array<{ id: string }> | null) ?? []).map((r) => r.id);
  if (ids.length === 0) return;
  await sb.from('use_case_risk').delete().in('use_case_id', ids);
  await sb.from('use_case_usage_metrics').delete().in('use_case_id', ids);
  await sb.from('use_case_value_metrics').delete().in('use_case_id', ids);
  await sb.from('use_case_cost_metrics').delete().in('use_case_id', ids);
  await sb.from('use_cases').delete().in('id', ids);
}

export async function seedClient(sb: SupabaseClient, seed: ClientSeed): Promise<{ clientId: string | null; inserted: number; skippedVendors: string[] }> {
  assertClientNameAllowed(seed.name);

  const { data: row } = await sb.from('clients').select('id').eq('name', seed.name).maybeSingle();
  if (!row) return { clientId: null, inserted: 0, skippedVendors: [] };
  const clientId = (row as { id: string }).id;

  await wipeClientSeedRows(sb, clientId);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);
  const periodStartIso = periodStart.toISOString().slice(0, 10);
  const periodEndIso = periodEnd.toISOString().slice(0, 10);

  const skippedVendors: string[] = [];
  let inserted = 0;

  for (const uc of seed.useCases) {
    if (!isVendorAllowed(uc.vendor) && uc.vendor !== 'custom' && uc.vendor !== 'internal') {
      skippedVendors.push(uc.vendor);
      continue;
    }

    const { data: insertedUc, error } = await sb
      .from('use_cases')
      .insert({
        client_id: clientId,
        name: uc.name,
        description: uc.description,
        business_unit: uc.business_unit,
        domain: uc.domain,
        stage: uc.stage,
        systems: uc.systems,
        ai_type: uc.ai_type,
        scope: uc.scope,
        vendor: uc.vendor,
        source: 'seed',
      })
      .select('id')
      .single();

    if (error || !insertedUc) {
      console.error(`  ✗ ${uc.name}: ${error?.message ?? 'no insert'}`);
      continue;
    }
    const ucId = (insertedUc as { id: string }).id;
    inserted += 1;

    if (uc.usage) {
      await sb.from('use_case_usage_metrics').insert({
        use_case_id: ucId,
        period_start: periodStartIso,
        period_end: periodEndIso,
        dau: uc.usage.dau ?? null,
        wau: uc.usage.wau ?? null,
        penetration_pct: uc.usage.penetration_pct ?? null,
        drop_off_rate_pct: uc.usage.drop_off_rate_pct ?? null,
        interactions_total: uc.usage.interactions_total ?? null,
        source: 'seed',
      });
    }

    if (uc.value) {
      await sb.from('use_case_value_metrics').insert({
        use_case_id: ucId,
        period_start: periodStartIso,
        period_end: periodEndIso,
        value_driver: uc.value.driver,
        metric_name: uc.value.metric,
        baseline: uc.value.baseline,
        target: uc.value.target,
        observed: uc.value.observed,
        unit: uc.value.unit,
        confidence: uc.value.confidence,
        source: 'seed',
      });
    }

    if (uc.risk) {
      await sb.from('use_case_risk').insert({
        use_case_id: ucId,
        data_classification: uc.risk.data,
        model_risk_level: uc.risk.risk_level,
        governance_approval_status: uc.risk.governance,
        human_in_the_loop: uc.risk.hitl,
        vendor_data_posture: uc.risk.vendor_posture,
        bias_incidents_count: uc.risk.bias_incidents ?? 0,
        source: 'seed',
      });
    }

    if (uc.cost) {
      await sb.from('use_case_cost_metrics').insert({
        use_case_id: ucId,
        period_start: periodStartIso,
        period_end: periodEndIso,
        llm_spend_usd: uc.cost.llm,
        compute_spend_usd: uc.cost.compute,
        storage_spend_usd: uc.cost.storage,
        vendor_license_spend_usd: uc.cost.license,
        integration_spend_usd: uc.cost.integration,
        projected_6mo_spend_usd: uc.cost.projected_6mo,
        projected_12mo_spend_usd: uc.cost.projected_6mo * 2,
        trajectory_confidence: 'medium',
        source: 'seed',
      });
    }
  }

  return { clientId, inserted, skippedVendors };
}

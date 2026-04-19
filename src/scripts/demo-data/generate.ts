import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useCaseLibrary, sizeProfile, type Industry, type OrgSize, type AiMaturity } from './patterns';

export interface DemoDataOptions {
  clientId: string;
  industry: Industry;
  orgSize: OrgSize;
  aiMaturity: AiMaturity;
}

export interface DemoSeedSummary {
  clientId: string;
  useCasesInserted: number;
  usageRows: number;
  valueRows: number;
  riskRows: number;
  costRows: number;
}

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function seedDemoData(options: DemoDataOptions): Promise<DemoSeedSummary> {
  const sb = getSb();
  const size = sizeProfile(options.orgSize);
  const presets = useCaseLibrary(options.industry, options.aiMaturity).slice(0, size.useCaseCount);

  const today = new Date();
  const periodEnd = today.toISOString().slice(0, 10);
  const pStart = new Date(today);
  pStart.setMonth(pStart.getMonth() - 1);
  const periodStart = pStart.toISOString().slice(0, 10);

  let inserted = 0, usageCount = 0, valueCount = 0, riskCount = 0, costCount = 0;

  for (const preset of presets) {
    const { data: ucRow, error: ucErr } = await sb
      .from('use_cases')
      .insert({
        client_id: options.clientId,
        name: preset.name,
        description: preset.description,
        business_unit: preset.business_unit,
        domain: preset.domain,
        stage: preset.stage,
        systems: preset.systems,
        ai_type: preset.ai_type,
        scope: preset.scope,
        vendor: preset.vendor,
        source: 'seed',
      })
      .select('id')
      .single();
    if (ucErr || !ucRow) continue;
    const ucId = (ucRow as { id: string }).id;
    inserted += 1;

    if (preset.usageTemplate) {
      const eligible = size.seatMultiplier;
      const dau = Math.round(eligible * preset.usageTemplate.dau_per_eligible);
      const wau = Math.round(dau * 1.35);
      await sb.from('use_case_usage_metrics').insert({
        use_case_id: ucId,
        period_start: periodStart,
        period_end: periodEnd,
        dau, wau,
        penetration_pct: preset.usageTemplate.penetration_pct,
        drop_off_rate_pct: preset.usageTemplate.drop_off_pct,
        source: 'seed',
      });
      usageCount += 1;
    }

    if (preset.valueTemplate) {
      const observed = preset.valueTemplate.baseline + (preset.valueTemplate.target - preset.valueTemplate.baseline) * (preset.valueTemplate.achieved_pct / 100);
      await sb.from('use_case_value_metrics').insert({
        use_case_id: ucId,
        period_start: periodStart,
        period_end: periodEnd,
        value_driver: preset.valueTemplate.driver,
        metric_name: preset.valueTemplate.metric,
        baseline: preset.valueTemplate.baseline,
        target: preset.valueTemplate.target,
        observed,
        unit: preset.valueTemplate.unit,
        confidence: preset.valueTemplate.confidence,
        source: 'seed',
      });
      valueCount += 1;
    }

    await sb.from('use_case_risk').insert({
      use_case_id: ucId,
      data_classification: preset.dataClasses,
      model_risk_level: preset.riskLevel,
      governance_approval_status: preset.stage === 'stalled' ? 'pending' : preset.riskLevel === 'high' ? 'approved' : 'approved',
      human_in_the_loop: preset.riskLevel !== 'low',
      vendor_data_posture: preset.vendor.includes('consumer') || preset.domain === 'Shadow AI' ? 'consumer' : 'enterprise_tier',
      bias_incidents_count: 0,
      source: 'seed',
    });
    riskCount += 1;

    const totalCost = size.costBaseUsd * (preset.stage === 'realize' ? 1.5 : preset.stage === 'stalled' ? 0.2 : 0.8);
    const t = preset.costTemplate;
    await sb.from('use_case_cost_metrics').insert({
      use_case_id: ucId,
      period_start: periodStart,
      period_end: periodEnd,
      llm_spend_usd: Math.round(totalCost * t.llm_fraction),
      compute_spend_usd: Math.round(totalCost * t.compute_fraction),
      storage_spend_usd: Math.round(totalCost * t.storage_fraction),
      vendor_license_spend_usd: Math.round(totalCost * t.license_fraction),
      integration_spend_usd: 0,
      projected_6mo_spend_usd: Math.round(totalCost * 6 * 1.1),
      projected_12mo_spend_usd: Math.round(totalCost * 12 * 1.1),
      trajectory_confidence: 'medium',
      source: 'seed',
    });
    costCount += 1;
  }

  return {
    clientId: options.clientId,
    useCasesInserted: inserted,
    usageRows: usageCount,
    valueRows: valueCount,
    riskRows: riskCount,
    costRows: costCount,
  };
}

export async function removeDemoData(clientId: string): Promise<{ deletedUseCases: number }> {
  const sb = getSb();
  const { data: ucs } = await sb
    .from('use_cases')
    .select('id')
    .eq('client_id', clientId)
    .eq('source', 'seed');
  const ids = ((ucs as Array<{ id: string }> | null) ?? []).map((r) => r.id);
  if (ids.length === 0) return { deletedUseCases: 0 };

  await sb.from('use_case_risk').delete().in('use_case_id', ids);
  await sb.from('use_case_usage_metrics').delete().in('use_case_id', ids);
  await sb.from('use_case_value_metrics').delete().in('use_case_id', ids);
  await sb.from('use_case_cost_metrics').delete().in('use_case_id', ids);
  await sb.from('use_cases').delete().in('id', ids);

  return { deletedUseCases: ids.length };
}

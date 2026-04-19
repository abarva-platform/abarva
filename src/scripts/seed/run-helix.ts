import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Helix tech stack (~30 items) ───────────────────────────────────────
const HELIX_TECH_STACK = [
  // Discovery
  { category: 'ai_platform', vendor_name: 'Recursion', product_name: 'Phenom target ID', deployment_model: 'saas', annual_spend_usd: 5_040_000, owning_function: 'Discovery', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Insitro', product_name: 'small molecule design', deployment_model: 'saas', annual_spend_usd: 3_360_000, owning_function: 'Discovery', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'AlphaFold', product_name: 'protein structure', deployment_model: 'cloud_managed', annual_spend_usd: 744_000, owning_function: 'Discovery', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Atomwise', product_name: 'screening', deployment_model: 'saas', annual_spend_usd: 2_160_000, owning_function: 'Discovery', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Absci', product_name: 'antibody engineering', deployment_model: 'saas', annual_spend_usd: 2_640_000, owning_function: 'Biologics', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Tempus Next', product_name: 'genomics', deployment_model: 'saas', annual_spend_usd: 2_160_000, owning_function: 'Translational', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Nference', product_name: 'literature surveillance', deployment_model: 'saas', annual_spend_usd: 1_776_000, owning_function: 'Research', touches_ai: true },
  // Clinical
  { category: 'business_app', vendor_name: 'Medidata Rave', product_name: 'EDC', deployment_model: 'saas', annual_spend_usd: 8_640_000, owning_function: 'Clinical Ops' },
  { category: 'business_app', vendor_name: 'Veeva Vault', product_name: 'CDMS + RIM + PromoMats', deployment_model: 'saas', annual_spend_usd: 24_000_000, owning_function: 'Clinical + Regulatory' },
  { category: 'ai_platform', vendor_name: 'Deep 6 AI', product_name: 'trial recruitment', deployment_model: 'saas', annual_spend_usd: 4_080_000, owning_function: 'Clinical Ops', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Aetion', product_name: 'RWE', deployment_model: 'saas', annual_spend_usd: 3_120_000, owning_function: 'RWE', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Flatiron', product_name: 'oncology RWE', deployment_model: 'saas', annual_spend_usd: 2_880_000, owning_function: 'RWE', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Komodo Health', product_name: 'claims RWE', deployment_model: 'saas', annual_spend_usd: 2_160_000, owning_function: 'RWE', touches_ai: true },
  // Regulatory / safety
  { category: 'ai_platform', vendor_name: 'Pharmora', product_name: 'pharmacovigilance', deployment_model: 'saas', annual_spend_usd: 2_880_000, owning_function: 'Safety', touches_ai: true },
  // Commercial
  { category: 'business_app', vendor_name: 'Salesforce', product_name: 'Veeva CRM', deployment_model: 'saas', annual_spend_usd: 12_600_000, seat_count: 1400, owning_function: 'Commercial' },
  { category: 'ai_platform', vendor_name: 'Aktana', product_name: 'NBA field', deployment_model: 'saas', annual_spend_usd: 3_360_000, seat_count: 1400, owning_function: 'Commercial', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Within3', product_name: 'MSL insights + KOL', deployment_model: 'saas', annual_spend_usd: 2_208_000, seat_count: 340, owning_function: 'Medical Affairs', touches_ai: true },
  // Manufacturing
  { category: 'platform', vendor_name: 'Rockwell FactoryTalk', product_name: 'process optimization', deployment_model: 'on_prem', annual_spend_usd: 2_160_000, owning_function: 'Manufacturing', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'o9 Solutions', product_name: 'supply chain demand', deployment_model: 'saas', annual_spend_usd: 2_640_000, owning_function: 'Supply Chain', touches_ai: true },
  // Corporate
  { category: 'collaboration', vendor_name: 'Microsoft', product_name: 'M365 E5', deployment_model: 'saas', annual_spend_usd: 9_600_000, seat_count: 14_200, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Microsoft Copilot', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 5_112_000, seat_count: 14_200, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'GitHub Copilot', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 264_000, seat_count: 680, owning_function: 'Engineering', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Moveworks', product_name: 'IT service desk', deployment_model: 'saas', annual_spend_usd: 1_008_000, seat_count: 18_000, owning_function: 'IT', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Harvey', product_name: 'legal', deployment_model: 'saas', annual_spend_usd: 1_176_000, seat_count: 140, owning_function: 'Legal', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Glean', product_name: 'enterprise search', deployment_model: 'saas', annual_spend_usd: 864_000, seat_count: 12_000, owning_function: 'Enterprise IT', touches_ai: true },
  // Infra
  { category: 'infrastructure', vendor_name: 'AWS', product_name: 'primary cloud', deployment_model: 'cloud_managed', annual_spend_usd: 18_600_000, owning_function: 'Platform', touches_ai: true },
  { category: 'platform', vendor_name: 'Databricks', product_name: 'lakehouse', deployment_model: 'saas', annual_spend_usd: 3_600_000, owning_function: 'Data', touches_ai: true },
  { category: 'platform', vendor_name: 'Snowflake', product_name: 'warehouse', deployment_model: 'saas', annual_spend_usd: 2_400_000, owning_function: 'Data', touches_ai: true },
  { category: 'security', vendor_name: 'CrowdStrike', deployment_model: 'saas', annual_spend_usd: 3_000_000, owning_function: 'Security' },
  { category: 'service', vendor_name: 'Pharma SI (composite)', deployment_model: 'service_contract', annual_spend_usd: 7_680_000, owning_function: 'Platform' },
];

const HELIX_PROJECTS = [
  { name: 'Recursion partnership Phase 2', description: 'Platform access extension + candidate pipeline.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 42_000_000, spent_to_date_usd: 20_160_000, exec_sponsor: 'Chief Scientific Officer', touches_ai: true },
  { name: 'AlphaFold in-house deployment', description: 'Bring AlphaFold into internal compute.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 8_000_000, spent_to_date_usd: 2_800_000, exec_sponsor: 'Head of Computational Biology', touches_ai: true },
  { name: 'Deep 6 AI trial recruitment expansion', description: 'Scale to 280 of 340 trials.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 6_400_000, spent_to_date_usd: 3_520_000, exec_sponsor: 'Head of Clinical Operations', touches_ai: true },
  { name: 'Pharmacovigilance AI overhaul', description: 'Pharmora + internal rebuild.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 14_000_000, spent_to_date_usd: 10_080_000, exec_sponsor: 'Chief Safety Officer', touches_ai: true },
  { name: 'RWE platform consolidation', description: 'Aetion + Komodo + Flatiron unification.', program_domain: 'ai_initiative', status: 'approved', total_budget_usd: 22_000_000, spent_to_date_usd: 4_840_000, exec_sponsor: 'Head of RWE', touches_ai: true },
  { name: 'M365 Copilot full deployment', description: 'Deploy across 14.2K seats.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 14_000_000, spent_to_date_usd: 11_900_000, exec_sponsor: 'CIO', touches_ai: true },
  { name: 'Medical affairs transformation', description: 'Within3 + Claude rollout.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 8_200_000, spent_to_date_usd: 3_936_000, exec_sponsor: 'Chief Medical Officer', touches_ai: true },
  { name: 'Manufacturing digital twin', description: 'Rockwell + PTC across 6 sites.', program_domain: 'platform', status: 'in_flight', total_budget_usd: 38_000_000, spent_to_date_usd: 12_160_000, exec_sponsor: 'Chief Manufacturing Officer' },
  { name: 'Veeva Vault modernization', description: 'CRM + Clinical + Quality + RIM.', program_domain: 'business_app_modernization', status: 'in_flight', total_budget_usd: 62_000_000, spent_to_date_usd: 27_900_000, exec_sponsor: 'Chief Digital Officer' },
  { name: 'AI governance & ICH E6(R3)', description: 'Internal + Credo AI.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 6_800_000, spent_to_date_usd: 3_944_000, exec_sponsor: 'Chief Compliance Officer', touches_ai: true },
  { name: 'Data platform (Databricks + Snowflake)', description: 'Hybrid analytics platform.', program_domain: 'data_platform', status: 'in_flight', total_budget_usd: 28_000_000, spent_to_date_usd: 18_200_000, exec_sponsor: 'CDO', touches_ai: true },
  { name: 'Shadow AI discovery', description: 'Netskope-based discovery.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 2_200_000, spent_to_date_usd: 1_936_000, exec_sponsor: 'CISO', touches_ai: true },
];

const HELIX_STAFF_AUG = [
  { vendor_name: 'Clinical CRO (composite)', engagement_type: 'managed_service', function_area: 'clinical_operations', headcount_fte: 140, annual_spend_usd: 38_000_000 },
  { vendor_name: 'Pharma data science partner (composite)', engagement_type: 'staff_aug', function_area: 'data_science', headcount_fte: 32, annual_spend_usd: 12_800_000, touches_ai: true },
  { vendor_name: 'Regulatory writers (composite)', engagement_type: 'fixed_bid', function_area: 'regulatory', headcount_fte: 24, annual_spend_usd: 6_960_000 },
  { vendor_name: 'Global SI partner (composite)', engagement_type: 'fixed_bid', function_area: 'platform', headcount_fte: 45, annual_spend_usd: 14_400_000 },
  { vendor_name: 'Pharmacovigilance shop (composite)', engagement_type: 'managed_service', function_area: 'pv_case_processing', headcount_fte: 28, annual_spend_usd: 4_760_000, touches_ai: true },
  { vendor_name: 'Engineering bench (composite)', engagement_type: 'staff_aug', function_area: 'engineering', headcount_fte: 36, annual_spend_usd: 8_640_000 },
];

const HELIX_PARTNERSHIPS: Array<{ type: string; detail: Record<string, unknown>; annualValueUsd?: number }> = [
  { type: 'clinical_trials', detail: { active_trials: 47, of_total: 340, therapeutic_areas: ['cardiology', 'oncology', 'neurology'] }, annualValueUsd: 3_200_000 },
  { type: 'rwe_license', detail: { scope: 'de-identified EHR-linked cohorts', trials_supported: 12 }, annualValueUsd: 8_400_000 },
  { type: 'msl_engagement', detail: { quarterly_visits: 180, specialties: ['cardiology', 'oncology'] } },
  { type: 'patient_recruitment', detail: { vendor: 'Deep 6 AI', recruitment_lift_x: 4.2, peer_avg: '1.0x' } },
  { type: 'shared_vendor', detail: { vendor: 'Tempus Next', use: 'genomics data sharing' } },
  { type: 'shared_vendor', detail: { vendor: 'Flatiron', use: 'oncology RWE subscription overlap' } },
  { type: 'formulary', detail: { helix_drugs_on_meridian_formulary: 8, of_total: 14 } },
  { type: 'medical_info', detail: { monthly_queries: 340, routed_via: 'Within3 + Claude' } },
];

async function main() {
  const sb = getSb();

  // Resolve Helix + Meridian client IDs (migration 037 inserted Helix).
  const { data: clients } = await sb.from('clients').select('id, name').in('name', ['Helix Therapeutics', 'Meridian Health']);
  const byName = new Map(((clients as Array<{ id: string; name: string }> | null) ?? []).map((c) => [c.name, c.id]));
  const helixId = byName.get('Helix Therapeutics');
  const meridianId = byName.get('Meridian Health');
  if (!helixId || !meridianId) {
    console.error('✗ Helix Therapeutics or Meridian Health not found — apply migration 037 first');
    process.exit(1);
  }
  console.log(`▸ Helix ${helixId}  Meridian ${meridianId}`);

  // Wipe prior demo rows for Helix.
  await sb.from('volumetrics_snapshots').delete().eq('client_id', helixId).eq('is_demo_data', true);
  await sb.from('staff_augmentation').delete().eq('client_id', helixId).eq('is_demo_data', true);
  await sb.from('tech_projects').delete().eq('client_id', helixId).eq('is_demo_data', true);
  await sb.from('tech_stack_items').delete().eq('client_id', helixId).eq('is_demo_data', true);
  await sb.from('client_partnerships').delete().eq('source_client_id', helixId).eq('is_demo_data', true);

  // Tech stack
  const techRows = HELIX_TECH_STACK.map((t) => ({
    client_id: helixId,
    category: t.category,
    vendor_name: t.vendor_name,
    product_name: t.product_name ?? null,
    deployment_model: t.deployment_model,
    annual_spend_usd: t.annual_spend_usd,
    seat_count: (t as { seat_count?: number }).seat_count ?? null,
    owning_function: t.owning_function ?? null,
    touches_ai: t.touches_ai ?? false,
    status: 'active' as const,
    is_demo_data: true,
  }));
  const { error: tErr } = await sb.from('tech_stack_items').insert(techRows);
  if (tErr) console.error(`  ✗ tech_stack: ${tErr.message}`);
  else console.log(`  ✓ tech_stack_items · ${techRows.length} rows`);

  // Projects
  const projRows = HELIX_PROJECTS.map((p) => ({
    client_id: helixId,
    name: p.name,
    description: p.description,
    program_domain: p.program_domain,
    status: p.status,
    total_budget_usd: p.total_budget_usd,
    spent_to_date_usd: p.spent_to_date_usd,
    exec_sponsor: p.exec_sponsor,
    touches_ai: (p as { touches_ai?: boolean }).touches_ai ?? false,
    is_demo_data: true,
  }));
  const { error: pErr } = await sb.from('tech_projects').insert(projRows);
  if (pErr) console.error(`  ✗ projects: ${pErr.message}`);
  else console.log(`  ✓ tech_projects · ${projRows.length} rows`);

  // Staff aug
  const augRows = HELIX_STAFF_AUG.map((s) => ({
    client_id: helixId,
    vendor_name: s.vendor_name,
    engagement_type: s.engagement_type,
    function_area: s.function_area,
    headcount_fte: s.headcount_fte,
    annual_spend_usd: s.annual_spend_usd,
    touches_ai: (s as { touches_ai?: boolean }).touches_ai ?? false,
    is_demo_data: true,
  }));
  const { error: sErr } = await sb.from('staff_augmentation').insert(augRows);
  if (sErr) console.error(`  ✗ staff_aug: ${sErr.message}`);
  else console.log(`  ✓ staff_augmentation · ${augRows.length} rows`);

  // Volumetrics (30 days, biotech profile — heavier on tokens, lighter on queries)
  const today = new Date();
  const volRows = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const variance = 1 + (Math.sin(i / 3.3) * 0.05 + (Math.random() - 0.5) * 0.04);
    volRows.push({
      client_id: helixId,
      snapshot_date: iso(d),
      api_calls_millions: +(38 * variance).toFixed(2),
      tokens_billions: +(12.4 * variance).toFixed(2),
      storage_tb: 6800,
      queries_millions: +(14 * variance).toFixed(2),
      active_models: 62,
      data_pipelines: 240,
      is_demo_data: true,
    });
  }
  const { error: vErr } = await sb.from('volumetrics_snapshots').upsert(volRows, { onConflict: 'client_id,snapshot_date' });
  if (vErr) console.error(`  ✗ volumetrics: ${vErr.message}`);
  else console.log(`  ✓ volumetrics_snapshots · ${volRows.length} days`);

  // Helix ↔ Meridian partnerships
  const partnershipRows = HELIX_PARTNERSHIPS.map((p) => ({
    source_client_id: helixId,
    target_client_id: meridianId,
    relationship_type: p.type,
    detail: p.detail,
    annual_value_usd: p.annualValueUsd ?? null,
    is_demo_data: true,
  }));
  const { error: partErr } = await sb.from('client_partnerships').upsert(partnershipRows, {
    onConflict: 'source_client_id,target_client_id,relationship_type',
  });
  if (partErr) console.error(`  ✗ partnerships: ${partErr.message}`);
  else console.log(`  ✓ client_partnerships · ${partnershipRows.length} rows (Helix → Meridian)`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

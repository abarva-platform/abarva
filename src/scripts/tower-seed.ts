import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Stage =
  | 'idea'
  | 'qualify'
  | 'design'
  | 'evidence'
  | 'review'
  | 'execute'
  | 'realize'
  | 'stalled';

interface UseCaseSeed {
  name: string;
  description: string;
  business_unit: string;
  domain: string;
  stage: Stage;
  systems: string[];
  ai_type: string;
  scope: string;
  vendor: string;
  usage?: { dau: number; wau: number; penetration_pct: number; drop_off_rate_pct: number; interactions_total: number };
  value?: { metric: string; baseline: number; target: number; observed: number; unit: string; confidence: 'high' | 'medium' | 'proxy' | 'estimate'; driver: string };
  risk?: {
    data: string[];
    risk_level: 'high' | 'medium' | 'low';
    governance: 'approved' | 'conditional' | 'pending';
    hitl: boolean;
    vendor_posture: string;
    bias_incidents?: number;
  };
  cost?: { llm: number; compute: number; storage: number; license: number; integration: number; projected_6mo: number };
}

const MERIDIAN_USE_CASES: UseCaseSeed[] = [
  {
    name: 'Copilot Clinical Documentation',
    description: 'Microsoft Copilot deployed to clinical staff for note drafting',
    business_unit: 'Clinical',
    domain: 'Clinical',
    stage: 'execute',
    systems: ['Microsoft Copilot', 'Epic'],
    ai_type: 'GenAI',
    scope: 'enterprise',
    vendor: 'Microsoft Copilot',
    usage: { dau: 2300, wau: 8400, penetration_pct: 62, drop_off_rate_pct: 45, interactions_total: 184000 },
    risk: { data: ['PHI'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' },
    cost: { llm: 120000, compute: 30000, storage: 5000, license: 20000, integration: 5000, projected_6mo: 1260000 },
  },
  {
    name: 'Claims Auto-Triage',
    description: 'ML classifier routing denial claims to appropriate recovery teams',
    business_unit: 'Revenue Cycle',
    domain: 'Revenue Cycle',
    stage: 'realize',
    systems: ['Epic', 'custom ML'],
    ai_type: 'ML',
    scope: 'department',
    vendor: 'custom',
    usage: { dau: 180, wau: 820, penetration_pct: 88, drop_off_rate_pct: 12, interactions_total: 42000 },
    value: {
      metric: 'tickets/day/agent',
      baseline: 100,
      target: 140,
      observed: 122,
      unit: 'count',
      confidence: 'medium',
      driver: 'capacity_creation',
    },
    risk: { data: ['PHI', 'financial'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'no_training' },
    cost: { llm: 8000, compute: 14000, storage: 1500, license: 0, integration: 2000, projected_6mo: 160000 },
  },
  {
    name: 'Patient Messaging Assist',
    description: 'AI-drafted responses to patient portal inquiries, reviewed by staff',
    business_unit: 'Clinical',
    domain: 'Patient Access',
    stage: 'evidence',
    systems: ['Epic MyChart', 'Claude Enterprise'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'Anthropic Claude Enterprise',
    usage: { dau: 340, wau: 1100, penetration_pct: 54, drop_off_rate_pct: 30, interactions_total: 22000 },
    value: {
      metric: 'avg response time (minutes)',
      baseline: 240,
      target: 30,
      observed: 45,
      unit: 'minutes',
      confidence: 'high',
      driver: 'experience_improvement',
    },
    risk: { data: ['PHI'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier', bias_incidents: 2 },
    cost: { llm: 42000, compute: 6000, storage: 2000, license: 0, integration: 4000, projected_6mo: 360000 },
  },
  {
    name: 'Coding Audit Copilot',
    description: 'Assistive tool for ICD-10 coding accuracy review',
    business_unit: 'Revenue Cycle',
    domain: 'Revenue Cycle',
    stage: 'review',
    systems: ['Epic', 'Azure OpenAI'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'Azure OpenAI',
    usage: { dau: 60, wau: 210, penetration_pct: 35, drop_off_rate_pct: 28, interactions_total: 5800 },
    risk: { data: ['PHI', 'financial'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' },
    cost: { llm: 11000, compute: 3000, storage: 500, license: 0, integration: 1000, projected_6mo: 105000 },
  },
  {
    name: 'Staffing Forecast Model',
    description: 'Predictive model for nurse staffing levels based on census + acuity',
    business_unit: 'Operations',
    domain: 'Workforce',
    stage: 'execute',
    systems: ['Workday', 'custom ML'],
    ai_type: 'ML',
    scope: 'enterprise',
    vendor: 'custom',
    usage: { dau: 40, wau: 95, penetration_pct: 72, drop_off_rate_pct: 10, interactions_total: 1800 },
    value: {
      metric: 'agency spend USD/month',
      baseline: 420000,
      target: 250000,
      observed: 310000,
      unit: 'usd',
      confidence: 'medium',
      driver: 'cost_takeout',
    },
    risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'no_training' },
    cost: { llm: 0, compute: 22000, storage: 3000, license: 0, integration: 2000, projected_6mo: 175000 },
  },
  {
    name: 'Recruiting Screen Assistant',
    description: 'AI résumé screening for clinical roles',
    business_unit: 'HR',
    domain: 'Talent',
    stage: 'stalled',
    systems: ['Workday', 'custom'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'custom',
    risk: { data: ['PII'], risk_level: 'high', governance: 'pending', hitl: true, vendor_posture: 'unknown', bias_incidents: 0 },
    cost: { llm: 4000, compute: 1000, storage: 500, license: 0, integration: 500, projected_6mo: 38000 },
  },
  {
    name: 'IT Service Desk Agent',
    description: 'L1 ticket triage + automated resolution for common requests',
    business_unit: 'IT',
    domain: 'IT Operations',
    stage: 'execute',
    systems: ['ServiceNow'],
    ai_type: 'Agent',
    scope: 'enterprise',
    vendor: 'ServiceNow',
    usage: { dau: 210, wau: 610, penetration_pct: 45, drop_off_rate_pct: 18, interactions_total: 14000 },
    value: {
      metric: 'avg resolution time (hours)',
      baseline: 6.5,
      target: 2.0,
      observed: 3.2,
      unit: 'hours',
      confidence: 'medium',
      driver: 'capacity_creation',
    },
    risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' },
    cost: { llm: 9000, compute: 4000, storage: 1000, license: 8000, integration: 2000, projected_6mo: 180000 },
  },
  {
    name: 'Revenue Forecast Assistant',
    description: 'Executive dashboard AI explainer for monthly revenue projections',
    business_unit: 'Finance',
    domain: 'FP&A',
    stage: 'design',
    systems: ['SAP', 'Tableau', 'Claude'],
    ai_type: 'GenAI',
    scope: 'single_workflow',
    vendor: 'Anthropic Claude Enterprise',
    risk: { data: ['financial'], risk_level: 'medium', governance: 'pending', hitl: true, vendor_posture: 'enterprise_tier' },
  },
  {
    name: 'Cardiology Imaging Assist',
    description: 'Second-read ML for echocardiogram anomaly detection',
    business_unit: 'Clinical',
    domain: 'Imaging',
    stage: 'qualify',
    systems: ['Epic', 'PACS'],
    ai_type: 'ML',
    scope: 'department',
    vendor: 'custom',
    risk: { data: ['PHI'], risk_level: 'high', governance: 'pending', hitl: true, vendor_posture: 'no_training' },
  },
  {
    name: 'Chart Summarization',
    description: 'Shift-handoff patient summaries from EMR',
    business_unit: 'Clinical',
    domain: 'Clinical',
    stage: 'idea',
    systems: ['Epic'],
    ai_type: 'GenAI',
    scope: 'department',
    vendor: 'Azure OpenAI',
  },
];

async function wipeClient(clientId: string) {
  // Delete in FK order: contradictions → child metric tables → use_cases
  await sb.from('contradictions').delete().eq('client_id', clientId);
  const { data: ucs } = await sb.from('use_cases').select('id').eq('client_id', clientId).eq('source', 'seed');
  const ids = ((ucs as Array<{ id: string }> | null) ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await sb.from('use_case_risk').delete().in('use_case_id', ids);
    await sb.from('use_case_usage_metrics').delete().in('use_case_id', ids);
    await sb.from('use_case_value_metrics').delete().in('use_case_id', ids);
    await sb.from('use_case_cost_metrics').delete().in('use_case_id', ids);
    await sb.from('use_cases').delete().in('id', ids);
  }
}

async function seedClient(clientName: string, useCases: UseCaseSeed[]) {
  const { data: clientRow, error } = await sb.from('clients').select('id').eq('name', clientName).maybeSingle();
  if (error || !clientRow) {
    console.error(`Client "${clientName}" not found. Run migration 020 + 022 first.`);
    return;
  }
  const clientId = (clientRow as { id: string }).id;
  console.log(`\n▸ Seeding ${clientName} (${clientId}) · ${useCases.length} use cases`);

  await wipeClient(clientId);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);
  const periodStartIso = periodStart.toISOString().slice(0, 10);
  const periodEndIso = periodEnd.toISOString().slice(0, 10);

  for (const uc of useCases) {
    const { data: inserted, error: ucErr } = await sb
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
        source: 'seed' as const,
      })
      .select('id')
      .single();
    if (ucErr || !inserted) {
      console.error(`  ✗ ${uc.name}: ${ucErr?.message}`);
      continue;
    }
    const ucId = (inserted as { id: string }).id;
    console.log(`  ✓ ${uc.name}`);

    if (uc.usage) {
      await sb.from('use_case_usage_metrics').insert({
        use_case_id: ucId,
        period_start: periodStartIso,
        period_end: periodEndIso,
        dau: uc.usage.dau,
        wau: uc.usage.wau,
        penetration_pct: uc.usage.penetration_pct,
        drop_off_rate_pct: uc.usage.drop_off_rate_pct,
        interactions_total: uc.usage.interactions_total,
        source: 'seed' as const,
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
        source: 'seed' as const,
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
        source: 'seed' as const,
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
        trajectory_confidence: 'medium' as const,
        source: 'seed' as const,
      });
    }
  }

  // Contradictions — demo-driven, referenced by use case name
  const { data: ucRows } = await sb.from('use_cases').select('id, name').eq('client_id', clientId);
  const byName = new Map(((ucRows as Array<{ id: string; name: string }> | null) ?? []).map((r) => [r.name, r.id]));

  const contradictions: Array<Record<string, unknown>> = [];
  if (clientName === 'Meridian Health') {
    contradictions.push(
      {
        client_id: clientId,
        use_case_id: byName.get('Copilot Clinical Documentation'),
        contradiction_type: 'cost_vs_adoption',
        severity: 'high',
        description: 'Copilot clinical running $180K/month with 45% drop-off and no baseline captured.',
        suggested_action: 'Diagnose engagement — quantify actual time savings, decide reinvest vs cut.',
        evidence: { monthly_spend: 180000, drop_off_pct: 45, baseline: 'missing' },
      },
      {
        client_id: clientId,
        use_case_id: byName.get('Patient Messaging Assist'),
        contradiction_type: 'value_vs_adoption',
        severity: 'medium',
        description: 'Response-time claim strong but drop-off rising — users abandoning the workflow.',
        suggested_action: 'Rescope — either fix the UX or stop claiming the value.',
        evidence: { drop_off_pct: 30, observed_minutes: 45, target_minutes: 30 },
      },
      {
        client_id: clientId,
        use_case_id: byName.get('Claims Auto-Triage'),
        contradiction_type: 'risk_vs_data',
        severity: 'high',
        description: 'Approved use case handling PHI + financial data. Vendor data posture needs fresh review.',
        suggested_action: 'Governance check — confirm no_training contract still holds.',
        evidence: { data_classes: ['PHI', 'financial'], last_reviewed: 'unknown' },
      },
      {
        client_id: clientId,
        contradiction_type: 'cost_trajectory',
        severity: 'medium',
        description: 'Projected 6mo spend tracks 1.75x current. Usage policy review before seat expansion.',
        suggested_action: 'Cost governance engagement — set rate cards + policy limits.',
        evidence: { multiplier: 1.75, driver: 'Copilot seat growth + LLM expansion' },
      },
      {
        client_id: clientId,
        contradiction_type: 'shadow_ai',
        severity: 'high',
        description: 'Inventory lists 10 use cases. Azure billing shows OpenAI spend not tied to any inventory record.',
        suggested_action: 'Shadow AI discovery — trace rogue API keys to their business owners.',
        evidence: { inventoried: 10, untraced_monthly_usd: 24000 },
      },
    );
  } else if (clientName === 'First Capital') {
    contradictions.push({
      client_id: clientId,
      contradiction_type: 'value_vs_baseline',
      severity: 'medium',
      description: 'Wealth platform rebuild in-flight but no baseline spend/hours captured yet.',
      suggested_action: 'Capture baseline before Phase 2 close.',
      evidence: { phase: 3, baselines_missing: true },
    });
  }

  if (contradictions.length > 0) {
    const { error: cErr } = await sb.from('contradictions').insert(contradictions);
    if (cErr) console.error(`  contradiction insert: ${cErr.message}`);
    else console.log(`  ✓ ${contradictions.length} contradictions`);
  }
}

async function main() {
  await seedClient('Meridian Health', MERIDIAN_USE_CASES);

  // Arcturus / Apex — minimal, just 2-3 use cases each to show partial state
  await seedClient('First Capital', [
    {
      name: 'Advisor Copilot Draft',
      description: 'Drafted client commentary for advisors',
      business_unit: 'Wealth',
      domain: 'Front Office',
      stage: 'design',
      systems: ['Salesforce', 'Claude'],
      ai_type: 'GenAI',
      scope: 'department',
      vendor: 'Anthropic Claude Enterprise',
      cost: { llm: 18000, compute: 2000, storage: 500, license: 0, integration: 1500, projected_6mo: 144000 },
    },
    {
      name: 'Alt-Asset Report Classifier',
      description: 'ML classifier for alternative-asset reporting anomalies',
      business_unit: 'Operations',
      domain: 'Middle Office',
      stage: 'evidence',
      systems: ['custom ML'],
      ai_type: 'ML',
      scope: 'department',
      vendor: 'custom',
      risk: { data: ['financial'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'no_training' },
    },
  ]);

  await seedClient('Apex Retail', [
    {
      name: 'HR ERP Chat Assistant',
      description: 'Self-service HR chatbot for store managers',
      business_unit: 'HR',
      domain: 'Back Office',
      stage: 'idea',
      systems: ['Workday', 'Copilot'],
      ai_type: 'GenAI',
      scope: 'enterprise',
      vendor: 'Microsoft Copilot',
    },
  ]);

  console.log('\n✓ Tower seed complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

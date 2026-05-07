import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSeedClient, loadSeedEnv, TENANTS, type TenantKey } from './seed-wave-lib';

interface ClientRow {
  id: string;
  name: string;
}

async function resolveClient(sb: SupabaseClient, tenantKey: TenantKey): Promise<ClientRow> {
  const tenant = TENANTS[tenantKey];
  for (const field of [
    { column: 'name', value: tenant.shortName },
    { column: 'name', value: tenant.canonicalName },
    { column: 'legal_name', value: tenant.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error(`Client missing for ${tenant.canonicalName}. Run base + overlay seeds first.`);
}

async function upsertRows(sb: SupabaseClient, table: string, rows: Array<Record<string, unknown>>, onConflict = 'id'): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();
  const clients = new Map<TenantKey, ClientRow>();
  for (const tenantKey of ['apex', 'meridian', 'first_capital'] as const) {
    clients.set(tenantKey, await resolveClient(sb, tenantKey));
  }

  const foundationalRows = [
    {
      id: 'pattern_shadow_ai_governance',
      name: 'Shadow AI Governance',
      short_description: 'AI adoption outpacing governance, creating compounding compliance, data, security, and cost risk.',
      long_description:
        'Enterprise teams are adopting AI faster than governance can catalog, assess, and control. The resulting gap creates data exposure, regulatory, shadow-spend, and model-risk issues that compound across business units.',
      category: 'AI Governance and Technology Sprawl',
      cross_industry: true,
      sector_applicability: ['retail', 'healthcare', 'financial_services', 'utilities'],
      variant_of: null,
      related_patterns: ['analytics_modernization', 'vendor_sprawl_and_tool_rationalization', 'operating_model_decision_latency_reduction'],
      trigger_symptoms: [
        'AI tool proliferation without central inventory',
        'Procurement requests below governance thresholds',
        'Policy written but enforcement unclear',
        'Customer or regulator questions about AI use with no ready answer',
      ],
      detection_signals: [
        {
          signal_name: 'AI tool inventory audit',
          signal_type: 'evidence_pattern',
          threshold: '>5 AI-adjacent tools below central procurement threshold in 12 months',
          evidence_source: ['procurement records', 'expense reports', 'vendor contracts', 'IT asset management'],
        },
        {
          signal_name: 'Policy vs practice gap',
          signal_type: 'contradiction',
          threshold: '>=3 documented instances of AI use outside stated policy',
          evidence_source: ['policy documents', 'tool inventory', 'known use cases'],
        },
        {
          signal_name: 'Unreviewed data sharing',
          signal_type: 'evidence_pattern',
          threshold: '>=2 AI tools with unresolved training-data or privacy review',
          evidence_source: ['vendor terms', 'legal review records', 'privacy assessments'],
        },
      ],
      diagnostic_questions: [
        'What is the actual inventory of AI tools in use across the enterprise?',
        'Which tools have passed legal, privacy, and security review?',
        'Who owns enterprise-wide AI governance?',
        'What regulated workflows are currently touched by AI?',
      ],
      evidence_requirements: [
        'AI tool inventory or procurement triangulation',
        'Documented governance policy',
        'At least 3 concrete AI use cases',
        'Representative vendor contract review sample',
      ],
      likely_root_causes: [
        { title: 'Decentralized procurement under governance thresholds', prevalence: 'universal' },
        { title: 'Policy without enforcement', prevalence: 'high' },
        { title: 'Vendor embedded AI features', prevalence: 'high' },
        { title: 'Personal-account AI use', prevalence: 'high' },
      ],
      intervention_options: [
        { title: 'Enterprise AI platform with sanctioned access', time_to_value: '6-12 months' },
        { title: 'AI governance framework with procurement integration', time_to_value: '3-6 months' },
        { title: 'Tool consolidation leveraging enterprise contracts', time_to_value: '6-12 months' },
        { title: 'Model risk management for decision-critical AI', time_to_value: '9-18 months' },
      ],
      anti_patterns: ['Blanket AI ban', 'Governance without enablement', 'One-time audit without ongoing discipline'],
      failure_modes: [
        'Platform built without adoption planning',
        'Governance written without operational enforcement',
        'Consolidation path does not cover real use cases',
      ],
      phase_1_deliverables: [
        'AI Tool Inventory Audit',
        'Spend and Contract Posture Analysis',
        'Governance vs Practice Contradiction Documentation',
        'Sector-Specific Regulatory Exposure Assessment',
        'AI Governance Maturity Assessment',
      ],
      phase_2_deliverables: [
        'Root Cause Analysis',
        'Enterprise AI Platform Options Assessment',
        'Governance Framework Options',
        'Tool Consolidation Targets',
        'Stakeholder Mapping',
      ],
      phase_3_deliverables: [
        'Enterprise AI Platform Commitment',
        'Governance Framework Finalization',
        'Tool Consolidation Roadmap',
        'Migration and Sunset Plan',
        'Sector-Specific Compliance Integration',
      ],
      phase_4_deliverables: [
        'Platform Deployment',
        'Governance Operationalization',
        'Tool Consolidation Execution',
        'AI Governance Maturity KPI Tracking',
        'Workforce Enablement',
      ],
      expected_outcomes: [
        '40-60% reduction in shadow AI spend within 18 months',
        'AI governance maturity progresses at least one stage',
        'Governance-reviewed AI spend rises above 85%',
      ],
      success_metrics: [
        { metric: 'shadow_ai_spend_reduction', expected_direction: 'down' },
        { metric: 'ai_governance_maturity', expected_direction: 'up' },
        { metric: 'governance_reviewed_ai_share', expected_direction: 'up' },
      ],
      required_sponsor_profile: 'Chief Information Officer, Chief Technology Officer, Chief Data Officer, or regulated-sector compliance leader',
      evidence_base: [
        'Enterprise AI governance research (2024-2025)',
        'Composite observation across AbarVa tenants',
        'Sector-specific regulatory guidance',
      ],
      confidence_level: 'high',
      version: '1.0',
      author: 'AbarVa foundational pattern library',
      raw_markdown: 'docs/specs/_meta/seed-data/pattern-pack-01-shadow-ai-governance.md',
      metadata: {
        pattern_key: 'shadow_ai_governance',
        source_spec: 'pattern-pack-01-shadow-ai-governance.md',
      },
    },
  ];

  const variantRows = [
    {
      id: 'pattern_shadow_ai_governance_apex',
      foundational_pattern_id: 'pattern_shadow_ai_governance',
      client_id: clients.get('apex')?.id,
      variant_pattern_pack_id: 'apex_pattern_shadow_ai_in_merchandising_and_customer_operations',
      tenant_key: 'apex',
      variant_name: 'Shadow AI in Merchandising and Customer Operations',
      sector: 'retail',
      evidence_summary: '14 AI tools identified, 9 below governance threshold, 3 customer-facing, 2 pricing-decision-adjacent.',
      linked_kpi_ids: ['apex_ai_governance_maturity', 'apex_csat_omnichannel', 'apex_conversion_rate'],
      sensitivities: ['pricing decision integration', 'customer data handling', 'retail workflow sprawl'],
      metadata: { source_spec: 'pattern-pack-01-shadow-ai-governance.md', variant_section: '11.1' },
    },
    {
      id: 'pattern_shadow_ai_governance_meridian',
      foundational_pattern_id: 'pattern_shadow_ai_governance',
      client_id: clients.get('meridian')?.id,
      variant_pattern_pack_id: 'meridian_pattern_shadow_ai_in_clinical_and_revenue_cycle_operations',
      tenant_key: 'meridian',
      variant_name: 'Shadow AI in Clinical and Revenue Cycle Operations',
      sector: 'healthcare',
      evidence_summary: '16 AI tools identified, 4 with PHI exposure unclear BAA status, 2 clinical-decision-adjacent, 3 revenue-cycle uses.',
      linked_kpi_ids: ['meridian_ai_governance_maturity', 'meridian_cybersecurity_maturity'],
      sensitivities: ['HIPAA', 'clinical decision liability', 'payer-audit exposure'],
      metadata: { source_spec: 'pattern-pack-01-shadow-ai-governance.md', variant_section: '11.2' },
    },
    {
      id: 'pattern_shadow_ai_governance_firstcap',
      foundational_pattern_id: 'pattern_shadow_ai_governance',
      client_id: clients.get('first_capital')?.id,
      variant_pattern_pack_id: 'firstcap_pattern_shadow_ai_in_lending_and_customer_operations',
      tenant_key: 'first_capital',
      variant_name: 'Shadow AI in Lending and Customer Operations',
      sector: 'financial_services',
      evidence_summary: '12 AI tools identified, 7 below governance threshold, 3 credit-adjacent workflows, 2 customer-facing uses.',
      linked_kpi_ids: ['firstcap_ai_governance_maturity', 'firstcap_model_risk_management_maturity', 'firstcap_cybersecurity_maturity'],
      sensitivities: ['fair lending', 'SR 11-7', 'GLBA data handling'],
      metadata: { source_spec: 'pattern-pack-01-shadow-ai-governance.md', variant_section: '11.3' },
    },
  ];

  await upsertRows(sb, 'foundational_pattern_packs', foundationalRows);
  await upsertRows(sb, 'foundational_pattern_variants', variantRows);

  console.log('\nFoundational patterns seeded');
  console.log(`  foundational packs · ${foundationalRows.length}`);
  console.log(`  tenant variants    · ${variantRows.length}`);
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

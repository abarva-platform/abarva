import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

const TENANT_KEY = 'meridian-health';
const SEGMENT_ID = 'ai_transformation';
const RESEARCH_DOMAIN = 'research_portfolio';
const SOURCE_DOC = 'meridian-research-substrate-v1';
const SOURCE_BASIS = 'synthetic_research_profile';
const UPLOADED_BY = 'Meridian research substrate seed - 2026-05-10';
const LAST_REVIEWED = '2026-05-10';

type ResearchRecord = {
  recordId: string;
  title: string;
  kind: string;
  text: string;
  payload: Record<string, unknown>;
  classification?: string;
  confidence?: number;
};

type GraphNode = {
  node_id: string;
  node_type: string;
  label: string;
  properties: Record<string, unknown>;
  confidence?: number;
  data_classification?: string;
};

type GraphEdge = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  properties?: Record<string, unknown>;
  confidence?: number;
};

const records: ResearchRecord[] = [
  {
    recordId: 'research_portfolio:enterprise_research_profile',
    title: 'Meridian Research Enterprise Profile',
    kind: 'research_enterprise_profile',
    text: [
      'Meridian Health System operates a research enterprise alongside its provider and health plan operations.',
      'The assumed FY2025 research spend baseline is $286M, equal to roughly 1.7% of the current Meridian revenue baseline used in the data room.',
      '$112M is externally sponsored through federal grants, foundations, pharma, device, and digital health partnerships; $174M is internally funded through service-line innovation, population health analytics, clinical AI validation, and investigator support.',
      'Research is concentrated in oncology, cardiometabolic disease, population health, health equity, clinical AI, care-at-home, and revenue-cycle / access science.',
    ].join('\n'),
    payload: {
      annual_research_spend_usd: 286000000,
      external_sponsored_research_usd: 112000000,
      internal_research_innovation_usd: 174000000,
      research_spend_pct_revenue: 1.7,
      active_studies: 730,
      interventional_trials: 118,
      ai_or_data_studies: 42,
      primary_domains: ['oncology', 'cardiometabolic', 'population_health', 'health_equity', 'clinical_ai', 'care_at_home', 'access_and_rcm_science'],
    },
  },
  {
    recordId: 'research_portfolio:spend_model_fy2025',
    title: 'FY2025 Research Spend Model',
    kind: 'research_financial_model',
    text: [
      'Meridian research spend is assumed at $286M for FY2025.',
      'The mix is 39% externally sponsored and 61% internally funded.',
      'The CFO treats research as strategic but now requires clearer attribution between research activity, clinical differentiation, grant recovery, commercial partnership value, care-quality improvement, and operating margin impact.',
      'Research finance has a $21M indirect-cost recovery gap, driven by inconsistent study startup costing, delayed sponsor invoicing, and under-captured data services labor.',
    ].join('\n'),
    payload: {
      fy2025_research_spend_usd: 286000000,
      externally_sponsored_pct: 39,
      internally_funded_pct: 61,
      indirect_cost_recovery_gap_usd: 21000000,
      study_startup_cycle_days: 94,
      target_study_startup_cycle_days: 62,
      sponsor_invoicing_lag_days: 41,
      target_sponsor_invoicing_lag_days: 21,
    },
  },
  {
    recordId: 'research_portfolio:grant_portfolio',
    title: 'Sponsored Research and Grant Portfolio',
    kind: 'grant_portfolio',
    text: [
      'The sponsored research portfolio includes NIH, PCORI, CMS Innovation Center, foundation, pharma, device, and digital health sponsors.',
      'FY2025 active award value is assumed at $112M with $38M in new awards and $74M in continuing awards.',
      'Population health and care-at-home grants are strategically important because they support Meridian Health Plans and value-based care performance.',
      'The biggest operating risk is not grant volume; it is fragmented cost tracking and slow contract-to-activation handoff.',
    ].join('\n'),
    payload: {
      active_award_value_usd: 112000000,
      new_awards_usd: 38000000,
      continuing_awards_usd: 74000000,
      sponsor_mix: {
        federal: 0.46,
        foundations: 0.13,
        pharma_device: 0.24,
        digital_health_and_data_partners: 0.17,
      },
      risk: 'contract_to_activation_handoff',
    },
  },
  {
    recordId: 'research_portfolio:clinical_trials_baseline',
    title: 'Clinical Trials Baseline',
    kind: 'clinical_trials_baseline',
    text: [
      'Meridian has 730 active studies, including 118 interventional trials and 42 AI or data-enabled studies.',
      'Oncology and cardiometabolic trials have the strongest investigator depth; digital health trials have the most sponsor interest but weaker operating discipline.',
      'Trial activation takes 94 days on average against a 62-day target.',
      'Patient diversity tracking is present but not yet consistently linked to recruitment interventions.',
    ].join('\n'),
    payload: {
      active_studies: 730,
      interventional_trials: 118,
      observational_registry_studies: 301,
      pragmatic_trials: 54,
      ai_or_data_enabled_studies: 42,
      avg_activation_days: 94,
      target_activation_days: 62,
      priority_therapeutic_areas: ['oncology', 'cardiometabolic', 'behavioral_health', 'maternal_health', 'population_health'],
    },
  },
  {
    recordId: 'research_portfolio:irb_and_compliance',
    title: 'Research IRB and Compliance Posture',
    kind: 'research_compliance',
    text: [
      'Research governance is mature but strained by clinical AI and real-world evidence studies.',
      'The IRB has an average review cycle of 28 days for full-board reviews and 11 days for expedited reviews.',
      'The board requires explicit HIPAA authorization or waiver logic, model monitoring plans for AI studies, data-use agreements for external partners, and audit trails for PHI-to-deidentified transformations.',
      'The compliance team flags AI research governance as an executive attention area because the same models can move from research validation to care operations faster than policy currently allows.',
    ].join('\n'),
    payload: {
      full_board_review_days: 28,
      expedited_review_days: 11,
      annual_irb_submissions: 1180,
      ai_studies_requiring_model_monitoring: 42,
      required_controls: ['hipaa_authorization_or_waiver', 'dua', 'baa_where_needed', 'model_monitoring_plan', 'deidentification_audit_trail'],
      executive_attention: true,
    },
    classification: 'Confidential',
  },
  {
    recordId: 'research_portfolio:systems_landscape',
    title: 'Research Systems Landscape',
    kind: 'research_systems',
    text: [
      'Meridian research operations depend on OnCore CTMS, Epic Research, REDCap, Florence eBinders, TriNetX, Snowflake Research Safe Harbor, and PowerBI research finance dashboards.',
      'The current weakness is integration, not system absence.',
      'Study status, budget, contract, subject accrual, and sponsor invoicing signals are not yet reconciled into one executive research view.',
      'This creates a natural sourcing and platform-modernization question for the CIO/CDIO: consolidate research operations data before scaling more AI-enabled research workflows.',
    ].join('\n'),
    payload: {
      systems: ['OnCore CTMS', 'Epic Research', 'REDCap', 'Florence eBinders', 'TriNetX', 'Snowflake Research Safe Harbor', 'PowerBI Research Finance'],
      integration_gap: 'study_budget_contract_accrual_invoicing_not_reconciled',
      modernization_need: 'research_operations_data_product',
    },
  },
  {
    recordId: 'research_portfolio:data_governance',
    title: 'Research Data Governance and Safe Harbor',
    kind: 'research_data_governance',
    text: [
      'Research data governance is organized around a Snowflake Research Safe Harbor with role-based access, deidentification workflows, limited data set controls, and approved partner extracts.',
      'The strongest control is policy clarity around PHI and limited data sets.',
      'The weakest control is operational lineage once research extracts are combined with plan, claims, device, and patient-reported outcome data.',
      'This matters for Meridian AI because research-grade evidence and operational AI evidence can blur if model validation studies are not separated from production monitoring.',
    ].join('\n'),
    payload: {
      safe_harbor_platform: 'Snowflake Research Safe Harbor',
      controls: ['rbac', 'deidentification', 'limited_data_set_controls', 'approved_partner_extracts', 'audit_logs'],
      weak_control: 'cross_domain_lineage_after_data_combination',
      linked_ai_risk: 'research_validation_vs_production_monitoring_boundary',
    },
    classification: 'Confidential',
  },
  {
    recordId: 'research_portfolio:academic_and_industry_partnerships',
    title: 'Academic and Industry Research Partnerships',
    kind: 'research_partnerships',
    text: [
      'Meridian maintains research partnerships with a West Coast academic medical center consortium, two device sponsors, three pharma sponsors, and four digital health / AI vendors.',
      'The most strategically relevant partnerships are in ambient documentation validation, oncology pathways, cardiometabolic risk prediction, care-at-home monitoring, and health equity analytics.',
      'The partnership office is asking for clearer sourcing standards because research pilots often become enterprise vendor decisions without a commercial evaluation gate.',
    ].join('\n'),
    payload: {
      academic_partnerships: 3,
      pharma_partnerships: 3,
      device_partnerships: 2,
      digital_health_ai_partnerships: 4,
      decision_risk: 'research_pilot_to_enterprise_vendor_without_commercial_gate',
      domains: ['ambient_documentation', 'oncology_pathways', 'cardiometabolic_risk', 'care_at_home', 'health_equity_analytics'],
    },
  },
  {
    recordId: 'research_portfolio:ai_research_pipeline',
    title: 'AI Research Pipeline',
    kind: 'ai_research_pipeline',
    text: [
      'Meridian has 42 AI or data-enabled research studies.',
      'The pipeline includes ambient documentation validation, sepsis model fairness monitoring, readmission risk recalibration, prior authorization burden analysis, oncology pathway adherence, nursing workforce prediction, and care-at-home deterioration detection.',
      'The top executive issue is not idea generation; it is deciding which studies are research only, which should become governed clinical operations, and which should trigger Source for vendor selection.',
    ].join('\n'),
    payload: {
      ai_research_studies: 42,
      candidate_operationalization_studies: 9,
      domains: ['ambient_documentation', 'sepsis_fairness', 'readmission_risk', 'prior_authorization', 'oncology_pathways', 'workforce_prediction', 'care_at_home'],
      decision_need: 'research_to_operations_gate',
    },
  },
  {
    recordId: 'research_portfolio:research_kpi_startup_cycle',
    title: 'Research KPI - Study Startup Cycle Time',
    kind: 'research_kpi',
    text: 'Average study startup cycle time is 94 days against a 62-day executive target. This is a key measure for research operations modernization.',
    payload: { kpi_id: 'kpi:meridian:research:startup_cycle_days', current_value: 94, target_value: 62, unit: 'days', owner: 'VP Research Operations' },
  },
  {
    recordId: 'research_portfolio:research_kpi_indirect_cost_recovery',
    title: 'Research KPI - Indirect Cost Recovery',
    kind: 'research_kpi',
    text: 'Indirect cost recovery gap is estimated at $21M, driven by delayed sponsor billing and inconsistent data-services costing.',
    payload: { kpi_id: 'kpi:meridian:research:indirect_cost_recovery_gap', current_value: 21000000, target_value: 8000000, unit: 'USD', owner: 'Research Finance' },
  },
  {
    recordId: 'research_portfolio:research_kpi_trial_accrual',
    title: 'Research KPI - Trial Accrual Performance',
    kind: 'research_kpi',
    text: 'Trial accrual performance is 78% of planned enrollment at midpoint review; target is 92%. Diversity-adjusted accrual is tracked but inconsistently acted on.',
    payload: { kpi_id: 'kpi:meridian:research:trial_accrual_pct', current_value: 78, target_value: 92, unit: 'percent', owner: 'Clinical Research Institute' },
  },
  {
    recordId: 'research_portfolio:research_kpi_ai_validation_backlog',
    title: 'Research KPI - AI Validation Backlog',
    kind: 'research_kpi',
    text: 'AI validation backlog is 17 studies awaiting model monitoring, fairness, or data-use approvals before operational transition.',
    payload: { kpi_id: 'kpi:meridian:research:ai_validation_backlog', current_value: 17, target_value: 5, unit: 'studies', owner: 'Clinical AI Governance Council' },
  },
  {
    recordId: 'research_portfolio:research_kpi_sponsor_invoice_lag',
    title: 'Research KPI - Sponsor Invoicing Lag',
    kind: 'research_kpi',
    text: 'Sponsor invoicing lag averages 41 days against a 21-day target, creating cash and margin leakage in the research enterprise.',
    payload: { kpi_id: 'kpi:meridian:research:sponsor_invoice_lag_days', current_value: 41, target_value: 21, unit: 'days', owner: 'Research Finance' },
  },
  {
    recordId: 'research_portfolio:research_kpi_publication_translation',
    title: 'Research KPI - Evidence to Practice Translation',
    kind: 'research_kpi',
    text: 'Only 31% of internally funded clinical studies have an explicit pathway from publication or validation into operational practice change.',
    payload: { kpi_id: 'kpi:meridian:research:evidence_to_practice_pct', current_value: 31, target_value: 60, unit: 'percent', owner: 'Chief Medical Officer' },
  },
  {
    recordId: 'research_portfolio:decision_trace_research_to_operations',
    title: 'Decision Trace - Research to Operations Gate',
    kind: 'research_decision_trace',
    text: [
      'Executive decision needed: create a formal research-to-operations gate for AI studies.',
      'The gate should decide whether a validated model remains research, becomes a governed clinical operations capability, triggers Source for vendor/platform selection, or is discontinued.',
      'Required approvers: CDIO, CMIO, General Counsel, Compliance, Research Operations, and Finance for studies with material operating economics.',
    ].join('\n'),
    payload: {
      decision: 'create_research_to_operations_gate',
      options: ['research_only', 'operationalize', 'source_vendor_or_platform', 'discontinue'],
      approvers: ['CDIO', 'CMIO', 'General Counsel', 'Compliance', 'Research Operations', 'Finance'],
    },
    classification: 'Confidential',
  },
  {
    recordId: 'research_portfolio:evidence_research_spend_baseline',
    title: 'Evidence - Research Spend Baseline',
    kind: 'research_evidence',
    text: 'Research spend baseline is seeded as a synthetic internal planning assumption: $286M FY2025 total research spend, $112M externally sponsored, $174M internally funded.',
    payload: {
      evidence_type: 'synthetic_internal_planning_assumption',
      supports: ['research_spend_model', 'research_operations_modernization', 'ai_research_governance'],
      value_at_stake_usd: 21000000,
    },
  },
  {
    recordId: 'research_portfolio:scenario_research_operations_modernization',
    title: 'Scenario - Research Operations Modernization',
    kind: 'research_scenario',
    text: [
      'Scenario: Meridian creates a Research Operations Modernization Move to unify CTMS, Epic Research, sponsor finance, IRB cycle time, accrual, and AI validation governance.',
      'Potential value levers: reduce startup cycle by 32 days, recover $13M of indirect cost leakage, improve sponsor invoicing by 20 days, and establish a safe research-to-operations gate for clinical AI.',
      'This scenario is especially relevant for a healthcare CXO who cares about research spend, innovation credibility, and avoiding uncontrolled AI pilot sprawl.',
    ].join('\n'),
    payload: {
      scenario_id: 'scenario:meridian:research_operations_modernization',
      value_levers: ['startup_cycle_reduction', 'indirect_cost_recovery', 'sponsor_invoice_acceleration', 'ai_research_governance'],
      estimated_value_range_usd: [13000000, 26000000],
      candidate_move: 'Research Operations Modernization',
    },
  },
];

const graphNodes: GraphNode[] = [
  { node_id: 'org:meridian:research-enterprise', node_type: 'org_unit', label: 'Meridian Research Enterprise', properties: { annual_spend_usd: 286000000, active_studies: 730 } },
  { node_id: 'org:meridian:clinical-research-institute', node_type: 'org_unit', label: 'Meridian Clinical Research Institute', properties: { focus: ['oncology', 'cardiometabolic', 'clinical_trials'] } },
  { node_id: 'org:meridian:digital-health-evidence-lab', node_type: 'org_unit', label: 'Digital Health Evidence Lab', properties: { focus: ['clinical_ai', 'ambient_documentation', 'remote_monitoring'] } },
  { node_id: 'org:meridian:population-health-outcomes-center', node_type: 'org_unit', label: 'Population Health Outcomes Center', properties: { focus: ['value_based_care', 'health_equity', 'care_at_home'] } },
  { node_id: 'system:meridian:oncore-ctms', node_type: 'system', label: 'OnCore CTMS', properties: { vendor: 'Advarra', domain: 'Clinical trial management' } },
  { node_id: 'system:meridian:epic-research', node_type: 'system', label: 'Epic Research', properties: { vendor: 'Epic', domain: 'Research EHR workflows' } },
  { node_id: 'system:meridian:redcap', node_type: 'system', label: 'REDCap', properties: { vendor: 'Vanderbilt REDCap Consortium', domain: 'Research data capture' } },
  { node_id: 'system:meridian:florence-ebinders', node_type: 'system', label: 'Florence eBinders', properties: { vendor: 'Florence Healthcare', domain: 'Regulatory binder management' } },
  { node_id: 'system:meridian:trinetx', node_type: 'system', label: 'TriNetX', properties: { vendor: 'TriNetX', domain: 'Cohort discovery and real-world evidence' } },
  { node_id: 'system:meridian:snowflake-research-safe-harbor', node_type: 'system', label: 'Snowflake Research Safe Harbor', properties: { vendor: 'Snowflake', domain: 'Deidentified research data platform' } },
  { node_id: 'kpi:meridian:research:startup_cycle_days', node_type: 'kpi', label: 'Research Study Startup Cycle Time', properties: { current_value: 94, target_value: 62, unit: 'days' } },
  { node_id: 'kpi:meridian:research:indirect_cost_recovery_gap', node_type: 'kpi', label: 'Research Indirect Cost Recovery Gap', properties: { current_value: 21000000, target_value: 8000000, unit: 'USD' } },
  { node_id: 'kpi:meridian:research:trial_accrual_pct', node_type: 'kpi', label: 'Trial Accrual Performance', properties: { current_value: 78, target_value: 92, unit: 'percent' } },
  { node_id: 'kpi:meridian:research:ai_validation_backlog', node_type: 'kpi', label: 'AI Validation Backlog', properties: { current_value: 17, target_value: 5, unit: 'studies' } },
  { node_id: 'program:meridian:research-operations-modernization', node_type: 'program', label: 'Research Operations Modernization', properties: { status: 'candidate_move', estimated_value_low_usd: 13000000, estimated_value_high_usd: 26000000 } },
];

const graphEdges: GraphEdge[] = [
  { edge_id: 'enterprise:meridian-health:has-org-unit:research-enterprise', from_node_id: 'enterprise:meridian-health', to_node_id: 'org:meridian:research-enterprise', edge_type: 'HAS_ORG_UNIT' },
  { edge_id: 'org:meridian:research-enterprise:contains:clinical-research-institute', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'org:meridian:clinical-research-institute', edge_type: 'CONTAINS_ORG_UNIT' },
  { edge_id: 'org:meridian:research-enterprise:contains:digital-health-evidence-lab', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'org:meridian:digital-health-evidence-lab', edge_type: 'CONTAINS_ORG_UNIT' },
  { edge_id: 'org:meridian:research-enterprise:contains:population-health-outcomes-center', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'org:meridian:population-health-outcomes-center', edge_type: 'CONTAINS_ORG_UNIT' },
  { edge_id: 'person:meridian:anita-krishnamurthy:oversees:research-data-governance', from_node_id: 'person:meridian:anita-krishnamurthy', to_node_id: 'org:meridian:digital-health-evidence-lab', edge_type: 'OVERSEES' },
  { edge_id: 'org:meridian:research-enterprise:uses:oncore-ctms', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:oncore-ctms', edge_type: 'USES_SYSTEM' },
  { edge_id: 'org:meridian:research-enterprise:uses:epic-research', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:epic-research', edge_type: 'USES_SYSTEM' },
  { edge_id: 'org:meridian:research-enterprise:uses:redcap', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:redcap', edge_type: 'USES_SYSTEM' },
  { edge_id: 'org:meridian:research-enterprise:uses:florence-ebinders', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:florence-ebinders', edge_type: 'USES_SYSTEM' },
  { edge_id: 'org:meridian:research-enterprise:uses:trinetx', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:trinetx', edge_type: 'USES_SYSTEM' },
  { edge_id: 'org:meridian:research-enterprise:uses:snowflake-research-safe-harbor', from_node_id: 'org:meridian:research-enterprise', to_node_id: 'system:meridian:snowflake-research-safe-harbor', edge_type: 'USES_SYSTEM' },
  { edge_id: 'program:meridian:research-operations-modernization:targets:startup-cycle', from_node_id: 'program:meridian:research-operations-modernization', to_node_id: 'kpi:meridian:research:startup_cycle_days', edge_type: 'TARGETS_KPI' },
  { edge_id: 'program:meridian:research-operations-modernization:targets:indirect-cost-recovery', from_node_id: 'program:meridian:research-operations-modernization', to_node_id: 'kpi:meridian:research:indirect_cost_recovery_gap', edge_type: 'TARGETS_KPI' },
  { edge_id: 'program:meridian:research-operations-modernization:targets:trial-accrual', from_node_id: 'program:meridian:research-operations-modernization', to_node_id: 'kpi:meridian:research:trial_accrual_pct', edge_type: 'TARGETS_KPI' },
  { edge_id: 'program:meridian:research-operations-modernization:targets:ai-validation-backlog', from_node_id: 'program:meridian:research-operations-modernization', to_node_id: 'kpi:meridian:research:ai_validation_backlog', edge_type: 'TARGETS_KPI' },
];

function parseArgs() {
  return {
    apply: process.argv.includes('--apply'),
  };
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findMeridianClientId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from('clients')
    .select('id,name,legal_name,tenant_key,slug')
    .or('tenant_key.eq.meridian,slug.eq.meridian-health,slug.eq.heliara-health,name.ilike.%Meridian%,name.ilike.%Heliara%,legal_name.ilike.%Meridian%,legal_name.ilike.%Heliara%')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`clients lookup failed: ${error.message}`);
  if (!data?.id) throw new Error('Meridian/Heliara client row not found.');
  return data.id as string;
}

async function upsertBatch(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

async function cleanupRejectedExperimentalSegment(client: SupabaseClient) {
  await client.from('data_inventory_segments').delete().eq('tenant_key', TENANT_KEY).eq('segment_id', RESEARCH_DOMAIN);
  await client.from('tenant_expected_baselines').delete().eq('tenant_key', TENANT_KEY).eq('segment_id', RESEARCH_DOMAIN);
}

async function refreshAiTransformationSegmentCount(client: SupabaseClient, clientId: string) {
  const { count, error: countError } = await client
    .from('data_inventory_records')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY)
    .eq('segment_id', SEGMENT_ID);
  if (countError) throw new Error(`data_inventory_records count failed: ${countError.message}`);

  const { error } = await client
    .from('data_inventory_segments')
    .update({
      client_id: clientId,
      record_count: count ?? records.length,
      coverage_score: 100,
      health_state: 'complete',
      stale_count: 0,
      missing_count: 0,
      last_reviewed_at: `${LAST_REVIEWED}T00:00:00Z`,
      last_ingested_at: new Date().toISOString(),
      provenance_summary: {
        source_basis: SOURCE_BASIS,
        uploaded_by: UPLOADED_BY,
        research_domain_added: true,
        research_records_added: records.length,
      },
    })
    .eq('tenant_key', TENANT_KEY)
    .eq('segment_id', SEGMENT_ID);
  if (error) throw new Error(`data_inventory_segments refresh failed: ${error.message}`);
}

function chunkRecord(record: ResearchRecord) {
  return {
    record,
    chunk: {
      chunkId: `${record.recordId}:chunk:0`,
      text: [record.title, record.text].join('\n\n'),
      tokenCount: Math.ceil(record.text.length / 4),
    },
  };
}

function summary() {
  return {
    tenantKey: TENANT_KEY,
    segment: SEGMENT_ID,
    researchDomain: RESEARCH_DOMAIN,
    records: records.length,
    graphNodes: graphNodes.length,
    graphEdges: graphEdges.length,
    contextChunks: records.length,
    assumedResearchSpendUsd: 286000000,
    activeStudies: 730,
    aiOrDataStudies: 42,
  };
}

async function main() {
  const { apply } = parseArgs();
  const runSummary = summary();

  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, ...runSummary }, null, 2));
    return;
  }

  const client = getClient();
  const clientId = await findMeridianClientId(client);
  await cleanupRejectedExperimentalSegment(client);
  const runStart = await client
    .from('data_ingestion_runs')
    .insert({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      source_label: 'Meridian research and innovation substrate',
      source_root: SOURCE_DOC,
      status: 'started',
    })
    .select('id')
    .single();
  if (runStart.error) throw new Error(`data_ingestion_runs insert failed: ${runStart.error.message}`);
  const runId = runStart.data.id as string;

  try {
    await upsertBatch(client, 'data_inventory_records', records.map((record) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      segment_id: SEGMENT_ID,
      record_id: record.recordId,
      title: record.title,
      record_kind: record.kind,
      source_doc: SOURCE_DOC,
      source_path: `${SEGMENT_ID}/${RESEARCH_DOMAIN}/${record.recordId}.md`,
      source_basis: SOURCE_BASIS,
      uploaded_by: UPLOADED_BY,
      data_classification: record.classification ?? 'Internal',
      confidence: record.confidence ?? 0.82,
      last_reviewed: LAST_REVIEWED,
      freshness_state: 'fresh',
      ingestion_status: 'indexed',
      indexed_at: new Date().toISOString(),
      record_text: record.text,
      record_payload: {
        ...record.payload,
        synthetic_assumption: true,
        assumption_note: 'Added as Meridian research/R&D planning substrate for CXO demo readiness.',
      },
    })), 'tenant_key,segment_id,record_id');

    await upsertBatch(client, 'enterprise_graph_nodes', graphNodes.map((node) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      node_id: node.node_id,
      node_type: node.node_type,
      label: node.label,
      source_segment_id: SEGMENT_ID,
      source_record_id: 'research_portfolio:enterprise_research_profile',
      source_doc: SOURCE_DOC,
      source_basis: SOURCE_BASIS,
      data_classification: node.data_classification ?? 'Internal',
      confidence: node.confidence ?? 0.82,
      last_reviewed: LAST_REVIEWED,
      properties: {
        ...node.properties,
        synthetic_assumption: true,
      },
    })), 'tenant_key,node_id');

    await upsertBatch(client, 'enterprise_graph_edges', graphEdges.map((edge) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      edge_id: edge.edge_id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      edge_type: edge.edge_type,
      source_segment_id: SEGMENT_ID,
      source_record_id: 'research_portfolio:enterprise_research_profile',
      source_doc: SOURCE_DOC,
      source_basis: SOURCE_BASIS,
      confidence: edge.confidence ?? 0.82,
      properties: edge.properties ?? {},
    })), 'tenant_key,edge_id');

    await upsertBatch(client, 'enterprise_context_chunks', records.map(chunkRecord).map(({ record, chunk }) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      chunk_id: chunk.chunkId,
      source_segment_id: SEGMENT_ID,
      source_record_id: record.recordId,
      source_doc: SOURCE_DOC,
      source_path: `${SEGMENT_ID}/${RESEARCH_DOMAIN}/${record.recordId}.md`,
      chunk_index: 0,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      embedding_status: 'pending',
      provenance: {
        source_basis: SOURCE_BASIS,
        uploaded_by: UPLOADED_BY,
        data_classification: record.classification ?? 'Internal',
        confidence: record.confidence ?? 0.82,
        last_reviewed: LAST_REVIEWED,
      },
      chunk_metadata: {
        title: record.title,
        record_kind: record.kind,
        synthetic_assumption: true,
      },
    })), 'tenant_key,chunk_id');

    await refreshAiTransformationSegmentCount(client, clientId);

    const { error: auditError } = await client.from('data_inventory_audit_log').insert({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      actor_role: 'system_import',
      action: 'records_imported',
      segment_id: SEGMENT_ID,
      record_id: null,
      after_state: runSummary,
      classification_at_action: 'Mixed',
      source_doc: SOURCE_DOC,
    });
    if (auditError) throw new Error(`data_inventory_audit_log insert failed: ${auditError.message}`);

    const { error: runError } = await client
      .from('data_ingestion_runs')
      .update({
        status: 'completed',
        records_loaded: records.length,
        chunks_loaded: records.length,
        nodes_loaded: graphNodes.length,
        edges_loaded: graphEdges.length,
        summary: runSummary,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    if (runError) throw new Error(`data_ingestion_runs update failed: ${runError.message}`);

    console.log(JSON.stringify({ applied: true, ...runSummary }, null, 2));
  } catch (error) {
    await client
      .from('data_ingestion_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

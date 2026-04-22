// Programs demo seed · Apex Retail Group
//
// Per docs/design/abarva-programs-design-spec.md + memory · seeds 4 demo
// programs with retail-native content. Idempotent — safe to re-run.
//
// 1. Contact Center AI Transformation  · Phase 5 Execute   · Pattern
// 2. Unified Customer Data Platform    · Phase 2 Charter   · Pattern
// 3. Store Associate Productivity      · Phase 2 Charter   · Custom
// 4. Demand Forecasting AI             · Phase 6 complete  · historical
//
// Also seeds 3 retail Genome patterns (contact_center_ai,
// unified_cdp, demand_forecasting_ai) into engagement_topics if
// missing so the classifier has something to match against.
//
// Usage:  npx tsx src/scripts/seed/programs-demo-apex.ts

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { charterDeliverableType } from '@/lib/deliverables/templates/charter';
import { designBriefDeliverableType } from '@/lib/deliverables/templates/design_brief';
import { executionPlanDeliverableType } from '@/lib/deliverables/templates/execution_plan';
import { outcomeReportDeliverableType } from '@/lib/deliverables/templates/outcome_report';
import { timelineResourceEstimateDeliverableType } from '@/lib/deliverables/templates/timeline_resource_estimate';
import { executionRoadmapTrackerDeliverableType } from '@/lib/deliverables/templates/execution_roadmap_tracker';

// Load .env.local manually so the script runs standalone
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* env file not present — rely on shell env */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const APEX_NAMES = ['Apex Retail', 'Apex Retail Group'];

// ─── 1. Retail patterns ───────────────────────────────────────────────
const RETAIL_PATTERNS: Array<{
  topic_key: string;
  title: string;
  tagline: string;
  archetype: string;
  promotion_state: 'pilot' | 'mature';
  deployment_count: number;
  successful_deployment_count: number;
  canonical_shape_json: Record<string, unknown>;
  industries: string[];
  key_patterns: string[];
}> = [
  {
    topic_key: 'contact_center_ai_transformation',
    title: 'Contact Center AI Transformation',
    tagline: 'Voice + chat deflection + agent assist across retail care channels',
    archetype: 'ai_product_enablement',
    promotion_state: 'mature',
    deployment_count: 14,
    successful_deployment_count: 11,
    industries: ['retail'],
    key_patterns: ['voice_deflection', 'agent_assist', 'chat_intent_routing'],
    canonical_shape_json: {
      archetype: 'ai_product_enablement',
      typical_duration_months: 9,
      preload_depth_pct: 80,
      phases: [
        { canonicalPhase: 0, name: 'Origination' },
        { canonicalPhase: 1, name: 'Charter' },
        { canonicalPhase: 2, name: 'Diagnose' },
        { canonicalPhase: 3, name: 'Design' },
        { canonicalPhase: 4, name: 'Execute' },
        { canonicalPhase: 5, name: 'Verify' },
      ],
      modules: [
        { moduleKey: 'problem_framing', name: 'Problem framing', phase: 1 },
        { moduleKey: 'stakeholder_map', name: 'Stakeholder map', phase: 1 },
        { moduleKey: 'call_volume_baseline', name: 'Call volume baseline', phase: 2 },
        { moduleKey: 'channel_mix_analysis', name: 'Channel mix analysis', phase: 2 },
        { moduleKey: 'vendor_assessment', name: 'Vendor assessment', phase: 3 },
        { moduleKey: 'deflection_design', name: 'Deflection design', phase: 3 },
        { moduleKey: 'agent_assist_rollout', name: 'Agent-assist rollout', phase: 4 },
        { moduleKey: 'qa_loop', name: 'QA + human-in-loop', phase: 4 },
        { moduleKey: 'outcome_verification', name: 'Outcome verification', phase: 5 },
      ],
    },
  },
  {
    topic_key: 'unified_customer_data_platform',
    title: 'Unified Customer Data Platform',
    tagline: 'Identity resolution + first-party CDP + audience activation for omnichannel retail',
    archetype: 'platform_modernization',
    promotion_state: 'mature',
    deployment_count: 9,
    successful_deployment_count: 7,
    industries: ['retail'],
    key_patterns: ['identity_graph', 'cdp_build', 'audience_activation'],
    canonical_shape_json: {
      archetype: 'platform_modernization',
      typical_duration_months: 12,
      preload_depth_pct: 75,
      phases: [
        { canonicalPhase: 0, name: 'Origination' },
        { canonicalPhase: 1, name: 'Charter' },
        { canonicalPhase: 2, name: 'Diagnose' },
        { canonicalPhase: 3, name: 'Design' },
        { canonicalPhase: 4, name: 'Execute' },
        { canonicalPhase: 5, name: 'Verify' },
      ],
      modules: [
        { moduleKey: 'problem_framing', name: 'Problem framing', phase: 1 },
        { moduleKey: 'stakeholder_map', name: 'Stakeholder map', phase: 1 },
        { moduleKey: 'identity_audit', name: 'Identity source audit', phase: 2 },
        { moduleKey: 'use_case_matrix', name: 'Use-case activation matrix', phase: 2 },
        { moduleKey: 'vendor_selection', name: 'Vendor selection', phase: 3 },
        { moduleKey: 'data_model_design', name: 'Unified data model', phase: 3 },
        { moduleKey: 'pipeline_build', name: 'Pipeline build + QA', phase: 4 },
        { moduleKey: 'audience_activation', name: 'Audience activation', phase: 4 },
        { moduleKey: 'outcome_verification', name: 'Outcome verification', phase: 5 },
      ],
    },
  },
  {
    topic_key: 'demand_forecasting_ai',
    title: 'Demand Forecasting AI',
    tagline: 'ML-driven SKU-store-week forecasting to reduce stockouts and markdowns',
    archetype: 'ai_product_enablement',
    promotion_state: 'pilot',
    deployment_count: 5,
    successful_deployment_count: 4,
    industries: ['retail'],
    key_patterns: ['forecast_model', 'inventory_optimization', 'markdown_reduction'],
    canonical_shape_json: {
      archetype: 'ai_product_enablement',
      typical_duration_months: 8,
      preload_depth_pct: 70,
      phases: [
        { canonicalPhase: 0, name: 'Origination' },
        { canonicalPhase: 1, name: 'Charter' },
        { canonicalPhase: 2, name: 'Diagnose' },
        { canonicalPhase: 3, name: 'Design' },
        { canonicalPhase: 4, name: 'Execute' },
        { canonicalPhase: 5, name: 'Verify' },
      ],
      modules: [
        { moduleKey: 'problem_framing', name: 'Problem framing', phase: 1 },
        { moduleKey: 'stakeholder_map', name: 'Stakeholder map', phase: 1 },
        { moduleKey: 'baseline_forecast', name: 'Current forecast baseline', phase: 2 },
        { moduleKey: 'data_readiness', name: 'Data readiness audit', phase: 2 },
        { moduleKey: 'model_design', name: 'Model architecture', phase: 3 },
        { moduleKey: 'integration_plan', name: 'Ops integration plan', phase: 3 },
        { moduleKey: 'pilot_rollout', name: 'Pilot store rollout', phase: 4 },
        { moduleKey: 'scale_rollout', name: 'Scale rollout', phase: 4 },
        { moduleKey: 'outcome_verification', name: 'Outcome verification', phase: 5 },
      ],
    },
  },
];

// ─── 2. Programs to create ────────────────────────────────────────────
type ProgramSeed = {
  name: string;
  archetype: string | null;
  shape: 'pattern' | 'custom' | 'template';
  patternKey?: string;
  currentPhase: number;
  status: string;
  originSource: 'user_initiated' | 'intelligence_promoted' | 'tower_triggered';
  founderApprovalRequired: boolean;
  maestroOversightLevel: 'full' | 'partial' | 'none';
  modulesOverride?: Array<{ moduleKey: string; moduleName: string; phase: number; status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped' }>;
  milestones: Array<{ name: string; targetDate: string; status: 'upcoming' | 'at_risk' | 'hit' | 'missed'; description?: string }>;
  workItems: Array<{ title: string; itemType: 'workstream' | 'use_case' | 'solution' | 'execution_plan' | 'task'; status: 'open' | 'in_progress' | 'blocked' | 'done'; priority?: 'critical' | 'high' | 'medium' | 'low'; moduleKey?: string; dueDate?: string; nexusDrafted?: boolean }>;
  risks: Array<{ title: string; likelihood: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high'; status: 'open' | 'mitigating' | 'closed'; mitigationPlan?: string }>;
  deliverables: Array<{ typeKey: string; title: string; status: 'draft' | 'in_review' | 'signed_off'; content: string; byNexus: boolean }>;
  flags: Array<{ flagType: string; severity: 'critical' | 'warning' | 'info'; headline: string }>;
};

const PROGRAMS: ProgramSeed[] = [
  // 1 · Contact Center AI — Phase 5 Execute · Pattern shape
  {
    name: 'Contact Center AI Transformation',
    archetype: 'ai_product_enablement',
    shape: 'pattern',
    patternKey: 'contact_center_ai_transformation',
    currentPhase: 4,
    status: 'active',
    originSource: 'intelligence_promoted',
    founderApprovalRequired: true,
    maestroOversightLevel: 'full',
    milestones: [
      { name: 'Voice deflection pilot launched', targetDate: '2026-01-15', status: 'hit', description: 'Pilot in 3 call centers' },
      { name: 'Agent-assist GA across all queues', targetDate: '2026-04-30', status: 'at_risk' },
      { name: 'QA loop + retraining cadence stood up', targetDate: '2026-05-31', status: 'upcoming' },
      { name: 'Savings target: $4.2M annualized', targetDate: '2026-07-31', status: 'upcoming' },
    ],
    workItems: [
      { title: 'Voice deflection workstream', itemType: 'workstream', status: 'done', priority: 'high' },
      { title: 'Agent-assist workstream', itemType: 'workstream', status: 'in_progress', priority: 'critical' },
      { title: 'QA loop rollout', itemType: 'execution_plan', status: 'in_progress', priority: 'high', moduleKey: 'qa_loop' },
      { title: 'Spanish-language model tuning', itemType: 'solution', status: 'blocked', priority: 'high', nexusDrafted: true },
      { title: 'Supervisor dashboard v2', itemType: 'task', status: 'open', priority: 'medium' },
      { title: 'Call-center training curriculum', itemType: 'task', status: 'in_progress', priority: 'medium' },
    ],
    risks: [
      { title: 'Spanish-language accuracy below 85% threshold', likelihood: 'high', impact: 'high', status: 'mitigating', mitigationPlan: 'Vendor retraining with regional datasets · 4wk SLA' },
      { title: 'Agent adoption stalling in Tier-2 queues', likelihood: 'medium', impact: 'high', status: 'open' },
      { title: 'Q3 holiday volume spike may outpace rollout', likelihood: 'medium', impact: 'medium', status: 'open' },
    ],
    deliverables: [
      { typeKey: 'charter', title: 'Contact Center AI Program Charter', status: 'signed_off', byNexus: false, content: 'Charter signed off 2025-11-12 · Sponsor: VP Customer Care · Scope: voice + chat across Tier-1/2 queues · Target: 28% deflection, $4.2M annualized savings.' },
      { typeKey: 'design_spec', title: 'Deflection + Agent-Assist Design', status: 'signed_off', byNexus: true, content: '# Deflection + Agent-Assist Design\n\nVoice deflection strategy: intent router → IVR replacement → call routing. Agent-assist: real-time suggestion + next-best-action + summarization. KPIs: deflection rate (target 28%), AHT reduction (target 22%), CSAT hold (no decline).' },
      { typeKey: 'vendor_selection', title: 'Vendor Selection · Glia + Observe.AI', status: 'signed_off', byNexus: true, content: '# Vendor Selection\n\nGlia for unified front-end (voice + chat + video). Observe.AI for agent-assist + QA. Rationale: Glia edges out LivePerson on retail-specific templates; Observe.AI leads KLAS scoring on agent-assist for US contact centers.' },
      { typeKey: 'execution_plan', title: 'Execute Phase Plan', status: 'in_review', byNexus: true, content: '# Execution Plan\n\nPhase rollout: (1) Tier-1 queues in 3 regions by M3 ✓. (2) Tier-2 queues + Spanish by M5 — at risk. (3) Full scale + supervisor tools by M7. Budget: $2.4M capex + $1.1M run-rate.' },
    ],
    flags: [
      { flagType: 'quality_concern', severity: 'warning', headline: 'Spanish-language accuracy pilot 78% · below 85% threshold' },
      { flagType: 'scope_drift', severity: 'info', headline: 'VP asked about adding video channel — out of current scope' },
    ],
  },
  // 2 · Unified CDP — Phase 2 Charter · Pattern shape
  {
    name: 'Unified Customer Data Platform',
    archetype: 'platform_modernization',
    shape: 'pattern',
    patternKey: 'unified_customer_data_platform',
    currentPhase: 1,
    status: 'active',
    originSource: 'user_initiated',
    founderApprovalRequired: true,
    maestroOversightLevel: 'full',
    milestones: [
      { name: 'Charter signed off', targetDate: '2026-05-01', status: 'upcoming' },
      { name: 'Identity audit complete', targetDate: '2026-06-15', status: 'upcoming' },
      { name: 'Vendor selection gate', targetDate: '2026-08-01', status: 'upcoming' },
    ],
    workItems: [
      { title: 'Problem framing + target outcomes', itemType: 'workstream', status: 'in_progress', priority: 'high', moduleKey: 'problem_framing' },
      { title: 'Stakeholder map — marketing, digital, loyalty, ops', itemType: 'task', status: 'open', priority: 'high', moduleKey: 'stakeholder_map' },
      { title: 'Legal review · first-party data + consent', itemType: 'task', status: 'open', priority: 'medium' },
    ],
    risks: [
      { title: 'Identity graph scope creep (POS + e-com + app + CRM)', likelihood: 'high', impact: 'medium', status: 'open', mitigationPlan: 'Phase 1 scope restricted to top-3 source systems; rest deferred to Phase 2' },
      { title: 'Privacy regulation shift (state-level)', likelihood: 'medium', impact: 'high', status: 'open' },
    ],
    deliverables: [
      { typeKey: 'charter', title: 'Unified CDP Program Charter (draft)', status: 'draft', byNexus: true, content: '# Unified CDP Charter — Draft v0.3\n\nProblem: 6 customer data silos (POS, e-com, loyalty, app, CRM, email) · no single view · marketing + merch running separate audiences · $42M attributed campaign spend with weak attribution.\n\nOutcome: single customer ID · top-20 activation audiences · measurable lift in repeat visit rate.\n\nSponsor: Chief Digital Officer · co-sponsor CMO.' },
    ],
    flags: [
      { flagType: 'approval_needed', severity: 'info', headline: 'Charter ready for sponsor review' },
    ],
  },
  // 3 · Store Associate Productivity — Phase 2 Charter · Custom shape
  {
    name: 'Store Associate Productivity',
    archetype: 'workflow_automation',
    shape: 'custom',
    currentPhase: 1,
    status: 'active',
    originSource: 'tower_triggered',
    founderApprovalRequired: false,
    maestroOversightLevel: 'partial',
    modulesOverride: [
      { moduleKey: 'problem_framing', moduleName: 'Problem framing', phase: 1, status: 'in_progress' },
      { moduleKey: 'stakeholder_map', moduleName: 'Stakeholder map', phase: 1, status: 'not_started' },
      { moduleKey: 'task_audit', moduleName: 'Store task audit', phase: 2, status: 'not_started' },
      { moduleKey: 'workflow_mapping', moduleName: 'Workflow mapping', phase: 2, status: 'not_started' },
      { moduleKey: 'tool_selection', moduleName: 'Tool selection', phase: 3, status: 'not_started' },
      { moduleKey: 'pilot_rollout', moduleName: 'Pilot rollout', phase: 4, status: 'not_started' },
      { moduleKey: 'scale_rollout', moduleName: 'Scale rollout', phase: 4, status: 'not_started' },
      { moduleKey: 'outcome_verification', moduleName: 'Outcome verification', phase: 5, status: 'not_started' },
    ],
    milestones: [
      { name: 'Charter signed off', targetDate: '2026-05-15', status: 'upcoming' },
      { name: 'Task audit complete across 5 stores', targetDate: '2026-06-30', status: 'upcoming' },
    ],
    workItems: [
      { title: 'Define target productivity metric', itemType: 'task', status: 'in_progress', priority: 'high' },
      { title: 'Shadow 3 associates per store archetype', itemType: 'execution_plan', status: 'open', priority: 'high' },
      { title: 'Interview district managers', itemType: 'task', status: 'open', priority: 'medium' },
    ],
    risks: [
      { title: 'Store associates perceive AI as surveillance', likelihood: 'high', impact: 'high', status: 'open', mitigationPlan: 'Transparency + opt-in design from Phase 2' },
    ],
    deliverables: [
      { typeKey: 'charter', title: 'Store Associate Productivity Charter (draft)', status: 'draft', byNexus: true, content: '# Charter — Draft\n\nNovel program shape. Genome has no direct pattern for retail store-associate productivity. Maestro authored custom shape covering task audit → workflow mapping → tool selection → pilot → scale.\n\nOrigin: Tower signal — store-operations contradiction on training spend vs productivity delta.' },
    ],
    flags: [
      { flagType: 'quality_concern', severity: 'info', headline: 'Custom shape · Maestro oversight required at each phase gate' },
    ],
  },
  // 4 · Demand Forecasting AI — completed · historical
  // Note: current_phase clamped to 4 · migration 013's CHECK(0-4)
  // predates the 6-phase Programs spec. status='complete' carries the
  // "done" semantics. Follow-up migration should relax the check to 0-5.
  {
    name: 'Demand Forecasting AI',
    archetype: 'ai_product_enablement',
    shape: 'pattern',
    patternKey: 'demand_forecasting_ai',
    currentPhase: 4,
    status: 'completed',
    originSource: 'user_initiated',
    founderApprovalRequired: true,
    maestroOversightLevel: 'partial',
    milestones: [
      { name: 'Data readiness audit', targetDate: '2025-04-01', status: 'hit' },
      { name: 'Model v1 shadow mode', targetDate: '2025-07-15', status: 'hit' },
      { name: 'Pilot store rollout', targetDate: '2025-09-30', status: 'hit' },
      { name: 'Scale to 100 stores', targetDate: '2025-11-30', status: 'hit' },
      { name: 'Outcome verification', targetDate: '2026-01-15', status: 'hit' },
    ],
    workItems: [
      { title: 'Forecast model workstream', itemType: 'workstream', status: 'done' },
      { title: 'Inventory optimization integration', itemType: 'workstream', status: 'done' },
      { title: 'Markdown reduction measurement', itemType: 'use_case', status: 'done' },
    ],
    risks: [
      { title: 'Cold-start problem on new SKUs', likelihood: 'medium', impact: 'medium', status: 'closed', mitigationPlan: 'Hybrid rule-based fallback for first 90 days — worked well' },
    ],
    deliverables: [
      { typeKey: 'charter', title: 'Demand Forecasting AI Charter', status: 'signed_off', byNexus: false, content: 'Completed program · charter signed off Q1 2025' },
      { typeKey: 'outcome_report', title: 'Outcome Report · Demand Forecasting AI', status: 'signed_off', byNexus: true, content: '# Outcome Report\n\n28% reduction in stockout events across pilot cohort (target 25%). 19% markdown reduction (target 15%). Net annualized benefit: $8.4M. CFO attestation 2026-01-18. Cohort contribution (anonymized) filed with Genome.' },
    ],
    flags: [],
  },
];

// ─── 3. Seed runner ───────────────────────────────────────────────────
// Minimal deliverable_types entries needed for the Programs demo. FK-required
// before any deliverables_v2 inserts land.
const DEMO_DELIVERABLE_TYPES: Array<{ type_key: string; title: string; applicable_phases: number[] }> = [
  { type_key: 'charter', title: 'Program Charter', applicable_phases: [1, 2] },
  { type_key: 'design_spec', title: 'Design Specification', applicable_phases: [3] },
  { type_key: 'vendor_selection', title: 'Vendor Selection', applicable_phases: [3] },
  { type_key: 'timeline_resource_estimate', title: 'Timeline + Resource Estimate', applicable_phases: [3, 4] },
  { type_key: 'execution_plan', title: 'Execution Plan', applicable_phases: [4] },
  { type_key: 'execution_roadmap_tracker', title: 'Execution Roadmap Tracker', applicable_phases: [4, 5] },
  { type_key: 'outcome_report', title: 'Outcome Report', applicable_phases: [5] },
];

// Demo Apex persons · retail-flavored sponsors + lead + maestro.
// Idempotent via email lookup.
const APEX_PERSONS: Array<{ key: string; name: string; email: string; role: string }> = [
  { key: 'sponsor_contact_center', name: 'Maya Reyes', email: 'maya.reyes@apex-retail.demo', role: 'VP Customer Care' },
  { key: 'sponsor_cdp', name: 'Jake Chen', email: 'jake.chen@apex-retail.demo', role: 'Chief Digital Officer' },
  { key: 'sponsor_store', name: 'Priya Patel', email: 'priya.patel@apex-retail.demo', role: 'VP Store Operations' },
  { key: 'sponsor_forecasting', name: 'Marcus Liu', email: 'marcus.liu@apex-retail.demo', role: 'VP Merchandising' },
  { key: 'lead_apex', name: 'David Okafor', email: 'david.okafor@apex-retail.demo', role: 'Program Lead' },
];

async function ensurePersons(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const p of APEX_PERSONS) {
    const { data: existing } = await sb.from('persons').select('id').eq('email', p.email).maybeSingle();
    if (existing) {
      ids[p.key] = (existing as { id: string }).id;
      continue;
    }
    const { data: inserted, error } = await sb
      .from('persons')
      .insert({ name: p.name, email: p.email, role: p.role, organization: 'Apex Retail Group' })
      .select('id')
      .single();
    if (error) throw new Error(`person ${p.email}: ${error.message}`);
    ids[p.key] = (inserted as { id: string }).id;
  }
  return ids;
}

const PROGRAM_TEAM_ASSIGNMENTS: Record<string, { sponsorKey: keyof typeof APEX_PERSONS_BY_KEY; leadKey: keyof typeof APEX_PERSONS_BY_KEY }> = {
  'Contact Center AI Transformation': { sponsorKey: 'sponsor_contact_center', leadKey: 'lead_apex' },
  'Unified Customer Data Platform': { sponsorKey: 'sponsor_cdp', leadKey: 'lead_apex' },
  'Store Associate Productivity': { sponsorKey: 'sponsor_store', leadKey: 'lead_apex' },
  'Demand Forecasting AI': { sponsorKey: 'sponsor_forecasting', leadKey: 'lead_apex' },
};
const APEX_PERSONS_BY_KEY: Record<string, true> = APEX_PERSONS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {});

async function ensureProgramTeam(programId: string, programName: string, personIds: Record<string, string>): Promise<void> {
  const assignment = PROGRAM_TEAM_ASSIGNMENTS[programName];
  if (!assignment) return;
  const sponsorId = personIds[assignment.sponsorKey];
  const leadId = personIds[assignment.leadKey];

  // engagement_participants uses user_id TEXT (legacy from migration 002),
  // approval_authority on the row determines sponsor/approver/contributor
  for (const [userId, role, authority] of [
    [sponsorId, 'sponsor', 'sponsor'],
    [leadId, 'lead', 'approver'],
  ] as const) {
    const { data: existing } = await sb
      .from('engagement_participants')
      .select('id')
      .eq('engagement_id', programId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) continue;
    const { error } = await sb.from('engagement_participants').insert({
      engagement_id: programId,
      user_id: userId,
      user_name: APEX_PERSONS.find((p) => p.email && personIds[p.key] === userId)?.name ?? userId,
      role,
      approval_authority: authority,
      last_touchpoint_at: new Date().toISOString(),
    });
    if (error) throw new Error(`participant ${role} for ${programName}: ${error.message}`);
  }

  // Also set engagements.sponsor_person_id so the rich engagement row carries it
  await sb.from('engagements').update({ sponsor_person_id: sponsorId }).eq('id', programId);
}

async function ensureDeliverableTypes(): Promise<void> {
  const templatePayloads: Record<string, {
    description: string;
    applicable_topics: string[];
    template_structure: Record<string, unknown>;
    required_data_inputs: Record<string, unknown>;
    quality_rubric: Record<string, unknown> | Array<Record<string, unknown>>;
    generation_prompt_template: string;
    output_format: 'markdown';
    maturity: 'draft' | 'pilot' | 'production' | 'deprecated';
  }> = {
    charter: {
      description: charterDeliverableType.description,
      applicable_topics: [...charterDeliverableType.applicable_topics],
      template_structure: charterDeliverableType.template_structure,
      required_data_inputs: charterDeliverableType.required_data_inputs,
      quality_rubric: charterDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: charterDeliverableType.generation_prompt_template,
      output_format: charterDeliverableType.output_format,
      maturity: charterDeliverableType.maturity,
    },
    // Compatibility alias: the live Programs drafting flow currently uses
    // `design_spec`, while the richer template taxonomy names it
    // `design_brief`. Mirror the brief content here without changing the
    // runtime contract in this seed pass.
    design_spec: {
      description: designBriefDeliverableType.description,
      applicable_topics: [...designBriefDeliverableType.applicable_topics],
      template_structure: designBriefDeliverableType.template_structure,
      required_data_inputs: designBriefDeliverableType.required_data_inputs,
      quality_rubric: designBriefDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: designBriefDeliverableType.generation_prompt_template,
      output_format: designBriefDeliverableType.output_format,
      maturity: designBriefDeliverableType.maturity,
    },
    execution_plan: {
      description: executionPlanDeliverableType.description,
      applicable_topics: [...executionPlanDeliverableType.applicable_topics],
      template_structure: executionPlanDeliverableType.template_structure,
      required_data_inputs: executionPlanDeliverableType.required_data_inputs,
      quality_rubric: executionPlanDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: executionPlanDeliverableType.generation_prompt_template,
      output_format: executionPlanDeliverableType.output_format,
      maturity: executionPlanDeliverableType.maturity,
    },
    timeline_resource_estimate: {
      description: timelineResourceEstimateDeliverableType.description,
      applicable_topics: [...timelineResourceEstimateDeliverableType.applicable_topics],
      template_structure: timelineResourceEstimateDeliverableType.template_structure,
      required_data_inputs: timelineResourceEstimateDeliverableType.required_data_inputs,
      quality_rubric: timelineResourceEstimateDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: timelineResourceEstimateDeliverableType.generation_prompt_template,
      output_format: timelineResourceEstimateDeliverableType.output_format,
      maturity: timelineResourceEstimateDeliverableType.maturity,
    },
    execution_roadmap_tracker: {
      description: executionRoadmapTrackerDeliverableType.description,
      applicable_topics: [...executionRoadmapTrackerDeliverableType.applicable_topics],
      template_structure: executionRoadmapTrackerDeliverableType.template_structure,
      required_data_inputs: executionRoadmapTrackerDeliverableType.required_data_inputs,
      quality_rubric: executionRoadmapTrackerDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: executionRoadmapTrackerDeliverableType.generation_prompt_template,
      output_format: executionRoadmapTrackerDeliverableType.output_format,
      maturity: executionRoadmapTrackerDeliverableType.maturity,
    },
    outcome_report: {
      description: outcomeReportDeliverableType.description,
      applicable_topics: [...outcomeReportDeliverableType.applicable_topics],
      template_structure: outcomeReportDeliverableType.template_structure,
      required_data_inputs: outcomeReportDeliverableType.required_data_inputs,
      quality_rubric: outcomeReportDeliverableType.quality_rubric as unknown as Array<Record<string, unknown>>,
      generation_prompt_template: outcomeReportDeliverableType.generation_prompt_template,
      output_format: outcomeReportDeliverableType.output_format,
      maturity: outcomeReportDeliverableType.maturity,
    },
  };

  for (const t of DEMO_DELIVERABLE_TYPES) {
    const basePayload = templatePayloads[t.type_key] ?? {
      description: `${t.title} (demo seed)`,
      applicable_topics: [],
      template_structure: {},
      required_data_inputs: {},
      quality_rubric: {},
      generation_prompt_template: '',
      output_format: 'markdown' as const,
      maturity: 'pilot' as const,
    };

    const { error } = await sb.from('deliverable_types').upsert(
      {
        type_key: t.type_key,
        title: t.title,
        description: basePayload.description,
        applicable_phases: t.applicable_phases,
        applicable_topics: basePayload.applicable_topics,
        template_structure: basePayload.template_structure,
        required_data_inputs: basePayload.required_data_inputs,
        quality_rubric: basePayload.quality_rubric,
        generation_prompt_template: basePayload.generation_prompt_template,
        output_format: basePayload.output_format,
        maturity: basePayload.maturity,
      },
      { onConflict: 'type_key' },
    );
    if (error) throw new Error(`deliverable_type ${t.type_key}: ${error.message}`);
  }
}

async function ensureApexClient(): Promise<string> {
  for (const n of APEX_NAMES) {
    const { data } = await sb.from('clients').select('id').ilike('name', n).maybeSingle();
    if (data) return (data as { id: string }).id;
  }
  throw new Error(`Apex client not found. Expected one of: ${APEX_NAMES.join(', ')}. Run base client seed first.`);
}

async function ensureRetailPatterns(): Promise<void> {
  for (const p of RETAIL_PATTERNS) {
    const { error } = await sb.from('engagement_topics').upsert(
      {
        topic_key: p.topic_key,
        title: p.title,
        tagline: p.tagline,
        industries: p.industries,
        key_patterns: p.key_patterns,
        canonical_shape_json: p.canonical_shape_json,
        deployment_count: p.deployment_count,
        successful_deployment_count: p.successful_deployment_count,
        promotion_state: p.promotion_state,
      },
      { onConflict: 'topic_key' },
    );
    if (error) throw new Error(`pattern ${p.topic_key}: ${error.message}`);
  }
}

async function findExistingProgram(clientId: string, name: string): Promise<string | null> {
  const { data } = await sb
    .from('engagements')
    .select('id')
    .eq('client_id', clientId)
    .eq('name', name)
    .maybeSingle();
  return data ? (data as { id: string }).id : null;
}

async function seedProgram(clientId: string, seed: ProgramSeed): Promise<string> {
  const existing = await findExistingProgram(clientId, seed.name);
  if (existing) {
    console.log(`✓ exists · ${seed.name} · ${existing}`);
    return existing;
  }

  // Deterministic graph_node_id so /engagements/[graphId] deep-links
  // resolve · omitting this leaves the row navigable only by UUID and
  // breaks the dashboard card → detail-page path. Slug is client-scoped
  // so 'Apex Retail HR ERP' seeded under both demo + integration tenants
  // stays unique without an id suffix.
  const graphNodeId = `eng_apex_${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;

  const { data: inserted, error: eErr } = await sb
    .from('engagements')
    .insert({
      graph_node_id: graphNodeId,
      client_id: clientId,
      name: seed.name,
      industry_code: 'RETAIL',
      function_code: 'FRONT_OFFICE',
      objective_code: 'GROW',
      status: seed.status,
      current_phase: seed.currentPhase,
      program_archetype: seed.archetype,
      origin_source: seed.originSource,
      maestro_oversight_level: seed.maestroOversightLevel,
      founder_approval_required: seed.founderApprovalRequired,
      data_residency_region: 'us',
      retention_policy_years: 7,
    })
    .select('id')
    .single();
  if (eErr) throw eErr;
  const programId = (inserted as { id: string }).id;
  console.log(`+ created · ${seed.name} · ${programId}`);

  // Pattern match log (if pattern shape)
  if (seed.patternKey) {
    const { error } = await sb.from('pattern_match_logs').insert({
      engagement_id: programId,
      pattern_key: seed.patternKey,
      match_confidence: 0.82,
      match_context_jsonb: { seeded: true },
      suggested_action: 'pattern',
      acted_upon: true,
      acted_upon_at: new Date().toISOString(),
      matched_by_agent: 'seed',
    });
    if (error) throw error;
  }

  // Modules — use pattern's canonical shape or override
  type SeededModule = { moduleKey: string; moduleName: string; phase: number; status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped' };
  const moduleList: SeededModule[] = [];
  if (seed.modulesOverride) {
    for (const m of seed.modulesOverride) moduleList.push(m);
  } else if (seed.patternKey) {
    const pat = RETAIL_PATTERNS.find((p) => p.topic_key === seed.patternKey);
    if (pat) {
      const shape = pat.canonical_shape_json as { modules: Array<{ moduleKey: string; name: string; phase: number }> };
      for (const m of shape.modules) {
        const status: SeededModule['status'] =
          m.phase < seed.currentPhase ? 'completed' :
          m.phase === seed.currentPhase ? 'in_progress' :
          'not_started';
        moduleList.push({ moduleKey: m.moduleKey, moduleName: m.name, phase: m.phase, status });
      }
    }
  }
  let order = 0;
  for (const m of moduleList) {
    const now = new Date().toISOString();
    await sb.from('program_modules').insert({
      engagement_id: programId,
      module_key: m.moduleKey,
      module_name: m.moduleName,
      phase_number: m.phase,
      module_order: order++,
      status: m.status,
      started_at: m.status !== 'not_started' ? now : null,
      completed_at: m.status === 'completed' ? now : null,
    });
  }

  // Milestones
  for (const ms of seed.milestones) {
    await sb.from('program_milestones').insert({
      engagement_id: programId,
      name: ms.name,
      description: ms.description ?? null,
      target_date: ms.targetDate,
      actual_date: ms.status === 'hit' ? ms.targetDate : null,
      status: ms.status,
    });
  }

  // Work items
  for (const wi of seed.workItems) {
    await sb.from('program_work_items').insert({
      engagement_id: programId,
      title: wi.title,
      item_type: wi.itemType,
      status: wi.status,
      priority: wi.priority ?? null,
      module_key: wi.moduleKey ?? null,
      due_date: wi.dueDate ?? null,
      completed_at: wi.status === 'done' ? new Date().toISOString() : null,
      metadata_jsonb: wi.nexusDrafted ? { nexus_drafted: true, nexus_drafted_at: new Date().toISOString() } : {},
    });
  }

  // Risks
  for (const r of seed.risks) {
    await sb.from('program_risks').insert({
      engagement_id: programId,
      title: r.title,
      likelihood: r.likelihood,
      impact: r.impact,
      status: r.status,
      mitigation_plan: r.mitigationPlan ?? null,
      closed_at: r.status === 'closed' ? new Date().toISOString() : null,
    });
  }

  // Deliverables + versions
  for (const d of seed.deliverables) {
    const { data: delivRow, error: dErr } = await sb
      .from('deliverables_v2')
      .insert({
        engagement_id: programId,
        deliverable_type_key: d.typeKey,
        title: d.title,
        status: d.status,
        current_version: 1,
        created_by: d.byNexus ? 'nexus' : 'maestro',
        signed_off_at: d.status === 'signed_off' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    if (dErr) throw dErr;
    const delivId = (delivRow as { id: string }).id;
    await sb.from('deliverable_versions').insert({
      deliverable_id: delivId,
      version: 1,
      content: d.content,
      structured_data: { seeded: true, byNexus: d.byNexus },
      quality_issues: d.byNexus ? { provenance_map: { pattern_key: seed.patternKey ?? null, seeded: true } } : null,
    });
  }

  // Maestro flags
  for (const f of seed.flags) {
    await sb.from('maestro_oversight_flags').insert({
      engagement_id: programId,
      flag_type: f.flagType,
      severity: f.severity,
      raised_by: 'nexus',
      headline: f.headline,
      context_jsonb: { seeded: true },
    });
  }

  // Module state log — one entry per completed module transition
  for (const m of moduleList) {
    if (m.status !== 'not_started') {
      await sb.from('module_state_log').insert({
        engagement_id: programId,
        module_key: m.moduleKey,
        previous_state: 'not_started',
        new_state: m.status,
        changed_by_agent: 'seed',
        notes: `Demo seed · ${seed.name}`,
      });
    }
  }

  return programId;
}

async function main() {
  console.log('─── Programs demo seed · Apex Retail ───');
  await ensureRetailPatterns();
  console.log(`✓ ${RETAIL_PATTERNS.length} retail patterns upserted`);
  await ensureDeliverableTypes();
  console.log(`✓ ${DEMO_DELIVERABLE_TYPES.length} deliverable types upserted`);
  const personIds = await ensurePersons();
  console.log(`✓ ${APEX_PERSONS.length} Apex demo persons ready`);
  const clientId = await ensureApexClient();
  console.log(`✓ Apex client · ${clientId}`);
  for (const seed of PROGRAMS) {
    const programId = await seedProgram(clientId, seed);
    await ensureProgramTeam(programId, seed.name, personIds);
  }
  console.log(`─── Done · ${PROGRAMS.length} programs ───`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

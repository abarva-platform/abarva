// scripts/seed-apex-demo-move.ts
//
// Seeds one Apex Retail Strategic Move for the CXO demo:
//   Contact Center AI Routing · P3 Design
//
// Run:
//   npx tsx scripts/seed-apex-demo-move.ts             # dry-run
//   npx tsx scripts/seed-apex-demo-move.ts --apply     # mutate Supabase
//
// The current DB names differ from the product terms in the prompt:
//   programs             -> engagements
//   phases               -> phase_snapshots + gates_passed
//   program_deliverables -> deliverables_v2 + deliverable_versions

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { P0_ORIGINATE_PACK } from '../src/lib/programs/phase-packs/v2/P0_originate.v2';
import { P1_CHARTER_PACK } from '../src/lib/programs/phase-packs/v2/P1_charter.v2';
import { P2_DIAGNOSE_PACK } from '../src/lib/programs/phase-packs/v2/P2_diagnose.v2';
import { P3_DESIGN_PACK } from '../src/lib/programs/phase-packs/v2/P3_design.v2';
import type { PhasePack } from '../src/lib/programs/phase-packs/types.v2';

type ApplyMode = 'dry-run' | 'apply';
type ModuleStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'skipped';
type DeliverableStatus = 'draft' | 'in_review' | 'signed_off';

const SEED_KEY = 'seed-apex-demo-move-contact-center-ai-routing';
const MOVE_NAME = 'Contact Center AI Routing';
const GRAPH_NODE_ID = 'eng_apex_contact_center_ai_routing_p3_demo';
const PATTERN_KEY = 'contact_center_ai_transformation';

const PHASE_PACKS = [
  P0_ORIGINATE_PACK,
  P1_CHARTER_PACK,
  P2_DIAGNOSE_PACK,
  P3_DESIGN_PACK,
] satisfies PhasePack[];

const APEX_NAMES = ['Apex Retail Group', 'Apex Retail'];

interface ClientRow {
  id: string;
  name: string;
}

interface PersonSeed {
  key: 'executive_sponsor' | 'data_sponsor' | 'sponsor_care' | 'lead_delivery' | 'architecture_owner';
  graph_node_id: string;
  name: string;
  email: string;
  role: string;
}

interface DeliverableSeed {
  typeKey: string;
  title: string;
  phase: number;
  status: DeliverableStatus;
  createdBy: 'nexus' | 'maestro';
  signedOffBy?: string;
  content: string;
  structuredData: Record<string, unknown>;
}

interface ModuleSeed {
  key: string;
  name: string;
  phase: number;
  status: ModuleStatus;
  deliverableKey?: string;
  blockerReason?: string;
}

interface MilestoneSeed {
  name: string;
  phase: number;
  targetDate: string;
  status: 'upcoming' | 'at_risk' | 'hit' | 'missed' | 'cancelled';
  description?: string;
}

interface WorkItemSeed {
  title: string;
  phase: number;
  itemType: 'workstream' | 'use_case' | 'solution' | 'execution_plan' | 'task';
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  moduleKey?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

interface RiskSeed {
  title: string;
  phase: number;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'open' | 'mitigating' | 'accepted' | 'transferred' | 'closed';
  mitigationPlan: string;
}

const PEOPLE: PersonSeed[] = [
  {
    key: 'executive_sponsor',
    graph_node_id: 'person:apex:carlos-rivera',
    name: 'Carlos Rivera',
    email: 'cio@apex-retail.example.com',
    role: 'Chief Information Officer',
  },
  {
    key: 'data_sponsor',
    graph_node_id: 'person:apex:lynne-stratham',
    name: 'Lynne Stratham',
    email: 'cdo@apex-retail.example.com',
    role: 'Chief Data Officer',
  },
  {
    key: 'sponsor_care',
    graph_node_id: 'person:apex:maya-reyes',
    name: 'Maya Reyes',
    email: 'maya.reyes@apex-retail.demo',
    role: 'VP Customer Care',
  },
  {
    key: 'lead_delivery',
    graph_node_id: 'person:apex:david-okafor',
    name: 'David Okafor',
    email: 'david.okafor@apex-retail.demo',
    role: 'Program Lead',
  },
  {
    key: 'architecture_owner',
    graph_node_id: 'person:apex:erin-cho',
    name: 'Erin Cho',
    email: 'erin.cho@apex-retail.demo',
    role: 'Enterprise Architecture Director',
  },
];

const DELIVERABLE_TYPES = [
  {
    type_key: 'origination_brief',
    title: 'Origination Brief',
    applicable_phases: [0],
    description: 'P0 handoff artifact anchored to the V2 Originate phase pack.',
  },
  {
    type_key: 'discovery_report',
    title: 'Discovery Report',
    applicable_phases: [1],
    description: 'P1 report with sponsor commitment, baseline request, stakeholders, and evidence plan.',
  },
  {
    type_key: 'baseline_metrics',
    title: 'Baseline Metrics',
    applicable_phases: [1, 2],
    description: 'Current-state baseline metrics with source, grain, method, owner, and caveats.',
  },
  {
    type_key: 'root_cause_analysis',
    title: 'Root Cause Analysis',
    applicable_phases: [2],
    description: 'P2 diagnosis artifact ranking root causes and Continue/Discontinue recommendation.',
  },
  {
    type_key: 'traceability_matrix',
    title: 'Traceability Matrix',
    applicable_phases: [3],
    description: 'P3 matrix linking P2 root causes to design requirements.',
  },
  {
    type_key: 'solution_design',
    title: 'Solution Design',
    applicable_phases: [3],
    description: 'P3 future-state design with architecture options and recommended path.',
  },
  {
    type_key: 'operating_model',
    title: 'Operating Model',
    applicable_phases: [3],
    description: 'P3 ownership, operating cadence, KPIs, and handoff conditions.',
  },
  {
    type_key: 'sourcing_strategy',
    title: 'Sourcing Strategy',
    applicable_phases: [3],
    description: 'P3 build/buy/configure/partner decision and source-event trigger.',
  },
];

const MODULES: ModuleSeed[] = [
  { key: 'p0_signal_capture', name: 'P0 signal capture', phase: 0, status: 'completed', deliverableKey: 'origination_brief' },
  { key: 'p0_sponsor_candidate', name: 'P0 sponsor candidate', phase: 0, status: 'completed', deliverableKey: 'origination_brief' },
  { key: 'p1_discovery_report', name: 'P1 discovery report', phase: 1, status: 'completed', deliverableKey: 'discovery_report' },
  { key: 'p1_baseline_request', name: 'P1 baseline request', phase: 1, status: 'completed', deliverableKey: 'baseline_metrics' },
  { key: 'p2_baseline_lock', name: 'P2 baseline lock', phase: 2, status: 'completed', deliverableKey: 'baseline_metrics' },
  { key: 'p2_root_cause_analysis', name: 'P2 root cause analysis', phase: 2, status: 'completed', deliverableKey: 'root_cause_analysis' },
  { key: 'p2_continue_decision', name: 'P2 Continue/Discontinue decision', phase: 2, status: 'completed', deliverableKey: 'root_cause_analysis' },
  { key: 'p3_traceability_matrix', name: 'Root cause to design requirements', phase: 3, status: 'in_progress', deliverableKey: 'traceability_matrix' },
  { key: 'p3_architecture_options', name: 'Architecture and routing options', phase: 3, status: 'in_progress', deliverableKey: 'solution_design' },
  { key: 'p3_operating_model', name: 'Target operating model', phase: 3, status: 'not_started', deliverableKey: 'operating_model' },
  { key: 'p3_sourcing_strategy', name: 'Sourcing strategy decision', phase: 3, status: 'not_started', deliverableKey: 'sourcing_strategy' },
  { key: 'p3_gate_readiness', name: 'P3 gate readiness', phase: 3, status: 'not_started' },
];

const DELIVERABLES: DeliverableSeed[] = [
  {
    typeKey: 'origination_brief',
    title: 'P0 Origination Brief - Contact Center AI Routing',
    phase: 0,
    status: 'signed_off',
    createdBy: 'maestro',
    content: [
      '# P0 Origination Brief - Contact Center AI Routing',
      '',
      'Trigger: repeat-transfer volume rose across Tier-1 and loyalty-support queues after the spring promotion cycle.',
      'Hypothesis: AI-assisted intent routing can reduce repeat transfers and stabilize CSAT without replacing the agent-support model.',
      'Executive sponsor: Carlos Rivera, CIO, because the routing platform and AI governance decisions sit in his operating portfolio.',
      'Data sponsor: Lynne Stratham, CDO, because routing-intent quality, transcript governance, and model monitoring require her data organization.',
      'Operating sponsor: Maya Reyes, VP Customer Care, because she owns care-channel operating metrics and the Q3 service-cost target.',
      'Scope in: voice and chat routing for Tier-1 care, loyalty support, and order-status queues.',
      'Scope out: workforce-management optimization, video support, and store associate tooling.',
      'P1 evidence request: AHT, transfer rate, queue reason codes, CSAT by queue, and escalation taxonomy for the past two quarters.',
    ].join('\n'),
    structuredData: {
      phase_pack: packDigest(P0_ORIGINATE_PACK),
      completed_step_ids: P0_ORIGINATE_PACK.workflow_steps.map((step) => step.step_id),
      artifact_sections: P0_ORIGINATE_PACK.workflow_steps.flatMap((step) => step.artifact_sections_to_update),
    },
  },
  {
    typeKey: 'discovery_report',
    title: 'P1 Discovery Report - Contact Center AI Routing',
    phase: 1,
    status: 'signed_off',
    createdBy: 'nexus',
    content: [
      '# P1 Discovery Report - Contact Center AI Routing',
      '',
      'Validated problem: 18% of loyalty-support contacts traverse two or more queues, and 31% of affected callers repeat contact within seven days.',
      'Executive alignment: Carlos Rivera and Lynne Stratham agreed P2 diagnosis should focus on routing taxonomy, channel mix, escalation rules, data governance, and model-monitoring readiness.',
      'Stakeholders: Carlos Rivera, Lynne Stratham, Maya Reyes, Customer Care Operations, Loyalty Product, Enterprise Architecture, Data Platform, Legal/Privacy.',
      'P2 readiness: continue to diagnosis with decision-grade call reason, routing, and CSAT extracts.',
    ].join('\n'),
    structuredData: {
      phase_pack: packDigest(P1_CHARTER_PACK),
      completed_step_ids: P1_CHARTER_PACK.workflow_steps.map((step) => step.step_id),
    },
  },
  {
    typeKey: 'baseline_metrics',
    title: 'P2 Baseline Metrics - Contact Center AI Routing',
    phase: 2,
    status: 'signed_off',
    createdBy: 'nexus',
    content: [
      '# P2 Baseline Metrics - Contact Center AI Routing',
      '',
      '| Metric | Current baseline | Source | Grain | Caveat |',
      '| --- | ---: | --- | --- | --- |',
      '| Repeat transfer rate | 18.4% | Genesys routing export | Queue-week | Promotion weeks excluded |',
      '| Seven-day repeat contact | 31.2% | CRM case history | Customer-case | Loyalty-only mapping incomplete |',
      '| Average handle time | 11.8 min | Contact-center BI | Queue-day | Spanish-language queue under-sampled |',
      '| CSAT after transfer | 3.7 / 5 | Survey platform | Queue-month | Response bias flagged |',
      '',
      'Metric owner: Customer Care Analytics. Baseline is decision-grade for P3 routing design with one caveat on Spanish-language sample size.',
    ].join('\n'),
    structuredData: {
      source_systems: ['Genesys', 'Salesforce Service Cloud', 'Apex Contact Center BI'],
      decision_grade: true,
      phase_pack: packDigest(P2_DIAGNOSE_PACK),
    },
  },
  {
    typeKey: 'root_cause_analysis',
    title: 'P2 Root Cause Analysis - Contact Center AI Routing',
    phase: 2,
    status: 'signed_off',
    createdBy: 'nexus',
    content: [
      '# P2 Root Cause Analysis - Contact Center AI Routing',
      '',
      'Ranked root causes:',
      '1. Intent taxonomy is inconsistent across IVR, chat, and agent disposition codes.',
      '2. Loyalty edge cases lack a deterministic routing rule when order status and rewards issues overlap.',
      '3. Supervisors tune routing weekly, but changes are not traced to CSAT or repeat-contact outcomes.',
      '',
      'Continue/Discontinue verdict: CONTINUE_TO_P3.',
      'Reason: baseline is sufficient, sponsor owns the operating metric, and root causes can be mapped to concrete design requirements.',
    ].join('\n'),
    structuredData: {
      verdict: 'CONTINUE_TO_P3',
      root_causes: [
        'taxonomy_mismatch',
        'loyalty_overlap_routing_gap',
        'routing_change_feedback_gap',
      ],
      phase_pack: packDigest(P2_DIAGNOSE_PACK),
    },
  },
  {
    typeKey: 'traceability_matrix',
    title: 'P3 Traceability Matrix - Contact Center AI Routing',
    phase: 3,
    status: 'in_review',
    createdBy: 'nexus',
    content: [
      '# P3 Traceability Matrix - Contact Center AI Routing',
      '',
      '| P2 root cause | P3 design requirement | Status |',
      '| --- | --- | --- |',
      '| Intent taxonomy mismatch | Canonical cross-channel intent model with synonym map | Drafted |',
      '| Loyalty overlap routing gap | Tie-breaker rules for rewards + order-status collisions | Drafted |',
      '| Feedback gap | Routing experiment ledger linked to CSAT and repeat contact | Open |',
    ].join('\n'),
    structuredData: {
      phase_pack: packDigest(P3_DESIGN_PACK),
      completed_step_ids: ['P3.1'],
      open_steps: ['P3.2', 'P3.3', 'P3.4', 'P3.5'],
    },
  },
  {
    typeKey: 'solution_design',
    title: 'P3 Solution Design Options - Contact Center AI Routing',
    phase: 3,
    status: 'draft',
    createdBy: 'nexus',
    content: [
      '# P3 Solution Design Options - Contact Center AI Routing',
      '',
      'Option A: configure Genesys native routing with a normalized intent layer.',
      'Option B: add AI classifier in front of voice/chat routing and keep Genesys as execution layer.',
      'Option C: broader contact-center platform change. Rejected for P3 because it expands scope beyond the diagnosed routing failure.',
      '',
      'Current recommendation: Option B, pending Architecture Council review and privacy review for transcript use.',
    ].join('\n'),
    structuredData: {
      recommended_option: 'AI classifier plus Genesys execution layer',
      open_decisions: ['Architecture Council review', 'Privacy review for transcript use'],
    },
  },
];

const MILESTONES: MilestoneSeed[] = [
  { name: 'P0 origination accepted', phase: 0, targetDate: '2026-04-10', status: 'hit' },
  { name: 'P1 sponsor discovery complete', phase: 1, targetDate: '2026-04-17', status: 'hit' },
  { name: 'P2 diagnosis gate passed', phase: 2, targetDate: '2026-05-03', status: 'hit' },
  { name: 'Architecture Council design review', phase: 3, targetDate: '2026-05-15', status: 'upcoming' },
  { name: 'Privacy review on transcript use', phase: 3, targetDate: '2026-05-17', status: 'upcoming' },
];

const WORK_ITEMS: WorkItemSeed[] = [
  { title: 'Normalize voice/chat/order-status intent taxonomy', phase: 3, itemType: 'workstream', status: 'in_progress', priority: 'critical', moduleKey: 'p3_traceability_matrix', dueDate: '2026-05-14', metadata: { nexus_drafted: true } },
  { title: 'Score architecture options against EA guardrails', phase: 3, itemType: 'solution', status: 'in_progress', priority: 'high', moduleKey: 'p3_architecture_options', dueDate: '2026-05-15', metadata: { nexus_drafted: true } },
  { title: 'Confirm routing experiment owner and KPI cadence', phase: 3, itemType: 'task', status: 'open', priority: 'medium', moduleKey: 'p3_operating_model', dueDate: '2026-05-18' },
  { title: 'Decide whether source event is needed for classifier vendor', phase: 3, itemType: 'task', status: 'open', priority: 'medium', moduleKey: 'p3_sourcing_strategy', dueDate: '2026-05-20' },
];

const RISKS: RiskSeed[] = [
  {
    title: 'Transcript use may require additional privacy controls before design sign-off',
    phase: 3,
    likelihood: 'medium',
    impact: 'high',
    status: 'mitigating',
    mitigationPlan: 'Run privacy review before P3 gate and keep no-transcript configuration as fallback.',
  },
  {
    title: 'Routing design may drift into workforce optimization scope',
    phase: 3,
    likelihood: 'medium',
    impact: 'medium',
    status: 'open',
    mitigationPlan: 'Keep P3 requirements tied to P2 root causes and defer workforce-management requests to a separate Move.',
  },
];

function loadDotEnv(): void {
  try {
    const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of env.split('\n')) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // Shell-provided env is enough.
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function parseMode(): ApplyMode {
  const args = new Set(process.argv.slice(2));
  if (args.has('--apply')) return 'apply';
  return 'dry-run';
}

function makeSupabase(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  ) as SupabaseClient;
}

function packDigest(pack: PhasePack): Record<string, unknown> {
  return {
    phase_id: pack.phase_id,
    phase_name: pack.phase_name,
    phase_intent: pack.phase_intent,
    entry_criteria: pack.entry_criteria.map((criterion) => criterion.id),
    workflow_steps: pack.workflow_steps.map((step) => step.step_id),
    evidence_requirements: pack.evidence_requirements.map((requirement) => requirement.id),
  };
}

function completedGateFor(pack: PhasePack, lockedAt: string, lockedBy: string): Record<string, unknown> {
  return {
    phase: pack.phase_id,
    phase_name: pack.phase_name,
    status: 'approved',
    signed_at: lockedAt,
    signed_by: lockedBy,
    seed_key: SEED_KEY,
    criteria: pack.gate_criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      type: criterion.type,
      result: 'pass',
    })),
  };
}

function phaseSnapshotFor(pack: PhasePack, status: 'approved' | 'draft', lockedAt: string | null): Record<string, unknown> {
  const isApproved = status === 'approved';
  return {
    seed_key: SEED_KEY,
    phase_pack: packDigest(pack),
    completed_step_ids: isApproved ? pack.workflow_steps.map((step) => step.step_id) : ['P3.1'],
    open_step_ids: isApproved ? [] : ['P3.2', 'P3.3', 'P3.4', 'P3.5'],
    gate_state: isApproved ? 'passed' : 'open',
    artifact_sections: pack.workflow_steps.flatMap((step) => step.artifact_sections_to_update),
    evidence_keys: pack.workflow_steps.flatMap((step) => step.evidence_to_capture),
    locked_at: lockedAt,
  };
}

function logPlan(mode: ApplyMode, message: string): void {
  console.log(`${mode === 'apply' ? 'apply' : 'dry-run'} · ${message}`);
}

async function ensureApexClient(sb: SupabaseClient): Promise<ClientRow> {
  for (const name of APEX_NAMES) {
    const { data, error } = await sb.from('clients').select('id, name').ilike('name', name).maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error(`Apex client not found. Expected one of: ${APEX_NAMES.join(', ')}`);
}

async function ensurePersons(sb: SupabaseClient, mode: ApplyMode): Promise<Record<PersonSeed['key'], string>> {
  const ids = {} as Record<PersonSeed['key'], string>;

  for (const person of PEOPLE) {
    const { data: existing, error } = await sb
      .from('persons')
      .select('id')
      .or(`email.eq.${person.email},graph_node_id.eq.${person.graph_node_id}`)
      .maybeSingle();
    if (error) throw error;

    if (existing) {
      ids[person.key] = (existing as { id: string }).id;
      if (mode === 'apply') {
        const { error: updateError } = await sb
          .from('persons')
          .update({
            graph_node_id: person.graph_node_id,
            name: person.name,
            email: person.email,
            role: person.role,
            organization: 'Apex Retail Group',
          })
          .eq('id', ids[person.key]);
        if (updateError) throw updateError;
      }
      logPlan(mode, `person ready · ${person.name}`);
      continue;
    }

    if (mode === 'dry-run') {
      ids[person.key] = `<${person.key}>`;
      logPlan(mode, `would create person · ${person.name}`);
      continue;
    }

    const { data: inserted, error: insertError } = await sb
      .from('persons')
      .insert({
        graph_node_id: person.graph_node_id,
        name: person.name,
        email: person.email,
        role: person.role,
        organization: 'Apex Retail Group',
      })
      .select('id')
      .single();
    if (insertError) throw insertError;
    ids[person.key] = (inserted as { id: string }).id;
    logPlan(mode, `created person · ${person.name}`);
  }

  return ids;
}

async function ensureDeliverableTypes(sb: SupabaseClient, mode: ApplyMode): Promise<void> {
  for (const type of DELIVERABLE_TYPES) {
    if (mode === 'dry-run') {
      logPlan(mode, `would upsert deliverable_type · ${type.type_key}`);
      continue;
    }
    const { error } = await sb.from('deliverable_types').upsert(
      {
        type_key: type.type_key,
        title: type.title,
        description: type.description,
        applicable_phases: type.applicable_phases,
        applicable_topics: ['contact_center_ai_transformation', 'retail'],
        template_structure: { seed_key: SEED_KEY, phase_contract: 'PhasePack V2' },
        required_data_inputs: { phase_pack_steps: true },
        quality_rubric: { seed_quality: 'demo-ready, evidence-grounded' },
        generation_prompt_template: `Draft ${type.title} for the Apex Retail Contact Center AI Routing Move.`,
        output_format: 'markdown',
        version: 1,
        maturity: 'pilot',
      },
      { onConflict: 'type_key' },
    );
    if (error) throw error;
    logPlan(mode, `upserted deliverable_type · ${type.type_key}`);
  }
}

async function ensureRetailPattern(sb: SupabaseClient, mode: ApplyMode): Promise<void> {
  const payload = {
    topic_key: PATTERN_KEY,
    title: 'Contact Center AI Transformation',
    tagline: 'Intent routing, agent assist, and care-channel deflection for retail contact centers',
    industries: ['retail'],
    key_patterns: ['intent_routing', 'agent_assist', 'repeat_contact_reduction'],
    canonical_shape_json: {
      archetype: 'ai_product_enablement',
      phases: PHASE_PACKS.map((pack) => ({ canonicalPhase: pack.phase_id, name: pack.phase_name })),
      modules: MODULES.map((module) => ({ moduleKey: module.key, name: module.name, phase: module.phase })),
      preload_depth_pct: 85,
    },
    deployment_count: 14,
    successful_deployment_count: 11,
    promotion_state: 'mature',
  };

  if (mode === 'dry-run') {
    logPlan(mode, `would upsert engagement_topic · ${PATTERN_KEY}`);
    return;
  }

  const { error } = await sb.from('engagement_topics').upsert(payload, { onConflict: 'topic_key' });
  if (error) throw error;
  logPlan(mode, `upserted engagement_topic · ${PATTERN_KEY}`);
}

async function ensureProgram(sb: SupabaseClient, mode: ApplyMode, client: ClientRow, sponsorId: string): Promise<string> {
  const { data: existing, error } = await sb
    .from('engagements')
    .select('id')
    .eq('client_id', client.id)
    .eq('name', MOVE_NAME)
    .maybeSingle();
  if (error) throw error;

  const programPayload = {
    graph_node_id: GRAPH_NODE_ID,
    client_id: client.id,
    name: MOVE_NAME,
    industry_code: 'RETAIL',
    function_code: 'FRONT_OFFICE',
    objective_code: 'SERVICE_COST_AND_EXPERIENCE',
    topic_code: PATTERN_KEY,
    sponsor_person_id: sponsorId.startsWith('<') ? null : sponsorId,
    problem_statement:
      'Repeat transfers and repeat contacts are rising across Apex Retail care queues because intent taxonomy and routing rules diverge across voice, chat, and loyalty workflows.',
    target_outcome:
      'Reduce repeat-transfer rate by 25% and seven-day repeat contact by 15% while holding CSAT flat or better.',
    timeline_horizon: 'P3 design review in May 2026; P4 roadmap decision by early June 2026.',
    value_projected_low_usd: 1800000,
    value_projected_high_usd: 3200000,
    value_currency: 'USD',
    value_verified_status: 'pending',
    value_assumptions_jsonb: {
      seed_key: SEED_KEY,
      basis: 'Contact-center baseline and repeat-contact reduction model',
      caveat: 'Demo seed projection; not an audited finance value.',
    },
    baseline_metrics: {
      seed_key: SEED_KEY,
      repeat_transfer_rate_pct: 18.4,
      seven_day_repeat_contact_pct: 31.2,
      average_handle_time_minutes: 11.8,
      csat_after_transfer: 3.7,
    },
    program_archetype: 'ai_product_enablement',
    origin_source: 'intelligence_promoted',
    status: 'active',
    lifecycle_state: 'approved',
    current_phase: 3,
    current_module_key: 'p3_traceability_matrix',
    maestro_oversight_level: 'full',
    founder_approval_required: true,
    data_residency_region: 'us',
    retention_policy_years: 7,
    charter: {
      seed_key: SEED_KEY,
      scaffold: {
        problem_statement: 'Repeat transfers and repeat contacts are rising across Apex Retail care queues.',
        sponsor_candidate: 'Carlos Rivera, CIO, with Lynne Stratham as data sponsor and Maya Reyes as operating sponsor',
        scope_boundary: 'Voice and chat routing for Tier-1 care, loyalty support, and order-status queues.',
        archetype: 'ai_product_enablement',
        value_hypothesis: 'Lower transfer/recontact burden while preserving CSAT.',
        evidence_family: 'Genesys, CRM, CSAT, and routing-change ledger evidence.',
      },
      phase_contract: PHASE_PACKS.map(packDigest),
    },
    gates_passed: [
      completedGateFor(P0_ORIGINATE_PACK, '2026-04-10T16:00:00.000Z', sponsorId),
      completedGateFor(P1_CHARTER_PACK, '2026-04-17T16:00:00.000Z', sponsorId),
      completedGateFor(P2_DIAGNOSE_PACK, '2026-05-03T16:00:00.000Z', sponsorId),
    ],
  };

  if (existing) {
    const programId = (existing as { id: string }).id;
    if (mode === 'apply') {
      const { error: updateError } = await sb.from('engagements').update(programPayload).eq('id', programId);
      if (updateError) throw updateError;
    }
    logPlan(mode, `${mode === 'apply' ? 'updated' : 'would update'} program · ${MOVE_NAME} · ${programId}`);
    return programId;
  }

  if (mode === 'dry-run') {
    logPlan(mode, `would create program · ${MOVE_NAME} for ${client.name}`);
    return '<program-id>';
  }

  const { data: inserted, error: insertError } = await sb.from('engagements').insert(programPayload).select('id').single();
  if (insertError) throw insertError;
  const programId = (inserted as { id: string }).id;
  logPlan(mode, `created program · ${MOVE_NAME} · ${programId}`);
  return programId;
}

async function ensureProgramTeam(
  sb: SupabaseClient,
  mode: ApplyMode,
  programId: string,
  people: Record<PersonSeed['key'], string>,
): Promise<void> {
  const assignments = [
    { personId: people.executive_sponsor, role: 'executive_sponsor', authority: 'sponsor' },
    { personId: people.data_sponsor, role: 'data_sponsor', authority: 'approver' },
    { personId: people.sponsor_care, role: 'sponsor', authority: 'sponsor' },
    { personId: people.lead_delivery, role: 'lead', authority: 'approver' },
    { personId: people.architecture_owner, role: 'architecture_owner', authority: 'contributor' },
  ];

  for (const assignment of assignments) {
    if (mode === 'dry-run' || programId.startsWith('<') || assignment.personId.startsWith('<')) {
      logPlan(mode, `would ensure participant · ${assignment.role}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('engagement_participants')
      .select('id')
      .eq('engagement_id', programId)
      .eq('user_id', assignment.personId)
      .maybeSingle();
    if (error) throw error;

    const personName = PEOPLE.find((person) => people[person.key] === assignment.personId)?.name ?? assignment.personId;
    const payload = {
      engagement_id: programId,
      user_id: assignment.personId,
      user_name: personName,
      role: assignment.role,
      approval_authority: assignment.authority,
      last_touchpoint_at: new Date().toISOString(),
      view_state: { seed_key: SEED_KEY },
    };

    if (existing) {
      const { error: updateError } = await sb
        .from('engagement_participants')
        .update(payload)
        .eq('id', (existing as { id: string }).id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('engagement_participants').insert(payload);
      if (insertError) throw insertError;
    }
    logPlan(mode, `ensured participant · ${assignment.role}`);
  }
}

async function ensurePatternMatch(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  if (mode === 'dry-run' || programId.startsWith('<')) {
    logPlan(mode, `would ensure pattern_match_log · ${PATTERN_KEY}`);
    return;
  }

  const { data: existing, error } = await sb
    .from('pattern_match_logs')
    .select('id')
    .eq('engagement_id', programId)
    .eq('pattern_key', PATTERN_KEY)
    .limit(1);
  if (error) throw error;

  const payload = {
    engagement_id: programId,
    pattern_key: PATTERN_KEY,
    match_confidence: 0.87,
    match_context_jsonb: { seed_key: SEED_KEY, source: 'Apex demo Move seed' },
    suggested_action: 'pattern',
    acted_upon: true,
    acted_upon_at: '2026-04-10T16:00:00.000Z',
    matched_by_agent: 'seed',
  };

  if ((existing as Array<{ id: string }> | null)?.[0]) {
    const { error: updateError } = await sb
      .from('pattern_match_logs')
      .update(payload)
      .eq('id', (existing as Array<{ id: string }>)[0].id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await sb.from('pattern_match_logs').insert(payload);
    if (insertError) throw insertError;
  }
  logPlan(mode, `ensured pattern_match_log · ${PATTERN_KEY}`);
}

async function ensureModules(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  let order = 0;
  for (const moduleSeed of MODULES) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure module · ${moduleSeed.key}`);
      order += 1;
      continue;
    }

    const now = new Date().toISOString();
    const payload = {
      engagement_id: programId,
      module_key: moduleSeed.key,
      module_name: moduleSeed.name,
      phase_number: moduleSeed.phase,
      module_order: order,
      status: moduleSeed.status,
      state_jsonb: {
        seed_key: SEED_KEY,
        deliverableKey: moduleSeed.deliverableKey ?? null,
        nexus_draft_pending: moduleSeed.status === 'in_progress',
        blocker_reason: moduleSeed.blockerReason ?? null,
      },
      started_at: moduleSeed.status === 'not_started' ? null : now,
      completed_at: moduleSeed.status === 'completed' ? now : null,
    };

    const { error } = await sb.from('program_modules').upsert(payload, { onConflict: 'engagement_id,module_key' });
    if (error) throw error;

    if (moduleSeed.status !== 'not_started') {
      await ensureModuleLog(sb, programId, moduleSeed.key, moduleSeed.status);
    }
    logPlan(mode, `ensured module · ${moduleSeed.key}`);
    order += 1;
  }
}

async function ensureModuleLog(sb: SupabaseClient, programId: string, moduleKey: string, status: ModuleStatus): Promise<void> {
  const { data: existing, error } = await sb
    .from('module_state_log')
    .select('id')
    .eq('engagement_id', programId)
    .eq('module_key', moduleKey)
    .eq('changed_by_agent', 'seed')
    .limit(1);
  if (error) throw error;
  if ((existing as Array<{ id: string }> | null)?.length) return;

  const { error: insertError } = await sb.from('module_state_log').insert({
    engagement_id: programId,
    module_key: moduleKey,
    previous_state: 'not_started',
    new_state: status,
    changed_by_agent: 'seed',
    notes: `Demo seed · ${MOVE_NAME}`,
    context_jsonb: { seed_key: SEED_KEY },
  });
  if (insertError) throw insertError;
}

async function ensurePhaseSnapshots(
  sb: SupabaseClient,
  mode: ApplyMode,
  programId: string,
  people: Record<PersonSeed['key'], string>,
): Promise<void> {
  const snapshots = [
    { pack: P0_ORIGINATE_PACK, status: 'approved' as const, lockedAt: '2026-04-10T16:00:00.000Z' },
    { pack: P1_CHARTER_PACK, status: 'approved' as const, lockedAt: '2026-04-17T16:00:00.000Z' },
    { pack: P2_DIAGNOSE_PACK, status: 'approved' as const, lockedAt: '2026-05-03T16:00:00.000Z' },
    { pack: P3_DESIGN_PACK, status: 'draft' as const, lockedAt: null },
  ];

  for (const snapshot of snapshots) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure phase snapshot · P${snapshot.pack.phase_id} ${snapshot.status}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('phase_snapshots')
      .select('id')
      .eq('engagement_id', programId)
      .eq('phase_number', snapshot.pack.phase_id)
      .contains('snapshot_jsonb', { seed_key: SEED_KEY })
      .limit(1);
    if (error) throw error;

    const payload = {
      engagement_id: programId,
      phase_number: snapshot.pack.phase_id,
      phase_name: snapshot.pack.phase_name,
      snapshot_jsonb: phaseSnapshotFor(snapshot.pack, snapshot.status, snapshot.lockedAt),
      locked_by_user_id: snapshot.status === 'approved' ? people.sponsor_care : null,
      locked_at: snapshot.lockedAt,
      approval_status: snapshot.status,
    };

    const existingId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    if (existingId) {
      const { error: updateError } = await sb.from('phase_snapshots').update(payload).eq('id', existingId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('phase_snapshots').insert(payload);
      if (insertError) throw insertError;
    }
    logPlan(mode, `ensured phase snapshot · P${snapshot.pack.phase_id} ${snapshot.status}`);
  }
}

async function ensureDeliverables(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  for (const deliverable of DELIVERABLES) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure deliverable · ${deliverable.title}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('deliverables_v2')
      .select('id')
      .eq('engagement_id', programId)
      .eq('deliverable_type_key', deliverable.typeKey)
      .eq('title', deliverable.title)
      .limit(1);
    if (error) throw error;

    let deliverableId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    const payload = {
      engagement_id: programId,
      deliverable_type_key: deliverable.typeKey,
      title: deliverable.title,
      status: deliverable.status,
      current_version: 1,
      created_by: deliverable.createdBy,
      signed_off_by: deliverable.status === 'signed_off' ? (deliverable.signedOffBy ?? 'Maya Reyes') : null,
      signed_off_at: deliverable.status === 'signed_off' ? '2026-05-03T16:00:00.000Z' : null,
    };

    if (deliverableId) {
      const { error: updateError } = await sb.from('deliverables_v2').update(payload).eq('id', deliverableId);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await sb
        .from('deliverables_v2')
        .insert(payload)
        .select('id')
        .single();
      if (insertError) throw insertError;
      deliverableId = (inserted as { id: string }).id;
    }

    const { error: versionError } = await sb.from('deliverable_versions').upsert(
      {
        deliverable_id: deliverableId,
        version: 1,
        content: deliverable.content,
        structured_data: {
          seed_key: SEED_KEY,
          phase: deliverable.phase,
          ...deliverable.structuredData,
        },
        quality_score: { demo_ready: true, evidence_grounded: true },
        quality_issues: deliverable.status === 'draft' ? { open_items: ['P3 gate still open'] } : null,
        generated_from_context_hash: SEED_KEY,
      },
      { onConflict: 'deliverable_id,version' },
    );
    if (versionError) throw versionError;
    logPlan(mode, `ensured deliverable · ${deliverable.title}`);
  }
}

async function ensureMilestones(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  for (const milestone of MILESTONES) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure milestone · ${milestone.name}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('program_milestones')
      .select('id')
      .eq('engagement_id', programId)
      .eq('name', milestone.name)
      .limit(1);
    if (error) throw error;

    const payload = {
      engagement_id: programId,
      name: milestone.name,
      description: milestone.description ?? `Demo seed milestone for ${MOVE_NAME}`,
      target_date: milestone.targetDate,
      actual_date: milestone.status === 'hit' ? milestone.targetDate : null,
      status: milestone.status,
      phase_number: milestone.phase,
      module_key: null,
    };

    const existingId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    if (existingId) {
      const { error: updateError } = await sb.from('program_milestones').update(payload).eq('id', existingId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('program_milestones').insert(payload);
      if (insertError) throw insertError;
    }
    logPlan(mode, `ensured milestone · ${milestone.name}`);
  }
}

async function ensureWorkItems(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  for (const item of WORK_ITEMS) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure work item · ${item.title}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('program_work_items')
      .select('id')
      .eq('engagement_id', programId)
      .eq('title', item.title)
      .limit(1);
    if (error) throw error;

    const payload = {
      engagement_id: programId,
      title: item.title,
      item_type: item.itemType,
      status: item.status,
      priority: item.priority,
      module_key: item.moduleKey ?? null,
      phase_number: item.phase,
      due_date: item.dueDate ?? null,
      completed_at: item.status === 'done' ? new Date().toISOString() : null,
      metadata_jsonb: { seed_key: SEED_KEY, ...(item.metadata ?? {}) },
    };

    const existingId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    if (existingId) {
      const { error: updateError } = await sb.from('program_work_items').update(payload).eq('id', existingId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('program_work_items').insert(payload);
      if (insertError) throw insertError;
    }
    logPlan(mode, `ensured work item · ${item.title}`);
  }
}

async function ensureRisks(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  for (const risk of RISKS) {
    if (mode === 'dry-run' || programId.startsWith('<')) {
      logPlan(mode, `would ensure risk · ${risk.title}`);
      continue;
    }

    const { data: existing, error } = await sb
      .from('program_risks')
      .select('id')
      .eq('engagement_id', programId)
      .eq('title', risk.title)
      .limit(1);
    if (error) throw error;

    const payload = {
      engagement_id: programId,
      title: risk.title,
      description: `Demo seed risk for ${MOVE_NAME}`,
      likelihood: risk.likelihood,
      impact: risk.impact,
      status: risk.status,
      mitigation_plan: risk.mitigationPlan,
      phase_number: risk.phase,
      module_key: null,
    };

    const existingId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    if (existingId) {
      const { error: updateError } = await sb.from('program_risks').update(payload).eq('id', existingId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await sb.from('program_risks').insert(payload);
      if (insertError) throw insertError;
    }
    logPlan(mode, `ensured risk · ${risk.title}`);
  }
}

async function ensureOpenP3GateFlag(sb: SupabaseClient, mode: ApplyMode, programId: string): Promise<void> {
  const headline = 'P3 Design gate open - architecture and operating-model decisions pending';
  if (mode === 'dry-run' || programId.startsWith('<')) {
    logPlan(mode, `would ensure oversight flag · ${headline}`);
    return;
  }

  const { data: existing, error } = await sb
    .from('maestro_oversight_flags')
    .select('id')
    .eq('engagement_id', programId)
    .eq('headline', headline)
    .limit(1);
  if (error) throw error;

  const payload = {
    engagement_id: programId,
    flag_type: 'decision_required',
    severity: 'info',
    raised_by: 'nexus',
    headline,
    context_jsonb: {
      seed_key: SEED_KEY,
      current_phase: 3,
      open_gate: 'P3 Design',
      next_decisions: ['Architecture Council review', 'Privacy review', 'Operating owner confirmation'],
    },
    resolved_at: null,
  };

  const existingId = (existing as Array<{ id: string }> | null)?.[0]?.id;
  if (existingId) {
    const { error: updateError } = await sb.from('maestro_oversight_flags').update(payload).eq('id', existingId);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await sb.from('maestro_oversight_flags').insert(payload);
    if (insertError) throw insertError;
  }
  logPlan(mode, `ensured oversight flag · ${headline}`);
}

async function main(): Promise<void> {
  loadDotEnv();
  const mode = parseMode();
  const sb = makeSupabase();

  console.log('Apex demo Strategic Move seed');
  console.log(`mode: ${mode}`);
  if (mode === 'dry-run') {
    console.log('No writes will be made. Re-run with --apply to mutate Supabase.');
  }

  const client = await ensureApexClient(sb);
  logPlan(mode, `Apex client ready · ${client.name} · ${client.id}`);
  const people = await ensurePersons(sb, mode);
  await ensureRetailPattern(sb, mode);
  await ensureDeliverableTypes(sb, mode);
  const programId = await ensureProgram(sb, mode, client, people.executive_sponsor);
  await ensureProgramTeam(sb, mode, programId, people);
  await ensurePatternMatch(sb, mode, programId);
  await ensureModules(sb, mode, programId);
  await ensurePhaseSnapshots(sb, mode, programId, people);
  await ensureDeliverables(sb, mode, programId);
  await ensureMilestones(sb, mode, programId);
  await ensureWorkItems(sb, mode, programId);
  await ensureRisks(sb, mode, programId);
  await ensureOpenP3GateFlag(sb, mode, programId);

  console.log(`done · ${MOVE_NAME} is ready at P3 Design${mode === 'dry-run' ? ' (planned)' : ''}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

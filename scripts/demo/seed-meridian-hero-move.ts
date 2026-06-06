// scripts/demo/seed-meridian-hero-move.ts
//
// Seeds ONE hero Strategic Move for the synthetic Meridian Health
// (meridian-health) demo tenant:
//
//   AI-enabled Population Health & Clinical Performance Command Center
//   advanced through P0..P5 (Originate -> Charter -> Discover & Diagnose ->
//   Design Future State -> Roadmap & Business Case -> Mobilize & Handoff).
//
// It writes one engagement + per-phase deliverables (deliverables_v2 +
// deliverable_versions) + participants + modules + milestones + risks, using
// the SAME table/column contract as scripts/seed-apex-demo-move.ts.
//
// Placement note: this file lives under scripts/demo/ (NOT scripts/seed/) on
// purpose. It seeds control-plane DEMO move/deliverable rows, not client
// CONTEXT data. Pilot CONTEXT data must still enter through the governed Admin
// Context Loader (see docs/runbooks/pilot-data-loader-governance.md); this
// script never loads tenant context chunks.
//
// All content is SYNTHETIC and inspired-by — never real confidential PHS data.
//
// Run:
//   npx tsx scripts/demo/seed-meridian-hero-move.ts            # dry-run (no DB, no env)
//   npx tsx scripts/demo/seed-meridian-hero-move.ts --apply    # mutate Postgres/Supabase
//
// --apply requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or the
// Azure data-plane equivalents) and DB reachability. From Cursor Cloud the
// private Azure Postgres is network-unreachable, so --apply must run from the
// Azure Container Apps private-worker path or an environment inside the VNet.

type ApplyMode = 'dry-run' | 'apply';
type DeliverableStatus = 'draft' | 'in_review' | 'signed_off';

const SEED_KEY = 'seed-meridian-hero-move-pop-health-command-center';
const MOVE_NAME =
  'AI-enabled Population Health & Clinical Performance Command Center';
const GRAPH_NODE_ID = 'eng_meridian_pop_health_command_center_p5_demo';
const TENANT_KEY = 'meridian-health';
const MERIDIAN_NAMES = ['Meridian Health', 'Meridian Health System'];
const CURRENT_PHASE = 5;
const VALUE_LOW = 38_000_000;
const VALUE_HIGH = 61_000_000;

interface PersonSeed {
  key:
    | 'executive_sponsor'
    | 'plan_sponsor'
    | 'data_sponsor'
    | 'clinical_sponsor'
    | 'lead_delivery';
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
  content: string;
  structuredData: Record<string, unknown>;
}

interface ModuleSeed {
  key: string;
  name: string;
  phase: number;
  status: 'not_started' | 'in_progress' | 'completed';
  deliverableKey?: string;
}

interface RiskSeed {
  title: string;
  phase: number;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'open' | 'mitigating' | 'accepted' | 'closed';
  mitigationPlan: string;
}

const PEOPLE: PersonSeed[] = [
  {
    key: 'executive_sponsor',
    graph_node_id: 'person:meridian:cpho',
    name: 'Dr. Anita Rao',
    email: 'cpho@meridian-health.demo',
    role: 'Chief Population Health Officer',
  },
  {
    key: 'plan_sponsor',
    graph_node_id: 'person:meridian:plan-coo',
    name: 'Marcus Bell',
    email: 'plan.coo@meridian-health.demo',
    role: 'Health Plan COO',
  },
  {
    key: 'data_sponsor',
    graph_node_id: 'person:meridian:cdao',
    name: 'Priya Natarajan',
    email: 'cdao@meridian-health.demo',
    role: 'Chief Data & Analytics Officer',
  },
  {
    key: 'clinical_sponsor',
    graph_node_id: 'person:meridian:cmio',
    name: 'Dr. Sam Whitfield',
    email: 'cmio@meridian-health.demo',
    role: 'Chief Medical Information Officer',
  },
  {
    key: 'lead_delivery',
    graph_node_id: 'person:meridian:transformation-lead',
    name: 'Jordan Avery',
    email: 'transformation.lead@meridian-health.demo',
    role: 'Transformation Office Lead',
  },
];

const SYNTH = 'Synthetic, Meridian/PHS-inspired pilot context — not real confidential PHS data.';

const DELIVERABLES: DeliverableSeed[] = [
  {
    typeKey: 'charter',
    title: 'P1 Charter — Population Health Command Center',
    phase: 1,
    status: 'signed_off',
    createdBy: 'nexus',
    content: [
      `# Charter — ${MOVE_NAME}`,
      `> ${SYNTH}`,
      '',
      '## Scope',
      '- Rising-risk stratification, care-gap orchestration, post-discharge follow-up, and plan STAR measure capture.',
      '- Spans the provider and Meridian Health Plans; sponsored by the Chief Population Health Officer.',
      '',
      '## Decision rights',
      '- AI Governance Council gates clinical models; CFO approves business case over $5M.',
      '',
      '## Value hypothesis',
      `- $38M–$61M per year from avoidable admissions, care-gap closure, and quality-bonus realization.`,
      '',
      '## Evidence basis',
      '- plan-provider-analytics.csv, value-based-care-panel.csv, population-health-risk-panels.csv.',
    ].join('\n'),
    structuredData: { evidence_files: ['plan-provider-analytics.csv', 'value-based-care-panel.csv'] },
  },
  {
    typeKey: 'discovery_report',
    title: 'P2 Discovery Brief — Baseline & Diagnosis',
    phase: 2,
    status: 'signed_off',
    createdBy: 'nexus',
    content: [
      '# Discovery Brief',
      `> ${SYNTH}`,
      '',
      '## What the loaded baseline shows',
      '- Diabetes A1c control 68% vs 75% benchmark; AWV rate 58% vs 70%.',
      '- Risk-adjustment capture 88% vs 94% suspected; commercial network leakage 19%.',
      '- Data readiness: Epic Healthy Planet + Azure Databricks lakehouse; Unity Catalog governance is Wave 1.',
      '',
      '## Where AI realistically moves the metric',
      '- Rising-risk targeting, care-gap orchestration, RAF suspecting (NLP), post-discharge follow-up.',
      '',
      '## Evidence basis',
      '- plan-provider-analytics.csv, kpi-library.csv, clinical-ai-model-inventory.csv.',
    ].join('\n'),
    structuredData: { evidence_files: ['plan-provider-analytics.csv', 'kpi-library.csv'] },
  },
  {
    typeKey: 'target_state_architecture',
    title: 'P3 Target-State Architecture — Lakehouse & Models',
    phase: 3,
    status: 'signed_off',
    createdBy: 'maestro',
    content: [
      '# Target-State Architecture',
      `> ${SYNTH}`,
      '',
      '## Lakehouse (Azure Databricks)',
      '- Epic Clarity + Tapestry claims -> bronze -> conformed silver -> population-health gold.',
      '- Unity Catalog PHI masking + ABAC (Wave 1); lineage via UC system tables.',
      '',
      '## Model portfolio',
      '- Rising-risk, post-discharge readmission, care-gap propensity, RAF suspecting (NLP).',
      '- Feature Store + MLflow + UC models; Lakehouse Monitoring in Wave 4.',
      '',
      '## Governance gate',
      '- AI Governance Council clinical-safety review before any limited rollout.',
      '',
      '## Evidence basis',
      '- databricks-lakehouse-target-model.csv, clinical-data-contracts.csv, hipaa-ai-controls.csv.',
    ].join('\n'),
    structuredData: { evidence_files: ['databricks-lakehouse-target-model.csv', 'clinical-data-contracts.csv'] },
  },
  {
    typeKey: 'business_case',
    title: 'P4 Costed Business Case & Value Model',
    phase: 4,
    status: 'in_review',
    createdBy: 'maestro',
    content: [
      '# Costed Business Case',
      `> ${SYNTH}`,
      '',
      '## Recommendation',
      '- Fund the command center as one governed Move; CFO approval at the P4 funding gate.',
      '',
      '## Value at stake (synthetic estimate)',
      '- Avoidable admissions: $12M–$19M; care-gap closure: $8M–$13M; quality bonus: $9M–$14M;',
      '  risk-adjustment accuracy: $5M–$9M; post-acute/readmission: $4M–$6M.',
      `- Total: $38M–$61M per year.`,
      '',
      '## Assumptions',
      '- Ranges are synthetic planning estimates pending CFO validation and sensitivity analysis.',
      '',
      '## Evidence basis',
      '- service-line-pnl.csv, plan-provider-analytics.csv, ams-vendor-contracts.csv.',
    ].join('\n'),
    structuredData: {
      value_low_usd: VALUE_LOW,
      value_high_usd: VALUE_HIGH,
      evidence_files: ['service-line-pnl.csv', 'plan-provider-analytics.csv'],
    },
  },
  {
    typeKey: 'handoff_package',
    title: 'P5 Mobilization Plan & RACI',
    phase: 5,
    status: 'draft',
    createdBy: 'nexus',
    content: [
      '# Mobilization Plan & RACI',
      `> ${SYNTH}`,
      '',
      '## Mobilization waves',
      '- W1 governance + data foundation; W2 conformed analytics; W3 gold + models in shadow;',
      '  W4 monitoring + FHIR write-back; then handoff to Control Tower.',
      '',
      '## RACI (summary)',
      '- Charter sign-off: R CPHO / A Transformation Office / C CFO, Plan COO / I AI Governance.',
      '- Clinical model validation: R AI Governance Chair / A CMIO / C CMO / I CISO.',
      '- Value realization (post-handoff): R Control Tower / A CPHO / C CDAO, Plan COO / I CFO.',
      '',
      '## Evidence basis',
      '- org-structure-decision-rights.csv, care-management-staffing.csv.',
    ].join('\n'),
    structuredData: { evidence_files: ['org-structure-decision-rights.csv', 'care-management-staffing.csv'] },
  },
  {
    typeKey: 'value_measurement_contract',
    title: 'P5 Value-Measurement Contract (Tower handoff)',
    phase: 5,
    status: 'draft',
    createdBy: 'nexus',
    content: [
      '# Value-Measurement Contract',
      `> ${SYNTH}`,
      '',
      '## What Control Tower will own after handoff',
      '- Monthly care-gap closure, avoidable admissions, STAR measure capture, and MLR.',
      '- Model monitoring (drift, calibration) and clinical-safety incident review.',
      '',
      '## Evidence basis',
      '- kpi-library.csv, value-based-care-panel.csv, governance-committee-decisions.csv.',
    ].join('\n'),
    structuredData: { evidence_files: ['kpi-library.csv', 'value-based-care-panel.csv'] },
  },
];

const MODULES: ModuleSeed[] = [
  { key: 'p1_charter', name: 'Charter', phase: 1, status: 'completed', deliverableKey: 'charter' },
  { key: 'p2_discovery', name: 'Discover & Diagnose', phase: 2, status: 'completed', deliverableKey: 'discovery_report' },
  { key: 'p3_architecture', name: 'Design Future State', phase: 3, status: 'completed', deliverableKey: 'target_state_architecture' },
  { key: 'p4_business_case', name: 'Roadmap & Business Case', phase: 4, status: 'in_progress', deliverableKey: 'business_case' },
  { key: 'p5_mobilize', name: 'Mobilize & Handoff', phase: 5, status: 'in_progress', deliverableKey: 'handoff_package' },
];

const RISKS: RiskSeed[] = [
  {
    title: 'Unity Catalog PHI governance not stood up before model build',
    phase: 3,
    likelihood: 'medium',
    impact: 'high',
    status: 'mitigating',
    mitigationPlan: 'Sequence UC masking/ABAC as a hard Wave-1 gate before any gold/model work.',
  },
  {
    title: 'Clinical model used in production without safety sign-off',
    phase: 4,
    likelihood: 'low',
    impact: 'high',
    status: 'open',
    mitigationPlan: 'AI Governance Council clinical-safety gate blocks rollout until validation is current.',
  },
  {
    title: 'Value double-counted across provider and plan',
    phase: 4,
    likelihood: 'medium',
    impact: 'medium',
    status: 'mitigating',
    mitigationPlan: 'Tag KPIs as provider/plan/shared in the value model; reconcile in the business case.',
  },
];

function parseMode(): ApplyMode {
  return process.argv.slice(2).includes('--apply') ? 'apply' : 'dry-run';
}

function validateSeed(): void {
  const phases = new Set(DELIVERABLES.map((d) => d.phase));
  for (const p of [1, 2, 3, 4, 5]) {
    if (!phases.has(p)) throw new Error(`missing deliverable for phase ${p}`);
  }
  for (const d of DELIVERABLES) {
    if (!d.content || d.content.length < 80) throw new Error(`thin content: ${d.title}`);
    if (!/Evidence basis/.test(d.content)) throw new Error(`no evidence basis: ${d.title}`);
  }
  if (VALUE_LOW >= VALUE_HIGH) throw new Error('value range invalid');
}

function printPlan(): void {
  console.log(`Hero Move: ${MOVE_NAME}`);
  console.log(`Tenant: ${TENANT_KEY} (resolve client by name: ${MERIDIAN_NAMES.join(' / ')})`);
  console.log(`Graph node: ${GRAPH_NODE_ID}`);
  console.log(`Current phase: P${CURRENT_PHASE} (Mobilize & Handoff)`);
  console.log(`Value at stake: $${VALUE_LOW / 1e6}M–$${VALUE_HIGH / 1e6}M / yr (synthetic)`);
  console.log(`Sponsor: ${PEOPLE[0].name} (${PEOPLE[0].role})`);
  console.log('');
  console.log('Deliverables (one per phase):');
  for (const d of DELIVERABLES) {
    console.log(`  - P${d.phase} · ${d.typeKey} · ${d.status} · ${d.title}`);
  }
  console.log(`Modules: ${MODULES.length} · Risks: ${RISKS.length} · Participants: ${PEOPLE.length}`);
  console.log('');
  console.log('Linked downloadable artifacts (generated separately):');
  console.log('  docs/build/meridian-phs-demo/wow-demo/artifacts/{executive-memo.docx,');
  console.log('  board-brief.pdf, value-model.xlsx, architecture-pack.html,');
  console.log('  raci-mobilization-plan.xlsx, evidence-appendix.md}');
}

async function applyToDb(): Promise<void> {
  // Imported lazily so dry-run requires neither the dependency nor env/DB.
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'apply requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Azure data-plane).',
    );
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Resolve the Meridian client (tenant hard wall on client_id).
  let clientId: string | null = null;
  for (const name of MERIDIAN_NAMES) {
    const { data } = await sb.from('clients').select('id, name').ilike('name', name).maybeSingle();
    if (data?.id) {
      clientId = data.id as string;
      break;
    }
  }
  if (!clientId) throw new Error('Meridian client row not found; seed clients first.');
  console.log(`apply · Meridian client ${clientId}`);

  // 2. Upsert sponsor person (minimal).
  const sponsor = PEOPLE[0];
  let sponsorId: string | null = null;
  {
    const { data: existing } = await sb
      .from('persons')
      .select('id')
      .eq('graph_node_id', sponsor.graph_node_id)
      .maybeSingle();
    if (existing?.id) {
      sponsorId = existing.id as string;
    } else {
      const { data: inserted, error } = await sb
        .from('persons')
        .insert({
          graph_node_id: sponsor.graph_node_id,
          client_id: clientId,
          full_name: sponsor.name,
          email: sponsor.email,
          role_title: sponsor.role,
        })
        .select('id')
        .single();
      if (error) throw error;
      sponsorId = (inserted as { id: string }).id;
    }
  }

  // 3. Upsert the engagement (Move).
  const engagementPayload = {
    graph_node_id: GRAPH_NODE_ID,
    client_id: clientId,
    name: MOVE_NAME,
    industry_code: 'HEALTHCARE_IDN',
    function_code: 'CLINICAL_OPERATIONS',
    objective_code: 'POPULATION_HEALTH_AND_VALUE',
    topic_code: 'population_health_command_center',
    sponsor_person_id: sponsorId,
    problem_statement:
      'Care-gap closure, avoidable utilization, and STAR/HEDIS pressure span provider and plan but are managed in silos.',
    target_outcome:
      'A governed command center that prioritizes rising-risk cohorts and routes interventions across provider and plan.',
    timeline_horizon: 'P4 funding gate at CFO review; P5 mobilization then Control Tower handoff.',
    value_projected_low_usd: VALUE_LOW,
    value_projected_high_usd: VALUE_HIGH,
    value_currency: 'USD',
    value_verified_status: 'pending',
    value_assumptions_jsonb: {
      seed_key: SEED_KEY,
      basis: 'Synthetic avoidable-cost, care-gap, and quality-bonus model',
      caveat: SYNTH,
    },
    program_archetype: 'ai_product_enablement',
    origin_source: 'intelligence_promoted',
    status: 'active',
    lifecycle_state: 'approved',
    current_phase: CURRENT_PHASE,
    maestro_oversight_level: 'full',
    founder_approval_required: true,
    charter: { seed_key: SEED_KEY },
  };

  const { data: existingEng } = await sb
    .from('engagements')
    .select('id')
    .eq('client_id', clientId)
    .eq('name', MOVE_NAME)
    .maybeSingle();

  let engagementId: string;
  if (existingEng?.id) {
    engagementId = existingEng.id as string;
    const { error } = await sb.from('engagements').update(engagementPayload).eq('id', engagementId);
    if (error) throw error;
    console.log(`apply · updated engagement ${engagementId}`);
  } else {
    const { data: inserted, error } = await sb
      .from('engagements')
      .insert(engagementPayload)
      .select('id')
      .single();
    if (error) throw error;
    engagementId = (inserted as { id: string }).id;
    console.log(`apply · created engagement ${engagementId}`);
  }

  // 4. Deliverables + versions.
  for (const d of DELIVERABLES) {
    const { data: existing } = await sb
      .from('deliverables_v2')
      .select('id')
      .eq('engagement_id', engagementId)
      .eq('deliverable_type_key', d.typeKey)
      .eq('title', d.title)
      .limit(1);
    let deliverableId = (existing as Array<{ id: string }> | null)?.[0]?.id;
    const payload = {
      engagement_id: engagementId,
      deliverable_type_key: d.typeKey,
      title: d.title,
      status: d.status,
      current_version: 1,
      created_by: d.createdBy,
    };
    if (deliverableId) {
      const { error } = await sb.from('deliverables_v2').update(payload).eq('id', deliverableId);
      if (error) throw error;
    } else {
      const { data: ins, error } = await sb
        .from('deliverables_v2')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      deliverableId = (ins as { id: string }).id;
    }
    const { error: versionError } = await sb.from('deliverable_versions').upsert(
      {
        deliverable_id: deliverableId,
        version: 1,
        content: d.content,
        structured_data: { seed_key: SEED_KEY, phase: d.phase, ...d.structuredData },
        generated_from_context_hash: SEED_KEY,
      },
      { onConflict: 'deliverable_id,version' },
    );
    if (versionError) throw versionError;
    console.log(`apply · deliverable ${d.title}`);
  }

  console.log('apply · done. Open at /strategic-moves and the Documents tab.');
}

async function main(): Promise<void> {
  const mode = parseMode();
  validateSeed();
  console.log('Meridian hero Strategic Move seed');
  console.log(`mode: ${mode}`);
  if (mode === 'dry-run') {
    console.log('No writes. Re-run with --apply (inside the Azure VNet) to mutate the DB.');
    console.log('');
    printPlan();
    return;
  }
  await applyToDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

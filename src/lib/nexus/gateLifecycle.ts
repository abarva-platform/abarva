// Phase gate lifecycle handler. When the orchestrator emits a
// gate_approval signal (typically after a sponsor confirms Phase 0),
// this module:
//   1. Triggers charter deliverable generation asynchronously
//   2. Advances the engagement's current_phase
//   3. Records the transition in module_state_log for audit
//   4. Returns a Phase 1 opening prompt that the UI can auto-invoke
//
// Separated from the orchestrator so the route layer can decide when to
// act on the signal (auto-advance in the creation flow vs. deliberate
// approval in the program console).

import { getServerSupabase } from '@/lib/supabase-server';
import type { GateSignal } from './orchestrator';

export interface GateLifecycleInput {
  signal: GateSignal;
  engagementId: string;
  actorUserId: string;
}

export interface GateLifecycleOutput {
  applied: boolean;
  fromPhase: number | null;
  toPhase: number | null;
  phase1Prompt?: string;
  deliverableId?: string;
}

export const PHASE_OPENERS: Record<number, string> = {
  1: "Now that we have the charter locked, let's start the diagnostic. What category, region, or decision type would give the business the fastest felt result? Aim for a first-win scope we can pressure-test in 2-3 weeks.",
  2: "Diagnostic is approved. Time to design. Let's put the solution shape on paper — architecture sketch, vendor shortlist with tradeoffs, and the one decision we can't punt past this phase.",
  3: "Design's signed off. Execute phase starts now. Break this into work items, name owners, and lock the first milestone. What's the 30-day target?",
  4: "Execute is complete. Outcome verification phase — baseline vs actual, attested savings, and what we'd do differently. Who's the attestor, and what's their bar?",
};

export function phaseOpenerFor(phase: number): string | null {
  return PHASE_OPENERS[phase] ?? null;
}

type PhaseEntryContext = {
  engagement: {
    id: string;
    name: string;
    industry_code: string | null;
    function_code: string | null;
    objective_code: string | null;
  };
  sponsor: { name: string; role: string } | null;
  coSponsor: { name: string; role: string } | null;
};

type PhaseEntryDeliverableSpec = {
  typeKey: string;
  title: string;
  description: string;
  applicablePhases: number[];
  buildStructuredContent: (ctx: PhaseEntryContext) => Record<string, unknown>;
  buildMarkdown: (ctx: PhaseEntryContext) => string;
};

async function loadPhaseEntryContext(engagementId: string): Promise<PhaseEntryContext> {
  const sb = getServerSupabase();
  const { data: engagement } = await sb
    .from('engagements')
    .select('id, name, industry_code, function_code, objective_code, sponsor_person_id, co_sponsor_person_id')
    .eq('id', engagementId)
    .maybeSingle();

  const row = (engagement as {
    id: string;
    name: string;
    industry_code: string | null;
    function_code: string | null;
    objective_code: string | null;
    sponsor_person_id: string | null;
    co_sponsor_person_id: string | null;
  } | null);
  if (!row) throw new Error(`engagement not found: ${engagementId}`);

  const personIds = [row.sponsor_person_id, row.co_sponsor_person_id].filter((value): value is string => Boolean(value));
  let peopleById = new Map<string, { name: string; role: string }>();
  if (personIds.length > 0) {
    const { data: people } = await sb
      .from('persons')
      .select('id, name, role')
      .in('id', personIds);
    peopleById = new Map(
      ((people as Array<{ id: string; name: string; role: string }> | null) ?? []).map((person) => [
        person.id,
        { name: person.name, role: person.role },
      ]),
    );
  }

  return {
    engagement: {
      id: row.id,
      name: row.name,
      industry_code: row.industry_code,
      function_code: row.function_code,
      objective_code: row.objective_code,
    },
    sponsor: row.sponsor_person_id ? peopleById.get(row.sponsor_person_id) ?? null : null,
    coSponsor: row.co_sponsor_person_id ? peopleById.get(row.co_sponsor_person_id) ?? null : null,
  };
}

async function ensureDeliverableTypeExists(spec: PhaseEntryDeliverableSpec): Promise<void> {
  const sb = getServerSupabase();
  const { data: existing } = await sb
    .from('deliverable_types')
    .select('type_key')
    .eq('type_key', spec.typeKey)
    .maybeSingle();

  if (existing) return;

  const { error } = await sb.from('deliverable_types').insert({
    type_key: spec.typeKey,
    title: spec.title,
    description: spec.description,
    applicable_phases: spec.applicablePhases,
    applicable_topics: [],
    template_structure: {},
    required_data_inputs: {},
    quality_rubric: {},
    generation_prompt_template: '',
    output_format: 'markdown',
    maturity: 'pilot',
  });
  if (error) throw error;
}

async function ensurePhaseEntryDeliverable(args: {
  engagementId: string;
  spec: PhaseEntryDeliverableSpec;
  ctx: PhaseEntryContext;
  phaseTransition: string;
}): Promise<string> {
  const sb = getServerSupabase();
  await ensureDeliverableTypeExists(args.spec);

  const { data: existing } = await sb
    .from('deliverables_v2')
    .select('id')
    .eq('engagement_id', args.engagementId)
    .eq('deliverable_type_key', args.spec.typeKey)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: created, error: createErr } = await sb
    .from('deliverables_v2')
    .insert({
      engagement_id: args.engagementId,
      deliverable_type_key: args.spec.typeKey,
      title: args.spec.title,
      status: 'draft',
      current_version: 1,
      created_by: 'nexus',
    })
    .select('id')
    .single();
  if (createErr) throw createErr;

  const deliverableId = (created as { id: string }).id;
  const structuredContent = args.spec.buildStructuredContent(args.ctx);
  const { error: versionErr } = await sb.from('deliverable_versions').insert({
    deliverable_id: deliverableId,
    version: 1,
    content: args.spec.buildMarkdown(args.ctx),
    structured_data: {
      content: structuredContent,
      seeded_from_gate_approval: true,
      phase_transition: args.phaseTransition,
    },
  });
  if (versionErr) throw versionErr;

  return deliverableId;
}

const PHASE1_ENTRY_DELIVERABLES: PhaseEntryDeliverableSpec[] = [
  {
    typeKey: 'charter',
    title: 'Program Charter',
    description: 'Auto-generated charter from Phase 0 intake',
    applicablePhases: [0, 1],
    buildStructuredContent: (ctx) => ({
      program_name: ctx.engagement.name,
      objective: ctx.engagement.objective_code,
      function: ctx.engagement.function_code,
      sponsor: ctx.sponsor,
      co_sponsors: ctx.coSponsor ? [ctx.coSponsor] : [],
      business_context: {
        forcing_event: `Phase 0 gate passed for ${ctx.engagement.name}; sponsor confirmed the program should move into diagnostic work.`,
        business_pain: `Initial intake framed a ${ctx.engagement.objective_code ?? 'priority'} problem in ${ctx.engagement.industry_code ?? 'the client context'}.`,
        sponsor_pressure: ctx.sponsor
          ? `${ctx.sponsor.name} is now on point for the next-phase diagnostic decision set.`
          : 'Sponsor pressure captured during intake; named sponsor metadata still needs confirmation.',
      },
      phase_1_entry_commitments: {
        diagnostic_workstreams: [
          'Clarify the first-win scope for the diagnostic',
          'Confirm data access and stakeholder interview sequencing',
          'Translate the intake problem into falsifiable hypotheses',
        ],
        first_milestone: 'Week 1 diagnostic framing and access plan locked.',
      },
    }),
    buildMarkdown: (ctx) => `# Program Charter

## Program Name
${ctx.engagement.name}

## Sponsor
${ctx.sponsor ? `${ctx.sponsor.name} · ${ctx.sponsor.role}` : 'Sponsor metadata still being confirmed'}

## Business Context
Phase 0 gate passed and the program is moving into diagnostic work. The intake currently frames this as a ${ctx.engagement.objective_code ?? 'priority'} problem in ${ctx.engagement.industry_code ?? 'the client context'}.

## Phase 1 Entry Commitments
- Clarify the first-win scope for the diagnostic
- Confirm data access and stakeholder interview sequencing
- Translate the intake problem into falsifiable hypotheses`,
  },
  {
    typeKey: 'stakeholder_map',
    title: 'Stakeholder Map',
    description: 'Auto-generated stakeholder map from Phase 0 intake',
    applicablePhases: [0, 1],
    buildStructuredContent: (ctx) => ({
      stakeholders: [
        ctx.sponsor
          ? {
              ...ctx.sponsor,
              relationship_to_program: 'sponsor',
              commitment_status: 'committed',
              what_we_need: 'Confirm scope, escalation path, and Phase 1 diagnostic framing.',
              timing: 'Immediate',
            }
          : {
              name: 'Sponsor to confirm',
              role: 'Pending',
              relationship_to_program: 'sponsor',
              commitment_status: 'aware',
              what_we_need: 'Confirm named executive sponsor and decision rights.',
              timing: 'Immediate',
            },
        ...(ctx.coSponsor
          ? [
              {
                ...ctx.coSponsor,
                relationship_to_program: 'co_sponsor',
                commitment_status: 'engaged',
                what_we_need: 'Validate cross-functional support and unlock additional stakeholders as needed.',
                timing: 'Week 1',
              },
            ]
          : []),
      ],
      org_graph_view: {
        influence_network: [
          'Sponsor alignment should stay visible through the first diagnostic milestone.',
          'Co-sponsor support is needed wherever data access or organizational buy-in crosses functions.',
        ],
      },
    }),
    buildMarkdown: (ctx) => `# Stakeholder Map

## Named Stakeholders
- ${ctx.sponsor ? `${ctx.sponsor.name} · ${ctx.sponsor.role} · sponsor` : 'Sponsor to confirm'}
${ctx.coSponsor ? `- ${ctx.coSponsor.name} · ${ctx.coSponsor.role} · co-sponsor` : ''}

## Immediate Engagement Strategy
- Lock sponsor alignment on the first diagnostic milestone
- Confirm where co-sponsor air cover is needed for data access and stakeholder interviews
- Expand the roster as Phase 1 identifies domain experts and data owners`,
  },
  {
    typeKey: 'risk_register',
    title: 'Risk Register',
    description: 'Auto-generated initial risk register from Phase 0 intake',
    applicablePhases: [0, 1, 2, 3, 4],
    buildStructuredContent: (ctx) => ({
      risks: [
        {
          id: 'risk_001',
          category: 'stakeholder',
          description: 'Sponsor alignment softens after gate approval and Phase 1 loses decision speed.',
          likelihood: 'medium',
          impact: 'high',
          mitigation_strategy: 'Keep a visible Week 1 milestone and review it directly with the sponsor.',
          owner: ctx.sponsor?.name ?? 'Program sponsor',
          status: 'active',
        },
        {
          id: 'risk_002',
          category: 'data',
          description: 'Data access takes longer than expected once the team starts converting the intake into real requests.',
          likelihood: 'high',
          impact: 'high',
          mitigation_strategy: 'Translate access needs into named requests quickly and route them through the strongest executive sponsor.',
          owner: ctx.coSponsor?.name ?? ctx.sponsor?.name ?? 'Program lead',
          status: 'active',
        },
        {
          id: 'risk_003',
          category: 'scope',
          description: 'The diagnostic expands beyond a first-win scope before the team has evidence.',
          likelihood: 'medium',
          impact: 'medium',
          mitigation_strategy: 'Use the Phase 1 opener to force a narrow first-win scope and defer broad redesign questions.',
          owner: 'Nexus / Maestro',
          status: 'active',
        },
      ],
    }),
    buildMarkdown: () => `# Risk Register

## Active Risks
- Sponsor alignment slips after the gate and slows decisions
- Data access takes longer than expected once Phase 1 requests are named
- Diagnostic scope expands before the team has evidence

## Immediate Mitigation
- Keep a visible Week 1 milestone
- Route early data requests through the strongest executive sponsor
- Force a narrow first-win scope before broadening the diagnostic`,
  },
];

export async function applyGateSignal(input: GateLifecycleInput): Promise<GateLifecycleOutput> {
  const { signal, engagementId, actorUserId } = input;
  if (signal.type !== 'gate_approval' && signal.type !== 'phase_transition') {
    return { applied: false, fromPhase: null, toPhase: null };
  }

  const sb = getServerSupabase();

  // Determine from/to phases · prefer payload, fall back to current_phase + 1
  let fromPhase = signal.fromPhase ?? null;
  let toPhase = signal.toPhase ?? null;
  if (fromPhase === null || toPhase === null) {
    const { data: engagement } = await sb
      .from('engagements')
      .select('current_phase')
      .eq('id', engagementId)
      .maybeSingle();
    const currentPhase = (engagement as { current_phase: number | null } | null)?.current_phase ?? 0;
    fromPhase = fromPhase ?? currentPhase;
    toPhase = toPhase ?? currentPhase + 1;
  }

  // Advance current_phase
  const { error: upErr } = await sb
    .from('engagements')
    .update({ current_phase: toPhase, updated_at: new Date().toISOString() })
    .eq('id', engagementId);
  if (upErr) throw upErr;

  // Record transition
  await sb.from('module_state_log').insert({
    engagement_id: engagementId,
    module_key: `phase_${fromPhase}_gate`,
    previous_state: 'pending_gate',
    new_state: 'completed',
    changed_by_user_id: actorUserId,
    notes: `Gate approval · advance phase ${fromPhase} → ${toPhase}`,
    context_jsonb: { signal_type: signal.type, payload: signal.payload ?? {} },
  });

  // Trigger charter deliverable generation when entering Phase 1.
  // Create the first three Phase 0/1 artifacts without overwriting any
  // richer deliverable type specs that may already be seeded.
  let deliverableId: string | undefined;
  if (toPhase === 1) {
    const ctx = await loadPhaseEntryContext(engagementId);
    const created = await Promise.all(
      PHASE1_ENTRY_DELIVERABLES.map(async (spec) => ({
        typeKey: spec.typeKey,
        id: await ensurePhaseEntryDeliverable({
          engagementId,
          spec,
          ctx,
          phaseTransition: `${fromPhase}→${toPhase}`,
        }),
      })),
    );
    deliverableId = created.find((item) => item.typeKey === 'charter')?.id;
  }

  const phase1Prompt = PHASE_OPENERS[toPhase];

  return {
    applied: true,
    fromPhase,
    toPhase,
    phase1Prompt,
    deliverableId,
  };
}

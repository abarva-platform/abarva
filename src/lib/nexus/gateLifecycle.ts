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
import { bindMoveFunctionPack } from '@/lib/programs/move-function-binding';
import { buildMoveBusinessCase } from '@/lib/programs/move-business-case';
import type { FunctionPackBinding } from '@/lib/programs/expert-kernel/domain/function-pack-context-binding';
import type { MovesPhaseArtifact } from '@/lib/programs/expert-kernel/domain/function-pack-types';

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

export type PhaseEntryContext = {
  engagement: {
    id: string;
    name: string;
    industry_code: string | null;
    function_code: string | null;
    objective_code: string | null;
  };
  sponsor: { name: string; role: string } | null;
  coSponsor: { name: string; role: string } | null;
  /**
   * The curated Domain Function Pack binding for each Moves-phase artifact,
   * resolved once from the Move's `(industryKey, functionKey)` identity. A
   * deliverable spec maps itself to one artifact and inherits its outline +
   * seed gaps. When the Move resolves no pack, every binding is the honest
   * unbound result (`bound: false`, with a `fallbackNote`).
   */
  packBindings: Record<MovesPhaseArtifact, FunctionPackBinding>;
  /**
   * The expert-kernel business case for this real Move, when a curated pack
   * binds. `null` when the Move binds no pack — the value-oriented specs then
   * fall back to the honest "no curated Function Pack" note.
   */
  businessCase: ReturnType<typeof buildMoveBusinessCase> | null;
};

type PhaseEntryDeliverableSpec = {
  typeKey: string;
  title: string;
  description: string;
  applicablePhases: number[];
  /**
   * The Moves-phase artifact this deliverable inherits curated structure from.
   * Phase-1-entry charter / stakeholder / risk deliverables all bind the
   * Discover-phase artifact (`discover_brief`); a value/business-case
   * deliverable binds `business_case`.
   */
  packArtifact: MovesPhaseArtifact;
  buildStructuredContent: (ctx: PhaseEntryContext) => Record<string, unknown>;
  buildMarkdown: (ctx: PhaseEntryContext) => string;
};

/** The four Moves-phase artifacts, used to pre-resolve every pack binding. */
const MOVES_PHASE_ARTIFACTS: readonly MovesPhaseArtifact[] = [
  'discover_brief',
  'business_case',
  'solution_architecture',
  'mobilization_plan',
];

/** The minimal Move slice the pack-binding portion of the context needs. */
export interface MovePackContextInput {
  industry_code?: string | null;
  name?: string | null;
  charter?: unknown;
  baseline_metrics?: unknown;
}

/** The pack-derived portion of a `PhaseEntryContext`. */
export interface MovePackContext {
  packBindings: Record<MovesPhaseArtifact, FunctionPackBinding>;
  businessCase: ReturnType<typeof buildMoveBusinessCase> | null;
}

/**
 * Resolve the Move's curated Domain Function Pack for every Moves-phase
 * artifact, and run the expert kernel when a pack binds. Pure and
 * deterministic — no I/O — so the phase-entry deliverable generation can be
 * exercised against any Move slice without a database. When the Move resolves
 * no pack (no industry key or no `charter.functionPackKey`), every binding is
 * the honest unbound result and `businessCase` is `null`.
 */
export function resolveMovePackContext(
  move: MovePackContextInput,
): MovePackContext {
  const baselineMetrics = Array.isArray(move.baseline_metrics)
    ? move.baseline_metrics
    : undefined;
  const moveSlice = {
    industry_code: move.industry_code ?? null,
    charter: move.charter,
    baseline_metrics: baselineMetrics,
  };
  const packBindings = MOVES_PHASE_ARTIFACTS.reduce(
    (acc, artifact) => {
      acc[artifact] = bindMoveFunctionPack(moveSlice, artifact);
      return acc;
    },
    {} as Record<MovesPhaseArtifact, FunctionPackBinding>,
  );

  // The expert kernel runs only when a curated pack actually binds — its own
  // honesty discipline produces a `bound: false` result for an uncatalogued
  // Move, which the value-oriented spec treats as an honest fallback.
  let businessCase: ReturnType<typeof buildMoveBusinessCase> | null = null;
  if (packBindings.business_case.bound) {
    businessCase = buildMoveBusinessCase({
      industry_code: move.industry_code,
      name: move.name,
      charter: move.charter,
      baseline_metrics: baselineMetrics,
    });
  }

  return { packBindings, businessCase };
}

async function loadPhaseEntryContext(engagementId: string): Promise<PhaseEntryContext> {
  const sb = getServerSupabase();
  const { data: engagement } = await sb
    .from('engagements')
    .select(
      'id, name, industry_code, function_code, objective_code, charter, baseline_metrics, sponsor_person_id, co_sponsor_person_id',
    )
    .eq('id', engagementId)
    .maybeSingle();

  const row = (engagement as {
    id: string;
    name: string;
    industry_code: string | null;
    function_code: string | null;
    objective_code: string | null;
    charter: unknown;
    baseline_metrics: unknown;
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

  // Resolve the Move's curated Domain Function Pack for every Moves-phase
  // artifact, and run the expert kernel when a pack binds. When the Move
  // resolves no pack — no industry key or no `charter.functionPackKey` —
  // every binding is the honest unbound result and the deliverables fall
  // back to the current template behaviour.
  const { packBindings, businessCase } = resolveMovePackContext({
    industry_code: row.industry_code,
    name: row.name,
    charter: row.charter,
    baseline_metrics: row.baseline_metrics,
  });

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
    packBindings,
    businessCase,
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

// ─────────────────────────────────────────────────────────────────────────────
// Pack-bound deliverable content
//
// When a Move resolves to a curated Domain Function Pack, a phase-entry
// deliverable inherits the pack's curated `deliverableOutline` (section
// headings + real guidance) as its structure, and surfaces the pack's precise
// `seedGaps` as an honest "what we still need" section — instead of the static
// interpolated prose. When no pack binds, the caller falls back to the
// current template behaviour. These helpers NEVER fabricate curated depth.
// ─────────────────────────────────────────────────────────────────────────────

/** The pack binding for a spec's artifact — `undefined` keeps a spec defensive. */
function bindingFor(
  ctx: PhaseEntryContext,
  artifact: MovesPhaseArtifact,
): FunctionPackBinding | undefined {
  return ctx.packBindings[artifact];
}

/**
 * The structured "what we still need" block — the pack's precise seed gaps,
 * each carrying the metric name, what it is, where it is sourced, and what its
 * absence blocks. An honest, named gap list, never fabricated depth.
 */
function seedGapBlock(
  binding: FunctionPackBinding,
): Array<Record<string, unknown>> {
  return binding.seedGaps.map((gap) => ({
    metric_key: gap.metricKey,
    metric_name: gap.metricName,
    definition: gap.definition,
    expected_data_source: gap.expectedDataSource,
    why_it_matters: gap.gapStatement,
  }));
}

/**
 * The pack-bound structured content for a phase-entry deliverable — the
 * inherited curated outline plus the honest seed-gap list. `base` carries the
 * spec's own intake-derived fields (sponsor, program name, …) so the inherited
 * structure augments rather than discards them.
 */
function packBoundStructuredContent(
  ctx: PhaseEntryContext,
  artifact: MovesPhaseArtifact,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const binding = bindingFor(ctx, artifact);
  if (!binding || !binding.bound) {
    return {
      ...base,
      function_pack: {
        bound: false,
        note:
          binding?.fallbackNote ??
          'No curated Domain Function Pack covers this Move\'s function yet — ' +
            'this deliverable uses the general intake template, surfaced ' +
            'honestly, not fabricated curated depth.',
      },
    };
  }
  return {
    ...base,
    function_pack: {
      bound: true,
      function_label: binding.functionLabel ?? null,
      artifact_label: binding.artifactLabel ?? null,
      phase: binding.phase ?? null,
    },
    // The inherited curated outline — section headings + real guidance — is
    // this deliverable's real structure, not improvised prose.
    inherited_outline: binding.deliverableOutline.map((section) => ({
      heading: section.heading,
      guidance: section.guidance,
    })),
    // The precise, named seed gaps — what the tenant still needs to record.
    what_we_still_need: seedGapBlock(binding),
  };
}

/**
 * The pack-bound markdown for a phase-entry deliverable — a real table of
 * contents inherited from the curated pack, plus an honest seed-gap section.
 * `title` is the document heading; `intro` is the spec's own intake-derived
 * lead paragraph, kept so the inherited structure augments the template.
 */
function packBoundMarkdown(
  ctx: PhaseEntryContext,
  artifact: MovesPhaseArtifact,
  title: string,
  intro: string,
): string | null {
  const binding = bindingFor(ctx, artifact);
  if (!binding || !binding.bound) return null;

  const lines: string[] = [`# ${title}`, ''];
  if (binding.functionLabel) {
    lines.push(
      `_Curated structure inherited from the **${binding.functionLabel}** ` +
        'Domain Function Pack._',
      '',
    );
  }
  lines.push(intro, '');

  for (const section of binding.deliverableOutline) {
    lines.push(`## ${section.heading}`, section.guidance, '');
  }

  lines.push('## What We Still Need');
  if (binding.seedGaps.length === 0) {
    lines.push(
      'Every operating metric this function expects is already recorded for ' +
        'this Move — no seed gaps.',
    );
  } else {
    lines.push(
      'The curated pack expects these operating metrics; this Move does not ' +
        'yet record them. Each is a precise, named seed gap — not a ' +
        'fabricated value.',
      '',
    );
    for (const gap of binding.seedGaps) {
      lines.push(
        `- **${gap.metricName}** — ${gap.definition} ` +
          `Expected source: ${gap.expectedDataSource}.`,
      );
    }
  }
  return lines.join('\n');
}

// ── Charter — fallback builders (used when no curated pack binds) ────────────

function charterStructuredFallback(ctx: PhaseEntryContext): Record<string, unknown> {
  return {
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
  };
}

function charterMarkdownFallback(ctx: PhaseEntryContext): string {
  return `# Program Charter

## Program Name
${ctx.engagement.name}

## Sponsor
${ctx.sponsor ? `${ctx.sponsor.name} · ${ctx.sponsor.role}` : 'Sponsor metadata still being confirmed'}

## Business Context
Phase 0 gate passed and the program is moving into diagnostic work. The intake currently frames this as a ${ctx.engagement.objective_code ?? 'priority'} problem in ${ctx.engagement.industry_code ?? 'the client context'}.

## Phase 1 Entry Commitments
- Clarify the first-win scope for the diagnostic
- Confirm data access and stakeholder interview sequencing
- Translate the intake problem into falsifiable hypotheses`;
}

/**
 * The kernel-derived value framing for the charter, when a curated pack binds
 * and the expert kernel ran. It surfaces the compiled business case's
 * recommendation and the derivation notes — honest, kernel-disciplined
 * content, never a fabricated dollar payback. `null` when the Move binds no
 * pack or the kernel could not run with curated depth.
 */
function charterKernelValueFraming(
  ctx: PhaseEntryContext,
): Record<string, unknown> | null {
  const bc = ctx.businessCase;
  if (!bc || !bc.bound || !bc.skeleton) return null;
  return {
    source: 'AbarVa expert kernel — compiled from the bound Domain Function Pack',
    recommendation: bc.skeleton.recommendation,
    recommendation_rationale: bc.skeleton.recommendationRationale,
    derivation_notes: bc.derivationNotes,
    honesty_note:
      'This value framing is kernel-compiled from curated planning ranges, ' +
      'not the tenant\'s own measured unit economics — the kernel blocks a ' +
      'claimable dollar payback until the seed-gapped metrics are closed.',
  };
}

/** The intake-derived lead paragraph the pack-bound charter keeps. */
function charterIntro(ctx: PhaseEntryContext): string {
  return (
    `Phase 0 gate passed for **${ctx.engagement.name}** and the program is ` +
    `moving into diagnostic work` +
    (ctx.sponsor ? `, with ${ctx.sponsor.name} (${ctx.sponsor.role}) sponsoring` : '') +
    `. The intake framed a ${ctx.engagement.objective_code ?? 'priority'} ` +
    `problem in ${ctx.engagement.industry_code ?? 'the client context'}.`
  );
}

// ── Stakeholder map — fallback builders ──────────────────────────────────────

function stakeholderStructuredFallback(ctx: PhaseEntryContext): Record<string, unknown> {
  return {
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
  };
}

function stakeholderMarkdownFallback(ctx: PhaseEntryContext): string {
  return `# Stakeholder Map

## Named Stakeholders
- ${ctx.sponsor ? `${ctx.sponsor.name} · ${ctx.sponsor.role} · sponsor` : 'Sponsor to confirm'}
${ctx.coSponsor ? `- ${ctx.coSponsor.name} · ${ctx.coSponsor.role} · co-sponsor` : ''}

## Immediate Engagement Strategy
- Lock sponsor alignment on the first diagnostic milestone
- Confirm where co-sponsor air cover is needed for data access and stakeholder interviews
- Expand the roster as Phase 1 identifies domain experts and data owners`;
}

function stakeholderIntro(ctx: PhaseEntryContext): string {
  return (
    `Named stakeholders from intake: ` +
    `${ctx.sponsor ? `${ctx.sponsor.name} (${ctx.sponsor.role}, sponsor)` : 'sponsor to confirm'}` +
    `${ctx.coSponsor ? `, ${ctx.coSponsor.name} (${ctx.coSponsor.role}, co-sponsor)` : ''}. ` +
    `The curated outline below frames who else this function must engage and ` +
    `the evidence each owner is accountable for.`
  );
}

// ── Risk register — fallback builders ────────────────────────────────────────

function riskStructuredFallback(ctx: PhaseEntryContext): Record<string, unknown> {
  return {
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
  };
}

function riskMarkdownFallback(): string {
  return `# Risk Register

## Active Risks
- Sponsor alignment slips after the gate and slows decisions
- Data access takes longer than expected once Phase 1 requests are named
- Diagnostic scope expands before the team has evidence

## Immediate Mitigation
- Keep a visible Week 1 milestone
- Route early data requests through the strongest executive sponsor
- Force a narrow first-win scope before broadening the diagnostic`;
}

function riskIntro(ctx: PhaseEntryContext): string {
  return (
    `Initial risk register for **${ctx.engagement.name}**. Beyond the standing ` +
    `delivery risks (sponsor drift, slow data access, scope creep), the curated ` +
    `outline below names the function-specific failure modes this Move must ` +
    `actively manage, and the seed gaps flag where the baseline that would ` +
    `let us quantify those risks is not yet recorded.`
  );
}

/**
 * The Phase-1-entry deliverable specs — charter, stakeholder map, risk
 * register. Exported so the pack-aware generation can be exercised directly
 * against a `PhaseEntryContext` without the gate-advance Supabase I/O.
 */
export const PHASE1_ENTRY_DELIVERABLES: PhaseEntryDeliverableSpec[] = [
  {
    typeKey: 'charter',
    title: 'Program Charter',
    description: 'Auto-generated charter from Phase 0 intake',
    applicablePhases: [0, 1],
    packArtifact: 'discover_brief',
    buildStructuredContent: (ctx) => {
      const base = charterStructuredFallback(ctx);
      // When the expert kernel ran, fold its honest value framing into the
      // charter — the kernel-disciplined recommendation, never a fake payback.
      const kernelValue = charterKernelValueFraming(ctx);
      const withKernel = kernelValue
        ? { ...base, kernel_value_framing: kernelValue }
        : base;
      return packBoundStructuredContent(ctx, 'discover_brief', withKernel);
    },
    buildMarkdown: (ctx) =>
      packBoundMarkdown(ctx, 'discover_brief', 'Program Charter', charterIntro(ctx)) ??
      charterMarkdownFallback(ctx),
  },
  {
    typeKey: 'stakeholder_map',
    title: 'Stakeholder Map',
    description: 'Auto-generated stakeholder map from Phase 0 intake',
    applicablePhases: [0, 1],
    packArtifact: 'discover_brief',
    buildStructuredContent: (ctx) =>
      packBoundStructuredContent(
        ctx,
        'discover_brief',
        stakeholderStructuredFallback(ctx),
      ),
    buildMarkdown: (ctx) =>
      packBoundMarkdown(ctx, 'discover_brief', 'Stakeholder Map', stakeholderIntro(ctx)) ??
      stakeholderMarkdownFallback(ctx),
  },
  {
    typeKey: 'risk_register',
    title: 'Risk Register',
    description: 'Auto-generated initial risk register from Phase 0 intake',
    applicablePhases: [0, 1, 2, 3, 4],
    packArtifact: 'discover_brief',
    buildStructuredContent: (ctx) =>
      packBoundStructuredContent(ctx, 'discover_brief', riskStructuredFallback(ctx)),
    buildMarkdown: (ctx) =>
      packBoundMarkdown(ctx, 'discover_brief', 'Risk Register', riskIntro(ctx)) ??
      riskMarkdownFallback(),
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

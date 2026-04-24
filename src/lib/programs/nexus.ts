// Nexus integration for Programs · Packet 8.
//
// Three operating modes distinct from Intelligence's three modes:
//   Mode A · Side-panel Q&A     — read-only, no program-state writes
//   Mode B · Module drafting    — writes draft deliverable version
//                                 attributed to Nexus
//   Mode C · CXO takeover       — structured Q→A, writes to phase
//                                 findings (P3) or outcome report (P6)
//
// Context pulls from program_threads (not intelligence_threads). Reuses
// lib/nexus/ composer + prompts once that layer ships. For now we build
// thread lifecycle + context assembly; composer calls are stubbed with
// a clear attachment point.

import { getServerSupabase } from '@/lib/supabase-server';
import type { NexusThreadMode, TenancyCtx } from './types.db';
import { getProgramById, getModuleState } from './queries';

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/nexus] TenancyCtx missing clientId or userId');
  }
}

export interface NexusThread {
  id: string;
  engagementId: string;
  userId: string;
  title: string | null;
  phaseNumber: number | null;
  moduleKey: string | null;
  mode: NexusThreadMode;
  state: 'active' | 'paused' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: string;
  lastTurnAt: string | null;
}

interface ProgramThreadRow {
  id: string;
  engagement_id: string;
  user_id: string;
  title: string | null;
  phase_number: number | null;
  module_key: string | null;
  state: 'active' | 'paused' | 'archived';
  metadata_jsonb: Record<string, unknown> | null;
  created_at: string;
  last_turn_at: string | null;
}

function rowToThread(r: ProgramThreadRow): NexusThread {
  const meta = r.metadata_jsonb ?? {};
  const mode = ((meta.mode as NexusThreadMode) ?? 'side_panel') as NexusThreadMode;
  return {
    id: r.id,
    engagementId: r.engagement_id,
    userId: r.user_id,
    title: r.title,
    phaseNumber: r.phase_number,
    moduleKey: r.module_key,
    mode,
    state: r.state,
    metadata: meta,
    createdAt: r.created_at,
    lastTurnAt: r.last_turn_at,
  };
}

export async function createThread(
  ctx: TenancyCtx,
  input: {
    programId: string;
    mode: NexusThreadMode;
    title?: string;
    phaseNumber?: number;
    moduleKey?: string;
    triggeredByDeliverableId?: string;
  },
): Promise<NexusThread> {
  assertTenancy(ctx);
  const program = await getProgramById(ctx, input.programId);
  if (!program) throw new Error('[programs/nexus] program not accessible');

  const sb = getServerSupabase();
  const metadata: Record<string, unknown> = { mode: input.mode };
  if (input.triggeredByDeliverableId) metadata.triggered_by_deliverable_id = input.triggeredByDeliverableId;

  const { data, error } = await sb
    .from('program_threads')
    .insert({
      engagement_id: input.programId,
      user_id: ctx.userId,
      title: input.title ?? null,
      phase_number: input.phaseNumber ?? null,
      module_key: input.moduleKey ?? null,
      state: 'active',
      metadata_jsonb: metadata,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToThread(data as ProgramThreadRow);
}

export async function listThreads(ctx: TenancyCtx, programId: string, opts: { mode?: NexusThreadMode } = {}): Promise<NexusThread[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_threads')
    .select('*')
    .eq('engagement_id', programId)
    .neq('state', 'archived')
    .order('last_turn_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  const all = ((data as ProgramThreadRow[] | null) ?? []).map(rowToThread);
  return opts.mode ? all.filter((t) => t.mode === opts.mode) : all;
}

export async function touchThread(threadId: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('program_threads')
    .update({ last_turn_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) throw error;
}

/**
 * Context assembly for a Nexus call on Programs. Returns the 60K-token
 * bundle per Packet 8 §8.3 — charter + phase state, pattern pre-load,
 * recent findings, L2 facts, L4 profile. The composer call itself is
 * deferred to lib/nexus/ (shipped in Intelligence Phase 3).
 */
export interface ProgramContextBundle {
  programId: string;
  program: { name: string; archetype: string | null; currentPhase: number | null };
  modules: Array<{ moduleKey: string; status: string; phaseNumber: number }>;
  patternPreload: Record<string, unknown> | null;
  deliverables: Array<{ id: string; title: string; status: string; typeKey: string }>;
  flags: Array<{ id: string; headline: string; severity: string }>;
}

export async function assembleContext(ctx: TenancyCtx, programId: string): Promise<ProgramContextBundle> {
  assertTenancy(ctx);
  const program = await getProgramById(ctx, programId);
  if (!program) throw new Error('[programs/nexus] program not accessible');
  const modules = await getModuleState(ctx, programId);

  const sb = getServerSupabase();
  const [delivQ, flagsQ, patternQ] = await Promise.all([
    sb.from('deliverables_v2').select('id, title, status, deliverable_type_key').eq('engagement_id', programId).order('updated_at', { ascending: false }).limit(10),
    sb.from('maestro_oversight_flags').select('id, headline, severity').eq('engagement_id', programId).is('resolved_at', null).limit(10),
    sb.from('pattern_match_logs').select('pattern_key, match_context_jsonb').eq('engagement_id', programId).eq('acted_upon', true).order('acted_upon_at', { ascending: false }).limit(1),
  ]);

  const patternKey = (patternQ.data as Array<{ pattern_key: string }> | null ?? [])[0]?.pattern_key;
  let patternPreload: Record<string, unknown> | null = null;
  if (patternKey) {
    const { data: topic } = await sb
      .from('engagement_topics')
      .select('topic_key, title, canonical_shape_json, phase_playbook, diagnostic_questions, success_signals, failure_modes')
      .eq('topic_key', patternKey)
      .maybeSingle();
    patternPreload = topic as Record<string, unknown> | null;
  }

  return {
    programId,
    program: { name: program.name, archetype: program.archetype, currentPhase: program.currentPhase },
    modules: modules.map((m) => ({ moduleKey: m.moduleKey, status: m.status, phaseNumber: m.phaseNumber })),
    patternPreload,
    deliverables: ((delivQ.data as Array<Record<string, unknown>> | null) ?? []).map((d) => ({
      id: d.id as string,
      title: d.title as string,
      status: d.status as string,
      typeKey: d.deliverable_type_key as string,
    })),
    flags: ((flagsQ.data as Array<Record<string, unknown>> | null) ?? []).map((f) => ({
      id: f.id as string,
      headline: f.headline as string,
      severity: f.severity as string,
    })),
  };
}

// ─── Mode A · Side-panel Q&A ───────────────────────────────────────────
// No writes to program state. Composer call deferred to lib/nexus/.
export async function sidePanelTurn(
  ctx: TenancyCtx,
  input: { threadId: string; query: string },
): Promise<{ threadId: string; deferredToComposer: true; context: ProgramContextBundle }> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data: thread } = await sb
    .from('program_threads')
    .select('engagement_id, user_id')
    .eq('id', input.threadId)
    .maybeSingle();
  const t = thread as { engagement_id: string; user_id: string } | null;
  if (!t || t.user_id !== ctx.userId) throw new Error('[programs/nexus] thread not found or denied');

  const context = await assembleContext(ctx, t.engagement_id);
  await touchThread(input.threadId);
  return { threadId: input.threadId, deferredToComposer: true, context };
}

// ─── Mode B · Module-embedded drafting ─────────────────────────────────
// Writes a draft deliverable version attributed to Nexus (created_by='nexus').
// Composer call + quality gates deferred to lib/nexus/.
export async function draftModuleDeliverable(
  ctx: TenancyCtx,
  input: {
    programId: string;
    moduleKey: string;
    deliverableTypeKey: string;
    title: string;
    draftContent: string;
    structuredData?: Record<string, unknown>;
    provenanceMap?: Record<string, unknown>;
    contextHash?: string;
  },
): Promise<{ deliverableId: string; versionId: string }> {
  assertTenancy(ctx);
  const program = await getProgramById(ctx, input.programId);
  if (!program) throw new Error('[programs/nexus] program not accessible');
  const sb = getServerSupabase();

  // Upsert deliverables_v2 row in draft state, attributed to Nexus
  const { data: existing } = await sb
    .from('deliverables_v2')
    .select('id, current_version')
    .eq('engagement_id', input.programId)
    .eq('deliverable_type_key', input.deliverableTypeKey)
    .maybeSingle();

  let deliverableId: string;
  let nextVersion = 1;
  if (existing) {
    deliverableId = (existing as { id: string; current_version: number }).id;
    nextVersion = ((existing as { current_version: number }).current_version ?? 0) + 1;
    const { error } = await sb
      .from('deliverables_v2')
      .update({ current_version: nextVersion, status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', deliverableId);
    if (error) throw error;
  } else {
    const { data: created, error } = await sb
      .from('deliverables_v2')
      .insert({
        engagement_id: input.programId,
        deliverable_type_key: input.deliverableTypeKey,
        title: input.title,
        status: 'draft',
        current_version: 1,
        created_by: 'nexus',
      })
      .select('id')
      .single();
    if (error) throw error;
    deliverableId = (created as { id: string }).id;
  }

  // Insert new version row
  const { data: version, error: vErr } = await sb
    .from('deliverable_versions')
    .insert({
      deliverable_id: deliverableId,
      version: nextVersion,
      content: input.draftContent,
      structured_data: input.structuredData ?? {},
      quality_issues: input.provenanceMap ? { provenance_map: input.provenanceMap } : null,
      generated_from_context_hash: input.contextHash ?? null,
    })
    .select('id')
    .single();
  if (vErr) throw vErr;

  return { deliverableId, versionId: (version as { id: string }).id };
}

// ─── Mode C · CXO takeover ─────────────────────────────────────────────
// Structured Q→A cadence. Phase-specific flow (P3 interview, P6 verify).
export interface CxoTakeoverSession {
  threadId: string;
  programId: string;
  phase: 3 | 6;
  structure: 'phase_3_interview' | 'phase_6_verification';
  startedAt: string;
}

export async function startCxoTakeover(
  ctx: TenancyCtx,
  input: { programId: string; phase: 3 | 6 },
): Promise<CxoTakeoverSession> {
  assertTenancy(ctx);
  const thread = await createThread(ctx, {
    programId: input.programId,
    mode: 'cxo_takeover',
    phaseNumber: input.phase,
    title: input.phase === 3 ? 'CXO Interview · Phase 3' : 'CXO Verification · Phase 6',
  });
  return {
    threadId: thread.id,
    programId: input.programId,
    phase: input.phase,
    structure: input.phase === 3 ? 'phase_3_interview' : 'phase_6_verification',
    startedAt: thread.createdAt,
  };
}

/**
 * Commit a CXO takeover transcript to the appropriate persistent store.
 * Phase 3 → writes to phase findings (module state_jsonb).
 * Phase 6 → writes to outcome_report deliverable draft.
 */
export async function commitCxoTranscript(
  ctx: TenancyCtx,
  input: {
    threadId: string;
    programId: string;
    phase: 3 | 6;
    transcript: Array<{ speaker: 'nexus' | 'sponsor' | 'lead'; text: string }>;
    synthesis: { headline: string; bullets: string[] };
  },
): Promise<{ target: 'phase_findings' | 'outcome_report'; targetId: string }> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  if (input.phase === 3) {
    const { data, error } = await sb
      .from('program_modules')
      .update({
        state_jsonb: { cxo_interview: { transcript: input.transcript, synthesis: input.synthesis } },
        completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('engagement_id', input.programId)
      .eq('module_key', 'cxo_interview')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('[programs/nexus] cxo_interview module not found on program');
    return { target: 'phase_findings', targetId: (data as { id: string }).id };
  }

  // Phase 6 — create or update outcome_report draft
  const { data: drafted } = await draftModuleDeliverable(ctx, {
    programId: input.programId,
    moduleKey: 'cxo_verification',
    deliverableTypeKey: 'outcome_report',
    title: input.synthesis.headline,
    draftContent: input.synthesis.bullets.join('\n\n'),
    structuredData: { transcript: input.transcript, synthesis: input.synthesis },
  }).then((r) => ({ data: r }));
  return { target: 'outcome_report', targetId: drafted.deliverableId };
}

/**
 * Compose entry-point. Today returns a shape the API route can hand off
 * to an SSE stream wired against lib/nexus/composer.ts once that lands.
 */
export function describePendingComposerCall(params: {
  mode: NexusThreadMode;
  context: ProgramContextBundle;
  prompt: string;
}): {
  provider: 'anthropic';
  model: string;
  systemPromptHint: string;
  contextTokenEstimate: number;
} {
  return {
    provider: 'anthropic',
    model: process.env.NEXUS_COMPOSER_MODEL ?? 'claude-opus-4-7',
    systemPromptHint:
      params.mode === 'cxo_takeover'
        ? 'Structured CXO interview · one question per turn · never 2 questions · acknowledge and redirect deflections'
        : params.mode === 'module_drafting'
          ? 'Draft module content with provenance pills · cite every claim · client-specific language · surface 2-3 sharpening questions'
          : 'Side-panel Q&A · scoped to program + L1-L4 · conversation only · no program-state writes',
    contextTokenEstimate: Math.round(
      (params.context.modules.length * 40 +
        params.context.deliverables.length * 120 +
        params.context.flags.length * 60 +
        (params.context.patternPreload ? 800 : 0) +
        200) /
        1,
    ),
  };
}

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
  // This only creates the row + draft version; actual content fills
  // asynchronously via Nexus module-drafting downstream.
  let deliverableId: string | undefined;
  if (toPhase === 1) {
    await sb.from('deliverable_types').upsert(
      {
        type_key: 'charter',
        title: 'Program Charter',
        description: 'Auto-generated charter from Phase 0 intake',
        applicable_phases: [1, 2],
        applicable_topics: [],
        template_structure: {},
        required_data_inputs: {},
        quality_rubric: {},
        generation_prompt_template: '',
        output_format: 'markdown',
        maturity: 'pilot',
      },
      { onConflict: 'type_key' },
    );
    const { data: existing } = await sb
      .from('deliverables_v2')
      .select('id')
      .eq('engagement_id', engagementId)
      .eq('deliverable_type_key', 'charter')
      .maybeSingle();
    if (existing) {
      deliverableId = (existing as { id: string }).id;
    } else {
      const { data: created } = await sb
        .from('deliverables_v2')
        .insert({
          engagement_id: engagementId,
          deliverable_type_key: 'charter',
          title: 'Program Charter (draft)',
          status: 'draft',
          current_version: 1,
          created_by: 'nexus',
        })
        .select('id')
        .single();
      deliverableId = (created as { id: string }).id;
      await sb.from('deliverable_versions').insert({
        deliverable_id: deliverableId,
        version: 1,
        content: '# Program Charter\n\nDraft generating · Nexus will fill this in via module drafting.',
        structured_data: { from_gate_approval: true, phase_transition: `${fromPhase}→${toPhase}` },
      });
    }
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

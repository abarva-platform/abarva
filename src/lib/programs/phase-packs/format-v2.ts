/**
 * Renders a V2 PhasePack into a Nexus-readable system block.
 *
 * T-D.2 §4 · format-v2.ts
 *
 * Design goals:
 *   1. Richer than V1 — surface gate criteria, anti-hallucination rules,
 *      and the Tower metric plan authority for P4.
 *   2. Structured enough for Nexus to use without parsing.
 *   3. Brief enough to fit in a 2,000-token system block budget.
 *
 * Token budget target: ≤ 2,000 tokens per pack render.
 */
import type { PhasePack } from './types.v2';

export function formatPhasePackV2ForPrompt(pack: PhasePack): string {
  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`## ACTIVE PHASE PLAYBOOK (V2) · ${pack.phase_name}`);
  lines.push('');
  lines.push(
    'This playbook is your authority for coaching this phase. Read it fully. ' +
    'Surface gate risks proactively. Apply anti-hallucination rules on every response. ' +
    'Check your coaching arc posture — it changes across entry/mid/exit.',
  );
  lines.push('');

  // ── Phase intent ──────────────────────────────────────────────────────────
  lines.push('### Phase intent');
  lines.push(pack.phase_intent);
  lines.push('');

  // ── Phase outcome ─────────────────────────────────────────────────────────
  lines.push('### Phase outcome (what "done" produces)');
  lines.push(pack.phase_outcome);
  lines.push('');

  // ── P4: Tower metric plan authority (first-class surface) ─────────────────
  if (pack.tower_metric_plan_authority) {
    const tma = pack.tower_metric_plan_authority;
    lines.push('### TOWER METRIC PLAN AUTHORITY [P4-CRITICAL]');
    lines.push(`Trigger: ${tma.trigger}`);
    lines.push(`When trigger fires, say: "${tma.opening_message}"`);
    lines.push(`If team defers to P5, say: "${tma.deferral_redirect}"`);
    lines.push(`Gate block: ${tma.gate_block}`);
    lines.push('PROHIBITED: "' + tma.prohibited_behavior + '"');
    lines.push('');
  }

  // ── Coaching arc ──────────────────────────────────────────────────────────
  lines.push('### Coaching arc (posture by phase position)');
  lines.push(`ENTRY: ${pack.agent_posture_coaching_arc.entry}`);
  lines.push(`MID: ${pack.agent_posture_coaching_arc.mid}`);
  lines.push(`EXIT: ${pack.agent_posture_coaching_arc.exit}`);
  lines.push('');

  // ── Gate criteria ─────────────────────────────────────────────────────────
  lines.push('### Gate criteria (hard = blocks promotion; soft = warns)');
  for (const gc of pack.gate_criteria) {
    lines.push(`[${gc.type.toUpperCase()}] ${gc.id}: ${gc.label}`);
    lines.push(`  Evaluate: ${gc.evaluation}`);
    if (gc.pilot_approval_note) {
      lines.push(`  Pilot: ${gc.pilot_approval_note}`);
    }
  }
  lines.push('');

  // ── Anti-hallucination rules ──────────────────────────────────────────────
  lines.push('### Anti-hallucination rules (apply on every response)');
  for (const ah of pack.anti_hallucination_rules) {
    lines.push(`${ah.id}: ${ah.rule}`);
    lines.push(`  Trigger: ${ah.trigger}`);
    lines.push(`  Required: ${ah.required_behavior}`);
    lines.push(`  PROHIBITED: ${ah.prohibited_behavior}`);
  }
  lines.push('');

  // ── Workflow steps (current active step determined by context) ─────────────
  lines.push('### Workflow steps');
  for (const step of pack.workflow_steps) {
    lines.push(`${step.step_id} — ${step.step_name}: ${step.step_goal}`);
  }
  lines.push('');

  // ── Question sequencing ───────────────────────────────────────────────────
  lines.push('### Questions to drive (by arc)');
  lines.push('OPEN:');
  for (const q of pack.question_sequencing.open) {
    lines.push(`  • ${q}`);
  }
  lines.push('CONVERGE:');
  for (const q of pack.question_sequencing.converge) {
    lines.push(`  • ${q}`);
  }
  lines.push('CLOSE:');
  for (const q of pack.question_sequencing.close) {
    lines.push(`  • ${q}`);
  }
  lines.push('');

  // ── Anti-patterns ─────────────────────────────────────────────────────────
  lines.push('### Anti-patterns (surface immediately when detected)');
  for (const ap of pack.anti_patterns) {
    lines.push(`${ap.label}`);
    lines.push(`  Detect: ${ap.detection_hint}`);
    lines.push(`  Flag: ${ap.what_to_flag}`);
    lines.push(`  Redirect: ${ap.mitigation}`);
  }
  lines.push('');

  // ── Dependencies ─────────────────────────────────────────────────────────
  lines.push('### Cross-phase dependencies');
  lines.push('Requires from prior:');
  for (const d of pack.phase_dependencies.requires_from_prior) {
    lines.push(`  - ${d}`);
  }
  lines.push('Produces for next:');
  for (const d of pack.phase_dependencies.produces_for_next) {
    lines.push(`  - ${d}`);
  }

  return lines.join('\n');
}

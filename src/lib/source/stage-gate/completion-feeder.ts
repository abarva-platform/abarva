// Stage-gate completion feeder — turn real Source signals into a StageCompletionState.
//
// A requirement is satisfied when its evidence family is agent_ready (evidence), an
// artifact of its type exists (artifact), a review is signed off (review), a decision is
// recorded (decision), or a session was held (session). Pure + injectable.

import type { StageCompletionState, StageGateDefinition } from './types';

export interface StageSignals {
  /** evidence families that are agent_ready (from evidence-readiness). */
  agentReadyFamilies?: Iterable<string>;
  /** artifact types present in the File Cabinet for this event. */
  presentArtifactTypes?: Iterable<string>;
  /** review keys signed off (procurement/legal/pricing). */
  reviewsSignedOff?: Iterable<string>;
  /** decision keys recorded (client/Maestro decisions). */
  decisionsMade?: Iterable<string>;
  /** session keys held (workshops/briefings). */
  sessionsHeld?: Iterable<string>;
}

export function buildStageCompletion(def: StageGateDefinition, signals: StageSignals): StageCompletionState {
  const ev = new Set(signals.agentReadyFamilies ?? []);
  const art = new Set(signals.presentArtifactTypes ?? []);
  const rev = new Set(signals.reviewsSignedOff ?? []);
  const dec = new Set(signals.decisionsMade ?? []);
  const ses = new Set(signals.sessionsHeld ?? []);

  const satisfied = new Set<string>();
  for (const r of def.requirements) {
    const set =
      r.kind === 'evidence' ? ev :
      r.kind === 'artifact' ? art :
      r.kind === 'review' ? rev :
      r.kind === 'decision' ? dec :
      ses; // session
    if (set.has(r.key)) satisfied.add(r.key);
  }
  return { satisfiedRequirementKeys: satisfied };
}

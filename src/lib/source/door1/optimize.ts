// ─────────────────────────────────────────────────────────────────────────────
// Door 1 — the orchestrator.
//
// Ties the four steps into one `SourceOptimization`:
//   ingest (baseline) → diagnose → quantify (bridge) → play.
//
// The ingest/extraction of the contract + invoices into `source_event_facts` is a
// parallel slice; this orchestrator takes the resulting `factKey → value` map (the
// caller reads it out of the DB) plus the resolved archetype, and runs the rest of
// the flow deterministically. Same archetype + same facts → same optimization.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceEventArchetype } from '../archetypes/types';
import { diagnoseLeakage } from './diagnose';
import { buildValueBridge } from './bridge';
import { recommendPlay } from './play';
import type {
  Door1Baseline,
  Door1FactMap,
  SourceOptimization,
} from './types';

/** Build the ingest baseline descriptor from the fact map. */
export function buildBaseline(input: {
  eventId: string;
  archetype: SourceEventArchetype;
  facts: Door1FactMap;
}): Door1Baseline {
  const presentFactKeys = Object.keys(input.facts).sort();
  return {
    eventId: input.eventId,
    archetypeId: input.archetype.id,
    factCount: presentFactKeys.length,
    presentFactKeys,
  };
}

/**
 * Run the full Door-1 optimization. Deterministic and side-effect-free — it does
 * not persist or open a Door-2 event; when the play is `rebid` the returned
 * `play.handoff` is the descriptor the caller acts on.
 */
export function runSourceOptimization(input: {
  eventId: string;
  archetype: SourceEventArchetype;
  facts: Door1FactMap;
}): SourceOptimization {
  const { eventId, archetype, facts } = input;

  const baseline = buildBaseline({ eventId, archetype, facts });
  const diagnosis = diagnoseLeakage({ eventId, archetype, facts });
  const bridge = buildValueBridge(diagnosis);
  const play = recommendPlay({ archetype, diagnosis, bridge, facts });

  return {
    eventId,
    archetypeId: archetype.id,
    baseline,
    diagnosis,
    bridge,
    play,
  };
}

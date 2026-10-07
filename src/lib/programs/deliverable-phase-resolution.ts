// deliverable-phase-resolution.ts
//
// Resolving a Moves deliverable's canonical phase from EITHER spelling of its
// key.
//
// A per-phase deliverable has two names: the REGISTRY key
// (`PHASE_CANONICAL_KEYS` in deliverable-registry.ts, e.g. `handoff_package`)
// and the orchestrator `deliverableType` that `orchestratorDeliverableType`
// maps it onto (e.g. `handoff_pack`). Five of the twenty canonical keys have a
// non-identity mapping — `operating_model_design`, `execution_roadmap`,
// `financial_model`, `tower_metrics_plan`, `handoff_package` — and for those
// five the two spellings differ.
//
// The phase lookup used to match only the ORCHESTRATOR side: it compared the
// input against `orchestratorDeliverableType(spec.deliverableTypeKey)` and
// nothing else. Passing a registry key therefore matched no spec at all for
// exactly those five, the phase set came back EMPTY, and the "not exactly one
// phase" branch returned null — indistinguishable from a genuinely ambiguous
// key. Both consumers read that null as a hard stop: POST
// /api/v1/deliverables/generate answers 422 `moves_deliverable_phase_unresolved`,
// and the queue worker completes the run as `blocked` under the same code, so
// the deliverable never generates. Four of the five sit in P4/P5.
//
// The resolution here matches a spec when EITHER of its two spellings equals
// the input. Measured over every key the registry can produce (27 distinct
// normalized inputs, deprecated specs included): the widened rule resolves all
// 27 and introduces ZERO phase collisions, so it is a strict superset of the
// orchestrator-only rule — every answer that was non-null is unchanged, and the
// five nulls become their declared phase.
//
// Parameterised on the specs, the normalizer and the alias resolver rather than
// importing them, so the rule can be exercised against a constructed registry —
// including the ambiguity case, which the shipped registry does not contain and
// which must keep returning null.

export interface DeliverablePhaseSpec {
  readonly deliverableTypeKey: string;
  readonly phase: number;
}

/**
 * The unique canonical Moves phase for a deliverable key, accepting the
 * registry key or the orchestrator `deliverableType` for the same document.
 *
 * Returns null when no spec carries the key under either spelling, and when the
 * matching specs disagree about the phase — an ambiguous key must not be given
 * a phase, because the phase scopes which approved evidence reaches generation.
 */
export function canonicalPhaseForDeliverableKey(args: {
  readonly key: string;
  readonly specs: readonly DeliverablePhaseSpec[];
  readonly normalize: (key: string) => string;
  readonly toOrchestratorType: (registryKey: string) => string;
}): number | null {
  const { specs, normalize, toOrchestratorType } = args;
  const key = normalize(args.key);
  if (!key) return null;

  const phases = new Set<number>();
  for (const spec of specs) {
    const registrySpelling = normalize(spec.deliverableTypeKey);
    const orchestratorSpelling = normalize(
      toOrchestratorType(spec.deliverableTypeKey),
    );
    if (registrySpelling === key || orchestratorSpelling === key) {
      phases.add(spec.phase);
    }
  }
  return phases.size === 1 ? [...phases][0] : null;
}

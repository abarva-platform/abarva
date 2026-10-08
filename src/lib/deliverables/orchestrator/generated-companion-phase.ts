// Which Moves phase a generated deliverable's editable Office companion is filed
// under, and what decided it.
//
// The phase is DECLARED by the generation request: it travels on the queue payload
// (`OrchestratorDeliverableRunJobPayload.phase`) and into the generation input, and
// it is the value the enqueuing route already scoped the approved evidence to. The
// registry lookup is a SECOND, independent derivation from the deliverable's key,
// and it answers nothing for a key the registry does not carry — 15 of the 36
// profiled deliverable keys are not registry keys, and the registry declares no
// phase 0 at all. Falling back to `0` therefore made "no phase could be resolved"
// indistinguishable from "Originate", which the phase page selects on by exact
// equality (`artifact.phase !== parsedPhase`).
//
// So the declared phase wins, the key derivation is only the fallback, and the
// basis travels with the value so the persisted companion records whether its
// phase was declared or guessed rather than silently claiming P0.

import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";

/** What decided the companion's phase. */
export type GeneratedCompanionPhaseBasis =
  | "declared"
  | "registry_key"
  | "unresolved";

export interface GeneratedCompanionPhase {
  phase: number;
  basis: GeneratedCompanionPhaseBasis;
}

/**
 * The value written when neither the request nor the registry resolves a phase.
 * It is the pre-existing fallback, kept so this resolver changes no stored phase
 * that was already being written; `basis: "unresolved"` is what distinguishes it
 * from a genuine Originate artifact.
 */
export const UNRESOLVED_COMPANION_PHASE = 0;

/** A declared phase is only usable if it is a canonical Moves phase (0–5). */
function isCanonicalMovesPhase(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 5;
}

export function resolveGeneratedCompanionPhase(args: {
  /** Phase declared by the generation request, when it declared one. */
  declaredPhase?: number | null;
  /** The key the deliverable was persisted under. */
  deliverableTypeKey: string;
  registry?: ReadonlyArray<{ deliverableTypeKey: string; phase: number }>;
}): GeneratedCompanionPhase {
  if (isCanonicalMovesPhase(args.declaredPhase)) {
    return { phase: args.declaredPhase, basis: "declared" };
  }
  const registry = args.registry ?? DELIVERABLE_REGISTRY;
  const spec = registry.find(
    (entry) => entry.deliverableTypeKey === args.deliverableTypeKey,
  );
  if (spec) return { phase: spec.phase, basis: "registry_key" };
  return { phase: UNRESOLVED_COMPANION_PHASE, basis: "unresolved" };
}

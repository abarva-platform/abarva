// Which documents the phase-by-phase Documents list shows for a Move, and what
// its "N/M" tally counts.
//
// `phaseCanonicalKeysForRoute` already narrows P3 by the Move's confirmed
// solution route: a technical-product Move builds two documents at P3, a bounded
// process-change Move three, and every other route the full six. The phase
// workspace's build control is given that narrowed set
// (`PhaseApproveAndBuild`'s `deliverableKeys`), so Approve & Build produces
// exactly those.
//
// The Documents list on Files & Evidence was not. It mapped the UNNARROWED
// `PHASE_CANONICAL_KEYS[phase]`, so a route-narrowed Move showed a row for each
// of the six P3 documents and stated its tally over six. Two consequences, both
// on the live walk:
//
//   • The tally understates a finished phase. A technical-product Move that has
//     built both of its P3 documents — everything its route declares, enough for
//     the P3 exit gate, which reads only those two — reads "2/6". The phase is
//     complete and the page says it is a third done.
//   • Four rows name documents nothing will ever produce. Approve & Build does
//     not declare them, so they stay un-generated for the life of the Move with
//     no control anywhere that fills them.
//
// So the displayed set is the BUILD set, resolved through the same declaration
// the build path uses (`resolvePhaseBuildSet`).
//
// One exception, and it is the reason this is a module rather than a one-line
// substitution: the route is recorded at P2 and may be CORRECTED afterwards. A
// Move that generated an off-route document before its route narrowed must not
// have that document disappear from the vault — Files & Evidence is where the
// person goes to find what exists. So a canonical document for the phase that
// is outside the build set is retained when, and only when, this Move actually
// has output for it. It is then part of the tally too, which keeps the tally
// honest in both directions: the denominator never counts a document this
// Move's route will not build and has not built, and the numerator never counts
// one that is hidden.

import {
  PHASE_CANONICAL_KEYS,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { resolvePhaseBuildSet } from "@/lib/programs/phase-build-set";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export interface PhaseDocumentDisplaySet {
  /** Specs to render, build-set order first, then retained off-route output. */
  specs: DeliverableSpec[];
  /** Keys the route declares for this phase, in declared order. */
  buildSetKeys: string[];
  /**
   * Canonical keys outside the build set that are shown anyway because this
   * Move has output for them. Empty for a Move whose route was never narrowed.
   */
  retainedOffRouteKeys: string[];
}

/** Injection points exist for the suite; product callers pass nothing. */
export type PhaseDocumentDisplaySetDeps = {
  canonicalKeys?: Record<number, string[]>;
  buildSet?: typeof resolvePhaseBuildSet;
};

export function phaseDocumentDisplaySet(args: {
  phase: number;
  route?: ConfirmedSolutionRoute | null;
  /** True when this Move has generated content or a run for the key. */
  hasOutput: (deliverableTypeKey: string) => boolean;
  deps?: PhaseDocumentDisplaySetDeps;
}): PhaseDocumentDisplaySet {
  const canonicalKeys = args.deps?.canonicalKeys ?? PHASE_CANONICAL_KEYS;
  const buildSet = args.deps?.buildSet ?? resolvePhaseBuildSet;
  const buildSetKeys = buildSet(args.phase, args.route ?? null).declaredKeys;
  const inBuildSet = new Set(buildSetKeys);

  // Canonical-but-off-route documents, in canonical order, kept only when this
  // Move has something to show for them.
  const retainedOffRouteKeys = (canonicalKeys[args.phase] ?? []).filter(
    (key) => !inBuildSet.has(key) && args.hasOutput(key),
  );

  // One resolution for the whole displayed list, through the same resolver the
  // build path uses, so a key that no longer resolves to a spec drops its row
  // here exactly as it would refuse the build there.
  const { specs } = buildSet(args.phase, args.route ?? null, {
    keysForPhase: () => [...buildSetKeys, ...retainedOffRouteKeys],
  });

  return { specs, buildSetKeys, retainedOffRouteKeys };
}

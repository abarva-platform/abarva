// Resolve the set of documents an "Approve & Build" for a phase will produce.
//
// The build set is DECLARED by the registry: `phaseCanonicalKeysForRoute` names the
// canonical deliverable type keys for a phase (route-aware at P3), and each key is
// expected to resolve to a `DeliverableSpec` in `DELIVERABLE_REGISTRY`.
//
// Why this is its own module rather than two lines in the generate-phase route:
// the route previously resolved the keys with `.map(find).filter(Boolean)`. A key
// that did not resolve was SILENTLY DROPPED, so a phase whose registry had drifted
// (a renamed or removed type key) would build a SHORT set with no error at all.
// Nothing downstream can recover from that: the missing document is simply never
// built, and the phase's exit gate then refuses the Move with "<document> is not
// signed off" — a blocker naming a control the user was never given, because the
// build that was supposed to produce it reported success.
//
// So resolution reports what it could NOT resolve, and the caller refuses the build
// naming those keys instead of quietly building fewer documents than it declared.
// Today no canonical key is unresolvable (pinned by this module's suite); this
// exists so that a future registry drift fails loudly at the build instead of
// silently at the gate, one phase later.

import {
  DELIVERABLE_REGISTRY,
  phaseCanonicalKeysForRoute,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export type PhaseBuildSet = {
  /** Declared canonical keys for the phase, in build order. */
  declaredKeys: string[];
  /** Specs for the keys that resolved, in declared order. */
  specs: DeliverableSpec[];
  /** Declared keys with no registry spec. Non-empty = the build must refuse. */
  unresolvedKeys: string[];
};

/** Injection points exist for the suite; product callers pass nothing. */
export type PhaseBuildSetDeps = {
  registry?: readonly DeliverableSpec[];
  keysForPhase?: (
    phase: number,
    route?: ConfirmedSolutionRoute | null,
  ) => string[];
};

export function resolvePhaseBuildSet(
  phase: number,
  route?: ConfirmedSolutionRoute | null,
  deps: PhaseBuildSetDeps = {},
): PhaseBuildSet {
  const registry = deps.registry ?? DELIVERABLE_REGISTRY;
  const keysForPhase = deps.keysForPhase ?? phaseCanonicalKeysForRoute;
  const declaredKeys = keysForPhase(phase, route);
  const specs: DeliverableSpec[] = [];
  const unresolvedKeys: string[] = [];
  for (const key of declaredKeys) {
    const spec = registry.find((entry) => entry.deliverableTypeKey === key);
    if (spec) specs.push(spec);
    else unresolvedKeys.push(key);
  }
  return { declaredKeys, specs, unresolvedKeys };
}

/**
 * The refusal sentence. It names the keys, says which phase declared them, and says
 * that nothing was built — so the reader is not left looking for a partial result.
 */
export function describeUnresolvedBuildSet(
  phase: number,
  unresolvedKeys: string[],
): string {
  const count = unresolvedKeys.length;
  return (
    `Phase ${phase} declares ${count} document${count === 1 ? "" : "s"} ` +
    `the deliverable registry cannot resolve (${unresolvedKeys.join(", ")}). ` +
    `No phase build was queued, because building the rest would leave the phase ` +
    `gate asking for a document this build could never produce.`
  );
}

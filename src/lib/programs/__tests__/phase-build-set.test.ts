/**
 * The phase build set is what an "Approve & Build" promises to produce.
 *
 * Two halves are pinned here:
 *
 * 1. RESOLVABILITY. Every canonical key the registry declares for a phase — on every
 *    P3 solution route, not just the default — must resolve to a spec. The route used
 *    to drop an unresolvable key silently, so a registry rename would have shortened
 *    the build set with no error and the phase's exit gate would then have refused the
 *    Move for a document the build never attempted. Resolution now reports the
 *    unresolved keys and the route refuses; this half proves there are none today, so
 *    the refusal is a guard against drift and not a live refusal.
 *
 * 2. GENERATION-COMPLETENESS. A spec that resolves but carries no `sections` produces a
 *    contentless document. Two registry entries (`p3_design`, `roadmap`) are exactly
 *    that, and they are safe only because they are canonical for no phase. This half
 *    asserts the property over the keys the build path actually selects, in both
 *    directions, so promoting one of those entries into a canonical set fails here
 *    rather than shipping an empty gate artifact.
 */
import {
  resolvePhaseBuildSet,
  describeUnresolvedBuildSet,
} from "@/lib/programs/phase-build-set";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/** A complete confirmed route; only the fields the registry branches on vary. */
const route = (
  over: Partial<ConfirmedSolutionRoute>,
): ConfirmedSolutionRoute => ({
  route: "process_change",
  recommendation: "process_change",
  solutionOutput: "workflow_automation",
  workflowChange: "limited",
  roleAccountabilityChange: "limited",
  adoptionOwner: "Operations lead",
  adoptionResponsibility: "business",
  decision: "confirm",
  evidenceReference: "ev-1",
  validatedBy: "Reviewer",
  rationale: "Route confirmed for this suite.",
  ...over,
});

/** Every P3 route shape the registry branches on, plus the default. */
const P3_ROUTES: Array<{ label: string; route: ConfirmedSolutionRoute | null }> = [
  { label: "default (no confirmed route)", route: null },
  { label: "technical_product", route: route({ route: "technical_product" }) },
  {
    // The registry's bounded branch is `!== "material"`, so BOTH non-material
    // levels must take it; a branch narrowed to one of them fails here.
    label: "process_change (limited change)",
    route: route({
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
    }),
  },
  {
    label: "process_change (no change)",
    route: route({ workflowChange: "none", roleAccountabilityChange: "none" }),
  },
  {
    label: "process_change (material)",
    route: route({
      workflowChange: "material",
      roleAccountabilityChange: "material",
    }),
  },
];

const CANONICAL_PHASES = Object.keys(PHASE_CANONICAL_KEYS).map(Number);

describe("phase build set — resolvability", () => {
  it("declares at least one document for every phase that has a canonical set", () => {
    expect(CANONICAL_PHASES.length).toBeGreaterThan(0);
    for (const phase of CANONICAL_PHASES) {
      const set = resolvePhaseBuildSet(phase, null);
      expect(set.declaredKeys.length).toBeGreaterThan(0);
    }
  });

  it.each(CANONICAL_PHASES)(
    "resolves every declared key at P%s",
    (phase) => {
      const set = resolvePhaseBuildSet(phase, null);
      expect(set.unresolvedKeys).toEqual([]);
      expect(set.specs).toHaveLength(set.declaredKeys.length);
    },
  );

  it.each(P3_ROUTES)(
    "resolves every declared P3 key on route $label",
    ({ route }) => {
      const set = resolvePhaseBuildSet(3, route);
      expect(set.declaredKeys.length).toBeGreaterThan(0);
      expect(set.unresolvedKeys).toEqual([]);
      expect(set.specs.map((s) => s.deliverableTypeKey)).toEqual(
        set.declaredKeys,
      );
    },
  );

  it("keeps the specs in declared build order", () => {
    const set = resolvePhaseBuildSet(4, null);
    expect(set.specs.map((s) => s.deliverableTypeKey)).toEqual(
      set.declaredKeys,
    );
  });

  it("reports an unresolvable key instead of dropping it", () => {
    const set = resolvePhaseBuildSet(4, null, {
      keysForPhase: () => ["business_case", "a_key_no_registry_entry_declares"],
    });
    expect(set.declaredKeys).toHaveLength(2);
    expect(set.specs.map((s) => s.deliverableTypeKey)).toEqual([
      "business_case",
    ]);
    expect(set.unresolvedKeys).toEqual(["a_key_no_registry_entry_declares"]);
  });

  it("reports every unresolvable key, not just the first", () => {
    const set = resolvePhaseBuildSet(4, null, {
      keysForPhase: () => ["gone_one", "business_case", "gone_two"],
    });
    expect(set.unresolvedKeys).toEqual(["gone_one", "gone_two"]);
  });

  it("treats a registry whose entry was renamed as unresolvable", () => {
    const renamed = DELIVERABLE_REGISTRY.map((entry) =>
      entry.deliverableTypeKey === "handoff_package"
        ? { ...entry, deliverableTypeKey: "handoff_pack" }
        : entry,
    ) as readonly DeliverableSpec[];
    const set = resolvePhaseBuildSet(5, null, { registry: renamed });
    expect(set.unresolvedKeys).toContain("handoff_package");
  });
});

describe("phase build set — the refusal sentence", () => {
  it("names each unresolved key and says nothing was built", () => {
    const detail = describeUnresolvedBuildSet(4, ["tower_metrics_plan"]);
    expect(detail).toContain("Phase 4");
    expect(detail).toContain("tower_metrics_plan");
    expect(detail).toContain("No phase build was queued");
    expect(detail).toContain("1 document the");
  });

  it("pluralises the document count", () => {
    const detail = describeUnresolvedBuildSet(3, ["a", "b"]);
    expect(detail).toContain("2 documents the");
    expect(detail).toContain("a, b");
  });
});

describe("phase build set — generation-completeness", () => {
  const canonicalSpecs = (): DeliverableSpec[] => {
    const seen = new Map<string, DeliverableSpec>();
    for (const phase of CANONICAL_PHASES)
      for (const spec of resolvePhaseBuildSet(phase, null).specs)
        seen.set(spec.deliverableTypeKey, spec);
    for (const { route } of P3_ROUTES)
      for (const spec of resolvePhaseBuildSet(3, route).specs)
        seen.set(spec.deliverableTypeKey, spec);
    return [...seen.values()];
  };

  it("gives every buildable document a non-empty section list", () => {
    const empty = canonicalSpecs()
      .filter((spec) => (spec.sections?.length ?? 0) === 0)
      .map((spec) => spec.deliverableTypeKey);
    expect(empty).toEqual([]);
  });

  it("gives every buildable document a title, purpose, and format", () => {
    for (const spec of canonicalSpecs()) {
      expect(spec.documentTitle.trim()).not.toBe("");
      expect(spec.documentPurpose.trim()).not.toBe("");
      expect(spec.formatRecommendation).toBeTruthy();
    }
  });

  // The other direction: the two section-less entries exist and are excused only
  // because nothing builds them. If one is promoted into a canonical set, the
  // assertion above starts failing — and if one gains sections, this stale excuse
  // fails instead of sitting here claiming a problem that is gone.
  it("keeps the section-less registry entries out of every build set", () => {
    const sectionLess = DELIVERABLE_REGISTRY.filter(
      (entry) => (entry.sections?.length ?? 0) === 0,
    ).map((entry) => entry.deliverableTypeKey);
    expect(sectionLess.sort()).toEqual(["p3_design", "roadmap"]);
    const buildable = new Set(
      canonicalSpecs().map((spec) => spec.deliverableTypeKey),
    );
    for (const key of sectionLess) expect(buildable.has(key)).toBe(false);
  });
});

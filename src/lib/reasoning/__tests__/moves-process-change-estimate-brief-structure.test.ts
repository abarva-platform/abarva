/**
 * The P3 Process Change Estimate Brief composes from a declared structure.
 *
 * On the BOUNDED process-change route, the P3 `design_approved` hard gate needs
 * two documents to meet the approval bar: the target state architecture and
 * this brief (governance.ts). The architecture had a declared structure and so
 * grounded a declared archetype's evidence families; this brief had none, fell
 * through `composeBrief` to the generic board brief, and grounded zero of them.
 *
 * Two existing guards each miss it for a different structural reason, which is
 * why it survived:
 *
 *  - `archetypeEvidenceLandingReport` iterates `DELIVERABLE_STRUCTURES`, so a
 *    type with no structure cannot appear in its output at all.
 *  - the phase reach suite iterates `PHASE_CANONICAL_KEYS`, and this key is not
 *    in it — `phaseCanonicalKeysForRoute` is the only thing that returns it.
 *
 * So this suite pins both halves: the structure itself, and the route-aware
 * sweep that would have caught its absence. Literals are written out rather
 * than read off the modules under test — an expectation derived from the
 * declaration it is checking cannot see a rename.
 */
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { GOVERNED_DATA_FOUNDATION_PACK } from "@/lib/deliverables/orchestrator/briefs/archetype-pack-governed-data-foundation";
import {
  DELIVERABLE_STRUCTURES,
  getDeliverableStructure,
} from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";
import {
  getDeliverableSpec,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import {
  CHANGE_IMPACT_LEVELS,
  SOLUTION_ROUTES,
  type ConfirmedSolutionRoute,
} from "@/lib/programs/solution-route-assessment";

const REGISTRY_KEY = "process_change_estimate_brief";
const ARCHETYPE = "governed_data_foundation";

/** The section spine, written out in the order the document reads. */
const SECTION_KEYS = [
  "estimate_summary",
  "change_boundary",
  "current_to_proposed_delta",
  "people_adoption_impact",
  "controls_dependencies",
  "sizing_basis",
  "decision_conditions",
] as const;

/** The sections that assert client facts, and so carry the archetype's families. */
const EVIDENCE_SECTIONS = [
  "change_boundary",
  "current_to_proposed_delta",
  "people_adoption_impact",
  "controls_dependencies",
  "sizing_basis",
] as const;

/** The two judgment sections, which must NOT pull a use case's baseline evidence. */
const JUDGMENT_SECTIONS = ["estimate_summary", "decision_conditions"] as const;

/** Tables this artifact TYPE is built around, written out as literals. */
const TABLE_KEYS = [
  "workflow_delta_register",
  "change_sizing_basis",
  "adoption_accountability",
] as const;

/** `composeBrief`'s inferred landing-site rule, restated so it can be probed. */
const INFERRED_SITE_RULE =
  /current_state|baseline|signal|findings|environment/;

const resolved = () => orchestratorDeliverableType(REGISTRY_KEY);
const structure = () => getDeliverableStructure("moves", resolved());
const brief = () =>
  getArtifactBrief({
    ...amsRfpRequest,
    module: "moves",
    useCaseArchetype: ARCHETYPE,
    deliverableType: resolved(),
  } as DeliverableIntelligenceRequest);

describe("the deliverable this gate criterion reads", () => {
  it("is a gate artifact the registry declares six sections for", () => {
    const spec = getDeliverableSpec(REGISTRY_KEY);
    expect(spec).toBeDefined();
    expect(spec?.phase).toBe(3);
    expect(spec?.gateArtifact).toBe(true);
    expect(spec?.sections).toHaveLength(6);
  });

  it("is reachable ONLY on the bounded process-change route", () => {
    // The reason the phase reach suite cannot see it: it is absent from every
    // route whose keys come from `PHASE_CANONICAL_KEYS`.
    const bounded: ConfirmedSolutionRoute = {
      ...({} as ConfirmedSolutionRoute),
      route: "process_change",
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
    };
    expect(phaseCanonicalKeysForRoute(3, bounded)).toContain(REGISTRY_KEY);
    expect(phaseCanonicalKeysForRoute(3, null)).not.toContain(REGISTRY_KEY);
    expect(
      phaseCanonicalKeysForRoute(3, {
        ...bounded,
        route: "technical_product",
      }),
    ).not.toContain(REGISTRY_KEY);
    expect(
      phaseCanonicalKeysForRoute(3, {
        ...bounded,
        workflowChange: "material",
      }),
    ).not.toContain(REGISTRY_KEY);
  });

  it("resolves to itself through the production mapping", () => {
    // `/api/v1/deliverables/generate-phase` and `PhaseDocumentsPanel` both send
    // the orchestrator type, so a structure keyed to the registry key alone
    // would never be served. Pinned because the mapping is where that breaks.
    expect(resolved()).toBe(REGISTRY_KEY);
  });
});

describe("the declared structure", () => {
  it("is served for the production-resolved key", () => {
    expect(structure()).toBeDefined();
    expect(structure()?.module).toBe("moves");
  });

  it("keeps the registry's six sections in order behind an executive opener", () => {
    expect(brief().recommendedStructure.map((s) => s.key)).toEqual([
      ...SECTION_KEYS,
    ]);
  });

  it("replaces the generic brief rather than extending it", () => {
    // The generic fall-through served twelve sections, two of which contradict
    // this deliverable's own scope discipline: an `operating_model` section the
    // registry's generation hint forbids, and a `phase_gates` section that puts
    // internal phase labels in a client document.
    const keys = brief().recommendedStructure.map((s) => s.key);
    expect(keys).not.toContain("operating_model");
    expect(keys).not.toContain("phase_gates");
    expect(keys).toHaveLength(7);
  });

  it("is a fixed shape, and every section is required", () => {
    expect(structure()?.fixedStructure).toBe(true);
    expect(structure()?.requiredSectionKeys).toEqual([...SECTION_KEYS]);
  });

  it("marks the two judgment sections mixed and the five fact sections governed", () => {
    // The split is the whole design: a bounded estimate's boundary, delta,
    // impact, controls and basis are client facts, while the summary and the
    // decision are ours. Written out so a section that quietly changes side
    // fails here rather than changing what the model is told to assert.
    expect(
      Object.fromEntries(
        brief().recommendedStructure.map((s) => [s.key, s.groundingMode]),
      ),
    ).toEqual({
      estimate_summary: "mixed",
      change_boundary: "governed_facts",
      current_to_proposed_delta: "governed_facts",
      people_adoption_impact: "governed_facts",
      controls_dependencies: "governed_facts",
      sizing_basis: "governed_facts",
      decision_conditions: "mixed",
    });
  });

  it("forbids the five things a bounded estimate must not become", () => {
    const forbidden = structure()?.forbiddenSectionTopics ?? [];
    for (const topic of [
      "future-state process map",
      "work instructions",
      "role-by-role operating model",
      "implementation specification",
      "execution plan",
    ]) {
      expect(forbidden).toContain(topic);
    }
  });

  it("declares no section a forbidden topic would strike out", () => {
    // `forbiddenSectionTopics` is matched case-insensitively against a
    // section's key AND title, and the plan sanitizer drops what matches — so a
    // structure that names a forbidden topic in one of its own titles deletes
    // its own section.
    const forbidden = structure()?.forbiddenSectionTopics ?? [];
    for (const section of structure()?.sections ?? []) {
      for (const topic of forbidden) {
        expect(section.key.toLowerCase()).not.toContain(topic.toLowerCase());
        expect(section.title.toLowerCase()).not.toContain(topic.toLowerCase());
      }
    }
  });
});

describe("the declared evidence landing sites", () => {
  it("are the only route the archetype's evidence has into this document", () => {
    // Not one section key is spelled the way `composeBrief` INFERS a landing
    // site, so dropping `archetypeEvidenceSectionKeys` takes the grounding to
    // zero rather than to a smaller number. That is what makes the field
    // load-bearing here instead of decorative.
    for (const key of SECTION_KEYS) {
      expect(INFERRED_SITE_RULE.test(key)).toBe(false);
    }
  });

  it("name sections this structure actually declares", () => {
    const declared = new Set((structure()?.sections ?? []).map((s) => s.key));
    for (const key of structure()?.archetypeEvidenceSectionKeys ?? []) {
      expect(declared).toContain(key);
    }
    expect(structure()?.archetypeEvidenceSectionKeys).toEqual([
      ...EVIDENCE_SECTIONS,
    ]);
  });

  it("carry every one of the archetype's evidence families", () => {
    const families = GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies;
    expect(families.length).toBeGreaterThan(0);
    const composed = brief().recommendedStructure;
    for (const key of EVIDENCE_SECTIONS) {
      const section = composed.find((s) => s.key === key);
      expect(section).toBeDefined();
      for (const family of families) {
        expect(section?.expectedEvidenceFamilies).toContain(family);
      }
    }
  });

  it("are the ONLY sections carrying them", () => {
    const families = GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies;
    const carrying = brief()
      .recommendedStructure.filter((s) =>
        families.every((f) => s.expectedEvidenceFamilies.includes(f)),
      )
      .map((s) => s.key);
    expect(carrying).toEqual([...EVIDENCE_SECTIONS]);
    for (const key of JUDGMENT_SECTIONS) {
      expect(carrying).not.toContain(key);
    }
  });
});

describe("the archetype's assets", () => {
  it("all reach the document, which none of them did before", () => {
    const pack = GOVERNED_DATA_FOUNDATION_PACK;
    const served = new Set(
      [...brief().expectedExhibits, ...brief().expectedTables].map(
        (a) => a.key,
      ),
    );
    for (const exhibit of pack.exhibits) expect(served).toContain(exhibit.key);
    for (const table of pack.tables) expect(served).toContain(table.key);
  });

  it("join this artifact type's own tables without displacing them", () => {
    const tables = brief().expectedTables.map((t) => t.key);
    for (const key of TABLE_KEYS) expect(tables).toContain(key);
    // Structure tables come first, so the artifact's own spine leads.
    expect(tables.slice(0, TABLE_KEYS.length)).toEqual([...TABLE_KEYS]);
  });

  it("declare table keys that collide with no pack and no sibling structure", () => {
    // A colliding key is silently dropped by `composeArtifactAssets` (first
    // entry per key wins), so this artifact would lose its own table to a
    // neighbour's and the loss would look like a successful join.
    const others = new Set<string>();
    for (const s of DELIVERABLE_STRUCTURES) {
      if (s.deliverableType === REGISTRY_KEY) continue;
      for (const a of [...(s.expectedExhibits ?? []), ...(s.expectedTables ?? [])]) {
        others.add(a.key);
      }
    }
    for (const a of [
      ...GOVERNED_DATA_FOUNDATION_PACK.exhibits,
      ...GOVERNED_DATA_FOUNDATION_PACK.tables,
    ]) {
      others.add(a.key);
    }
    for (const key of TABLE_KEYS) expect(others).not.toContain(key);
  });
});

/**
 * The guard that would have caught this deliverable's absence. The phase reach
 * suite sweeps `PHASE_CANONICAL_KEYS`; a route-gated key is invisible to it.
 * This sweeps what the ROUTE function can actually return, over every route and
 * every change-impact combination, so the next route-gated deliverable cannot
 * ship structureless in silence.
 */
describe("every P3 deliverable a route can ask for", () => {
  /**
   * Empty: every P3 deliverable a route can ask for now resolves a declared
   * structure. `planning_workshop_guide` was the last member — structureless
   * on the stated ground that what a guide may assert about a design still
   * being chosen was an untaken product judgment. It has since been authored
   * (`structure-phase-session-guides.ts`), on the basis that the deliverable
   * does not sit before that decision: its registry entry recaps an "approved
   * target state" and its quality profile prepares sessions "from the accepted
   * design", the same post-decision posture as `design_workshop_guide`, which
   * was always the precedent for taking the judgment.
   *
   * Kept as an empty literal rather than deleted so the case below still holds
   * in both directions: a new P3 route key without a structure fails here.
   */
  const STRUCTURELESS_BY_DECISION: readonly string[] = [];

  const routeKeys = (): Set<string> => {
    const keys = new Set<string>();
    const impacts = CHANGE_IMPACT_LEVELS.filter((l) => l !== "unknown");
    for (const route of SOLUTION_ROUTES) {
      if (route === "unresolved") continue;
      for (const workflowChange of impacts) {
        for (const roleAccountabilityChange of impacts) {
          for (const key of phaseCanonicalKeysForRoute(3, {
            ...({} as ConfirmedSolutionRoute),
            route,
            workflowChange,
            roleAccountabilityChange,
          })) {
            keys.add(key);
          }
        }
      }
    }
    for (const key of phaseCanonicalKeysForRoute(3, null)) keys.add(key);
    return keys;
  };

  it("includes the bounded-route brief, which the canonical list does not", () => {
    expect(routeKeys()).toContain(REGISTRY_KEY);
  });

  it("has a declared structure, or is excluded for a stated reason", () => {
    const missing = [...routeKeys()]
      .filter((key) => !getDeliverableStructure("moves", orchestratorDeliverableType(key)))
      .sort();
    expect(missing).toEqual([...STRUCTURELESS_BY_DECISION].sort());
  });

  it("grounds the archetype's evidence wherever it has a structure", () => {
    const families = GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies;
    const ungrounded: string[] = [];
    for (const key of routeKeys()) {
      const type = orchestratorDeliverableType(key);
      if (!getDeliverableStructure("moves", type)) continue;
      const composed = getArtifactBrief({
        ...amsRfpRequest,
        module: "moves",
        useCaseArchetype: ARCHETYPE,
        deliverableType: type,
      } as DeliverableIntelligenceRequest).recommendedStructure;
      if (
        !composed.some((s) =>
          families.every((f) => s.expectedEvidenceFamilies.includes(f)),
        )
      ) {
        ungrounded.push(key);
      }
    }
    expect(ungrounded).toEqual([]);
  });
});

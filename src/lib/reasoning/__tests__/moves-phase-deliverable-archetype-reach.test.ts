/**
 * Does a declared archetype actually reach what a Move produces?
 *
 * A Move's deliverable brief is composed from two halves: a declared
 * STRUCTURE (the section flow for that deliverable type) and the archetype
 * PACK (the exhibits, tables and evidence families for that use case). The
 * composition lives in `composeBrief`, and it returns null when the
 * deliverable type has no declared structure — at which point the registry
 * falls through to a GENERIC brief that never resolves a pack at all.
 *
 * That fall-through is silent and it is expensive. A Move that declares an
 * archetype, collects its required evidence families through Discover, and
 * gets them approved will still produce a structureless deliverable that
 * grounds NONE of them, carries NONE of the archetype's exhibits, and gets a
 * single generic risk register in place of the archetype's tables. Capture
 * completes, the build succeeds, the gate can clear — and the document cannot
 * see the evidence the Move was built to gather.
 *
 * Nothing pinned this. The sibling guard
 * (`phase-gate-deliverable-reachability`) pins which deliverable TYPES a phase
 * builds against what its gate criteria ACCEPT; it says nothing about whether
 * those types have a structure for the pack to compose with. The two halves
 * live in different files, neither mentions the other, and both are actively
 * edited.
 *
 * So this pins the join in both directions:
 *
 *  - Every phase deliverable that HAS a structure and takes archetype assets
 *    must receive the pack whole — all its exhibits, all its tables, and at
 *    least one section grounding its evidence families. This is what regresses
 *    if a structure loses its landing sites or the join is rewired.
 *
 *  - The set of phase deliverables with NO structure is pinned as a literal
 *    and checked both ways, so it can only ever shrink. Authoring one of them
 *    fails this test until the key is removed from the list, and adding a new
 *    phase deliverable without a structure fails it too.
 *
 * The literals are written out rather than read off the modules under test: an
 * expectation derived from the declaration it is checking cannot see a rename.
 */
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { GOVERNED_DATA_FOUNDATION_PACK } from "@/lib/deliverables/orchestrator/briefs/archetype-pack-governed-data-foundation";
import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";
import { PHASE_CANONICAL_KEYS } from "@/lib/programs/deliverable-registry";

/**
 * The archetype under test is the one a Move declares to collect a governed
 * data foundation: it is the only archetype whose pack and discovery blueprint
 * name the SAME evidence family ids, so it is the one where "the pack reached
 * the brief" and "approved evidence reached the section" are the same claim.
 */
const ARCHETYPE = "governed_data_foundation";

/**
 * Written out, not read from `PHASE_CANONICAL_KEYS`: reading the subject back
 * would let a key silently leave a phase without this test noticing.
 */
const PHASE_DELIVERABLES: Record<number, string[]> = {
  1: ["charter", "discovery_plan"],
  2: ["discovery_report", "root_cause_worksheet", "design_workshop_guide"],
  3: [
    "target_state_architecture",
    "solution_design",
    "operating_model_design",
    "requirements_traceability",
    "sourcing_strategy",
    "planning_workshop_guide",
  ],
  4: [
    "execution_roadmap",
    "business_case",
    "financial_model",
    "tower_metrics_plan",
    "readiness_and_change_plan",
    "mobilization_workshop_guide",
  ],
  5: ["handoff_package", "value_measurement_contract", "execution_kickoff_guide"],
};

/**
 * Deliverables that have a structure but deliberately take no archetype
 * exhibits or tables. Each is excluded for a stated reason, so that losing the
 * exclusion reads as a change rather than as noise:
 *
 *  - `charter` and `design_workshop_guide` are excluded inside `composeBrief`
 *    itself (`allowArchetypeAssets`) — a P1 approval instrument and a workshop
 *    agenda are not places to assert client facts.
 *  - `discovery_plan` never reaches `composeBrief`: it has a dedicated builder
 *    that grounds its evidence section from the discovery BLUEPRINT instead,
 *    which is the catalog that decides what Discover collects.
 */
const ASSET_FREE_BY_DESIGN = [
  "charter",
  "design_workshop_guide",
  "discovery_plan",
] as const;

/**
 * The archetype's exhibits, tables and evidence families, written out as
 * literals rather than read back from the pack. Reading them off the pack made
 * every assertion below self-fulfilling: dropping an exhibit from the pack
 * dropped it from the expectation too, and the suite stayed green. The pack is
 * held to these lists by `the archetype pack still declares what this test
 * expects` below, so a deliberate change to the pack fails here once and is
 * updated in one place.
 */
const PACK_EXHIBIT_KEYS = [
  "domain_certification_readiness",
  "target_governed_foundation_architecture",
  "source_to_use_control_chain",
  "certification_sequence_and_unlocks",
  "consumption_control_gate",
] as const;

const PACK_TABLE_KEYS = [
  "domain_ownership_register",
  "certified_definitions",
  "quality_rule_coverage",
  "source_access_posture",
  "identity_spine_coverage",
  "control_attestation",
  "measurement_ownership",
  "value_baseline_conditions",
  "risk_register",
] as const;

const PACK_EVIDENCE_FAMILIES = [
  "data_governance_ownership",
  "semantic_layer_certification",
  "data_lineage_audit_trail",
  "data_quality_rules",
  "source_system_data_access",
  "platform_architecture_readiness",
  "master_identity_resolution",
  "privacy_security_controls",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
] as const;

/**
 * Phase deliverables with NO declared structure, so `composeBrief` returns
 * null and the generic brief is used. Measured, not aspirational — this is the
 * present cost, and every entry is a deliverable that cannot cite the
 * archetype's evidence. All three of Mobilize's deliverables are here, which
 * is why a Move's hand-off to Tower is the weakest-grounded thing it produces.
 *
 * This list may only shrink. Authoring a structure for one of these makes the
 * "genuinely has no structure" assertion below fail until the key is removed.
 */
const STRUCTURELESS = [
  "operating_model_design",
  "planning_workshop_guide",
  "execution_roadmap",
  "financial_model",
  "tower_metrics_plan",
  "mobilization_workshop_guide",
  "handoff_package",
  "value_measurement_contract",
  "execution_kickoff_guide",
] as const;

const ALL_PHASE_DELIVERABLES = Object.values(PHASE_DELIVERABLES).flat();

function briefFor(deliverableType: string) {
  const req: DeliverableIntelligenceRequest = {
    ...amsRfpRequest(),
    module: "moves",
    deliverableType,
    useCaseArchetype: ARCHETYPE,
  };
  return getArtifactBrief(req);
}

describe("a Move's phase deliverables and the archetype that should reach them", () => {
  it("still builds the deliverables this test was written against", () => {
    // The subject list is a literal, so it has to be checked against the real
    // registry or it quietly stops describing the product.
    for (const [phase, keys] of Object.entries(PHASE_DELIVERABLES)) {
      expect(PHASE_CANONICAL_KEYS[Number(phase)]).toEqual(keys);
    }
  });

  it("the archetype pack still declares what this test expects", () => {
    // The one place the literals above are reconciled with the real pack. A
    // rename or a dropped exhibit fails HERE, loudly and once, instead of
    // quietly relaxing every expectation that used to depend on it.
    expect(GOVERNED_DATA_FOUNDATION_PACK.exhibits.map((e) => e.key).sort()).toEqual(
      [...PACK_EXHIBIT_KEYS].sort(),
    );
    expect(GOVERNED_DATA_FOUNDATION_PACK.tables.map((t) => t.key).sort()).toEqual(
      [...PACK_TABLE_KEYS].sort(),
    );
    expect([...GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies].sort()).toEqual(
      [...PACK_EVIDENCE_FAMILIES].sort(),
    );
  });

  describe("every phase deliverable that takes archetype assets receives the pack whole", () => {
    const expected = ALL_PHASE_DELIVERABLES.filter(
      (key) =>
        !(ASSET_FREE_BY_DESIGN as readonly string[]).includes(key) &&
        !(STRUCTURELESS as readonly string[]).includes(key),
    );

    it("is a non-empty set, so the cases below are not vacuous", () => {
      expect(expected.length).toBeGreaterThan(0);
    });

    it.each(expected)("%s carries every archetype exhibit", (key) => {
      const carried = new Set(
        (briefFor(key).expectedExhibits ?? []).map((exhibit) => exhibit.key),
      );
      for (const exhibitKey of PACK_EXHIBIT_KEYS) {
        expect(carried).toContain(exhibitKey);
      }
    });

    it.each(expected)("%s carries every archetype table", (key) => {
      const carried = new Set(
        (briefFor(key).expectedTables ?? []).map((table) => table.key),
      );
      for (const tableKey of PACK_TABLE_KEYS) {
        expect(carried).toContain(tableKey);
      }
    });

    it.each(expected)("%s grounds the archetype's evidence somewhere", (key) => {
      const families = new Set<string>(PACK_EVIDENCE_FAMILIES);
      const groundingSections = briefFor(key).recommendedStructure.filter(
        (section) =>
          section.expectedEvidenceFamilies.some((family) =>
            families.has(family),
          ),
      );
      // At least one section must assert client facts from this archetype,
      // otherwise approved Discover evidence lands nowhere in the document.
      expect(groundingSections.length).toBeGreaterThan(0);
    });
  });

  describe("the structureless set can only shrink", () => {
    it.each(STRUCTURELESS)(
      "%s genuinely still has no declared structure",
      (key) => {
        // Fails once a structure is authored — which is the point. Remove the
        // key from STRUCTURELESS at that moment and the case above starts
        // holding it to the full pack instead.
        expect(getDeliverableStructure("moves", key)).toBeUndefined();
      },
    );

    it("no phase deliverable outside the list is missing a structure", () => {
      const missing = ALL_PHASE_DELIVERABLES.filter(
        (key) => getDeliverableStructure("moves", key) === undefined,
      );
      expect(missing.sort()).toEqual([...STRUCTURELESS].sort());
    });
  });

  it("states the cost: a structureless deliverable gets none of the archetype's exhibits", () => {
    // Pinned so the fall-through is a recorded consequence rather than an
    // assumption. If a generic brief ever does start carrying archetype
    // exhibits, this is the case that says so.
    for (const key of STRUCTURELESS) {
      const carried = new Set(
        (briefFor(key).expectedExhibits ?? []).map((exhibit) => exhibit.key),
      );
      for (const exhibitKey of PACK_EXHIBIT_KEYS) {
        expect(carried).not.toContain(exhibitKey);
      }
    }
  });
});

/**
 * The declared governed-data-foundation archetype, and the join that makes it
 * work.
 *
 * Before this archetype existed, a Move that DECLARED
 * `governed_data_foundation` resolved to `DEFAULT_ARCHETYPE_ID` (AI-PDLC),
 * whose hard `diagnose` instruments are `eng_performance_dora`,
 * `it_systems_landscape` and `it_org_structure` — three TENANT-scoped `tower_*`
 * tables. `currentStateReadiness.hardGaps` is what the capture screen counts
 * into the Approve & Build blocker at P2, so the phase was gated on evidence
 * this Move neither supplies nor should supply, while the eleven families it
 * does collect were graded by nothing.
 *
 * The cases below pin, in order: that a declaration resolves (and outranks the
 * inference that previously won), that the family keys still join to the
 * blueprint in BOTH directions, that P2 asks for the blueprint's own families
 * at the blueprint's own severities, that no `tower_*` instrument is hard at
 * P2, and that a Move with no declaration resolves exactly as before.
 */

import {
  ARCHETYPE_REGISTRY,
  DEFAULT_ARCHETYPE_ID,
  GOVERNED_DATA_FOUNDATION,
  archetypeForDeclaredId,
  getArchetype,
  resolveProgramArchetype,
} from "@/lib/programs/archetypes/registry";
import { resolveArchetypeRequirements } from "@/lib/programs/archetypes/resolver";
import type { MoveProfile } from "@/lib/programs/current-state-readiness";
import { getDiscoveryBlueprint } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

const DECLARED_ID = "governed_data_foundation";

/** An undiscovered estate: every estate-scoped predicate sees "unknown". */
const BARE_PROFILE: MoveProfile = {
  useCaseArchetype: "unknown",
  teamArchetypes: [],
  deliveryMaturity: "unknown",
  orgTopology: "unknown",
  cloudPosture: "unknown",
  existingAiTools: [],
  provenance: {},
} as unknown as MoveProfile;

/**
 * The classification text the phase page builds for the demo Move once the
 * declaration job has written `charter.classification.archetype`. It carries
 * the declared id AND the healthcare vocabulary a data-foundation Move
 * necessarily names, which is what the inference path keyed on.
 */
const DECLARED_CLASSIFICATION = [
  DECLARED_ID,
  "Certify a governed data foundation before any AI/LLM automation is claimed",
  "source system data access (EMR, claims, pharmacy, marts)",
  "master / entity identity resolution (patient, member, provider spine)",
].join(" ");

function blueprintFamilies(): Array<{ id: string; required: boolean }> {
  const blueprint = getDiscoveryBlueprint(DECLARED_ID) as unknown as {
    evidenceFamilies: Array<{ id: string; required?: boolean }>;
  } | null;
  if (!blueprint) throw new Error(`no discovery blueprint for ${DECLARED_ID}`);
  return blueprint.evidenceFamilies.map((family) => ({
    id: family.id,
    required: family.required === true,
  }));
}

function diagnoseRequirements() {
  return resolveArchetypeRequirements(
    GOVERNED_DATA_FOUNDATION,
    "diagnose",
    BARE_PROFILE,
  );
}

describe("governed data foundation — registration and declared resolution", () => {
  it("is in the registry under its own id", () => {
    expect(GOVERNED_DATA_FOUNDATION.id).toBe("GOVERNED_DATA_FOUNDATION");
    expect(ARCHETYPE_REGISTRY[GOVERNED_DATA_FOUNDATION.id]).toBe(
      GOVERNED_DATA_FOUNDATION,
    );
    expect(getArchetype("GOVERNED_DATA_FOUNDATION")).toBe(
      GOVERNED_DATA_FOUNDATION,
    );
  });

  it("resolves from the DECLARED discovery-blueprint id", () => {
    expect(archetypeForDeclaredId(DECLARED_ID)).toBe(GOVERNED_DATA_FOUNDATION);
  });

  it("resolves from a declared id regardless of case or padding", () => {
    expect(archetypeForDeclaredId("  Governed_Data_Foundation ")).toBe(
      GOVERNED_DATA_FOUNDATION,
    );
  });

  it("answers undefined for a declared id that names nothing", () => {
    expect(archetypeForDeclaredId("not_an_archetype")).toBeUndefined();
    expect(archetypeForDeclaredId(null)).toBeUndefined();
    expect(archetypeForDeclaredId("")).toBeUndefined();
    expect(archetypeForDeclaredId("   ")).toBeUndefined();
  });

  it("lets the declaration OUTRANK the inference that previously won", () => {
    // Which WRONG archetype the inference picks depends on incidental words: a
    // data-foundation Move must name the systems it governs (EMR, claims,
    // pharmacy) and the identities it resolves (patient, member, provider), and
    // those are another archetype's vocabulary. The defect is not which one
    // wins — it is that the gate then asks for a foreign archetype's evidence.
    const inferred = resolveProgramArchetype({
      archetype: "platform_modernization",
      classification: DECLARED_CLASSIFICATION,
      name: "Governed Data Foundation for AI Automation",
    });
    expect(inferred.id).not.toBe("GOVERNED_DATA_FOUNDATION");

    const blueprintIds = new Set(
      blueprintFamilies().map((family) => family.id),
    );
    const inferredHard = resolveArchetypeRequirements(
      inferred,
      "diagnose",
      BARE_PROFILE,
    )
      .filter((requirement) => requirement.severity === "hard")
      .map((requirement) => requirement.family.key);
    expect(inferredHard.length).toBeGreaterThan(0);
    // Nothing the evidence pack supplies can close ANY of those hard gaps:
    // the pack is keyed by the blueprint's family ids.
    expect(
      inferredHard.filter((key) => blueprintIds.has(key)),
    ).toEqual([]);

    const declared = resolveProgramArchetype({
      archetype: "platform_modernization",
      classification: DECLARED_CLASSIFICATION,
      declaredArchetypeId: DECLARED_ID,
      name: "Governed Data Foundation for AI Automation",
    });
    expect(declared.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("lets a declaration outrank an exact legacy registry id too", () => {
    const declared = resolveProgramArchetype({
      archetype: "CONTACT_CENTER_AGENT_ASSIST",
      declaredArchetypeId: DECLARED_ID,
    });
    expect(declared.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("leaves an UNDECLARED Move resolving exactly as before", () => {
    // The inference path is untouched: no new rule, no reordering. A Move that
    // declares nothing keeps the archetype it had, including the bare default.
    expect(
      resolveProgramArchetype({
        archetype: "platform_modernization",
        name: "A Move that declares nothing",
      }).id,
    ).toBe(DEFAULT_ARCHETYPE_ID);

    // A declared id that names nothing must not change the answer either.
    expect(
      resolveProgramArchetype({
        classification: "contact center member service prior authorization",
        declaredArchetypeId: "unknown_archetype",
      }).id,
    ).toBe("CONTACT_CENTER_AGENT_ASSIST");

    expect(
      resolveProgramArchetype({ classification: "sourcing renegotiation" }).id,
    ).toBe("IT_SOURCING_EVENT");
  });
});

describe("governed data foundation — the blueprint join", () => {
  it("declares a family for EVERY blueprint family id, and no others", () => {
    const blueprintIds = blueprintFamilies()
      .map((family) => family.id)
      .sort();
    const archetypeKeys = GOVERNED_DATA_FOUNDATION.evidenceFamilies
      .map((family) => family.key)
      .sort();
    // Both directions: a blueprint family with no instrument is evidence graded
    // by nothing, and an instrument with no blueprint family is a gap no upload
    // can ever close (the key is the join `resolveDocFamilyReviews` uses).
    expect(archetypeKeys).toEqual(blueprintIds);
  });

  it("writes the eleven required family ids out as literals", () => {
    // Read off the blueprint these would be self-fulfilling: a rename on both
    // sides would keep the pair consistent and still break the evidence pack,
    // whose family_keys are these strings.
    expect(
      GOVERNED_DATA_FOUNDATION.evidenceFamilies
        .map((family) => family.key)
        .sort(),
    ).toEqual(
      [
        "change_adoption_owner",
        "data_governance_ownership",
        "data_lineage_audit_trail",
        "data_quality_rules",
        "finance_baseline_value_plan",
        "master_identity_resolution",
        "measurement_owner_cadence",
        "model_risk_responsible_ai_controls",
        "platform_architecture_readiness",
        "privacy_security_controls",
        "semantic_layer_certification",
        "source_system_data_access",
      ].sort(),
    );
  });

  it("carries no backing store on any family", () => {
    // Every family is MOVE-scoped documentary evidence. A `backing` would send
    // the instrument to a tenant-wide table count instead of this Move's
    // approvals — which is the defect being fixed, reintroduced.
    for (const family of GOVERNED_DATA_FOUNDATION.evidenceFamilies) {
      expect(family.backing).toBeUndefined();
    }
  });

  it("gives every family a reason and a source hint", () => {
    for (const family of GOVERNED_DATA_FOUNDATION.evidenceFamilies) {
      expect(family.label.trim().length).toBeGreaterThan(0);
      expect(family.whyNeeded.trim().length).toBeGreaterThan(0);
      expect(family.sourceDocHint.trim().length).toBeGreaterThan(0);
      expect(family.acceptedFormats.length).toBeGreaterThan(0);
    }
  });
});

describe("governed data foundation — what P2 asks for", () => {
  it("hard-requires exactly the blueprint's required families at diagnose", () => {
    const required = blueprintFamilies()
      .filter((family) => family.required)
      .map((family) => family.id)
      .sort();
    expect(required).toHaveLength(11);

    const hard = diagnoseRequirements()
      .filter((requirement) => requirement.severity === "hard")
      .map((requirement) => requirement.family.key)
      .sort();
    expect(hard).toEqual(required);
  });

  it("keeps the blueprint's optional family soft at diagnose", () => {
    const soft = diagnoseRequirements()
      .filter((requirement) => requirement.severity === "soft")
      .map((requirement) => requirement.family.key);
    expect(soft).toEqual(["change_adoption_owner"]);
  });

  it("requires NO tower_* instrument at diagnose", () => {
    // The defect in one assertion. AI-PDLC's diagnose set is
    // eng_performance_dora / it_systems_landscape / it_org_structure, all
    // tower_*-backed and tenant-scoped; none of them may be reachable here.
    for (const requirement of diagnoseRequirements()) {
      expect(requirement.family.backing).toBeUndefined();
    }
    const keys = diagnoseRequirements().map(
      (requirement) => requirement.family.key,
    );
    for (const foreign of [
      "eng_performance_dora",
      "it_systems_landscape",
      "it_org_structure",
    ]) {
      expect(keys).not.toContain(foreign);
    }
  });

  it("resolves every declared requirement — none is silently skipped", () => {
    // `resolveArchetypeRequirements` drops a requirement whose family has no
    // spec in the archetype's own `evidenceFamilies` (`if (!spec) continue`),
    // so a typo would quietly shrink the gate rather than fail.
    const phases = ["charter", "diagnose"] as const;
    for (const phase of phases) {
      const declared = GOVERNED_DATA_FOUNDATION.phaseModel.find(
        (entry) => entry.phase === phase,
      );
      expect(declared).toBeDefined();
      const resolved = resolveArchetypeRequirements(
        GOVERNED_DATA_FOUNDATION,
        phase,
        BARE_PROFILE,
      );
      expect(resolved).toHaveLength(declared?.requiredEvidence.length ?? -1);
    }
  });

  it("adds no hard requirement before diagnose or after it", () => {
    // A declaration made for P2's benefit must not newly block P1, and the
    // later phases consume what P2 certified rather than demanding new
    // families — the shape every other archetype in the registry has.
    for (const phase of [
      "originate",
      "charter",
      "design",
      "roadmap_business_case",
      "mobilize",
    ] as const) {
      const hard = resolveArchetypeRequirements(
        GOVERNED_DATA_FOUNDATION,
        phase,
        BARE_PROFILE,
      ).filter((requirement) => requirement.severity === "hard");
      expect(hard).toEqual([]);
    }
  });

  it("does not grade a data foundation on engineering delivery", () => {
    const framing = GOVERNED_DATA_FOUNDATION.agentGuidance.systemFraming;
    expect(framing).toMatch(/do not require dora/i);
    expect(GOVERNED_DATA_FOUNDATION.agentGuidance.requiresGroundedAnswer).toBe(
      true,
    );
  });
});

// Every archetype a human can DECLARE must reach the registry through the
// declared-identity arm — not through keyword inference.
//
// The bridge map and the blueprint catalog live in different module graphs on
// purpose (see `declared-archetype-bridge.ts`), so nothing in either file can
// assert they agree. This suite is that assertion, and it is the case that
// fails when a sixth blueprint is shipped without a bridge entry.
//
// The defect this pins: of the five declarable blueprint ids only
// `governed_data_foundation` was bridged. The other four fell through to the
// registry's keyword rules, which spell their tokens with SPACES ("contact
// center", "commercial lending") while a blueprint id spells them with
// underscores — so `healthcare_contact_center_agent_assist` and
// `financial_services_commercial_lending_agent_assist` both resolved to
// `AI_PRODUCT_DEVELOPMENT_LIFECYCLE`, handing a declared Move the wrong
// evidence framework in a readiness report that rendered perfectly.

import {
  DECLARED_ARCHETYPE_BRIDGE,
  REGISTRY_ARCHETYPES_WITH_NO_DECLARABLE_ID,
  registryArchetypeIdForDeclaredId,
} from "@/lib/programs/archetypes/declared-archetype-bridge";
import {
  archetypeForDeclaredId,
  getArchetype,
  listArchetypes,
  resolveProgramArchetype,
  DEFAULT_ARCHETYPE_ID,
} from "@/lib/programs/archetypes/registry";
import { listEffectiveDiscoveryArchetypeOptions } from "@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface";

/** The shipped catalog, with no configured source declared. */
const shippedBlueprintIds = (): string[] =>
  listEffectiveDiscoveryArchetypeOptions({})
    .map((option) => option.blueprintId)
    .sort();

describe("declared archetype bridge — coverage of the declaration surface", () => {
  it("bridges every archetype id the declaration surface offers", () => {
    const unbridged = shippedBlueprintIds().filter(
      (id) => registryArchetypeIdForDeclaredId(id) === null,
    );
    expect(unbridged).toEqual([]);
  });

  it("resolves every declarable id to a real registry archetype", () => {
    const unresolved = shippedBlueprintIds().filter(
      (id) => archetypeForDeclaredId(id) === undefined,
    );
    expect(unresolved).toEqual([]);
  });

  it("maps every declarable id to the archetype a reader would name", () => {
    const resolved = Object.fromEntries(
      shippedBlueprintIds().map((id) => [
        id,
        archetypeForDeclaredId(id)?.id ?? "UNRESOLVED",
      ]),
    );
    expect(resolved).toEqual({
      ai_operations_customer_digital: "AI_OPERATIONS_DECISION_SUPPORT",
      financial_services_commercial_lending_agent_assist:
        "COMMERCIAL_LENDING_AGENT_ASSIST",
      general_default: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
      governed_data_foundation: "GOVERNED_DATA_FOUNDATION",
      healthcare_contact_center_agent_assist: "CONTACT_CENTER_AGENT_ASSIST",
    });
  });

  it("bridges no id the declaration surface does not offer", () => {
    // A bridge entry for an unofferable id is dead weight that would make the
    // coverage assertion above pass for the wrong reason.
    const offered = new Set(shippedBlueprintIds());
    const orphans = Object.keys(DECLARED_ARCHETYPE_BRIDGE).filter(
      (id) => !offered.has(id),
    );
    expect(orphans).toEqual([]);
  });

  it("points every bridge value at an archetype the registry holds", () => {
    const dangling = Object.entries(DECLARED_ARCHETYPE_BRIDGE).filter(
      ([, registryId]) => getArchetype(registryId) === undefined,
    );
    expect(dangling).toEqual([]);
  });

  it("accounts for every registry archetype as declarable or deliberately not", () => {
    const bridged = new Set(Object.values(DECLARED_ARCHETYPE_BRIDGE));
    const undeclarable = listArchetypes()
      .map((archetype) => archetype.id)
      .filter((id) => !bridged.has(id))
      .sort();
    expect(undeclarable).toEqual(
      [...REGISTRY_ARCHETYPES_WITH_NO_DECLARABLE_ID].sort(),
    );
  });
});

describe("declared archetype bridge — reading a declared token", () => {
  it("is case-insensitive and tolerates whitespace", () => {
    expect(registryArchetypeIdForDeclaredId("  GOVERNED_Data_Foundation ")).toBe(
      "GOVERNED_DATA_FOUNDATION",
    );
    expect(
      archetypeForDeclaredId(" Healthcare_Contact_Center_Agent_Assist ")?.id,
    ).toBe("CONTACT_CENTER_AGENT_ASSIST");
  });

  it("answers null for nothing declared", () => {
    expect(registryArchetypeIdForDeclaredId(null)).toBeNull();
    expect(registryArchetypeIdForDeclaredId(undefined)).toBeNull();
    expect(registryArchetypeIdForDeclaredId("   ")).toBeNull();
  });

  it("answers null for an inherited object key", () => {
    // A bare index would answer with `Object`'s own property here, and a
    // truthy non-string would then be handed to `getArchetype`.
    expect(registryArchetypeIdForDeclaredId("constructor")).toBeNull();
    expect(registryArchetypeIdForDeclaredId("toString")).toBeNull();
    expect(archetypeForDeclaredId("constructor")).toBeUndefined();
  });

  it("answers null for a token that names no blueprint", () => {
    // Not an error: resolution falls through to inference exactly as before.
    expect(registryArchetypeIdForDeclaredId("not_an_archetype")).toBeNull();
    expect(archetypeForDeclaredId("not_an_archetype")).toBeUndefined();
  });

  it("still resolves a declaration written as a registry id", () => {
    // The registry-id arm runs first and is case-SENSITIVE, unchanged.
    expect(archetypeForDeclaredId("CONTACT_CENTER_AGENT_ASSIST")?.id).toBe(
      "CONTACT_CENTER_AGENT_ASSIST",
    );
  });
});

describe("a declaration outranks the inference path", () => {
  // `resolveMoveArchetypeForProgram` puts the declared token into BOTH the
  // declared argument and the classification haystack (the declaration is read
  // out of `charter.classification.archetype`), so these inputs are the shape
  // the product actually produces.
  it.each([
    ["healthcare_contact_center_agent_assist", "CONTACT_CENTER_AGENT_ASSIST"],
    [
      "financial_services_commercial_lending_agent_assist",
      "COMMERCIAL_LENDING_AGENT_ASSIST",
    ],
    ["ai_operations_customer_digital", "AI_OPERATIONS_DECISION_SUPPORT"],
    ["governed_data_foundation", "GOVERNED_DATA_FOUNDATION"],
  ])("honours a declared %s", (declaredArchetypeId, expected) => {
    expect(
      resolveProgramArchetype({
        declaredArchetypeId,
        classification: declaredArchetypeId,
      }).id,
    ).toBe(expected);
  });

  it("beats a competing keyword in the classification text", () => {
    // Without the bridge the haystack decides. "sourcing" and "vendor" both
    // hit an inference rule, so a declared Move whose charter happens to
    // mention a vendor renegotiation would be re-labelled by that prose.
    expect(
      resolveProgramArchetype({
        declaredArchetypeId: "governed_data_foundation",
        archetype: "platform_modernization",
        classification:
          "Includes a vendor renegotiation and a sourcing event for the warehouse contract.",
        name: "Data platform sourcing",
      }).id,
    ).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("leaves the default-blueprint answer exactly where inference had it", () => {
    // `general_default` means "no particular shape declared". Routing it
    // through the declared arm must not move the answer.
    expect(archetypeForDeclaredId("general_default")?.id).toBe(
      DEFAULT_ARCHETYPE_ID,
    );
  });

  it("still infers for a Move that declared nothing", () => {
    expect(
      resolveProgramArchetype({
        classification: "A contact center agent assist pilot for member service",
      }).id,
    ).toBe("CONTACT_CENTER_AGENT_ASSIST");
    expect(resolveProgramArchetype({}).id).toBe(DEFAULT_ARCHETYPE_ID);
  });
});

/**
 * Which declaration-bearing field is read, when a Move has two.
 *
 * `functionPackKey` and `charter.classification.archetype` hold different id
 * spaces. The sibling `move-archetype-declared-wiring.test.ts` exercises each
 * field ALONE (every one of its programs sets `functionPackKey: null`), so the
 * combination — a pack key that names no archetype beside a charter declaration
 * that names one — was pinned in neither direction before these cases.
 */

import {
  charterDeclaredArchetypeId,
  resolveDeclaredArchetypeId,
} from "@/lib/programs/archetypes/declared-archetype-precedence";
import { DECLARED_ARCHETYPE_BRIDGE } from "@/lib/programs/archetypes/declared-archetype-bridge";

/**
 * Function-pack keys that appear on Moves in this repository. Named as
 * literals: the point of the list is that these are a DIFFERENT id space from
 * blueprint ids, so deriving it from the bridge would assume the conclusion.
 */
const SHIPPED_PACK_KEYS = [
  "healthcare_member_services",
  "customer_care",
  "legal_operations",
  "data_platform_function_pack",
  "clinical_operations_documentation",
  "population_health_value_based_care",
  "finance_treasury_alm",
  "fraud_financial_crime",
  "pricing_promotions",
  "member_service_agent_assist",
  "irops_recovery",
  "customer_servicing_contact_center",
  "retail.contact_center",
] as const;

describe("a pack key that names no archetype cannot shadow a declaration", () => {
  it.each(SHIPPED_PACK_KEYS)(
    "reads the charter declaration past %s",
    (packKey) => {
      expect(
        resolveDeclaredArchetypeId({
          functionPackKey: packKey,
          charterClassificationArchetype: "governed_data_foundation",
        }),
      ).toBe("governed_data_foundation");
    },
  );

  it("covers pack keys that none of them is itself a blueprint id", () => {
    // If one of the literals above were bridged, its case would be asserting
    // the OPPOSITE rule (pack key wins) while still passing.
    for (const packKey of SHIPPED_PACK_KEYS) {
      expect(Object.hasOwn(DECLARED_ARCHETYPE_BRIDGE, packKey)).toBe(false);
    }
  });

  it("shadows nothing for EVERY declarable archetype, not just one", () => {
    // The upstream origination guard suppresses the function-pack guess for
    // exactly one archetype id. This rule is not keyed to any id.
    for (const blueprintId of Object.keys(DECLARED_ARCHETYPE_BRIDGE)) {
      expect(
        resolveDeclaredArchetypeId({
          functionPackKey: "healthcare_member_services",
          charterClassificationArchetype: blueprintId,
        }),
      ).toBe(blueprintId);
    }
  });
});

describe("the field order that still holds", () => {
  it("prefers the pack key when IT names an archetype", () => {
    expect(
      resolveDeclaredArchetypeId({
        functionPackKey: "governed_data_foundation",
        charterClassificationArchetype: "healthcare_contact_center_agent_assist",
      }),
    ).toBe("governed_data_foundation");
  });

  it("prefers the pack key when NEITHER names an archetype", () => {
    // Unchanged inference seed: the first non-empty value, exactly as before.
    expect(
      resolveDeclaredArchetypeId({
        functionPackKey: "legal_operations",
        charterClassificationArchetype: "some_unknown_thing",
      }),
    ).toBe("legal_operations");
  });

  it("reads a lone pack key, bridged or not", () => {
    expect(
      resolveDeclaredArchetypeId({ functionPackKey: "governed_data_foundation" }),
    ).toBe("governed_data_foundation");
    expect(
      resolveDeclaredArchetypeId({ functionPackKey: "legal_operations" }),
    ).toBe("legal_operations");
  });

  it("reads a lone charter declaration", () => {
    expect(
      resolveDeclaredArchetypeId({
        charterClassificationArchetype: "governed_data_foundation",
      }),
    ).toBe("governed_data_foundation");
  });

  it("answers null when neither field carries anything", () => {
    expect(resolveDeclaredArchetypeId({})).toBeNull();
    expect(
      resolveDeclaredArchetypeId({
        functionPackKey: "   ",
        charterClassificationArchetype: "",
      }),
    ).toBeNull();
  });

  it("ignores a non-string in either field", () => {
    expect(
      resolveDeclaredArchetypeId({
        functionPackKey: 12345,
        charterClassificationArchetype: { archetype: "governed_data_foundation" },
      }),
    ).toBeNull();
  });

  it("trims before matching, so a padded declaration still names its archetype", () => {
    expect(
      resolveDeclaredArchetypeId({
        functionPackKey: "customer_care",
        charterClassificationArchetype: "  governed_data_foundation  ",
      }),
    ).toBe("governed_data_foundation");
  });
});

describe("charterDeclaredArchetypeId", () => {
  it("reads the declaration out of a classification object", () => {
    expect(
      charterDeclaredArchetypeId({
        classification: { archetype: "governed_data_foundation" },
      }),
    ).toBe("governed_data_foundation");
  });

  it("answers null for a classification that is a bare string", () => {
    // Older Moves store a string here. Reading `.archetype` off it must not
    // throw, and such a charter declares nothing.
    expect(
      charterDeclaredArchetypeId({ classification: "governed data foundation" }),
    ).toBeNull();
  });

  it("answers null for an absent charter or classification", () => {
    expect(charterDeclaredArchetypeId(null)).toBeNull();
    expect(charterDeclaredArchetypeId(undefined)).toBeNull();
    expect(charterDeclaredArchetypeId({})).toBeNull();
    expect(charterDeclaredArchetypeId({ classification: null })).toBeNull();
  });
});

import {
  DISCOVERY_BLUEPRINT_CATALOG,
  getDiscoveryBlueprint,
  resolveDeclaredDiscoveryBlueprint,
} from "../briefs/discovery-blueprint";

// A text blob that keyword-inference routes to the healthcare contact-center
// blueprint — the exact mis-route that sent a data-foundation Move there.
const HEALTHCARE_CONTACT_CENTER_BLOB =
  "governed data foundation for ai / llm automation health claims prior-auth coding member service contact center crm agent assist";

describe("discovery blueprint catalog + declared resolution", () => {
  it("keeps the catalog keyed by blueprintId", () => {
    for (const [key, blueprint] of Object.entries(DISCOVERY_BLUEPRINT_CATALOG)) {
      expect(blueprint.blueprintId).toBe(key);
    }
    expect(DISCOVERY_BLUEPRINT_CATALOG.governed_data_foundation).toBeDefined();
  });

  it("the data-foundation entry is a required, de-duplicated family set", () => {
    const bp = DISCOVERY_BLUEPRINT_CATALOG.governed_data_foundation;
    const ids = bp.evidenceFamilies.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bp.evidenceFamilies.some((f) => f.required)).toBe(true);
    expect(ids).not.toContain("contact_center_kpis");
    expect(ids).not.toContain("crm_contact_center_system_map");
  });

  it("DECLARED archetype wins over keyword inference", () => {
    const inferred = getDiscoveryBlueprint(HEALTHCARE_CONTACT_CENTER_BLOB);
    expect(inferred.blueprintId).toBe("healthcare_contact_center_agent_assist");

    const declared = getDiscoveryBlueprint(
      HEALTHCARE_CONTACT_CENTER_BLOB,
      "governed_data_foundation",
    );
    expect(declared.blueprintId).toBe("governed_data_foundation");
  });

  it("normalizes a declared token (spaces, case, dashes, slashes)", () => {
    for (const token of [
      "Governed Data Foundation",
      "governed-data-foundation",
      "GOVERNED_DATA_FOUNDATION",
      "  governed/data foundation  ",
    ]) {
      expect(resolveDeclaredDiscoveryBlueprint(token)?.blueprintId).toBe(
        "governed_data_foundation",
      );
    }
  });

  it("falls back to inference when the declaration is unknown or empty", () => {
    expect(resolveDeclaredDiscoveryBlueprint("not_a_real_archetype")).toBeNull();
    expect(resolveDeclaredDiscoveryBlueprint("")).toBeNull();
    expect(resolveDeclaredDiscoveryBlueprint(null)).toBeNull();
    const resolved = getDiscoveryBlueprint(
      HEALTHCARE_CONTACT_CENTER_BLOB,
      "not_a_real_archetype",
    );
    expect(resolved.blueprintId).toBe("healthcare_contact_center_agent_assist");
  });

  it("honors a clean catalog id passed as the primary arg", () => {
    expect(getDiscoveryBlueprint("governed_data_foundation").blueprintId).toBe(
      "governed_data_foundation",
    );
  });

  it("leaves undeclared inference behavior unchanged", () => {
    expect(
      getDiscoveryBlueprint(
        "member service contact center agent assist health claims",
      ).blueprintId,
    ).toBe("healthcare_contact_center_agent_assist");
    expect(
      getDiscoveryBlueprint("irops recovery disruption operations").blueprintId,
    ).toBe("ai_operations_customer_digital");
    expect(getDiscoveryBlueprint("something unrelated entirely").blueprintId).toBe(
      "general_default",
    );
  });
});

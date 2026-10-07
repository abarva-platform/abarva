import {
  resolveDiscoveryBlueprintWithBasis,
  getDiscoveryBlueprint,
  DISCOVERY_BLUEPRINT_CATALOG,
} from "../briefs/discovery-blueprint";

describe("resolveDiscoveryBlueprintWithBasis (what decided the archetype)", () => {
  it("reports a declaration that names a catalog archetype as declared", () => {
    const out = resolveDiscoveryBlueprintWithBasis(
      "some move text that would otherwise infer something else",
      "governed_data_foundation",
    );
    expect(out.blueprint.blueprintId).toBe("governed_data_foundation");
    expect(out.basis).toBe("declared");
    expect(out.unknownDeclaration).toBeNull();
  });

  it("distinguishes a catalog id passed as the use-case argument from a real declaration", () => {
    const out = resolveDiscoveryBlueprintWithBasis("governed_data_foundation");
    expect(out.blueprint.blueprintId).toBe("governed_data_foundation");
    expect(out.basis).toBe("declared_via_use_case");
    expect(out.unknownDeclaration).toBeNull();
  });

  it("reports inference, and carries the discarded declaration, when a declaration names no catalog archetype", () => {
    // The governance case. A declaration WAS supplied, it resolves to nothing,
    // and the text still keyword-matches a specific archetype -- so selection
    // lands on a blueprint nobody declared. Both halves are asserted: the
    // basis must not read as declared, AND the discarded token must survive,
    // because a caller cannot otherwise tell this from "nothing was declared".
    const out = resolveDiscoveryBlueprintWithBasis(
      "irops recovery disruption operations",
      "ai_ops_custmer_digital",
    );
    expect(out.blueprint.blueprintId).toBe("ai_operations_customer_digital");
    expect(out.basis).toBe("inferred");
    expect(out.unknownDeclaration).toBe("ai_ops_custmer_digital");
  });

  it("separates the general case from a specific inference", () => {
    const out = resolveDiscoveryBlueprintWithBasis("something unrelated entirely");
    expect(out.blueprint.blueprintId).toBe("general_default");
    expect(out.basis).toBe("default");
    expect(out.unknownDeclaration).toBeNull();
  });

  it("reports no discarded declaration when none was supplied", () => {
    for (const declared of [undefined, null, "", "   "]) {
      const out = resolveDiscoveryBlueprintWithBasis(
        "irops recovery disruption operations",
        declared,
      );
      expect(out.basis).toBe("inferred");
      expect(out.unknownDeclaration).toBeNull();
    }
  });

  it("still reports the general case as the general case when a declaration is discarded", () => {
    const out = resolveDiscoveryBlueprintWithBasis(
      "something unrelated entirely",
      "not_a_real_archetype",
    );
    expect(out.blueprint.blueprintId).toBe("general_default");
    expect(out.basis).toBe("default");
    expect(out.unknownDeclaration).toBe("not_a_real_archetype");
  });

  it("selects the same blueprint getDiscoveryBlueprint already selected", () => {
    const cases: Array<[string, string | null | undefined]> = [
      ["irops recovery disruption operations", null],
      ["something unrelated entirely", null],
      ["governed_data_foundation", null],
      ["some move text", "governed_data_foundation"],
      ["some move text", "not_a_real_archetype"],
      ["clinical member service contact center agent assist", null],
      ["commercial lending agent assist for a bank", null],
      ["AI_OPERATIONS_DECISION_SUPPORT", undefined],
    ];
    for (const [useCase, declared] of cases) {
      expect(
        resolveDiscoveryBlueprintWithBasis(useCase, declared).blueprint.blueprintId,
      ).toBe(getDiscoveryBlueprint(useCase, declared).blueprintId);
    }
  });

  it("reports every catalog archetype as declared when it is declared", () => {
    for (const id of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      const out = resolveDiscoveryBlueprintWithBasis("", id);
      expect(out.basis).toBe("declared");
      expect(out.blueprint.blueprintId).toBe(id);
    }
  });
});

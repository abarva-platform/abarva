import { BUILT_IN_MAPPING_PROFILES } from "../../source-adapters/mapping-profiles";
import {
  CANONICAL_OBJECT_REGISTRY,
  FACT_AUTHORITY_REGISTRY,
  RELATIONSHIP_TYPE_DICTIONARY,
  buildLayer3ValidationScaffoldReport,
  normalizeRelationshipType,
} from "../layer3-validation";

const legacyCompatibilityProfiles = new Set([
  "applications-systems-estate/v1",
  "enterprise-profile-foundation/v1",
  "enterprise-profile-minimal/v1",
  "evidence-registry-minimal/v1",
]);

const activeProfiles = BUILT_IN_MAPPING_PROFILES.filter(
  (profile) => !legacyCompatibilityProfiles.has(profile.mappingProfile),
);

describe("Layer 3 validation scaffold", () => {
  it("declares an object registry entry for every active v3 mapping profile target", () => {
    const report = buildLayer3ValidationScaffoldReport(activeProfiles);

    expect(report.objectRegistryGaps).toStrictEqual([]);
    expect(report.mappedObjectTypes).toEqual(
      expect.arrayContaining([
        "enterprise_profile",
        "application_system",
        "vendor_contract",
        "spend_value_signal",
        "evidence_source",
      ]),
    );
  });

  it("declares fact authority for deterministic money and count fields", () => {
    const report = buildLayer3ValidationScaffoldReport(activeProfiles);

    expect(report.factAuthorityGaps).toStrictEqual([]);
    expect(report.factAuthorityCheckedRules).toEqual(
      expect.arrayContaining([
        "business_function.annualBudgetUsd",
        "business_function.fteCount",
        "enterprise_profile.employeeCount",
        "enterprise_profile.revenueUsd",
        "program_initiative.expectedValueUsd",
        "spend_value_signal.savingsOpportunityUsd",
      ]),
    );
    expect(
      FACT_AUTHORITY_REGISTRY.filter(
        (fact) => fact.valueType === "currency",
      ).every(
        (fact) =>
          fact.deterministic && fact.usePolicy === "must_not_be_model_invented",
      ),
    ).toBe(true);
  });

  it("normalizes only approved relationship types and common aliases", () => {
    expect(normalizeRelationshipType("supports")?.relationshipType).toBe(
      "SUPPORTS",
    );
    expect(normalizeRelationshipType("depends on")?.relationshipType).toBe(
      "DEPENDS_ON",
    );
    expect(
      normalizeRelationshipType("system_of_record")?.relationshipType,
    ).toBe("SYSTEM_OF_RECORD_FOR");
    expect(
      normalizeRelationshipType(
        "V4 application row with unresolved owner join",
      ),
    ).toBeUndefined();
  });

  it("keeps the approved V6 relationship dictionary available for graph validation", () => {
    const relationshipTypes = RELATIONSHIP_TYPE_DICTIONARY.map(
      (entry) => entry.relationshipType,
    );

    expect(relationshipTypes).toEqual(
      expect.arrayContaining([
        "SUPPORTS",
        "DEPENDS_ON",
        "HOSTED_ON",
        "OWNED_BY",
        "PRIMARY_SYSTEM_FOR",
        "SYSTEM_OF_RECORD_FOR",
        "VENDOR_SUPPORTS_SYSTEM",
        "ROLLS_UP_TO",
      ]),
    );
    expect(
      RELATIONSHIP_TYPE_DICTIONARY.every((entry) => entry.executiveSafe),
    ).toBe(true);
    expect(
      CANONICAL_OBJECT_REGISTRY.some(
        (entry) => entry.objectType === "relationship_edge",
      ),
    ).toBe(true);
  });
});

import { getVendorPlatformProfile } from "../registry";
import { resolveVendorDiscoveryPlan } from "../resolver";
import { MANAGED_ANALYTICS_PLATFORM } from "../managed-analytics-platform";
import type { ClientVendorDeploymentProfile } from "../types";

function overlay(
  over: Partial<ClientVendorDeploymentProfile> = {},
): ClientVendorDeploymentProfile {
  return {
    tenantKey: "cover-healthcare",
    vendorId: "medeanalytics",
    contractRefs: [],
    licensedModules: [],
    implementedCapabilities: [],
    unusedLicensedCapabilities: [],
    clientInputs: [],
    knownTransformations: [],
    knownAugmentations: [],
    outputs: [],
    workflows: [],
    supportModel: null,
    confirmedFacts: [],
    unknowns: [],
    conflicts: [],
    ...over,
  };
}

describe("Vendor Platform Intelligence Registry", () => {
  it("declares the generic managed analytics platform categories once", () => {
    expect(MANAGED_ANALYTICS_PLATFORM.capabilityCategories).toEqual([
      "ingestion",
      "orchestration",
      "identity",
      "quality",
      "semantic/business logic",
      "analytics/models",
      "benchmark/external data",
      "reporting",
      "workflow activation",
      "support/adoption",
      "contract/exit",
    ]);
    expect(MANAGED_ANALYTICS_PLATFORM.governingRule).toMatch(
      /what to investigate/,
    );
  });

  it("stores MedeAnalytics as a draft public hypothesis profile, not client truth", () => {
    const profile = getVendorPlatformProfile("medeanalytics")!;

    expect(profile.platformArchetype).toBe("MANAGED_ANALYTICS_PLATFORM");
    expect(profile.reviewStatus).toBe("draft");
    expect(profile.sourceRefs.map((ref) => ref.url)).toEqual(
      expect.arrayContaining([
        "https://medeanalytics.com/data-fabric/",
        "https://medeanalytics.com/company/newsroom/press-releases/health-fabric-snowflake/",
      ]),
    );
    expect(
      profile.capabilityFamilies.every(
        (capability) => capability.sourceClass === "vendor_published",
      ),
    ).toBe(true);
  });

  it("does not convert vendor-published capability into client-observed usage", () => {
    const profile = getVendorPlatformProfile("medeanalytics")!;
    const plan = resolveVendorDiscoveryPlan({
      profile,
      overlay: overlay({
        contractRefs: ["contract-register:managed-analytics"],
        unknowns: [
          {
            gapId: "identity-unknown",
            label: "identity resolution status unknown",
            capabilityId: "data_orchestration_enrichment",
            status: "unknown",
          },
        ],
      }),
      scopedCapabilityIds: ["data_orchestration_enrichment"],
    });

    expect(plan.capabilityStates).toEqual([
      expect.objectContaining({
        capabilityId: "data_orchestration_enrichment",
        vendorPublished: true,
        contractConfirmed: false,
        implementationConfirmed: false,
        clientObserved: false,
        state: "vendor_published",
      }),
    ]);
    expect(plan.requiredQuestionSets.map((set) => set.questionSetId)).toEqual([
      "mede_identity_resolution",
    ]);
  });

  it("asks one benchmark confirmation set when benchmarks are public but not contracted or observed", () => {
    const profile = getVendorPlatformProfile("medeanalytics")!;
    const plan = resolveVendorDiscoveryPlan({
      profile,
      overlay: overlay({ contractRefs: ["contract-register:analytics"] }),
      scopedCapabilityIds: ["analytics_benchmarking"],
    });

    expect(plan.summary.capabilitiesPotentiallyRelevant).toBe(1);
    expect(plan.summary.confirmedFromContract).toBe(0);
    expect(plan.summary.confirmedInCurrentUse).toBe(0);
    expect(plan.requiredQuestionSets).toEqual([
      expect.objectContaining({
        questionSetId: "mede_benchmark_portability",
        state: "vendor_published",
      }),
    ]);
    expect(plan.workbookTabs).toEqual([
      expect.objectContaining({
        tabKey: "measures_analytics_benchmarks",
        questionSetIds: ["mede_benchmark_portability"],
      }),
    ]);
  });

  it("uses client overlay evidence to distinguish contracted, implemented, and observed", () => {
    const profile = getVendorPlatformProfile("medeanalytics")!;
    const plan = resolveVendorDiscoveryPlan({
      profile,
      overlay: overlay({
        licensedModules: ["analytics_benchmarking"],
        implementedCapabilities: ["analytics_benchmarking"],
        outputs: [
          {
            outputId: "benchmark-output",
            label: "Provider benchmark dashboard",
            capabilityId: "analytics_benchmarking",
            status: "client_observed",
            evidenceRefs: ["report-inventory:001"],
          },
        ],
      }),
      scopedCapabilityIds: ["analytics_benchmarking"],
    });

    expect(plan.summary.confirmedFromContract).toBe(1);
    expect(plan.summary.confirmedInCurrentUse).toBe(1);
    expect(plan.requiredQuestionSets).toHaveLength(0);
    expect(plan.workbookTabs).toHaveLength(0);
    expect(plan.capabilityStates[0]).toEqual(
      expect.objectContaining({
        state: "client_observed",
        contractConfirmed: true,
        implementationConfirmed: true,
        clientObserved: true,
      }),
    );
  });

  it("generates tabs from triggered gaps rather than dumping the full catalog", () => {
    const profile = getVendorPlatformProfile("medeanalytics")!;
    const plan = resolveVendorDiscoveryPlan({
      profile,
      overlay: overlay({
        contractRefs: ["contract-register:managed-analytics"],
        unknowns: [
          {
            gapId: "identity-unknown",
            label: "identity and conformance unknown",
            capabilityId: "data_orchestration_enrichment",
            status: "unknown",
          },
          {
            gapId: "model-rules-unknown",
            label: "model rule and threshold evidence unknown",
            capabilityId: "predictive_augmented_analytics",
            status: "unknown",
          },
        ],
      }),
      scopedCapabilityIds: [
        "data_orchestration_enrichment",
        "predictive_augmented_analytics",
      ],
    });

    expect(profile.capabilityFamilies.length).toBeGreaterThan(2);
    expect(plan.workbookTabs.map((tab) => tab.tabKey).sort()).toEqual([
      "measures_analytics_benchmarks",
      "mede_processing",
    ]);
    expect(plan.workbookTabs).toHaveLength(2);
  });
});

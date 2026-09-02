import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { buildEnterpriseContextSpine } from "../enterprise-context-spine";

function spineFor(clientKey: string) {
  const viewModel = getEnterpriseLandscapeViewModel({ clientKey });
  const sections = Object.values(viewModel.sections);
  return {
    viewModel,
    sections,
    spine: buildEnterpriseContextSpine(viewModel, sections),
  };
}

describe("enterprise context spine", () => {
  it("routes every domain of a fully loaded tenant into a bucket", () => {
    const { spine, sections } = spineFor("skyharbor");
    expect(sections.length).toBeGreaterThan(8);

    // The old builder filled only four buckets from three sections. Every
    // domain bucket must now carry something for a fully loaded tenant.
    expect(spine.tenantFacts.length).toBeGreaterThan(0);
    expect(spine.strategyFacts.length).toBeGreaterThan(0);
    expect(spine.vendorFacts.length).toBeGreaterThan(0);
    expect(spine.useCaseFacts.length).toBeGreaterThan(0);
    expect(spine.riskFacts.length).toBeGreaterThan(0);
    expect(spine.qualityFacts.length).toBeGreaterThan(0);
    expect(spine.sourceFacts.length).toBeGreaterThan(0);
    expect(spine.pageFacts.length).toBeGreaterThan(0);
  });

  it("carries materially more enterprise context than the three-section slice it replaces", () => {
    const { spine, sections } = spineFor("skyharbor");

    const legacyTenantFacts = sections
      .slice(0, 3)
      .flatMap((s) => s.currentState.slice(0, 3)).length;
    expect(spine.tenantFacts.length).toBeGreaterThan(legacyTenantFacts);

    const total = Object.values(spine).reduce((n, list) => n + list.length, 0);
    expect(total).toBeGreaterThan(40);
  });

  it("labels facts with their section so the model can attribute them", () => {
    const { spine } = spineFor("skyharbor");
    for (const fact of spine.tenantFacts) {
      expect(fact).toContain(" — ");
    }
  });

  it("respects per-bucket caps and emits no blank or duplicate facts", () => {
    const { spine } = spineFor("skyharbor");
    for (const [bucket, list] of Object.entries(spine)) {
      expect(list.length).toBeLessThanOrEqual(20);
      expect(list.every((f) => f.trim().length > 0)).toBe(true);
      expect([bucket, new Set(list).size]).toEqual([bucket, list.length]);
    }
  });

  it("still produces context for a tenant on the generic section set", () => {
    const { spine } = spineFor("apexretail");
    expect(spine.tenantFacts.length).toBeGreaterThan(0);
    expect(spine.pageFacts.length).toBeGreaterThan(0);
  });

  it("never drops a section that the nav groups do not name", () => {
    const viewModel = getEnterpriseLandscapeViewModel({ clientKey: "skyharbor" });
    const sections = Object.values(viewModel.sections);
    const unknown = {
      ...sections[0],
      id: "some-future-section",
      title: "Some Future Section",
      currentState: [
        {
          area: "Novel area",
          assessment: "Novel assessment that must still reach the model.",
          tag: "WATCH",
          tone: "amber" as const,
        },
      ],
    };
    const spine = buildEnterpriseContextSpine(viewModel, [unknown, ...sections]);
    expect(spine.tenantFacts.join("\n")).toContain("Novel assessment");
  });
});

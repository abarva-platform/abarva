import { retrieveSurfaceContextSources } from "../retrievers/surface-context";

const QUERY = "What is the current state of our estate?";

function facts(prefix: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix} fact ${i + 1}`);
}

describe("tenant substrate domain budgets", () => {
  it("no longer starves late buckets behind a single flat cap", () => {
    // Before: all buckets were merged and cut at 34, so a large tenantFacts
    // list consumed the whole budget and every later domain vanished.
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        clientKey: "demo",
        tenantFacts: facts("Enterprise", 40),
        strategyFacts: facts("Strategy", 5),
        vendorFacts: facts("Vendor", 5),
        useCaseFacts: facts("UseCase", 5),
        riskFacts: facts("Risk", 5),
        qualityFacts: facts("Quality", 5),
        sourceFacts: facts("Source", 5),
      },
      QUERY,
    );

    const tenant = sources.find((source) => source.type === "TENANT");
    expect(tenant).toBeDefined();
    for (const prefix of [
      "Strategy",
      "Vendor",
      "UseCase",
      "Risk",
      "Quality",
      "Source",
    ]) {
      expect(tenant!.detail).toContain(`${prefix} fact 1`);
    }
  });

  it("labels each domain so the model can tell them apart", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        clientKey: "demo",
        tenantFacts: ["Enterprise fact 1"],
        vendorFacts: ["Vendor fact 1"],
        riskFacts: ["Risk fact 1"],
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail).toContain("Enterprise and operating context:");
    expect(detail).toContain("Vendors, contracts and spend:");
    expect(detail).toContain("Risk, controls and reliability:");
    // Empty domains must not emit a bare heading.
    expect(detail).not.toContain("Evidence sources:");
  });

  it("caps each domain independently", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        tenantFacts: facts("Enterprise", 40),
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail).toContain("Enterprise fact 14");
    expect(detail).not.toContain("Enterprise fact 15");
  });

  it("dedupes a fact carried in two buckets", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        tenantFacts: ["Shared fact"],
        vendorFacts: ["Shared fact"],
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail.split("Shared fact").length - 1).toBe(1);
  });

  it("keeps the SURFACE/TENANT/GRAPH source contract intact", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        stageFacts: ["Stage fact"],
        tenantFacts: ["Enterprise fact"],
        graphFacts: ["Graph edge"],
      },
      QUERY,
    );
    expect(sources.map((s) => s.type)).toEqual(["SURFACE", "TENANT", "GRAPH"]);
  });
});

import { expertIndustryForClientKey } from "@/lib/intelligence/answer/expert-grounding";
import { routeQuestion } from "@/lib/intelligence/answer/router";

describe("routeQuestion", () => {
  it("resolves expert industries from both app client keys and canonical tenant keys", () => {
    expect(expertIndustryForClientKey("apexretail")).toBe("retail");
    expect(expertIndustryForClientKey("apex-retail")).toBe("retail");
    expect(expertIndustryForClientKey("meridian")).toBe(
      "healthcare_provider",
    );
    expect(expertIndustryForClientKey("meridian-health")).toBe(
      "healthcare_provider",
    );
    expect(expertIndustryForClientKey("arcturus")).toBe(
      "financial_services_banking",
    );
    expect(expertIndustryForClientKey("first-capital")).toBe(
      "financial_services_banking",
    );
    expect(expertIndustryForClientKey("skyharbor")).toBe("airline");
    expect(expertIndustryForClientKey("skyharbor-air")).toBe("airline");
    expect(expertIndustryForClientKey("lakeshore")).toBeUndefined();
    expect(expertIndustryForClientKey("lakeshore-holdings")).toBeUndefined();
  });

  it("keeps a tenant-industry expert in the selected set when cross-cutting experts score higher", () => {
    const routing = routeQuestion({
      query:
        "What should SkyHarbor benchmark against for AI-assisted mainframe modernization?",
      industry: expertIndustryForClientKey("skyharbor"),
    });

    expect(routing.industry).toBe("airline");
    expect(routing.experts.some((expert) => expert.id.startsWith("xp.airline."))).toBe(
      true,
    );
    expect(
      routing.experts.some((expert) =>
        expert.id.startsWith("xp.healthcare-provider."),
      ),
    ).toBe(false);
    expect(
      routing.experts.some((expert) => expert.id.startsWith("xp.retail.")),
    ).toBe(false);
    expect(routing.experts.map((expert) => expert.id)).not.toContain(
      "xp.x.public-sector-citizen-services",
    );
  });

  it("does not let other industry experts leak into a retail tenant answer", () => {
    const routing = routeQuestion({
      query: "Which AI investments should Apex scale before holiday readiness?",
      industry: expertIndustryForClientKey("apexretail"),
    });

    expect(routing.industry).toBe("retail");
    expect(routing.experts.some((expert) => expert.id.startsWith("xp.retail."))).toBe(
      true,
    );
    expect(
      routing.experts.some((expert) =>
        expert.id.startsWith("xp.healthcare-provider."),
      ),
    ).toBe(false);
    expect(
      routing.experts.some((expert) => expert.id.startsWith("xp.airline.")),
    ).toBe(false);
  });
});

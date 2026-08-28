import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(filePath: string): string {
  return readFileSync(join(process.cwd(), filePath), "utf8");
}

describe("Source legacy route archive", () => {
  it("archives the retired Vendor 360 list route into the Source workspace", () => {
    const source = read("src/app/(maestro)/source/vendor-portfolio/page.tsx");

    expect(source).toContain('SOURCE_WORKSPACE_ROUTE = "/source/workspace"');
    expect(source).toContain("redirect(");
    expect(source).not.toContain("SourceVendorPortfolioPage");
    expect(source).not.toContain("listContractVendor360");
  });

  it("archives the retired Contract 360 detail route into the Source workspace", () => {
    const source = read(
      "src/app/(maestro)/source/vendor-portfolio/[contractId]/page.tsx",
    );

    expect(source).toContain('SOURCE_WORKSPACE_ROUTE = "/source/workspace"');
    expect(source).toContain('next.set("contractId", contractId)');
    expect(source).toContain("redirect(");
    expect(source).not.toContain("SourceContract360Page");
    expect(source).not.toContain("getContract360");
  });

  it("archives the old Source event index into the governed workspace", () => {
    const source = read("src/app/(maestro)/source/events/page.tsx");

    expect(source).toContain('redirect("/source/workspace")');
    expect(source).not.toContain("SourceEventsPortfolio");
    expect(source).not.toContain("SourceEventsAgentDockView");
  });

  it.each([
    {
      route: "src/app/(maestro)/source/events/[eventId]/gate/page.tsx",
      redirectedState: "/source/events/",
      retiredComponent: "GateDecisionPanel",
    },
    {
      route: "src/app/(maestro)/source/events/[eventId]/file-cabinet/page.tsx",
      redirectedState: "/workspace",
      retiredComponent: "FileCabinetPanel",
    },
    {
      route: "src/app/(maestro)/source/events/[eventId]/report/page.tsx",
      redirectedState: "/source/events/",
      retiredComponent: "PrintAutoTrigger",
    },
    {
      route: "src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx",
      redirectedState: "stage=evaluation",
      retiredComponent: "ScorecardGovernancePanel",
    },
    {
      route:
        "src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx",
      redirectedState: "/workspace?artifactId=",
      retiredComponent: "SourceArtifactDrawer",
    },
    {
      route:
        "src/app/(maestro)/source/events/[eventId]/vendors/[vendorId]/page.tsx",
      redirectedState: "stage=responses",
      retiredComponent: "VendorDetailPage",
    },
  ])(
    "keeps $route archived by redirect",
    ({ route, redirectedState, retiredComponent }) => {
      const source = read(route);

      expect(source).toContain("redirect(");
      expect(source).toContain(redirectedState);
      expect(source).not.toContain(retiredComponent);
    },
  );
});

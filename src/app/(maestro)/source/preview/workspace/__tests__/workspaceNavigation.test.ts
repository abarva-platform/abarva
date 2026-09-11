import { buildCanonicalWorkspaceUrl } from "../workspaceNavigation";

describe("buildCanonicalWorkspaceUrl", () => {
  it("canonicalizes a selected contract and preserves its tab across refresh", () => {
    expect(
      buildCanonicalWorkspaceUrl({
        currentHref:
          "/source/workspace?workspaceTab=contracts&client=meridian&asOf=2027-06-30",
        selectedKind: "contract",
        selectedId: "MER-TECH-DBX-001",
        contractTab: "Optimize",
        currentPage: "Contracts",
        sourceClientKey: "meridian",
        sourceProviderKey: "ecl_projection_db",
      }),
    ).toBe(
      "/source?client=meridian&asOf=2027-06-30&contractId=MER-TECH-DBX-001&contractTab=Optimize&sourceProvider=ecl_projection_db",
    );
  });

  it("uses one canonical /source route for portfolio tabs", () => {
    expect(
      buildCanonicalWorkspaceUrl({
        currentHref: "/source/preview/workspace?contractId=old&client=meridian",
        selectedKind: "evidence",
        selectedId: null,
        contractTab: "Story",
        currentPage: "Evidence",
        sourceClientKey: "meridian",
        sourceProviderKey: "ecl_projection_db",
      }),
    ).toBe(
      "/source?client=meridian&workspaceTab=evidence&sourceProvider=ecl_projection_db",
    );
  });
});

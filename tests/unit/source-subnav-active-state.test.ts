import {
  SourceSubNav,
  activeSourceSubNavTabs,
  resolveActiveSourceTab,
  SOURCE_SUBNAV_TABS,
  SOURCE_SUBNAV_TABS_V2,
} from "@/components/source/SourceSubNav";

describe("SourceSubNav archive contract", () => {
  it("keeps the retired top-right Source section tabs archived", () => {
    expect(activeSourceSubNavTabs()).toEqual([]);
    expect(SOURCE_SUBNAV_TABS).toEqual([]);
    expect(SOURCE_SUBNAV_TABS_V2).toEqual([]);
  });

  it("does not resolve Source routes into the retired section-tab model", () => {
    for (const path of [
      "/source/queue",
      "/source/approvals",
      "/source/portfolio",
      "/source/capabilities",
      "/source/setup",
      "/source/events/event-1",
    ]) {
      expect(resolveActiveSourceTab(path)).toBe("archived");
    }
  });

  it("renders nothing so active Source pages rely on their own workflow chrome", () => {
    expect(SourceSubNav()).toBeNull();
  });
});

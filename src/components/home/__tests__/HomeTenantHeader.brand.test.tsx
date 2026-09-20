import { renderToStaticMarkup } from "react-dom/server";

import { HomeTenantHeader } from "../HomeTenantHeader";
import { HomeOverviewV2 } from "../HomeOverviewV2";
import { composeHomeV2Extras } from "@/lib/admin/home-overview-v2";
import type { OverviewBlocks } from "@/lib/admin/overview-composer";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const blocks: OverviewBlocks = {
  status: {
    tenantName: "Lakeshore Holdings",
    readinessPercent: 0,
    agentLevel: "partial",
    blockedCapabilityTracks: 0,
  },
  orientation: {
    tenantName: "Lakeshore Holdings",
    industryPhrase: "Diversified holding company",
    loadedSummary: "No governed segments loaded.",
    missingSummary: "Enterprise context is required.",
    nextLoadName: "Enterprise profile",
    nextLoadConsequence: "Home can ground the operating model.",
    isEmptyTenant: true,
  },
  actionQueue: { items: [], totalPending: 0 },
  recentActivity: { items: [] },
};

const extras = composeHomeV2Extras({
  segments: [],
  programsCount: 0,
  programsP6Count: 0,
  sourceEventsCount: 0,
  sourceEventsAtRiskCount: 0,
  initiativesCount: 0,
  initiativesAtRiskCount: 0,
  lastIngestedAt: null,
});

describe("HomeTenantHeader authored tenant identity", () => {
  it("renders the diversified-holdco brand instead of the generic fallback", () => {
    const html = renderToStaticMarkup(
      <HomeTenantHeader
        tenantName="Lakeshore Holdings"
        clientKey="lakeshore"
      />,
    );

    expect(html).toContain(">LH</span>");
    expect(html).toContain(
      "Diversified holding company · 4 operating companies · shared services",
    );
    expect(html.toLowerCase()).toContain("background:#2563eb");
  });

  it("renders the same authored identity in the Home overview masthead", () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Lakeshore Holdings"
        clientKey="lakeshore"
        blocks={blocks}
        extras={extras}
      />,
    );

    expect(html).toContain(
      "Diversified holding company · 4 operating companies · shared services",
    );
    expect(html).toContain("Industry: Diversified Holdco");
    expect(html.toLowerCase()).toContain("color:#2563eb");
  });
});

/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { TowerIndexPage } from "../TowerIndexPage";
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";

let query = new URLSearchParams();
const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => query,
  usePathname: () => "/tower",
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      fullName: "Anand Sundaram",
      publicMetadata: { role: "admin" },
      primaryEmailAddress: { emailAddress: "anand@abarva.ai" },
      emailAddresses: [{ emailAddress: "anand@abarva.ai" }],
    },
  }),
}));

jest.mock("@/lib/auth/use-sign-out", () => ({
  useSignOut: () => jest.fn(),
}));

const INITIATIVES: AIInitiative[] = [
  {
    initiativeId: "init-cloud",
    displayId: "LH-IT-001",
    name: "AI Platform Foundation",
    description: "Enterprise AI platform and model operations foundation.",
    primaryCategoryId: "platform",
    primaryCategoryName: "AI platform",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-run",
    primaryGoalName: "Run resilience",
    stage: "scaled",
    stageDetail: null,
    ownerName: "VP Infrastructure",
    ownerTitle: "Portfolio owner",
    ownerFunction: "Infrastructure",
    committedAnnualUsd: 174_800_000,
    committedTotalUsd: 174_800_000,
    measuredValueUsd: null,
    statusFlag: "healthy",
    statusSummary: "On track",
    confidenceLevel: "HIGH",
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
  {
    initiativeId: "init-servicenow",
    displayId: "LH-IT-002",
    name: "ServiceNow AI Service Desk",
    description: "Vendor AI agent for ITSM deflection.",
    primaryCategoryId: "agent",
    primaryCategoryName: "AI & Automation",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-change",
    primaryGoalName: "AI value realization",
    stage: "pilot",
    stageDetail: null,
    ownerName: "CIO delegate",
    ownerTitle: "Program owner",
    ownerFunction: "Enterprise Apps",
    committedAnnualUsd: 57_100_000,
    committedTotalUsd: 57_100_000,
    measuredValueUsd: 12_400_000,
    statusFlag: "value_lag",
    statusSummary: "Measured value trails plan",
    confidenceLevel: "MED",
    alignedCallout: true,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
  {
    initiativeId: "init-workday",
    displayId: "LH-IT-003",
    name: "Workday Finance Modernization",
    description: "Back office platform transformation.",
    primaryCategoryId: "business",
    primaryCategoryName: "Finance & Run Cost",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-change",
    primaryGoalName: "Change portfolio",
    stage: "multi_year_strategic_bet",
    stageDetail: null,
    ownerName: "Finance systems lead",
    ownerTitle: "Platform owner",
    ownerFunction: "Finance",
    committedAnnualUsd: 92_000_000,
    committedTotalUsd: 92_000_000,
    measuredValueUsd: null,
    statusFlag: "adoption_gap",
    statusSummary: "Adoption evidence missing",
    confidenceLevel: "LOW",
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
];

const VENDORS: AIInitiativeVendorRow[] = [
  {
    vendorId: "vendor-cisco",
    initiativeId: "init-cloud",
    initiativeDisplayId: "LH-IT-001",
    initiativeName: "Cloud and Infrastructure",
    vendorName: "Cisco",
    contractValueUsd: 41_000_000,
    renewalDate: "2026-08-30",
    financialHealth: "strong",
  },
  {
    vendorId: "vendor-servicenow",
    initiativeId: "init-servicenow",
    initiativeDisplayId: "LH-IT-002",
    initiativeName: "ServiceNow AI Service Desk",
    vendorName: "ServiceNow",
    contractValueUsd: 26_000_000,
    renewalDate: "2026-07-15",
    financialHealth: "watch",
  },
];

describe("TowerIndexPage · CIO dashboard surface", () => {
  beforeEach(() => {
    query = new URLSearchParams();
    push.mockClear();
    window.localStorage.clear();
    HTMLElement.prototype.scrollTo = jest.fn();
  });

  it("renders a CIO command center with switchable dashboard views and aVa branding", () => {
    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        substrateCounts={{
          initiatives: 3,
          vendors: 2,
          kpis: 0,
          decisions: 0,
          stakeholderNotes: 0,
          scenarios: 0,
        }}
      />,
    );

    expect(screen.getByText("CIO portfolio command center")).toBeInTheDocument();
    expect(screen.getByLabelText("CIO dashboard view")).toBeInTheDocument();
    expect(screen.getAllByText("Portfolio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Budget").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vendors").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI ROI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Outcomes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Risks").length).toBeGreaterThan(0);
    expect(screen.getByText("AI Platform Foundation")).toBeInTheDocument();
    expect(screen.getByText("ServiceNow AI Service Desk")).toBeInTheDocument();
    expect(screen.getAllByText("aVa").length).toBeGreaterThan(0);
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("shows the AI ROI view from loaded evidence and names missing ROI data as a gap", () => {
    query = new URLSearchParams("dashboard=ai_roi");

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
      />,
    );

    expect(screen.getByText("AI spend families")).toBeInTheDocument();
    expect(screen.getAllByText("Vendor AI agent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI platform").length).toBeGreaterThan(0);
    expect(screen.getAllByText("value gap").length).toBeGreaterThan(0);
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });
});

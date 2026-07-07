import { buildHomeBrief } from "@/lib/home/home-brief";
import type { AIInitiative } from "@/lib/admin/ai-initiatives/queries";
import type { ApprovalRequest } from "@/lib/programs/approval";

function initiative(over: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: "i1",
    displayId: "AI-1",
    name: "Store Labor AI",
    description: "",
    primaryCategoryId: "c1",
    primaryCategoryName: "Workforce",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "g1",
    primaryGoalName: "Productivity",
    stage: "pilot",
    stageDetail: null,
    ownerName: "Carlos Rivera",
    ownerTitle: "CIO",
    ownerFunction: null,
    committedAnnualUsd: null,
    committedTotalUsd: 240_000_000,
    measuredValueUsd: 40_000_000,
    statusFlag: "healthy",
    statusSummary: "",
    confidenceLevel: "HIGH",
    alignedCallout: false,
    ...over,
  } as AIInitiative;
}

function approval(over: Partial<ApprovalRequest>): ApprovalRequest {
  return {
    id: "a1",
    tenantKey: "apexretail",
    programId: "p1",
    requestedByUserId: "u1",
    requestedAt: "2026-06-01T00:00:00Z",
    requestStatus: "pending",
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: { title: "Store Labor AI pilot" },
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    ...over,
  } as ApprovalRequest;
}

describe("buildHomeBrief", () => {
  it("derives real money KPIs from initiatives — never fabricated", () => {
    const brief = buildHomeBrief({
      tenantName: "Apex Retail Group",
      industryLabel: "Retail",
      logoColor: "#F59E0B",
      firstName: "Carlos",
      initiatives: [
        initiative({
          committedTotalUsd: 240_000_000,
          measuredValueUsd: 40_000_000,
        }),
        initiative({
          initiativeId: "i2",
          name: "CDP",
          committedTotalUsd: 120_000_000,
          measuredValueUsd: 0,
          statusFlag: "value_lag",
        }),
      ],
      approvals: [],
    });
    expect(brief.hasPortfolio).toBe(true);
    expect(brief.greeting).toBe("Good morning, Carlos.");
    // value at stake = 360M, realized 40M
    expect(brief.kpis[0]!.value).toBe("$360.0M");
    expect(brief.kpis[1]!.value).toBe("$40.0M");
    // CDP is value_lag → at risk
    expect(brief.kpis[3]!.value).toBe("1/2");
    expect(brief.portfolio).toHaveLength(2);
    // highest committed first
    expect(brief.portfolio[0]!.name).toBe("Store Labor AI");
  });

  it("shows an honest empty state with no decision when nothing is loaded", () => {
    const brief = buildHomeBrief({
      tenantName: "SkyHarbor Air",
      industryLabel: "Airline",
      logoColor: null,
      firstName: null,
      initiatives: [],
      approvals: [],
    });
    expect(brief.hasPortfolio).toBe(false);
    expect(brief.portfolio).toHaveLength(0);
    expect(brief.decision).toBeNull();
    expect(brief.greeting).toBe("Good morning."); // graceful fallback
    expect(brief.kpis[0]!.value).toBe("—"); // never a fabricated number
    expect(brief.kpis[2]!.value).toBe("0");
  });

  it("does not double-punctuate title-style greeting names", () => {
    const brief = buildHomeBrief({
      tenantName: "Meridian Health",
      industryLabel: "Healthcare",
      logoColor: null,
      firstName: " Dr. ",
      initiatives: [],
      approvals: [],
    });
    expect(brief.greeting).toBe("Good morning, Dr.");
    expect(brief.greeting).not.toContain("..");
  });

  it("surfaces a pending approval as the single decision, routing into the workspace", () => {
    const brief = buildHomeBrief({
      tenantName: "Apex Retail Group",
      industryLabel: "Retail",
      logoColor: "#F59E0B",
      firstName: "Carlos",
      initiatives: [initiative({})],
      approvals: [
        approval({
          programId: "p-store-labor",
          briefSnapshot: { title: "Store Labor AI pilot" },
        }),
      ],
    });
    expect(brief.decision).not.toBeNull();
    expect(brief.decision!.question).toContain("Store Labor AI pilot");
    // routes into the owning workspace — Home never decides inline
    expect(brief.decision!.href).toContain("/strategic-moves");
    expect(brief.decision!.href).toContain("p-store-labor");
    expect(brief.kpis[2]!.value).toBe("1");
  });

  it("keeps at-risk KPI and attention rail consistent when risk rows fall outside the top-six portfolio", () => {
    const highValueHealthy = Array.from({ length: 6 }, (_, index) =>
      initiative({
        initiativeId: `healthy-${index}`,
        displayId: `H-${index}`,
        name: `Healthy Initiative ${index + 1}`,
        committedTotalUsd: 100_000_000 - index,
        measuredValueUsd: 10_000_000,
        statusFlag: "healthy",
      }),
    );
    const lowerValueRisk = initiative({
      initiativeId: "risk-1",
      displayId: "R-1",
      name: "Lower Value Risk Initiative",
      committedTotalUsd: 1_000_000,
      measuredValueUsd: 0,
      statusFlag: "value_lag",
    });

    const brief = buildHomeBrief({
      tenantName: "Lakeshore Holdings",
      industryLabel: "Diversified Holdco",
      logoColor: "#0C1A3A",
      firstName: "Meera",
      initiatives: [...highValueHealthy, lowerValueRisk],
      approvals: [],
    });

    expect(brief.kpis[3]!.value).toBe("1/7");
    expect(brief.kpis[3]!.note).toBe("need attention");
    expect(brief.portfolio).toHaveLength(6);
    expect(brief.portfolio.some((row) => row.tone === "risk")).toBe(false);
    expect(brief.attention).toEqual([
      {
        module: "Pilot",
        text: "Lower Value Risk Initiative — Value lag",
      },
    ]);
  });
});

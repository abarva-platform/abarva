/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { FIRST_CAPITAL_DEMO, MERIDIAN_AOP_DEMO } from "../demo-data";
import { IntelligenceV3Page } from "../IntelligenceV3Page";
import type { IntelligenceV3PageData } from "../types";
import type { EnterpriseContextOverview } from "@/lib/enterprise-context/intelligence-read-model";
import type {
  ByFunctionData,
  MyStrategyData,
  PeerActivityData,
} from "@/lib/intelligence-v3/stages-display";
import type { VendorsData } from "@/lib/intelligence-v3/vendors-display";
import {
  getMeridianBriefData,
  getMeridianMapData,
} from "@/lib/knowledge-corpus/fixtures/meridian-healthcare";

jest.mock("../IntelligenceV3TopNav", () => ({
  IntelligenceV3TopNav: ({ tenantName }: { tenantName: string }) => (
    <nav data-testid="mock-top-nav">{tenantName}</nav>
  ),
}));

jest.mock("@/components/intelligence-v4/IntelligenceBrief", () => ({
  IntelligenceBrief: ({
    data,
  }: {
    data: { tenantName: string; bets: Array<{ useCase: { name: string } }> };
  }) => (
    <section data-testid="mock-intelligence-brief">
      {data.tenantName} · {data.bets[0]?.useCase.name}
    </section>
  ),
}));

jest.mock("@/components/intelligence-v4/IntelligenceMap", () => ({
  IntelligenceMap: ({
    data,
  }: {
    data: { tenantName: string; totalUseCases: number };
  }) => (
    <section data-testid="mock-intelligence-map">
      {data.tenantName} · {data.totalUseCases} use cases
    </section>
  ),
}));

jest.mock("../SentinelChat", () => ({
  SentinelChat: ({ workspace }: { workspace: ReactNode }) => (
    <section data-testid="mock-sentinel-chat">{workspace}</section>
  ),
}));

const meridianPageData: IntelligenceV3PageData = {
  ...FIRST_CAPITAL_DEMO,
  tenantName: "Meridian Health",
  industry: "healthcare",
  aopBands: MERIDIAN_AOP_DEMO,
  sentinelOpener: "Meridian Health Intelligence is ready.",
};

const skyHarborPageData: IntelligenceV3PageData = {
  ...FIRST_CAPITAL_DEMO,
  tenantName: "SkyHarbor Air",
  industry: "airline",
  aopBands: undefined,
  sentinelOpener: "SkyHarbor Air Intelligence is ready.",
};

const liveByFunctionData: ByFunctionData = {
  functions: [
    {
      function: "Operations Control",
      layer: "operations",
      initiatives: [
        {
          initiativeId: "sky-oper-001",
          displayId: "SK-OPS-001",
          name: "Real-time operations telemetry",
          statusFlag: "healthy",
          statusSummary: "On track",
          stage: "pilot",
          committedAnnualUsd: 1_200_000,
          measuredValueUsd: 500_000,
          alignedCallout: true,
          alignedRationale: "Cloud operations leadership alignment.",
        },
      ],
      counts: {
        total: 1,
        healthy: 1,
        atRisk: 0,
        aligned: 1,
      },
      committedAnnualUsd: 1_200_000,
      measuredValueUsd: 500_000,
      pendingDecisions: 0,
      stalledDecisions: 0,
      upcomingRenewals: [],
    },
  ],
};

const liveVendorsData: VendorsData = {
  vendors: [
    {
      vendorName: "AeroEdge Cloud",
      initiatives: [
        {
          initiativeId: "sky-oper-001",
          initiativeDisplayId: "SK-OPS-001",
          initiativeName: "Real-time operations telemetry",
          initiativeStatusFlag: "healthy",
          initiativeStage: "pilot",
          contractValueUsd: 2_500_000,
          renewalDate: "2026-09-15",
          financialHealth: "strong",
          notes: null,
          inferenceEconomics: null,
        },
      ],
      totalContractValueUsd: 2_500_000,
      earliestRenewal: "2026-09-15",
      worstFinancialHealth: "strong",
      initiativesAtRisk: 0,
      totalInitiatives: 1,
      inferenceEconomics: null,
    },
  ],
  totals: {
    vendorCount: 1,
    contractValueUsd: 2_500_000,
    upcomingRenewals: 1,
    atRiskVendors: 0,
  },
};

const livePeerActivityData: PeerActivityData = {
  signals: [
    {
      initiativeId: "sky-oper-001",
      initiativeDisplayId: "SK-OPS-001",
      initiativeName: "Real-time operations telemetry",
      kpiName: "Latency improvement",
      kpiUnit: "ms",
      quarter: "2026Q2",
      tenantValue: 78,
      peerMedian: 66,
      targetValue: 70,
      deltaVsPeer: 12,
      deltaPctVsPeer: 18,
    },
  ],
  totals: {
    kpiCount: 1,
    aheadOfPeer: 1,
    behindPeer: 0,
    onPar: 0,
  },
};

const liveStrategyData: MyStrategyData = {
  themes: [
    {
      goalId: "sky-goal-1",
      goalName: "Platform reliability play",
      strategicContext:
        "Reduce incident frequency while preserving delivery speed.",
      initiativeCount: 1,
      committedAnnualUsd: 2_400_000,
      measuredValueUsd: 0,
      healthyCount: 1,
      atRiskCount: 0,
      alignedCount: 1,
      initiatives: [
        {
          initiativeId: "sky-oper-001",
          displayId: "SK-OPS-001",
          name: "Real-time operations telemetry",
          statusFlag: "healthy",
          alignedCallout: true,
        },
      ],
    },
  ],
  totals: {
    themeCount: 1,
    committedTotalUsd: 2_400_000,
    alignedCount: 1,
    themesWithGap: 0,
  },
};

const forbiddenHealthcareTerms =
  /MH-07|Clinical care|ambient AI|Innovaccer|revenue cycle/i;

const lakeshoreEnterpriseContext: EnterpriseContextOverview = {
  tenantKey: "lakeshore",
  tenantName: "Lakeshore Holdings",
  counts: {
    sources: 13,
    records: 179,
    facts: 2949,
    relationships: 0,
    evidence: 1542,
    qualityIssues: 0,
    stewardshipTasks: 0,
    chunkQueue: 0,
  },
  recordTypeCounts: { vendors_contract_inventory: 1, spend_baseline: 1 },
  freshnessCounts: { fresh: 179 },
  sourceSystems: ["admin_bulk_context_upload"],
  evidenceUsableCount: 1542,
  confidenceAverage: 0.8,
  qualitySummary: {},
  cards: [],
  sentinelFacts: ["Lakeshore Holdings Enterprise Context is loaded."],
  vendorSpendRows: [
    {
      vendor: "Kyriba",
      category: "software-saas",
      subcategory: "Treasury SaaS",
      spendUsdM: 1.8,
      spendLabel: "$1.8M",
      tier: "incumbent",
      health: "watch",
      renewsInMonths: 8,
      takeaway: "Treasury renewal should force platform clarity.",
    },
  ],
};

function renderStage(stage: string, node: ReactNode) {
  window.history.replaceState(null, "", `/intelligence#${stage}`);
  return render(<>{node}</>);
}

describe("IntelligenceV3Page tenant corpus rendering", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/intelligence");
  });

  it("renders Meridian corpus Brief instead of the not-seeded state when corpus data is bound", () => {
    render(
      <IntelligenceV3Page
        data={meridianPageData}
        isLiveBound
        clientKey="meridian"
        intelligenceCorpusData={{
          briefData: getMeridianBriefData(),
          mapData: getMeridianMapData(),
        }}
      />,
    );

    expect(screen.getByTestId("mock-intelligence-brief")).toHaveTextContent(
      "Meridian Health",
    );
    expect(screen.getByTestId("mock-intelligence-brief")).toHaveTextContent(
      "Population Health AI",
    );
    expect(
      screen.queryByText(/corpus is not yet seeded/i),
    ).not.toBeInTheDocument();
  });

  it("does not render Meridian Art of Possible fixture terms for SkyHarbor", async () => {
    renderStage(
      "art-of-possible",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
      />,
    );

    expect(
      await screen.findByText(/Art of Possible has not been loaded yet/i),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(
      forbiddenHealthcareTerms,
    );
  });

  it("does not render Meridian vendor fixture terms for SkyHarbor", async () => {
    renderStage(
      "vendors",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor-air"
      />,
    );

    expect(
      await screen.findByText(/No tenant-specific vendor spend is loaded yet/i),
    ).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(
      forbiddenHealthcareTerms,
    );
  });

  it("renders Enterprise Context vendor rows for a non-corpus tenant", async () => {
    renderStage(
      "vendors",
      <IntelligenceV3Page
        data={{
          ...skyHarborPageData,
          tenantName: "Lakeshore Holdings",
          industry: "diversified holdco",
          sentinelOpener: "Lakeshore corpus is not yet seeded.",
        }}
        clientKey="lakeshore"
        enterpriseContextOverview={lakeshoreEnterpriseContext}
      />,
    );

    expect((await screen.findAllByText(/Kyriba/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$1.8M/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/No tenant-specific vendor spend is loaded yet/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\$0\.0M/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo content shown/i)).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(
      forbiddenHealthcareTerms,
    );
  });

  it("keeps Meridian non-corpus fixtures on the Meridian tenant", async () => {
    renderStage(
      "vendors",
      <IntelligenceV3Page
        data={meridianPageData}
        isLiveBound
        clientKey="meridian"
      />,
    );

    expect((await screen.findAllByText(/Innovaccer/i)).length).toBeGreaterThan(
      0,
    );
  });

  it("uses live by-function data for non-Meridian tenants", async () => {
    renderStage(
      "by-function",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
        byFunctionData={liveByFunctionData}
      />,
    );

    expect(await screen.findByText("Operations Control")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/front office/i);
  });

  it("uses live vendor data for non-Meridian tenants", async () => {
    renderStage(
      "vendors",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
        vendorsData={liveVendorsData}
      />,
    );

    expect(
      (await screen.findAllByText("AeroEdge Cloud")).length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toMatch(
      /No tenant-specific vendor spend is loaded yet/i,
    );
  });

  it("uses live peer activity data for non-Meridian tenants", async () => {
    renderStage(
      "peer-activity",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
        peerActivityData={livePeerActivityData}
      />,
    );

    await screen.findByTestId("mock-sentinel-chat");
    expect(await screen.findByText(/SK-OPS-001/)).toBeInTheDocument();
    expect(await screen.findByText(/Latency improvement/)).toBeInTheDocument();
    expect(await screen.findByText(/\+18% vs peer/)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/Epic instance peers/i);
  });

  it("uses live my-strategy bullets for non-Meridian tenants", async () => {
    renderStage(
      "my-strategy",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
        myStrategyData={liveStrategyData}
      />,
    );

    expect(
      await screen.findByText("Platform reliability play"),
    ).toBeInTheDocument();
    expect(await screen.findByText("01")).toBeInTheDocument();
  });

  it("uses live corpus pattern rows for non-Meridian tenants", async () => {
    renderStage(
      "patterns",
      <IntelligenceV3Page
        data={skyHarborPageData}
        isLiveBound
        clientKey="skyharbor"
        intelligenceCorpusData={{
          mapData: getMeridianMapData(),
          briefData: getMeridianBriefData(),
          patterns: [
            {
              id: "P-SKY-001",
              name: "Ops telemetry first wave",
              description: "Telemetry quality lifts incident MTTR by 30%.",
              withLabel: "30% MTTR lift",
              withoutLabel: "0% MTTR lift",
              withPct: 30,
              withoutPct: 0,
              bindsTo: "SK-OPS-001",
            },
          ],
        }}
      />,
    );

    expect(await screen.findByText("P-SKY-001")).toBeInTheDocument();
    expect(await screen.findByText("30% MTTR lift")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/P-HC-005/i);
  });
});

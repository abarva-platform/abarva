/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { ContractCanvas } from "../canvases/ContractCanvas";

function executiveStoryVm() {
  return {
    c: {
      vendor: "Vendor One",
      ref: "c1",
      acv: "$50.0M",
      spend: "$48.0M",
      notice: "30 Sep 2027",
      expiry: "28 Jan 2028",
      noticePassed: false,
    },
    cOverview: true,
    cEconomics: false,
    cScope: false,
    cPerformance: false,
    cRelationship: false,
    cEvidence: false,
    cOptimize: false,
    termRows: [],
    recAction: "Open optimize plan",
    recWhy: "Governed opportunities are ready for executive review.",
    goActions: jest.fn(),
    detailState: "ready",
    optSpine: {
      selected: {
        rank: "#1",
        band: "Prime optimization candidate",
        score: 86,
        annualValue: "$50.0M",
      },
    },
    opportunityView: {
      contractId: "c1",
      recommendation: "Act now.",
      recommendationDetail:
        "Governed opportunities are ready for executive review.",
      baseline: {
        status: "ready",
        headline: "Commercial baseline reconciled",
        detail: "Annual value reconciles to the pricing schedule.",
        annualValue: "$50.0M",
        pricingScheduleValue: "$50.0M",
        actualSpend: "$48.0M",
        committedValue: "$150.0M",
        conflictAmount: null,
      },
      potential: {
        recoverable: "$2.0M",
        avoidable: "$500.0K",
        negotiable: "$300.0K",
        total: "$2.8M",
      },
      financeConfirmed: "$100.0K",
      selectedOpportunity: {
        nextAction: "Review invoice exceptions with AP and the supplier.",
      },
      opportunities: [
        {
          id: "c1:invoice",
          shortLabel: "Invoice variance",
          valueType: "Recoverable Leakage",
          amount: "$2.0M",
          stage: "Quantified",
          stageRaw: "quantified",
          grade: "System Evidenced",
          tone: "#1d9e75",
          selected: true,
          blockingGap: null,
          nextAction: "Review invoice exceptions with AP and the supplier.",
        },
        {
          id: "c1:scope",
          shortLabel: "Scope rationalization",
          valueType: "Avoided Cost",
          amount: "$500.0K",
          stage: "Approval Required",
          stageRaw: "approval_required",
          grade: "Human Validated",
          tone: "#ba7517",
          selected: false,
          blockingGap: null,
          nextAction: "Confirm reclaim list before renewal.",
        },
        {
          id: "c1:terms",
          shortLabel: "Commercial terms",
          valueType: "Negotiable Improvement",
          amount: "$300.0K",
          stage: "Target Position",
          stageRaw: "target_position",
          grade: "Document Evidenced",
          tone: "#ba7517",
          selected: false,
          blockingGap: null,
          nextAction: "Move terms into negotiation packet.",
        },
      ],
    },
  };
}

describe("ContractCanvas executive story", () => {
  it("opens with the contract-level executive narrative and client-facing value categories", () => {
    render(<ContractCanvas vm={executiveStoryVm() as never} />);

    expect(screen.getByText("Executive opening")).toBeTruthy();
    expect(screen.getByText(/governed potential value is ready/)).toBeTruthy();
    expect(
      screen.getByText(/Finance confirmation is shown separately/),
    ).toBeTruthy();
    expect(screen.getByText("Contract economics loaded")).toBeTruthy();
    expect(screen.getByText("Annual contract value")).toBeTruthy();
    expect(screen.getByText("Actual annual spend")).toBeTruthy();
    expect(screen.getByText("Pricing schedule baseline")).toBeTruthy();
    expect(
      screen.getByText(
        "Three opportunities identified. None still require evidence review, business approval, or negotiation action. Missing evidence remains explicit.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("Recover money").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Avoid future spend").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Improve the deal").length).toBeGreaterThan(0);
    expect(screen.queryByText(/opportunityies/i)).toBeNull();
    expect(screen.queryByText(/ready or reviewable/)).toBeNull();
    expect(screen.queryByText(/blocked or gap-backed/)).toBeNull();
    expect(screen.queryByText("Contract optimization story")).toBeNull();
  });

  it("uses the governed contract value as relationship baseline fallback", () => {
    const vm = {
      ...executiveStoryVm(),
      cOverview: false,
      cRelationship: true,
      contractRow: {
        contract_id: "c1",
      },
      opportunityView: {
        ...executiveStoryVm().opportunityView,
        baseline: {
          ...executiveStoryVm().opportunityView.baseline,
          annualValue: "Not sized",
        },
      },
    };

    render(<ContractCanvas vm={vm as never} />);

    expect(screen.getByText("$50.0M annual")).toBeTruthy();
    expect(screen.queryByText("Not sized annual")).toBeNull();
  });
});

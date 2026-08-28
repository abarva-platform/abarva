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
        reasons: [
          {
            kind: "weak_leverage",
            label: "2 weak leverage signals",
            detail: "Benchmark rights are limited and supplier alternatives need market scan.",
            role: "action_trigger",
            tone: "#ba7517",
            points: "18",
          },
          {
            kind: "commercial_variance",
            label: "Contracted-to-actual variance is visible",
            detail:
              "$2.0M variance is visible, but it is an evidence gate, not savings.",
            role: "evidence_gate",
            tone: "#5f5e5a",
            points: "10",
          },
        ],
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
    expect(screen.getByText("Why this contract first")).toBeTruthy();
    expect(screen.getByText("Action trigger")).toBeTruthy();
    expect(
      screen.getByText(/Benchmark rights are limited/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "$2.0M variance is visible, but it is an evidence gate, not savings.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Three opportunities identified/),
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

  it("renders monthly SLA rows even when legacy performance summary is absent", () => {
    const vm = {
      ...executiveStoryVm(),
      cOverview: false,
      cPerformance: true,
      evidencePerformance: null,
      detailState: "ready",
      detail: {
        performancePeriods: [
          {
            tenant_key: "test_tenant",
            observation_id: "perf-1",
            contract_id: "c1",
            service_id: "claims-processing",
            metric_name: "claims processed within 24 hours (%)",
            period_start: "2026-02-01",
            period_end: "2026-02-28",
            contracted_target: "95%",
            actual_value: "89%",
            value_num: 89,
            unit: "%",
            performance_state: "breached",
            credit_state: "earned_unclaimed",
            breach_count: 1,
            credit_eligible: true,
            credit_calculated: 14333.34,
            credit_claimed: 0,
            credit_recovered: 0,
            currency: "USD",
            source_system: "governed_source_depth_loader",
            source_record_id: "perf-1",
            as_of_date: "2026-08-01",
            quality_state: "reviewed",
            evidence_reference: "source_contract_depth:test",
            load_run_id: "test",
          },
        ],
        operationalPerformance: null,
        financialExposure: null,
      },
    };

    render(<ContractCanvas vm={vm as never} />);

    expect(
      screen.getByText("Monthly SLA performance is reviewable for this contract."),
    ).toBeTruthy();
    expect(screen.getByText("Monthly SLA history")).toBeTruthy();
    expect(screen.getByText("claims processed within 24 hours (%)")).toBeTruthy();
    expect(screen.getByText("Missed")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.queryByText(/No operational performance/)).toBeNull();
  });
});

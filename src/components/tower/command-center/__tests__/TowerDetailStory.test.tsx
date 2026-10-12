/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type {
  TowerActionView,
  TowerAiView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { ActionDrawer } from "../drawers/ActionDrawer";
import { AiInitiativeDrawer } from "../drawers/AiInitiativeDrawer";
import { ProgramDrawer } from "../drawers/ProgramDrawer";

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Example tenant",
})!;

describe("Tower detail proof states", () => {
  it("shows source program roles and affected work areas without calling them funding categories", () => {
    const program: TowerProgramView = {
      ...view.programs[0]!,
      ownerRole: "Program sponsor",
      technologyOwnerRole: "Technology lead",
      sourceProgramStatus: "in_progress",
      sourceProgramPhase: "delivery",
      affectedFunctions: [{ functionId: "FUNC-1", functionName: "Member services" }],
      functionLabel: null,
      fundingAmountLoaded: false,
      promisedBenefitLoaded: false,
    };
    render(<ProgramDrawer program={program} onClose={() => {}} onSeeAction={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Technology lead")).toBeInTheDocument();
    expect(within(drawer).getByText("In progress")).toBeInTheDocument();
    expect(within(drawer).getByText("Delivery underway")).toBeInTheDocument();
    expect(within(drawer).getByText(/Recorded in intake as “in_progress”/)).toBeInTheDocument();
    expect(within(drawer).getByText(/Recorded in intake as “delivery”/)).toBeInTheDocument();
    expect(within(drawer).getByText("Member services")).toBeInTheDocument();
    expect(within(drawer).getByText(/not funding categories/)).toBeInTheDocument();
    expect(within(drawer).getByText(/Approved FY26 funding is not verified/)).toBeInTheDocument();
  });

  it("does not claim Finance sign-off or reporting clearance for unverified program amounts", () => {
    const program: TowerProgramView = {
      ...view.programs[0]!,
      promisedBenefitLoaded: true,
      promisedUsd: 20_000_000,
      financeValidatedUsd: 13_000_000,
      financeValidatedAmountLoaded: false,
      claimableUsd: 8_000_000,
      claimableAmountLoaded: false,
    };
    render(<ProgramDrawer program={program} onClose={() => {}} onSeeAction={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Finance review amount").parentElement).toHaveTextContent("Not verified");
    expect(within(drawer).getByText("Reportable in loaded months").parentElement).toHaveTextContent("Not verified");
    expect(within(drawer).getByText("Finance review").parentElement).toHaveTextContent("Not verified");
    expect(within(drawer).getByText("Reporting clearance").parentElement).toHaveTextContent("Not verified");
    expect(within(drawer).getByText("Finance confirmation and amount are not verified here")).toBeInTheDocument();
    expect(within(drawer).getByText("Reporting clearance and amount are not verified here")).toBeInTheDocument();
    expect(within(drawer).getByText(/A reportable amount is not verified/)).toBeInTheDocument();
    expect(within(drawer).queryByText(/Finance has signed the measurement method/)).not.toBeInTheDocument();
    expect(within(drawer).queryByText(/approved for reporting in the months loaded here/)).not.toBeInTheDocument();
  });

  it("shows declared AI case context separately from Finance verification", () => {
    const caseRow: TowerAiView = {
      ...view.allInitiatives[0]!,
      populationKind: "ai_case",
      businessFunction: "Service operations",
      businessSegmentKey: "north_region",
      sourceCaseStatus: "pilot",
      operationalOwnerRole: "Operations lead",
      expectedValueArchetype: "time_savings",
      financeStatus: null,
    };
    render(<AiInitiativeDrawer item={caseRow} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Service operations")).toBeInTheDocument();
    expect(within(drawer).getByText("north region")).toBeInTheDocument();
    expect(within(drawer).getByText("In pilot")).toBeInTheDocument();
    expect(within(drawer).getByText("Operations lead")).toBeInTheDocument();
    expect(within(drawer).getByText("May save staff time")).toBeInTheDocument();
    expect(within(drawer).getByText(/Recorded in intake as “pilot”/)).toBeInTheDocument();
    expect(within(drawer).getByText(/Recorded in intake as “time_savings”/)).toBeInTheDocument();
    expect(within(drawer).getByText(/not a measured or Finance-verified benefit/)).toBeInTheDocument();
  });

  it("keeps a source program category from claiming unverified funding approval", () => {
    const caseRow: TowerAiView = {
      ...view.allInitiatives[0]!,
      populationKind: "ai_case",
      kind: "funded",
      originalItemKind: "funded_program",
      aiAmountBasis: "unknown",
      aiSpendLoaded: false,
    };
    render(<AiInitiativeDrawer item={caseRow} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(`AI capability ${caseRow.n} · Program`)).toBeInTheDocument();
    expect(within(drawer).getByText(/This is a program row. Approved funding is not verified/)).toBeInTheDocument();
    expect(within(drawer).getByText("Source category key")).toBeInTheDocument();
    expect(within(drawer).getByText("funded_program")).toBeInTheDocument();
    expect(within(drawer).getByText("This category does not establish approved funding.")).toBeInTheDocument();
    expect(within(drawer).queryByText(/Funded program/)).not.toBeInTheDocument();
    expect(within(drawer).queryByText(/an approved program with recorded funding/)).not.toBeInTheDocument();
  });

  it.each(["active_users", "adoption"])(
    "shows a %s source usage count without a bar when no adoption rate is loaded",
    (usageMetric) => {
      const mart = designFixtureMart();
      const sourceCase = mart.aiPortfolio[0]!;
      const countOnlyView = buildTowerCommandCenterView(
        {
          ...mart,
          aiPortfolio: [{
            ...sourceCase,
            usageMetric,
            usageActual: 27,
            adoptionRatePct: null,
          }],
        },
        { tenantName: "Example tenant" },
      )!;
      const countOnlyCase = countOnlyView.allInitiatives[0]!;
      expect(countOnlyCase.usageBars).toHaveLength(1);
      expect(countOnlyCase.usageBars[0]?.valueText).toBe("27");
      expect(countOnlyCase.usageBars[0]?.pct).toBe(0);
      if (usageMetric === "adoption") {
        expect(countOnlyCase.usageBars[0]?.label).toBe("Adoption");
      }
      expect(countOnlyCase.usageBars[0]?.valueText).not.toContain("%");

      render(<AiInitiativeDrawer item={countOnlyCase} onClose={() => {}} />);
      const drawer = screen.getByRole("dialog");
      const count = within(drawer).getByText("27");
      expect(count.parentElement?.parentElement?.querySelector("i")).toBeNull();
      expect(within(drawer).getByText("Count recorded; adoption rate not loaded.")).toBeInTheDocument();
    },
  );

  it.each([
    ["cost_productivity_or_cycle_time", "May lower cost, free staff time, or speed up work"],
    ["revenue_uplift_or_experience", "May improve revenue or customer experience"],
    ["yield_leakage_or_regulatory_exposure", "May reduce lost value or regulatory risk"],
  ])("explains planned benefit kind %s without claiming an earned result", (raw, label) => {
    const caseRow: TowerAiView = {
      ...view.allInitiatives[0]!,
      populationKind: "ai_case",
      expectedValueArchetype: raw,
      sourceCaseStatus: "paused_pending_governance_review",
      financeValidatedAmountLoaded: false,
      promisedBenefitLoaded: false,
    };
    render(<AiInitiativeDrawer item={caseRow} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(label)).toBeInTheDocument();
    expect(within(drawer).getByText(`Paused while controls are reviewed`)).toBeInTheDocument();
    expect(within(drawer).getByText(new RegExp(`Recorded in intake as “${raw}”`))).toBeInTheDocument();
    expect(within(drawer).getByText(/not a measured or Finance-verified benefit/)).toBeInTheDocument();
    expect(within(drawer).getAllByText("Not verified").length).toBeGreaterThan(0);
  });

  it("shows conflicting case amounts and dates as unreconciled bases", () => {
    const caseRow: TowerAiView = {
      ...view.allInitiatives[0]!,
      sourceFile: "case.csv",
      financeValidatedUsd: 13_000_000,
      realizationStartMonth: "2027-08",
      valueObservationMonths: [
        {
          month: "2026-08",
          actualValue: 1,
          reviewerRole: "Finance",
          sponsorClaimedUsd: 20_000_000,
          financeReviewedUsd: 18_000_000,
          financeValidatedUsd: 17_000_000,
          boardClaimableUsd: 13_000_000,
          validationState: "finance_validated_actual",
        },
      ],
      financeApprovalEvents: [
        {
          eventDate: "2026-08-31",
          eventType: "finance_validated_actual",
          approvalState: "approved",
          approverRole: "Finance",
          amountUsd: 17_000_000,
          amountBasis: "ytd",
          note: null,
        },
      ],
    };

    render(<AiInitiativeDrawer item={caseRow} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(/2026-08 to 2026-08/)).toBeInTheDocument();
    expect(
      within(drawer).getByText(/their bases have not been reconciled/),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText(/predates the recorded realization start/),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Finance-validated · period not recorded"),
    ).toBeInTheDocument();
  });

  it("shows rollout adoption without case-only Finance proof or invented zero", () => {
    const rollout: TowerAiView = {
      ...view.allInitiatives[0]!,
      sourceFile: "23_ai_tool_rollout.csv",
      populationKind: "tool_rollout",
      aiSpendLoaded: false,
      financeValidatedUsd: 0,
      financeApprovalEvents: [],
      valueObservationMonths: [],
      linkedBusinessCaseCount: null,
    };

    render(<AiInitiativeDrawer item={rollout} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Tool rollout detail")).toBeInTheDocument();
    expect(within(drawer).getAllByText("Not loaded").length).toBeGreaterThan(0);
    expect(
      within(drawer).queryByText("What the claim did, month by month"),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByText("Finance-validated · period not recorded"),
    ).not.toBeInTheDocument();
  });

  it("does not present a proof gate as a deadline or a handoff as evidence", () => {
    const action: TowerActionView = {
      ...view.actions[0]!,
      due: "measured_outcome",
      evidence: "Routes to Tower.",
      evidenceRequirement: "monthly_actuals_with_source",
      expectedSourceSystem: "Finance ledger",
      linkedProgram: null,
    };

    render(<ActionDrawer action={action} onClose={() => {}} />);
    const drawer = screen.getByRole("dialog");
    expect(
      within(drawer).getByText("No calendar date recorded"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("measured outcome")).toBeInTheDocument();
    expect(
      within(drawer).getByText("monthly actuals with source"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Expected source: Finance ledger"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("No program linked")).toBeInTheDocument();
    expect(
      within(drawer).queryByText("Routes to Tower."),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Approve & route" }),
    ).toBeDisabled();
  });
});

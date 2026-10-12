/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type {
  TowerActionView,
  TowerAiView,
} from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { ActionDrawer } from "../drawers/ActionDrawer";
import { AiInitiativeDrawer } from "../drawers/AiInitiativeDrawer";

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Example tenant",
})!;

describe("Tower detail proof states", () => {
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

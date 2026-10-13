/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";

import { SourceCommandKpiStrip } from "../WorkspaceExecutiveShell";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

/**
 * Three things the portfolio Command view asserted that were not true.
 *
 * Each was defensible in code and wrong on screen: a refusal phrase set into a
 * sentence built for a number, and an empty sum rendered as a measured zero.
 * The third — a refresh date scraped out of a run identifier — is covered by
 * its own describe block below, because the identifier is the evidence.
 */

const basePortfolio = (
  coverage: readonly Record<string, unknown>[] = [],
  candidates: readonly Record<string, unknown>[] = [],
): SourceWorkspacePortfolioData =>
  ({
    contracts: [],
    vendors: [],
    asOfDateIso: "2026-09-13T00:00:00Z",
    impact: {
      actionCandidates: candidates,
      evidenceCoverage: coverage,
      vendorPositions: [],
      claimCards: [],
      avaGroundingBundles: [],
    },
    v4Snapshot: {
      spendConsumption: { rowCount: 0 },
      performanceCredits: {
        rowCount: 0,
        unclaimedCredit: 0,
        creditRecovered: 0,
      },
    },
    workspaceDiagnostics: { activeLoadRunId: null },
    cockpit: { claimQualityControls: [] },
  }) as unknown as SourceWorkspacePortfolioData;

const commitmentCandidate = {
  action_candidate_id: "OPT-1",
  opportunity_id: "OPT-1",
  contract_id: "C1",
  vendor_ref: "V1",
  vendor_name: "Databricks, Inc.",
  candidate_amount_usd: 350_000,
  opportunity_type: "negotiated_improvement",
  action_type: "negotiated_improvement",
  title: "Re-time annual commitment to program delivery pace",
  readiness_state: "not_ready",
  authority_state: "not_confirmed",
  finance_confirmation_state: "not_confirmed",
};

describe("Commitment at risk", () => {
  it("never sets a refusal phrase into the sentence ending in 'consumed'", () => {
    // The deployed tile read: "Databricks, Inc. · Usage not established consumed".
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio(
          [
            {
              contract_id: "C1",
              unclaimed_credit_usd: 0,
              load_run_id: null,
            },
          ],
          [commitmentCandidate],
        )}
        totalAnnualValue={1_900_000}
        creditFinding={0}
      />,
    );

    expect(screen.queryByText(/not established consumed/i)).toBeNull();
  });
});

describe("Command evidence review", () => {
  const reviewCandidate = {
    ...commitmentCandidate,
    title: "Review renewal and evidence posture",
    candidate_amount_usd: null,
    readiness_state: "review_required",
    accountable_role: "Contract management lead",
  };

  it("names the missing inputs and opens the contract evidence checklist", () => {
    const onOpenContract = jest.fn();
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio(
          [{ contract_id: "C1", document_page_text_rows: 0, spend_rows: 1 }],
          [reviewCandidate],
        )}
        totalAnnualValue={null}
        creditFinding={0}
        onOpenContract={onOpenContract}
      />,
    );
    const tile = screen
      .getByText("Next contract action")
      .closest(".sw-v2-metric") as HTMLElement;
    expect(tile.textContent).toContain(
      "Agreement passages needed. Value not quantified",
    );
    expect(tile.textContent).not.toMatch(
      /consum|Commitment at risk|Not established/i,
    );
    fireEvent.click(
      within(tile).getByRole("button", { name: "Review missing inputs" }),
    );
    expect(onOpenContract).toHaveBeenCalledWith("C1", "Evidence");
    expect(screen.getByText("Review required")).toBeTruthy();
  });

  it("does not treat matching monetary spend as measured consumption", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio(
          [
            {
              contract_id: "C1",
              spend_rows: 1,
              committed_spend_usd: 6600000,
              actual_spend_usd: 6600000,
              document_page_text_rows: 0,
            },
          ],
          [reviewCandidate],
        )}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    expect(
      screen.queryByText(/consumed|consumption against commitment/i),
    ).toBeNull();
  });

  it("keeps unknown coverage unknown rather than asserting missing agreement passages", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio([], [reviewCandidate])}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    expect(
      screen.getByText(/Contract evidence coverage needs review/),
    ).toBeTruthy();
    expect(screen.queryByText(/Agreement passages needed/)).toBeNull();
  });

  it("does not call a negated readiness state ready or let approval substitute for readiness", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio(
          [],
          [
            { ...reviewCandidate, readiness_state: "not_ready" },
            {
              ...reviewCandidate,
              action_candidate_id: "OPT-2",
              authority_state: "approved",
            },
            {
              ...reviewCandidate,
              action_candidate_id: "OPT-3",
              readiness_state: "incomplete",
            },
          ],
        )}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    expect(screen.queryByText(/^[1-9]\d* ready$/)).toBeNull();
    expect(screen.getByText("Review required")).toBeTruthy();
  });

  it("recognizes the projection's ready-to-act state", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio([], [
          { ...reviewCandidate, readiness_state: "ready_to_act" },
          { ...reviewCandidate, action_candidate_id: "OPT-2" },
        ])}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    expect(screen.getByText("1 ready")).toBeTruthy();
  });

  it("does not treat an unsized diagnostic as proof that its calculation basis is missing", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio(
          [{ contract_id: "C1", document_page_text_rows: 4 }],
          [
            {
              ...reviewCandidate,
              deterministic_basis: "Cited change-order diagnostic ratio.",
            },
          ],
        )}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    expect(screen.queryByText(/Calculation basis needed/)).toBeNull();
    expect(screen.getByText(/Value not quantified/)).toBeTruthy();
  });

  it("keeps a sized candidate distinct from realized value and opens its action", () => {
    const onOpenContract = jest.fn();
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio([], [commitmentCandidate])}
        totalAnnualValue={null}
        creditFinding={0}
        onOpenContract={onOpenContract}
      />,
    );
    const tile = screen
      .getByText("Next contract action")
      .closest(".sw-v2-metric") as HTMLElement;
    expect(tile.textContent).toContain("$350.0K");
    expect(tile.textContent).toContain("Candidate value, not realized savings");
    fireEvent.click(
      within(tile).getByRole("button", { name: "Review candidate action" }),
    );
    expect(onOpenContract).toHaveBeenCalledWith("C1", "Optimize");
  });

  it("does not turn no action rows into zero ready decisions", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio()}
        totalAnnualValue={null}
        creditFinding={0}
      />,
    );
    const tile = screen
      .getByText("Decision posture")
      .closest(".sw-v2-metric") as HTMLElement;
    expect(tile.textContent).toContain("Not loaded");
    expect(tile.textContent).not.toContain("0 ready");
  });
});

describe("Unclaimed credit", () => {
  it("does not render an absent credit as a measured zero", () => {
    // "$0" states that we looked and found none. The note beside it said
    // nothing was loaded. Both cannot be true on one tile.
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio()}
        totalAnnualValue={1_900_000}
        creditFinding={0}
      />,
    );

    // Scope to the credit tile: other tiles legitimately read "Not established"
    // for their own absent inputs, and a bare text query cannot tell them apart.
    const tile = screen
      .getByText("Unclaimed credit")
      .closest(".sw-v2-metric") as HTMLElement;
    expect(tile.querySelector("b")?.textContent).toBe("Not established");
    expect(tile.textContent).toContain("No unclaimed-credit row is loaded");
    expect(tile.textContent).not.toContain("$0");
  });

  it("renders a loaded credit as the figure it is", () => {
    render(
      <SourceCommandKpiStrip
        portfolio={basePortfolio()}
        totalAnnualValue={1_900_000}
        creditFinding={24_500}
      />,
    );

    const tile = screen
      .getByText("Unclaimed credit")
      .closest(".sw-v2-metric") as HTMLElement;
    expect(tile.querySelector("b")?.textContent).toBe("$24.5K");
    expect(tile.textContent).not.toContain("No unclaimed-credit row is loaded");
  });
});

/*
 * The identifier-parsing tests that stood here are gone with the parser.
 *
 * They pinned a heuristic: refuse an id carrying two date stamps, accept one
 * carrying a single stamp. It was the wrong thing to get right. An id with one
 * stamp may carry the dataset version's date and no run date at all, which is
 * exactly what the deployed portfolio held — so the rule was satisfied and the
 * answer was still wrong.
 *
 * The control now reads `completed_at`, which both loaders record. Freshness is
 * covered by the adapter and shell tests that exercise that field.
 */

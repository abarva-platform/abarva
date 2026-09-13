/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import {
  loadDateFromRunId,
  SourceCommandKpiStrip,
} from "../WorkspaceExecutiveShell";
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

describe("loadDateFromRunId", () => {
  it("refuses a run id that carries two dates", () => {
    // The live defect. This id holds the dataset version's stamp and the run's;
    // taking the first match reported 08 Sept as the portfolio refresh date,
    // days after the reload actually ran.
    expect(
      loadDateFromRunId(
        "source-cloud-consumption-package-meridian-databricks-consumption-commit-v1-20260908-20260913T0421",
      ),
    ).toBeNull();
  });

  it("reads a run id that carries exactly one date", () => {
    expect(loadDateFromRunId("contract-depth-dense-20260913-01bf0f31")).toBe(
      "2026-09-13",
    );
  });

  it("accepts a repeated stamp, which is still unambiguous", () => {
    expect(loadDateFromRunId("run-2026-09-13-part-20260913")).toBe("2026-09-13");
  });

  it("refuses an id with no date at all", () => {
    expect(loadDateFromRunId("unit-proof")).toBeNull();
    expect(loadDateFromRunId(null)).toBeNull();
  });

  it("does not mistake a hex fragment for a date", () => {
    expect(loadDateFromRunId("01bf0f31")).toBeNull();
  });
});

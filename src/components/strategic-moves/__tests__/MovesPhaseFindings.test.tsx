/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  MovesPhaseFindings,
  FindingsReviewGateSummary,
} from "../MovesPhaseFindings";
import type {
  PhaseFindingsModel,
  FindingReviewState,
} from "@/lib/programs/moves-phase-findings";
import { summarizePhaseFindingsReview } from "@/lib/programs/moves-phase-findings";

const MODEL: PhaseFindingsModel = {
  phase: 2,
  surface: "diagnosis",
  heading: "What we found this phase",
  subhead: "The diagnosis, as discrete reviewable findings.",
  inputs: [
    { key: "ownership", label: "Governance ownership map", status: "reviewed" },
    { key: "entitlements", label: "Source-access entitlements", status: "partial" },
  ],
  generated: [
    { key: "gen_hypotheses", label: "Root-cause tree", status: "reviewed" },
    { key: "deliverable", label: "Phase deliverable", status: "pending" },
  ],
  findings: [
    {
      id: "identity",
      kind: "Root cause",
      statement: "No enterprise patient identity",
      detail: "Three source systems carry their own MRNs.",
      evidenceLabel: "Evidence · Identity specs",
      evidenceBacked: true,
      benchmarkSource: "taxonomy_trap",
      benchmarkLabel: "Taxonomy trap",
      confidence: "high",
    },
    {
      id: "access",
      kind: "Gap",
      statement: "PHI access is ungoverned",
      detail: "Extracts copied without minimum-necessary entitlements.",
      evidenceLabel: "Partial · in review",
      evidenceBacked: false,
      benchmarkSource: "client_evidence",
      benchmarkLabel: "Client evidence",
      confidence: "medium",
    },
  ],
  structuralHeadline: "The gap is structural — governance, not tooling.",
  confidenceNote: "Findings backed by partial evidence are marked lower confidence.",
  pending: false,
};

function renderSurface(
  review: Record<string, FindingReviewState> = {},
  canReview = true,
) {
  const onReview = jest.fn();
  render(
    <MovesPhaseFindings
      model={MODEL}
      review={review}
      onReview={onReview}
      canReview={canReview}
    />,
  );
  return { onReview };
}

describe("MovesPhaseFindings", () => {
  it("renders one card per finding, with statement, evidence and benchmark tag", () => {
    renderSurface();
    const card = screen.getByTestId("finding-identity");
    expect(card).toHaveTextContent("No enterprise patient identity");
    expect(card).toHaveTextContent("Evidence · Identity specs");
    expect(card).toHaveTextContent("Taxonomy trap");
    expect(card).toHaveTextContent("Confidence");
    expect(card).toHaveTextContent("High");
  });

  it("renders the input-vs-generated split with the generated side read-only", () => {
    renderSurface();
    expect(screen.getByText("Governance ownership map")).toBeInTheDocument();
    expect(screen.getByText("Root-cause tree")).toBeInTheDocument();
    // Generated side carries no accept/challenge controls — it is read-only.
    const panels = document.querySelectorAll(".mpf-panel");
    expect(panels).toHaveLength(2);
    expect(
      within(panels[1] as HTMLElement).queryByRole("button"),
    ).toBeNull();
  });

  it("shows the structural headline", () => {
    renderSurface();
    expect(
      screen.getByText(/The gap is structural/),
    ).toBeInTheDocument();
  });

  it("toggles a finding to accepted, reporting the decision up", () => {
    const { onReview } = renderSurface();
    const card = screen.getByTestId("finding-identity");
    fireEvent.click(within(card).getByRole("button", { name: "Accept" }));
    expect(onReview).toHaveBeenCalledWith("identity", "accepted");
  });

  it("toggles an accepted finding back to awaiting when re-clicked", () => {
    const { onReview } = renderSurface({ identity: "accepted" });
    const card = screen.getByTestId("finding-identity");
    fireEvent.click(within(card).getByRole("button", { name: "Accepted" }));
    expect(onReview).toHaveBeenCalledWith("identity", "awaiting");
  });

  it("reflects the current review state on the card", () => {
    renderSurface({ identity: "accepted", access: "challenged" });
    expect(screen.getByTestId("finding-identity")).toHaveAttribute(
      "data-review",
      "accepted",
    );
    expect(screen.getByTestId("finding-access")).toHaveAttribute(
      "data-review",
      "challenged",
    );
  });

  it("disables the review controls when the viewer cannot review", () => {
    renderSurface({}, false);
    const card = screen.getByTestId("finding-identity");
    expect(within(card).getByRole("button", { name: "Accept" })).toBeDisabled();
    expect(
      within(card).getByRole("button", { name: "Challenge" }),
    ).toBeDisabled();
    expect(screen.getByText(/authorized workspace user/)).toBeInTheDocument();
  });

  it("renders a designed pending state with no finding cards", () => {
    render(
      <MovesPhaseFindings
        model={{ ...MODEL, pending: true, findings: [] }}
        review={{}}
        onReview={jest.fn()}
        canReview
      />,
    );
    expect(screen.getByTestId("findings-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("finding-identity")).not.toBeInTheDocument();
  });

  it("renders no charts layer when no charts model is passed (Increment 2 shape)", () => {
    renderSurface();
    expect(screen.queryByTestId("moves-phase-charts")).toBeNull();
  });

  it("hosts the Increment 3 charts layer beneath the findings when a charts model is passed", () => {
    render(
      <MovesPhaseFindings
        model={MODEL}
        review={{}}
        onReview={jest.fn()}
        canReview
        charts={{
          phase: 2,
          surface: "diagnosis",
          anyIllustrative: false,
          honestyNote: null,
          pending: false,
          charts: [
            {
              kind: "governed_share",
              id: "governed_share",
              title: "Governed share by domain",
              caption: "Readiness-derived.",
              illustrative: false,
              provenance: "readiness_derived",
              provenanceLabel: "Readiness-derived",
              data: [
                { key: "identity", label: "Identity", fraction: 1, valueLabel: "100%", statusLabel: "Committed" },
              ],
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId("moves-phase-charts")).toBeInTheDocument();
    expect(screen.getByTestId("chart-governed_share")).toBeInTheDocument();
  });

  it("does not render the charts layer when the charts model is pending", () => {
    render(
      <MovesPhaseFindings
        model={MODEL}
        review={{}}
        onReview={jest.fn()}
        canReview
        charts={{
          phase: 2,
          surface: "diagnosis",
          anyIllustrative: false,
          honestyNote: null,
          pending: true,
          charts: [],
        }}
      />,
    );
    expect(screen.queryByTestId("moves-phase-charts")).toBeNull();
  });
});

describe("FindingsReviewGateSummary", () => {
  it("reads blocked and names the open finding while any is awaiting", () => {
    render(
      <FindingsReviewGateSummary
        summary={summarizePhaseFindingsReview(MODEL, { identity: "accepted" })}
      />,
    );
    const el = screen.getByTestId("findings-gate-summary");
    expect(el).toHaveAttribute("data-blocked", "true");
    expect(el).toHaveTextContent("1 accepted · 0 challenged · 1 awaiting");
    expect(el).toHaveTextContent('resolve "PHI access is ungoverned"');
  });

  it("names a challenged finding to resolve when none are awaiting", () => {
    render(
      <FindingsReviewGateSummary
        summary={summarizePhaseFindingsReview(MODEL, {
          identity: "accepted",
          access: "challenged",
        })}
      />,
    );
    const el = screen.getByTestId("findings-gate-summary");
    expect(el).toHaveAttribute("data-blocked", "true");
    expect(el).toHaveTextContent("is challenged");
  });

  it("reads resolved once every finding is accepted", () => {
    render(
      <FindingsReviewGateSummary
        summary={summarizePhaseFindingsReview(MODEL, {
          identity: "accepted",
          access: "accepted",
        })}
      />,
    );
    const el = screen.getByTestId("findings-gate-summary");
    expect(el).toHaveAttribute("data-blocked", "false");
    expect(el).toHaveTextContent("All findings reviewed");
  });
});

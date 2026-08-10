/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { SourceVendorSelectionReadinessPanel } from "../SourceVendorSelectionReadinessPanel";
import type { SourceVendorSelectionReadiness } from "@/lib/source/vendor-selection-readiness-types";

function readiness(
  overrides: Partial<SourceVendorSelectionReadiness> = {},
): SourceVendorSelectionReadiness {
  return {
    eventId: "event-1",
    eventName: "Selection Review Event",
    generatedAt: "2026-08-10T12:00:00.000Z",
    readinessStatus: "blocked_missing_pricing",
    selectionPosture: "blocked_missing_pricing",
    selectionReviewReady: false,
    viableVendors: ["Vendor A"],
    blockedVendors: ["Vendor B"],
    unresolvedCommercialIssues: ["Pricing template missing for one finalist."],
    unresolvedEvidenceIssues: ["Transition evidence is incomplete."],
    unresolvedGateIssues: ["Steering approval is not complete."],
    requiredArtifacts: ["Selection Recommendation"],
    requiredApprovals: ["Steering committee approval"],
    requiredApprovalsForSelection: ["Steering committee approval"],
    recommendedNextAction:
      "Collect complete pricing templates and comparable line-item support.",
    nexusRecommendation:
      "Keep in evidence-repair mode until blockers are closed.",
    sentinelCautions: ["Do not treat this as a final award."],
    stewardGateNotes: ["Gate owner review is still required."],
    atlasExecutiveImplication: "Selection review is not yet safe.",
    sourceModulesUsed: [
      "commercial-signals",
      "executive-decision-summary",
      "source-stage-gates",
    ],
    rationale: "Deterministic readiness from source signals.",
    ...overrides,
  };
}

describe("SourceVendorSelectionReadinessPanel", () => {
  it("renders executive-readable readiness without raw enum text", () => {
    render(<SourceVendorSelectionReadinessPanel readiness={readiness()} />);

    expect(
      screen.getByRole("region", { name: /vendor selection readiness panel/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for selection review?")).toBeInTheDocument();
    expect(screen.getByText("Pricing incomplete")).toBeInTheDocument();
    expect(
      screen.getByText(/this panel does not finalize vendor selection/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pricing template missing for one finalist."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Collect complete pricing templates and comparable line-item support.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Selection-readiness readiness signal"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("blocked_missing_pricing"),
    ).not.toBeInTheDocument();
  });

  it("shows a ready posture without implying final award approval", () => {
    render(
      <SourceVendorSelectionReadinessPanel
        readiness={readiness({
          readinessStatus: "ready_for_selection_review",
          selectionPosture: "ready_for_selection_review",
          selectionReviewReady: true,
          unresolvedCommercialIssues: [],
          unresolvedEvidenceIssues: [],
          unresolvedGateIssues: [],
          requiredArtifacts: [],
          requiredApprovals: [],
          requiredApprovalsForSelection: [],
          sentinelCautions: [],
          stewardGateNotes: [],
        })}
      />,
    );

    expect(screen.getByText("Ready for selection review")).toBeInTheDocument();
    expect(screen.getByText("Selection ready: yes")).toBeInTheDocument();
    expect(
      screen.getByText(/no commercial blockers recorded/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/award approved/i)).not.toBeInTheDocument();
  });
});

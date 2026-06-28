/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StrategicMovePhaseClient } from "../StrategicMovePhaseClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { StrategicMove } from "@/lib/programs/types.ui";

function makeMove(): StrategicMove {
  return {
    id: "49c77bca-471d-4398-8b13-fa8ed1487597",
    displayCode: "RETAIL-LAKESHORE-2026",
    name: "Lakeshore Enterprise Finance & Treasury Modernization",
    archetype: "operational_optimization",
    tenant: {
      id: "tenant-lakeshore",
      name: "Lakeshore Holdings",
      industryCode: "retail",
    },
    charter: null,
    functionPackKey: null,
    currentPhase: 2,
    phaseLabel: "P2 Discover & Diagnose",
    status: {
      key: "on_track",
      text: "On track",
      description: "Phase capture in progress",
    },
    statusColor: "green",
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "Finance modernization",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  };
}

const needPacket: MoveEvidenceNeedPacket = {
  moveId: "49c77bca-471d-4398-8b13-fa8ed1487597",
  phase: 2,
  artifactType: "discovery_report",
  evidenceSlot: "Current-state process / operating documentation",
  familyId: "current_state_process",
  priority: "required",
  ownerSource: "Process owner",
  acceptedFormats: ["Doc", "Spreadsheet"],
  exampleTemplate: "AP invoice exception process packet",
  exampleContent: [
    "AP invoice exception workflow notes with exception categories, handoffs, approval rules, and rework loops",
  ],
  whyItMatters:
    "AbarVa cannot produce a credible P2 Current Work Diagnostic or P3 Future-State Workflow until it knows how invoice exceptions move through the organization today.",
  blockedArtifacts: [
    {
      artifactType: "discovery_report",
      title: "Discovery & Diagnosis Report",
      phase: 2,
      reason:
        "Current-state process / operating documentation is needed for a final-quality Discovery & Diagnosis Report.",
    },
  ],
  canDraftBoundary: {
    canDraft: false,
    canDraftLabel:
      "Final generation is blocked until this evidence is uploaded or formally waived.",
    cannotDraftLabel:
      "Do not present final or board-ready output until this evidence is covered or waived.",
  },
  preliminaryGenerationCaveat:
    "A preliminary draft lane is not active for this phase. Final generation must wait until current-state process / operating documentation is uploaded or formally waived.",
  waiverOption:
    "A sponsor or accountable owner may record a waiver, but final artifacts must carry the waiver caveat.",
  nextAction:
    "Upload AP workflow notes, exception-handling SOPs, process workshop notes, or sampled exception case summaries.",
  status: "missing",
  evidenceTitles: [],
};

describe("StrategicMovePhaseClient operating layer", () => {
  it("renders What We Need Next and review feedback guidance in the phase workspace", () => {
    render(
      <StrategicMovePhaseClient
        move={makeMove()}
        phaseNum={2}
        evidenceNeedPackets={[needPacket]}
      />,
    );

    expect(
      screen.getByText("What We Need Before This Phase Is Final"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("What We Need Next").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/AP invoice exception workflow notes/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByTestId("moves-phase-review-feedback-loop"),
    ).toHaveTextContent("Upload client comments or review notes");
  });
});

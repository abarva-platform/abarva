/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrategicMovePhaseClient } from "../StrategicMovePhaseClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { StrategicMove } from "@/lib/programs/types.ui";

const mockRouterPush = jest.fn();
const mockRouterRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

beforeEach(() => {
  mockRouterPush.mockReset();
  mockRouterRefresh.mockReset();
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => null,
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeCompleteP0Move(): StrategicMove {
  return makeMove({
    name: "Kyriba treasury rollout value realization",
    currentPhase: 0,
    phaseLabel: "P0 Originate",
    charter: {
      scaffold: {
        business_trigger:
          "Treasury leaders need the rollout framed before funding more automation.",
        problem_statement:
          "Kyriba go-live needs bank connectivity, SAP feeds, signer controls, and SOX evidence before it is value-ready.",
        affected_function_process:
          "Treasury, finance systems, bank connectivity, and payment controls.",
        sponsor_candidate: "CFO and Treasurer accountable, CIO consulted",
        value_hypothesis:
          "Reduce manual cash positioning work and improve liquidity visibility.",
        scope_boundary:
          "In: Kyriba, bank connectivity, SAP/AP/AR/GL feeds, payment controls. Out: SAP replacement.",
        evidence_family:
          "Cash visibility baseline, bank account inventory, payment formats, signer matrix, SOX control evidence.",
        missing_evidence_open_questions:
          "Confirm signer matrix owner and current cash-positioning baseline before P1.",
        recommendation_to_advance:
          "Advance to P1 Charter to validate sponsor authority and evidence plan.",
      },
    },
  });
}

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
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
    ...overrides,
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
  it("renders evidence workbench upload guidance in the phase workspace", async () => {
    render(
      <StrategicMovePhaseClient
        move={makeMove()}
        phaseNum={2}
        evidenceNeedPackets={[needPacket]}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /\+ Add evidence/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getAllByText(/Current-state process \/ operating documentation/i).length,
    ).toBeGreaterThan(0);
  });

  it("renders sponsor pending copy instead of raw unassigned language", async () => {
    render(
      <StrategicMovePhaseClient
        move={makeMove()}
        phaseNum={2}
        evidenceNeedPackets={[needPacket]}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText(/Sponsor: To be assigned/i).length).toBeGreaterThan(0),
    );
    expect(screen.queryByText(/Sponsor: Unassigned/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SPONSOR: UNASSIGNED/i)).not.toBeInTheDocument();
  });

  it("renders P0 capture details from the nested origination charter scaffold", async () => {
    render(
      <StrategicMovePhaseClient
        move={makeMove({
          ...makeCompleteP0Move(),
        })}
        phaseNum={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/8 of 8 inputs provided/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/bank connectivity, SAP feeds/i)).toBeInTheDocument();
    expect(screen.getByText(/CFO and Treasurer accountable/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash visibility baseline/i)).toBeInTheDocument();
    const advanceButton = screen.getByRole("button", {
      name: /Approve brief & advance to P1/i,
    });
    expect(advanceButton).toBeInTheDocument();
    expect(advanceButton).toBeEnabled();
    expect(screen.queryByText(/Work with Ava in the chat pane to populate this section/i)).not.toBeInTheDocument();
  });

  it("posts complete P0 capture and uses the governed gate approval route when advancing", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, newPhase: 1 }),
      });

    render(
      <StrategicMovePhaseClient move={makeCompleteP0Move()} phaseNum={0} />,
    );

    await screen.findByText(/8 of 8 inputs provided/i);
    const advanceButton = screen.getByRole("button", {
      name: /Approve brief & advance to P1/i,
    });
    expect(advanceButton).toBeEnabled();

    fireEvent.click(advanceButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/programs/49c77bca-471d-4398-8b13-fa8ed1487597/phase-capture",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"phase":0'),
      }),
    );
    const captureBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(Object.keys(captureBody.items).sort()).toEqual([
      "affected_function_process",
      "business_trigger",
      "initial_value_hypothesis",
      "known_evidence",
      "missing_evidence_open_questions",
      "problem_statement",
      "recommendation_to_advance",
      "stakeholder_owner_view",
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/v1/programs/49c77bca-471d-4398-8b13-fa8ed1487597/phase-gate-approval",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"phase":0'),
      }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/strategic-moves/49c77bca-471d-4398-8b13-fa8ed1487597/phase/1",
    );
  });
});

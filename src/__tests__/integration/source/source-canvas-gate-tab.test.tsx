/**
 * @jest-environment jsdom
 *
 * Focused SSR tests for GateTab — covers the Source gate checklist
 * and its required-input status surface.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import type { SourceEventGateCriterion } from "@/lib/source/canvas-substrate";
import { GateTab } from "@/components/source/canvas/workspace-tabs/GateTab";
import {
  assessStageGate,
  buildStageRecommendation,
} from "@/lib/source/gate-auto-assessment";

type EvidenceState = Parameters<typeof assessStageGate>[0]["evidence"][number];

function makeCriterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "c1",
    sourceEventId: "evt-canvas-1",
    tenantKey: "apexretail",
    criterionId: "GATE-SCOPE-01",
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-05-07T20:00:00Z",
    updatedAt: "2026-05-07T20:00:00Z",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<EvidenceState>): EvidenceState {
  return {
    id: "e1",
    sourceEventId: "evt-canvas-1",
    tenantKey: "skyharbor-air",
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    stage: "scope",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-06-15T00:00:00Z",
    updatedAt: "2026-06-15T00:00:00Z",
    ...overrides,
  };
}

describe("GateTab · required input checklist", () => {
  it("renders the evidence-derived stage decision status and criterion provenance", () => {
    const states = [
      makeCriterion({ criterionId: "GATE-SCOPE-01", state: "pending" }),
      makeCriterion({ criterionId: "EVID-SCOPE-01", state: "pending" }),
    ];
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: states,
      evidence: [
        {
          id: "e1",
          sourceEventId: "evt-canvas-1",
          tenantKey: "skyharbor-air",
          requirementId: "EVID-SRC-SCOPE-APP-INV",
          stage: "scope",
          currentState: "Usable Evidence",
          sourceArtifactId: "artifact-1",
          notes: null,
          lastSyncedAt: null,
          createdAt: "2026-06-15T00:00:00Z",
          updatedAt: "2026-06-15T00:00:00Z",
        },
        {
          id: "e2",
          sourceEventId: "evt-canvas-1",
          tenantKey: "skyharbor-air",
          requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
          stage: "scope",
          currentState: "Parsed",
          sourceArtifactId: "artifact-2",
          notes: null,
          lastSyncedAt: null,
          createdAt: "2026-06-15T00:00:00Z",
          updatedAt: "2026-06-15T00:00:00Z",
        },
      ],
    });
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states,
        assessment,
        recommendation: buildStageRecommendation(assessment),
      }),
    );

    expect(html).toContain("source-stage-decision-status");
    expect(html).toContain("source-gate-required-inputs");
    expect(html).toContain("Ready");
    expect(html).toContain("Missing");
    expect(html).toContain("Application inventory");
    expect(html).toContain("L2/L3 ticket history");
    expect(html).not.toContain("hard criterion");
    expect(html).not.toContain("source-canvas-gate-blockers");
  });

  it("surfaces one compact criteria list when criteria are not met", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states: [
          makeCriterion({ criterionId: "GATE-SCOPE-01", state: "pending" }),
          makeCriterion({ criterionId: "GATE-SCOPE-02", state: "not_met" }),
          makeCriterion({ criterionId: "GATE-SCOPE-03", state: "met" }),
        ],
      }),
    );
    expect(html).not.toContain("source-canvas-gate-blockers");
    expect(html).toContain("source-canvas-gate-criterion-GATE-SCOPE-01");
    expect(html).toContain("source-canvas-gate-criterion-GATE-SCOPE-02");
    expect(html).toContain("source-canvas-gate-criterion-GATE-SCOPE-03");
    expect(
      (html.match(/source-canvas-gate-criterion-GATE-SCOPE-01/g) ?? [])
        .length,
    ).toBe(1);
    // Header is the only summary.
    expect(html).toContain("1 of 3 cleared");
    // Promote button is aria-described by the compact header for screen readers.
    expect(html).toMatch(/aria-describedby="source-canvas-gate-promote-help"/);
    expect(html).toContain("source-gate-required-inputs");
    expect(html).toContain("Scope → RFP gate");
    expect(html).toContain("Advance anyway");
    // State pills render alongside row titles.
    expect(html).toContain("source-canvas-gate-criterion-state-pending");
    expect(html).toContain("source-canvas-gate-criterion-state-not_met");
    expect(html).toContain("source-canvas-gate-criterion-state-met");
  });

  it("hides the blocker callout and shows the all-met approval line when nothing is blocking", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states: [
          makeCriterion({ criterionId: "GATE-1", state: "met" }),
          makeCriterion({ criterionId: "GATE-2", state: "waived" }),
        ],
      }),
    );
    expect(html).not.toContain("source-canvas-gate-blockers");
    expect(html).toContain("All inputs are ready. Write the reason and approve");
    // Promote button has no aria-describedby when nothing is blocking.
    expect(html).not.toContain(
      'aria-describedby="source-canvas-gate-promote-help"',
    );
  });

  it("keeps approval reasons hidden until Mark met opens one row", () => {
    const onChange = jest.fn();
    render(
      createElement(GateTab, {
        fromStage: "scope",
        states: [
          makeCriterion({ criterionId: "GATE-1", state: "pending" }),
          makeCriterion({ criterionId: "GATE-2", state: "met" }),
          makeCriterion({ criterionId: "GATE-3", state: "waived" }),
        ],
        onChangeCriterionState: onChange,
      }),
    );
    expect(
      screen.getByTestId("source-canvas-gate-criterion-mark-met-GATE-1"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("source-canvas-gate-criterion-reason-GATE-1"),
    ).toBeNull();
    fireEvent.click(
      screen.getByTestId("source-canvas-gate-criterion-mark-met-GATE-1"),
    );
    expect(
      screen.getByTestId("source-canvas-gate-criterion-reason-GATE-1"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("source-canvas-gate-criterion-reason-GATE-2"),
    ).toBeNull();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByTestId("source-canvas-gate-criterion-reason-GATE-1"),
    ).toBeNull();
    expect(
      screen.getByTestId("source-canvas-gate-criterion-reopen-GATE-2"),
    ).toBeTruthy();
    // Waived rows hide both buttons (waiver path has its own flow).
    expect(
      screen.queryByTestId("source-canvas-gate-criterion-mark-met-GATE-3"),
    ).toBeNull();
    expect(
      screen.queryByTestId("source-canvas-gate-criterion-reopen-GATE-3"),
    ).toBeNull();
  });

  it("collapses multi-input gaps behind one count line", () => {
    const states = [
      makeCriterion({ criterionId: "GATE-SCOPE-04", state: "pending" }),
    ];
    const assessment = assessStageGate({
      fromStage: "scope",
      criteria: states,
      evidence: [
        makeEvidence({ requirementId: "EVID-SRC-SCOPE-APP-INV" }),
        makeEvidence({ requirementId: "EVID-SRC-SCOPE-ORG" }),
        makeEvidence({ requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY" }),
        makeEvidence({ requirementId: "EVID-SRC-SCOPE-FY-CONTRACT" }),
      ],
    });
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states,
        assessment,
        recommendation: buildStageRecommendation(assessment),
      }),
    );
    expect(html).toContain("4 inputs not ready");
    expect(html).toContain("see what&#x27;s missing");
    expect(html).toContain("source-gate-required-input-GATE-SCOPE-04");
    expect(
      (html.match(/source-canvas-gate-criterion-GATE-SCOPE-04/g) ?? [])
        .length,
    ).toBe(1);
  });

  it("shows compact approval status inline without adding a second list", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states: [
          makeCriterion({ criterionId: "GATE-SCOPE-01", state: "pending" }),
          makeCriterion({ criterionId: "GATE-SCOPE-02", state: "met" }),
        ],
        approvalViewByCriterionId: {
          "GATE-SCOPE-01": {
            ownerRole: "ea-council",
            status: "unresolved",
            label: "Approval unresolved",
            detail: "EA council approval has no resolved person field in C1.",
          },
          "GATE-SCOPE-02": {
            ownerRole: "sponsor",
            status: "approved",
            label: "Tomas Singh",
            detail: "approval recorded",
          },
        },
      }),
    );
    expect(html).toContain(
      "source-canvas-gate-criterion-approval-GATE-SCOPE-01",
    );
    expect(html).toContain("Approval unresolved");
    expect(html).toContain("Tomas Singh");
    expect(html).toContain("source-gate-required-inputs");
    expect(html).not.toContain("source-canvas-gate-approval-list");
  });

  it("Promote button stays disabled when onPromoteStage is omitted (SSR / no handler)", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states: [
          makeCriterion({ criterionId: "GATE-1", state: "met" }),
          makeCriterion({ criterionId: "GATE-2", state: "met" }),
        ],
      }),
    );
    // Even with all criteria met, the button is disabled when no
    // handler is wired — prevents the prod regression where the
    // visually-enabled button did nothing on click.
    expect(html).toMatch(
      /<button[^>]*disabled[^>]*data-testid="source-canvas-gate-promote"|<button[^>]*data-testid="source-canvas-gate-promote"[^>]*disabled/,
    );
    expect(html).toContain("cursor:not-allowed");
  });

  it("hides manual confirmation controls when onChangeCriterionState is omitted (SSR)", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, {
        fromStage: "scope",
        states: [makeCriterion({ criterionId: "GATE-1", state: "pending" })],
      }),
    );
    expect(html).not.toContain("source-canvas-gate-criterion-mark-met-GATE-1");
  });

  it("shows empty body copy when no criteria exist for the transition", () => {
    const html = renderToStaticMarkup(
      createElement(GateTab, { fromStage: "scope", states: [] }),
    );
    expect(html).toContain("No gate criteria defined");
    expect(html).not.toContain("source-canvas-gate-blockers");
  });
});

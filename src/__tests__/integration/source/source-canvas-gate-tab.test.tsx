/**
 * Focused SSR tests for GateTab — covers the Source gate checklist
 * and its required-input status surface.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SourceEventGateCriterion } from "@/lib/source/canvas-substrate";
import { GateTab } from "@/components/source/canvas/workspace-tabs/GateTab";
import {
  assessStageGate,
  buildStageRecommendation,
} from "@/lib/source/gate-auto-assessment";

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
    expect(html).toContain("Ready");
    expect(html).toContain("Missing input");
    expect(html).toContain("Application inventory is Usable Evidence");
    expect(html).toContain("L2/L3 ticket history is Parsed");
  });

  it("surfaces explicit blocker rows when criteria are not met", () => {
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
    expect(html).toContain("source-canvas-gate-blockers");
    expect(html).toContain("source-canvas-gate-blocker-GATE-SCOPE-01");
    expect(html).toContain("source-canvas-gate-blocker-GATE-SCOPE-02");
    // Met criterion is excluded from the blocker callout (it still
    // renders in the criteria list below).
    expect(html).not.toContain("source-canvas-gate-blocker-GATE-SCOPE-03");
    // Fallback title reflects the unmet count when no recommendation is present.
    expect(html).toContain("2 inputs");
    // Promote button is aria-described by the callout for screen readers.
    expect(html).toMatch(/aria-describedby="source-canvas-gate-promote-help"/);
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
    expect(html).toContain("All items met. Write the reason and approve");
    // Promote button has no aria-describedby when nothing is blocking.
    expect(html).not.toContain(
      'aria-describedby="source-canvas-gate-promote-help"',
    );
  });

  it("renders a manual confirmation control on pending criteria when onChangeCriterionState is wired", () => {
    const onChange = jest.fn();
    const html = renderToStaticMarkup(
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
    expect(html).toContain("source-canvas-gate-criterion-mark-met-GATE-1");
    expect(html).toContain("Confirm manually");
    expect(html).toContain("Confirm input");
    expect(html).toContain("source-canvas-gate-criterion-reopen-GATE-2");
    // Waived rows hide both buttons (waiver path has its own flow).
    expect(html).not.toContain("source-canvas-gate-criterion-mark-met-GATE-3");
    expect(html).not.toContain("source-canvas-gate-criterion-reopen-GATE-3");
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

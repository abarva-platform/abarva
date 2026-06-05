import { chatWidthForStage } from "../chat-sizing-policy";
import type { SourceEventArtifactState } from "../canvas-substrate";

function artifact(
  status: SourceEventArtifactState["status"],
  body: string | null = null,
): SourceEventArtifactState {
  return {
    id: "artifact-1",
    sourceEventId: "event-1",
    tenantKey: "apexretail",
    artifactCode: "d01_strategy_memo",
    stage: "strategy",
    family: "sourcing_strategy",
    tier: "stub",
    status,
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
  };
}

describe("chatWidthForStage", () => {
  it("keeps empty drafting stages slim so the Next Move owns the screen", () => {
    expect(
      chatWidthForStage("strategy", [artifact("not_started")]),
    ).toMatchObject({
      widthPct: 30,
      mode: "side-rail",
      resetKey: "strategy",
    });
  });

  it("uses the standard strategy width once content exists", () => {
    expect(
      chatWidthForStage("strategy", [artifact("needs_review", "# Memo")]),
    ).toMatchObject({
      widthPct: 40,
      mode: "side-rail",
    });
  });

  it("collapses the executive decision rail by default", () => {
    expect(chatWidthForStage("executive_decision", [])).toMatchObject({
      widthPct: 15,
      mode: "collapsed",
      collapsedSummary: "Click to expand · 3 stage-specific suggestions",
    });
  });

  it("normalizes legacy stage aliases before choosing a width", () => {
    expect(chatWidthForStage("vendor_responses", [])).toMatchObject({
      stage: "responses",
      widthPct: 30,
      mode: "side-rail",
      resetKey: "responses",
    });
  });
});

import { assertNarrativeArtifactExportable } from "../payloads/narrative-docx-payload";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate/types";

function makeState(
  body: string | null,
  bodyGenerationMetadata: Record<string, unknown> | null = null,
): SourceEventArtifactState {
  return {
    id: "state-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor",
    artifactCode: "d09_rfp_pack",
    stage: "rfp",
    family: "rfp",
    tier: "outline",
    status: body ? "approved" : "not_started",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata,
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };
}

describe("narrative export quality gate", () => {
  const issueReadyRfpBody = [
    "# RFP",
    "",
    "Value at stake: $27.0M",
    "",
    "## Risk register",
    "",
    "| Risk | Owner | Mitigation |",
    "| --- | --- | --- |",
    "| Transition readiness | Sourcing lead | Confirm before issue |",
  ].join("\n");

  it("blocks RFP export when only the scaffold would be rendered", () => {
    expect(() =>
      assertNarrativeArtifactExportable("d09_rfp_pack", makeState(null)),
    ).toThrow("author or generate the RFP body");
  });

  it("blocks RFP export when the partner-grade gate has not passed", () => {
    expect(() =>
      assertNarrativeArtifactExportable(
        "d09_rfp_pack",
        makeState(issueReadyRfpBody, {
          qualityGate: { passed: false },
        }),
      ),
    ).toThrow("did not pass");
  });

  it("allows RFP export after the partner-grade gate passes", () => {
    expect(() =>
      assertNarrativeArtifactExportable(
        "d09_rfp_pack",
        makeState(issueReadyRfpBody, {
          qualityGate: { passed: true },
        }),
      ),
    ).not.toThrow();
  });

  it("does not impose the RFP quality gate on other narrative artifacts", () => {
    expect(() =>
      assertNarrativeArtifactExportable("d05_scope_memo", makeState(null)),
    ).not.toThrow();
  });
});

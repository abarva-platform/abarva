import {
  evaluateSourceArtifactReadiness,
  evaluateSourceArtifactSetReadiness,
} from "../source-governance-enforcement";
import type { SourceEventArtifactState } from "../canvas-substrate/types";

function artifact(
  artifactCode: string,
  body: string,
  options: {
    status?: SourceEventArtifactState["status"];
    metadata?: Record<string, unknown>;
    stage?: SourceEventArtifactState["stage"];
  } = {},
): SourceEventArtifactState {
  return {
    id: `${artifactCode}-state`,
    sourceEventId: "event-1",
    tenantKey: "industrial",
    artifactCode,
    stage: options.stage ?? "rfp",
    family: "rfp",
    tier: "outline",
    status: options.status ?? "drafting",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: "2026-07-09T00:00:00.000Z",
    bodyGenerationMetadata: options.metadata ?? {
      model: "claude",
      promptTemplateId: artifactCode,
      promptTemplateVersion: 1,
      upstreamBoundCodes: [],
      generatedAt: "2026-07-09T00:00:00.000Z",
      generatedByUserId: "user-1",
      tokensIn: 1,
      tokensOut: 1,
      stopReason: "end_turn",
    },
    createdAt: "2026-07-09T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
  };
}

const d09ReadyBody = `
# RFP Package

Value at stake: $27.0M

## Risk register

| Risk | Owner | Mitigation |
| --- | --- | --- |
| Transition readiness | Sourcing lead | Confirm plan before issue |
`;

describe("Source artifact readiness governance", () => {
  it("does not allow a failed-QA RFP package to be labeled ready", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact("d09_rfp_pack", d09ReadyBody, {
        status: "needs_review",
        metadata: {
          qualityGate: { passed: false },
          generatedAt: "2026-07-09T00:00:00.000Z",
        },
      }),
    });

    expect(verdict.readiness).toBe("needs_review");
    expect(verdict.vendorFacingSafe).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "quality_gate_failed",
    );
  });

  it("detects $27.5M versus $27.0M cross-artifact value mismatch", () => {
    const result = evaluateSourceArtifactSetReadiness([
      artifact("d01_strategy_memo", "Estimated value: $27.5M"),
      artifact("d09_rfp_pack", d09ReadyBody, {
        metadata: { qualityGate: { passed: true } },
      }),
    ]);

    expect(result.crossArtifactBlockers).toHaveLength(2);
    expect(result.crossArtifactBlockers[0]?.detail).toMatch(/\$27\.5M|\$27M/);
  });

  it("blocks raw spreadsheet citation fragments instead of Exhibit labels", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d05_scope_memo",
        "The scope baseline comes from (r.csv) and should be cited later.",
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "raw_file_citation",
    );
  });

  it("blocks internal UUIDs from client-facing text", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d05_scope_memo",
        "Internal reference 123e4567-e89b-12d3-a456-426614174000 is visible.",
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "internal_uuid_visible",
    );
  });

  it("blocks factual 24x7 P1/P2 coverage when it is not labeled as a recommendation", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d09_rfp_pack",
        `${d09ReadyBody}\nThe incumbent provides 24x7 P1/P2 coverage across all towers.`,
        { metadata: { qualityGate: { passed: true } } },
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "unsupported_sla_coverage_fact",
    );
  });

  it("allows 24x7 P1/P2 coverage when labeled as a vendor requirement", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d09_rfp_pack",
        `${d09ReadyBody}\nVendor must propose 24x7 P1/P2 coverage with staffing evidence.`,
        { metadata: { qualityGate: { passed: true } } },
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).not.toContain(
      "unsupported_sla_coverage_fact",
    );
  });

  it("requires the d09 risk register before vendor issuance", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact("d09_rfp_pack", "Value at stake: $27.0M", {
        metadata: { qualityGate: { passed: true } },
      }),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "risk_register_missing",
    );
  });

  it("blocks scorecards whose weights do not sum to 100", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d16_scorecard",
        `
| Criterion | Weight |
| --- | --- |
| Price | 40% |
| Risk | 30% |
| Transition | 20% |
`,
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "scorecard_weights_not_100",
    );
  });

  it("blocks vendor-facing Gap TBD cells", () => {
    const verdict = evaluateSourceArtifactReadiness({
      artifact: artifact(
        "d09_rfp_pack",
        `${d09ReadyBody}\n| Requirement | Status |\n| --- | --- |\n| SLA baseline | Gap — TBD |`,
        { metadata: { qualityGate: { passed: true } } },
      ),
    });

    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "vendor_facing_tbd_gap",
    );
  });
});

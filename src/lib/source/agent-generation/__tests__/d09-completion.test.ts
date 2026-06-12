import { completeD09RfpGovernanceSections } from "../d09-completion";
import type { SourceGenerationContext } from "../types";

describe("completeD09RfpGovernanceSections", () => {
  it("appends gate-critical D09 appendix tables before quality review", () => {
    const body = [
      "# RFP Package",
      "",
      "## §1 · Executive summary and decision context",
      "Vendor-facing draft.",
      "",
      "## §10 · Risk register, transition controls, and failure modes",
      "| Risk ID | Failure mode |",
      "|---|---|",
      "| R-01 | Incumbent transition issue |",
    ].join("\n");

    const completed = completeD09RfpGovernanceSections({
      artifactCode: "d09_rfp_pack",
      body,
      ctx: makeContext(),
    });

    expect(completed).toContain("## §8A · Process timeline and date-closure controls");
    expect(completed).toContain("## §9A · Evaluation controls and normalization closure");
    expect(completed).toContain("## §10 · Risk register, transition controls, and failure modes");
    expect(completed).toContain("R-08");
    expect(completed).toContain("PCI DSS");
    expect(completed).toContain("1,800+ FTE");
    expect(completed).toContain("### §11A · Source register");
    expect(completed).toContain("### §11B · Gap closure register");
    expect(completed).toContain("G-04");
    expect(completed).toContain("G-09");
    expect(completed).toContain("Exhibit 09 — Approved evaluation criteria and weights");
    expect(completed).toContain("Available parsed evidence — citation review pending");
    expect(completed).toContain(
      "RFP package draft complete — pending client closure of registered gaps.",
    );
  });

  it("is idempotent and does not alter non-D09 artifacts", () => {
    const ctx = makeContext();
    const body = "# Scope Memo";

    expect(
      completeD09RfpGovernanceSections({
        artifactCode: "d05_scope_memo",
        body,
        ctx,
      }),
    ).toBe(body);

    const once = completeD09RfpGovernanceSections({
      artifactCode: "d09_rfp_pack",
      body,
      ctx,
    });
    const twice = completeD09RfpGovernanceSections({
      artifactCode: "d09_rfp_pack",
      body: once,
      ctx,
    });
    expect(twice).toBe(once);
  });
});

function makeContext(): SourceGenerationContext {
  return {
    tenantKey: "skyharbor",
    tenantName: "SkyHarbor Air",
    event: {
      id: "event-1",
      code: "SKYH-IT-MANAGED-SERVICES-2026",
      name: "IT Managed Services Outsourcing",
      archetype: "managed_service",
      rigor: "strategic",
      currentStageKey: "rfp",
      statusLabel: "Active",
      owner: "SVP & CIO",
      triggerDescription: "Contracts expiring.",
      scopeDescription: "Managed services scope.",
      estimatedValueUsd: 300_000_000,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
    uploadedEvidence: [
      {
        id: "artifact-09",
        originalName: "09_Evaluation_Criteria_Weights_APPROVED.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "scope",
        chunkExcerpts: [],
        factSummaries: [],
      },
      {
        id: "artifact-13",
        originalName: "13_Security_Compliance_Control_Posture.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "scope",
        chunkExcerpts: [],
        factSummaries: [],
      },
      {
        id: "artifact-14",
        originalName: "14_Transition_Ops_Blackout_Calendar.csv",
        artifactFamily: "other",
        sourceFormat: "csv",
        parseStatus: "parsed",
        evidenceState: "parsed_uncited",
        stageKey: "scope",
        chunkExcerpts: [],
        factSummaries: [],
      },
    ],
  };
}

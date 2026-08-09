import { completeD09RfpGovernanceSections } from "../d09-completion";
import type {
  SourceGenerationContext,
  SourceGenerationUploadedArtifact,
} from "../types";

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
    expect(completed).toContain("## §0 · Issuance readiness checklist");
    expect(completed).toContain("## §7A · Directional commercial leverage assumptions");
    expect(completed).toContain("## §10 · Risk register, transition controls, and failure modes");
    expect(completed).toContain("## §12 · Legal, commercial, and submission terms for client counsel review");
    expect(completed).toContain("## Appendix A · Vendor Response Workbook Tab Guide");
    expect(completed).toContain("## Appendix B · Vendor Response Workbook Commercial Leverage Map");
    expect(completed).toContain("## Appendix C · Internal Review and Negotiation Workbook");
    expect(completed).toContain("## Appendix D · BAFO and Clarification Round Instructions");
    expect(completed).toContain("R-08");
    expect(completed).toContain("PCI DSS");
    expect(completed).toContain("1,800+ FTE");
    expect(completed).toContain("Vendor Claim Register");
    expect(completed).toContain("Assumptions and Exclusions");
    expect(completed).toContain(
      "Bundled run/change economics",
    );
    expect(completed).toContain("Written clarification");
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

  it("redacts raw incumbent names from client-facing D09 output", () => {
    const completed = completeD09RfpGovernanceSections({
      artifactCode: "d09_rfp_pack",
      body: [
        "# RFP Package",
        "Northwind IT has auto-renew risk.",
        "Apex Digital has a disputed gainshare clause.",
      ].join("\n"),
      ctx: makeContext(),
    });

    expect(completed).not.toMatch(/Northwind|Apex Digital/i);
    expect(completed).toContain("Incumbent Provider A");
    expect(completed).toContain("Incumbent Provider B");
  });

  it("uses planning anchors instead of bracketed placeholders when D09 evidence is present", () => {
    const completed = completeD09RfpGovernanceSections({
      artifactCode: "d09_rfp_pack",
      body: "# RFP Package\n\n## §1 · Executive summary",
      ctx: makeContext([
        "01_Application_Portfolio_InScope_60Apps.csv",
        "02_ITSM_Ticket_Volumetrics_12mo.csv",
        "03_System_Workload_Volumetrics.csv",
        "04_Resource_Capacity_Baseline_Pyramid.csv",
        "05_SLA_XLA_Matrix_Current.csv",
        "06_Tower_Scope_Service_Catalog.csv",
        "07_Incumbent_Contract_Baseline_INTERNAL.md",
        "08_Locked_Pricing_Assumptions_Volume_Bands.csv",
        "09_Evaluation_Criteria_Weights_APPROVED.md",
        "10_Vendor_Response_Expectations_and_Legal_Terms.md",
        "11_Data_Center_Infrastructure_Inventory.csv",
        "12_Network_Topology_Circuit_Inventory.csv",
        "13_Security_Compliance_Control_Posture.md",
        "14_Transition_Ops_Blackout_Calendar.csv",
        "15_Run_vs_Change_Financial_Baseline.csv",
      ]),
    });

    expect(completed).not.toMatch(/\[CLIENT TO (SET|CONFIRM|COMPLETE)\]/);
    expect(completed).not.toMatch(/placeholder/i);
    expect(completed).toContain("T+5 weeks from sponsor sign-off");
    expect(completed).toContain("Vendor Response Workbook Tab Guide");
    expect(completed).toContain("Pricing Response: run vs change split");
    expect(completed).toContain(
      "Approved evaluation criteria and weights are loaded",
    );
  });
});

function makeContext(filenames?: string[]): SourceGenerationContext {
  const uploadedEvidence: SourceGenerationUploadedArtifact[] =
    filenames?.map((originalName, index) => ({
      id: `artifact-${index + 1}`,
      originalName,
      artifactFamily: "other",
      sourceFormat: originalName.endsWith(".md") ? "markdown" : "csv",
      parseStatus: "parsed",
      evidenceState: "parsed_uncited",
      stageKey: "scope" as const,
      chunkExcerpts: [],
      factSummaries: [],
    })) ?? [
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
    ];

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
    uploadedEvidence,
  };
}

import {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
  SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE,
} from "../prompt-registry";
import type { SourceGenerationContext } from "../types";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate/types";

describe("Source artifact prompt registry provider config", () => {
  it("uses Anthropic Claude model ids for every generatable Source artifact", () => {
    const codes = listSupportedGenerationCodes();

    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      const template = getPromptTemplate(code);
      expect(template?.model).toMatch(/^claude-/);
    }
  });

  it("configures the D09 RFP package as a board-grade, source-disciplined deliverable", () => {
    const template = getPromptTemplate("d09_rfp_pack");

    expect(template?.version).toBeGreaterThanOrEqual(10);
    expect(template?.maxTokens).toBeGreaterThanOrEqual(5000);
    expect(template?.systemPrompt).toContain("Source register");
    expect(template?.systemPrompt).toContain("Risk, issue, dependency");
    expect(template?.systemPrompt).toContain("client-to-complete");
    expect(template?.systemPrompt).toContain("friendly exhibit labels");
    expect(template?.systemPrompt).toContain("Never stop after a partial table");
    expect(template?.systemPrompt).toContain("Section budget");
    expect(template?.systemPrompt).toContain("Preserve sections §7–§11");
    expect(template?.systemPrompt).toContain(
      "Do not use bracketed client fill-in markers",
    );
    expect(template?.systemPrompt).toContain(
      "blocking gate and downstream impact",
    );
    expect(template?.systemPrompt).toContain("Compact required appendix block");
    expect(template?.systemPrompt).toContain("§11A table");
    expect(template?.systemPrompt).toContain(
      "RFP package draft complete — pending client closure of registered gaps.",
    );
    expect(template?.systemPrompt).toContain(SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE);
    expect(template?.systemPrompt).toContain("Vendor Claim Register");
    expect(template?.systemPrompt).toContain("Commercial Exceptions Table");
  });

  it("keeps the existing core Source generation artifacts available", () => {
    const codes = listSupportedGenerationCodes();

    expect(codes).toEqual(
      expect.arrayContaining([
        "d01_strategy_memo",
        "d02_value_target",
        "d05_scope_memo",
        "d09_rfp_pack",
        "d11_response_checklist",
        "d13_vendor_responses",
        "d14_qa_log",
        "d15_response_completeness",
        "d19_pricing_workbook",
        "d20_trap_log",
        "d21_assumption_set",
      ]),
    );
  });

  it("configures D11 as the Vendor Response Control Pack with all required sections", () => {
    const template = getPromptTemplate("d11_response_checklist");

    expect(template).not.toBeNull();
    expect(template?.systemPrompt).toContain("Vendor Response Control Pack");
    expect(template?.systemPrompt).toContain(SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE);
    expect(template?.systemPrompt).toContain("Vendor Claim Register");
    expect(template?.systemPrompt).toContain("Automation / Productivity Commitment Table");
    expect(template?.systemPrompt).toContain("Structured Pricing Workbook");
    expect(template?.systemPrompt).toContain("Staffing and Location Model");
    expect(template?.systemPrompt).toContain("SLA Commitment Table");
    expect(template?.systemPrompt).toContain("Assumptions and Exclusions Log");
    expect(template?.systemPrompt).toContain("Transition Plan Template");
    expect(template?.systemPrompt).toContain("Commercial Exceptions Table");
    expect(template?.systemPrompt).toContain("Productivity claimed but not priced back");
    expect(template?.systemPrompt).toContain("Outcome claim not contractually committed");
    expect(template?.systemPrompt).toContain("Do not claim perfect proposal parsing");
    expect(template?.systemPrompt).not.toContain("Sentinel");
    expect(template?.systemPrompt).not.toContain("Nexus");
    expect(template?.systemPrompt).not.toContain("Atlas");
  });

  it("binds event context and upstream RFP context into the D11 control-pack prompt", () => {
    const template = getPromptTemplate("d11_response_checklist");
    const ctx = makeD09Context([]);
    ctx.artifactStates = [
      makeArtifactState("d01_strategy_memo", "# Strategy\n\nApproved strategy."),
      makeArtifactState("d05_scope_memo", "# Scope\n\nApproved scope."),
    ];

    const message = template?.buildUserMessage(ctx, {
      d01_strategy_memo: "# Strategy\n\nApproved strategy.",
      d05_scope_memo: "# Scope\n\nApproved scope.",
      d09_rfp_pack: "# RFP\n\nVendor response instructions.",
    });

    expect(findMissingUpstreamCodes(template!, ctx)).toEqual([]);
    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Event: IT Managed Services Outsourcing");
    expect(message).toContain("Trigger / why-now: Contracts expiring.");
    expect(message).toContain("Scope description: Managed services scope.");
    expect(message).toContain("Draft RFP Package (d09_rfp_pack)");
    expect(message).toContain("Vendor Response Control Pack");
    expect(message).toContain("future commercial leverage checks");
  });

  it("configures the responses-stage prompts as a governed workflow", () => {
    const d13 = getPromptTemplate("d13_vendor_responses");
    const d14 = getPromptTemplate("d14_qa_log");
    const d15 = getPromptTemplate("d15_response_completeness");

    expect(d13).not.toBeNull();
    expect(d14).not.toBeNull();
    expect(d15).not.toBeNull();
    expect(d13?.upstreamRequired).toEqual([
      "d09_rfp_pack",
      "d11_response_checklist",
    ]);
    expect(d14?.upstreamRequired).toEqual(["d09_rfp_pack"]);
    expect(d15?.upstreamRequired).toEqual([
      "d11_response_checklist",
      "d13_vendor_responses",
    ]);
    expect(d13?.systemPrompt).toContain("Response intake status");
    expect(d13?.systemPrompt).toContain(SOURCE_VENDOR_RESPONSE_CONTROL_MANDATE);
    expect(d14?.systemPrompt).toContain("published to all eligible vendors");
    expect(d14?.systemPrompt).toContain("Binding addenda and RFP changes");
    expect(d15?.systemPrompt).toContain("Completeness gate decision");
    expect(d15?.systemPrompt).toContain("must not rank vendors on merit");
  });

  it("blocks vendor response intake until the RFP and control pack exist", () => {
    const d13 = getPromptTemplate("d13_vendor_responses");
    const ctx = makeD09Context(["Vendor_A_Response.docx"]);

    expect(findMissingUpstreamCodes(d13!, ctx)).toEqual([
      "d09_rfp_pack",
      "d11_response_checklist",
    ]);

    ctx.artifactStates = [
      makeArtifactState("d09_rfp_pack", "# RFP\n\nIssued package."),
      makeArtifactState(
        "d11_response_checklist",
        "# Response Control\n\nStructured tables required.",
      ),
    ];

    expect(findMissingUpstreamCodes(d13!, ctx)).toEqual([]);
  });

  it("binds uploaded vendor evidence into the vendor response pack prompt", () => {
    const d13 = getPromptTemplate("d13_vendor_responses");
    const ctx = makeD09Context([
      "Vendor_A_Response.docx",
      "Vendor_A_Pricing_Workbook.xlsx",
      "Vendor_B_Commercial_Exceptions.xlsx",
    ]);

    const message = d13?.buildUserMessage(ctx, {
      d09_rfp_pack: "# RFP\n\nVendor response instructions.",
      d11_response_checklist:
        "# Vendor Response Control Pack\n\nStructured pricing workbook required.",
      d14_qa_log: "# Q&A\n\nQuestion Q-01 answered for all vendors.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Vendor Response Pack");
    expect(message).toContain("RFP Package (d09_rfp_pack)");
    expect(message).toContain("Vendor Response Control Pack");
    expect(message).toContain("Vendor_A_Response.docx");
    expect(message).toContain("Vendor_A_Pricing_Workbook.xlsx");
    expect(message).toContain("Question Q-01 answered for all vendors");
    expect(message).toContain(
      "do not invent vendors, prices, claims, or completeness",
    );
  });

  it("requires the vendor response pack before drafting response completeness", () => {
    const d15 = getPromptTemplate("d15_response_completeness");
    const ctx = makeD09Context(["Vendor_A_Response.docx"]);
    ctx.artifactStates = [
      makeArtifactState(
        "d11_response_checklist",
        "# Response Control\n\nStructured tables required.",
      ),
    ];

    expect(findMissingUpstreamCodes(d15!, ctx)).toEqual([
      "d13_vendor_responses",
    ]);

    ctx.artifactStates.push(
      makeArtifactState(
        "d13_vendor_responses",
        "# Vendor Response Pack\n\nVendor A missing SLA commitments.",
      ),
    );
    expect(findMissingUpstreamCodes(d15!, ctx)).toEqual([]);

    const message = d15?.buildUserMessage(ctx, {
      d11_response_checklist:
        "# Response Control\n\nStructured tables required.",
      d13_vendor_responses:
        "# Vendor Response Pack\n\nVendor A missing SLA commitments.",
    });

    expect(message).toContain("Response Completeness Report");
    expect(message).toContain("Vendor A missing SLA commitments");
    expect(message).toContain("Do not rank vendors");
    expect(message).toContain(
      "treat unsupported claims as complete",
    );
  });

  it("uses client-facing company language for strategy and scope drafts", () => {
    const ctx = makeD09Context([]);
    const d01 = getPromptTemplate("d01_strategy_memo");
    const d05 = getPromptTemplate("d05_scope_memo");

    const d01Message = d01?.buildUserMessage(ctx, {});
    const d05Message = d05?.buildUserMessage(ctx, {
      d01_strategy_memo: "# Strategy\n\nApproved strategy memo.",
    });

    expect(d01?.systemPrompt).toContain("## Decision requested");
    expect(d01?.systemPrompt).toContain("## §2 · Recommended approach");
    expect(d05?.systemPrompt).toContain("## Executive summary");
    expect(d05?.systemPrompt).toContain("bulleted or tabular list");
    expect(d01?.systemPrompt).toContain("never say \"tenant\"");
    expect(d01Message).toContain("Company: SkyHarbor Air");
    expect(d05Message).toContain("Company: SkyHarbor Air");
    expect(d01Message).not.toContain("Tenant:");
    expect(d05Message).not.toContain("Tenant:");
    expect(d01Message).not.toContain("tenantKey");
    expect(d05Message).not.toContain("tenantKey");
    expect(d01Message).not.toContain("key: skyharbor");
    expect(d05Message).not.toContain("key: skyharbor");
  });

  it("binds uploaded evidence-room files into the D09 RFP coverage map", () => {
    const template = getPromptTemplate("d09_rfp_pack");
    const ctx = makeD09Context([
      "08_Locked_Pricing_Assumptions_Volume_Bands.csv",
      "09_Evaluation_Criteria_Weights_APPROVED.csv",
      "10_Vendor_Response_Expectations.csv",
      "13_Security_Compliance_Control_Posture.csv",
      "14_Transition_Ops_Blackout_Calendar.csv",
      "15_Run_vs_Change_Financial_Baseline.csv",
    ]);

    const message = template?.buildUserMessage(ctx, {
      d01_strategy_memo: "# Strategy",
      d05_scope_memo: "# Scope",
    });

    expect(message).toContain("D09 RFP EVIDENCE COVERAGE MAP");
    expect(message).toContain("GOVERNED EVIDENCE STATE SUMMARY (NORMALIZED FOR D09)");
    expect(message).toContain(
      "Available parsed evidence — citation review pending (normalized from uploaded D09 coverage map)",
    );
    expect(message).toContain("Exhibit 08 — Locked pricing assumptions");
    expect(message).toContain("satisfies=EVID-SRC-PRICE-ASSUMPTIONS");
    expect(message).toContain("Exhibit 09 — Approved evaluation criteria");
    expect(message).toContain("satisfies=EVID-SRC-EVAL-WEIGHT-RATIONALE");
    expect(message).toContain("Exhibit 10 — Vendor response expectations");
    expect(message).toContain("satisfies=EVID-SRC-RFP-LEGAL-TEMPLATE");
    expect(message).toContain("Exhibit 13 — Security and compliance");
    expect(message).toContain("satisfies=EVID-SRC-DEC-RISK-REGISTER");
    expect(message).toContain("Exhibit 14 — Transition operations blackout");
    expect(message).toContain("Exhibit 15 — Run-vs-change financial baseline");
    expect(message).toContain(
      "do not call that requirement Not Requested in the source register",
    );
    expect(message).toContain("§10 must include a risk register");
    expect(message).toContain("§11 must include a gap closure register");
    expect(message).toContain(
      "do not call that requirement Not Requested in the source register",
    );
    expect(message).toContain(
      "§9 must include weights/scoring/disqualification controls",
    );
    expect(message).toContain(
      "blocking-gap closure table with accountable role",
    );
    expect(message).toContain("every section §1 through §11 must appear");
    expect(message).toContain("§7–§11 must not be sacrificed");
  });

  it("configures the pricing-stage prompts as a sequenced workflow", () => {
    const d21 = getPromptTemplate("d21_assumption_set");
    const d19 = getPromptTemplate("d19_pricing_workbook");
    const d20 = getPromptTemplate("d20_trap_log");

    expect(d21).not.toBeNull();
    expect(d19).not.toBeNull();
    expect(d20).not.toBeNull();
    expect(d21?.upstreamRequired).toEqual(["d05_scope_memo"]);
    expect(d19?.upstreamRequired).toEqual(["d21_assumption_set"]);
    expect(d20?.upstreamRequired).toEqual([
      "d21_assumption_set",
      "d19_pricing_workbook",
    ]);
    expect(d21?.systemPrompt).toContain("Lock decision and approval status");
    expect(d19?.systemPrompt).toContain("Per-vendor normalized TCO matrix");
    expect(d19?.systemPrompt).toContain("productivity credits / gainshare");
    expect(d20?.systemPrompt).toContain("Trap-to-BAFO map");
    expect(d20?.systemPrompt).toContain("unpriced productivity claim");
  });

  it("blocks pricing workbook generation until assumptions are locked", () => {
    const d19 = getPromptTemplate("d19_pricing_workbook");
    const ctx = makeD09Context([
      "Vendor_A_Pricing_Response.xlsx",
      "Vendor_B_Pricing_Response.xlsx",
    ]);
    ctx.artifactStates = [
      makeArtifactState("d05_scope_memo", "# Scope\n\nApproved scope."),
    ];

    expect(findMissingUpstreamCodes(d19!, ctx)).toEqual([
      "d21_assumption_set",
    ]);

    ctx.artifactStates.push(
      makeArtifactState(
        "d21_assumption_set",
        "# Locked Assumptions\n\nApproved finance basis.",
      ),
    );
    expect(findMissingUpstreamCodes(d19!, ctx)).toEqual([]);
  });

  it("binds pricing evidence and upstream controls into the pricing workbook prompt", () => {
    const d19 = getPromptTemplate("d19_pricing_workbook");
    const ctx = makeD09Context([
      "Vendor_A_Pricing_Response.xlsx",
      "Vendor_B_Pricing_Response.xlsx",
    ]);
    ctx.artifactStates = [
      makeArtifactState(
        "d21_assumption_set",
        "# Locked Assumptions\n\n3-year TCO and volume bands locked.",
      ),
    ];

    const message = d19?.buildUserMessage(ctx, {
      d21_assumption_set:
        "# Locked Assumptions\n\n3-year TCO and volume bands locked.",
      d11_response_checklist:
        "# Vendor Response Control Pack\n\nStructured pricing workbook required.",
      d13_vendor_responses:
        "# Vendor Responses\n\nVendor A and Vendor B submitted pricing files.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Locked Assumptions Record (d21_assumption_set)");
    expect(message).toContain("Vendor Response Control Pack");
    expect(message).toContain("Vendor_A_Pricing_Response.xlsx");
    expect(message).toContain("EVID-SRC-PRICE-ASSUMPTIONS");
    expect(message).toContain("volume-based price bands");
    expect(message).toContain(
      "If vendor pricing evidence is not present, produce the workbook structure with explicit gaps",
    );
  });

  it("requires the pricing workbook before drafting the trap log", () => {
    const d20 = getPromptTemplate("d20_trap_log");
    const ctx = makeD09Context([]);
    ctx.artifactStates = [
      makeArtifactState("d21_assumption_set", "# Assumptions\n\nLocked."),
    ];

    expect(findMissingUpstreamCodes(d20!, ctx)).toEqual([
      "d19_pricing_workbook",
    ]);

    const message = d20?.buildUserMessage(ctx, {
      d21_assumption_set: "# Assumptions\n\nLocked.",
      d19_pricing_workbook:
        "# Pricing Workbook\n\nVendor A has unpriced transition fees.",
    });
    expect(message).toContain("Pricing Trap Log");
    expect(message).toContain("Trap categories to test".toUpperCase());
    expect(message).toContain("hidden transition fee");
    expect(message).toContain("Vendor A has unpriced transition fees");
  });
});

function makeD09Context(filenames: string[]): SourceGenerationContext {
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
    evidence: [
      {
        id: "evidence-price",
        sourceEventId: "event-1",
        tenantKey: "skyharbor",
        requirementId: "EVID-SRC-PRICE-ASSUMPTIONS",
        stage: "pricing",
        currentState: "Not Requested",
        sourceArtifactId: null,
        notes: "Stale scaffold row overridden by Exhibit 08 upload.",
        lastSyncedAt: "2026-06-12T00:00:00.000Z",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      },
    ],
    uploadedEvidence: filenames.map((filename, index) => ({
      id: `artifact-${index + 1}`,
      originalName: filename,
      artifactFamily: "other",
      sourceFormat: "csv",
      parseStatus: "parsed",
      evidenceState: "parsed_uncited",
      stageKey: "scope",
      chunkExcerpts: [],
      factSummaries: [],
    })),
  };
}

function makeArtifactState(
  artifactCode: string,
  body: string,
): SourceEventArtifactState {
  return {
    id: `state-${artifactCode}`,
    sourceEventId: "event-1",
    tenantKey: "skyharbor",
    artifactCode,
    stage: "rfp",
    family: "rfp",
    tier: "stub",
    status: "approved",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: "2026-06-12T00:00:00.000Z",
    bodyGenerationMetadata: null,
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };
}

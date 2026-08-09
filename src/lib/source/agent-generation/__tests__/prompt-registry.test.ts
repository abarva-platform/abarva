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
    expect(template?.systemPrompt).toContain("issue-to-release gap");
    expect(template?.systemPrompt).toContain("Vendor Response Workbook");
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
        "d06_excl_log",
        "d08_premortem",
        "d09_rfp_pack",
        "d10_rfi_summary",
        "d11_response_checklist",
        "d12_vendor_shortlist",
        "d13_vendor_responses",
        "d14_qa_log",
        "d15_response_completeness",
        "d16_scorecard",
        "d17_weight_log",
        "d18_disqualification_log",
        "d19_pricing_workbook",
        "d20_trap_log",
        "d21_assumption_set",
        "d22_bafo_question_pack",
        "d23_bafo_round_log",
        "d25_risk_attestation",
        "d26_steward_signoff",
        "d27_selection_memo",
        "d28_contract_record",
        "d29_transition_plan",
        "d30_checkpoint_log",
        "d31_kt_evidence",
        "d32_value_ledger",
        "d33_governance_review",
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
    expect(template?.systemPrompt).toContain("Pricing Response");
    expect(template?.systemPrompt).toContain("one vendor response workbook");
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

  it("configures remaining scope and RFP prompt gaps as governed workflow artifacts", () => {
    const d06 = getPromptTemplate("d06_excl_log");
    const d08 = getPromptTemplate("d08_premortem");
    const d10 = getPromptTemplate("d10_rfi_summary");
    const d12 = getPromptTemplate("d12_vendor_shortlist");

    expect(d06).not.toBeNull();
    expect(d08).not.toBeNull();
    expect(d10).not.toBeNull();
    expect(d12).not.toBeNull();
    expect(d06?.upstreamRequired).toEqual(["d05_scope_memo"]);
    expect(d08?.upstreamRequired).toEqual(["d05_scope_memo"]);
    expect(d10?.upstreamRequired).toEqual(["d05_scope_memo"]);
    expect(d12?.upstreamRequired).toEqual(["d09_rfp_pack"]);
    expect(d06?.systemPrompt).toContain("Exclusion Log");
    expect(d06?.systemPrompt).toContain("must not contradict the Scope Memo");
    expect(d08?.systemPrompt).toContain("Pre-mortem on Scope Risk");
    expect(d08?.systemPrompt).toContain("A concern is not a decision");
    expect(d10?.systemPrompt).toContain("RFI Summary");
    expect(d10?.systemPrompt).toContain("not binding");
    expect(d12?.systemPrompt).toContain("Vendor Shortlist");
    expect(d12?.systemPrompt).toContain("must not invent vendors");
  });

  it("blocks the exclusion log until the scope memo exists and binds scope evidence", () => {
    const d06 = getPromptTemplate("d06_excl_log");
    const ctx = makeD09Context(["Scope_Boundary_Workshop.md"]);

    expect(findMissingUpstreamCodes(d06!, ctx)).toEqual(["d05_scope_memo"]);

    ctx.artifactStates = [
      makeArtifactState(
        "d05_scope_memo",
        "# Scope\n\nDesktop support is out of scope; ERP support is in scope.",
      ),
    ];

    expect(findMissingUpstreamCodes(d06!, ctx)).toEqual([]);

    const message = d06?.buildUserMessage(ctx, {
      d05_scope_memo:
        "# Scope\n\nDesktop support is out of scope; ERP support is in scope.",
      d04_app_inv:
        "# Inventory\n\nERP-01 is tier 1; POS-02 owner is missing.",
    });

    expect(message).toContain("Exclusion Log");
    expect(message).toContain("Scope Memo (d05_scope_memo)");
    expect(message).toContain("Scope_Boundary_Workshop.md");
    expect(message).toContain("Do not invent excluded items or sponsor review status");
  });

  it("keeps the scope pre-mortem honest about workshop decisions and mitigations", () => {
    const d08 = getPromptTemplate("d08_premortem");
    const ctx = makeD09Context(["Scope_Risk_Workshop_Notes.md"]);
    ctx.artifactStates = [
      makeArtifactState(
        "d05_scope_memo",
        "# Scope\n\nTier 1 applications are in scope; retained-team split is open.",
      ),
    ];

    expect(findMissingUpstreamCodes(d08!, ctx)).toEqual([]);

    const message = d08?.buildUserMessage(ctx, {
      d05_scope_memo:
        "# Scope\n\nTier 1 applications are in scope; retained-team split is open.",
      d06_excl_log:
        "# Exclusions\n\nEU data residency support is excluded pending legal review.",
    });

    expect(message).toContain("Scope Risk Pre-mortem");
    expect(message).toContain("Scope_Risk_Workshop_Notes.md");
    expect(d08?.systemPrompt).toContain("A concern is not a decision");
    expect(message).toContain(
      "Do not invent workshop decisions, completed mitigations",
    );
  });

  it("treats RFI signals as directional and requires scope before drafting the summary", () => {
    const d10 = getPromptTemplate("d10_rfi_summary");
    const ctx = makeD09Context(["RFI_Market_Scan.xlsx"]);

    expect(findMissingUpstreamCodes(d10!, ctx)).toEqual(["d05_scope_memo"]);

    ctx.artifactStates = [
      makeArtifactState(
        "d05_scope_memo",
        "# Scope\n\nManaged applications and service desk are in scope.",
      ),
    ];

    expect(findMissingUpstreamCodes(d10!, ctx)).toEqual([]);

    const message = d10?.buildUserMessage(ctx, {
      d05_scope_memo:
        "# Scope\n\nManaged applications and service desk are in scope.",
      d09_rfp_pack:
        "# RFP\n\nVendors must provide pricing workbook and transition plan.",
    });

    expect(message).toContain("RFI Summary");
    expect(message).toContain("RFI_Market_Scan.xlsx");
    expect(message).toContain("directional, not binding");
    expect(message).toContain(
      "do not invent vendor interest, capability, price, legal acceptance, or shortlisted status",
    );
  });

  it("requires the RFP package before drafting the vendor shortlist", () => {
    const d12 = getPromptTemplate("d12_vendor_shortlist");
    const ctx = makeD09Context(["Shortlist_Approval_Email.pdf"]);

    expect(findMissingUpstreamCodes(d12!, ctx)).toEqual(["d09_rfp_pack"]);

    ctx.artifactStates = [
      makeArtifactState(
        "d09_rfp_pack",
        "# RFP\n\nInvitation requirements and response controls are approved.",
      ),
    ];

    expect(findMissingUpstreamCodes(d12!, ctx)).toEqual([]);

    const message = d12?.buildUserMessage(ctx, {
      d09_rfp_pack:
        "# RFP\n\nInvitation requirements and response controls are approved.",
      d10_rfi_summary:
        "# RFI\n\nVendor A has directional market-fit evidence only.",
    });

    expect(message).toContain("Vendor Shortlist");
    expect(message).toContain("RFP Package (d09_rfp_pack)");
    expect(message).toContain("Shortlist_Approval_Email.pdf");
    expect(message).toContain(
      "Do not invent vendor names, qualifications, approvals",
    );
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

  it("configures the evaluation-stage prompts as a governed workflow", () => {
    const d16 = getPromptTemplate("d16_scorecard");
    const d17 = getPromptTemplate("d17_weight_log");
    const d18 = getPromptTemplate("d18_disqualification_log");

    expect(d16).not.toBeNull();
    expect(d17).not.toBeNull();
    expect(d18).not.toBeNull();
    expect(d17?.upstreamRequired).toEqual(["d09_rfp_pack"]);
    expect(d16?.upstreamRequired).toEqual([
      "d17_weight_log",
      "d13_vendor_responses",
      "d15_response_completeness",
    ]);
    expect(d18?.upstreamRequired).toEqual([
      "d15_response_completeness",
    ]);
    expect(d17?.systemPrompt).toContain("locked before vendor scoring");
    expect(d16?.systemPrompt).toContain("evidence-cited scoring workbook");
    expect(d16?.systemPrompt).toContain("two-rater coverage");
    expect(d18?.systemPrompt).toContain("no evidenced disqualifications");
    expect(d18?.systemPrompt).toContain("do not invent one");
  });

  it("blocks the evaluation scorecard until weights, responses, and completeness exist", () => {
    const d16 = getPromptTemplate("d16_scorecard");
    const ctx = makeD09Context([
      "Vendor_A_Response.docx",
      "Vendor_B_Response.docx",
      "Evaluator_Scores.csv",
    ]);

    expect(findMissingUpstreamCodes(d16!, ctx)).toEqual([
      "d17_weight_log",
      "d13_vendor_responses",
      "d15_response_completeness",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d17_weight_log",
        "# Weight Governance\n\nCriteria locked before scoring.",
      ),
      makeArtifactState(
        "d13_vendor_responses",
        "# Vendor Responses\n\nVendor A and Vendor B submitted files.",
      ),
      makeArtifactState(
        "d15_response_completeness",
        "# Completeness\n\nBoth vendors conditionally admitted.",
      ),
    ];

    expect(findMissingUpstreamCodes(d16!, ctx)).toEqual([]);
  });

  it("binds score evidence and upstream controls into the evaluation scorecard prompt", () => {
    const d16 = getPromptTemplate("d16_scorecard");
    const ctx = makeD09Context([
      "Evaluation_Criteria_Weights_APPROVED.csv",
      "Evaluator_1_Scores.xlsx",
      "Evaluator_2_Scores.xlsx",
    ]);

    const message = d16?.buildUserMessage(ctx, {
      d17_weight_log:
        "# Weight Governance\n\nCriteria weighted 30/25/20/15/10 and locked.",
      d13_vendor_responses:
        "# Vendor Responses\n\nVendor A submitted SLA evidence.",
      d15_response_completeness:
        "# Completeness\n\nVendor A admitted; Vendor B conditionally admitted.",
      d18_disqualification_log:
        "# Disqualification\n\nNo evidenced disqualification.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Evaluation Scorecard");
    expect(message).toContain("Weight Governance Record (d17_weight_log)");
    expect(message).toContain("Vendor A admitted");
    expect(message).toContain("Evaluator_1_Scores.xlsx");
    expect(message).toContain("evidence citations");
    expect(message).toContain(
      "do not invent scores, vendors, rankings, or evidence citations",
    );
  });

  it("documents disqualification controls without inventing eliminated vendors", () => {
    const d18 = getPromptTemplate("d18_disqualification_log");
    const ctx = makeD09Context(["Vendor_A_Response.docx"]);
    ctx.artifactStates = [
      makeArtifactState(
        "d15_response_completeness",
        "# Completeness\n\nNo mandatory failure evidenced.",
      ),
    ];

    expect(findMissingUpstreamCodes(d18!, ctx)).toEqual([]);

    const message = d18?.buildUserMessage(ctx, {
      d15_response_completeness:
        "# Completeness\n\nNo mandatory failure evidenced.",
      d17_weight_log:
        "# Weight Governance\n\nPass/fail thresholds locked.",
    });

    expect(message).toContain("Disqualification Rationale");
    expect(message).toContain("No mandatory failure evidenced");
    expect(message).toContain("Pass/fail thresholds locked");
    expect(message).toContain("do not invent eliminated vendors");
  });

  it("configures the transition-stage prompts as a governed workflow", () => {
    const d29 = getPromptTemplate("d29_transition_plan");
    const d30 = getPromptTemplate("d30_checkpoint_log");
    const d31 = getPromptTemplate("d31_kt_evidence");

    expect(d29).not.toBeNull();
    expect(d30).not.toBeNull();
    expect(d31).not.toBeNull();
    expect(d29?.upstreamRequired).toEqual([
      "d27_selection_memo",
      "d28_contract_record",
    ]);
    expect(d30?.upstreamRequired).toEqual(["d29_transition_plan"]);
    expect(d31?.upstreamRequired).toEqual(["d29_transition_plan"]);
    expect(d29?.systemPrompt).toContain("Transition Roadmap");
    expect(d29?.systemPrompt).toContain("parallel-run entry and exit gates");
    expect(d30?.systemPrompt).toContain("Transition Checkpoint Cockpit");
    expect(d30?.systemPrompt).toContain("must not convert planned milestones into completed decisions");
    expect(d31?.systemPrompt).toContain("Knowledge-Transfer Evidence");
    expect(d31?.systemPrompt).toContain("not a meeting-attendance summary");
  });

  it("blocks transition roadmap generation until selection and contract records exist", () => {
    const d29 = getPromptTemplate("d29_transition_plan");
    const ctx = makeD09Context(["Signed_Contract.pdf"]);

    expect(findMissingUpstreamCodes(d29!, ctx)).toEqual([
      "d27_selection_memo",
      "d28_contract_record",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d27_selection_memo",
        "# Selection\n\nSponsor signed Northstar selection.",
      ),
      makeArtifactState(
        "d28_contract_record",
        "# Contract\n\nEffective date and transition obligations on file.",
      ),
    ];

    expect(findMissingUpstreamCodes(d29!, ctx)).toEqual([]);
  });

  it("binds transition evidence and upstream controls into the transition roadmap prompt", () => {
    const d29 = getPromptTemplate("d29_transition_plan");
    const ctx = makeD09Context([
      "Signed_Contract.pdf",
      "Transition_Blackout_Calendar.csv",
      "Vendor_KT_Plan.docx",
    ]);

    const message = d29?.buildUserMessage(ctx, {
      d27_selection_memo:
        "# Selection\n\nSponsor signed Northstar selection.",
      d28_contract_record:
        "# Contract\n\nService start 2026-10-01; KT is contractually required.",
      d19_pricing_workbook:
        "# Pricing\n\nTransition fee is milestone-linked.",
      d20_trap_log:
        "# Trap Log\n\nOpen transition-fee trap must be tracked.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Transition Roadmap");
    expect(message).toContain("Selection Memo (d27_selection_memo)");
    expect(message).toContain("Contract Record (d28_contract_record)");
    expect(message).toContain("Transition_Blackout_Calendar.csv");
    expect(message).toContain("milestone-linked commercial obligations");
    expect(message).toContain(
      "do not invent vendor obligations, dates, systems, or go-live milestones",
    );
  });

  it("keeps checkpoint and KT evidence prompts honest about missing completion proof", () => {
    const d30 = getPromptTemplate("d30_checkpoint_log");
    const d31 = getPromptTemplate("d31_kt_evidence");
    const ctx = makeD09Context([
      "Transition_Checkpoint_Notes.md",
      "KT_Workshop_Attendance.xlsx",
      "Runbook_Review_Notes.docx",
    ]);
    ctx.artifactStates = [
      makeArtifactState(
        "d29_transition_plan",
        "# Transition\n\nMobilization milestones planned.",
      ),
    ];

    expect(findMissingUpstreamCodes(d30!, ctx)).toEqual([]);
    expect(findMissingUpstreamCodes(d31!, ctx)).toEqual([]);

    const checkpointMessage = d30?.buildUserMessage(ctx, {
      d29_transition_plan:
        "# Transition\n\nCutover checkpoint planned; no go/no-go yet.",
      d31_kt_evidence:
        "# KT\n\nKT sessions planned but not signed off.",
    });
    const ktMessage = d31?.buildUserMessage(ctx, {
      d29_transition_plan:
        "# Transition\n\nKT required for billing and ticket systems.",
      d30_checkpoint_log:
        "# Checkpoints\n\nCutover is blocked pending runbook verification.",
    });

    expect(checkpointMessage).toContain("Transition Checkpoint Cockpit");
    expect(checkpointMessage).toContain("Transition_Checkpoint_Notes.md");
    expect(checkpointMessage).toContain("do not invent actual dates, decisions, or completed status");
    expect(ktMessage).toContain("Knowledge-Transfer Evidence");
    expect(ktMessage).toContain("Runbook_Review_Notes.docx");
    expect(ktMessage).toContain("do not invent sessions, attendees, runbook verification, or receiving-team sign-off");
  });

  it("configures the value-stage prompts as a governed workflow", () => {
    const d32 = getPromptTemplate("d32_value_ledger");
    const d33 = getPromptTemplate("d33_governance_review");

    expect(d32).not.toBeNull();
    expect(d33).not.toBeNull();
    expect(d32?.upstreamRequired).toEqual(["d29_transition_plan"]);
    expect(d33?.upstreamRequired).toEqual(["d32_value_ledger"]);
    expect(d32?.systemPrompt).toContain("Value Realization Ledger");
    expect(d32?.systemPrompt).toContain("projected value is not committed value");
    expect(d32?.systemPrompt).toContain("Tower handoff");
    expect(d33?.systemPrompt).toContain("Quarterly Governance Note");
    expect(d33?.systemPrompt).toContain("must not pretend a review period has closed");
    expect(d33?.systemPrompt).toContain("does not approve a rebaseline");
  });

  it("blocks value ledger generation until the transition roadmap exists", () => {
    const d32 = getPromptTemplate("d32_value_ledger");
    const ctx = makeD09Context(["Value_Baseline.xlsx"]);

    expect(findMissingUpstreamCodes(d32!, ctx)).toEqual([
      "d29_transition_plan",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d29_transition_plan",
        "# Transition\n\nTransition handoff to value measurement is conditional.",
      ),
    ];

    expect(findMissingUpstreamCodes(d32!, ctx)).toEqual([]);
  });

  it("binds value evidence without inventing realized value or Tower ingestion", () => {
    const d32 = getPromptTemplate("d32_value_ledger");
    const ctx = makeD09Context([
      "Value_Baseline.xlsx",
      "Finance_Measurement_Window.md",
      "Tower_Handoff_Checklist.csv",
    ]);

    const message = d32?.buildUserMessage(ctx, {
      d29_transition_plan:
        "# Transition\n\nService acceptance complete; first measurement window pending.",
      d02_value_target:
        "# Value Target\n\nProjected value range is $4M-$7M; medium confidence.",
      d19_pricing_workbook:
        "# Pricing\n\nNormalized run-rate baseline is pending finance sign-off.",
      d31_kt_evidence:
        "# KT\n\nRunbook verified for billing workflow; reporting handoff open.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("Value Realization Ledger");
    expect(message).toContain("Transition Roadmap (d29_transition_plan)");
    expect(message).toContain("Value_Baseline.xlsx");
    expect(message).toContain("Tower_Handoff_Checklist.csv");
    expect(message).toContain("projected → committed → measured → realized");
    expect(message).toContain(
      "do not invent committed, measured, or realized value",
    );
    expect(message).toContain(
      "Do not claim Tower has ingested the value unless evidence says it has",
    );
  });

  it("requires the value ledger before drafting the governance review note", () => {
    const d33 = getPromptTemplate("d33_governance_review");
    const ctx = makeD09Context(["Quarterly_Review_Notes.md"]);

    expect(findMissingUpstreamCodes(d33!, ctx)).toEqual([
      "d32_value_ledger",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d32_value_ledger",
        "# Value Ledger\n\nProjected value exists; no closed measurement window yet.",
      ),
    ];

    expect(findMissingUpstreamCodes(d33!, ctx)).toEqual([]);

    const message = d33?.buildUserMessage(ctx, {
      d32_value_ledger:
        "# Value Ledger\n\nProjected value exists; no closed measurement window yet.",
      d30_checkpoint_log:
        "# Checkpoints\n\nHypercare issue remains open.",
    });

    expect(message).toContain("Quarterly Governance Note");
    expect(message).toContain("Value Realization Ledger (d32_value_ledger)");
    expect(message).toContain("Quarterly_Review_Notes.md");
    expect(message).toContain("no closed measurement window yet");
    expect(message).toContain(
      "do not invent SLA results, realized value, or rebaseline approvals",
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

  it("configures the BAFO-stage prompts as a governed workflow", () => {
    const d22 = getPromptTemplate("d22_bafo_question_pack");
    const d23 = getPromptTemplate("d23_bafo_round_log");

    expect(d22).not.toBeNull();
    expect(d23).not.toBeNull();
    expect(d22?.upstreamRequired).toEqual(["d20_trap_log"]);
    expect(d23?.upstreamRequired).toEqual(["d22_bafo_question_pack"]);
    expect(d22?.systemPrompt).toContain("BAFO Question Pack");
    expect(d22?.systemPrompt).toContain("Every P0/P1 trap");
    expect(d22?.systemPrompt).toContain("walk-away positions");
    expect(d23?.systemPrompt).toContain("BAFO Round Readout");
    expect(d23?.systemPrompt).toContain("A response is not an acceptance");
    expect(d23?.systemPrompt).toContain("written acceptance captured");
  });

  it("blocks BAFO question pack generation until the pricing trap log exists", () => {
    const d22 = getPromptTemplate("d22_bafo_question_pack");
    const ctx = makeD09Context(["Vendor_A_BAFO_Request.xlsx"]);

    expect(findMissingUpstreamCodes(d22!, ctx)).toEqual([
      "d20_trap_log",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d20_trap_log",
        "# Trap Log\n\nP0 hidden transition fee; P1 weak SLA credits.",
      ),
    ];

    expect(findMissingUpstreamCodes(d22!, ctx)).toEqual([]);
  });

  it("binds BAFO evidence and upstream controls without inventing concessions", () => {
    const d22 = getPromptTemplate("d22_bafo_question_pack");
    const ctx = makeD09Context([
      "Vendor_A_Commercial_Exception.xlsx",
      "Vendor_B_SLA_Response.docx",
      "BAFO_Response_Template.xlsx",
    ]);

    const message = d22?.buildUserMessage(ctx, {
      d20_trap_log:
        "# Trap Log\n\nP0 hidden transition fee; P1 weak SLA credit economics.",
      d19_pricing_workbook:
        "# Pricing\n\nVendor A transition fee is not comparable.",
      d16_scorecard:
        "# Scorecard\n\nVendor B security answer is conditionally acceptable.",
    });

    expect(message).toContain("Company: SkyHarbor Air");
    expect(message).toContain("BAFO Question Pack");
    expect(message).toContain("Pricing Trap Log (d20_trap_log)");
    expect(message).toContain("P0 hidden transition fee");
    expect(message).toContain("Vendor_A_Commercial_Exception.xlsx");
    expect(message).toContain("BAFO_Response_Template.xlsx");
    expect(message).toContain("do not invent finalists, prices, concessions");
    expect(message).toContain("Required BAFO question fields".toUpperCase());
  });

  it("requires the BAFO question pack before drafting the BAFO round log", () => {
    const d23 = getPromptTemplate("d23_bafo_round_log");
    const ctx = makeD09Context(["Vendor_A_BAFO_Response.xlsx"]);

    expect(findMissingUpstreamCodes(d23!, ctx)).toEqual([
      "d22_bafo_question_pack",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d22_bafo_question_pack",
        "# BAFO Questions\n\nQ-01 asks Vendor A to price transition fee.",
      ),
    ];

    expect(findMissingUpstreamCodes(d23!, ctx)).toEqual([]);

    const message = d23?.buildUserMessage(ctx, {
      d22_bafo_question_pack:
        "# BAFO Questions\n\nQ-01 asks Vendor A to price transition fee.",
      d20_trap_log:
        "# Trap Log\n\nTransition fee remains open until written acceptance.",
    });

    expect(message).toContain("BAFO Round Readout");
    expect(message).toContain("BAFO Question Pack (d22_bafo_question_pack)");
    expect(message).toContain("Vendor_A_BAFO_Response.xlsx");
    expect(message).toContain("written acceptance");
    expect(message).toContain(
      "do not invent completed rounds, concessions, price deltas, or closure status",
    );
  });

  it("configures the decision and selection prompts as a governed workflow", () => {
    const d25 = getPromptTemplate("d25_risk_attestation");
    const d26 = getPromptTemplate("d26_steward_signoff");
    const d27 = getPromptTemplate("d27_selection_memo");
    const d28 = getPromptTemplate("d28_contract_record");
    const d29 = getPromptTemplate("d29_transition_plan");

    expect(d25).not.toBeNull();
    expect(d26).not.toBeNull();
    expect(d27).not.toBeNull();
    expect(d28).not.toBeNull();
    expect(d25?.upstreamRequired).toEqual([
      "d24_decision_brief",
      "d23_bafo_round_log",
    ]);
    expect(d26?.upstreamRequired).toEqual([
      "d24_decision_brief",
      "d25_risk_attestation",
    ]);
    expect(d27?.upstreamRequired).toEqual([
      "d24_decision_brief",
      "d25_risk_attestation",
      "d26_steward_signoff",
    ]);
    expect(d28?.upstreamRequired).toEqual(["d27_selection_memo"]);
    expect(d29?.upstreamOptional).toContain("d26_steward_signoff");
    expect(d29?.upstreamOptional).not.toContain("d26_signoff_packet");
    expect(d25?.systemPrompt).toContain("Risk Attestation");
    expect(d25?.systemPrompt).toContain("A listed mitigation is not an attestation");
    expect(d26?.systemPrompt).toContain("Governance Sign-off Record");
    expect(d26?.systemPrompt).toContain("Do not invent sponsor, finance, legal");
    expect(d27?.systemPrompt).toContain("Selection Memo");
    expect(d27?.systemPrompt).toContain("must not declare a vendor selected");
    expect(d28?.systemPrompt).toContain("Contract Record");
    expect(d28?.systemPrompt).toContain("must not invent legal terms");
  });

  it("blocks decision risk attestation until decision and BAFO round evidence exist", () => {
    const d25 = getPromptTemplate("d25_risk_attestation");
    const ctx = makeD09Context(["Risk_Register.xlsx"]);

    expect(findMissingUpstreamCodes(d25!, ctx)).toEqual([
      "d24_decision_brief",
      "d23_bafo_round_log",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d24_decision_brief",
        "# Decision\n\nRecommend Vendor A conditional on risk controls.",
      ),
      makeArtifactState(
        "d23_bafo_round_log",
        "# BAFO Round\n\nVendor A responded; written acceptance pending.",
      ),
    ];

    expect(findMissingUpstreamCodes(d25!, ctx)).toEqual([]);

    const message = d25?.buildUserMessage(ctx, {
      d24_decision_brief:
        "# Decision\n\nRecommend Vendor A conditional on security uplift.",
      d23_bafo_round_log:
        "# BAFO Round\n\nVendor A responded; no written acceptance yet.",
      d20_trap_log:
        "# Trap Log\n\nP1 SLA credit economics accepted as residual risk.",
    });

    expect(message).toContain("Risk Attestation");
    expect(message).toContain("Decision Brief (d24_decision_brief)");
    expect(message).toContain("BAFO Round Log (d23_bafo_round_log)");
    expect(message).toContain("Risk_Register.xlsx");
    expect(message).toContain("risk formally accepted separate");
    expect(message).toContain(
      "do not invent accepted risks, controls, exposures, or sign-offs",
    );
  });

  it("requires risk attestation before drafting the governance sign-off record", () => {
    const d26 = getPromptTemplate("d26_steward_signoff");
    const ctx = makeD09Context(["Governance_Approval_Notes.md"]);
    ctx.artifactStates = [
      makeArtifactState(
        "d24_decision_brief",
        "# Decision\n\nDecision brief is ready for sponsor review.",
      ),
    ];

    expect(findMissingUpstreamCodes(d26!, ctx)).toEqual([
      "d25_risk_attestation",
    ]);

    ctx.artifactStates.push(
      makeArtifactState(
        "d25_risk_attestation",
        "# Risk Attestation\n\nConditionally attested; legal sign-off pending.",
      ),
    );

    expect(findMissingUpstreamCodes(d26!, ctx)).toEqual([]);

    const message = d26?.buildUserMessage(ctx, {
      d24_decision_brief:
        "# Decision\n\nDecision brief is ready for sponsor review.",
      d25_risk_attestation:
        "# Risk Attestation\n\nConditionally attested; legal sign-off pending.",
      d17_weight_log:
        "# Weight Governance\n\nWeights locked before scoring.",
    });

    expect(message).toContain("Governance Sign-off Record");
    expect(message).toContain("Risk Attestation (d25_risk_attestation)");
    expect(message).toContain("Governance_Approval_Notes.md");
    expect(message).toContain("Weights locked before scoring");
    expect(message).toContain(
      "do not invent signatories, timestamps, or approvals",
    );
  });

  it("requires decision approvals before drafting the selection memo", () => {
    const d27 = getPromptTemplate("d27_selection_memo");
    const ctx = makeD09Context(["Sponsor_Decision_Email.pdf"]);
    ctx.artifactStates = [
      makeArtifactState(
        "d24_decision_brief",
        "# Decision\n\nRecommend Vendor A.",
      ),
      makeArtifactState(
        "d25_risk_attestation",
        "# Risk\n\nResidual risk conditionally accepted.",
      ),
    ];

    expect(findMissingUpstreamCodes(d27!, ctx)).toEqual([
      "d26_steward_signoff",
    ]);

    ctx.artifactStates.push(
      makeArtifactState(
        "d26_steward_signoff",
        "# Sign-off\n\nSteward sign-off recorded with finance condition.",
      ),
    );

    expect(findMissingUpstreamCodes(d27!, ctx)).toEqual([]);

    const message = d27?.buildUserMessage(ctx, {
      d24_decision_brief: "# Decision\n\nRecommend Vendor A.",
      d25_risk_attestation:
        "# Risk\n\nResidual risk conditionally accepted.",
      d26_steward_signoff:
        "# Sign-off\n\nSteward sign-off recorded with finance condition.",
      d19_pricing_workbook:
        "# Pricing\n\nFinal TCO basis pending sponsor approval.",
    });

    expect(message).toContain("Selection Memo");
    expect(message).toContain("Governance Sign-off Record (d26_steward_signoff)");
    expect(message).toContain("Sponsor_Decision_Email.pdf");
    expect(message).toContain("do not invent final pricing, selected vendors");
  });

  it("requires the selection memo before drafting the contract record", () => {
    const d28 = getPromptTemplate("d28_contract_record");
    const ctx = makeD09Context(["Signed_Contract.pdf"]);

    expect(findMissingUpstreamCodes(d28!, ctx)).toEqual([
      "d27_selection_memo",
    ]);

    ctx.artifactStates = [
      makeArtifactState(
        "d27_selection_memo",
        "# Selection\n\nSponsor selected Vendor A pending contract upload.",
      ),
    ];

    expect(findMissingUpstreamCodes(d28!, ctx)).toEqual([]);

    const message = d28?.buildUserMessage(ctx, {
      d27_selection_memo:
        "# Selection\n\nSponsor selected Vendor A pending contract upload.",
      d23_bafo_round_log:
        "# BAFO\n\nWritten acceptance captured for SLA credit language.",
    });

    expect(message).toContain("Contract Record");
    expect(message).toContain("Selection Memo (d27_selection_memo)");
    expect(message).toContain("Signed_Contract.pdf");
    expect(d28?.systemPrompt).toContain("Do not mark signed unless");
    expect(message).toContain(
      "Do not invent signed contracts, effective dates, repository references",
    );
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

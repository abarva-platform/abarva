import {
  getPromptTemplate,
  listSupportedGenerationCodes,
} from "../prompt-registry";
import type { SourceGenerationContext } from "../types";

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

    expect(template?.version).toBeGreaterThanOrEqual(7);
    expect(template?.maxTokens).toBeGreaterThanOrEqual(5000);
    expect(template?.systemPrompt).toContain("Source register");
    expect(template?.systemPrompt).toContain("Risk, issue, dependency");
    expect(template?.systemPrompt).toContain("client-to-complete");
    expect(template?.systemPrompt).toContain("friendly exhibit labels");
    expect(template?.systemPrompt).toContain("Never stop after a partial table");
    expect(template?.systemPrompt).toContain("Section budget");
    expect(template?.systemPrompt).toContain("Preserve sections §7–§11");
    expect(template?.systemPrompt).toContain(
      "RFP package draft complete — pending client closure of registered gaps.",
    );
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
    expect(message).toContain("every section §1 through §11 must appear");
    expect(message).toContain("§7–§11 must not be sacrificed");
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
    evidence: [],
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

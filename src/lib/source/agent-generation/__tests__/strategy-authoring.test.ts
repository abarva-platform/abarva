import { listSupportedGenerationCodes, getPromptTemplate } from "../prompt-registry";
import { requiresSourceConsultingGradeGate } from "../quality-review";
import type { SourceGenerationContext } from "../types";

const ctx: SourceGenerationContext = {
  tenantKey: "skyharbor",
  tenantName: "SkyHarbor Air",
  event: {
    id: "evt",
    code: "SRC-1",
    name: "Managed Service sourcing",
    archetype: "AMS_MANAGED_SERVICES",
    rigor: "enhanced",
    currentStageKey: "strategy",
    statusLabel: "Active",
    owner: "K. Shah",
    triggerDescription: "Incumbent contract expiring",
    scopeDescription: "Network & infrastructure AMS",
    estimatedValueUsd: 80_000_000,
  },
  artifactStates: [],
  gateCriteria: [],
  evidence: [],
};

describe("strategy-stage authoring (d02_value_target, d03_archetype_decision)", () => {
  it("registers d02 and d03 as supported generation codes", () => {
    const codes = listSupportedGenerationCodes();
    expect(codes).toContain("d02_value_target");
    expect(codes).toContain("d03_archetype_decision");
  });

  it("reserves the consulting-grade gate for d09 (RFP-specific rubric); d02/d03 generate single-pass", () => {
    // The gate's rubric is RFP-specific, so only d09 runs it. d02/d03 are short
    // strategy docs that generate single-pass on the board-grade model.
    expect(requiresSourceConsultingGradeGate("d09_rfp_pack")).toBe(true);
    expect(requiresSourceConsultingGradeGate("d02_value_target")).toBe(false);
    expect(requiresSourceConsultingGradeGate("d03_archetype_decision")).toBe(
      false,
    );
    expect(requiresSourceConsultingGradeGate("d99_nonexistent")).toBe(false);
  });

  it("d02 template has the required sections and binds the strategy memo when present", () => {
    const template = getPromptTemplate("d02_value_target");
    expect(template).toBeTruthy();
    expect(template!.systemPrompt).toContain("§1 · Value thesis");
    expect(template!.systemPrompt).toContain("confidence band");
    expect(template!.upstreamOptional).toContain("d01_strategy_memo");

    const withoutUpstream = template!.buildUserMessage(ctx, {});
    expect(withoutUpstream).toContain("Managed Service sourcing");
    expect(withoutUpstream).toMatch(/not yet authored/);

    const withUpstream = template!.buildUserMessage(ctx, {
      d01_strategy_memo: "STRATEGY MEMO BODY",
    });
    expect(withUpstream).toContain("STRATEGY MEMO BODY");
  });

  it("d03 template has the required sections and archetype scoring guidance", () => {
    const template = getPromptTemplate("d03_archetype_decision");
    expect(template).toBeTruthy();
    expect(template!.systemPrompt).toContain(
      "§3 · Selected archetype and rationale",
    );
    expect(template!.systemPrompt).toContain("comparison table");

    const message = template!.buildUserMessage(ctx, {});
    expect(message).toContain("SRC-1");
    expect(message).toContain("Draft the Archetype Decision Record");
  });
});

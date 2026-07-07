import {
  assertDeliverablePolicy,
  estimateMaxPassOutputTokens,
  normalizeDeliverableKey,
  policyForTier,
  resolveDocGenQualityProfile,
  resolveDocumentPolicy,
  resolvePassTokenBudget,
  tierForDeliverable,
} from "../document-generation-policy";

describe("document-generation-policy", () => {
  const ENV_KEYS = [
    "ABARVA_CLAUDE_BOARD_GRADE_MODEL",
    "ABARVA_CLAUDE_CHAT_MODEL",
    "ABARVA_DOCGEN_QUALITY_PROFILE",
    "ABARVA_DOCGEN_MAX_PASS_TOKENS",
    "ABARVA_DOCGEN_PASS_FULL_DRAFT_MAX_TOKENS",
    "ABARVA_DOCGEN_BOARD_MAX_TOKENS",
    "ABARVA_DOCGEN_CHAT_MAX_TOKENS",
  ];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("normalizes human names and codes to the same key", () => {
    expect(normalizeDeliverableKey("Program Charter")).toBe("program_charter");
    expect(normalizeDeliverableKey("RFP Package")).toBe("rfp_package");
    expect(normalizeDeliverableKey("d09_rfp_pack")).toBe("d09_rfp_pack");
  });

  it("maps deliverables to the right tiers", () => {
    expect(tierForDeliverable("Program Charter")).toBe("tier3_board_grade");
    expect(tierForDeliverable("business_case")).toBe("tier4_large_package");
    expect(tierForDeliverable("RFP Package")).toBe("tier4_large_package");
    expect(tierForDeliverable("d09_rfp_pack")).toBe("tier4_large_package");
    expect(tierForDeliverable("nexus_chat")).toBe("tier1_chat");
  });

  it("unknown deliverable types fail SAFE to board grade (never chat)", () => {
    const p = resolveDocumentPolicy({ deliverableType: "some_new_artifact" });
    expect(p.tier).toBe("tier3_board_grade");
    expect(p.isChatTier).toBe(false);
    expect(p.maxTokens).toBeGreaterThan(1024);
  });

  it("board/package tiers require multi-pass, validation, citations, file cabinet", () => {
    for (const t of ["tier3_board_grade", "tier4_large_package"] as const) {
      const p = policyForTier(t);
      expect(p.multiPass).toBe(true);
      expect(p.requiresValidation).toBe(true);
      expect(p.requiresCitations).toBe(true);
      expect(p.requiresFileCabinet).toBe(true);
    }
  });

  it("uses env-configurable model ids and token budgets", () => {
    process.env.ABARVA_CLAUDE_BOARD_GRADE_MODEL = "claude-future-9";
    process.env.ABARVA_DOCGEN_BOARD_MAX_TOKENS = "32000";
    const p = resolveDocumentPolicy({ deliverableType: "program_charter" });
    expect(p.model).toBe("claude-future-9");
    expect(p.maxTokens).toBe(32000);
  });

  it("defaults board grade to an Opus-class Claude model with a generous budget", () => {
    const p = resolveDocumentPolicy({ deliverableType: "business_case" });
    expect(p.model).toMatch(/^claude-opus-/);
    expect(p.maxTokens).toBeGreaterThanOrEqual(8000);
    expect(p.qualityProfile).toBe("standard");
  });

  it("keeps the standard six-pass output ceiling at the current safe budget", () => {
    expect(resolveDocGenQualityProfile()).toBe("standard");
    expect(
      resolvePassTokenBudget({
        pass: "full_draft",
        deliverableType: "business_case",
      }),
    ).toBe(16000);
    expect(estimateMaxPassOutputTokens()).toBe(66000);
  });

  it("boosts six-pass budgets with the real engagement profile", () => {
    process.env.ABARVA_DOCGEN_QUALITY_PROFILE = "real_engagement";

    expect(resolveDocGenQualityProfile()).toBe("real_engagement");
    expect(resolveDocumentPolicy({ deliverableType: "business_case" })).toMatchObject({
      qualityProfile: "real_engagement",
      maxTokens: 48000,
    });
    expect(
      resolvePassTokenBudget({
        pass: "full_draft",
        deliverableType: "business_case",
      }),
    ).toBe(32000);
    expect(estimateMaxPassOutputTokens()).toBe(132000);
  });

  it("supports a premium final profile for high-value engagement deliverables", () => {
    process.env.ABARVA_DOCGEN_QUALITY_PROFILE = "premium_final";

    expect(resolveDocGenQualityProfile()).toBe("premium_final");
    expect(resolveDocumentPolicy({ deliverableType: "business_case" })).toMatchObject({
      qualityProfile: "premium_final",
      maxTokens: 128000,
    });
    expect(
      resolvePassTokenBudget({
        pass: "board_grade_rewrite",
        deliverableType: "business_case",
      }),
    ).toBe(128000);
    expect(estimateMaxPassOutputTokens()).toBe(456000);
  });

  it("lets operators override a single pass while respecting the max-pass cap", () => {
    process.env.ABARVA_DOCGEN_QUALITY_PROFILE = "premium_final";
    process.env.ABARVA_DOCGEN_MAX_PASS_TOKENS = "64000";
    process.env.ABARVA_DOCGEN_PASS_FULL_DRAFT_MAX_TOKENS = "96000";

    expect(
      resolvePassTokenBudget({
        pass: "full_draft",
        deliverableType: "business_case",
      }),
    ).toBe(64000);
  });

  // ── THE KEYSTONE GUARD ──
  it("rejects a chat-tier budget for a final deliverable", () => {
    expect(() => assertDeliverablePolicy("nexus_chat")).toThrow(/chat tier/i);
  });

  it("rejects a deliverable whose env budget was starved to the chat ceiling", () => {
    // Operator misconfiguration: board budget pushed down to the chat ceiling.
    process.env.ABARVA_DOCGEN_CHAT_MAX_TOKENS = "1024";
    process.env.ABARVA_DOCGEN_BOARD_MAX_TOKENS = "1024";
    expect(() => assertDeliverablePolicy("program_charter")).toThrow(
      /chat-answer budgets|≤ chat ceiling/i,
    );
  });

  it("allows a properly-budgeted final deliverable", () => {
    const p = assertDeliverablePolicy("program_charter");
    expect(p.tier).toBe("tier3_board_grade");
    expect(p.maxTokens).toBeGreaterThan(1024);
  });
});

import { sanitizeClientFacingSourceDraft } from "../client-facing-hygiene";

describe("Source client-facing draft hygiene", () => {
  it("maps raw artifact codes to business document names", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "Artifact: d01_strategy_memo",
        "Use d05_scope_memo and d09_rfp_pack as upstream inputs.",
      ].join("\n"),
    );

    expect(result).toContain("Document: Sourcing Strategy Memo");
    expect(result).toContain("Scope Memo");
    expect(result).toContain("RFP Package");
    expect(result).not.toContain("Artifact:");
    expect(result).not.toContain("d01_strategy_memo");
    expect(result).not.toContain("d05_scope_memo");
    expect(result).not.toContain("d09_rfp_pack");
  });

  it("maps markdown-escaped artifact codes from generated bodies", () => {
    const result = sanitizeClientFacingSourceDraft(
      "**Artifact:** d01\\_strategy\\_memo · upstream d05\\_scope\\_memo",
    );

    expect(result).toContain("**Document:** Sourcing Strategy Memo");
    expect(result).toContain("upstream Scope Memo");
    expect(result).not.toContain("d01\\_strategy\\_memo");
    expect(result).not.toContain("d05\\_scope\\_memo");
  });

  it("removes common internal source terms from client-facing text", () => {
    const result = sanitizeClientFacingSourceDraft(
      "Tenant key, chunk_id, fact_key, source_artifacts, artifact id, and substrate must not leak.",
    );

    expect(result).not.toMatch(
      /tenant key|chunk_id|fact_key|source_artifacts|artifact id|substrate/i,
    );
  });
});

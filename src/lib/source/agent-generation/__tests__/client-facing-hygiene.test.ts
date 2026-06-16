import { sanitizeClientFacingSourceDraft } from "../client-facing-hygiene";

describe("Source client-facing draft hygiene", () => {
  it("maps raw artifact codes to business document names", () => {
    const result = sanitizeClientFacingSourceDraft(
      [
        "Artifact: d01_strategy_memo",
        "Use d05_scope_memo and d09_rfp_pack as upstream inputs.",
      ].join("\n"),
    );

    expect(result).toContain("Artifact: Sourcing Strategy Memo");
    expect(result).toContain("Scope Memo");
    expect(result).toContain("RFP Package");
    expect(result).not.toContain("d01_strategy_memo");
    expect(result).not.toContain("d05_scope_memo");
    expect(result).not.toContain("d09_rfp_pack");
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

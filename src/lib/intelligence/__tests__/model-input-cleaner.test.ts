import {
  cleanIntelligenceModelInput,
  cleanIntelligenceModelInputText,
  findRawModelInputLeaks,
} from "@/lib/intelligence/model-input-cleaner";

describe("Intelligence model input cleaner", () => {
  it("removes raw substrate residue while preserving business language", () => {
    const cleaned = cleanIntelligenceModelInputText(
      [
        "SkyHarbor IROPS agentic recovery SHA-CAP-001 depends on APP-00002.",
        "source: skyharbor_ai_portfolio.csv Row: 7 ai_maturity: 1",
        "current_value_pool: $270M",
      ].join("\n"),
    );

    expect(cleaned).toContain("SkyHarbor IROPS agentic recovery");
    expect(cleaned).toContain("AI maturity is early-stage");
    expect(cleaned).toContain("current value pool:");
    expect(cleaned).not.toContain("SHA-CAP");
    expect(cleaned).not.toContain("APP-");
    expect(cleaned).not.toContain(".csv");
    expect(cleaned).not.toContain("Row:");
    expect(cleaned).not.toContain("ai_maturity:");
    expect(findRawModelInputLeaks(cleaned)).toEqual([]);
  });

  it("cleans nested model input packets", () => {
    const cleaned = cleanIntelligenceModelInput({
      facts: ["SHA-BF-22 proves ai_maturity: 2 for Customer AI."],
      evidence: {
        file: "supporting_material.csv",
        row: "Row: 42",
        owner: "EVP Operations",
      },
    });
    const serialized = JSON.stringify(cleaned);

    expect(serialized).toContain("AI maturity is emerging");
    expect(serialized).toContain("EVP Operations");
    expect(serialized).not.toContain("SHA-BF");
    expect(serialized).not.toContain("supporting_material.csv");
    expect(serialized).not.toContain("Row:");
  });
});

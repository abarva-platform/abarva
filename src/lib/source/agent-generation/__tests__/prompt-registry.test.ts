import {
  getPromptTemplate,
  listSupportedGenerationCodes,
} from "../prompt-registry";

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

    expect(template?.version).toBeGreaterThanOrEqual(6);
    expect(template?.maxTokens).toBeGreaterThanOrEqual(6000);
    expect(template?.systemPrompt).toContain("Source register");
    expect(template?.systemPrompt).toContain("Risk, issue, dependency");
    expect(template?.systemPrompt).toContain("client-to-complete");
    expect(template?.systemPrompt).toContain("friendly exhibit labels");
    expect(template?.systemPrompt).toContain("Never stop after a partial table");
  });
});

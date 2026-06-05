import {
  getPromptTemplate,
  listSupportedGenerationCodes,
} from "../prompt-registry";

describe("Source artifact prompt registry provider config", () => {
  it("uses OpenAI model ids for every generatable Source artifact", () => {
    const codes = listSupportedGenerationCodes();

    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      const template = getPromptTemplate(code);
      expect(template?.model).toMatch(/^gpt-/);
    }
  });
});

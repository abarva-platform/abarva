import fs from "node:fs";
import path from "node:path";

describe("Intelligence Ask model egress contract", () => {
  const askDir = path.join(process.cwd(), "src/lib/intelligence/ask");
  const utilityFiles = ["classifier.ts", "followups.ts"];

  it("routes Ask utility model calls through the Anthropic small-model runtime", () => {
    for (const file of utilityFiles) {
      const source = fs.readFileSync(path.join(askDir, file), "utf8");
      expect(source).toContain("createIntelligenceAskAnthropicText");
      expect(source).toContain("INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL");
      expect(source).toContain("isIntelligenceAskAnthropicConfigured");
      expect(source).not.toContain("createIntelligenceAskOpenAIText");
      expect(source).not.toContain("INTELLIGENCE_ASK_OPENAI_SMALL_MODEL");
      expect(source).not.toContain("isIntelligenceAskOpenAIConfigured");
      expect(source).not.toContain("openai-runtime");
    }
  });

  it("keeps the primary Ask orchestration files free of OpenAI runtime imports", () => {
    for (const file of ["index.ts", "synthesizer.ts", ...utilityFiles]) {
      const source = fs.readFileSync(path.join(askDir, file), "utf8");
      expect(source).not.toMatch(
        /createIntelligenceAskOpenAIText|openai-runtime|INTELLIGENCE_ASK_OPENAI_/,
      );
    }
  });
});

import fs from "node:fs";
import path from "node:path";

describe("Intelligence Ask model egress contract", () => {
  const askDir = path.join(process.cwd(), "src/lib/intelligence/ask");
  // Reasoning/synthesis (synthesizer.ts) moved to Anthropic/Claude per the
  // Anthropic-only mandate — see provider-audit.test.ts. These remaining files
  // are non-reasoning utilities (intent classification, follow-up suggestions)
  // that still use the OpenAI small-model utility path.
  const utilityFiles = ["classifier.ts", "followups.ts"];

  it("keeps the non-reasoning utility paths on the OpenAI small-model runtime", () => {
    for (const file of utilityFiles) {
      const source = fs.readFileSync(path.join(askDir, file), "utf8");
      expect(source).not.toContain("getAuditedAnthropicClient");
      expect(source).not.toContain("ANTHROPIC_API_KEY");
      expect(source).not.toContain("claude-");
    }

    const runtime = fs.readFileSync(
      path.join(askDir, "openai-runtime.ts"),
      "utf8",
    );
    expect(runtime).toContain("preflightOpenAIDirectClient");
    expect(runtime).toContain("OPENAI_API_KEY");
  });
});

import fs from "node:fs";
import path from "node:path";

describe("Intelligence Ask model egress contract", () => {
  const askDir = path.join(process.cwd(), "src/lib/intelligence/ask");
  const runtimeFiles = ["classifier.ts", "followups.ts", "synthesizer.ts"];

  it("routes runtime model calls through OpenAI instead of the legacy Anthropic path", () => {
    for (const file of runtimeFiles) {
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

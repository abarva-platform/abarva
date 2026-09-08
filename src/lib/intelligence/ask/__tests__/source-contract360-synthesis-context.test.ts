import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Ask Intelligence Source Contract 360 synthesis context", () => {
  it("injects selected Source Contract 360 context before synthesis", () => {
    const indexSource = readFileSync(join(__dirname, "..", "index.ts"), "utf8");
    const blockIdx = indexSource.indexOf("const sourceContract360PromptBlock =");
    const synthesisIdx = indexSource.indexOf(
      "conversationContextBlock:",
      blockIdx,
    );
    const promptArray = indexSource.slice(
      synthesisIdx,
      indexSource.indexOf("averageConfidence,", synthesisIdx),
    );

    expect(indexSource).toContain("buildSourceContract360PromptBlock");
    expect(blockIdx).toBeGreaterThan(-1);
    expect(synthesisIdx).toBeGreaterThan(blockIdx);
    expect(promptArray).toContain("sourceContract360PromptBlock,");
    expect(promptArray.indexOf("sourceContract360PromptBlock,")).toBeLessThan(
      promptArray.indexOf("opts.conversationContextBlock,"),
    );
  });
});

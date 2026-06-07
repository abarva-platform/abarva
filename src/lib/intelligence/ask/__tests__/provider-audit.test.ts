/**
 * Provider audit regression — production reasoning must be Anthropic/Claude,
 * never OpenAI (Context/Corpus → Agent Visibility audit, hard constraint #4).
 *
 * This is a wiring audit over the synthesis source files. It guards the correct
 * paths (Nexus = Claude) and TRACKS the known P0 (Sentinel Ask synthesis still
 * runs on OpenAI) via `it.failing`, so the violation is recorded in CI without
 * blocking merges — and the moment Sentinel synthesis is moved to Anthropic the
 * `it.failing` test goes red, prompting removal of the marker.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ASK_DIR = path.join(process.cwd(), "src/lib/intelligence/ask");
const PROGRAMS_DIR = path.join(process.cwd(), "src/lib/programs");

function read(rel: string, base = ASK_DIR): string {
  return readFileSync(path.join(base, rel), "utf8");
}

describe("provider audit — reasoning must be Anthropic, not OpenAI", () => {
  it("Nexus free-text synthesis uses an audited Anthropic Claude client", () => {
    const src = read("nexus-free-text.ts", PROGRAMS_DIR);
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(
      /createIntelligenceAskOpenAIText|chat\.completions|gpt-/,
    );
  });

  // KNOWN P0 (tracked): the primary Sentinel Ask synthesis path currently runs
  // on OpenAI (`createIntelligenceAskOpenAIText`, model gpt-5.1). The
  // Azure-only / Anthropic-only mandate requires this to move to Claude. This
  // test is expected to FAIL today; when Sentinel synthesis is migrated to
  // Anthropic it will start passing — at which point delete the `.failing`.
  it.failing(
    "P0: Sentinel Ask synthesis must NOT use OpenAI (move to Anthropic/Claude)",
    () => {
      const src = read("synthesizer.ts");
      expect(src).not.toMatch(/createIntelligenceAskOpenAIText/);
      expect(src).not.toMatch(/openai-runtime/);
    },
  );
});

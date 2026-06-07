/**
 * Provider audit regression — production reasoning must be Anthropic/Claude,
 * never OpenAI (Context/Corpus → Agent Visibility audit, hard constraint #4).
 *
 * Wiring audit over the synthesis source files: Nexus, Sentinel Ask, the Ask
 * Anthropic runtime, and Source Sentinel chat must all route reasoning through
 * the audited Anthropic Claude client and must not reference the OpenAI
 * synthesis path.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ASK_DIR = path.join(process.cwd(), "src/lib/intelligence/ask");
const PROGRAMS_DIR = path.join(process.cwd(), "src/lib/programs");
const SOURCE_DIR = path.join(process.cwd(), "src/lib/source");

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

  it("Sentinel Ask synthesis uses the Anthropic runtime, not OpenAI", () => {
    const src = read("synthesizer.ts");
    expect(src).toMatch(/createIntelligenceAskAnthropicText/);
    expect(src).toMatch(/anthropic-runtime/);
    expect(src).not.toMatch(/createIntelligenceAskOpenAIText/);
    expect(src).not.toMatch(/openai-runtime/);
  });

  it("the Sentinel Ask Anthropic runtime routes through the audited Claude client", () => {
    const src = read("anthropic-runtime.ts");
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(/openai|gpt-/i);
  });

  it("Source Sentinel chat synthesis uses an audited Anthropic Claude client", () => {
    const src = read("sentinel-chat-llm.ts", SOURCE_DIR);
    expect(src).toMatch(/getAuditedAnthropicClient/);
    expect(src).toMatch(/claude/i);
    expect(src).not.toMatch(
      /preflightOpenAIDirectClient|responses\.create|gpt-/,
    );
  });
});

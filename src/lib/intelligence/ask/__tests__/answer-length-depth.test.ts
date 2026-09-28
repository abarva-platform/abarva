/**
 * Item T-495 · suite 5 of the claimable half.
 *
 * WHAT THIS REPLACES. Until 2026-09-28 three of this file's five cases read
 * `synthesizer.ts` as TEXT: one sliced the file from the literal
 * "ANSWER-ONLY STREAMING MODE" to its end and looked for words in the slice,
 * one grepped the file for "200-word target", and one grepped it for every
 * "Target 90-160 words" run up to the next double quote. They were green, and
 * they would have stayed green with the length directive never sent to the
 * model at all — the words only had to be somewhere in the file — and they
 * would have gone red on a quote-style reformat that changed nothing the model
 * reads. Those three were DELETED rather than sharpened: a tighter pattern is
 * the same defect with a longer fuse.
 *
 * WHAT THE CASES BELOW ASSERT, BY EXECUTION. They drive the real
 * `synthesizeStream` down both of its paths — ANSWER-ONLY streaming (the live
 * chat path) and the ordinary rich-text path — and read the EXACT system and
 * user content handed to the model through the synthesizer's own
 * `onModelInput` hook:
 *
 *  1. the streaming path's system prompt carries the deep-dive allowance
 *     ("Length follows depth", roughly 400 words, portfolio review) — the
 *     allowance the non-streaming path already had;
 *  2. on BOTH paths, every line that states the "Target 90-160 words" target
 *     also states the 400-word allowance, so no target line the model reads
 *     caps a deep dive at 160;
 *  3. neither path references a "200-word target" that is stated nowhere.
 *
 * WHAT STAYS. The two cases over the exported contract constants were already
 * behaviour — they assert the value of a string the product exports — and are
 * kept unchanged, as the T-492 verdict for this file asked.
 *
 * WHAT IS MOCKED AND WHAT IS NOT. Only the audited Anthropic client is mocked,
 * because it is I/O. `synthesizeStream`, every prompt builder it calls and the
 * model-input cleaner run for real.
 */

jest.mock("server-only", () => ({}));

const getAuditedAnthropicClient = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

import {
  CXO_ANSWER_QUALITY_CONTRACT,
  GENERAL_ADVISORY_CONTRACT,
} from "../response-policy";
import { synthesizeStream } from "../synthesizer";

/** A plain analytical ask: no concise, visual, ranked or advisor-route trigger. */
const QUESTION = "How is our application portfolio positioned for next year?";

/** The two synthesizer paths, named for what a reader of a failure needs. */
const PATHS = [
  ["answer-only streaming (the live chat path)", true],
  ["rich-text non-streaming", false],
] as const;

async function captureModelInput(answerOnlyStreaming: boolean): Promise<{
  system: string;
  user: string;
}> {
  getAuditedAnthropicClient.mockReset();
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-t495-length",
    client: {
      messages: {
        create: async () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "Portfolio read." },
            };
          },
        }),
      },
    },
  });

  const inputs: { system: string; user: string }[] = [];
  const stream = synthesizeStream({
    query: QUESTION,
    sources: [],
    intent: "general" as never,
    // Required for the synthesizer to reach the model at all.
    tenantId: "tenant-t495",
    tenantClientKey: "skyharbor-air",
    richText: true,
    answerOnlyStreaming,
    onModelInput: (parts) => inputs.push(parts),
  });
  // Drain the stream; a repair pass may call the model again, and only the
  // primary call's input is this suite's subject.
  for await (const _chunk of stream) {
    void _chunk;
  }
  // The primary call happened — an empty capture cannot make a case vacuous.
  expect(inputs.length).toBeGreaterThan(0);
  return inputs[0];
}

/**
 * The lines of the model's system input that state the analytical word TARGET,
 * matched on "Target 90-160 words" — the statement the deleted case matched in
 * the file, now matched in what the model receives. Deliberately not every
 * mention of "90-160 words": the shape contract's PYRAMID BRIEF OVERRIDE names
 * 90-160 words as the "preferred default for an analytical answer", which is a
 * default and not a cap, and the streaming directive's own "run 90-160 words"
 * is asserted, with its allowance, by the case above.
 */
function wordTargetLines(system: string): string[] {
  return system.split("\n").filter((line) => line.includes("Target 90-160 words"));
}

describe("answer length follows depth", () => {
  // The synthesizer refuses before the behaviour under test when this is unset.
  // Restored afterwards: jest shares one process.env across a worker's suites.
  const ORIGINAL_API_KEY = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = "test-key-t495";
  });

  afterAll(() => {
    if (ORIGINAL_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_API_KEY;
  });

  it("states no minimum, so a simple lookup is not padded to a quota", () => {
    // A 90-word floor on "what is our IT budget?" forces padding, which is the
    // hollow-opener failure the rest of the policy already fights.
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("there is no minimum");
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "padding it out to reach a word target is a defect",
    );
    expect(GENERAL_ADVISORY_CONTRACT).toContain(
      "Over-framing a simple question is a defect",
    );
  });

  it("keeps the analytical default the base policy was tuned around", () => {
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("Target 90-160 words");
  });

  it("gives the streaming path the deep-dive allowance the non-streaming path already had", async () => {
    // These two paths disagreed: the non-streaming prompt allowed ~400 words
    // for comparisons, ranked lists and portfolio reviews, while ANSWER-ONLY
    // STREAMING MODE -- the live chat path -- capped everything at 160.
    const { system } = await captureModelInput(true);
    const allowance = system
      .split("\n")
      .filter((line) => line.includes("ANSWER-ONLY STREAMING MODE"));
    // The streaming directive is sent, once, as one line of the system input.
    expect(allowance).toHaveLength(1);
    expect(allowance[0]).toContain("Length follows depth");
    expect(allowance[0]).toContain("400 words");
    expect(allowance[0]).toContain("portfolio review");
  }, 30000);

  it.each(PATHS)(
    "keeps every word-target line the model reads consistent with the 400-word allowance · %s",
    async (_label, answerOnlyStreaming) => {
      const { system } = await captureModelInput(answerOnlyStreaming);
      const lines = wordTargetLines(system);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect({ line, allowsDeepDive: line.includes("400 words") }).toEqual({
          line,
          allowsDeepDive: true,
        });
      }
    },
    30000,
  );

  it.each(PATHS)(
    "sends the model no reference to a length target stated nowhere · %s",
    async (_label, answerOnlyStreaming) => {
      const { system, user } = await captureModelInput(answerOnlyStreaming);
      expect({
        inSystem: system.includes("200-word target"),
        inUser: user.includes("200-word target"),
      }).toEqual({ inSystem: false, inUser: false });
    },
    30000,
  );
});

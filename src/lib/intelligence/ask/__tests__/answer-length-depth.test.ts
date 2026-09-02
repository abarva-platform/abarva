import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CXO_ANSWER_QUALITY_CONTRACT,
  GENERAL_ADVISORY_CONTRACT,
} from "../response-policy";

const synthesizerCode = readFileSync(
  join(__dirname, "..", "synthesizer.ts"),
  "utf8",
);

describe("answer length follows depth", () => {
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

  it("gives the streaming path the deep-dive allowance the non-streaming path already had", () => {
    // These two paths disagreed: the non-streaming prompt allowed ~400 words
    // for comparisons, ranked lists and portfolio reviews, while ANSWER-ONLY
    // STREAMING MODE -- the live chat path -- capped everything at 160.
    const streamingBlock = synthesizerCode.slice(
      synthesizerCode.indexOf("ANSWER-ONLY STREAMING MODE"),
    );
    expect(streamingBlock).toContain("Length follows depth");
    expect(streamingBlock).toContain("400 words");
    expect(streamingBlock).toContain("portfolio review");
  });

  it("no longer references a length target that is stated nowhere", () => {
    expect(synthesizerCode).not.toContain("200-word target");
  });

  it("keeps every length statement in the answer path consistent", () => {
    const statements = synthesizerCode.match(/Target 90-160 words[^"]*/g) ?? [];
    expect(statements.length).toBeGreaterThan(0);
    for (const statement of statements) {
      expect(statement).toContain("400 words");
    }
  });
});

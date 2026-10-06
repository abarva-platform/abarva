/**
 * Backlog item 42 — the truncation-artifact rule inside
 * `normalizeAssemblyArtifacts` removed a sentence-final connector plus its
 * period on every advisor surface, so legitimate prose reached the user with
 * its last word missing:
 *
 *   "Here is the renewal comparison you asked for." -> "…you asked"
 *
 * English strands prepositions and uses several subordinators adverbially, so
 * a preposition at the end of a sentence is not evidence of a cut. A
 * coordinating conjunction there is — "…in scope, and." is never a finished
 * sentence.
 *
 * These tests drive the real shapers, not the private helper.
 */
import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from "@/lib/agent/response-shape";
import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

/** Complete sentences whose last word is a stranded preposition or an adverb. */
const COMPLETE_PROSE: ReadonlyArray<string> = [
  "Here is the renewal comparison you asked for.",
  "That is the number the board signed off on.",
  "This is the contract we already paid for.",
  "The spend sits with the vendor we work with.",
  "Tell me where that number came from.",
  "The baseline is the one we measured against.",
  "That is a risk the owner is already aware of.",
  "Two renewals were paused for a while.",
  "Nobody has raised this before.",
];

describe("truncation-artifact cleanup keeps finished sentences intact", () => {
  for (const sentence of COMPLETE_PROSE) {
    it(`preserves the final word of: ${sentence}`, () => {
      expect(shapeAgentResponseForSurface("/tower", sentence)).toBe(sentence);
    });
  }

  it("preserves it on a compacting surface too, not only /tower", () => {
    const sentence = "Here is the renewal comparison you asked for.";
    expect(shapeAgentResponseForSurface("setup", sentence)).toBe(sentence);
    expect(shapeAgentResponseForSurface("/platform/admin", sentence)).toBe(
      sentence,
    );
  });

  it("preserves it when structure is preserved and when it is not", () => {
    const sentence = "That is the number the board signed off on.";
    expect(
      shapeSharedAdvisorResponse({ text: sentence, preserveStructure: true })
        .text,
    ).toBe(sentence);
    expect(
      shapeSharedAdvisorResponse({ text: sentence, preserveStructure: false })
        .text,
    ).toBe(sentence);
  });

  it("preserves it mid-paragraph, where the rule fires on the line end", () => {
    const text = [
      "Here is the renewal comparison you asked for.",
      "Two vendors are above the benchmark we measured against.",
    ].join("\n");
    expect(shapeAgentResponseForSurface("/tower", text)).toBe(text);
  });

  it("leaves the streaming pass alone, which never ran this rule", () => {
    const sentence = "This is the contract we already paid for.";
    expect(shapeStreamingAgentTextForSurface("/tower", sentence)).toBe(
      sentence,
    );
  });
});

describe("truncation-artifact cleanup still removes a real cut", () => {
  it("drops a dangling coordinator and closes the sentence", () => {
    const shaped = shapeAgentResponseForSurface(
      "/tower",
      "Three vendors remain in scope, and.",
    );
    expect(shaped).toBe("Three vendors remain in scope.");
  });

  it("drops a dangling coordinator with no comma before it", () => {
    expect(
      shapeAgentResponseForSurface("/tower", "We reviewed both renewals but."),
    ).toBe("We reviewed both renewals.");
  });

  it("does not mistake a word that merely ends in a coordinator", () => {
    for (const sentence of [
      "That is the vendor of record.",
      "Spend rose across the brand.",
      "The contract covers every vendor.",
      "The rollout was a soft debut.",
    ]) {
      expect(shapeAgentResponseForSurface("/tower", sentence)).toBe(sentence);
    }
  });
});

describe("the other assembly-artifact repairs are untouched", () => {
  it("still collapses a duplicated word", () => {
    expect(
      shapeAgentResponseForSurface(
        "/tower",
        "Each initiative needs a value supporting supporting material gate.",
      ),
    ).toBe("Each initiative needs a value supporting material gate.");
  });

  it("still collapses a doubled Next label", () => {
    expect(
      shapeAgentResponseForSurface(
        "/tower",
        "Next: Next move: compare the two renewals.",
      ),
    ).toBe("Next: compare the two renewals.");
  });

  it("still repairs an empty Breakdown delimiter", () => {
    expect(
      shapeAgentResponseForSurface(
        "/tower",
        "Breakdown:; Northline Logistics Group: $62.0M",
      ),
    ).toBe("Breakdown: Northline Logistics Group: $62.0M");
  });
});

import { classifySourceAnswerMode } from "@/lib/source/ava/answer-mode";

/**
 * A commercial question that happened to open "how do i" was answered as a
 * product how-to.
 *
 * `workflow_how_to.how_do_i` carried a bare `/\bhow do i\b/` alternative, so it
 * captured any question in that form regardless of subject. Measured against
 * the classifier, four genuine contract questions resolved to `workflow_how_to`
 * — including a cross-segment vendor comparison, answered as which control to
 * press.
 *
 * The alternative was redundant as well as wrong: a question about operating
 * the product names a product verb or a place, and the rule's two other
 * alternatives already match those. So it was removed rather than narrowed.
 * This router is a keyword classifier, and tightening one pattern with another
 * pattern is what produced the over-capture.
 */

const modeFor = (question: string) =>
  classifySourceAnswerMode({ question }).mode;

const classify = (question: string) => classifySourceAnswerMode({ question });

describe("a commercial question is not answered as a product how-to", () => {
  // The exact questions measured as mis-routed, not paraphrases of them.
  it.each([
    "how do i justify this renewal to finance?",
    "how do i know this pricing is competitive?",
    "how do i read the exit clause in this agreement?",
    "how do i compare this against what the plan side pays?",
  ])("routes %s away from workflow_how_to", (question) => {
    expect(modeFor(question)).not.toBe("workflow_how_to");
  });

  it("sends a commercial how-do-i to the general path, by falling through", () => {
    const result = classify("how do i justify this renewal to finance?");
    expect(result.mode).toBe("general_advisory");
    // Reached by no rule matching, which is what the fallback exists for — not
    // by a new rule claiming these questions.
    expect(result.matchedRule).toBe("no_match");
    expect(result.isFallback).toBe(true);
  });

  // The other half of the guard. Removing an alternative must not stop the
  // questions it legitimately served from resolving, and those are pinned here
  // with the removed pattern gone — so a revert in either direction fails.
  it.each([
    "how do i upload the signed nda?",
    "how do we submit the vendor response?",
    "how can i approve the strategy version?",
    "how do i attach the executed agreement?",
    "where do i click to upload a file?",
    "where can i find the evidence list?",
  ])("still routes %s to workflow_how_to", (question) => {
    expect(modeFor(question)).toBe("workflow_how_to");
  });

  it("keeps the rule's identity, so the fix is one fewer alternative", () => {
    // A product how-to still resolves through the same rule rather than a new
    // one, which is the backlog's own constraint: no new regex modes.
    expect(classify("how do i upload the signed nda?").matchedRule).toBe(
      "workflow_how_to.how_do_i",
    );
  });

  // Control: the classifier is reachable and routing normally, so the
  // not-workflow_how_to assertions above cannot be passing against a
  // classifier that returns the same thing for everything.
  it("still routes the modes that were never in question", () => {
    expect(modeFor("what is the risk of signing a three year term here?")).toBe(
      "risk_exposure",
    );
    expect(modeFor("how much value is really left in this contract?")).toBe(
      "value_at_stake",
    );
    expect(modeFor("which vendor has the better indemnity position?")).toBe(
      "vendor_comparison",
    );
  });

  it("treats an empty question as a fallback, not a how-to", () => {
    for (const question of ["", "   "]) {
      const result = classify(question);
      expect(result.mode).toBe("general_advisory");
      expect(result.isFallback).toBe(true);
    }
  });
});

import { shouldShowGovernedAnswerProse } from "@/components/agent/AskAnythingBar";

describe("shouldShowGovernedAnswerProse", () => {
  it("shows a governed direct answer when no prose is otherwise visible", () => {
    expect(
      shouldShowGovernedAnswerProse("", "The accepted decision is recorded."),
    ).toBe(true);
  });

  it("shows a governed direct answer when a stale generic response differs", () => {
    expect(
      shouldShowGovernedAnswerProse(
        "No proposals are available.",
        "The accepted decision is recorded.",
      ),
    ).toBe(true);
  });

  it("suppresses an exact duplicate of already-visible prose", () => {
    expect(
      shouldShowGovernedAnswerProse(
        "  The accepted decision is recorded. ",
        "The accepted decision is recorded.",
      ),
    ).toBe(false);
  });
});

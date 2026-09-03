import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  finalizeAssistantMessage,
  resolveAssistantAnswerText,
} from "../AdvisoryIntelligencePage";

const componentSource = readFileSync(
  join(__dirname, "..", "AdvisoryIntelligencePage.tsx"),
  "utf8",
);

const FENCED_ANSWER = [
  "The evidence supports an advisory read, not a certified decision.",
  "",
  "```followups",
  '["What would change this view?","What evidence is still missing?"]',
  "```",
].join("\n");

describe("streamed answer finalization", () => {
  it("strips a governed follow-up payload when no answer packet arrived", () => {
    // resolveAssistantAnswerText only runs in the agent-answer branch, so an
    // answer that completes without a packet was previously rendered from the
    // raw streamed accumulation with the fence intact.
    const finalized = finalizeAssistantMessage({
      status: "streaming",
      answer: FENCED_ANSWER,
    });

    expect(finalized.answer).toContain("advisory read");
    expect(finalized.answer).not.toContain("followups");
    expect(finalized.answer).not.toContain("What would change this view?");
    expect(finalized.status).toBe("done");
  });

  it("leaves an already-clean packet answer untouched in substance", () => {
    const clean = resolveAssistantAnswerText("", "The read is clear.", false);
    expect(finalizeAssistantMessage({ status: "streaming", answer: clean }).answer).toBe(
      "The read is clear.",
    );
  });

  it("preserves an error status rather than reporting a failed stream as done", () => {
    expect(
      finalizeAssistantMessage({ status: "error", answer: "boom" }).status,
    ).toBe("error");
  });

  it("keeps finalization wired into the stream completion path", () => {
    // The transform is only worth anything if the stream actually calls it.
    expect(componentSource).toContain("? finalizeAssistantMessage(m)");
  });
});

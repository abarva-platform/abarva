import { resolveAssistantAnswerText } from "../AdvisoryIntelligencePage";

describe("resolveAssistantAnswerText", () => {
  it("prefers the clean packet body whenever structured artifacts exist, even if the raw stream looks longer", () => {
    const rawStreamed =
      'Payment integrity leads. ```decision-table {"title":"x","rows":[{"initiative":"Agent Assist"}]}``` More prose after the fence.';
    const packetBody = "Payment integrity leads. More prose after the fence.";

    expect(resolveAssistantAnswerText(rawStreamed, packetBody, true)).toBe(
      packetBody,
    );
  });

  it("prefers the packet body even when it is corrupted by per-chunk scrubbing (only a fragment of the fence survives)", () => {
    // Simulates displaySafeIntelligenceDelta corrupting a fence marker that
    // was split across streaming chunk boundaries — the raw text no longer
    // contains a clean ```decision-table substring, so a leak-detection
    // regex on rawStreamed would miss it. hasArtifacts=true alone must be
    // enough to prefer packetBody.
    const rawStreamedWithCorruptedFence =
      'Payment integrity leads. ``decision-table {"title":"x"} ` More prose.';
    const packetBody = "Payment integrity leads. More prose.";

    expect(
      resolveAssistantAnswerText(
        rawStreamedWithCorruptedFence,
        packetBody,
        true,
      ),
    ).toBe(packetBody);
  });

  it("falls back to the raw stream when there are no structured artifacts and the packet body is too short", () => {
    const rawStreamed = "A full, detailed prose answer with real content.";
    const packetBody = "";

    expect(resolveAssistantAnswerText(rawStreamed, packetBody, false)).toBe(
      rawStreamed,
    );
  });

  it("uses the packet body when there is no raw stream yet (empty answer)", () => {
    expect(resolveAssistantAnswerText("", "Clean answer.", false)).toBe(
      "Clean answer.",
    );
  });

  it("keeps the raw stream when artifacts are absent and the packet body is a much shorter, possibly lossy summary", () => {
    const rawStreamed =
      "A very long and detailed executive answer spanning many sentences of real substance and nuance.";
    const packetBody = "Short.";

    expect(resolveAssistantAnswerText(rawStreamed, packetBody, false)).toBe(
      rawStreamed,
    );
  });
});

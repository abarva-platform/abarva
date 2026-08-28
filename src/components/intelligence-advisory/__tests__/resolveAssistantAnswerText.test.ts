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

  it("prefers a clean packet body even when that body contains a normal Markdown table", () => {
    const rawStreamed =
      'Agent assist leads. ```decision-table {"title":"x","rows":[{"initiative":"Agent Assist"}]}```';
    const packetBody = [
      "Agent assist leads.",
      "",
      "| Opportunity | Posture |",
      "|---|---|",
      "| Agent assist | Scale first |",
    ].join("\n");

    expect(resolveAssistantAnswerText(rawStreamed, packetBody, true)).toBe(
      packetBody,
    );
  });

  it("falls back to the raw stream when the packet body is empty", () => {
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

  it("uses the final packet body even when it is a shorter governed CXO brief", () => {
    const rawStreamed =
      "A very long and detailed executive answer spanning many sentences of real substance and nuance.";
    const packetBody =
      "**Answer:** Scale agent assist only after current-state evidence is validated.\n\n**Proof:** The context points to systems, data, and workflow gaps that should shape the rollout.\n\n**Move:** Run the bet through Intelligence, Home, Moves, Source, and Tower.";

    expect(resolveAssistantAnswerText(rawStreamed, packetBody, false)).toBe(
      packetBody,
    );
  });

  it("preserves Claude-authored advisory labels in the visible stream path", () => {
    const rawStreamed =
      "Answer: Healthcare Demo should proceed. Proof: Proof. The evidence is partial. Move: Move. Home should validate the gaps.";

    expect(resolveAssistantAnswerText(rawStreamed, "", false)).toBe(
      rawStreamed,
    );
  });

  it("strips raw governed artifact row JSON from fallback stream text", () => {
    const rawStreamed =
      'The supply-chain AOG agent is the first candidate, {"initiative":"AOG Risk & Parts Availability Alert Agent","valueScore":80,"complexityScore":55,"readinessScore":65} then show the trend chart.';

    expect(resolveAssistantAnswerText(rawStreamed, "", false)).toBe(
      "The supply-chain AOG agent is the first candidate, then show the trend chart.",
    );
  });
});

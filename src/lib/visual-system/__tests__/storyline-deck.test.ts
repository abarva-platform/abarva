import {
  buildHandoffDeck,
  validateStorylineDeck,
  deckExhibits,
  renderDeckHtml,
} from "../storyline-deck";
import { FC_HANDOFF } from "../__fixtures__/first-capital-handoff";
import { assessClientDeliverable } from "@/lib/deliverables/quality/assess-deliverable";

describe("storyline deck (W3)", () => {
  it("puts the decision in the first two slides", () => {
    const deck = buildHandoffDeck(FC_HANDOFF);
    expect(validateStorylineDeck(deck).filter((i) => i.level === "error")).toHaveLength(0);
    expect(deck.slides[0].kind).toBe("decision_headline");
    expect(deck.slides[1].kind).toBe("decision_requested");
  });

  it("places all required handoff exhibits", () => {
    const ex = deckExhibits(buildHandoffDeck(FC_HANDOFF));
    expect(ex).toEqual(
      expect.arrayContaining([
        "decision_headline",
        "value_story",
        "roadmap_lanes",
        "risks_and_mitigations",
      ]),
    );
  });

  it("passes the handoff profile gates (exhibits present, evidence off-slide)", () => {
    const deck = buildHandoffDeck(FC_HANDOFF);
    const narrative = deck.slides
      .map((s) => [s.governingMessage, ...(s.points ?? [])].join(" "))
      .join("\n");
    const a = assessClientDeliverable({
      deliverableKey: "handoff_package",
      narrativeText: narrative,
      renderedExhibits: deckExhibits(deck),
      sourceRegisterInBody: false,
    });
    expect(a.clientReady).toBe(true);
  });

  it("renders a self-contained HTML deck with speaker notes off the slide body", () => {
    const html = renderDeckHtml(buildHandoffDeck(FC_HANDOFF));
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Speaker notes");
    expect(html).toContain('data-kind="decision_headline"');
  });

  it("flags a deck that hides the decision past slide 2", () => {
    const deck = buildHandoffDeck(FC_HANDOFF);
    deck.slides = [deck.slides[2], deck.slides[3], deck.slides[0]]; // bury the decision
    expect(validateStorylineDeck(deck).some((i) => i.level === "error")).toBe(true);
  });
});

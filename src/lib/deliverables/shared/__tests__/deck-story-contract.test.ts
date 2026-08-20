import {
  CORE_SLIDE_COUNT,
  classifySlideDensity,
  DECK_OUTPUT_TOKEN_BUDGET,
  DECK_STORY_CONTRACTS,
  deckContract,
  isGenericSlideTitle,
  MAX_SUPPORTING_POINTS,
  renderDeckContractPrompt,
  SLIDE_DENSITY,
  slideDensityBlocks,
  unknownBeatIds,
  type DeckContractId,
} from "../deck-story-contract";
import { EXECUTIVE_STORY_SPINES } from "../executive-story-contract";

const ALL: DeckContractId[] = Object.keys(
  DECK_STORY_CONTRACTS,
) as DeckContractId[];

describe("slide density", () => {
  it("classifies each band at its exact boundary", () => {
    expect(classifySlideDensity(34)).toBe("sparse");
    expect(classifySlideDensity(35)).toBe("preferred");
    expect(classifySlideDensity(70)).toBe("preferred");
    expect(classifySlideDensity(71)).toBe("advisory");
    expect(classifySlideDensity(100)).toBe("advisory");
    expect(classifySlideDensity(101)).toBe("too_dense");
  });

  it("blocks only past the hard ceiling, not at the advisory edge", () => {
    expect(slideDensityBlocks(SLIDE_DENSITY.advisoryMax)).toBe(false);
    expect(slideDensityBlocks(SLIDE_DENSITY.blockingMax)).toBe(false);
    expect(slideDensityBlocks(SLIDE_DENSITY.blockingMax + 1)).toBe(true);
  });

  it("keeps the bands ordered", () => {
    expect(SLIDE_DENSITY.preferredMin).toBeLessThan(SLIDE_DENSITY.preferredMax);
    expect(SLIDE_DENSITY.preferredMax).toBeLessThan(SLIDE_DENSITY.advisoryMax);
    expect(SLIDE_DENSITY.advisoryMax).toBeLessThan(SLIDE_DENSITY.blockingMax);
  });

  it("budgets tokens generously, because visible text is a fraction of the output", () => {
    expect(DECK_OUTPUT_TOKEN_BUDGET.min).toBeGreaterThanOrEqual(10_000);
    expect(DECK_OUTPUT_TOKEN_BUDGET.max).toBeGreaterThanOrEqual(
      DECK_OUTPUT_TOKEN_BUDGET.min,
    );
  });
});

describe("every deck projects the shared spine", () => {
  it("names only beats that exist in its declared spine", () => {
    for (const id of ALL) {
      expect(unknownBeatIds(deckContract(id))).toEqual([]);
    }
  });

  it("explains every slide that carries no single beat", () => {
    for (const id of ALL) {
      for (const slide of deckContract(id).slides) {
        if (slide.beatId === null) {
          expect(slide.spansStory).toEqual(expect.stringMatching(/\S/));
        }
      }
    }
  });

  it("follows the spine order for the slides that carry beats", () => {
    for (const id of ALL) {
      const c = deckContract(id);
      const spineOrder = EXECUTIVE_STORY_SPINES[c.spine].map((b) => b.id);
      const carried = c.slides
        .map((s) => s.beatId)
        .filter((b): b is string => b !== null)
        .map((b) => spineOrder.indexOf(b));
      const sorted = [...carried].sort((a, b) => a - b);
      expect(carried).toEqual(sorted);
    }
  });

  it("keeps slide ids unique within a deck", () => {
    for (const id of ALL) {
      const ids = deckContract(id).slides.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("stays within the core slide count", () => {
    for (const id of ALL) {
      const n = deckContract(id).slides.length;
      expect(n).toBeGreaterThanOrEqual(CORE_SLIDE_COUNT.min);
      expect(n).toBeLessThanOrEqual(CORE_SLIDE_COUNT.max);
    }
  });

  it("opens on a decision and closes on a decision or its mechanics", () => {
    for (const id of ALL) {
      const slides = deckContract(id).slides;
      expect(slides[0].primaryVisual).toBe("decision_card");
      expect(["decision_card", "table"]).toContain(
        slides.at(-1)!.primaryVisual,
      );
    }
  });
});

describe("P4 business-case deck", () => {
  const c = deckContract("REF_DECK_P4_BUSINESS_CASE");

  it("mandates Business Case at a Glance as the second slide", () => {
    const glance = c.slides[1];
    expect(glance.id).toBe("business_case_at_a_glance");
    expect(glance.required).toBe(true);
  });

  it("makes the at-a-glance slide carry the whole case, not one step of it", () => {
    const glance = c.slides.find((s) => s.id === "business_case_at_a_glance")!;
    expect(glance.beatId).toBeNull();
    expect(glance.spansStory).toMatch(/whole case/i);
    // A CFO should get recommendation, cost, value, economics, delivery, risk
    // and the ask from this one page.
    for (const needle of [
      "recommendation",
      "shared foundation",
      "incremental use-case",
      "annual run",
      "annual benefit",
      "value confidence",
      "three-year TCO",
      "payback",
      "low / expected / high",
      "preferred delivery model",
      "largest single uncertainty",
      "the exact ask today",
    ]) {
      expect(glance.requiredElements.join(" | ")).toContain(needle);
    }
  });

  it("follows the agreed twelve-slide flow", () => {
    expect(c.slides.map((s) => s.id)).toEqual([
      "decision_ask",
      "business_case_at_a_glance",
      "why_now",
      "what_we_are_funding",
      "investment_required",
      "value_case",
      "economics_sensitivity",
      "delivery_approach",
      "roadmap_gates",
      "risks_controls",
      "recommendation",
      "next_decisions",
    ]);
  });

  it("splits foundation from incremental cost on the investment slide", () => {
    const investment = c.slides.find((s) => s.id === "investment_required")!;
    expect(investment.requiredElements.join(" | ")).toMatch(
      /shared foundation/,
    );
    expect(investment.requiredElements.join(" | ")).toMatch(
      /incremental use-case/,
    );
  });

  it("requires 'what not to fund yet' on the recommendation slide", () => {
    const rec = c.slides.find((s) => s.id === "recommendation")!;
    expect(rec.requiredElements.join(" | ")).toMatch(/not to fund yet/i);
  });

  it("sends estimate, assumption and architecture detail to the appendix", () => {
    expect(c.appendixAllowed).toBe(true);
    for (const item of ["detailed estimate", "assumptions", "architecture"]) {
      expect(c.appendixContent).toContain(item);
    }
  });
});

describe("isGenericSlideTitle", () => {
  it("rejects bare category labels", () => {
    for (const title of [
      "Architecture",
      "Financials",
      "Economics",
      "Next Steps",
      "Risks",
      "Roadmap",
      "Overview",
    ]) {
      expect(isGenericSlideTitle(title)).toBe(true);
    }
  });

  it("rejects anything too short to be a conclusion", () => {
    expect(isGenericSlideTitle("Our Approach")).toBe(true);
    expect(isGenericSlideTitle("")).toBe(true);
    expect(isGenericSlideTitle("   ")).toBe(true);
  });

  it("accepts titles that state the point", () => {
    for (const title of [
      "A shared foundation lets four later use cases reuse governed entities",
      "Scoring is separated from action so every recommendation stays reviewable",
      "Two thirds of the investment is foundation the portfolio reuses",
    ]) {
      expect(isGenericSlideTitle(title)).toBe(false);
    }
  });
});

describe("renderDeckContractPrompt", () => {
  const prompt = renderDeckContractPrompt("REF_DECK_P4_BUSINESS_CASE");

  it("names the contract and the single question the deck answers", () => {
    expect(prompt).toContain("REF_DECK_P4_BUSINESS_CASE");
    expect(prompt).toMatch(/Should we fund this investment/);
  });

  it("numbers the flow and forbids reordering", () => {
    expect(prompt).toMatch(/1\. Decision \/ Ask/);
    expect(prompt).toMatch(/2\. Business Case at a Glance/);
    expect(prompt).toMatch(/Do not reorder/i);
  });

  it("states the density bands and the structural rules", () => {
    expect(prompt).toContain(
      `${SLIDE_DENSITY.preferredMin}-${SLIDE_DENSITY.preferredMax}`,
    );
    expect(prompt).toContain(String(SLIDE_DENSITY.blockingMax));
    expect(prompt).toMatch(/One primary message per slide/);
    expect(prompt).toMatch(/One primary visual per slide/);
    expect(prompt).toContain(String(MAX_SUPPORTING_POINTS));
    expect(prompt).toMatch(/exclude speaker notes/);
  });

  it("requires message-led titles explicitly", () => {
    expect(prompt).toMatch(/state the conclusion, not the category/);
  });

  it("marks optional slides as optional rather than dropping them", () => {
    expect(prompt).toMatch(/Delivery Approach \[include when relevant\]/);
    expect(prompt).toMatch(/Decision \/ Ask \[REQUIRED\]/);
  });

  it("renders every deck without throwing", () => {
    for (const id of ALL) {
      expect(renderDeckContractPrompt(id)).toMatch(/DECK STORY CONTRACT/);
    }
  });
});

/**
 * Backlog item C-503 — the paragraph budget must count paragraphs.
 *
 * `shapeSharedAdvisorResponse` compacts an answer when it is over a
 * character target OR over a paragraph budget (`maxParagraphs`, default 5).
 * The second half of that test was measured by `paragraphSplit`, which split
 * on `/\n\s*\n|\n/` — a blank line OR a bare newline — so it returned one
 * entry per LINE. A soft line break inside a paragraph therefore spent a
 * whole slot of the budget, and an answer inside both declared limits was
 * rebuilt as a lead line plus bullets anyway.
 *
 * The known positive pre-dates this suite and is quoted rather than
 * invented: the `C-009` comment in
 * `src/__tests__/integration/intelligence-chat-shape.test.ts` names a
 * fixture measuring 861 characters (under the 900-char target) in 5
 * blank-line paragraphs (at the 5-paragraph budget) but 6 lines.
 *
 * ONE CLAIM IN THE C-503 FILING IS CORRECTED HERE, by measurement rather
 * than by argument. The filing says the bug "still governs the four
 * declared form surfaces (`setup`, `/admin/setup`, `/setup`,
 * `/platform/admin`)". It does not govern what those surfaces RENDER.
 * Measured before and after this change over a 47-fixture corpus across ten
 * surfaces — 470 surface cells — not one surface output differs, because on
 * a compacting surface `compactConsultantChatText` runs FIRST and has
 * already rebuilt the answer to at most five lines before the shared shaper
 * sees it. The three outputs that do change are direct
 * `shapeSharedAdvisorResponse` calls; five more are `length_over_target`
 * issues that stop being raised falsely. So this is a repair to the shared
 * shaper's own declared contract with no measured change to any rendered
 * surface today, and the last case below pins that statement so it cannot
 * quietly stop being true.
 *
 * Two directions, deliberately. Making a budget stop firing is trivially
 * achievable by never compacting at all, so the over-budget cases pin that a
 * genuinely over-budget answer is STILL compacted and still reports
 * `length_over_target`. A fix that disabled the compactor turns those red.
 */

import { shapeAgentResponseForSurface } from "@/lib/agent/response-shape";
import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

/**
 * Prose, no bullets, no table, no section headers — so
 * `looksAlreadyStructured` is false and the answer reaches the compactor.
 * Five blank-line paragraphs; the first carries one soft line break, so it
 * is six lines. Measured by the first case below rather than asserted here.
 */
const WITHIN_BUDGET_SOFT_BREAK = [
  "The renewal you asked about lands in March and the current run rate is $1.2M a year.",
  "Two of the four modules on it have no recorded usage since June, which is the part worth acting on.",
  "",
  "My read is that this is a scope problem rather than a price problem.",
  "",
  "The vendor will open on price because that is the lever they control, and a discount on modules nobody opens is still spend on modules nobody opens.",
  "",
  "What I would want before the first call is the usage export for those two modules and the owner who signed for them.",
  "",
  "Do you want me to pull the usage export, or would you rather take the owner conversation first?",
].join("\n");

/** The same answer with the soft break spent as a space instead. */
const WITHIN_BUDGET_NO_SOFT_BREAK = WITHIN_BUDGET_SOFT_BREAK.replace(
  "$1.2M a year.\nTwo of",
  "$1.2M a year. Two of",
);

/**
 * Four paragraphs, two of them carrying a soft break, comfortably under the
 * 900-character target. Six lines, four paragraphs. Before the fix the last
 * two paragraphs were dropped entirely.
 */
const FOUR_PARAGRAPHS_TWO_SOFT_BREAKS = [
  "The March renewal is the one to open.\nIt carries $1.2M of the $3.1M annual line.",
  "Usage tells the story: two of four modules have no sessions since June.\nThat is scope, not price.",
  "The vendor will lead with a discount because that is their lever.",
  "I would take the usage export into the first call and let them argue with it.",
].join("\n\n");

/**
 * A numbered inspection list. Line-counting saw seven lines, restructured
 * it, and produced text that no longer parses as anything.
 */
const NUMBERED_STEPS = [
  "Inspect in this order",
  "1. the renewal",
  "2. the usage",
  "3. the owner",
  "4. the contract",
  "5. the budget",
  "6. the risk",
].join("\n");

/**
 * Seven blank-line paragraphs, still under the character target: over the
 * budget on paragraphs alone, and so compacted before and after.
 */
const OVER_BUDGET_PARAGRAPHS = [
  "The renewal lands in March.",
  "The run rate is $1.2M a year.",
  "Two modules have no usage since June.",
  "The vendor will open on price.",
  "A discount on unused modules is still waste.",
  "I would want the usage export first.",
  "And the owner who signed for those modules.",
].join("\n\n");

/**
 * Six paragraphs — genuinely over the budget, so it IS compacted — carrying
 * none of the keywords the lead picker matches on
 * (`read|answer|recommend|pause|inspect|compare|outlier|risk|value|budget|vendor|renewal|proof`).
 * That is what makes it useful: with no keyword hit, the lead falls through
 * to the candidate list, which is the one reader C-503 deliberately left
 * counting lines. Its first paragraph carries a soft break, so a
 * line-shaped candidate list yields one sentence and a paragraph-shaped one
 * yields two.
 */
const LEAD_FALLBACK_NO_KEYWORD = [
  "The March meeting is where this gets decided.\nEverybody with a stake will be in that room already.",
  "Our people have been asking about it since the summer.\nNobody has told them anything yet.",
  "The other group met last week and came away with a plan of their own.",
  "Their plan touches three teams here and nobody here has seen it.",
  "I would rather we walk in with something written than react to theirs.",
  "Do you want me to draft it, or would you rather do that part yourself?",
].join("\n\n");

const FORM_SURFACES = ["setup", "/admin/setup", "/setup", "/platform/admin"];

const nonEmptyLines = (text: string) =>
  text.split("\n").filter((line) => line.trim());
const paragraphs = (text: string) =>
  text.split(/\n\s*\n/).filter((para) => para.trim());

describe("C-503 — the paragraph budget counts paragraphs, not lines", () => {
  it("measures the fixture: inside the character target, at the paragraph budget, over the line count", () => {
    expect(WITHIN_BUDGET_SOFT_BREAK.length).toBeLessThan(900);
    expect(paragraphs(WITHIN_BUDGET_SOFT_BREAK)).toHaveLength(5);
    expect(nonEmptyLines(WITHIN_BUDGET_SOFT_BREAK)).toHaveLength(6);

    expect(FOUR_PARAGRAPHS_TWO_SOFT_BREAKS.length).toBeLessThan(900);
    expect(paragraphs(FOUR_PARAGRAPHS_TWO_SOFT_BREAKS)).toHaveLength(4);
    expect(nonEmptyLines(FOUR_PARAGRAPHS_TWO_SOFT_BREAKS)).toHaveLength(6);

    expect(OVER_BUDGET_PARAGRAPHS.length).toBeLessThan(900);
    expect(paragraphs(OVER_BUDGET_PARAGRAPHS)).toHaveLength(7);
  });

  it("does not compact an answer whose only excess is a soft line break", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: WITHIN_BUDGET_SOFT_BREAK,
      preserveStructure: false,
    });

    // Every paragraph's load-bearing fragment survives.
    expect(shaped.text).toContain("lands in March");
    expect(shaped.text).toContain("no recorded usage since June");
    expect(shaped.text).toContain("scope problem rather than a price problem");
    expect(shaped.text).toContain("modules nobody opens");
    expect(shaped.text).toContain("the usage export for those two modules");
    expect(shaped.text).toContain("take the owner conversation first");
  });

  it("keeps the paragraphs a soft break used to cost — the last two, entirely", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: FOUR_PARAGRAPHS_TWO_SOFT_BREAKS,
      preserveStructure: false,
    });

    expect(shaped.text).toContain("lead with a discount");
    expect(shaped.text).toContain("let them argue with it");
    expect(paragraphs(shaped.text)).toHaveLength(4);
  });

  it("leaves a numbered inspection list parseable instead of restructuring it", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: NUMBERED_STEPS,
      preserveStructure: false,
    });

    expect(shaped.text).toContain("5. the budget");
    expect(shaped.text).toContain("6. the risk");
    expect(shaped.text).not.toMatch(/^- \d+\.$/m);
  });

  it("does not report length_over_target for an answer inside both declared limits", () => {
    const { issues } = shapeSharedAdvisorResponse({
      text: WITHIN_BUDGET_SOFT_BREAK,
      preserveStructure: true,
    });

    expect(issues.map((issue) => issue.code)).not.toContain(
      "length_over_target",
    );
  });

  it("still compacts an answer that is genuinely over the paragraph budget", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: OVER_BUDGET_PARAGRAPHS,
      preserveStructure: false,
    });

    expect(paragraphs(shaped.text).length).toBeLessThan(7);
    expect(shaped.text.length).toBeLessThan(OVER_BUDGET_PARAGRAPHS.length);
  });

  it("still reports length_over_target when the paragraph budget is genuinely exceeded", () => {
    const { issues } = shapeSharedAdvisorResponse({
      text: OVER_BUDGET_PARAGRAPHS,
      preserveStructure: true,
    });

    expect(issues.map((issue) => issue.code)).toContain("length_over_target");
  });

  it("takes its lead from the first line, not the first paragraph", () => {
    // The counterpart to the budget fix, and the reason `lineSplit` exists
    // rather than the splitter simply being changed everywhere. This list
    // feeds a 34-word trim of an OPENING SENTENCE; handing it a blank-line
    // paragraph would hand the trim a multi-line block. Without this case a
    // mutation that swaps the two survives — measured, not assumed.
    const shaped = shapeSharedAdvisorResponse({
      text: LEAD_FALLBACK_NO_KEYWORD,
      preserveStructure: false,
    });

    expect(shaped.text).toContain("The March meeting is where this gets decided");
    expect(shaped.text).not.toContain("Everybody with a stake");
  });

  it.each(FORM_SURFACES)(
    "renders %s the same with or without the soft break — the first compactor governs there, not this budget",
    (surface) => {
      // The correction to the filing, pinned. If a future change moves
      // `compactConsultantChatText` off these surfaces, this case turns red
      // and the next reader learns that the shared budget has become the
      // binding constraint there — rather than assuming it always was.
      expect(shapeAgentResponseForSurface(surface, WITHIN_BUDGET_SOFT_BREAK)).toBe(
        shapeAgentResponseForSurface(surface, WITHIN_BUDGET_NO_SOFT_BREAK),
      );
    },
  );
});

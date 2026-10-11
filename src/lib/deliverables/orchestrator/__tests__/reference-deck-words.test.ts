jest.mock("server-only", () => ({}));

const mockPreflight = jest.fn();
jest.mock("@/lib/ai/document-generation-policy", () => ({
  policyForTier: () => ({ model: "synthetic-model" }),
}));
jest.mock("@/lib/integrations/ai-egress/anthropic-direct", () => ({
  preflightAnthropicDirectClient: (...args: unknown[]) => mockPreflight(...args),
}));

import { draftEditionWords, modelWordRule, unavailableEditionWords } from "../reference-deck-words";
import { REFERENCE_ARCHETYPES } from "../reference-deck-model";
import type { ReferenceSlotTable } from "../reference-deck-slots";

const slots: ReferenceSlotTable = {
  "value.annual.base": {
    key: "value.annual.base", meaning: "annual counted value", display: "$12,000",
    sourceId: "engine:annual_cash_base", sourceLabel: "Value engine", missingPhrase: "value not yet modelled",
    editions: ["validation", "investment"],
  },
  "rom.total.plan": {
    key: "rom.total.plan", meaning: "approved delivery estimate", display: null,
    sourceId: "gap:rom_total_plan", sourceLabel: "Approved ROM unavailable", missingPhrase: "approved estimate unavailable",
    editions: ["investment"],
  },
  "value.annual.plan": {
    key: "value.annual.plan", meaning: "annual counted value", display: "$12,000",
    sourceId: "engine:annual_cash_base", sourceLabel: "Value engine", missingPhrase: "value not yet modelled",
    editions: ["investment"],
  },
};
const input = {
  tenantId: "synthetic-tenant", userId: "synthetic-user", edition: "validation" as const,
  archetypes: ["one_page"] as Parameters<typeof draftEditionWords>[0]["archetypes"],
  useCaseType: "workflow_automation" as const, phaseStage: "design_review" as const,
  available: { valueCase: true, register: true, rom: false, publicSources: false, owners: false }, slots,
};
const safeWords = { words: [{
  title: "The annual case counts {value.annual.base} on its current basis",
  answer: "Review the counted basis and its source.",
  notes: "The point: confirm {value.annual.base}. How to read: inspect the source line.",
}] };

beforeEach(() => jest.clearAllMocks());

describe("reference-deck words", () => {
  it("passes only slot names and coarse profile through audited egress", async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(safeWords) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords(input);
    expect(result).toEqual({ words: safeWords.words, status: "ok", fallbackSlides: [] });
    expect(mockPreflight).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: "synthetic-tenant", workflow: "moves:reference-deck:preview:words",
      workload: "moves_reference_deck", prompt: expect.stringContaining("handoffs"),
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      output_config: expect.objectContaining({ format: expect.objectContaining({ type: "json_schema" }) }),
    }));
    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain("$12,000");
    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain("synthetic-user");
  });

  it("rejects literal model figures and edition slots while accepting a governed slot", () => {
    expect(modelWordRule(safeWords.words[0]!, "validation", slots, "one_page")).toBeNull();
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case counts $12,000 on its current basis" }, "validation", slots, "one_page")).toBe("literal_figure");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The delivery estimate is {rom.total.plan} on its current basis" }, "validation", slots, "one_page")).toBe("edition_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The case counts {unknown.amount} on its current basis" }, "validation", slots, "one_page")).toBe("unknown_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The solution plan now has an owner review" }, "validation", slots, "one_page")).toBe("edition_language");
    expect(modelWordRule({ title: "The evidence defines the next decision for this case", answer: "Review the solution plan.", notes: "The point: review evidence. How to read: use the source line." }, "validation", slots, "cover")).toBe("edition_language");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case needs a reviewed basis" }, "investment", slots, "one_page")).toBe("missing_title_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" }, "investment", slots, "one_page")).toBeNull();
  });

  it("keeps reason-coded fallbacks for egress denial, parse failure and rejected slide", async () => {
    mockPreflight.mockResolvedValueOnce({ ok: false });
    const denied = await draftEditionWords(input);
    expect(denied).toMatchObject({ status: "unavailable", reason: "preflight_denied", fallbackSlides: [1] });
    expect(JSON.stringify(denied)).not.toContain("draft words unavailable");
    const create = jest.fn().mockResolvedValueOnce({ content: [{ type: "text", text: '{"words":[]}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [{ ...safeWords.words[0], answer: "Review the solution plan." }] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    expect((await draftEditionWords(input))).toMatchObject({ status: "unavailable", reason: "parse_failed" });
    expect((await draftEditionWords(input))).toMatchObject({ status: "unavailable", reason: "slide_rejected", rule: "edition_language", slide: 1 });
  });

  it("marks model exceptions without exposing provider details", async () => {
    mockPreflight.mockRejectedValue(new Error("private provider detail"));
    const result = await draftEditionWords(input);
    expect(result).toMatchObject({ status: "unavailable", reason: "model_error" });
    expect(JSON.stringify(result)).not.toContain("private provider detail");
  });

  it("provides a sentence and notes for every archetype in both editions", () => {
    for (const edition of ["validation", "investment"] as const) {
      const words = unavailableEditionWords(edition, [...REFERENCE_ARCHETYPES]);
      expect(words).toHaveLength(REFERENCE_ARCHETYPES.length);
      for (const entry of words) {
        expect(entry.title.trim().split(/\s+/).length).toBeGreaterThanOrEqual(5);
        expect(entry.notes.startsWith("The point:")).toBe(true);
        expect(entry.notes).toContain("How to read:");
        expect(JSON.stringify(entry)).not.toContain("draft words unavailable");
      }
    }
    const investment = unavailableEditionWords("investment", [...REFERENCE_ARCHETYPES]);
    expect(investment.filter((entry) => /\{[^{}]+\}/.test(entry.title)).length).toBeGreaterThanOrEqual(11);
  });
});

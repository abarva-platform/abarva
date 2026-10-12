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
    }), { timeout: 65_000, maxRetries: 0 });
    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain("$12,000");
    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain("synthetic-user");
    expect(JSON.stringify(create.mock.calls[0][0])).toContain('\\"token\\":\\"{value.annual.base}\\"');
  });

  it("rejects literal model figures and edition slots while accepting a governed slot", () => {
    expect(modelWordRule(safeWords.words[0]!, "validation", slots, "one_page")).toBeNull();
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case counts $12,000 on its current basis" }, "validation", slots, "one_page")).toBe("literal_figure");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The delivery estimate is {rom.total.plan} on its current basis" }, "validation", slots, "one_page")).toBe("edition_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The case counts {unknown.amount} on its current basis" }, "validation", slots, "one_page")).toBe("unknown_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, answer: "Review [value.annual.base] on its basis." }, "validation", slots, "one_page")).toBe("malformed_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, answer: "Review value.annual.base on its basis." }, "validation", slots, "one_page")).toBe("malformed_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The solution plan now has an owner review" }, "validation", slots, "one_page")).toBe("edition_language");
    expect(modelWordRule({ title: "The evidence defines the next decision for this case", answer: "Review the solution plan.", notes: "The point: review evidence. How to read: use the source line." }, "validation", slots, "cover")).toBe("edition_language");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case needs a reviewed basis" }, "investment", slots, "one_page")).toBe("missing_title_slot");
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" }, "investment", slots, "one_page")).toBeNull();
    expect(modelWordRule({ ...safeWords.words[0]!, title: "The annual case counts {{value.annual.plan}} on its current basis" }, "investment", slots, "one_page")).toBe("malformed_slot");
  });

  it("uses the mandated validation-cover words without counting a model disclosure as fallback", async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ words: [{
      title: "A solution plan should follow this validation review",
      answer: "No solution plan or cost is provided here.",
      notes: "The point: no solution plan or cost. How to read: review evidence.",
    }] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, archetypes: ["cover"] });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(result.words).toEqual(unavailableEditionWords("validation", ["cover"]));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("normalizes only known slot wrappers before the figure guard", async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ words: [
      { title: "The evidence defines the next decision for this case", answer: "Review the evidence and its gaps.", notes: "The point: review evidence. How to read: inspect the source line." },
      { title: "The annual case counts {{ value.annual.plan }} on its current basis", answer: "Review the counted basis.", notes: "The point: confirm { value.annual.plan }. How to read: inspect the source line." },
    ] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, edition: "investment", archetypes: ["cover", "one_page"] });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(result.words[1]?.title).toContain("{value.annual.plan}");
    expect(result.words[1]?.notes).toContain("{value.annual.plan}");
    expect(create).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(create.mock.calls[0][0])).toContain('\\"requiredTitleSlot\\":\\"{value.annual.plan}\\"');
  });

  it("retries a rejected slide through audited egress and keeps the guard on the repair", async () => {
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [{ ...safeWords.words[0], answer: "Review the solution plan." }] }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify(safeWords) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords(input);
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(create).toHaveBeenCalledTimes(2);
    expect(mockPreflight).toHaveBeenCalledTimes(2);
    expect(mockPreflight.mock.calls[1][0]).toMatchObject({
      workflow: "moves:reference-deck:preview:words:repair", workload: "moves_reference_deck",
      metadata: expect.objectContaining({ repair: true, persist: false }),
    });
    expect(mockPreflight.mock.calls[1][0].prompt).not.toContain("$12,000");
    expect(mockPreflight.mock.calls[1][0].prompt).not.toContain("synthetic-user");
    expect(create.mock.calls[1][0]).toMatchObject({
      output_config: expect.objectContaining({ format: expect.objectContaining({ type: "json_schema" }) }),
    });
  });

  it("retains a reason-coded fallback when the repair still breaks the edition rule", async () => {
    const invalid = { words: [{ ...safeWords.words[0], answer: "Review the solution plan." }] };
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(invalid) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords(input);
    expect(result).toMatchObject({ status: "unavailable", reason: "slide_rejected", rule: "edition_language", slide: 1, fallbackSlides: [1] });
    expect(result.words).toEqual(unavailableEditionWords("validation", ["one_page"]));
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("bounds a many-slide repair into audited short batches", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const invalid = { ...valid, answer: "The model invented $12,000." };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: Array(7).fill(invalid) }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: Array(6).fill(valid) }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [valid] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, edition: "investment", archetypes: Array(7).fill("one_page") });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(create).toHaveBeenCalledTimes(3);
    expect(mockPreflight.mock.calls.slice(1).map((call) => call[0].metadata.slideCount)).toEqual([6, 1]);
  });

  it("drafts a full investment edition in short audited batches", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn().mockImplementation((request: { messages: Array<{ content: string }> }) => {
      const { slides } = JSON.parse(request.messages[0]!.content) as { slides: unknown[] };
      return Promise.resolve({ content: [{ type: "text", text: JSON.stringify({ words: slides.map(() => valid) }) }] });
    });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, edition: "investment", archetypes: Array(22).fill("one_page") });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(result.words).toHaveLength(22);
    expect(create).toHaveBeenCalledTimes(3);
    expect(create.mock.calls.map((call) => call[0].max_tokens)).toEqual([4500, 4500, 4500]);
    expect(create.mock.calls.every((call) => call[1].timeout === 65_000 && call[1].maxRetries === 0)).toBe(true);
    expect(mockPreflight.mock.calls.map((call) => call[0].metadata.slideCount)).toEqual([8, 8, 6]);
    expect(mockPreflight.mock.calls.every((call) => call[0].workflow === "moves:reference-deck:preview:words:batch")).toBe(true);
  });

  it("recovers only a failed initial investment batch", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn().mockImplementation((request: { messages: Array<{ content: string }> }) => {
      const { slides } = JSON.parse(request.messages[0]!.content) as { slides: unknown[] };
      if (create.mock.calls.length === 2) return Promise.reject(new Error("synthetic provider timeout"));
      return Promise.resolve({ content: [{ type: "text", text: JSON.stringify({ words: slides.map(() => valid) }) }] });
    });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, edition: "investment", archetypes: Array(22).fill("one_page") });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
    expect(create).toHaveBeenCalledTimes(5);
    expect(mockPreflight.mock.calls[3][0]).toMatchObject({
      workflow: "moves:reference-deck:preview:words:parse-recovery",
      metadata: { edition: "investment", slideStart: 9, slideCount: 6, persist: false, parseRecovery: true },
    });
    expect(mockPreflight.mock.calls[4][0]).toMatchObject({
      workflow: "moves:reference-deck:preview:words:parse-recovery",
      metadata: { edition: "investment", slideStart: 15, slideCount: 2, persist: false, parseRecovery: true },
    });
  });

  it("keeps successful batches when one audited preflight is denied", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn().mockImplementation((request: { messages: Array<{ content: string }> }) => {
      const { slides } = JSON.parse(request.messages[0]!.content) as { slides: unknown[] };
      return Promise.resolve({ content: [{ type: "text", text: JSON.stringify({ words: slides.map(() => valid) }) }] });
    });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    mockPreflight.mockResolvedValueOnce({ ok: false });
    const result = await draftEditionWords({ ...input, edition: "investment", archetypes: Array(22).fill("one_page") });
    expect(result).toMatchObject({ status: "unavailable", reason: "preflight_denied", slide: 1,
      fallbackSlides: [1, 2, 3, 4, 5, 6, 7, 8] });
    expect(result.words.slice(8)).toEqual(Array(14).fill(valid));
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("recovers a whole-deck parse failure through smaller audited batches", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn()
      .mockResolvedValueOnce({ stop_reason: "max_tokens", content: [{ type: "text", text: '{"words":[' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: Array(6).fill(valid) }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [valid] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const result = await draftEditionWords({ ...input, requestId: "synthetic-request", edition: "investment", archetypes: Array(7).fill("one_page") });
      expect(result).toMatchObject({ status: "ok", fallbackSlides: [] });
      expect(create).toHaveBeenCalledTimes(3);
      expect(mockPreflight.mock.calls.slice(1).map((call) => call[0])).toEqual([
        expect.objectContaining({ workflow: "moves:reference-deck:preview:words:parse-recovery", metadata: expect.objectContaining({ slideStart: 1, slideCount: 6, persist: false }) }),
        expect.objectContaining({ workflow: "moves:reference-deck:preview:words:parse-recovery", metadata: expect.objectContaining({ slideStart: 7, slideCount: 1, persist: false }) }),
      ]);
      expect(warn).toHaveBeenCalledWith("[reference-deck-words-parse]", {
        requestId: "synthetic-request", edition: "investment", expectedSlides: 7,
        receivedSlides: null, stopReason: "max_tokens", textLength: 10,
      });
      expect(JSON.stringify(create.mock.calls.slice(1).map((call) => call[0]))).not.toContain("$12,000");
    } finally {
      warn.mockRestore();
    }
  });

  it("retains only the failed parse batch as a scored fallback", async () => {
    const valid = { ...safeWords.words[0]!, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"words":[]}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: Array(6).fill(valid) }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"words":[]}' }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const result = await draftEditionWords({ ...input, edition: "investment", archetypes: Array(7).fill("one_page") });
      expect(result).toMatchObject({ status: "unavailable", reason: "parse_failed", slide: 7, fallbackSlides: [7] });
      expect(result.words.slice(0, 6)).toEqual(Array(6).fill(valid));
      expect(result.words[6]).toEqual(unavailableEditionWords("investment", ["one_page"])[0]);
    } finally {
      warn.mockRestore();
    }
  });

  it("keeps reason-coded fallbacks for egress denial, parse failure and rejected slide", async () => {
    mockPreflight.mockResolvedValueOnce({ ok: false });
    const denied = await draftEditionWords(input);
    expect(denied).toMatchObject({ status: "unavailable", reason: "preflight_denied", fallbackSlides: [1] });
    expect(JSON.stringify(denied).toLowerCase()).toContain("draft words unavailable");
    const create = jest.fn().mockResolvedValueOnce({ content: [{ type: "text", text: '{"words":[]}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"words":[]}' }] })
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
        expect(entry.answer.toLowerCase()).toContain("draft words unavailable");
      }
    }
    const investment = unavailableEditionWords("investment", [...REFERENCE_ARCHETYPES]);
    expect(investment.filter((entry) => /\{[^{}]+\}/.test(entry.title)).length).toBeGreaterThanOrEqual(8);
    expect(investment.find((entry) => entry.title.includes("assumption count"))).toBeUndefined();
  });
});

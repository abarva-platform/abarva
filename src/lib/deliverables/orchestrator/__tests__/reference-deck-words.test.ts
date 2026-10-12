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

const stateSlot = (key: string, display: string | null): ReferenceSlotTable[string] => ({
  key, display, meaning: "Synthetic governed state", sourceId: display === null ? `gap:${key.replaceAll(".", "_")}` : "evidence:synthetic_state",
  sourceLabel: "Synthetic governed state", missingPhrase: "unavailable", editions: ["validation", "investment"],
});

describe("reference-deck words", () => {
  it.each([[false, false], [true, false], [false, true], [true, true]])("gives concrete binding requirements to the existing title-slot retry; persistent rejection %s, missing value %s", async (persistent, missing) => {
    const rejected = { ...safeWords.words[0]!, title: "The annual case needs a reviewed basis" };
    const repaired = { ...rejected, title: "The annual case counts {value.annual.plan} on its current basis" };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [persistent ? rejected : repaired] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, edition: "investment",
      slots: missing ? { ...slots, "value.annual.plan": stateSlot("value.annual.plan", null) } : slots });
    const retry = JSON.parse(create.mock.calls[1][0].messages[0].content);
    expect(retry.rejectedSlides[0]).toMatchObject({ rejectedRule: "missing_title_slot",
      requiredTitleSlot: "{value.annual.plan}", evidence: { valueAvailable: !missing },
      ruleRequirements: expect.stringContaining("requiredTitleSlot") });
    expect(JSON.stringify(retry)).not.toContain(rejected.title);
    expect(JSON.stringify(create.mock.calls)).not.toContain("$12,000");
    expect(create).toHaveBeenCalledTimes(2);
    expect(mockPreflight.mock.calls[1][0].workflow).toBe("moves:reference-deck:preview:words:repair");
    if (persistent) {
      expect(result).toMatchObject({ status: "unavailable", reason: "slide_rejected", rule: "missing_title_slot", fallbackSlides: [1] });
      expect(result.words[0]?.answer).toContain("Draft words unavailable.");
    } else expect(result).toMatchObject({ status: "ok", fallbackSlides: [], words: [repaired] });
  });

  it("states concrete title requirements in the audited divider retry", async () => {
    const rejected = { ...safeWords.words[0]!, title: "Evidence for discussion",
      notes: "The point: the evidence needs review. How to read: inspect the supporting exhibit." };
    const repaired = { ...rejected, title: "The evidence identifies the decision that needs review" };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [repaired] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, archetypes: ["divider"] });
    expect(result).toEqual({ status: "ok", fallbackSlides: [], words: [repaired] });
    const retry = JSON.parse(create.mock.calls[1][0].messages[0].content);
    expect(retry.rejectedSlides[0]).toMatchObject({ rejectedRule: "title_format",
      titleRequirements: { minimumWords: 5, maximumSentences: 1 }, ruleRequirements: expect.stringContaining("at least five words") });
    expect(JSON.stringify(retry)).not.toContain(rejected.title);
    expect(mockPreflight.mock.calls[1][0].workflow).toBe("moves:reference-deck:preview:words:repair");
  });

  it("repairs an unavailable-value assertion using only read-state controls", async () => {
    const missingSlots = { ...slots, "value.annual.base": stateSlot("value.annual.base", null) };
    const rejected = { ...safeWords.words[0]!, answer: "That measured current-state figure is the basis for the decision." };
    const repaired = { ...safeWords.words[0]!, answer: "Confirm the value basis and its source before drawing a conclusion." };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [repaired] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, slots: missingSlots });
    expect(result).toMatchObject({ status: "ok", words: [repaired], fallbackSlides: [] });
    const retry = JSON.parse(create.mock.calls[1][0].messages[0].content);
    expect(retry.rejectedSlides[0]).toMatchObject({ rejectedRule: "unavailable_value_claim", evidence: { valueAvailable: false } });
    expect(JSON.stringify(create.mock.calls)).not.toContain("$12,000");
  });

  it("keeps a marker and reason when an unavailable-evidence retry still asserts a figure", async () => {
    const rejected = { ...safeWords.words[0]!, answer: "This figure establishes the basis for a decision." };
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, slots: { ...slots, "value.annual.base": stateSlot("value.annual.base", null) } });
    expect(result).toMatchObject({ status: "unavailable", reason: "slide_rejected", rule: "unavailable_value_claim", fallbackSlides: [1] });
    expect(result.words[0]?.answer).toContain("Draft words unavailable.");
  });

  it.each([
    ["users_decisions", "owners.count.accepted", "0", "Each decision has been mapped to the user who holds authority for it.", "unaccepted_owner_claim"],
    ["sources", "sources.count.approved", "0", "Every factual claim traces to an approved public citation.", "unavailable_public_source_claim"],
    ["sources", "sources.count.approved", "0", "No source has been approved, so all figures remain provisional.", "public_source_scope"],
    ["rom_hours", "rom.total.plan", null, "That figure represents the current plan-basis estimate.", "unavailable_estimate_claim"],
    ["big_number_context", "baseline.current", null, "The measured current-state baseline is the basis for this review.", "unavailable_baseline_claim"],
  ] as const)("refuses completed-evidence language for %s", (archetype, key, display, answer, rule) => {
    const entry = { ...safeWords.words[0]!, title: archetype === "rom_hours"
      ? "The delivery estimate is {rom.total.plan} on its current basis"
      : archetype === "big_number_context" ? "The case counts {value.three_year.credited} on its current basis"
        : "Reviewed evidence identifies the next decision for this case", answer };
    const known = { ...slots, "value.three_year.credited": stateSlot("value.three_year.credited", "$12,000"), [key]: stateSlot(key, display) };
    expect(modelWordRule(entry, "investment", known, archetype)).toBe(rule);
  });

  it("keeps active and open counts distinct without exposing their displays in the prompt", () => {
    const counts = { ...slots, "register.count.active": stateSlot("register.count.active", "12"), "register.count.open": stateSlot("register.count.open", "3") };
    const entry = { ...safeWords.words[0]!, answer: "The {register.count.active} open assumptions require review." };
    expect(modelWordRule(entry, "validation", counts, "assumptions")).toBe("active_count_as_open");
    expect(modelWordRule({ ...entry, answer: "Of {register.count.active} active assumptions, {register.count.open} remain open for review." }, "validation", counts, "assumptions")).toBeNull();
  });

  it("requires the open token even when active and open counts have equal displays", () => {
    const counts = { ...slots, "register.count.active": stateSlot("register.count.active", "3"), "register.count.open": stateSlot("register.count.open", "3") };
    const entry = { ...safeWords.words[0]!, answer: "The {register.count.active} open assumptions require review." };
    expect(modelWordRule(entry, "validation", counts, "assumptions")).toBe("active_count_as_open");
    expect(modelWordRule({ ...entry, answer: "The {register.count.open} open assumptions require review." }, "validation", counts, "assumptions")).toBeNull();
  });

  it("sends only coarse evidence flags rather than current count displays", async () => {
    const counts = { ...slots, "register.count.active": stateSlot("register.count.active", "47"), "register.count.open": stateSlot("register.count.open", "19") };
    const entry = { ...safeWords.words[0]!, answer: "Of {register.count.active} active assumptions, {register.count.open} remain open for review." };
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ words: [entry] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    expect(await draftEditionWords({ ...input, slots: counts, archetypes: ["assumptions"] })).toMatchObject({ status: "ok", fallbackSlides: [] });
    const payload = JSON.parse(create.mock.calls[0][0].messages[0].content);
    expect(payload.slides[0].evidence).not.toHaveProperty("activeCount");
    expect(payload.slides[0].evidence).not.toHaveProperty("openCount");
    expect(JSON.stringify(payload)).not.toMatch(/47|19|\$12,000/);
  });

  it("does not promote an available public collection into universal case-fact coverage", () => {
    const known = { ...slots, "sources.count.approved": stateSlot("sources.count.approved", "3") };
    const entry = { ...safeWords.words[0]!, title: "Published sources explain which attributed claims can be checked",
      answer: "Every factual claim traces to an approved public citation." };
    expect(modelWordRule(entry, "investment", known, "sources")).toBe("public_source_scope");
    expect(modelWordRule({ ...entry, answer: "Review the published claims against the citations attributed to them." }, "investment", known, "sources")).toBeNull();
  });

  it("keeps application source-access configuration out of client copy", () => {
    const entry = { ...safeWords.words[0]!, answer: "Public source access is not available in this configuration." };
    expect(modelWordRule(entry, "investment", slots, "sources")).toBe("internal_client_word");
  });

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

  it.each(["releases", "shared_foundation", "rom_hours"] as const)("accepts the governed estimate token for %s while refusing visible internal wording", (archetype) => {
    const entry = {
      title: "The delivery estimate is {rom.total.plan} on its approved basis",
      answer: "Confirm the delivery scope before comparing the estimate with value.",
      notes: "The point: review {rom.total.plan}. How to read: inspect the source line.",
    };
    expect(modelWordRule(entry, "investment", slots, archetype)).toBeNull();
    expect(modelWordRule({ ...entry, answer: "Review the ROM before deciding." }, "investment", slots, archetype)).toBe("internal_client_word");
    expect(modelWordRule({ ...entry, title: entry.title.replace("rom.total.plan", "rom.unapproved.plan") }, "investment", slots, archetype)).toBe("unknown_slot");
    expect(modelWordRule(entry, "validation", slots, archetype)).toBe("edition_slot");
  });

  it("identifies the blocked vocabulary in an audited repair without replaying model prose", async () => {
    const rejected = { ...safeWords.words[0]!, title: "Move from the evidence to the next decision" };
    const repaired = { ...safeWords.words[0]!, title: "The evidence identifies the next decision for review" };
    const create = jest.fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ words: [repaired] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, archetypes: ["contents"] });
    expect(result).toMatchObject({ status: "ok", fallbackSlides: [], words: [repaired] });
    const repair = JSON.parse(create.mock.calls[1][0].messages[0].content);
    expect(repair.rejectedSlides[0]).toMatchObject({ rejectedRule: "internal_client_word", blockedClientTerm: "Move" });
    expect(JSON.stringify(repair)).not.toContain(rejected.title);
    expect(JSON.stringify(repair)).not.toContain("$12,000");
  });

  it("keeps a visible unavailable marker when the vocabulary repair is still rejected", async () => {
    const rejected = { ...safeWords.words[0]!, title: "Move from the evidence to the next decision" };
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ words: [rejected] }) }] });
    mockPreflight.mockResolvedValue({ ok: true, client: { messages: { create } } });
    const result = await draftEditionWords({ ...input, archetypes: ["contents"] });
    expect(result).toMatchObject({ status: "unavailable", reason: "slide_rejected", rule: "internal_client_word", slide: 1, fallbackSlides: [1] });
    expect(result.words[0]?.answer).toContain("Draft words unavailable.");
    expect(create).toHaveBeenCalledTimes(2);
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

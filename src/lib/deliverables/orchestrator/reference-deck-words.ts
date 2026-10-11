import "server-only";

import { policyForTier } from "@/lib/ai/document-generation-policy";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";
import type { ReferenceArchetype, ReferenceEdition } from "./reference-deck-model";
import { promptSlotDefinitions, type ReferenceSlotTable } from "./reference-deck-slots";

export interface EditionWords {
  title: string;
  answer: string;
  notes: string;
}

export type WordsUnavailableReason = "preflight_denied" | "model_error" | "parse_failed" | "slide_rejected";
export type DraftEditionWordsResult =
  | { status: "ok"; words: EditionWords[]; fallbackSlides: [] }
  | { status: "unavailable"; reason: WordsUnavailableReason; rule?: string; slide?: number; words: EditionWords[]; fallbackSlides: number[] };

export type UseCasePromptType =
  | "strategic_transformation" | "workflow_automation" | "platform_modernization"
  | "ai_product_enablement" | "operational_optimization" | "unclassified";
export type PhasePromptStage = "need_validation" | "design_review" | "delivery_review" | "unclassified";

const DESIGN_LENS: Record<UseCasePromptType, string> = {
  strategic_transformation: "Emphasize sponsor decision rights, changed work, and the validation ask.",
  workflow_automation: "Emphasize handoffs, named owner roles, and the before-to-after decision flow.",
  platform_modernization: "Emphasize governed sources, canonical measures, integration and controls.",
  ai_product_enablement: "Emphasize governed context, human review, and the evidence needed before AI use.",
  operational_optimization: "Emphasize baseline, counted value, attribution and measurement ownership.",
  unclassified: "Emphasize the governed evidence, visible gaps and the next decision.",
};

const SHARED_TITLES: Record<ReferenceArchetype, string> = {
  cover: "The evidence defines the next decision for this case",
  one_page: "The annual counted value is {value.annual.base} on its current basis",
  contents: "The review follows the evidence from context to decision",
  divider: "The next decision rests on evidence that can be checked",
  big_number_context: "Credited value is {value.three_year.credited} over three years",
  plain_english_table: "The active assumption count ({register.count.active}) needs review",
  flow_today: "The current handoffs still need an agreed decision owner",
  one_step_value: "The annual counted step is {value.annual.base} on its current basis",
  three_year_value: "Credited value is {value.three_year.credited} over three years",
  assumptions: "The active assumption count ({register.count.active}) needs confirmation",
  sources: "The approved public-source count ({sources.count.approved}) defines the evidence set",
  value_ledger: "Credited value is {value.three_year.credited} when earned",
  users_decisions: "The accepted-owner count ({owners.count.accepted}) shapes the operating decision",
  target_state: "The target architecture connects governed sources to decisions",
  channels: "Each channel needs a named input, owner and control",
  releases: "The delivery estimate is {rom.total.plan} across releases",
  shared_foundation: "The shared delivery estimate is {rom.total.plan} for this case",
  client_needs: "The active assumption count ({register.count.active}) informs the needs review",
  ai_options: "Any AI option depends on governed context and human review",
  next_steps: "The active assumption count ({register.count.active}) sets the next review",
  rom_hours: "The delivery estimate is {rom.total.plan} across the work",
  team: "The accepted-owner count ({owners.count.accepted}) shapes the team decision",
};

const INVESTMENT_TITLES: Partial<Record<ReferenceArchetype, string>> = {
  one_page: "The annual case is {value.annual.plan} on its current basis",
  one_step_value: "The annual value step is {value.annual.plan} on its current basis",
  three_year_value: "The credited case is {value.three_year.credited} over three years",
  value_ledger: "Credited value is {value.three_year.credited} when earned",
  releases: "The delivery estimate is {rom.total.plan} across releases",
  shared_foundation: "The shared delivery estimate is {rom.total.plan} for this case",
  rom_hours: "The delivery estimate is {rom.total.plan} across the work",
};

const INVESTMENT_TITLE_SLOTS: Partial<Record<ReferenceArchetype, string>> = {
  one_page: "value.annual.plan",
  big_number_context: "value.three_year.credited",
  plain_english_table: "register.count.active",
  one_step_value: "value.annual.plan",
  three_year_value: "value.three_year.credited",
  assumptions: "register.count.active",
  value_ledger: "value.three_year.credited",
  users_decisions: "owners.count.accepted",
  releases: "rom.total.plan",
  shared_foundation: "rom.total.plan",
  client_needs: "register.count.active",
  next_steps: "register.count.active",
  rom_hours: "rom.total.plan",
  team: "owners.count.accepted",
  sources: "sources.count.approved",
};

const FALLBACK_ANSWERS: Partial<Record<ReferenceArchetype, string>> = {
  one_page: "Check the counted basis and the visible input gaps before using the case.",
  big_number_context: "The exhibit separates the counted figure from the evidence needed to confirm it.",
  one_step_value: "Use the governed figure and its source before judging the measured step.",
  three_year_value: "Read each year on the stated counting basis, then review the total.",
  assumptions: "Confirm the open rows and their owner roles before relying on the case.",
  rom_hours: "Use only an approved estimate and its source-linked unit hours.",
  sources: "The source list shows approved citations and any missing evidence.",
};

function fallback(archetype: ReferenceArchetype, edition: ReferenceEdition): EditionWords {
  const title = archetype === "cover" && edition === "validation"
    ? "Validate the need; no solution, plan or cost."
    : edition === "investment" ? INVESTMENT_TITLES[archetype] ?? SHARED_TITLES[archetype] : SHARED_TITLES[archetype];
  return {
    title,
    answer: FALLBACK_ANSWERS[archetype] ?? "Review the editable exhibit and its stated source gaps.",
    notes: `The point: ${title}. How to read: inspect the governed exhibit and its source line.`,
  };
}

/** Deterministic, sentence-form words for a failed model call or workbook-only render. */
export function unavailableEditionWords(edition: ReferenceEdition, archetypes: ReferenceArchetype[]): EditionWords[] {
  return archetypes.map((kind) => fallback(kind, edition));
}

function parseWords(raw: string, count: number): EditionWords[] | null {
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return null; }
  if (typeof body !== "object" || body === null || !Array.isArray((body as Record<string, unknown>).words)) return null;
  const rows = (body as { words: unknown[] }).words;
  if (rows.length !== count) return null;
  const words: EditionWords[] = [];
  for (const item of rows) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (![row.title, row.answer, row.notes].every((value) => typeof value === "string" && value.trim().length > 0)) return null;
    words.push({ title: row.title as string, answer: row.answer as string, notes: row.notes as string });
  }
  return words;
}

const SLOT_TOKEN = /\{([^{}]+)\}/g;
const LITERAL_FIGURE = /\d|[$€£¥₹]|\b(?:percent|percentage|million|billion|thousand|hundred|dollars?|euros?|pounds?)\b/i;
const VALIDATION_FORBIDDEN = /\b(?:cost|rom|roi|investment|solution|plan|roadmap|release)\b/i;

export function modelWordRule(entry: EditionWords, edition: ReferenceEdition, slots: ReferenceSlotTable, archetype?: ReferenceArchetype): string | null {
  const prose = `${entry.title} ${entry.answer} ${entry.notes}`;
  const tokens = [...prose.matchAll(SLOT_TOKEN)];
  for (const match of tokens) {
    const slot = slots[match[1]!];
    if (!slot) return "unknown_slot";
    if (!slot.editions.includes(edition)) return "edition_slot";
  }
  if ((archetype === "cover" || archetype === "divider") && tokens.length) return "slot_without_source_line";
  const requiredTitleSlot = edition === "investment" && archetype ? INVESTMENT_TITLE_SLOTS[archetype] : undefined;
  if (requiredTitleSlot && !entry.title.includes(`{${requiredTitleSlot}}`)) return "missing_title_slot";
  const literal = prose.replace(SLOT_TOKEN, "");
  if (/[{}]/.test(literal)) return "malformed_slot";
  if (LITERAL_FIGURE.test(literal)) return "literal_figure";
  if (!entry.notes.startsWith("The point:") || !entry.notes.includes("How to read:")) return "notes_format";
  if (entry.title.trim().split(/\s+/).length < 5 || /[.!?]\s+\S/.test(entry.title)) return "title_format";
  const editionText = archetype === "cover" ? `${entry.answer} ${entry.notes}` : literal;
  if (edition === "validation" && VALIDATION_FORBIDDEN.test(editionText)) return "edition_language";
  return null;
}

/**
 * Only use-case, read-state and slot-name controls enter this prompt. Move,
 * register, capture, ROM and source prose stay out until an agent-ready context
 * bundle has passed retrieval and cite-render verification.
 */
export async function draftEditionWords(input: {
  tenantId: string;
  userId: string;
  edition: ReferenceEdition;
  archetypes: ReferenceArchetype[];
  useCaseType: UseCasePromptType;
  phaseStage: PhasePromptStage;
  available: { valueCase: boolean; register: boolean; rom: boolean; publicSources: boolean; owners: boolean };
  slots: ReferenceSlotTable;
}): Promise<DraftEditionWordsResult> {
  const unavailable = unavailableEditionWords(input.edition, input.archetypes);
  const allSlides = input.archetypes.map((_, index) => index + 1);
  const failure = (reason: WordsUnavailableReason): DraftEditionWordsResult =>
    ({ status: "unavailable", reason, words: unavailable, fallbackSlides: allSlides });
  const system = "Write clear slide language for an editable business-case deck as a JSON object with a words array. Each entry has exactly title, answer, notes. Use the edition, use-case lens, phase stage and read-state controls. Write a full-sentence action title for each slide. Every requiredTitleSlot must appear verbatim in that slide's title. You may use only the named slot tokens supplied to express figures; never write a digit, currency symbol or magnitude word outside a slot. Do not invent a client fact. Describe a specific Move fact only if it appears in an approved model-ready context bundle; none is supplied in this request. Do not claim an input is ready from its slot name: unavailable slots become visible gaps after generation. Notes begin 'The point:' and contain 'How to read:'. Validation slides contain no cost, ROM, ROI, investment, solution, plan, roadmap or release material.";
  const user = JSON.stringify({
    profile: { edition: input.edition, useCaseLens: DESIGN_LENS[input.useCaseType] ?? DESIGN_LENS.unclassified, phaseStage: input.phaseStage, available: input.available },
    slides: input.archetypes.map((archetype) => ({ archetype, ...(input.edition === "investment" && INVESTMENT_TITLE_SLOTS[archetype]
      ? { requiredTitleSlot: INVESTMENT_TITLE_SLOTS[archetype] } : {}) })),
    slots: promptSlotDefinitions(input.slots, input.edition),
  });
  try {
    const model = policyForTier("tier2_working_draft").model;
    const preflight = await preflightAnthropicDirectClient({
      tenantId: input.tenantId, userId: input.userId,
      workflow: "moves:reference-deck:preview:words", workload: "moves_reference_deck",
      prompt: `${system}\n${user}`, model, dataClass: "internal",
      artifactType: "reference_deck_preview",
      metadata: { edition: input.edition, slideCount: input.archetypes.length, persist: false },
    });
    if (!preflight.ok) return failure("preflight_denied");
    const response = await preflight.client.messages.create({
      model, max_tokens: 6000, temperature: 0, system,
      output_config: { format: { type: "json_schema", schema: {
        type: "object", properties: { words: { type: "array", items: {
          type: "object", properties: { title: { type: "string" }, answer: { type: "string" }, notes: { type: "string" } },
          required: ["title", "answer", "notes"], additionalProperties: false,
        } } }, required: ["words"], additionalProperties: false,
      } } },
      messages: [{ role: "user", content: user }],
    });
    const raw = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
    const parsed = parseWords(raw, input.archetypes.length);
    if (!parsed) return failure("parse_failed");
    const fallbackSlides: number[] = [];
    let firstRule: string | undefined;
    const words = parsed.map((entry, index) => {
      const rule = modelWordRule(entry, input.edition, input.slots, input.archetypes[index]);
      if (!rule) return entry;
      fallbackSlides.push(index + 1);
      firstRule ??= rule;
      return unavailable[index]!;
    });
    return fallbackSlides.length
      ? { status: "unavailable", reason: "slide_rejected", rule: firstRule, slide: fallbackSlides[0], words, fallbackSlides }
      : { status: "ok", words, fallbackSlides: [] };
  } catch {
    return failure("model_error");
  }
}

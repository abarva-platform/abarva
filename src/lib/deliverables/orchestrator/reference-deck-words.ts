import "server-only";

import { policyForTier } from "@/lib/ai/document-generation-policy";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";
import { answerIsCountDump, clientCopyIssue, referenceNarrativeIssue, type ReferenceArchetype, type ReferenceEdition } from "./reference-deck-model";
import { buildReferenceNarrativeEvidence, promptSlotDefinitions, type ReferenceSlotTable } from "./reference-deck-slots";

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
  cover: "The case is ready for a focused discussion",
  one_page: "The annual counted value is {value.annual.base} on its current basis",
  contents: "The review follows the evidence from context to decision",
  divider: "The next decision rests on evidence that can be checked",
  big_number_context: "Credited value is {value.three_year.credited} over three years",
  plain_english_table: "The current position needs your team's confirmation",
  flow_today: "The current handoffs still need an agreed decision owner",
  one_step_value: "The annual counted step is {value.annual.base} on its current basis",
  three_year_value: "Credited value is {value.three_year.credited} over three years",
  assumptions: "The working assumptions decide what can be claimed",
  sources: "Published evidence shows what can be checked",
  value_ledger: "Credited value is {value.three_year.credited} when earned",
  users_decisions: "Decision rights need owners the team can name",
  target_state: "The proposed design connects evidence to decisions",
  channels: "Each channel needs a named input, owner and control",
  releases: "The delivery estimate is {rom.total.plan} across releases",
  shared_foundation: "The shared delivery estimate is {rom.total.plan} for this case",
  client_needs: "The team needs access and a clear measure",
  ai_options: "Any AI option depends on approved evidence and human review",
  next_steps: "The next decision depends on the open assumptions",
  rom_hours: "The delivery estimate is {rom.total.plan} across the work",
  team: "The right owners must agree before delivery begins",
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
  one_step_value: "value.annual.plan",
  three_year_value: "value.three_year.credited",
  value_ledger: "value.three_year.credited",
  releases: "rom.total.plan",
  shared_foundation: "rom.total.plan",
  rom_hours: "rom.total.plan",
};

const FALLBACK_ANSWERS: Partial<Record<ReferenceArchetype, string>> = {
  one_page: "The case can advance when its value basis and open questions are agreed.",
  big_number_context: "Confirm the value basis before drawing a conclusion.",
  one_step_value: "The annual value matters only if the counted step is agreed.",
  three_year_value: "The timing of value changes what the case can support.",
  assumptions: "The team should resolve the assumptions that could change the decision.",
  rom_hours: "Confirm the delivery basis and working hours before using the estimate.",
  sources: "Confirm the public sources before using them to support the case.",
};

function fallback(archetype: ReferenceArchetype, edition: ReferenceEdition): EditionWords {
  const title = edition === "investment" ? INVESTMENT_TITLES[archetype] ?? SHARED_TITLES[archetype] : SHARED_TITLES[archetype];
  return {
    title,
    answer: `Draft words unavailable. ${FALLBACK_ANSWERS[archetype] ?? "The team should use this evidence to decide what to confirm next."}`,
    notes: `The point: ${title}. How to read: inspect the exhibit and its source line.`,
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

/** Normalize only known, edition-allowed token wrappers; unknown braces still fail validation. */
function normalizeKnownSlotTokens(entry: EditionWords, edition: ReferenceEdition, slots: ReferenceSlotTable): EditionWords {
  const normalize = (prose: string): string => prose.replace(
    /\{\{\s*([a-z][a-z0-9_.]*)\s*\}\}|\{\s*([a-z][a-z0-9_.]*)\s*\}/g,
    (original, doubleKey: string | undefined, singleKey: string | undefined) => {
      const key = doubleKey ?? singleKey!;
      return slots[key]?.editions.includes(edition) ? `{${key}}` : original;
    },
  );
  return { title: normalize(entry.title), answer: normalize(entry.answer), notes: normalize(entry.notes) };
}

const WORDS_OUTPUT_CONFIG = { format: { type: "json_schema" as const, schema: {
  type: "object", properties: { words: { type: "array", items: {
    type: "object", properties: { title: { type: "string" }, answer: { type: "string" }, notes: { type: "string" } },
    required: ["title", "answer", "notes"], additionalProperties: false,
  } } }, required: ["words"], additionalProperties: false,
} } };
const PARSE_RECOVERY_CHUNK_SIZE = 6;
const INITIAL_BATCH_THRESHOLD = 12;
const INITIAL_BATCH_SIZE = 8;
const INITIAL_CALL_OPTIONS = { timeout: 65_000, maxRetries: 0 };
const RECOVERY_CALL_OPTIONS = { timeout: 30_000, maxRetries: 0 };
const REPAIR_CALL_OPTIONS = { timeout: 15_000, maxRetries: 0 };

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
  if (Object.keys(slots).some((key) => literal.includes(key))) return "malformed_slot";
  if (/[{}]/.test(literal)) return "malformed_slot";
  if (LITERAL_FIGURE.test(literal)) return "literal_figure";
  if (!entry.notes.startsWith("The point:") || !entry.notes.includes("How to read:")) return "notes_format";
  if (entry.title.trim().split(/\s+/).length < 5 || /[.!?]\s+\S/.test(entry.title)) return "title_format";
  // Validated tokens are binding metadata, not words shown to the client.
  if (clientCopyIssue(`${entry.title} ${entry.answer}`.replace(SLOT_TOKEN, ""))) return "internal_client_word";
  if (answerIsCountDump(entry.answer)) return "count_dump_answer";
  const editionText = archetype === "cover" ? `${entry.answer} ${entry.notes}` : literal;
  if (edition === "validation" && VALIDATION_FORBIDDEN.test(editionText)) return "edition_language";
  const evidence = buildReferenceNarrativeEvidence(slots, archetype ?? "contents", edition);
  // Validate bindings before substitution; numeric displays stay server-side.
  if (evidence.activeCount) evidence.activeCount = "{register.count.active}";
  if (evidence.openCount) evidence.openCount = "{register.count.open}";
  const narrativeIssue = referenceNarrativeIssue(`${entry.title}. ${entry.answer}`, evidence);
  if (narrativeIssue) return narrativeIssue;
  return null;
}

const TITLE_REQUIREMENTS = { minimumWords: 5, maximumSentences: 1 } as const;
const RULE_REQUIREMENTS: Record<string, string> = {
  title_format: "Write a title with at least five words and only one sentence. Do not return a short section label.",
  active_count_as_open: "The active assumption count includes open, confirmed and corrected items. Only the open-count token may describe open items.",
  unavailable_value_claim: "No counted value is available for this exhibit. State the evidence still needed; do not refer to an existing figure or total.",
  unavailable_estimate_claim: "No approved estimate is available. State the approval still needed; do not refer to an existing estimate figure.",
  unavailable_baseline_claim: "No source-verified measured baseline is available. Describe confirmation as a prerequisite, not an accomplished fact.",
  unaccepted_owner_claim: "Decision owners have not been accepted. Describe agreement as a prerequisite; do not say decisions are already mapped or assigned.",
  unavailable_public_source_claim: "Approved public citations are unavailable or empty. Do not assert that every claim is already supported by approved public evidence.",
  public_source_scope: "The public-citation collection does not establish the source coverage of every case fact or internal working figure. Qualify the public scope; do not infer that all internal evidence is either approved by, or absent from, this collection.",
};

function promptEvidence(slots: ReferenceSlotTable, archetype: ReferenceArchetype, edition: ReferenceEdition) {
  return Object.fromEntries(Object.entries(buildReferenceNarrativeEvidence(slots, archetype, edition))
    .filter(([, value]) => typeof value === "boolean"));
}

/**
 * Only use-case, read-state and slot-name controls enter this prompt. Move,
 * register, capture, ROM and source prose stay out until an agent-ready context
 * bundle has passed retrieval and cite-render verification.
 */
export async function draftEditionWords(input: {
  tenantId: string;
  userId: string;
  requestId?: string;
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
  const system = "Write client-ready slide language as JSON with a words array. Each entry has exactly title, answer, notes. Use the edition, use-case lens, phase stage and read-state controls. Every non-cover title, including a section divider, has at least five words and exactly one sentence. Keep the title and answer to one sentence each; use two short sentences in notes. The answer must interpret what the evidence means and the next decision, never list counts. Never prefix client text with a layout or archetype name such as big number context, plain English table, flow today or one step value. Do not put internal workflow words such as slot, readback, capture, register, governed, Move, flag, preview or ROM in the title or answer; consultant guidance belongs only in notes. Copy every requiredTitleSlot exactly into its title. Figure slots use one pair of braces, for example {value.annual.base}; never use double braces, a bare slot name, or a value. Use only supplied, edition-allowed slot tokens for figures; never write a digit, currency symbol or magnitude word outside a slot. Do not invent a client fact. Specific case facts require an approved model-ready context bundle, which this request does not supply. Use each slide evidence flag literally: false means the input is not confirmed. An unavailable input remains a visible gap after generation; do not write this figure, an approved estimate, mapped decision owners or verified citations as completed facts when that basis is absent. Active assumptions include open, confirmed and corrected items; only register.count.open describes open items. Notes begin 'The point:' and contain 'How to read:'. The server sets the cover title and promise from the use-case name and edition; do not put an edition rule on the cover. In validation answers, notes and non-cover titles, avoid cost, ROM, ROI, investment, solution, plan, roadmap and release even in a negated phrase.";
  const profile = { edition: input.edition, useCaseLens: DESIGN_LENS[input.useCaseType] ?? DESIGN_LENS.unclassified, phaseStage: input.phaseStage, available: input.available };
  const promptSlides = input.archetypes.map((archetype) => ({ archetype,
    titleRequirements: TITLE_REQUIREMENTS, evidence: promptEvidence(input.slots, archetype, input.edition),
    ...(archetype === "cover"
      ? { coverTitleAndPromiseProvidedByServer: true } : {}), ...(input.edition === "investment" && INVESTMENT_TITLE_SLOTS[archetype]
      ? { requiredTitleSlot: `{${INVESTMENT_TITLE_SLOTS[archetype]}}` } : {}) }));
  const slotDefinitions = promptSlotDefinitions(input.slots, input.edition);
  const user = JSON.stringify({ profile, slides: promptSlides, slots: slotDefinitions });
  try {
    const model = policyForTier("tier2_working_draft").model;
    const batched = input.archetypes.length > INITIAL_BATCH_THRESHOLD;
    const initialChunks = batched
      ? Array.from({ length: Math.ceil(promptSlides.length / INITIAL_BATCH_SIZE) }, (_, chunk) => {
        const start = chunk * INITIAL_BATCH_SIZE;
        return { start, slides: promptSlides.slice(start, start + INITIAL_BATCH_SIZE) };
      })
      : [{ start: 0, slides: promptSlides }];
    const initialResults = await Promise.allSettled(initialChunks.map(async ({ start, slides }) => {
      const batchUser = batched ? JSON.stringify({ profile, slides, slots: slotDefinitions }) : user;
      const preflight = await preflightAnthropicDirectClient({
        tenantId: input.tenantId, userId: input.userId,
        workflow: batched ? "moves:reference-deck:preview:words:batch" : "moves:reference-deck:preview:words",
        workload: "moves_reference_deck", prompt: `${system}\n${batchUser}`, model, dataClass: "internal",
        artifactType: "reference_deck_preview",
        metadata: { edition: input.edition, slideStart: start + 1, slideCount: slides.length, persist: false },
      });
      if (!preflight.ok) return { start, slides, denied: true, parsed: null };
      const response = await preflight.client.messages.create({
        model, max_tokens: batched ? 4500 : 6000, temperature: 0, system,
        output_config: WORDS_OUTPUT_CONFIG,
        messages: [{ role: "user", content: batchUser }],
      }, INITIAL_CALL_OPTIONS);
      const raw = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
      const parsed = parseWords(raw, slides.length);
      if (!parsed) {
        let receivedSlides: number | null = null;
        try {
          const body = JSON.parse(raw) as { words?: unknown };
          if (Array.isArray(body?.words)) receivedSlides = body.words.length;
        } catch { /* Shape diagnostics only; never log model prose. */ }
        console.warn("[reference-deck-words-parse]", {
          requestId: input.requestId ?? null, edition: input.edition,
          expectedSlides: slides.length, receivedSlides,
          stopReason: response.stop_reason ?? null, textLength: raw.length,
        });
      }
      return { start, slides, denied: false, parsed };
    }));
    if (initialResults.every((result) => result.status === "rejected")) return failure("model_error");
    const modelFailedSlides = new Set<number>();
    initialResults.forEach((result, index) => {
      if (result.status !== "rejected") return;
      const batch = initialChunks[index]!;
      batch.slides.forEach((_, slideIndex) => modelFailedSlides.add(batch.start + slideIndex + 1));
      const error = result.reason;
      console.warn("[reference-deck-words-call]", {
        requestId: input.requestId ?? null, edition: input.edition, stage: "initial",
        slideStart: batch.start + 1, slideCount: batch.slides.length,
        errorName: error instanceof Error ? error.name : "unknown",
        status: typeof error === "object" && error !== null && "status" in error
          && typeof error.status === "number" ? error.status : null,
      });
    });
    const initial = initialResults.map((result, index) => result.status === "fulfilled" ? result.value
      : { ...initialChunks[index]!, denied: false, parsed: null });
    if (!batched && initial[0]?.denied) return failure("preflight_denied");
    const deniedSlides = new Set(initial.flatMap((batch) => batch.denied
      ? batch.slides.map((_, index) => batch.start + index + 1) : []));
    const candidates: Array<EditionWords | null> = input.archetypes.map(() => null);
    initial.forEach(({ start, parsed }) => parsed?.forEach((entry, index) => { candidates[start + index] = entry; }));
    if (candidates.some((entry) => entry === null)) {
      const chunks = batched ? initial.filter((batch) => !batch.parsed && !batch.denied).flatMap(({ start, slides }) =>
        Array.from({ length: Math.ceil(slides.length / PARSE_RECOVERY_CHUNK_SIZE) }, (_, chunk) => ({
          start: start + chunk * PARSE_RECOVERY_CHUNK_SIZE,
          slides: slides.slice(chunk * PARSE_RECOVERY_CHUNK_SIZE, (chunk + 1) * PARSE_RECOVERY_CHUNK_SIZE),
        })))
        : Array.from({ length: Math.ceil(input.archetypes.length / PARSE_RECOVERY_CHUNK_SIZE) }, (_, chunk) => {
        const start = chunk * PARSE_RECOVERY_CHUNK_SIZE;
        return { start, slides: promptSlides.slice(start, start + PARSE_RECOVERY_CHUNK_SIZE) };
      });
      const recovered = await Promise.allSettled(chunks.map(async ({ start, slides }) => {
        const recoverySystem = `${system} This is a short, audited parse-recovery batch. Return exactly one words entry per supplied slide, in the same order.`;
        const recoveryUser = JSON.stringify({ profile, slides, slots: slotDefinitions });
        const recoveryPreflight = await preflightAnthropicDirectClient({
          tenantId: input.tenantId, userId: input.userId,
          workflow: "moves:reference-deck:preview:words:parse-recovery", workload: "moves_reference_deck",
          prompt: `${recoverySystem}\n${recoveryUser}`, model, dataClass: "internal",
          artifactType: "reference_deck_preview",
          metadata: { edition: input.edition, slideStart: start + 1, slideCount: slides.length, persist: false, parseRecovery: true },
        });
        if (!recoveryPreflight.ok) return null;
        const recoveryResponse = await recoveryPreflight.client.messages.create({
          model, max_tokens: 2400, temperature: 0, system: recoverySystem,
          output_config: WORDS_OUTPUT_CONFIG,
          messages: [{ role: "user", content: recoveryUser }],
        }, RECOVERY_CALL_OPTIONS);
        const recoveryRaw = recoveryResponse.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
        return parseWords(recoveryRaw, slides.length);
      }));
      recovered.forEach((result, chunkIndex) => {
        if (result.status !== "fulfilled" || !result.value) return;
        result.value.forEach((entry, rowIndex) => {
          candidates[chunks[chunkIndex]!.start + rowIndex] = entry;
        });
      });
    }
    const parseFailedSlides = candidates.flatMap((entry, index) => entry ? [] : [index + 1]);
    const words = candidates.map((entry, index) => entry
      ? normalizeKnownSlotTokens(entry, input.edition, input.slots) : unavailable[index]!);
    // The cover title and promise come from the governed Move and edition, not model prose.
    input.archetypes.forEach((archetype, index) => {
      if (archetype === "cover") {
        words[index] = unavailable[index]!;
        const failedAt = parseFailedSlides.indexOf(index + 1);
        if (failedAt >= 0) parseFailedSlides.splice(failedAt, 1);
      }
    });
    const ruleAt = (index: number) => input.archetypes[index] === "cover"
      ? null : parseFailedSlides.includes(index + 1)
        ? null : modelWordRule(words[index]!, input.edition, input.slots, input.archetypes[index]);
    const rejected = words.flatMap((_, index) => {
      const rule = ruleAt(index);
      const blockedClientTerm = rule === "internal_client_word"
        ? clientCopyIssue(`${words[index]!.title} ${words[index]!.answer}`.replace(SLOT_TOKEN, "")) : null;
      return rule ? [{ index, rule, ...(blockedClientTerm ? { blockedClientTerm } : {}) }] : [];
    });
    if (rejected.length) {
      const repairSystem = `${system} This is a targeted retry. Return one words entry per rejected slide, in the same order. Correct each stated rule; never invent a fact or a figure. When a blockedClientTerm is supplied, remove that vocabulary and its forms from the title and answer. Use advance instead of move, confirm instead of capture, and identify instead of flag. Keep permitted figure tokens exactly as supplied.`;
      const repairChunks = Array.from({ length: Math.ceil(rejected.length / PARSE_RECOVERY_CHUNK_SIZE) }, (_, chunk) =>
        rejected.slice(chunk * PARSE_RECOVERY_CHUNK_SIZE, (chunk + 1) * PARSE_RECOVERY_CHUNK_SIZE));
      const repairs = await Promise.allSettled(repairChunks.map(async (chunk) => {
        const repairUser = JSON.stringify({
          profile,
          rejectedSlides: chunk.map(({ index, rule, ...detail }) => ({
            archetype: input.archetypes[index], rejectedRule: rule,
            ruleRequirements: RULE_REQUIREMENTS[rule], titleRequirements: TITLE_REQUIREMENTS,
            evidence: promptEvidence(input.slots, input.archetypes[index]!, input.edition),
            ...detail,
            ...(input.edition === "investment" && INVESTMENT_TITLE_SLOTS[input.archetypes[index]!]
              ? { requiredTitleSlot: `{${INVESTMENT_TITLE_SLOTS[input.archetypes[index]!]}}` } : {}),
          })),
          slots: slotDefinitions,
        });
        const repairPreflight = await preflightAnthropicDirectClient({
          tenantId: input.tenantId, userId: input.userId,
          workflow: "moves:reference-deck:preview:words:repair", workload: "moves_reference_deck",
          prompt: `${repairSystem}\n${repairUser}`, model, dataClass: "internal",
          artifactType: "reference_deck_preview",
          metadata: { edition: input.edition, slideCount: chunk.length, persist: false, repair: true },
        });
        if (repairPreflight.ok) {
          const repairResponse = await repairPreflight.client.messages.create({
            model, max_tokens: 2400, temperature: 0, system: repairSystem,
            output_config: WORDS_OUTPUT_CONFIG,
            messages: [{ role: "user", content: repairUser }],
          }, REPAIR_CALL_OPTIONS);
          const repairRaw = repairResponse.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
          return parseWords(repairRaw, chunk.length);
        }
        return null;
      }));
      repairs.forEach((result, chunkIndex) => {
        if (result.status !== "fulfilled" || !result.value) return;
        result.value.forEach((entry, repairIndex) => {
          const index = repairChunks[chunkIndex]![repairIndex]!.index;
          const candidate = normalizeKnownSlotTokens(entry, input.edition, input.slots);
          if (!modelWordRule(candidate, input.edition, input.slots, input.archetypes[index])) words[index] = candidate;
        });
      });
    }
    const fallbackSlides: number[] = [...parseFailedSlides];
    let firstRule: string | undefined;
    words.forEach((_, index) => {
      const rule = ruleAt(index);
      if (!rule) return;
      fallbackSlides.push(index + 1);
      firstRule ??= rule;
      words[index] = unavailable[index]!;
    });
    fallbackSlides.sort((a, b) => a - b);
    const firstParseFailure = parseFailedSlides[0];
    const firstSlide = fallbackSlides[0];
    const reason = deniedSlides.has(firstSlide) ? "preflight_denied"
      : modelFailedSlides.has(firstSlide) ? "model_error"
        : firstParseFailure === firstSlide ? "parse_failed" : "slide_rejected";
    return fallbackSlides.length
      ? { status: "unavailable", reason,
        ...(reason === "slide_rejected" ? { rule: firstRule } : {}), slide: firstSlide, words, fallbackSlides }
      : { status: "ok", words, fallbackSlides: [] };
  } catch {
    return failure("model_error");
  }
}

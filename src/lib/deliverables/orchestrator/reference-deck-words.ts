import "server-only";

import { policyForTier } from "@/lib/ai/document-generation-policy";
import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";
import type { ReferenceArchetype, ReferenceEdition } from "./reference-deck-model";

export interface EditionWords {
  title: string;
  answer: string;
  notes: string;
}

export type UseCasePromptType =
  | "strategic_transformation" | "workflow_automation" | "platform_modernization"
  | "ai_product_enablement" | "operational_optimization" | "unclassified";

const DESIGN_LENS: Record<UseCasePromptType, string> = {
  strategic_transformation: "Emphasize sponsor decision rights, changed work, and the validation ask.",
  workflow_automation: "Emphasize handoffs, named owners, and the before-to-after decision flow.",
  platform_modernization: "Emphasize governed sources, canonical measures, integration and controls.",
  ai_product_enablement: "Emphasize governed context, human review, and the evidence needed before AI use.",
  operational_optimization: "Emphasize baseline, counted value, attribution and measurement ownership.",
  unclassified: "Emphasize the governed evidence, visible gaps and the next decision.",
};

export const DRAFT_WORDS_UNAVAILABLE = "draft words unavailable";
const fallback = (archetype: ReferenceArchetype, edition: ReferenceEdition): EditionWords => ({
  title: archetype === "cover" && edition === "validation"
    ? `Validate the need; no solution, plan or cost — ${DRAFT_WORDS_UNAVAILABLE}.`
    : DRAFT_WORDS_UNAVAILABLE,
  answer: DRAFT_WORDS_UNAVAILABLE,
  notes: `The point: ${DRAFT_WORDS_UNAVAILABLE}. How to read: follow the governed exhibit and its source line.`,
});

export function unavailableEditionWords(edition: ReferenceEdition, archetypes: ReferenceArchetype[]): EditionWords[] {
  return archetypes.map((kind) => fallback(kind, edition));
}

function parseWords(raw: string, count: number): EditionWords[] | null {
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(body) || body.length !== count) return null;
  const words: EditionWords[] = [];
  for (const item of body) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (![row.title, row.answer, row.notes].every((value) => typeof value === "string" && value.trim().length > 0)) return null;
    words.push({ title: row.title as string, answer: row.answer as string, notes: row.notes as string });
  }
  return words;
}

/**
 * Claude writes language only. No raw Move, register, capture, ROM or source
 * record enters this prompt: those objects have no agent-ready context bundle
 * in this read path. The figures and exhibit content are assembled separately.
 */
export async function draftEditionWords(input: {
  tenantId: string;
  userId: string;
  edition: ReferenceEdition;
  archetypes: ReferenceArchetype[];
  useCaseType: UseCasePromptType;
  available: { valueCase: boolean; register: boolean; rom: boolean; publicSources: boolean; owners: boolean };
}): Promise<EditionWords[]> {
  const unavailable = unavailableEditionWords(input.edition, input.archetypes);
  const bundle = buildValidatedAgentContextBundle([], { requireAgentReady: true });
  if (bundle.usable.length !== 0) return unavailable;
  const system = "Write slide language for an editable business-case deck. Return only a JSON array. Each object has exactly title, answer, notes. Use the supplied use-case lens and read-availability map to emphasize the right kind of review. Do not state or imply any client fact, figure, date, quantity, source, cost, solution, owner, or outcome. Do not use digits. Each title is one sentence of at least five words. Each notes value begins 'The point:' and contains 'How to read:'. The language must remain neutral because governed exhibits are added separately.";
  const user = JSON.stringify({ edition: input.edition, archetypes: input.archetypes, useCaseLens: DESIGN_LENS[input.useCaseType], available: input.available });
  try {
    const model = policyForTier("tier2_working_draft").model;
    const preflight = await preflightAnthropicDirectClient({
      tenantId: input.tenantId,
      userId: input.userId,
      workflow: "moves:reference-deck:preview:words",
      prompt: `${system}\n${user}`,
      model,
      dataClass: "internal",
      artifactType: "reference_deck_preview",
      metadata: { edition: input.edition, slideCount: input.archetypes.length, persist: false },
    });
    if (!preflight.ok) return unavailable;
    const response = await preflight.client.messages.create({
      model, max_tokens: 6000, temperature: 0, system,
      messages: [{ role: "user", content: user }],
    });
    const raw = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
    const parsed = parseWords(raw, input.archetypes.length);
    if (!parsed) return unavailable;
    return parsed.map((entry, index) => {
      const prose = `${entry.title} ${entry.answer} ${entry.notes}`;
      if (/\d|\$|\b(?:percent|million|billion|thousand)\b/i.test(prose) ||
        !entry.notes.startsWith("The point:") || !entry.notes.includes("How to read:") ||
        (input.edition === "validation" && /\b(?:cost|rom|roi|investment|solution|plan|roadmap|release)\b/i.test(prose)))
        return unavailable[index]!;
      return entry;
    });
  } catch {
    return unavailable;
  }
}

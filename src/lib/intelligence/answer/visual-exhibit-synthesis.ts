import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type { StructuredExhibits } from "@/lib/intelligence/answer/structured-exhibits";

const VISUAL_EXHIBIT_MODEL = "claude-haiku-4-5-20251001";

export interface VisualExhibitSynthesisInput {
  query: string;
  routing: RoutingDecision;
  prose: string;
  sources: AskSource[];
  tenantId: string | null;
  userId: string | null;
}

function sourceLine(source: AskSource, index: number): string {
  const label = source.name || source.id || `Source ${index + 1}`;
  const detail = (source.detail ?? "").replace(/\s+/g, " ").trim();
  return `S${index + 1} · ${source.type} · ${label}: ${detail}`.slice(0, 900);
}

export function missingRequestedVisual(
  routing: RoutingDecision,
  exhibits: StructuredExhibits,
): boolean {
  if (routing.outputShape === "chart") return exhibits.charts.length === 0;
  if (routing.outputShape === "graph") return exhibits.graphs.length === 0;
  return false;
}

export function extractMarkdownTableCandidate(text: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index];
    const separator = lines[index + 1];
    if (!header?.includes("|") || !separator?.includes("|")) continue;
    if (!/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(separator)) {
      continue;
    }
    const table = [header, separator];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor]?.includes("|")) {
      table.push(lines[cursor] ?? "");
      cursor += 1;
    }
    if (table.length >= 4) return table.join("\n");
  }
  return null;
}

export async function synthesizeVisualExhibitTable(
  input: VisualExhibitSynthesisInput,
): Promise<string | null> {
  if (input.routing.outputShape !== "chart" && input.routing.outputShape !== "graph") {
    return null;
  }
  if (input.sources.length === 0 || !input.tenantId) return null;

  const sources = input.sources.slice(0, 8).map(sourceLine).join("\n");
  const target =
    input.routing.outputShape === "graph"
      ? 'a relationship table with columns "From | Relationship | To | Evidence"'
      : 'a chart data table with columns like "Label | Value | Evidence"';
  const system = [
    "You create typed visual exhibit data for AbarVa Ava.",
    "Return ONLY one GitHub-flavored Markdown table. No prose, no bullets, no code fences.",
    `The table must be ${target}.`,
    "Use only values and relationships supported by the provided sources or explicitly stated in the answer.",
    "Do not invent numbers, vendors, systems, dates, owners, relationships, or totals.",
    "If there are fewer than two comparable chart rows or fewer than two connected graph nodes, return an Evidence Required table instead.",
  ].join("\n");
  const prompt = [
    `USER QUESTION:\n${input.query}`,
    `REQUESTED SHAPE:\n${input.routing.outputShape}`,
    `SOURCES:\n${sources}`,
    `ANSWER DRAFT:\n${input.prose.slice(0, 2400)}`,
  ].join("\n\n");

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: input.tenantId,
      userId: input.userId ?? undefined,
      workflow: "intelligence-ask-visual-exhibit-synthesis",
      model: VISUAL_EXHIBIT_MODEL,
      prompt: [system, prompt].join("\n\n"),
      dataClass: "confidential",
      metadata: { outputShape: input.routing.outputShape },
    });
    const message = await client.messages.create({
      model: VISUAL_EXHIBIT_MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n");
    return extractMarkdownTableCandidate(text);
  } catch (err) {
    console.warn("[ask.visual-exhibit-synthesis]", err);
    return null;
  }
}

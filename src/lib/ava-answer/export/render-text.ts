import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

export interface AvaExportNarrativeBlock {
  kind: "heading" | "bullet" | "paragraph";
  text: string;
  label?: string;
}

export function avaExportNarrativeBlocks(
  answer: Pick<AvaAnswerPacket, "directAnswer" | "prose">,
): AvaExportNarrativeBlock[] {
  const direct = cleanAvaExportText(answer.directAnswer);
  const detail = cleanAvaExportText(answer.prose ?? "");
  const parts = detail
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const paragraphs = parts.includes(direct)
    ? parts
    : [direct, ...parts].filter(Boolean);
  return paragraphs.map((paragraph) => {
    const bullet = /^[-*]\s+/.test(paragraph);
    const text = paragraph
      .replace(/^[-*]\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/^\*([^*]*)\*$/, "$1");
    if (/^(?:Bottom line|Key points)$/.test(text))
      return { kind: "heading", text };
    const colon = text.indexOf(":");
    return {
      kind: bullet ? "bullet" : "paragraph",
      text,
      ...(colon > 0 && colon < 60 ? { label: text.slice(0, colon + 1) } : {}),
    };
  });
}

const HTML_ENTITY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;|&apos;/g, "'"],
  [/&nbsp;/g, " "],
];

function decodeBasicEntities(value: string): string {
  let text = value;
  for (const [pattern, replacement] of HTML_ENTITY_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function isRawTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const pipeCount = (trimmed.match(/\|/g) ?? []).length;
  if (pipeCount < 2) return false;
  return (
    trimmed.startsWith("|") ||
    /\s\|\s/.test(trimmed) ||
    /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed)
  );
}

export function cleanAvaExportText(value: unknown): string {
  const original = decodeBasicEntities(String(value ?? ""));
  let chartFallbackNeeded = false;
  let tableFallbackNeeded = false;

  const withoutChartJson = original.replace(/```chart\s*[\s\S]*?```/gi, () => {
    chartFallbackNeeded = true;
    return "\n\n";
  });

  const keptLines = withoutChartJson
    .split(/\r?\n/)
    .filter((line) => {
      const isTable = isRawTableLine(line);
      if (isTable) tableFallbackNeeded = true;
      return !isTable;
    });

  const cleaned = keptLines
    .join("\n")
    .replace(/\{\s*"type"\s*:\s*"(?:bar|line|horizontal-bar|chart)"[\s\S]{0,800}\}/gi, () => {
      chartFallbackNeeded = true;
      return "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fallbacks: string[] = [];
  if (tableFallbackNeeded) {
    fallbacks.push(
      "A table-shaped answer was detected but was not available as a validated table artifact in this export.",
    );
  }
  if (chartFallbackNeeded) {
    fallbacks.push(
      "A chart-shaped answer was detected but was not available as a validated chart artifact in this export.",
    );
  }

  return [cleaned, ...fallbacks].filter(Boolean).join("\n\n");
}

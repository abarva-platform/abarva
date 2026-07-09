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

export type IntelligenceTabId =
  | "decision"
  | "industry_insights"
  | "chart"
  | "table"
  | "evidence";

export interface ParsedIntelligenceTab {
  id: IntelligenceTabId;
  label: string;
  grounding:
    | "tenant-evidence"
    | "function-context"
    | "category-context"
    | "industry-context"
    | "corpus-pattern"
    | "benchmark"
    | "mixed"
    | "unknown";
  content: string;
}

export interface ParsedIntelligenceTabbedResponse {
  mainAnswer: string;
  tabs: ParsedIntelligenceTab[];
  rawText: string;
}

const TAB_LABELS: Record<IntelligenceTabId, string> = {
  decision: "Decision",
  industry_insights: "Industry Insights",
  chart: "Chart",
  table: "Table",
  evidence: "Evidence",
};

const TAB_MARKER_RE =
  /^\s*<<<TAB:\s*(Decision|Industry Insights|Chart|Table|Evidence)(?:\s*\|\s*grounding:\s*([^>]+?))?\s*>>>\s*$/gim;

export const INTELLIGENCE_TABBED_OUTPUT_CONTRACT = `INTELLIGENCE COMPANION-CANVAS OUTPUT

Return one main answer, then optional right-canvas companion cards using the exact markers below.

Main answer:
- Put the executive answer before any tab marker.
- Do not include tables in the main answer.
- Do not expose raw IDs, field names, debug labels, or implementation terms.

Companion canvas:
- The renderer places each marked section as a separate card on the right side. It does not rewrite your prose, tables, or chart data.
- Use three to five cards for most strategic or analytical answers. Choose the most interesting and relevant lenses for the question; do not force a card that would be weak or repetitive.
- The right canvas should add decision support, not duplicate the main answer. Bring useful adjacent views: exact tenant metric when available; otherwise a relevant function, category, industry, corpus-pattern, benchmark, peer-pattern, risk, value-model, assumption, or planning view with honest grounding.
- Use these exact start markers when the card is useful:
  <<<TAB: Decision | grounding: tenant-evidence>>>
  <<<TAB: Industry Insights | grounding: industry-context>>>
  <<<TAB: Chart | grounding: tenant-evidence>>>
  <<<TAB: Table | grounding: tenant-evidence>>>
  <<<TAB: Evidence | grounding: tenant-evidence>>>
- End each tab by starting the next tab marker or the end of the response.
- Decision should state the choice, tradeoff, and decision required.
- Industry Insights can be an industry signal, peer pattern, benchmark, or outside-in case example. It must be explicitly labeled as industry context or benchmark context, not tenant proof. Never say the tenant "has" an industry fact unless it is in tenant evidence.
- Chart should appear only when you can provide chart-ready data in a compact Markdown table with numeric values. The chart may be tenant-specific, or it may be an industry trend, directional benchmark, peer-pattern map, or function/category opportunity map. If the chart is not tenant evidence, set grounding to industry-context, benchmark, corpus-pattern, function-context, or category-context and make the first line say that clearly. If no chart-ready data exists, omit the Chart tab.
- Table should preserve a compact Markdown table when it helps the decision. The table can be directly about the answer or an adjacent function/category/pattern view that helps the CXO reason about the question.
- If you emit any Markdown table, it must appear inside the Table tab or Chart tab, never inside the main answer, Decision tab, Industry Insights tab, or Evidence tab.
- If the answer includes a decision plus a comparison table, put the choice and tradeoff in Decision, then start a separate <<<TAB: Table | grounding: tenant-evidence>>> marker before the table.
- Evidence should separate tenant facts, industry/pattern context, benchmarks, planning assumptions, missing evidence, and what the executive should validate next.

Grounding:
- Clearly distinguish tenant facts, industry context, corpus/pattern context, benchmarks, planning assumptions, and missing evidence.
- Chart and Table should use tenant evidence when the tenant packet contains the needed facts. When industry trend, benchmark, corpus-pattern, function, category, or planning-assumption data is more useful, use it, but say so in the tab marker grounding and in the first line of the tab.
- Accepted grounding labels include tenant-evidence, function-context, category-context, industry-context, corpus-pattern, benchmark, and mixed.`;

function normalizeTabId(label: string): IntelligenceTabId | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "decision") return "decision";
  if (normalized === "industry insights") return "industry_insights";
  if (normalized === "chart") return "chart";
  if (normalized === "table") return "table";
  if (normalized === "evidence") return "evidence";
  return null;
}

function normalizeGrounding(
  value: string | undefined,
): ParsedIntelligenceTab["grounding"] {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "tenant-evidence" || normalized === "tenant evidence") {
    return "tenant-evidence";
  }
  if (normalized === "function-context" || normalized === "function context") {
    return "function-context";
  }
  if (normalized === "category-context" || normalized === "category context") {
    return "category-context";
  }
  if (normalized === "industry-context" || normalized === "industry context") {
    return "industry-context";
  }
  if (normalized === "corpus-pattern" || normalized === "corpus pattern") {
    return "corpus-pattern";
  }
  if (normalized === "benchmark" || normalized === "benchmarks") {
    return "benchmark";
  }
  if (normalized === "mixed") return "mixed";
  return "unknown";
}

export function parseIntelligenceTabbedResponse(
  text: string,
): ParsedIntelligenceTabbedResponse {
  const rawText = text.replace(/\r\n/g, "\n").trim();
  TAB_MARKER_RE.lastIndex = 0;
  const matches = Array.from(rawText.matchAll(TAB_MARKER_RE));
  if (matches.length === 0) {
    return {
      rawText,
      mainAnswer: rawText,
      tabs: [],
    };
  }

  const mainAnswer = rawText.slice(0, matches[0].index).trim();
  const tabs: ParsedIntelligenceTab[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const id = normalizeTabId(match[1] ?? "");
    if (!id) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? rawText.length)
        : rawText.length;
    const content = rawText.slice(start, end).trim();
    if (!content) continue;
    if (id === "chart" && !hasChartReadyMarkdownData(content)) continue;
    tabs.push({
      id,
      label: TAB_LABELS[id],
      grounding: normalizeGrounding(match[2]),
      content,
    });
  }

  return {
    rawText,
    mainAnswer,
    tabs,
  };
}

export function hasIntelligenceTabMarkers(text: string): boolean {
  TAB_MARKER_RE.lastIndex = 0;
  return TAB_MARKER_RE.test(text.replace(/\r\n/g, "\n"));
}

export function visibleIntelligenceMainAnswer(text: string): string {
  const parsed = parseIntelligenceTabbedResponse(text);
  if (hasIntelligenceTabMarkers(text)) return parsed.mainAnswer;
  const partialMarkerIndex = parsed.rawText.search(/(?:^|\n)\s*<<<TAB:/i);
  if (partialMarkerIndex >= 0) {
    return parsed.rawText.slice(0, partialMarkerIndex).trim();
  }
  return parsed.rawText;
}

export function hasChartReadyMarkdownData(content: string): boolean {
  const lines = content.split(/\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = splitMarkdownTableLine(lines[index] ?? "");
    if (header.length < 2 || !isMarkdownSeparator(lines[index + 1] ?? "")) {
      continue;
    }
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const cells = splitMarkdownTableLine(lines[rowIndex] ?? "");
      if (cells.length < 2) break;
      if (cells.some((cell) => /(?:^|[^A-Za-z])\$?-?\d[\d,.]*%?/.test(cell))) {
        return true;
      }
    }
  }
  return false;
}

function splitMarkdownTableLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

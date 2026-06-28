export type IntelligenceTabId =
  | "decision"
  | "industry_insights"
  | "chart"
  | "table"
  | "evidence";

export interface ParsedIntelligenceTab {
  id: IntelligenceTabId;
  label: string;
  grounding: "tenant-evidence" | "industry-context" | "corpus-pattern" | "benchmark" | "mixed" | "unknown";
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

export const INTELLIGENCE_TABBED_OUTPUT_CONTRACT = `INTELLIGENCE DECISION-CANVAS OUTPUT

Return one main answer, then optional right-canvas tabs using the exact markers below.

Main answer:
- Put the executive answer before any tab marker.
- Do not include tables in the main answer.
- Do not expose raw IDs, field names, debug labels, or implementation terms.

Tabs:
- Use these exact start markers when the content is useful:
  <<<TAB: Decision | grounding: tenant-evidence>>>
  <<<TAB: Industry Insights | grounding: industry-context>>>
  <<<TAB: Chart | grounding: tenant-evidence>>>
  <<<TAB: Table | grounding: tenant-evidence>>>
  <<<TAB: Evidence | grounding: tenant-evidence>>>
- End each tab by starting the next tab marker or the end of the response.
- The renderer will only use the markers to place content into tabs. It will not rewrite your prose, tables, or chart data.
- Decision should state the choice, tradeoff, and decision required.
- Industry Insights must be explicitly labeled as industry context or benchmark context, not tenant proof. Never say the tenant "has" an industry fact unless it is in tenant evidence.
- Chart should appear only when you can provide chart-ready data in a compact Markdown table with numeric values. If the data is not chart-ready, omit the Chart tab.
- Table should preserve a compact Markdown table when it helps the decision.
- Evidence should separate tenant facts, industry/pattern context, benchmarks, planning assumptions, and missing evidence.

Grounding:
- Clearly distinguish tenant facts, industry context, corpus/pattern context, benchmarks, planning assumptions, and missing evidence.
- Chart and Table default to tenant evidence. If using industry/pattern context, say so in the tab marker grounding and in the first line of the tab.`;

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

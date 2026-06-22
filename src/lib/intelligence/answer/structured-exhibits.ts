import type { AskSource } from "@/lib/intelligence/ask/types";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type {
  AgentAnswer,
  AnswerChart,
  AnswerCitation,
  AnswerTable,
} from "@/lib/intelligence/answer/agent-answer";

const MONEY_PATTERN =
  /\$\s?-?\d[\d,]*(?:\.\d+)?\s?(?:k|m|b|million|billion)?/gi;
const PERCENT_PATTERN = /\b-?\d+(?:\.\d+)?\s?%/g;

export interface StructuredExhibitsInput {
  prose: string;
  routing: RoutingDecision;
  sources: AskSource[];
}

export interface StructuredExhibits {
  citations: AnswerCitation[];
  tables: AnswerTable[];
  charts: AnswerChart[];
}

interface ExtractedFigure {
  label: string;
  raw: string;
  value: number;
  format: "currency" | "percent";
}

function sourceClassForAskSource(
  source: AskSource,
): AnswerCitation["sourceClass"] {
  switch (source.type) {
    case "TENANT":
      return "tenant-fact";
    case "GRAPH":
      return "graph";
    case "PATTERN":
      return "corpus-pattern";
    case "WORLDVIEW":
    case "RESEARCH":
    case "REGULATION":
    case "BENCHMARK":
      return "worldview";
    default:
      return "corpus-pattern";
  }
}

export function answerCitationsFromAskSources(
  sources: AskSource[],
): AnswerCitation[] {
  return sources.slice(0, 8).map((source, index) => ({
    id: `c${index + 1}`,
    label: source.name || source.id || `Source ${index + 1}`,
    sourceClass: sourceClassForAskSource(source),
    recordId: source.id ?? undefined,
    excerpt: source.detail,
    url: source.url,
    confidence:
      typeof source.confidence === "number"
        ? source.confidence >= 0.66
          ? "high"
          : source.confidence >= 0.33
            ? "medium"
            : "low"
        : undefined,
  }));
}

function sentenceForIndex(text: string, index: number): string {
  const left = text.lastIndexOf(".", index);
  const right = text.indexOf(".", index);
  return text
    .slice(
      left >= 0 ? left + 1 : Math.max(0, index - 80),
      right >= 0 ? right + 1 : index + 120,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function compactLabel(sentence: string, raw: string): string {
  const label = sentence
    .replace(raw, "")
    .replace(/[:\-–—]+$/g, "")
    .trim();
  if (!label) return raw;
  return label.length > 92 ? `${label.slice(0, 89).trimEnd()}...` : label;
}

function parseMoney(raw: string): number {
  const normalized = raw.toLowerCase().replace(/[$,\s]/g, "");
  const multiplier =
    normalized.endsWith("b") || normalized.endsWith("billion")
      ? 1_000_000_000
      : normalized.endsWith("m") || normalized.endsWith("million")
        ? 1_000_000
        : normalized.endsWith("k")
          ? 1_000
          : 1;
  const numeric = Number.parseFloat(
    normalized.replace(/(billion|million|[bmk])$/i, ""),
  );
  return Number.isFinite(numeric) ? numeric * multiplier : 0;
}

function extractFigures(prose: string): ExtractedFigure[] {
  const figures: ExtractedFigure[] = [];
  for (const match of prose.matchAll(MONEY_PATTERN)) {
    const raw = match[0];
    const sentence = sentenceForIndex(prose, match.index ?? 0);
    figures.push({
      label: compactLabel(sentence, raw),
      raw,
      value: parseMoney(raw),
      format: "currency",
    });
  }
  for (const match of prose.matchAll(PERCENT_PATTERN)) {
    const raw = match[0];
    const sentence = sentenceForIndex(prose, match.index ?? 0);
    const value = Number.parseFloat(raw.replace("%", ""));
    if (!Number.isFinite(value)) continue;
    figures.push({
      label: compactLabel(sentence, raw),
      raw,
      value: value / 100,
      format: "percent",
    });
  }
  return figures.slice(0, 8);
}

function extractSourceFigures(sources: AskSource[]): ExtractedFigure[] {
  return extractFigures(sources.map((source) => source.detail).join("\n"));
}

function uniqueFigures(figures: ExtractedFigure[]): ExtractedFigure[] {
  const seen = new Set<string>();
  const out: ExtractedFigure[] = [];
  for (const figure of figures) {
    const key = `${figure.format}:${figure.raw.toLowerCase()}:${figure.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(figure);
  }
  return out.slice(0, 8);
}

function sourceRegisterTable(citations: AnswerCitation[]): AnswerTable | null {
  if (citations.length === 0) return null;
  return {
    id: "answer-source-register",
    title: "Evidence Used",
    columns: [
      { key: "source", label: "Source" },
      { key: "class", label: "Class" },
      { key: "confidence", label: "Confidence" },
    ],
    rows: citations.slice(0, 5).map((citation) => ({
      source: citation.label,
      class: citation.sourceClass,
      confidence: citation.confidence ?? "not scored",
    })),
    note: "Generated from the sources retrieved for this answer.",
    citationIds: citations.map((citation) => citation.id),
  };
}

function evidenceRequiredTable(citations: AnswerCitation[]): AnswerTable {
  return {
    id: "answer-evidence-required",
    title: "Evidence Required",
    columns: [
      { key: "evidence", label: "Evidence" },
      { key: "status", label: "Status" },
      { key: "nextMove", label: "Next Move" },
    ],
    rows: [
      {
        evidence: "Tenant data extract for the requested comparison",
        status:
          citations.length > 0
            ? "Not present in the retrieved cited sources"
            : "No cited source available for the requested rows",
        nextMove:
          "Validate or load the source table before approving tenant-specific numbers.",
      },
    ],
    note: "Rendered because the user asked for a table, but Ava did not have enough connected data to populate tenant-specific rows without fabrication.",
    citationIds: citations.map((citation) => citation.id),
  };
}

function figuresTable(
  figures: ExtractedFigure[],
  citations: AnswerCitation[],
): AnswerTable | null {
  if (figures.length === 0) return null;
  return {
    id: "answer-figures",
    title: "Figures Mentioned",
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value" },
      { key: "basis", label: "Basis" },
    ],
    rows: figures.map((figure) => ({
      metric: figure.label,
      value: figure.raw,
      basis: citations[0]?.label ?? "answer text",
    })),
    note: "Only figures already present in Ava's answer are rendered here.",
    citationIds: citations.slice(0, 3).map((citation) => citation.id),
  };
}

function costChart(
  figures: ExtractedFigure[],
  citations: AnswerCitation[],
): AnswerChart | null {
  const money = figures
    .filter((figure) => figure.format === "currency" && figure.value > 0)
    .slice(0, 5);
  if (money.length < 2) return null;
  return {
    id: "answer-cost-stack",
    kind: "cost-stack",
    title: "Figures as Chart",
    data: money.map((figure, index) => ({
      label:
        figure.label.length > 28
          ? `${figure.label.slice(0, 25).trimEnd()}...`
          : figure.label,
      value: figure.value,
      color: index === 0 ? "#0b4a91" : index % 2 === 0 ? "#dbe6f3" : "#1f6f43",
    })),
    citationIds: citations.slice(0, 3).map((citation) => citation.id),
  };
}

export function buildStructuredExhibits(
  input: StructuredExhibitsInput,
): StructuredExhibits {
  const citations = answerCitationsFromAskSources(input.sources);
  const figures = extractFigures(input.prose);
  const citedFigures = extractSourceFigures(input.sources);
  const tables: AnswerTable[] = [];
  const charts: AnswerChart[] = [];

  const wantsTable =
    input.routing.outputShape === "table" || figures.length > 0;
  if (wantsTable) {
    const table =
      figuresTable(figures, citations) ??
      sourceRegisterTable(citations) ??
      evidenceRequiredTable(citations);
    if (table) tables.push(table);
  }

  const wantsChart =
    input.routing.outputShape === "chart" ||
    /\b(chart|graph|visuali[sz]e)\b/i.test(input.prose);
  if (wantsChart) {
    const chart = costChart(
      uniqueFigures([...figures, ...citedFigures]),
      citations,
    );
    if (chart) charts.push(chart);
  }

  return { citations, tables, charts };
}

export function hasRenderableStructuredExhibits(
  exhibits: Pick<AgentAnswer, "tables" | "charts" | "graphs">,
): boolean {
  return (
    exhibits.tables.length > 0 ||
    exhibits.charts.length > 0 ||
    exhibits.graphs.length > 0
  );
}

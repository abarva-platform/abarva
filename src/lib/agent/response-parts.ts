export type AgentResponseTone =
  | "neutral"
  | "good"
  | "warning"
  | "danger"
  | "info";

export interface AgentMetric {
  label: string;
  value: string;
  tone?: AgentResponseTone;
}

export interface AgentTextPart {
  type: "text";
  title?: string;
  text: string;
}

export interface AgentMetricStripPart {
  type: "metricStrip";
  title?: string;
  metrics: AgentMetric[];
}

export interface AgentTablePart {
  type: "table";
  title: string;
  columns: string[];
  rows: string[][];
  caption?: string;
}

export interface AgentBarChartPart {
  type: "barChart";
  title: string;
  unit?: string;
  bars: Array<{
    label: string;
    value: number;
    displayValue?: string;
    tone?: AgentResponseTone;
  }>;
  caption?: string;
}

export interface AgentCitationsPart {
  type: "citations";
  title?: string;
  citations: Array<{
    label: string;
    excerpt: string;
    confidence: string;
    sourceDoc?: string;
  }>;
}

export interface AgentNextActionPart {
  type: "nextAction";
  label: string;
  detail: string;
  confidence?: string;
}

export interface AgentChartDatum {
  label: string;
  value: number;
}

export interface AgentChartSpec {
  type: "bar";
  title: string;
  unit?: string;
  data: AgentChartDatum[];
}

export interface AgentMarkdownResponsePart {
  type: "markdown";
  text: string;
}

export interface AgentChartResponsePart {
  type: "chart";
  chart: AgentChartSpec;
}

export type AgentResponsePart =
  | AgentTextPart
  | AgentMetricStripPart
  | AgentTablePart
  | AgentBarChartPart
  | AgentCitationsPart
  | AgentNextActionPart;

export type AgentParsedResponsePart =
  | AgentMarkdownResponsePart
  | AgentChartResponsePart;

const CHART_FENCE_RE = /```(?:abarva-chart|chart)\s*([\s\S]*?)```/gi;

function isChartSpec(value: unknown): value is AgentChartSpec {
  if (!value || typeof value !== "object") return false;
  const spec = value as Partial<AgentChartSpec>;
  return (
    spec.type === "bar" &&
    typeof spec.title === "string" &&
    Array.isArray(spec.data) &&
    spec.data.every(
      (d) =>
        d &&
        typeof d === "object" &&
        typeof (d as AgentChartDatum).label === "string" &&
        typeof (d as AgentChartDatum).value === "number" &&
        Number.isFinite((d as AgentChartDatum).value),
    )
  );
}

export function parseAgentResponseParts(
  text: string,
): AgentParsedResponsePart[] {
  const parts: AgentParsedResponsePart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(CHART_FENCE_RE)) {
    const index = match.index ?? 0;
    const before = text.slice(lastIndex, index);
    if (before) parts.push({ type: "markdown", text: before });

    const raw = match[1] ?? "";
    try {
      const parsed = JSON.parse(raw.trim()) as unknown;
      if (isChartSpec(parsed)) {
        parts.push({ type: "chart", chart: parsed });
      } else {
        parts.push({ type: "markdown", text: match[0] });
      }
    } catch {
      parts.push({ type: "markdown", text: match[0] });
    }

    lastIndex = index + match[0].length;
  }

  const tail = text.slice(lastIndex);
  if (tail) parts.push({ type: "markdown", text: tail });
  return parts.length ? parts : [{ type: "markdown", text }];
}

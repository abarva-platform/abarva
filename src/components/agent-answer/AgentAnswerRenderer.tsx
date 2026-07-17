"use client";

import { useState } from "react";

import * as SvgCharts from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { builderForChartKind } from "@/lib/intelligence/answer/chart-kind-builders";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import {
  compactCitations,
  shapeCitationLabel,
  shapePublicText,
  sourceClassDisplayLabel,
} from "@/lib/ava-answer/render-layer-shaper";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";

const CSS = `
.agentAnswer{--aa-ink:#111827;--aa-muted:#5f6b7a;--aa-faint:#8a94a3;--aa-line:#e4e7ec;--aa-line-strong:#cfd6df;--aa-paper:#fff;--aa-soft:#f7f8fa;--aa-soft-2:#fbfaf7;--aa-green:#166534;--aa-green-bg:#eaf7ee;--aa-blue:#164e9f;--aa-blue-bg:#eef5ff;display:grid;gap:18px;color:var(--aa-ink)}
.agentAnswer .aaHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-bottom:1px solid var(--aa-line);padding-bottom:14px}
.agentAnswer .aaKicker{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:var(--aa-green);font-weight:700}
.agentAnswer .aaMeta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.agentAnswer .aaPill{display:inline-flex;align-items:center;border:1px solid var(--aa-line);border-radius:999px;padding:3px 9px;font-size:12px;color:var(--aa-muted);background:var(--aa-paper)}
.agentAnswer .aaActions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.agentAnswer .aaExportButton{appearance:none;border:1px solid var(--aa-line);border-radius:6px;background:var(--aa-paper);color:var(--aa-ink);cursor:pointer;font-size:12px;font-weight:650;padding:7px 10px}
.agentAnswer .aaExportButton:hover{border-color:#9ca3af;background:#f3f4f6}
.agentAnswer .aaExportButton:disabled{cursor:not-allowed;opacity:.55}
.agentAnswer .aaExportStatus{font-size:12px;color:var(--aa-muted);min-width:68px;text-align:right}
.agentAnswer .aaProse{font-size:14px;line-height:1.65}
.agentAnswer .aaSection{display:grid;gap:12px}
.agentAnswer .aaTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--aa-muted);font-weight:800}
.agentAnswer .aaChart,.agentAnswer .aaGraph,.agentAnswer .aaTableWrap{border:1px solid var(--aa-line);border-radius:10px;background:var(--aa-paper);box-shadow:0 1px 2px rgba(16,24,40,.05),0 10px 24px rgba(16,24,40,.06);overflow:hidden}
.agentAnswer .aaChartHead,.agentAnswer .aaTableHead,.agentAnswer .aaGraphHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:13px 15px;border-bottom:1px solid var(--aa-line);background:linear-gradient(180deg,var(--aa-soft-2),var(--aa-soft))}
.agentAnswer .aaChartTitle,.agentAnswer .aaGraphTitle,.agentAnswer .aaTableTitle{font-size:14px;font-weight:800;line-height:1.35}
.agentAnswer .aaChartSubtitle{margin-top:3px;font-size:12px;color:var(--aa-muted);line-height:1.45}
.agentAnswer .aaArtifactBadge{display:inline-flex;align-items:center;white-space:nowrap;border:1px solid #bfd4ee;border-radius:999px;background:var(--aa-blue-bg);color:var(--aa-blue);padding:4px 9px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.agentAnswer .aaSvg{padding:16px;background:radial-gradient(circle at 20% 0%,#ffffff 0,#ffffff 42%,#fbfcfd 100%);overflow-x:auto}
.agentAnswer .aaSvg svg{display:block;width:100%;height:auto;min-width:520px}
.agentAnswer .aaGraphSvg{display:block;width:100%;height:auto;background:radial-gradient(circle at 50% 0%,#ffffff 0,#ffffff 48%,#f8fafc 100%)}
.agentAnswer .aaGraphNode{fill:#f6fbf8;stroke:#b9dac6;stroke-width:1.5;filter:drop-shadow(0 2px 4px rgba(17,24,39,.08))}
.agentAnswer .aaGraphEdge{stroke:#738091;stroke-width:1.5;marker-end:url(#aaArrow)}
.agentAnswer .aaGraphLabel{font-size:11px;fill:#111827;font-weight:700}
.agentAnswer .aaGraphKind{font-size:9px;fill:#5f6b7a;text-transform:uppercase;letter-spacing:.08em}
.agentAnswer .aaGraphEdgeLabel{font-size:10px;fill:#5f6b7a}
.agentAnswer .aaFallback{padding:14px;color:var(--aa-muted);font-size:13px}
.agentAnswer .aaTableScroll{overflow-x:auto}
.agentAnswer table{width:100%;min-width:620px;border-collapse:collapse;font-size:13px}
.agentAnswer th,.agentAnswer td{padding:11px 13px;border-bottom:1px solid var(--aa-line);vertical-align:top}
.agentAnswer th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--aa-muted);background:var(--aa-soft);font-weight:800}
.agentAnswer tbody tr:nth-child(even){background:#fcfcfb}
.agentAnswer tbody tr:hover{background:#f6faf8}
.agentAnswer tr:last-child td{border-bottom:0}
.agentAnswer .aaRight{text-align:right}
.agentAnswer .aaCenter{text-align:center}
.agentAnswer .aaNote,.agentAnswer .aaCitations{padding:10px 12px;border-top:1px solid var(--aa-line);color:var(--aa-muted);font-size:12px}
.agentAnswer .aaCitations{display:flex;flex-wrap:wrap;gap:7px;background:var(--aa-soft)}
.agentAnswer .aaCitation{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--aa-line);border-radius:999px;background:var(--aa-paper);padding:3px 8px;color:var(--aa-muted);text-decoration:none}
`;

type SvgBuilderName = Extract<keyof typeof SvgCharts, string>;

export interface RenderedChartSvg {
  builderName: string;
  svg: string | null;
  error?: string;
}

function isSvgBuilderName(name: string): name is SvgBuilderName {
  return typeof SvgCharts[name as SvgBuilderName] === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function invokeSvgBuilder(builderName: string, data: unknown): string {
  const builder = SvgCharts[builderName as SvgBuilderName] as (
    ...args: unknown[]
  ) => string;

  if (builderName === "valueBridge") {
    if (!isRecord(data))
      throw new Error("valueBridge data must include gross, steps, and net");
    return builder(
      firstNumber(data.gross, 0),
      Array.isArray(data.steps) ? data.steps : [],
      firstNumber(data.net, 0),
    );
  }

  if (builderName === "roadmapSwimlane") {
    if (!isRecord(data))
      throw new Error(
        "roadmapSwimlane data must include phases and totalMonths",
      );
    return builder(
      Array.isArray(data.phases) ? data.phases : [],
      firstNumber(data.totalMonths, 12),
    );
  }

  return builder(data);
}

export function renderAnswerChartSvg(chart: AnswerChart): RenderedChartSvg {
  const builderName = chart.builder ?? builderForChartKind(chart.kind);
  if (!isSvgBuilderName(builderName)) {
    return {
      builderName,
      svg: null,
      error: `No SVG builder named ${builderName}`,
    };
  }

  try {
    const svg = invokeSvgBuilder(builderName, chart.data);
    if (!svg.trimStart().startsWith("<svg")) {
      return {
        builderName,
        svg: null,
        error: `${builderName} did not return SVG`,
      };
    }
    return { builderName, svg };
  } catch (err) {
    return {
      builderName,
      svg: null,
      error: err instanceof Error ? err.message : "Chart builder failed",
    };
  }
}

function isRenderableAnswerChart(
  chart: AnswerChart,
): chart is AnswerChart & { artifact: "chart" } {
  return renderAnswerChartSvg(chart).svg !== null;
}

function citationsFor(
  ids: string[] | undefined,
  citations: AnswerCitation[],
): AnswerCitation[] {
  if (!ids?.length) return [];
  const byId = new Map(citations.map((citation) => [citation.id, citation]));
  return ids.flatMap((id) => {
    const citation = byId.get(id);
    return citation ? [citation] : [];
  });
}

function CitationChips({ citations }: { citations: AnswerCitation[] }) {
  const visible = compactCitations(citations);
  if (visible.length === 0) return null;
  return (
    <div className="aaCitations" aria-label="Sources">
      {visible.map((citation) => {
        const label = shapeCitationLabel(citation);
        const classLabel = sourceClassLabel(citation.sourceClass);
        const content = (
          <>
            <span>{label}</span>
            {classLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{classLabel}</span>
              </>
            ) : null}
          </>
        );
        return citation.url ? (
          <a className="aaCitation" href={citation.url} key={citation.id}>
            {content}
          </a>
        ) : (
          <span
            className="aaCitation"
            key={citation.id}
            title={
              citation.excerpt
                ? shapePublicText(citation.excerpt, "")
                : undefined
            }
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

function sourceClassLabel(sourceClass: AnswerCitation["sourceClass"]): string {
  return sourceClassDisplayLabel(sourceClass);
}

function formatCell(
  value: string | number | null,
  column: AnswerTableColumn,
): string {
  if (value === null) return "—";
  const numericValue =
    typeof value === "number" ? value : parseNumericCellValue(value);
  const inferredFormat = inferredCellFormat(column);
  if (numericValue !== null && inferredFormat) {
    return formatNumericCell(numericValue, inferredFormat);
  }
  if (typeof value === "string") return value;

  switch (column.format) {
    case "currency":
      return formatCompactUsd(value);
    case "percent": {
      return formatPercent(value);
    }
    case "number":
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(value);
    case "date":
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        new Date(value),
      );
    case "text":
    default:
      return String(value);
  }
}

function parseNumericCellValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferredCellFormat(
  column: AnswerTableColumn,
): "currency" | "percent" | "number" | null {
  if (
    column.format === "currency" ||
    column.format === "percent" ||
    column.format === "number"
  ) {
    return column.format;
  }
  const name = `${column.key} ${column.label}`.toLowerCase();
  if (/\b(usd|amount|budget|cost|spend|revenue|value|rate)\b/.test(name)) {
    return "currency";
  }
  if (/\b(percent|percentage|pct|share|ratio)\b/.test(name)) return "percent";
  if (
    /\b(count|employees?|users?|population|records?|volume|number)\b/.test(name)
  ) {
    return "number";
  }
  return null;
}

function formatNumericCell(
  value: number,
  format: "currency" | "percent" | "number",
): string {
  if (format === "currency") return formatCompactUsd(value);
  if (format === "percent") return formatPercent(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    value,
  );
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `$${trimCompactNumber(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${trimCompactNumber(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trimCompactNumber(value / 1_000)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const normalized = Math.abs(value) <= 1 ? value : value / 100;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(normalized);
}

function trimCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2,
  }).format(value);
}

function alignmentClass(column: AnswerTableColumn): string {
  if (column.align === "right") return "aaRight";
  if (column.align === "center") return "aaCenter";
  if (
    column.format === "number" ||
    column.format === "currency" ||
    column.format === "percent" ||
    Boolean(inferredCellFormat(column))
  ) {
    return "aaRight";
  }
  return "";
}

function chartKindLabel(kind: AnswerChart["kind"]): string {
  return kind
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ExportFormat = "html" | "pdf";

function submitAnswerExport(answer: AvaAnswerPacket, format: ExportFormat) {
  const targetName = `ava-export-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const iframe = document.createElement("iframe");
  iframe.name = targetName;
  iframe.title = "aVa export download target";
  iframe.style.display = "none";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/intelligence/ask/export";
  form.target = targetName;
  form.style.display = "none";

  const payload = document.createElement("input");
  payload.type = "hidden";
  payload.name = "payload";
  payload.value = JSON.stringify({ answer, format });
  form.appendChild(payload);

  document.body.appendChild(iframe);
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 60_000);
}

function ExportActions({ answer }: { answer: AvaAnswerPacket }) {
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [status, setStatus] = useState<string>("");

  async function run(format: ExportFormat) {
    setPending(format);
    setStatus("");
    try {
      submitAnswerExport(answer, format);
      setStatus("Ready");
    } catch {
      setStatus("Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="aaActions" aria-label="Export answer">
      <button
        className="aaExportButton"
        disabled={pending !== null}
        onClick={() => void run("html")}
        type="button"
      >
        {pending === "html" ? "Preparing..." : "Export HTML"}
      </button>
      <button
        className="aaExportButton"
        disabled={pending !== null}
        onClick={() => void run("pdf")}
        type="button"
      >
        {pending === "pdf" ? "Preparing..." : "Export PDF"}
      </button>
      {status ? <span className="aaExportStatus">{status}</span> : null}
    </div>
  );
}

export function DataTable({
  table,
  citations = [],
}: {
  table: AnswerTable;
  citations?: AnswerCitation[];
}) {
  const tableCitations = citationsFor(table.citationIds, citations);
  return (
    <div className="aaTableWrap">
      {(table.title || table.note) && (
        <div className="aaTableHead">
          <div className="aaTableTitle">{table.title ?? "Table"}</div>
          <span className="aaArtifactBadge">
            {table.rows.length} row{table.rows.length === 1 ? "" : "s"}
          </span>
        </div>
      )}
      <div className="aaTableScroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th
                  className={alignmentClass(column)}
                  key={column.key}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {table.columns.map((column) => (
                  <td className={alignmentClass(column)} key={column.key}>
                    {formatCell(row[column.key] ?? null, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note ? <div className="aaNote">{table.note}</div> : null}
      <CitationChips citations={tableCitations} />
    </div>
  );
}

export function AnswerChartRenderer({
  chart,
  citations = [],
}: {
  chart: AnswerChart;
  citations?: AnswerCitation[];
}) {
  const rendered = renderAnswerChartSvg(chart);
  const chartCitations = citationsFor(chart.citationIds, citations);
  return (
    <div className="aaChart">
      <div className="aaChartHead">
        <div>
          <div className="aaChartTitle">{chart.title ?? chart.kind}</div>
          {chart.subtitle ? (
            <div className="aaChartSubtitle">{chart.subtitle}</div>
          ) : null}
        </div>
        <span className="aaArtifactBadge">{chartKindLabel(chart.kind)}</span>
      </div>
      {rendered.svg ? (
        <div
          className="aaSvg"
          data-chart-builder={rendered.builderName}
          dangerouslySetInnerHTML={{ __html: rendered.svg }}
        />
      ) : (
        <div className="aaFallback" role="status">
          Chart unavailable: {rendered.error}
        </div>
      )}
      {chart.sourceNote ? <div className="aaNote">{chart.sourceNote}</div> : null}
      <CitationChips citations={chartCitations} />
    </div>
  );
}

export function AnswerGraphRenderer({
  graph,
  citations = [],
}: {
  graph: AnswerGraph;
  citations?: AnswerCitation[];
}) {
  const graphCitations = citationsFor(graph.citationIds, citations);
  const nodes = graph.nodes.slice(0, 10);
  const nodeById = new Map(
    nodes.map((node, index) => [node.id, { node, index }]),
  );
  const width = 720;
  const height = Math.max(260, Math.ceil(nodes.length / 2) * 84 + 48);
  const positions = new Map(
    nodes.map((node, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return [
        node.id,
        {
          x: column === 0 ? 160 : 560,
          y: 58 + row * 84,
        },
      ] as const;
    }),
  );
  const edges = graph.edges
    .filter((edge) => nodeById.has(edge.from) && nodeById.has(edge.to))
    .slice(0, 12);
  return (
    <div className="aaGraph">
      <div className="aaGraphHead">
        <div className="aaGraphTitle">
          {graph.title ?? "Relationship graph"}
        </div>
        <div className="aaArtifactBadge">
          {nodes.length} nodes · {edges.length} links
        </div>
      </div>
      <svg
        className="aaGraphSvg"
        role="img"
        aria-label={graph.title ?? "Relationship graph"}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <marker
            id="aaArrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#77838f" />
          </marker>
        </defs>
        {edges.map((edge, index) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - 8;
          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line
                className="aaGraphEdge"
                x1={from.x + 92}
                x2={to.x - 92}
                y1={from.y}
                y2={to.y}
              />
              {edge.label ? (
                <text
                  className="aaGraphEdgeLabel"
                  textAnchor="middle"
                  x={midX}
                  y={midY}
                >
                  {edge.label.length > 44
                    ? `${edge.label.slice(0, 41)}...`
                    : edge.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return null;
          return (
            <g key={node.id}>
              <rect
                className="aaGraphNode"
                height="42"
                rx="8"
                width="184"
                x={position.x - 92}
                y={position.y - 21}
              />
              <text
                className="aaGraphLabel"
                textAnchor="middle"
                x={position.x}
                y={position.y + (node.kind ? 0 : 4)}
              >
                {node.label.length > 25
                  ? `${node.label.slice(0, 22)}...`
                  : node.label}
              </text>
              {node.kind ? (
                <text
                  className="aaGraphKind"
                  textAnchor="middle"
                  x={position.x}
                  y={position.y + 14}
                >
                  {node.kind.length > 22
                    ? `${node.kind.slice(0, 19)}...`
                    : node.kind}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <CitationChips citations={graphCitations} />
    </div>
  );
}

export function AgentAnswerRenderer({
  answer,
  showChrome = true,
  showProse = true,
  showExport = true,
}: {
  answer: AvaAnswerPacket;
  showChrome?: boolean;
  showProse?: boolean;
  showExport?: boolean;
}) {
  const displayAnswer = sanitizeAvaAnswerForRender(answer);
  const visibleArtifacts = displayAnswer.artifacts.filter(isVisibleAvaArtifact);
  const tables = visibleArtifacts.filter(
    (artifact): artifact is AnswerTable & { artifact: "table" } =>
      artifact.artifact === "table",
  );
  const charts = visibleArtifacts.filter(
    (artifact): artifact is AnswerChart & { artifact: "chart" } =>
      artifact.artifact === "chart",
  ).filter(isRenderableAnswerChart);
  const graphs = visibleArtifacts.filter(
    (artifact): artifact is AnswerGraph & { artifact: "graph" } =>
      artifact.artifact === "graph",
  );
  const hasStructured =
    charts.length > 0 || graphs.length > 0 || tables.length > 0;
  const hasAttribution = false;
  return (
    <section className="agentAnswer" aria-label="aVa answer">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {showChrome ? (
        <header className="aaHeader">
          <div>
            <div className="aaKicker">aVa · {displayAnswer.surface}</div>
            <div className="aaMeta">
              <span className="aaPill">{displayAnswer.status}</span>
              <span className="aaPill">
                {displayAnswer.quality.confidence} confidence
              </span>
              {displayAnswer.quality.cxo ? (
                <span className="aaPill">
                  {displayAnswer.quality.cxo.mode.replace(/_/g, " ")} ·{" "}
                  {displayAnswer.quality.cxo.score}
                </span>
              ) : null}
            </div>
          </div>
          {showExport ? <ExportActions answer={displayAnswer} /> : null}
        </header>
      ) : null}

      {showProse && displayAnswer.directAnswer ? (
        <div className="aaProse">
          <AgentMarkdown text={displayAnswer.directAnswer} />
          {displayAnswer.interpretation ? (
            <AgentMarkdown text={displayAnswer.interpretation} />
          ) : null}
          {displayAnswer.businessImplication ? (
            <AgentMarkdown text={displayAnswer.businessImplication} />
          ) : null}
        </div>
      ) : null}

      {charts.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Visuals</div>
          {charts.map((chart) => (
            <AnswerChartRenderer chart={chart} key={chart.id} />
          ))}
        </div>
      ) : null}

      {graphs.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Relationship View</div>
          {graphs.map((graph) => (
            <AnswerGraphRenderer graph={graph} key={graph.id} />
          ))}
        </div>
      ) : null}

      {tables.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Decision Table</div>
          {tables.map((table) => (
            <DataTable table={table} key={table.id} />
          ))}
        </div>
      ) : null}

      {!displayAnswer.directAnswer && !hasStructured && !hasAttribution ? (
        <div className="aaFallback" role="status">
          aVa did not return a renderable answer.
        </div>
      ) : null}
    </section>
  );
}

"use client";

import * as SvgCharts from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { builderForChartKind } from "@/lib/intelligence/answer/chart-kind-builders";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";

const CSS = `
.agentAnswer{--aa-ink:#111827;--aa-muted:#6b7280;--aa-faint:#9ca3af;--aa-line:#e5e7eb;--aa-paper:#fff;--aa-soft:#f9fafb;--aa-green:#166534;--aa-green-bg:#eaf7ee;display:grid;gap:18px;color:var(--aa-ink)}
.agentAnswer .aaHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-bottom:1px solid var(--aa-line);padding-bottom:14px}
.agentAnswer .aaKicker{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:var(--aa-green);font-weight:700}
.agentAnswer .aaMeta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.agentAnswer .aaPill{display:inline-flex;align-items:center;border:1px solid var(--aa-line);border-radius:999px;padding:3px 9px;font-size:12px;color:var(--aa-muted);background:var(--aa-paper)}
.agentAnswer .aaExpert{background:var(--aa-green-bg);border-color:transparent;color:var(--aa-green);font-weight:600}
.agentAnswer .aaProse{font-size:14px;line-height:1.65}
.agentAnswer .aaSection{display:grid;gap:12px}
.agentAnswer .aaTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--aa-muted);font-weight:700}
.agentAnswer .aaChart,.agentAnswer .aaGraph,.agentAnswer .aaTableWrap{border:1px solid var(--aa-line);border-radius:8px;background:var(--aa-paper);overflow:hidden}
.agentAnswer .aaChartHead,.agentAnswer .aaTableHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--aa-line);background:var(--aa-soft)}
.agentAnswer .aaGraphHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--aa-line);background:var(--aa-soft)}
.agentAnswer .aaChartTitle,.agentAnswer .aaGraphTitle,.agentAnswer .aaTableTitle{font-size:14px;font-weight:700}
.agentAnswer .aaBuilder{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--aa-faint)}
.agentAnswer .aaSvg{padding:12px;background:#fff}
.agentAnswer .aaSvg svg{display:block;width:100%;height:auto}
.agentAnswer .aaGraphSvg{display:block;width:100%;height:auto;background:#fff}
.agentAnswer .aaGraphNode{fill:#eef7f0;stroke:#cfe8d7;stroke-width:1.5}
.agentAnswer .aaGraphEdge{stroke:#77838f;stroke-width:1.6;marker-end:url(#aaArrow)}
.agentAnswer .aaGraphLabel{font-size:11px;fill:#111827;font-weight:650}
.agentAnswer .aaGraphEdgeLabel{font-size:10px;fill:#6b7280}
.agentAnswer .aaFallback{padding:14px;color:var(--aa-muted);font-size:13px}
.agentAnswer table{width:100%;border-collapse:collapse;font-size:13px}
.agentAnswer th,.agentAnswer td{padding:10px 12px;border-bottom:1px solid var(--aa-line);vertical-align:top}
.agentAnswer th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--aa-muted);background:var(--aa-soft);font-weight:700}
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
  const builderName = builderForChartKind(chart.kind);
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
  if (citations.length === 0) return null;
  return (
    <div className="aaCitations" aria-label="Sources">
      {citations.map((citation) => {
        const label = citation.label || citation.id;
        const content = (
          <>
            <span>{label}</span>
            <span aria-hidden="true">·</span>
            <span>{citation.sourceClass}</span>
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
            title={citation.excerpt}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

function formatCell(
  value: string | number | null,
  column: AnswerTableColumn,
): string {
  if (value === null) return "—";
  if (typeof value === "string") return value;

  switch (column.format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    case "percent": {
      const normalized = Math.abs(value) <= 1 ? value : value / 100;
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(normalized);
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

function alignmentClass(column: AnswerTableColumn): string {
  if (column.align === "right") return "aaRight";
  if (column.align === "center") return "aaCenter";
  if (
    column.format === "number" ||
    column.format === "currency" ||
    column.format === "percent"
  ) {
    return "aaRight";
  }
  return "";
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
        </div>
      )}
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
        <div className="aaChartTitle">{chart.title ?? chart.kind}</div>
        <div className="aaBuilder">{rendered.builderName}</div>
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
        <div className="aaBuilder">
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
                y={position.y + 4}
              >
                {node.label.length > 25
                  ? `${node.label.slice(0, 22)}...`
                  : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <CitationChips citations={graphCitations} />
    </div>
  );
}

export function AgentAnswerRenderer({ answer }: { answer: AvaAnswerPacket }) {
  const displayAnswer = sanitizeAvaAnswerForRender(answer);
  const tables = displayAnswer.artifacts.filter(
    (artifact): artifact is AnswerTable & { artifact: "table" } =>
      artifact.artifact === "table",
  );
  const charts = displayAnswer.artifacts.filter(
    (artifact): artifact is AnswerChart & { artifact: "chart" } =>
      artifact.artifact === "chart",
  );
  const graphs = displayAnswer.artifacts.filter(
    (artifact): artifact is AnswerGraph & { artifact: "graph" } =>
      artifact.artifact === "graph",
  );
  const hasStructured =
    charts.length > 0 || graphs.length > 0 || tables.length > 0;
  const hasAttribution =
    (displayAnswer.expertsUsed?.length ?? 0) > 0 ||
    displayAnswer.citations.length > 0;
  return (
    <section className="agentAnswer" aria-label="aVa answer">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="aaHeader">
        <div>
          <div className="aaKicker">aVa · {displayAnswer.surface}</div>
          <div className="aaMeta">
            <span className="aaPill">{displayAnswer.status}</span>
            <span className="aaPill">
              {displayAnswer.quality.confidence} confidence
            </span>
            {(displayAnswer.expertsUsed ?? []).map((expert) => (
              <span
                className="aaPill aaExpert"
                key={expert.id}
                title={expert.id}
              >
                {expert.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      {displayAnswer.directAnswer ? (
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
          <div className="aaTitle">Charts</div>
          {charts.map((chart) => (
            <AnswerChartRenderer
              chart={chart}
              citations={displayAnswer.citations}
              key={chart.id}
            />
          ))}
        </div>
      ) : null}

      {graphs.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Graphs</div>
          {graphs.map((graph) => (
            <AnswerGraphRenderer
              graph={graph}
              citations={displayAnswer.citations}
              key={graph.id}
            />
          ))}
        </div>
      ) : null}

      {tables.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Tables</div>
          {tables.map((table) => (
            <DataTable
              table={table}
              citations={displayAnswer.citations}
              key={table.id}
            />
          ))}
        </div>
      ) : null}

      {!hasStructured && displayAnswer.citations.length > 0 ? (
        <div className="aaSection">
          <div className="aaTitle">Sources</div>
          <CitationChips citations={displayAnswer.citations} />
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

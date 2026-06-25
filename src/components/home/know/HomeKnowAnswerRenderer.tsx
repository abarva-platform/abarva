"use client";

import { useMemo, useState } from "react";
import type {
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowGap,
  HomeKnowGraph,
  HomeKnowResponse,
  HomeKnowTable,
  HomeKnowTableColumn,
} from "@/lib/home/know/home-know-contract";

const CSS = `
.homeKnowAnswer{--hk-ink:#171713;--hk-muted:#67675f;--hk-faint:#8f8d84;--hk-line:#E4DFD5;--hk-paper:#fff;--hk-soft:#F8F6F1;--hk-green:#17683B;--hk-blue:#0B5CAD;--hk-amber:#9A641D;--hk-amber-bg:#FFF7E6;display:grid;gap:12px;color:var(--hk-ink);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;width:min(860px,94%)}
.homeKnowAnswer .hk-card{background:var(--hk-paper);border:1px solid var(--hk-line);border-radius:18px 18px 18px 4px;padding:17px 19px;display:grid;gap:12px;box-shadow:0 1px 0 rgba(15,23,42,.02)}
.homeKnowAnswer.compact .hk-card{padding:14px 16px}
.homeKnowAnswer .hk-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
.homeKnowAnswer .hk-kicker{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--hk-green);font-weight:700}
.homeKnowAnswer .hk-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.homeKnowAnswer .hk-pill{display:inline-flex;align-items:center;border:1px solid var(--hk-line);border-radius:999px;background:#fff;padding:4px 9px;font-size:12px;color:var(--hk-muted)}
.homeKnowAnswer .hk-pill.good{background:#E9F6ED;border-color:transparent;color:var(--hk-green);font-weight:650}
.homeKnowAnswer .hk-prose{font-size:15px;line-height:1.68;white-space:pre-wrap;color:#20201b}
.homeKnowAnswer.compact .hk-prose{font-size:14px;line-height:1.62}
.homeKnowAnswer .hk-section{display:grid;gap:10px}
.homeKnowAnswer .hk-title{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--hk-muted);font-weight:700}
.homeKnowAnswer .hk-tableWrap,.homeKnowAnswer .hk-chart,.homeKnowAnswer .hk-graph,.homeKnowAnswer .hk-gapBox,.homeKnowAnswer .hk-handoff,.homeKnowAnswer .hk-drawer{border:1px solid var(--hk-line);border-radius:8px;background:#fff;overflow:hidden}
.homeKnowAnswer .hk-exhibitHead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--hk-line);background:var(--hk-soft)}
.homeKnowAnswer .hk-exhibitTitle{font-size:14px;font-weight:750}
.homeKnowAnswer .hk-exhibitMeta{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--hk-faint)}
.homeKnowAnswer table{width:100%;border-collapse:collapse;font-size:13px}
.homeKnowAnswer th,.homeKnowAnswer td{padding:10px 12px;border-bottom:1px solid var(--hk-line);vertical-align:top}
.homeKnowAnswer th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--hk-muted);background:var(--hk-soft);font-weight:750}
.homeKnowAnswer tr:last-child td{border-bottom:0}
.homeKnowAnswer .right{text-align:right}.homeKnowAnswer .center{text-align:center}
.homeKnowAnswer .hk-note{border-top:1px solid var(--hk-line);padding:10px 12px;color:var(--hk-muted);font-size:12px}
.homeKnowAnswer .hk-bars{padding:16px 18px;display:grid;gap:10px}
.homeKnowAnswer .hk-barRow{display:grid;grid-template-columns:minmax(140px,1fr) minmax(180px,2fr) 88px;align-items:center;gap:12px;font-size:13px}
.homeKnowAnswer .hk-barLabel{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.homeKnowAnswer .hk-track{height:22px;background:#EAE5DA;border-radius:5px;overflow:hidden}
.homeKnowAnswer .hk-fill{height:100%;background:var(--hk-green);border-radius:5px}
.homeKnowAnswer .hk-value{text-align:right;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:12px;color:#2d2d27}
.homeKnowAnswer .hk-caveats{padding:0 18px 14px;color:var(--hk-muted);font-size:12px;display:grid;gap:4px}
.homeKnowAnswer .hk-graphSvg{display:block;width:100%;height:auto;background:#fff}
.homeKnowAnswer .hk-node{fill:#EEF7EF;stroke:#C9E4D1;stroke-width:1.4}
.homeKnowAnswer .hk-edge{stroke:#7A8793;stroke-width:1.4;marker-end:url(#hkArrow)}
.homeKnowAnswer .hk-nodeText{font-size:11px;fill:#111827;font-weight:650}
.homeKnowAnswer .hk-edgeText{font-size:10px;fill:#6b7280}
.homeKnowAnswer .hk-citations{display:flex;flex-wrap:wrap;gap:7px;padding:10px 12px;border-top:1px solid var(--hk-line);background:var(--hk-soft)}
.homeKnowAnswer .hk-cite{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--hk-line);border-radius:999px;background:#fff;padding:4px 9px;color:var(--hk-muted);font-size:12px;cursor:pointer;max-width:100%;text-align:left}
.homeKnowAnswer .hk-cite:hover{border-color:#9fc7ee;color:#164b7a}
.homeKnowAnswer .hk-gapBox{background:var(--hk-amber-bg);border-color:#E9C77E;padding:13px 14px;display:grid;gap:8px}
.homeKnowAnswer .hk-gap{font-size:13px;color:#533814}
.homeKnowAnswer .hk-handoff{padding:16px;background:#F1F6FC;border-color:#B9D4EE;display:grid;gap:10px}
.homeKnowAnswer .hk-handoff h3{font-size:17px;margin:0}
.homeKnowAnswer .hk-handoff p{margin:0;color:#334155;line-height:1.55}
.homeKnowAnswer .hk-actions{display:flex;flex-wrap:wrap;gap:8px}
.homeKnowAnswer .hk-action{display:inline-flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid #B9D4EE;background:#fff;color:#0B4B88;text-decoration:none;padding:8px 11px;font-size:13px;font-weight:650}
.homeKnowAnswer .hk-drawer{padding:14px 16px;background:#fff}
.homeKnowAnswer .hk-drawer dl{display:grid;grid-template-columns:110px 1fr;gap:8px 12px;margin:0;font-size:13px}
.homeKnowAnswer .hk-drawer dt{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--hk-faint)}
.homeKnowAnswer .hk-drawer dd{margin:0;color:#2f2f2a}
.homeKnowAnswer .hk-evidenceToggle{border-top:1px solid var(--hk-line);padding-top:10px}
.homeKnowAnswer .hk-evidenceToggle summary{cursor:pointer;color:var(--hk-green);font-weight:700;font-size:13px;list-style:none}
.homeKnowAnswer .hk-evidenceToggle summary::-webkit-details-marker{display:none}
.homeKnowAnswer .hk-evidenceToggle summary::after{content:"";display:inline-block;width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);margin-left:8px;margin-bottom:2px}
.homeKnowAnswer .hk-evidenceToggle[open] summary::after{transform:rotate(225deg);margin-bottom:-1px}
.homeKnowAnswer .hk-evidenceBody{display:grid;gap:12px;margin-top:12px}
@media(max-width:720px){.homeKnowAnswer .hk-head{display:grid}.homeKnowAnswer .hk-barRow{grid-template-columns:1fr}.homeKnowAnswer .hk-value{text-align:left}.homeKnowAnswer .hk-drawer dl{grid-template-columns:1fr}}
`;

const BLOCKED_HOME_TEXT =
  /\b(contributing experts?|DORA|Wave-?0|P11|kill criteria|TIME x AI-fit|90-day pilot|local env|org_topology unavailable|roles_inventory unavailable|productivity (frame|lift)|decision frame|AI Platform owner|Knowledge Engineer|current visible run-cost basis is \$0|the cited record)\b/i;
const BLOCKED_HOME_TEXT_REPLACE =
  /\b(contributing experts?|DORA|Wave-?0|P11|kill criteria|TIME x AI-fit|90-day pilot|local env|org_topology unavailable|roles_inventory unavailable|productivity (frame|lift)|decision frame|AI Platform owner|Knowledge Engineer|current visible run-cost basis is \$0|the cited record)\b/gi;
const INTERNAL_CODE_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const INTERNAL_CODE_REPLACE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

function sanitizeHomeText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const text = String(value);
  const cleaned = text
    .replace(/(^|\n)\s*(Read|Evidence|Implication|Next move):\s*/gi, "$1")
    .replace(/\bmissing evidence path\b/gi, "missing source path")
    .replace(/\bevidence path\b/gi, "source path")
    .replace(/\bsource citations\b/gi, "source rows")
    .replace(/\bread-model\b/gi, "context model")
    .replace(/\bevidence\b/gi, "source support")
    .replace(BLOCKED_HOME_TEXT_REPLACE, "loaded context")
    .replace(INTERNAL_CODE_REPLACE, "source reference")
    .trim();
  return cleaned || "—";
}

function formatValue(
  value: string | number | boolean | null | undefined,
  column?: HomeKnowTableColumn,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return sanitizeHomeText(value);
  switch (column?.format) {
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

function alignmentClass(column: HomeKnowTableColumn): string {
  if (column.align === "right") return "right";
  if (column.align === "center") return "center";
  if (
    column.format === "number" ||
    column.format === "currency" ||
    column.format === "percent"
  )
    return "right";
  return "";
}

function citationsFor(
  ids: string[] | undefined,
  citations: HomeKnowCitation[],
): HomeKnowCitation[] {
  if (!ids?.length) return [];
  const byId = new Map(citations.map((citation) => [citation.id, citation]));
  return ids.flatMap((id) => {
    const citation = byId.get(id);
    return citation ? [citation] : [];
  });
}

function CitationChips({
  citations,
  onSelect,
}: {
  citations: HomeKnowCitation[];
  onSelect: (citation: HomeKnowCitation) => void;
}) {
  if (citations.length === 0) return null;
  return (
    <div className="hk-citations" aria-label="Sources">
      {citations.map((citation) => (
        <button
          className="hk-cite"
          key={citation.id}
          onClick={() => onSelect(citation)}
          title={citation.excerpt ?? citation.sourceFile ?? citation.label}
          type="button"
        >
          <span>{sanitizeHomeText(citation.label)}</span>
          <span aria-hidden="true">·</span>
          <span>{citation.sourceClass}</span>
        </button>
      ))}
    </div>
  );
}

function HomeTableExhibit({
  table,
  citations,
  onSelectCitation,
}: {
  table: HomeKnowTable;
  citations: HomeKnowCitation[];
  onSelectCitation: (citation: HomeKnowCitation) => void;
}) {
  return (
    <div className="hk-tableWrap">
      <div className="hk-exhibitHead">
        <div className="hk-exhibitTitle">{sanitizeHomeText(table.title)}</div>
        <div className="hk-exhibitMeta">
          {sanitizeHomeText(table.dimensionId)}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th
                className={alignmentClass(column)}
                key={column.key}
                scope="col"
              >
                {sanitizeHomeText(column.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {table.columns.map((column) => (
                <td className={alignmentClass(column)} key={column.key}>
                  {formatValue(row[column.key], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.note ? (
        <div className="hk-note">{sanitizeHomeText(table.note)}</div>
      ) : null}
      <CitationChips citations={citations} onSelect={onSelectCitation} />
    </div>
  );
}

function HomeChartExhibit({
  chart,
  citations,
  onSelectCitation,
}: {
  chart: HomeKnowChart;
  citations: HomeKnowCitation[];
  onSelectCitation: (citation: HomeKnowCitation) => void;
}) {
  const max = Math.max(...chart.data.map((point) => point.value), 1);
  return (
    <div className="hk-chart">
      <div className="hk-exhibitHead">
        <div className="hk-exhibitTitle">{sanitizeHomeText(chart.title)}</div>
        <div className="hk-exhibitMeta">{chart.status}</div>
      </div>
      <div className="hk-bars" role="img" aria-label={chart.title}>
        {chart.data.map((point, index) => {
          const width = `${Math.max(3, Math.round((point.value / max) * 100))}%`;
          return (
            <div className="hk-barRow" key={`${point.label}-${index}`}>
              <div className="hk-barLabel" title={point.label}>
                {sanitizeHomeText(point.label)}
              </div>
              <div className="hk-track">
                <div
                  className="hk-fill"
                  style={{ width, background: point.color ?? undefined }}
                />
              </div>
              <div className="hk-value">
                {formatValue(point.value, {
                  key: "value",
                  label: "Value",
                  format: "number",
                })}
              </div>
            </div>
          );
        })}
      </div>
      {chart.caveats.length > 0 ? (
        <div className="hk-caveats">
          {chart.caveats.map((caveat) => (
            <div key={caveat}>{sanitizeHomeText(caveat)}</div>
          ))}
        </div>
      ) : null}
      <CitationChips citations={citations} onSelect={onSelectCitation} />
    </div>
  );
}

function HomeGraphExhibit({
  graph,
  citations,
  onSelectCitation,
}: {
  graph: HomeKnowGraph;
  citations: HomeKnowCitation[];
  onSelectCitation: (citation: HomeKnowCitation) => void;
}) {
  const nodes = graph.nodes.slice(0, 12);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .slice(0, 16);
  const width = 760;
  const height = Math.max(280, Math.ceil(nodes.length / 2) * 78 + 54);
  const positions = new Map(
    nodes.map((node, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return [
        node.id,
        {
          x: column === 0 ? 170 : 590,
          y: 58 + row * 78,
        },
      ] as const;
    }),
  );
  return (
    <div className="hk-graph">
      <div className="hk-exhibitHead">
        <div className="hk-exhibitTitle">{sanitizeHomeText(graph.title)}</div>
        <div className="hk-exhibitMeta">
          {nodes.length} nodes · {edges.length} links · {graph.confidence}
        </div>
      </div>
      <svg
        className="hk-graphSvg"
        role="img"
        aria-label={graph.title}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <marker
            id="hkArrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#7A8793" />
          </marker>
        </defs>
        {edges.map((edge, index) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - 7;
          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line
                className="hk-edge"
                x1={from.x + 92}
                x2={to.x - 92}
                y1={from.y}
                y2={to.y}
              />
              <text
                className="hk-edgeText"
                textAnchor="middle"
                x={midX}
                y={midY}
              >
                {sanitizeHomeText(edge.label).slice(0, 42)}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return null;
          return (
            <g key={node.id}>
              <rect
                className="hk-node"
                height="42"
                rx="8"
                width="184"
                x={position.x - 92}
                y={position.y - 21}
              />
              <text
                className="hk-nodeText"
                textAnchor="middle"
                x={position.x}
                y={position.y + 4}
              >
                {sanitizeHomeText(node.label).slice(0, 26)}
              </text>
            </g>
          );
        })}
      </svg>
      {graph.gaps.length > 0 ? (
        <div className="hk-note">
          {graph.gaps.map(sanitizeHomeText).join(" · ")}
        </div>
      ) : null}
      <CitationChips citations={citations} onSelect={onSelectCitation} />
    </div>
  );
}

function GapPanel({ gaps }: { gaps: HomeKnowGap[] }) {
  if (gaps.length === 0) return null;
  return (
    <div className="hk-gapBox">
      <div className="hk-title">Source gaps</div>
      {gaps.slice(0, 5).map((gap) => (
        <div className="hk-gap" key={gap.id}>
          <strong>{sanitizeHomeText(gap.displayLabel)}</strong>:{" "}
          {sanitizeHomeText(gap.message)}
        </div>
      ))}
    </div>
  );
}

function HandoffBanner({ response }: { response: HomeKnowResponse }) {
  const handoff = response.handoff;
  if (!handoff || response.intent !== "decision_handoff") return null;
  const href =
    handoff.target === "moves"
      ? "/strategic-moves"
      : handoff.target === "tower"
        ? "/tower"
        : "/intelligence/ask";
  return (
    <div className="hk-handoff">
      <h3>{sanitizeHomeText(handoff.label)}</h3>
      <p>{sanitizeHomeText(handoff.reason)}</p>
      <div className="hk-actions">
        <a className="hk-action" href={href}>
          Open {handoff.target ?? "Intelligence"}
        </a>
        <a className="hk-action" href="/home">
          Show loaded facts first
        </a>
      </div>
    </div>
  );
}

function SourceDrawer({ citation }: { citation: HomeKnowCitation | null }) {
  if (!citation) return null;
  return (
    <div className="hk-drawer" aria-label="Source details">
      <div className="hk-title" style={{ marginBottom: 10 }}>
        Source details
      </div>
      <dl>
        <dt>Label</dt>
        <dd>{sanitizeHomeText(citation.label)}</dd>
        <dt>Class</dt>
        <dd>{citation.sourceClass}</dd>
        <dt>File</dt>
        <dd>
          {sanitizeHomeText(citation.sourceFile ?? "Source file not provided")}
        </dd>
        <dt>Row</dt>
        <dd>{citation.sourceRowNumber ?? "—"}</dd>
        <dt>Confidence</dt>
        <dd>{citation.confidence ?? "—"}</dd>
        <dt>Excerpt</dt>
        <dd>{sanitizeHomeText(citation.excerpt ?? "No excerpt provided")}</dd>
      </dl>
    </div>
  );
}

function frontendFallbackProse(response: HomeKnowResponse): string | null {
  const isEmptyDossier =
    response.answerStatus === "no_data" &&
    response.safety.evidenceStatus === "empty_dossier" &&
    response.safety.usableEvidence === false;
  if (isEmptyDossier) return "I do not see that in the loaded data.";
  if (
    response.safety.frontendTripwireShouldFire ||
    BLOCKED_HOME_TEXT.test(response.prose) ||
    INTERNAL_CODE_RE.test(response.prose)
  ) {
    return "This Home answer needs validation before it can be shown.";
  }
  return null;
}

function shouldOpenEvidence(
  _response: HomeKnowResponse,
  compact: boolean,
): boolean {
  if (compact) return false;
  return false;
}

function statusLabel(response: HomeKnowResponse): string {
  if (response.handoff) return "Best answered in Intelligence";
  if (response.answerStatus === "answered")
    return "Answered from loaded context";
  if (response.answerStatus === "partial") return "Partial answer";
  if (response.answerStatus === "no_data") return "Missing source detail";
  return "Review needed";
}

export function HomeKnowAnswerRenderer({
  compact = false,
  response,
}: {
  compact?: boolean;
  response: HomeKnowResponse;
}) {
  const [selectedCitation, setSelectedCitation] =
    useState<HomeKnowCitation | null>(null);
  const safeProse = useMemo(() => {
    const fallback = frontendFallbackProse(response);
    if (fallback) return fallback;
    return sanitizeHomeText(response.prose);
  }, [response]);
  const visibleCitations = response.citations;
  const tableCount = response.tables.length;
  const chartCount = response.charts.length;
  const graphCount = response.graphs.length;

  const hasEvidence =
    tableCount + chartCount + graphCount > 0 ||
    response.gaps.length > 0 ||
    visibleCitations.length > 0;
  const evidenceOpen = shouldOpenEvidence(response, compact);
  const exhibitLabel =
    tableCount + chartCount + graphCount > 0
      ? `Show source details (${tableCount} table${tableCount === 1 ? "" : "s"}, ${chartCount} chart${chartCount === 1 ? "" : "s"}, ${graphCount} graph${graphCount === 1 ? "" : "s"})`
      : "Show source details";

  return (
    <section
      className={`homeKnowAnswer${compact ? " compact" : ""}`}
      aria-label="Home KNOW answer"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hk-card">
        <header className="hk-head">
          <div>
            <div className="hk-kicker">aVa</div>
            <div className="hk-meta" aria-label="Answer metadata">
              <span className="hk-pill good">{statusLabel(response)}</span>
            </div>
          </div>
        </header>

        <HandoffBanner response={response} />

        {safeProse ? <div className="hk-prose">{safeProse}</div> : null}

        {hasEvidence ? (
          <details className="hk-evidenceToggle" open={evidenceOpen}>
            <summary>{exhibitLabel}</summary>
            <div className="hk-evidenceBody">
              {tableCount > 0 ? (
                <div className="hk-section">
                  <div className="hk-title">Tables</div>
                  {response.tables.map((table) => (
                    <HomeTableExhibit
                      citations={citationsFor(
                        table.citationIds,
                        visibleCitations,
                      )}
                      key={table.id}
                      onSelectCitation={setSelectedCitation}
                      table={table}
                    />
                  ))}
                </div>
              ) : null}

              {chartCount > 0 ? (
                <div className="hk-section">
                  <div className="hk-title">Charts</div>
                  {response.charts.map((chart) => (
                    <HomeChartExhibit
                      chart={chart}
                      citations={citationsFor(
                        chart.citationIds,
                        visibleCitations,
                      )}
                      key={chart.id}
                      onSelectCitation={setSelectedCitation}
                    />
                  ))}
                </div>
              ) : null}

              {graphCount > 0 ? (
                <div className="hk-section">
                  <div className="hk-title">Graphs</div>
                  {response.graphs.map((graph) => (
                    <HomeGraphExhibit
                      citations={citationsFor(
                        graph.citationIds,
                        visibleCitations,
                      )}
                      graph={graph}
                      key={graph.id}
                      onSelectCitation={setSelectedCitation}
                    />
                  ))}
                </div>
              ) : null}

              <GapPanel gaps={response.gaps} />

              {tableCount + chartCount + graphCount === 0 &&
              visibleCitations.length > 0 ? (
                <div className="hk-section">
                  <div className="hk-title">Sources</div>
                  <CitationChips
                    citations={visibleCitations}
                    onSelect={setSelectedCitation}
                  />
                </div>
              ) : null}

              <SourceDrawer citation={selectedCitation} />
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

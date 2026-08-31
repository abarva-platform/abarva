import * as SvgCharts from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import { builderForChartKind } from "@/lib/intelligence/answer/chart-kind-builders";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import type {
  AvaChatSessionExport,
  AvaChatSessionExportStats,
} from "@/lib/ava-answer/export/session-types";
import { cleanAvaExportText } from "@/lib/ava-answer/export/render-text";

type SvgBuilderName = Extract<keyof typeof SvgCharts, string>;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isSvgBuilderName(name: string): name is SvgBuilderName {
  return typeof SvgCharts[name as SvgBuilderName] === "function";
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

export function renderAnswerChartSvgForExport(chart: AnswerChart): {
  builderName: string;
  svg: string | null;
  error?: string;
} {
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
    return svg.trimStart().startsWith("<svg")
      ? { builderName, svg }
      : { builderName, svg: null, error: `${builderName} did not return SVG` };
  } catch (err) {
    return {
      builderName,
      svg: null,
      error: err instanceof Error ? err.message : "Chart builder failed",
    };
  }
}

function isRenderableExportChart(
  chart: AnswerChart,
): chart is AnswerChart & { artifact: "chart" } {
  return renderAnswerChartSvgForExport(chart).svg !== null;
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
  if (column.format === "text") return null;
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
  if (/\b(count|employees?|users?|records?|volume|number)\b/.test(name)) {
    return "number";
  }
  return null;
}

function trimCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2,
  }).format(value);
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

function formatCell(
  value: string | number | null,
  column: AnswerTableColumn,
): string {
  if (value === null) return "-";
  const numeric = parseNumericCellValue(value);
  const format = inferredCellFormat(column);
  if (numeric !== null && format === "currency")
    return formatCompactUsd(numeric);
  if (numeric !== null && format === "percent") return formatPercent(numeric);
  if (numeric !== null && format === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      numeric,
    );
  }
  return String(value);
}

function proseHtml(text: string): string {
  return cleanAvaExportText(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${esc(paragraph)}</p>`)
    .join("");
}

function listHtml(label: string, rows: readonly string[]): string {
  const visible = rows
    .map((row) => row.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (visible.length === 0) return "";
  return `<section class="card compact"><h2>${esc(label)}</h2><ul>${visible
    .map((row) => `<li>${esc(row)}</li>`)
    .join("")}</ul></section>`;
}

function caveatRows(answer: AvaAnswerPacket): string[] {
  return answer.caveats.map((caveat) =>
    [caveat.label, caveat.detail].filter(Boolean).join(" — "),
  );
}

function nextStepRows(answer: AvaAnswerPacket): string[] {
  return answer.nextSteps.map((step) =>
    [step.label, step.rationale].filter(Boolean).join(" — "),
  );
}

function tableHtml(table: AnswerTable): string {
  const head = table.columns
    .map((column) => `<th>${esc(column.label)}</th>`)
    .join("");
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${table.columns
          .map(
            (column) =>
              `<td>${esc(formatCell(row[column.key] ?? null, column))}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<section class="card"><h2>${esc(table.title ?? "Table")}</h2><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${
    table.note ? `<p class="note">${esc(table.note)}</p>` : ""
  }</section>`;
}

function chartHtml(chart: AnswerChart): string {
  const rendered = renderAnswerChartSvgForExport(chart);
  return `<section class="card"><h2>${esc(chart.title ?? chart.kind)}</h2>${
    chart.subtitle ? `<p class="note">${esc(chart.subtitle)}</p>` : ""
  }${
    rendered.svg
      ? `<div class="svg">${rendered.svg}</div>`
      : `<p class="note">Chart unavailable: ${esc(rendered.error)}</p>`
  }</section>`;
}

function graphSvgHtml(graph: AnswerGraph): string {
  const nodes = graph.nodes.slice(0, 14);
  if (nodes.length === 0) {
    return `<p class="note">No graph nodes available.</p>`;
  }

  const width = 900;
  const height = Math.max(260, Math.ceil(nodes.length / 2) * 86 + 46);
  const positions = new Map(
    nodes.map((node, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      return [
        node.id,
        {
          x: col === 0 ? 210 : 690,
          y: 58 + row * 86,
          label: node.label,
          kind: node.kind,
        },
      ] as const;
    }),
  );

  const edgeHtml = graph.edges
    .slice(0, 18)
    .map((edge, index) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 8;
      return `<g>
<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#74839a" stroke-width="2" marker-end="url(#arrow)"/>
${
  edge.label
    ? `<text x="${midX}" y="${midY - (index % 2) * 8}" text-anchor="middle" font-size="12" fill="#526072">${esc(edge.label)}</text>`
    : ""
}
</g>`;
    })
    .join("");

  const nodeHtml = nodes
    .map((node) => {
      const position = positions.get(node.id);
      if (!position) return "";
      const label = esc(node.label);
      const kind = position.kind
        ? `<tspan x="${position.x}" dy="16" font-size="11" fill="#6b7280">${esc(position.kind)}</tspan>`
        : "";
      return `<g>
<rect x="${position.x - 150}" y="${position.y - 27}" width="300" height="54" rx="12" fill="#f0faf4" stroke="#cfe8d7"/>
<text x="${position.x}" y="${position.y - 3}" text-anchor="middle" font-size="13" font-weight="700" fill="#111827">${label}${kind}</text>
</g>`;
    })
    .join("");

  return `<div class="graph-visual"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(graph.title ?? "Relationship graph")}">
<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#74839a"/></marker></defs>
${edgeHtml}
${nodeHtml}
</svg></div>`;
}

function graphHtml(graph: AnswerGraph): string {
  return `<section class="card"><h2>${esc(graph.title ?? "Relationship graph")}</h2>${graphSvgHtml(graph)}<ul class="graph">${graph.edges
    .slice(0, 16)
    .map((edge) => {
      const from =
        graph.nodes.find((node) => node.id === edge.from)?.label ?? edge.from;
      const to =
        graph.nodes.find((node) => node.id === edge.to)?.label ?? edge.to;
      return `<li><strong>${esc(from)}</strong> -> ${esc(to)}${
        edge.label ? ` <span>${esc(edge.label)}</span>` : ""
      }</li>`;
    })
    .join("")}</ul></section>`;
}

function citationHtml(citations: readonly AnswerCitation[]): string {
  if (citations.length === 0) return "";
  return `<section class="card compact"><h2>Evidence Used</h2><ul>${citations
    .slice(0, 24)
    .map(
      (citation) =>
        `<li><strong>${esc(citation.label)}</strong>${
          citation.excerpt ? ` — ${esc(citation.excerpt)}` : ""
        }</li>`,
    )
    .join("")}</ul></section>`;
}

function answerBodyHtml(answer: AvaAnswerPacket): string {
  const display = sanitizeAvaAnswerForRender(answer);
  const artifacts = display.artifacts.filter(isVisibleAvaArtifact);
  const charts = artifacts
    .filter(
      (artifact): artifact is AnswerChart & { artifact: "chart" } =>
        artifact.artifact === "chart",
    )
    .filter(isRenderableExportChart);
  const graphs = artifacts.filter((artifact) => artifact.artifact === "graph");
  const tables = artifacts.filter((artifact) => artifact.artifact === "table");

  return `<section class="prose">${proseHtml(display.directAnswer)}</section>
${charts.map(chartHtml).join("")}
${graphs.map(graphHtml).join("")}
${tables.map(tableHtml).join("")}
${listHtml("Caveats", caveatRows(display))}
${listHtml("Recommended Next Moves", nextStepRows(display))}
${citationHtml(display.citations)}`;
}

function sessionStats(
  session: AvaChatSessionExport,
): AvaChatSessionExportStats {
  const answers = session.turns.flatMap((turn) =>
    turn.answer ? [turn.answer] : [],
  );
  const visibleArtifacts = answers.flatMap((answer) =>
    sanitizeAvaAnswerForRender(answer).artifacts.filter(isVisibleAvaArtifact),
  );
  return {
    userTurns: session.turns.filter((turn) => turn.role === "user").length,
    agentTurns: session.turns.filter((turn) => turn.role === "agent").length,
    answerPackets: answers.length,
    charts: visibleArtifacts
      .filter(
        (artifact): artifact is AnswerChart & { artifact: "chart" } =>
          artifact.artifact === "chart",
      )
      .filter(isRenderableExportChart).length,
    tables: visibleArtifacts.filter((artifact) => artifact.artifact === "table")
      .length,
    graphs: visibleArtifacts.filter((artifact) => artifact.artifact === "graph")
      .length,
    citations: answers.reduce(
      (sum, answer) => sum + answer.citations.length,
      0,
    ),
    blockedAnswers: answers.filter((answer) => answer.status === "blocked")
      .length,
    warningFindings: answers.reduce(
      (sum, answer) =>
        sum +
        (answer.quality.cxo?.findings.filter(
          (finding) => finding.severity === "warning",
        ).length ?? 0),
      0,
    ),
  };
}

function documentChrome({
  title,
  eyebrow,
  metaHtml,
  bodyHtml,
}: {
  title: string;
  eyebrow: string;
  metaHtml: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
body{font-family:Inter,Arial,sans-serif;margin:0;background:#f7f5ef;color:#111827}
main{max-width:980px;margin:0 auto;padding:40px 24px 64px}
header{border-bottom:1px solid #d8d5cc;margin-bottom:24px;padding-bottom:16px}
.eyebrow{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#166534;font-weight:800}
h1{font-family:Georgia,serif;font-size:30px;margin:8px 0 10px}
h2{font-family:Georgia,serif;font-size:20px;margin:0 0 14px}
.meta{display:flex;flex-wrap:wrap;gap:8px;color:#4b5563;font-size:12px}
.pill{border:1px solid #d8d5cc;border-radius:999px;padding:4px 10px;background:#fff}
.prose{font-size:15px;line-height:1.65;margin-bottom:20px}
.card{background:#fff;border:1px solid #d8d5cc;border-radius:8px;margin:18px 0;padding:18px;break-inside:avoid}
.compact{padding:14px 18px}
.turn{border-left:4px solid #d8d5cc;padding-left:16px;margin:24px 0}
.turn.user{border-left-color:#111827}
.turn.agent{border-left-color:#166534}
.turn-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:#6b7280;margin-bottom:6px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:18px 0}
.stat{background:#fff;border:1px solid #d8d5cc;border-radius:8px;padding:12px}
.stat b{display:block;font-size:20px;font-family:Georgia,serif}
.stat span{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em}
.svg svg{display:block;width:100%;height:auto}
.graph-visual{background:#fff;border:1px solid #e5e1d8;border-radius:8px;padding:12px;margin-bottom:14px}
.graph-visual svg{display:block;width:100%;height:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:9px 10px;border-bottom:1px solid #e5e1d8;text-align:left;vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#faf9f5}
.note,.builder{color:#6b7280;font-size:12px}
.graph{padding-left:18px;line-height:1.6}
ul{margin:0;padding-left:20px;line-height:1.55}
footer{border-top:1px solid #d8d5cc;color:#6b7280;font-size:11px;margin-top:30px;padding-top:14px}
@media print{body{background:#fff}main{padding:20px}.card,.turn{page-break-inside:avoid}}
</style>
</head>
<body>
<main>
<header>
<div class="eyebrow">${esc(eyebrow)}</div>
<h1>${esc(title)}</h1>
<div class="meta">${metaHtml}</div>
</header>
${bodyHtml}
<footer>AbarVa aVa export. Decision-support artifact; accountable owners remain responsible for review, approval, and external use.</footer>
</main>
</body>
</html>`;
}

export function renderAvaAnswerStandaloneHtml(answer: AvaAnswerPacket): string {
  const display = sanitizeAvaAnswerForRender(answer);
  const generatedAt = new Date().toISOString();
  const surfaceLabel =
    display.surface.charAt(0).toUpperCase() + display.surface.slice(1);

  return documentChrome({
    eyebrow: `aVa ${surfaceLabel} Export`,
    title: display.question,
    metaHtml: [
      display.tenantKey,
      display.status,
      `${display.quality.confidence} confidence`,
      generatedAt,
    ]
      .map((value) => `<span class="pill">${esc(value)}</span>`)
      .join(""),
    bodyHtml: answerBodyHtml(display),
  });
}

export function renderAvaChatSessionStandaloneHtml(
  session: AvaChatSessionExport,
): string {
  const generatedAt = new Date().toISOString();
  const stats = sessionStats(session);
  const title = session.title?.trim() || "aVa Executive Session Export";
  const tenant =
    session.tenantKey?.trim() ||
    session.turns.find((turn) => turn.answer)?.answer?.tenantKey ||
    "tenant";
  const bodyHtml = `<section class="stats" aria-label="Export summary">
<div class="stat"><b>${stats.userTurns}</b><span>User turns</span></div>
<div class="stat"><b>${stats.agentTurns}</b><span>aVa turns</span></div>
<div class="stat"><b>${stats.answerPackets}</b><span>Governed answers</span></div>
<div class="stat"><b>${stats.charts + stats.tables + stats.graphs}</b><span>Visual artifacts</span></div>
<div class="stat"><b>${stats.citations}</b><span>Evidence refs</span></div>
<div class="stat"><b>${stats.blockedAnswers}</b><span>Blocked answers</span></div>
</section>
${session.turns
  .map((turn, index) => {
    if (turn.role === "user") {
      return `<section class="turn user"><div class="turn-label">User prompt ${index + 1}</div><div class="prose">${proseHtml(
        turn.body,
      )}</div></section>`;
    }
    return `<section class="turn agent"><div class="turn-label">aVa response ${index + 1}</div>${
      turn.answer
        ? answerBodyHtml(turn.answer)
        : `<div class="prose">${proseHtml(turn.body)}</div>`
    }</section>`;
  })
  .join("")}`;

  return documentChrome({
    eyebrow: `aVa ${session.surface.charAt(0).toUpperCase() + session.surface.slice(1)} Session Export`,
    title,
    metaHtml: [
      tenant,
      session.surface,
      `${session.turns.length} turns`,
      `${stats.answerPackets} governed answers`,
      generatedAt,
    ]
      .map((value) => `<span class="pill">${esc(value)}</span>`)
      .join(""),
    bodyHtml,
  });
}

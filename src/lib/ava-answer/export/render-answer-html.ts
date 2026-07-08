import * as SvgCharts from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import { builderForChartKind } from "@/lib/intelligence/answer/chart-kind-builders";
import type {
  AnswerChart,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";

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
  const builderName = builderForChartKind(chart.kind);
  if (!isSvgBuilderName(builderName)) {
    return { builderName, svg: null, error: `No SVG builder named ${builderName}` };
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

function formatCell(value: string | number | null, column: AnswerTableColumn): string {
  if (value === null) return "-";
  const numeric = parseNumericCellValue(value);
  const format = inferredCellFormat(column);
  if (numeric !== null && format === "currency") return formatCompactUsd(numeric);
  if (numeric !== null && format === "percent") return formatPercent(numeric);
  if (numeric !== null && format === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      numeric,
    );
  }
  return String(value);
}

function proseHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${esc(paragraph)}</p>`)
    .join("");
}

function tableHtml(table: AnswerTable): string {
  const head = table.columns
    .map((column) => `<th>${esc(column.label)}</th>`)
    .join("");
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${table.columns
          .map((column) => `<td>${esc(formatCell(row[column.key] ?? null, column))}</td>`)
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
    rendered.svg
      ? `<div class="svg">${rendered.svg}</div>`
      : `<p class="note">Chart unavailable: ${esc(rendered.error)}</p>`
  }<p class="builder">${esc(rendered.builderName)}</p></section>`;
}

function graphHtml(graph: AnswerGraph): string {
  return `<section class="card"><h2>${esc(graph.title ?? "Relationship graph")}</h2><ul class="graph">${graph.edges
    .slice(0, 16)
    .map((edge) => {
      const from = graph.nodes.find((node) => node.id === edge.from)?.label ?? edge.from;
      const to = graph.nodes.find((node) => node.id === edge.to)?.label ?? edge.to;
      return `<li><strong>${esc(from)}</strong> -> ${esc(to)}${
        edge.label ? ` <span>${esc(edge.label)}</span>` : ""
      }</li>`;
    })
    .join("")}</ul></section>`;
}

export function renderAvaAnswerStandaloneHtml(answer: AvaAnswerPacket): string {
  const display = sanitizeAvaAnswerForRender(answer);
  const artifacts = display.artifacts.filter(isVisibleAvaArtifact);
  const charts = artifacts.filter((artifact) => artifact.artifact === "chart");
  const graphs = artifacts.filter((artifact) => artifact.artifact === "graph");
  const tables = artifacts.filter((artifact) => artifact.artifact === "table");
  const generatedAt = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(display.tenantKey)} aVa answer export</title>
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
.svg svg{display:block;width:100%;height:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:9px 10px;border-bottom:1px solid #e5e1d8;text-align:left;vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#faf9f5}
.note,.builder{color:#6b7280;font-size:12px}
.graph{padding-left:18px;line-height:1.6}
@media print{body{background:#fff}main{padding:20px}.card{page-break-inside:avoid}}
</style>
</head>
<body>
<main>
<header>
<div class="eyebrow">aVa Intelligence Export</div>
<h1>${esc(display.question)}</h1>
<div class="meta">
<span class="pill">${esc(display.tenantKey)}</span>
<span class="pill">${esc(display.status)}</span>
<span class="pill">${esc(display.quality.confidence)} confidence</span>
<span class="pill">${esc(generatedAt)}</span>
</div>
</header>
<section class="prose">${proseHtml(display.directAnswer)}</section>
${charts.map(chartHtml).join("")}
${graphs.map(graphHtml).join("")}
${tables.map(tableHtml).join("")}
</main>
</body>
</html>`;
}

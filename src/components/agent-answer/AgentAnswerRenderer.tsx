"use client";

import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
.agentAnswer .aaChart,.agentAnswer .aaGraph,.agentAnswer .aaTableWrap{border:1px solid var(--aa-line);border-radius:12px;background:var(--aa-paper);box-shadow:0 1px 2px rgba(16,24,40,.05),0 14px 34px rgba(16,24,40,.07);overflow:hidden}
.agentAnswer .aaChartHead,.agentAnswer .aaTableHead,.agentAnswer .aaGraphHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:13px 15px;border-bottom:1px solid var(--aa-line);background:linear-gradient(180deg,var(--aa-soft-2),var(--aa-soft))}
.agentAnswer .aaChartTitle,.agentAnswer .aaGraphTitle,.agentAnswer .aaTableTitle{font-size:14px;font-weight:800;line-height:1.35}
.agentAnswer .aaChartSubtitle{margin-top:3px;font-size:12px;color:var(--aa-muted);line-height:1.45}
.agentAnswer .aaArtifactBadge{display:inline-flex;align-items:center;white-space:nowrap;border:1px solid #bfd4ee;border-radius:999px;background:var(--aa-blue-bg);color:var(--aa-blue);padding:4px 9px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.agentAnswer .aaSvg{padding:16px;background:radial-gradient(circle at 20% 0%,#ffffff 0,#ffffff 42%,#fbfcfd 100%);overflow-x:auto}
.agentAnswer .aaSvg svg{display:block;width:100%;height:auto;min-width:520px}
.agentAnswer .aaRechart{height:var(--aa-chart-height,320px);min-width:0;padding:18px 18px 12px;background:radial-gradient(circle at 20% 0%,#ffffff 0,#ffffff 42%,#fbfcfd 100%)}
.agentAnswer .aaRechart .recharts-wrapper{font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif}
.agentAnswer .aaRechart .recharts-cartesian-axis-tick-value{fill:#5f6b7a;font-size:11px}
.agentAnswer .aaRechart .recharts-label-list text,.agentAnswer .aaRechart .recharts-scatter-symbol{font-size:11px;font-weight:800}
.agentAnswer .aaChartKey{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 14px;padding:0 18px 14px;color:var(--aa-muted);font-size:12px;line-height:1.35}
.agentAnswer .aaChartKeyItem{display:flex;gap:7px;min-width:0}
.agentAnswer .aaChartKeyIndex{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:0 0 auto;border-radius:999px;background:#e8f3ed;color:#166534;font-size:10px;font-weight:900}
.agentAnswer .aaChartKeyLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.agentAnswer .aaValueProofExhibit{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(220px,.55fr);gap:14px;padding:16px;background:radial-gradient(circle at 12% 0%,#ffffff 0,#ffffff 38%,#fbfcfd 100%)}
.agentAnswer .aaValueProofChart{border:1px solid var(--aa-line);border-radius:10px;overflow:hidden;background:#fff}
.agentAnswer .aaValueProofChart .aaRechart{border:0;box-shadow:none;background:transparent;padding:14px 16px 10px}
.agentAnswer .aaProofLadder{display:grid;gap:8px;align-content:start}
.agentAnswer .aaProofStep{display:grid;gap:6px;border:1px solid var(--aa-line);border-radius:10px;background:#fff;padding:10px 11px;box-shadow:0 8px 22px rgba(16,24,40,.06)}
.agentAnswer .aaProofStep[data-posture='blocked'],.agentAnswer .aaProofStep[data-posture='gated']{border-color:#f0c7c7;background:#fff8f8}
.agentAnswer .aaProofStep[data-posture='partial'],.agentAnswer .aaProofStep[data-posture='validate']{border-color:#ead4a8;background:#fffaf0}
.agentAnswer .aaProofStep[data-posture='claimable'],.agentAnswer .aaProofStep[data-posture='scale']{border-color:#b9dac6;background:#f6fbf8}
.agentAnswer .aaProofStepTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.agentAnswer .aaProofStepLabel{font-size:12px;font-weight:850;line-height:1.25}
.agentAnswer .aaProofStepValue{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:12px;font-weight:900;white-space:nowrap;color:#111827}
.agentAnswer .aaProofStepMeta{font-size:11px;line-height:1.3;color:var(--aa-muted)}
.agentAnswer .aaProofTrack{height:6px;border-radius:999px;background:#e7e5df;overflow:hidden}
.agentAnswer .aaProofTrackFill{height:100%;border-radius:999px;background:#166534}
.agentAnswer .aaQuadrantLabels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 18px 10px}
.agentAnswer .aaQuadrantLabel{border:1px solid var(--aa-line);border-radius:9px;background:#fff;padding:8px 9px;color:var(--aa-muted);font-size:11px;line-height:1.3}
.agentAnswer .aaQuadrantLabel strong{display:block;color:var(--aa-ink);font-size:12px}
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
@media (max-width: 820px){.agentAnswer .aaValueProofExhibit{grid-template-columns:1fr}.agentAnswer .aaQuadrantLabels{grid-template-columns:1fr}.agentAnswer .aaChartHead{align-items:flex-start}.agentAnswer .aaArtifactBadge{white-space:normal;text-align:right}}
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

type RechartPrimitive = string | number;
type RechartRow = Record<string, RechartPrimitive>;

const RECHART_COLORS = [
  "#14532d",
  "#1d4ed8",
  "#d97706",
  "#7c3aed",
  "#0f766e",
  "#be123c",
  "#475569",
] as const;

const RECHART_TOOLTIP_STYLE = {
  border: "1px solid #d6dbe3",
  borderRadius: 10,
  boxShadow: "0 12px 30px rgba(15,23,42,.12)",
  color: "#111827",
  fontSize: 12,
} as const;

function isRechartPrimitive(value: unknown): value is RechartPrimitive {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function toRechartRows(value: unknown): RechartRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry): RechartRow[] => {
      if (!isRecord(entry)) return [];
      const row = Object.entries(entry).reduce<RechartRow>(
        (accumulator, [key, cell]) => {
          if (isRechartPrimitive(cell)) accumulator[key] = cell;
          return accumulator;
        },
        {},
      );
      return Object.keys(row).length > 0 ? [row] : [];
    })
    .slice(0, 12);
}

function numericRowValue(row: RechartRow, key: string): number | null {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function inferLabelKey(rows: RechartRow[]): string | null {
  const sample = rows[0];
  if (!sample) return null;
  return (
    Object.keys(sample).find((key) =>
      rows.some((row) => typeof row[key] === "string"),
    ) ??
    Object.keys(sample)[0] ??
    null
  );
}

function inferNumericKey(rows: RechartRow[], labelKey: string): string | null {
  const sample = rows[0];
  if (!sample) return null;
  return (
    Object.keys(sample).find(
      (key) =>
        key !== labelKey &&
        rows.filter((row) => numericRowValue(row, key) !== null).length >= 2,
    ) ?? null
  );
}

function chartDataRecord(chart: AnswerChart): Record<string, unknown> | null {
  return isRecord(chart.data) ? chart.data : null;
}

interface RechartSeries {
  rows: RechartRow[];
  xKey: string;
  yKey: string;
  yKey2?: string;
  unit?: string;
  horizontal: boolean;
}

function shortAxisLabel(value: unknown, maxLength = 24): string {
  const label = String(value ?? "");
  return label.length > maxLength
    ? `${label.slice(0, maxLength - 1).trimEnd()}...`
    : label;
}

function horizontalAxisWidth(rows: RechartRow[], key: string): number {
  const longest = rows.reduce(
    (max, row) => Math.max(max, String(row[key] ?? "").length),
    0,
  );
  return Math.min(220, Math.max(132, longest * 6.8));
}

function normalizeRechartSeries(chart: AnswerChart): RechartSeries | null {
  const record = chartDataRecord(chart);
  const rows = toRechartRows(record?.data ?? chart.data).map((row) => {
    const copy = { ...row };
    for (const key of Object.keys(copy)) {
      const parsed = numericRowValue(copy, key);
      if (parsed !== null && typeof copy[key] === "string") copy[key] = parsed;
    }
    return copy;
  });
  if (rows.length < 2) return null;

  const xKey =
    chart.xKey ??
    (typeof record?.xKey === "string" ? record.xKey : undefined) ??
    inferLabelKey(rows);
  if (!xKey) return null;
  const yKey =
    chart.yKey ??
    (typeof record?.yKey === "string" ? record.yKey : undefined) ??
    inferNumericKey(rows, xKey);
  if (!yKey) return null;

  const numericRows = rows.filter((row) => numericRowValue(row, yKey) !== null);
  if (numericRows.length < 2) return null;
  const secondaryKey = typeof record?.yKey2 === "string" ? record.yKey2 : "";
  const yKey2 =
    secondaryKey &&
    numericRows.some((row) => numericRowValue(row, secondaryKey) !== null)
      ? secondaryKey
      : undefined;

  return {
    rows: numericRows,
    xKey,
    yKey,
    yKey2,
    unit:
      chart.unit ??
      (typeof record?.unit === "string" ? record.unit : undefined),
    horizontal:
      chart.kind === "horizontal-bar" ||
      chart.kind === "cost-stack" ||
      chart.kind === "range-bar",
  };
}

interface RechartQuadrantPoint extends RechartRow {
  label: string;
  displayLabel: string;
  x: number;
  y: number;
}

function normalizeRechartQuadrant(chart: AnswerChart): RechartQuadrantPoint[] {
  const record = chartDataRecord(chart);
  const rawPoints = Array.isArray(record?.points) ? record.points : [];
  return rawPoints
    .flatMap((point): RechartQuadrantPoint[] => {
      if (!isRecord(point)) return [];
      const label = typeof point.label === "string" ? point.label.trim() : "";
      const x =
        typeof point.x === "number" && Number.isFinite(point.x)
          ? point.x
          : null;
      const y =
        typeof point.y === "number" && Number.isFinite(point.y)
          ? point.y
          : null;
      if (!label || x === null || y === null) return [];
      return [{ displayLabel: label, label, x, y }];
    })
    .slice(0, 12);
}

function quadrantDisplayPoints(
  points: RechartQuadrantPoint[],
): RechartQuadrantPoint[] {
  const shouldUseIndexLabels =
    points.length > 4 ||
    new Set(
      points.map(
        (point) => `${Math.round(point.x / 10)}:${Math.round(point.y / 10)}`,
      ),
    ).size < points.length;

  return points.map((point, index) => ({
    ...point,
    displayLabel: shouldUseIndexLabels
      ? String(index + 1)
      : point.label.length > 18
        ? `${point.label.slice(0, 16).trimEnd()}...`
        : point.label,
  }));
}

function canRenderRechartsChart(chart: AnswerChart): boolean {
  if (chart.kind === "quadrant-matrix" || chart.kind === "2x2-matrix") {
    return normalizeRechartQuadrant(chart).length >= 2;
  }
  if (
    chart.kind === "bar" ||
    chart.kind === "horizontal-bar" ||
    chart.kind === "line" ||
    chart.kind === "stacked-bar" ||
    chart.kind === "cost-stack" ||
    chart.kind === "range-bar"
  ) {
    return normalizeRechartSeries(chart) !== null;
  }
  return false;
}

function isRenderableAnswerChart(
  chart: AnswerChart,
): chart is AnswerChart & { artifact: "chart" } {
  return (
    canRenderRechartsChart(chart) || renderAnswerChartSvg(chart).svg !== null
  );
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

function formatRechartValue(value: unknown, unit?: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value ?? "");
  }
  const normalizedUnit = unit?.toLowerCase() ?? "";
  if (normalizedUnit === "%" || normalizedUnit.includes("percent")) {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }
  if (
    normalizedUnit.includes("usd") ||
    normalizedUnit.includes("dollar") ||
    normalizedUnit === "$"
  ) {
    return formatCompactUsd(value);
  }
  if (Math.abs(value) >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizePosture(value: unknown): string {
  const text = String(value ?? "").toLowerCase();
  if (
    /\b(block|gate|freeze|stop|zero|not claimable|not realized)\b/.test(text)
  ) {
    return "blocked";
  }
  if (/\b(partial|validate|forecast|planning|pending|fix)\b/.test(text)) {
    return "partial";
  }
  if (/\b(scale|claimable|attested|proved|protect)\b/.test(text)) {
    return "scale";
  }
  return "partial";
}

function rowDisplayLabel(row: RechartRow, key: string): string {
  return String(row[key] ?? "").trim();
}

function valueProofStatus(row: RechartRow): string {
  const keys = Object.keys(row);
  const statusKey =
    keys.find((key) => /claim/i.test(key) && /status/i.test(key)) ??
    keys.find((key) => /^status$/i.test(key)) ??
    keys.find((key) => /\bstatus\b/i.test(key)) ??
    keys.find((key) => /\bposture\b/i.test(key)) ??
    keys.find((key) => /\bgate\b/i.test(key)) ??
    keys.find((key) => /\bstage\b/i.test(key));
  return statusKey ? String(row[statusKey] ?? "") : "";
}

function isValueProofSeries(
  chart: AnswerChart,
  series: RechartSeries,
): boolean {
  const title = `${chart.title ?? ""} ${chart.subtitle ?? ""}`.toLowerCase();
  if (
    chart.kind === "waterfall" ||
    chart.kind === "value-bridge" ||
    /\b(value proof|value waterfall|value funnel|claimable|attestation|validated|realized|promised)\b/.test(
      title,
    )
  ) {
    return true;
  }
  const joinedLabels = series.rows
    .map((row) => rowDisplayLabel(row, series.xKey))
    .join(" ")
    .toLowerCase();
  const stageHits = [
    "committed",
    "forecast",
    "promised",
    "validated",
    "attested",
    "realized",
    "claimable",
    "blocked",
  ].filter((token) => joinedLabels.includes(token)).length;
  return stageHits >= 3;
}

function SafeAgentResponsiveContainer({
  children,
}: {
  children: ReactElement;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      setSize(width > 0 && height > 0 ? { width, height } : null);
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      const frame = window.requestAnimationFrame(update);
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%", minWidth: 1, minHeight: 1 }}
    >
      {size ? cloneElement(children, size) : null}
    </div>
  );
}

function ValueProofExhibit({
  chart,
  series,
}: {
  chart: AnswerChart;
  series: RechartSeries;
}) {
  const rows = series.rows.slice(0, 6);
  const maxValue = Math.max(
    1,
    ...rows.map((row) => numericRowValue(row, series.yKey) ?? 0),
  );
  const yAxisWidth = horizontalAxisWidth(rows, series.xKey);

  return (
    <div
      className="aaValueProofExhibit"
      data-chart-exhibit="value-proof-ladder"
    >
      <div className="aaValueProofChart">
        <div
          className="aaRechart"
          data-chart-kind={chart.kind}
          data-chart-renderer="recharts"
          style={
            {
              "--aa-chart-height": `${Math.max(300, rows.length * 42 + 96)}px`,
            } as CSSProperties
          }
        >
          <SafeAgentResponsiveContainer>
            <BarChart
              barCategoryGap={10}
              data={rows}
              layout="vertical"
              margin={{ top: 10, right: 54, bottom: 10, left: 4 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="#e5e7eb"
                strokeDasharray="3 3"
              />
              <XAxis
                domain={[0, maxValue]}
                tickFormatter={(value) =>
                  formatRechartValue(value, series.unit)
                }
                tickLine={false}
                type="number"
              />
              <YAxis
                dataKey={series.xKey}
                tickFormatter={(value) => shortAxisLabel(value, 30)}
                tickLine={false}
                type="category"
                width={yAxisWidth}
              />
              <Tooltip
                contentStyle={RECHART_TOOLTIP_STYLE}
                formatter={(value: unknown) => [
                  formatRechartValue(value, series.unit),
                  series.yKey,
                ]}
              />
              <Bar dataKey={series.yKey} radius={[0, 4, 4, 0]}>
                {rows.map((row, index) => (
                  <Cell
                    fill={
                      normalizePosture(valueProofStatus(row)) === "blocked"
                        ? "#b91c1c"
                        : normalizePosture(valueProofStatus(row)) === "partial"
                          ? "#d97706"
                          : RECHART_COLORS[index % RECHART_COLORS.length]
                    }
                    key={`${String(row[series.xKey])}-${index}`}
                  />
                ))}
                <LabelList
                  dataKey={series.yKey}
                  formatter={(value: unknown) =>
                    formatRechartValue(value, series.unit)
                  }
                  position="right"
                  style={{ fill: "#111827", fontSize: 11, fontWeight: 800 }}
                />
              </Bar>
            </BarChart>
          </SafeAgentResponsiveContainer>
        </div>
      </div>
      <div className="aaProofLadder" aria-label="Value proof ladder">
        {rows.map((row, index) => {
          const value = numericRowValue(row, series.yKey) ?? 0;
          const status = valueProofStatus(row);
          const posture = normalizePosture(status);
          const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
          return (
            <div
              className="aaProofStep"
              data-posture={posture}
              key={`${String(row[series.xKey])}-${index}`}
            >
              <div className="aaProofStepTop">
                <div className="aaProofStepLabel">
                  {rowDisplayLabel(row, series.xKey)}
                </div>
                <div className="aaProofStepValue">
                  {formatRechartValue(value, series.unit)}
                </div>
              </div>
              {status ? <div className="aaProofStepMeta">{status}</div> : null}
              <div aria-hidden="true" className="aaProofTrack">
                <div
                  className="aaProofTrackFill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnswerRechartRenderer({ chart }: { chart: AnswerChart }) {
  if (chart.kind === "quadrant-matrix" || chart.kind === "2x2-matrix") {
    const points = normalizeRechartQuadrant(chart);
    if (points.length < 2) return null;
    const displayPoints = quadrantDisplayPoints(points);
    return (
      <>
        <div
          className="aaRechart"
          data-chart-exhibit="portfolio-quadrant"
          data-chart-kind={chart.kind}
          data-chart-renderer="recharts"
          style={{ "--aa-chart-height": "360px" } as CSSProperties}
        >
          <SafeAgentResponsiveContainer>
            <ScatterChart margin={{ top: 22, right: 20, bottom: 16, left: 8 }}>
              <ReferenceArea
                fill="#ecfdf5"
                fillOpacity={0.5}
                strokeOpacity={0}
                x1={50}
                x2={100}
                y1={50}
                y2={100}
              />
              <ReferenceArea
                fill="#fffbeb"
                fillOpacity={0.55}
                strokeOpacity={0}
                x1={0}
                x2={50}
                y1={50}
                y2={100}
              />
              <ReferenceArea
                fill="#fef2f2"
                fillOpacity={0.45}
                strokeOpacity={0}
                x1={0}
                x2={50}
                y1={0}
                y2={50}
              />
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                domain={[0, 100]}
                label={{
                  value: "Complexity",
                  position: "insideBottom",
                  offset: -4,
                  fill: "#5f6b7a",
                  fontSize: 11,
                }}
                name="Complexity"
                tickLine={false}
                type="number"
              />
              <YAxis
                dataKey="y"
                domain={[0, 100]}
                label={{
                  value: "Value",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#5f6b7a",
                  fontSize: 11,
                }}
                name="Value"
                tickLine={false}
                type="number"
              />
              <ReferenceLine stroke="#cbd5e1" strokeDasharray="4 4" x={50} />
              <ReferenceLine stroke="#cbd5e1" strokeDasharray="4 4" y={50} />
              <Tooltip
                contentStyle={RECHART_TOOLTIP_STYLE}
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: unknown, name: unknown) => [
                  formatRechartValue(value),
                  String(name),
                ]}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.label ?? "Use case"
                }
              />
              <Scatter data={displayPoints} fill="#166534" name="Score">
                <LabelList
                  dataKey="displayLabel"
                  position="top"
                  style={{ fill: "#111827", fontSize: 11, fontWeight: 700 }}
                />
              </Scatter>
            </ScatterChart>
          </SafeAgentResponsiveContainer>
        </div>
        <div className="aaQuadrantLabels" aria-label="Quadrant guide">
          <div className="aaQuadrantLabel">
            <strong>Scale with proof</strong>
            High value and lower complexity/readiness risk.
          </div>
          <div className="aaQuadrantLabel">
            <strong>Fix adoption first</strong>
            High value, but complexity or readiness still blocks scale.
          </div>
          <div className="aaQuadrantLabel">
            <strong>Keep tactical</strong>
            Easier work with limited strategic value.
          </div>
          <div className="aaQuadrantLabel">
            <strong>Freeze or stop</strong>
            Weak value and weak readiness until evidence improves.
          </div>
        </div>
        <div className="aaChartKey" aria-label="Chart key">
          {displayPoints.map((point) => (
            <div
              className="aaChartKeyItem"
              key={`${point.label}-${point.x}-${point.y}`}
            >
              <span className="aaChartKeyIndex">{point.displayLabel}</span>
              <span className="aaChartKeyLabel" title={point.label}>
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  const series = normalizeRechartSeries(chart);
  if (!series) return null;
  const chartHeight = series.horizontal
    ? Math.max(320, Math.min(520, series.rows.length * 48 + 100))
    : 320;
  const yAxisWidth = series.horizontal
    ? horizontalAxisWidth(series.rows, series.xKey)
    : 48;
  if (isValueProofSeries(chart, series)) {
    return <ValueProofExhibit chart={chart} series={series} />;
  }
  if (chart.kind === "line") {
    return (
      <div
        className="aaRechart"
        data-chart-kind={chart.kind}
        data-chart-renderer="recharts"
        style={{ "--aa-chart-height": `${chartHeight}px` } as CSSProperties}
      >
        <SafeAgentResponsiveContainer>
          <LineChart
            data={series.rows}
            margin={{ top: 12, right: 24, bottom: 12, left: 8 }}
          >
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey={series.xKey}
              tickFormatter={(value) => shortAxisLabel(value, 18)}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => formatRechartValue(value, series.unit)}
              tickLine={false}
            />
            <Tooltip
              contentStyle={RECHART_TOOLTIP_STYLE}
              formatter={(value: unknown) => [
                formatRechartValue(value, series.unit),
                series.yKey,
              ]}
            />
            <Line
              activeDot={{ r: 5 }}
              dataKey={series.yKey}
              dot={{ r: 3 }}
              stroke="#166534"
              strokeWidth={3}
              type="monotone"
            />
            {series.yKey2 ? (
              <Line
                dataKey={series.yKey2}
                dot={{ r: 3 }}
                stroke="#1d4ed8"
                strokeWidth={3}
                type="monotone"
              />
            ) : null}
          </LineChart>
        </SafeAgentResponsiveContainer>
      </div>
    );
  }

  const barColor = chart.kind === "cost-stack" ? "#14532d" : "#166534";
  return (
    <div
      className="aaRechart"
      data-chart-kind={chart.kind}
      data-chart-renderer="recharts"
      style={{ "--aa-chart-height": `${chartHeight}px` } as CSSProperties}
    >
      <SafeAgentResponsiveContainer>
        <BarChart
          barCategoryGap={series.horizontal ? 10 : 18}
          data={series.rows}
          layout={series.horizontal ? "vertical" : "horizontal"}
          margin={{
            top: 12,
            right: 54,
            bottom: 12,
            left: series.horizontal ? 8 : 8,
          }}
        >
          <CartesianGrid
            horizontal={!series.horizontal}
            stroke="#e5e7eb"
            strokeDasharray="3 3"
            vertical={series.horizontal}
          />
          {series.horizontal ? (
            <>
              <XAxis
                tickFormatter={(value) =>
                  formatRechartValue(value, series.unit)
                }
                tickLine={false}
                type="number"
              />
              <YAxis
                dataKey={series.xKey}
                tickFormatter={(value) => shortAxisLabel(value, 28)}
                tickLine={false}
                type="category"
                width={yAxisWidth}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={series.xKey}
                tickFormatter={(value) => shortAxisLabel(value, 16)}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatRechartValue(value, series.unit)
                }
                tickLine={false}
              />
            </>
          )}
          <Tooltip
            contentStyle={RECHART_TOOLTIP_STYLE}
            formatter={(value: unknown) => [
              formatRechartValue(value, series.unit),
              series.yKey,
            ]}
          />
          <Bar
            dataKey={series.yKey}
            fill={barColor}
            radius={series.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {series.rows.map((row, index) => (
              <Cell
                fill={
                  typeof row.color === "string"
                    ? row.color
                    : RECHART_COLORS[index % RECHART_COLORS.length]
                }
                key={`${String(row[series.xKey])}-${index}`}
              />
            ))}
            <LabelList
              dataKey={series.yKey}
              formatter={(value: unknown) =>
                formatRechartValue(value, series.unit)
              }
              position={series.horizontal ? "right" : "top"}
              style={{ fill: "#111827", fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
          {series.yKey2 ? (
            <Bar dataKey={series.yKey2} fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          ) : null}
        </BarChart>
      </SafeAgentResponsiveContainer>
    </div>
  );
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
  const rechart = <AnswerRechartRenderer chart={chart} />;
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
      {canRenderRechartsChart(chart) ? (
        rechart
      ) : rendered.svg ? (
        <div
          className="aaSvg"
          data-chart-builder={rendered.builderName}
          data-chart-renderer="svg"
          dangerouslySetInnerHTML={{ __html: rendered.svg }}
        />
      ) : (
        <div className="aaFallback" role="status">
          Chart unavailable: {rendered.error}
        </div>
      )}
      {chart.sourceNote ? (
        <div className="aaNote">{chart.sourceNote}</div>
      ) : null}
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
        <div className="aaArtifactBadge">Relationship map</div>
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
  preserveOutput = false,
}: {
  answer: AvaAnswerPacket;
  showChrome?: boolean;
  showProse?: boolean;
  showExport?: boolean;
  preserveOutput?: boolean;
}) {
  const displayAnswer = preserveOutput
    ? answer
    : sanitizeAvaAnswerForRender(answer);
  const visibleArtifacts = displayAnswer.artifacts.filter(isVisibleAvaArtifact);
  const tables = visibleArtifacts.filter(
    (artifact): artifact is AnswerTable & { artifact: "table" } =>
      artifact.artifact === "table",
  );
  const charts = visibleArtifacts
    .filter(
      (artifact): artifact is AnswerChart & { artifact: "chart" } =>
        artifact.artifact === "chart",
    )
    .filter(isRenderableAnswerChart);
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

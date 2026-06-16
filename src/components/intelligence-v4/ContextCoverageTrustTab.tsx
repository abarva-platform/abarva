"use client";

// ContextCoverageTrustTab · Coverage & Trust tab
//
// 4 KPI strip, 14-dimension heatmap, insight-unlock ladder,
// source health table, truth-state funnel, gaps band.

import type {
  ContextReadModelResult,
  ContextSourceHealthRow,
} from "@/lib/intelligence/context-read-model";

const C = {
  panel: "#FFFFFF",
  ink: "#1B1A17",
  muted: "#6F6A61",
  line: "#E6E2DA",
  line2: "#EFECE5",
  chip: "#F1EEE7",
  fresh: "#3F7A5B",
  freshBg: "#3F7A5B14",
  attention: "#B5852A",
  attentionBg: "#B5852A18",
  stale: "#B4513C",
  staleBg: "#B4513C16",
  review: "#7A5BA8",
  reviewBg: "#7A5BA814",
  unknown: "#A39C90",
  unknownBg: "#A39C9016",
};

type DimStatus = "loaded" | "attention" | "stale" | "review" | "missing";

interface Dimension {
  n: number;
  name: string;
  st: DimStatus;
}

const DIMS: Dimension[] = [
  { n: 1, name: "Enterprise profile", st: "loaded" },
  { n: 2, name: "Org structure", st: "loaded" },
  { n: 3, name: "IT system landscape", st: "loaded" },
  { n: 4, name: "IT financials", st: "stale" },
  { n: 5, name: "KPI dictionary", st: "loaded" },
  { n: 6, name: "Program inventory", st: "loaded" },
  { n: 7, name: "Sourcing artifacts", st: "loaded" },
  { n: 8, name: "Program deliverables", st: "loaded" },
  { n: 9, name: "Evidence ledger", st: "loaded" },
  { n: 10, name: "Operating telemetry", st: "stale" },
  { n: 11, name: "Vendor & contract", st: "attention" },
  { n: 12, name: "Compliance & regulatory", st: "missing" },
  { n: 13, name: "Industry context", st: "missing" },
  { n: 14, name: "Cross-program signals", st: "review" },
];

interface LadderRow {
  name: string;
  req: number[];
}

const LADDER: LadderRow[] = [
  { name: "AI value-at-risk", req: [6, 10, 5, 4] },
  { name: "Renewal without benchmark", req: [11, 13, 7] },
  { name: "Service-quality slide", req: [10, 5] },
  { name: "Unverified strategy shift", req: [7, 9] },
  { name: "Ownership conflict", req: [3, 2] },
  { name: "Spend-vs-value blind spot", req: [4, 6, 5] },
  { name: "Vendor concentration risk", req: [11, 4, 3] },
  { name: "Portfolio incoherence", req: [6, 1, 5] },
  { name: "Compliance exposure", req: [12, 3, 11] },
];

const SOURCES = [
  {
    nm: "Application Inventory",
    ty: "CSV",
    fr: "loaded" as DimStatus,
    rec: 142,
    reached: 8,
    upd: "Jun 14",
  },
  {
    nm: "AI Initiative Register",
    ty: "XLSX",
    fr: "loaded" as DimStatus,
    rec: 38,
    reached: 8,
    upd: "Jun 12",
  },
  {
    nm: "Vendor Contracts",
    ty: "XLSX",
    fr: "attention" as DimStatus,
    rec: 67,
    reached: 7,
    upd: "May 28",
  },
  {
    nm: "Operating telemetry (ITSM)",
    ty: "CSV",
    fr: "stale" as DimStatus,
    rec: 500,
    reached: 8,
    upd: "Apr 30",
  },
  {
    nm: "Org Structure",
    ty: "Source artifact",
    fr: "loaded" as DimStatus,
    rec: 19,
    reached: 8,
    upd: "Jun 11",
  },
  {
    nm: "AMS Board Memo",
    ty: "PDF",
    fr: "review" as DimStatus,
    rec: 0,
    reached: 4,
    upd: "Jun 15",
  },
];

function stOf(n: number): DimStatus {
  return DIMS[n - 1]?.st ?? "missing";
}

function verdictForReqs(req: number[]): "lit" | "degraded" | "blocked" {
  const statuses = req.map(stOf);
  if (statuses.includes("missing")) return "blocked";
  if (
    statuses.some((s) => s === "stale" || s === "attention" || s === "review")
  )
    return "degraded";
  return "lit";
}

function dimStatusColor(st: DimStatus): string {
  const map: Record<DimStatus, string> = {
    loaded: C.fresh,
    attention: C.attention,
    stale: C.stale,
    review: C.review,
    missing: C.unknown,
  };
  return map[st];
}

function dimHeatClass(st: DimStatus): {
  bg: string;
  border: string;
  textColor: string;
} {
  const map: Record<
    DimStatus,
    { bg: string; border: string; textColor: string }
  > = {
    loaded: { bg: C.freshBg, border: `${C.fresh}40`, textColor: C.fresh },
    attention: {
      bg: C.attentionBg,
      border: `${C.attention}44`,
      textColor: C.attention,
    },
    stale: { bg: C.staleBg, border: `${C.stale}44`, textColor: C.stale },
    review: { bg: C.reviewBg, border: `${C.review}44`, textColor: C.review },
    missing: {
      bg: "repeating-linear-gradient(45deg, #fbfaf7, #fbfaf7 6px, #f3f1ec 6px, #f3f1ec 12px)",
      border: C.line,
      textColor: C.unknown,
    },
  };
  return map[st];
}

function verdictStyle(v: "lit" | "degraded" | "blocked"): React.CSSProperties {
  const map = {
    lit: { bg: C.freshBg, color: C.fresh },
    degraded: { bg: C.attentionBg, color: C.attention },
    blocked: { bg: C.staleBg, color: C.stale },
  };
  const s = map[v];
  return {
    fontSize: 10.5,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap" as const,
    background: s.bg,
    color: s.color,
  };
}

function verdictLabel(v: "lit" | "degraded" | "blocked"): string {
  if (v === "lit") return "● lit";
  if (v === "degraded") return "◐ degraded";
  return "○ blocked";
}

const TRUTH_FUNNEL = [
  { label: "received", n: 6, phase: 0 },
  { label: "classified", n: 6, phase: 0 },
  { label: "parsed", n: 6, phase: 0 },
  { label: "validated", n: 5, phase: 1 },
  { label: "committed", n: 5, phase: 1 },
  { label: "evidence", n: 5, phase: 1 },
  { label: "embedded", n: 5, phase: 1 },
  { label: "answer-ready", n: 4, phase: 2 },
];

import React from "react";

interface Props {
  contextSummary?: ContextReadModelResult | null;
}

function liveDimStatus(
  row: ContextReadModelResult["dimensionCoverage"][number] | undefined,
): DimStatus {
  if (!row || row.recordCount <= 0) return "missing";
  if (row.needsClassificationCount > 0) return "review";
  if (row.staleCount > 0 && row.freshCount === 0) return "stale";
  if (row.staleCount > 0) return "attention";
  return "loaded";
}

function liveSourceStatus(row: ContextSourceHealthRow): DimStatus {
  if (row.freshnessStatus === "fresh") return "loaded";
  if (row.freshnessStatus === "stale") return "stale";
  if (row.freshnessStatus === "review") return "review";
  return "attention";
}

function readableKey(value: string | null): string {
  if (!value) return "Unsegmented";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ContextCoverageTrustTab({ contextSummary }: Props) {
  const liveDims = contextSummary?.dimensionCoverage.length
    ? DIMS.map((dim, index) => {
        const row = contextSummary.dimensionCoverage[index];
        if (!row) return { ...dim, st: "missing" as DimStatus };
        return {
          n: dim.n,
          name: readableKey(row.domainSegment ?? row.recordType),
          st: liveDimStatus(row),
        };
      })
    : DIMS;
  const liveSources = contextSummary?.sourceHealth.length
    ? contextSummary.sourceHealth.map((source) => ({
        nm: source.displayName,
        ty: source.sourceType,
        fr: liveSourceStatus(source),
        rec: source.recordCount,
        reached: source.furthestTruthState,
        upd: source.lastSyncedAt
          ? new Date(source.lastSyncedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "unknown",
      }))
    : SOURCES;
  const maxFunnel = Math.max(1, liveSources.length);
  const liveTruthFunnel = contextSummary?.sourceHealth.length
    ? TRUTH_FUNNEL.map((row, index) => ({
        ...row,
        n: contextSummary.sourceHealth.filter(
          (source) => source.furthestTruthState >= index + 1,
        ).length,
      }))
    : TRUTH_FUNNEL;
  const sourceCount = liveSources.length;
  const activeFacts = contextSummary?.factsActive ?? 1284;
  const evidenceCoverage = contextSummary?.evidenceCoverage ?? 71;
  const answerability = Math.min(100, Math.max(0, evidenceCoverage));

  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          fontWeight: 400,
          margin: "0 0 2px",
          color: C.ink,
        }}
      >
        Coverage &amp; Trust
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 12.5,
          margin: "0 0 14px",
          maxWidth: 720,
        }}
      >
        The plumbing lens: which dimensions fed the context, how fresh, and
        which insights they unlock. Support for the meaning above — not the
        headline.
      </p>

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 11,
          marginBottom: 18,
        }}
      >
        {[
          {
            v: String(sourceCount),
            k: "Sources",
            d: `${liveSources.filter((source) => source.fr === "loaded").length} fresh · ${liveSources.filter((source) => source.fr === "attention").length} attention · ${liveSources.filter((source) => source.fr === "stale").length} stale`,
          },
          {
            v: activeFacts.toLocaleString(),
            k: "Active facts",
            d: `${evidenceCoverage}% cited`,
          },
          {
            v: `${evidenceCoverage}%`,
            k: "Evidence coverage",
            bar: evidenceCoverage,
            barColor: evidenceCoverage >= 75 ? C.fresh : C.attention,
          },
          {
            v: `${answerability}%`,
            k: "Answerability",
            bar: answerability,
            barColor: answerability >= 75 ? C.fresh : C.attention,
          },
        ].map((kpi) => (
          <div
            key={kpi.k}
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 7,
              padding: "12px 13px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 23,
                lineHeight: 1,
                color: C.ink,
              }}
            >
              {kpi.v}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              {kpi.k}
            </div>
            {kpi.d && (
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>
                {kpi.d}
              </div>
            )}
            {kpi.bar !== undefined && (
              <div
                style={{
                  height: 4,
                  borderRadius: 3,
                  background: C.line2,
                  marginTop: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${kpi.bar}%`,
                    background: kpi.barColor,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dimension coverage heatmap */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "14px 15px",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 11.5,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            color: C.muted,
            fontWeight: 600,
            margin: "0 0 11px",
          }}
        >
          Dimension coverage · the 14 context dimensions
        </h3>
        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 13,
            flexWrap: "wrap" as const,
            fontSize: 11,
            color: C.muted,
            marginBottom: 11,
          }}
        >
          {(
            ["loaded", "attention", "stale", "review", "missing"] as DimStatus[]
          ).map((st) => (
            <span
              key={st}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dimStatusColor(st),
                  display: "inline-block",
                }}
              />
              {st}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 7,
          }}
        >
          {liveDims.map((d) => {
            const hc = dimHeatClass(d.st);
            return (
              <div
                key={d.n}
                style={{
                  borderRadius: 7,
                  padding: "10px 10px",
                  border: `1px solid ${hc.border}`,
                  minHeight: 62,
                  position: "relative",
                  background: hc.bg,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#aaa",
                    position: "absolute",
                    top: 6,
                    right: 8,
                  }}
                >
                  {d.n}
                </span>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    marginTop: 2,
                    color: C.ink,
                  }}
                >
                  {d.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 5,
                    fontWeight: 600,
                    color: hc.textColor,
                  }}
                >
                  {d.st}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight-unlock ladder */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "14px 15px",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 11.5,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            color: C.muted,
            fontWeight: 600,
            margin: "0 0 11px",
          }}
        >
          Insight-unlock ladder · which cross-dimensional insights are lit
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {LADDER.map((row) => {
            const v = verdictForReqs(row.req);
            return (
              <div
                key={row.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr auto auto",
                  gap: 12,
                  alignItems: "center",
                  background: "#fff",
                  border: `1px solid ${C.line}`,
                  borderRadius: 7,
                  padding: "10px 13px",
                }}
              >
                <span style={{ fontSize: 13, color: C.ink }}>{row.name}</span>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap" as const,
                    justifyContent: "flex-end",
                  }}
                >
                  {row.req.map((n) => {
                    const st = stOf(n);
                    const col = dimStatusColor(st);
                    return (
                      <span
                        key={n}
                        style={{
                          fontSize: 9.5,
                          padding: "2px 6px",
                          borderRadius: 4,
                          whiteSpace: "nowrap" as const,
                          background: `${col}1f`,
                          color: col,
                        }}
                      >
                        dim {n}
                      </span>
                    );
                  })}
                </div>
                <span style={verdictStyle(v)}>{verdictLabel(v)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 11 }}>
          Blocked insights are suppressed until their dimensions load — e.g.{" "}
          <strong>Renewal-without-benchmark</strong> and{" "}
          <strong>Compliance exposure</strong> need dimensions 13 &amp; 12.
        </div>
      </div>

      {/* Source health + truth funnel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: "14px 15px",
          }}
        >
          <h3
            style={{
              fontSize: 11.5,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              color: C.muted,
              fontWeight: 600,
              margin: "0 0 11px",
            }}
          >
            Source health
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12.5,
            }}
          >
            <thead>
              <tr>
                {["Source", "Fresh", "Furthest state"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: 10,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      color: C.muted,
                      fontWeight: 600,
                      padding: "0 10px 8px",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveSources.map((s, idx) => {
                const col = dimStatusColor(s.fr);
                return (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "9px 10px",
                        borderBottom:
                          idx < liveSources.length - 1
                            ? `1px solid ${C.line2}`
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: col,
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 6,
                        }}
                      />
                      {s.nm}
                      <br />
                      <span style={{ fontSize: 10.5, color: C.muted }}>
                        {s.ty} · {s.upd}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "9px 10px",
                        borderBottom:
                          idx < liveSources.length - 1
                            ? `1px solid ${C.line2}`
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background:
                            s.fr === "loaded"
                              ? C.freshBg
                              : s.fr === "attention"
                                ? C.attentionBg
                                : s.fr === "stale"
                                  ? C.staleBg
                                  : C.reviewBg,
                          color: col,
                        }}
                      >
                        {s.fr}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "9px 10px",
                        borderBottom:
                          idx < liveSources.length - 1
                            ? `1px solid ${C.line2}`
                            : "none",
                        color: C.muted,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {s.reached}/8
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: "14px 15px",
          }}
        >
          <h3
            style={{
              fontSize: 11.5,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              color: C.muted,
              fontWeight: 600,
              margin: "0 0 11px",
            }}
          >
            Truth-state funnel
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {liveTruthFunnel.map((row) => {
              const barW = 34 + (row.n / maxFunnel) * 160;
              const barColor =
                row.phase === 0
                  ? C.fresh
                  : row.phase === 1
                    ? C.attention
                    : C.stale;
              return (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 120,
                      color: C.muted,
                      textAlign: "right",
                      fontSize: 11.5,
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <div
                    style={{
                      height: 24,
                      background: barColor,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      minWidth: 34,
                      width: barW,
                    }}
                  >
                    {row.n}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gaps band */}
      <div
        style={{
          background: C.staleBg,
          border: `1px solid ${C.stale}33`,
          borderRadius: 8,
          padding: "13px 15px",
          marginTop: 16,
        }}
      >
        <h4 style={{ margin: "0 0 8px", fontSize: 12.5, color: C.stale }}>
          What we can&apos;t yet see — and the insights it blocks
        </h4>
        {[
          {
            text: "Dim 13 · Industry context",
            italic: "missing → blocks renewal-without-benchmark resolution",
            action: "Load via Setup ›",
          },
          {
            text: "Dim 12 · Compliance",
            italic: "missing → blocks compliance-exposure",
            action: "Load via Setup ›",
          },
          {
            text: "Dim 4 · IT financials",
            italic: "stale → degrades AI value-at-risk & spend-vs-value",
            action: "Refresh ›",
          },
        ].map((gap, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              borderTop: idx > 0 ? `1px solid ${C.stale}22` : "none",
              fontSize: 12.5,
            }}
          >
            <span>
              <strong>{gap.text}</strong> <em>{gap.italic}</em>
            </span>
            <button
              type="button"
              style={{
                border: `1px solid ${C.ink}`,
                background: "none",
                color: C.ink,
                borderRadius: 7,
                padding: "5px 11px",
                fontSize: 11.5,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap" as const,
              }}
            >
              {gap.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

// EvidenceBasis · presentational evidence-provenance panel for Sentinel answers
// (Meridian evidence-hardening lane, 2026-06-08).
//
// The /api/intelligence/ask NDJSON stream already emits a `sources` event
// ({ type: 'sources', sources: AskSource[], coverageReport? }). Pipeline A
// (Meridian / askIntelligence) renders its answer as plain delta text, so the
// evidence basis was invisible. This component makes it visible.
//
// Design system is LOCKED — this file only uses SHELL tokens (no new colors /
// fonts). Props-in, no data fetching, no side effects.
//
// Safety / PHI rules enforced here (main view):
//   - never render raw internal ids (AskSource.id, "CHG-MH-00034"-style ids)
//   - never render filesystem paths (/tmp, /private, source_path, etc.)
//   - only a human-readable title + a scrubbed excerpt are shown by default;
//     raw ids appear only behind an expandable diagnostic "Details" toggle.

import { useMemo, useState } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { AskSource, SourceType } from "@/lib/intelligence/ask/types";
import type { CoverageReport } from "@/lib/knowledge/coverage";

interface EvidenceBasisProps {
  sources: AskSource[];
  coverageReport?: CoverageReport;
  /** Render against the dark form panel (Pipeline-A fallback column). */
  tone?: "light" | "dark";
}

type GroupKey = "client" | "patterns" | "inference";

const GROUP_LABELS: Record<GroupKey, string> = {
  client: "Client facts",
  patterns: "Healthcare patterns",
  inference: "Inference",
};

const GROUP_ORDER: GroupKey[] = ["client", "patterns", "inference"];

// Source-type → evidence group. Client facts are tenant-grounded; healthcare
// patterns are the corpus / benchmark / regulatory knowledge; inference is the
// model reasoning over surface context with no direct citation.
const GROUP_FOR_TYPE: Record<SourceType, GroupKey> = {
  TENANT: "client",
  GRAPH: "client",
  PATTERN: "patterns",
  BENCHMARK: "patterns",
  INSIGHT: "patterns",
  WORLDVIEW: "patterns",
  RESEARCH: "patterns",
  REGULATION: "patterns",
  TOPIC: "patterns",
  VENDOR: "patterns",
  GENERAL: "inference",
  SURFACE: "inference",
};

function groupForType(type: SourceType): GroupKey {
  return GROUP_FOR_TYPE[type] ?? "inference";
}

type ConfidenceLabel = "High" | "Partial" | "Low";

function confidenceLabel(confidence: number | undefined): ConfidenceLabel {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return "Low";
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.6) return "Partial";
  return "Low";
}

// Aggregate label for a group / the whole answer. If any contributing item is
// below "High", the aggregate is reported as "partial" (or "low") rather than
// overstating confidence.
function aggregateLabel(
  confidences: Array<number | undefined>,
): ConfidenceLabel {
  if (confidences.length === 0) return "Low";
  const labels = confidences.map(confidenceLabel);
  if (labels.some((l) => l === "Low"))
    return labels.every((l) => l === "Low") ? "Low" : "Partial";
  if (labels.some((l) => l === "Partial")) return "Partial";
  return "High";
}

// ── PHI / id / path scrubbing ─────────────────────────────────────────────

// Filesystem-ish path: absolute unix path or anything containing /tmp//private/
// or a *_path token.
const PATH_RE =
  /(?:\/(?:private|tmp|var|home|users|mnt|data)\/[^\s)]*|[a-zA-Z0-9_]*source_path[^\s)]*|(?:\/[\w.-]+){2,})/gi;

// Raw record / change ids like CHG-MH-00034, DOC-1234, MH_00099, uuid fragments.
const RAW_ID_RE =
  /\b(?:[A-Z]{2,}-[A-Z0-9]{1,}-?\d{2,}|[A-Z]{2,}-\d{3,}|[A-Z]{2,}_\d{3,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/g;

/**
 * Scrub a free-text excerpt for the MAIN view: remove filesystem paths and raw
 * ids so PHI / internal record handles never surface. Replaced spans collapse
 * to a neutral marker.
 */
export function scrubExcerpt(detail: string | undefined | null): string {
  if (!detail) return "";
  let out = detail.replace(PATH_RE, "[source]");
  out = out.replace(RAW_ID_RE, "[ref]");
  // Collapse repeated markers / whitespace introduced by scrubbing.
  out = out
    .replace(/(\[source\]\s*){2,}/g, "[source] ")
    .replace(/(\[ref\]\s*){2,}/g, "[ref] ");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function badgeColors(label: ConfidenceLabel): {
  bg: string;
  border: string;
  fg: string;
} {
  switch (label) {
    case "High":
      return {
        bg: SHELL.MINT_BG,
        border: SHELL.MINT_LINE,
        fg: SHELL.MINT_TEXT,
      };
    case "Partial":
      return {
        bg: SHELL.PEACH_BG,
        border: SHELL.PEACH_LINE,
        fg: SHELL.PEACH_TEXT,
      };
    case "Low":
    default:
      return {
        bg: SHELL.RUST_BG,
        border: SHELL.GRAY_LINE,
        fg: SHELL.RUST_TEXT,
      };
  }
}

function ConfidenceBadge({ label }: { label: ConfidenceLabel }) {
  const c = badgeColors(label);
  return (
    <span
      style={{
        display: "inline-block",
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        padding: "1px 7px",
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function EvidenceBasis({
  sources,
  coverageReport,
  tone = "light",
}: EvidenceBasisProps) {
  const [open, setOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);

  const dark = tone === "dark";
  const ink = dark ? "rgba(250,247,241,0.92)" : SHELL.INK;
  const inkMuted = dark ? "rgba(250,247,241,0.62)" : SHELL.INK_MUTED;
  const line = dark ? "rgba(250,247,241,0.18)" : SHELL.CARD_LINE;
  const panelBg = dark ? "rgba(250,247,241,0.06)" : SHELL.PAPER;
  const chipBg = dark ? "rgba(250,247,241,0.04)" : SHELL.PAPER_SOFT;

  const grouped = useMemo(() => {
    const safe = Array.isArray(sources) ? sources : [];
    const out: Record<GroupKey, AskSource[]> = {
      client: [],
      patterns: [],
      inference: [],
    };
    for (const source of safe) {
      out[groupForType(source.type)].push(source);
    }
    return out;
  }, [sources]);

  const sourceCount = Array.isArray(sources) ? sources.length : 0;
  const hasSources = sourceCount > 0;

  const missingSegments = useMemo(() => {
    if (!coverageReport) return [] as string[];
    return Array.isArray(coverageReport.missingSegments)
      ? coverageReport.missingSegments
      : [];
  }, [coverageReport]);

  const overallLabel = useMemo(() => {
    const all = (Array.isArray(sources) ? sources : []).map(
      (s) => s.confidence,
    );
    const base = aggregateLabel(all);
    // Inference-only evidence is never "High" — it has no grounded citation.
    const onlyInference =
      hasSources &&
      grouped.client.length === 0 &&
      grouped.patterns.length === 0;
    if (onlyInference && base === "High") return "Partial" as ConfidenceLabel;
    // Coverage gaps cap the answer at "partial".
    if (coverageReport && coverageReport.status !== "full" && base === "High") {
      return "Partial" as ConfidenceLabel;
    }
    return base;
  }, [sources, hasSources, grouped, coverageReport]);

  const overallSummary = !hasSources
    ? "No grounded sources"
    : overallLabel === "High"
      ? "High confidence"
      : overallLabel === "Partial"
        ? "Partial evidence"
        : "Low confidence";

  return (
    <section
      data-testid="evidence-basis"
      aria-label="Evidence basis"
      style={{
        border: `1px solid ${line}`,
        borderRadius: 8,
        background: panelBg,
        overflow: "hidden",
        fontFamily: SHELL.SANS,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="evidence-basis-toggle"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "9px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: inkMuted,
            }}
          >
            Evidence basis ({sourceCount})
          </span>
          {!hasSources ? (
            <ConfidenceBadge label="Low" />
          ) : (
            <ConfidenceBadge label={overallLabel} />
          )}
        </span>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: inkMuted }}>
          {overallSummary} · {open ? "−" : "+"}
        </span>
      </button>

      {/* Citation gap — only when there are zero grounded sources. */}
      {!hasSources ? (
        <div
          data-testid="evidence-citation-gap"
          role="status"
          style={{
            margin: "0 12px 10px",
            border: `1px solid ${SHELL.PEACH_LINE}`,
            background: SHELL.PEACH_BG,
            color: SHELL.PEACH_TEXT,
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          Citation gap — no grounded sources for this answer. Treat it as
          unverified inference until evidence is loaded.
        </div>
      ) : null}

      {open ? (
        <div style={{ padding: "0 12px 12px", display: "grid", gap: 12 }}>
          {GROUP_ORDER.map((key) => {
            const items = grouped[key];
            if (items.length === 0) return null;
            const groupLabel = aggregateLabel(items.map((s) => s.confidence));
            return (
              <div key={key} data-testid={`evidence-group-${key}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9.5,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: inkMuted,
                    }}
                  >
                    {GROUP_LABELS[key]} ({items.length})
                  </span>
                  <ConfidenceBadge label={groupLabel} />
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {items.map((source, i) => {
                    const excerpt = truncate(scrubExcerpt(source.detail));
                    const itemLabel = confidenceLabel(source.confidence);
                    return (
                      <li
                        key={`${key}-${source.type}-${i}`}
                        data-testid="evidence-item"
                        style={{
                          border: `1px solid ${line}`,
                          background: chipBg,
                          borderRadius: 6,
                          padding: "7px 9px",
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: SHELL.SANS,
                              fontSize: 13,
                              fontWeight: 600,
                              color: ink,
                            }}
                          >
                            {source.name || "Untitled source"}
                          </span>
                          <ConfidenceBadge label={itemLabel} />
                        </div>
                        {excerpt ? (
                          <p
                            style={{
                              margin: 0,
                              fontFamily: SHELL.SANS,
                              fontSize: 12,
                              lineHeight: 1.45,
                              color: inkMuted,
                            }}
                          >
                            {excerpt}
                          </p>
                        ) : null}
                        {diagnostics && source.id ? (
                          <code
                            data-testid="evidence-item-rawid"
                            style={{
                              fontFamily: SHELL.MONO,
                              fontSize: 10,
                              color: inkMuted,
                              wordBreak: "break-all",
                            }}
                          >
                            {source.type} · {source.id}
                          </code>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Missing evidence — derived from coverageReport gaps. */}
          {missingSegments.length > 0 ? (
            <div data-testid="evidence-group-missing">
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: SHELL.RUST_TEXT,
                  marginBottom: 6,
                }}
              >
                Missing evidence ({missingSegments.length})
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {missingSegments.map((segment) => (
                  <li
                    key={segment}
                    data-testid="evidence-missing-item"
                    style={{
                      border: `1px solid ${SHELL.GRAY_LINE}`,
                      background: SHELL.GRAY_BG,
                      color: SHELL.GRAY_TEXT,
                      borderRadius: 999,
                      padding: "3px 9px",
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                    }}
                  >
                    {String(segment).replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasSources ? (
            <button
              type="button"
              onClick={() => setDiagnostics((v) => !v)}
              data-testid="evidence-diagnostics-toggle"
              style={{
                justifySelf: "start",
                border: `1px solid ${line}`,
                background: "transparent",
                color: inkMuted,
                borderRadius: 6,
                padding: "4px 8px",
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {diagnostics ? "Hide details" : "Details"}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default EvidenceBasis;

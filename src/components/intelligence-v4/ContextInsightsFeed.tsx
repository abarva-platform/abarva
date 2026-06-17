"use client";

// ContextInsightsFeed · Insights tab content (default tab, L2)
//
// Domain filter chips, hero insight cards, and an insight feed with
// expand/collapse derivation chain (facts → rule → significance).
// No fixture fallback: this tab renders only live context_insights rows.

import { useEffect, useMemo, useState } from "react";

import type { ContextInsight } from "@/lib/intelligence/insight-engine/types";

const C = {
  bg: "#F8F7F4",
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

type MaterialityLevel = "high" | "medium" | "low";
type FreshnessStatus =
  | "loaded"
  | "attention"
  | "stale"
  | "review"
  | "missing"
  | "unknown";
type ConfidenceLevel = "high" | "medium" | "low" | "none";

interface InsightData {
  id: string;
  headline: string;
  soWhat: string;
  materiality: MaterialityLevel;
  domain: string;
  freshnessStatus: FreshnessStatus;
  confidence: ConfidenceLevel;
  ruleId: string;
  evidence: string;
  entityName: string;
  facts?: [string, string][];
  hero?: boolean;
}

interface InsightsResponse {
  insights: ContextInsight[];
  errors: string[];
}

interface EvaluationReceipt {
  evaluated: number;
  fired: number;
  written: number;
  errors: string[];
}

const evaluationRequestedTenants = new Set<string>();

function freshnessColor(status: FreshnessStatus): string {
  const map: Record<FreshnessStatus, string> = {
    loaded: C.fresh,
    attention: C.attention,
    stale: C.stale,
    review: C.review,
    missing: C.unknown,
    unknown: C.unknown,
  };
  return map[status];
}

function materialityPillStyle(level: MaterialityLevel): React.CSSProperties {
  const map: Record<MaterialityLevel, { bg: string; color: string }> = {
    high: { bg: C.staleBg, color: C.stale },
    medium: { bg: C.attentionBg, color: C.attention },
    low: { bg: C.unknownBg, color: C.unknown },
  };
  const s = map[level];
  return {
    fontSize: 10.5,
    padding: "2.5px 8px",
    borderRadius: 20,
    whiteSpace: "nowrap" as const,
    fontWeight: 500,
    background: s.bg,
    color: s.color,
  };
}

function getPrimaryAction(insight: InsightData): string {
  if (insight.freshnessStatus === "missing") return "Load missing source";
  if (insight.freshnessStatus === "review") return "Review & approve";
  if (insight.domain === "Data quality") return "Open stewardship task";
  if (insight.id === "gap") return "Load missing source";
  return "Shape into Move";
}

function mapLiveInsight(insight: ContextInsight, index: number): InsightData {
  return {
    id: insight.id ?? `${insight.ruleId}-${insight.entityName ?? index}`,
    headline: insight.headline,
    soWhat: insight.soWhat,
    materiality: insight.materiality,
    domain: insight.domain,
    freshnessStatus:
      insight.freshnessStatus === "fresh" ? "loaded" : insight.freshnessStatus,
    confidence: insight.confidence,
    ruleId: insight.ruleId,
    evidence: insight.evidence ?? "Evidence not attached yet",
    entityName: insight.entityName ?? insight.domain,
    hero: index < 3 && insight.materiality !== "low",
    facts: [
      ["rule", insight.ruleId],
      ["records", String(insight.derivedFromRecordIds.length)],
      ["evidence", insight.evidence ?? "not cited yet"],
    ],
  };
}

interface InsightCardProps {
  insight: InsightData;
  onSeeTheFacts?: (entityName: string) => void;
}

function InsightCard({ insight, onSeeTheFacts }: InsightCardProps) {
  const [open, setOpen] = useState(false);
  const freshColor = freshnessColor(insight.freshnessStatus);

  return (
    <div
      style={{
        background: insight.hero
          ? "linear-gradient(0deg, #fff, #fffdf8)"
          : C.panel,
        border: `1px solid ${insight.hero ? "#dcd5c7" : C.line}`,
        borderRadius: 8,
        marginBottom: 11,
        overflow: "hidden",
        transition: "box-shadow 0.12s",
      }}
    >
      {/* Clickable head */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        aria-expanded={open}
        style={{
          padding: "14px 16px",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 13,
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 16,
                fontWeight: 400,
                margin: "0 0 5px",
                lineHeight: 1.3,
                color: C.ink,
              }}
            >
              {insight.headline}
            </h4>
            <p style={{ color: C.muted, fontSize: 12.5, margin: 0 }}>
              {insight.soWhat}
            </p>
          </div>
          <span style={materialityPillStyle(insight.materiality)}>
            {insight.materiality}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap" as const,
            marginTop: 10,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              padding: "2.5px 8px",
              borderRadius: 5,
              background: C.chip,
              color: C.muted,
            }}
          >
            {insight.domain}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: "2px 8px",
              border: `1px solid ${freshColor}44`,
              color: freshColor,
              background: "#fff",
            }}
          >
            {insight.freshnessStatus}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: "2px 8px",
              border: `1px solid ${C.line}`,
              background: "#fff",
              color: C.muted,
            }}
          >
            conf {insight.confidence}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: "2px 8px",
              border: `1px solid ${C.line}`,
              background: "#fff",
              color: C.muted,
            }}
          >
            rule: {insight.ruleId}
          </span>
          <span
            style={{
              color: "#bdb6a8",
              fontSize: 12,
              marginLeft: "auto",
              transition: "transform 0.15s",
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "none",
            }}
          >
            › how derived
          </span>
        </div>
      </div>

      {/* Derivation chain (expanded) */}
      {open && (
        <div
          style={{
            borderTop: `1px solid ${C.line2}`,
            background: "#FCFBF7",
            padding: "13px 16px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              color: C.muted,
              margin: "0 0 8px",
            }}
          >
            Derivation — facts → rule → significance
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 0,
              overflowX: "auto",
              paddingBottom: 3,
            }}
          >
            {insight.facts?.map(([key, value], fi) => (
              <React.Fragment key={fi}>
                <div
                  style={{
                    minWidth: 120,
                    border: `1px solid ${C.line}`,
                    borderRadius: 7,
                    background: "#fff",
                    padding: "8px 10px",
                    fontSize: 11.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8.5,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      color: C.muted,
                      marginBottom: 3,
                    }}
                  >
                    fact
                  </div>
                  <strong>{key}</strong>
                  <br />
                  {value}
                </div>
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minWidth: 24,
                    color: "#c8c1b3",
                    fontSize: 14,
                  }}
                >
                  →
                </div>
              </React.Fragment>
            ))}
            {/* Rule cell */}
            <div
              style={{
                minWidth: 120,
                border: `1px solid ${C.ink}`,
                borderRadius: 7,
                background: C.ink,
                color: "#fff",
                padding: "8px 10px",
                fontSize: 11.5,
              }}
            >
              <div
                style={{
                  fontSize: 8.5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  color: "#ffffff99",
                  marginBottom: 3,
                }}
              >
                rule
              </div>
              <strong>{insight.ruleId}</strong>
            </div>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minWidth: 24,
                color: "#c8c1b3",
                fontSize: 14,
              }}
            >
              →
            </div>
            {/* Significance cell */}
            <div
              style={{
                minWidth: 120,
                border: `1px solid ${insight.materiality === "high" ? C.stale : C.attention}`,
                borderRadius: 7,
                background: "#fff",
                padding: "8px 10px",
                fontSize: 11.5,
              }}
            >
              <div
                style={{
                  fontSize: 8.5,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  color: C.muted,
                  marginBottom: 3,
                }}
              >
                significance
              </div>
              <strong>{insight.materiality} materiality</strong>
            </div>
          </div>

          {/* Evidence row */}
          <div
            style={{
              marginTop: 10,
              fontSize: 11.5,
              display: "flex",
              flexWrap: "wrap" as const,
              gap: 5,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                borderRadius: 20,
                padding: "2px 8px",
                border: `1px solid ${C.line}`,
                background: "#fff",
                color: C.muted,
              }}
            >
              evidence
            </span>
            {insight.evidence}
            <span
              style={{
                fontSize: 10.5,
                borderRadius: 20,
                padding: "2px 8px",
                border: `1px solid ${C.line}`,
                background: "#fff",
                color: C.muted,
                marginLeft: "auto",
              }}
            >
              entity: {insight.entityName}
            </span>
          </div>
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: "flex",
          gap: 7,
          flexWrap: "wrap" as const,
          padding: "11px 16px",
          borderTop: `1px solid ${C.line2}`,
        }}
      >
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          style={{
            border: `1px solid ${C.ink}`,
            background: C.ink,
            color: "#fff",
            borderRadius: 7,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {getPrimaryAction(insight)}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeeTheFacts?.(insight.entityName);
          }}
          style={{
            border: `1px solid ${C.ink}`,
            background: "none",
            color: C.ink,
            borderRadius: 7,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          See the facts
        </button>
      </div>
    </div>
  );
}

// Need React import for JSX fragments inside map
import React from "react";

interface Props {
  tenantKey: string;
  onSeeTheFacts?: (entityName: string) => void;
}

export function ContextInsightsFeed({ tenantKey, onSeeTheFacts }: Props) {
  const [domainFilter, setDomainFilter] = useState("All");
  const [liveInsights, setLiveInsights] = useState<InsightData[]>([]);
  const [status, setStatus] = useState<
    "loading" | "evaluating" | "ready" | "empty" | "error"
  >("loading");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchInsights(): Promise<InsightsResponse> {
      const response = await fetch(
        `/api/intelligence/insights?tenantKey=${encodeURIComponent(tenantKey)}`,
        {
          signal: controller.signal,
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error(`insights ${response.status}`);
      return response.json() as Promise<InsightsResponse>;
    }

    async function requestEvaluation(): Promise<EvaluationReceipt> {
      const response = await fetch("/api/intelligence/insights/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({ tenantKey }),
      });
      if (!response.ok) throw new Error(`insights/evaluate ${response.status}`);
      return response.json() as Promise<EvaluationReceipt>;
    }

    async function load() {
      setStatus("loading");
      setErrors([]);
      try {
        let payload = await fetchInsights();
        let mapped = payload.insights.map(mapLiveInsight);
        let nextErrors = payload.errors ?? [];

        if (
          mapped.length === 0 &&
          !evaluationRequestedTenants.has(tenantKey)
        ) {
          evaluationRequestedTenants.add(tenantKey);
          setStatus("evaluating");
          const receipt = await requestEvaluation();
          nextErrors = [...nextErrors, ...(receipt.errors ?? [])];
          payload = await fetchInsights();
          mapped = payload.insights.map(mapLiveInsight);
          nextErrors = [...nextErrors, ...(payload.errors ?? [])];
        }

        setLiveInsights(mapped);
        setErrors(nextErrors);
        setStatus(mapped.length > 0 ? "ready" : nextErrors.length ? "error" : "empty");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[ContextInsightsFeed] insights fetch failed", error);
        setLiveInsights([]);
        setErrors([error instanceof Error ? error.message : String(error)]);
        setStatus("error");
      }
    }

    void load();
    return () => controller.abort();
  }, [tenantKey]);

  const insights = liveInsights;
  const domains = useMemo(
    () => ["All", ...Array.from(new Set(insights.map((i) => i.domain)))],
    [insights],
  );
  const filtered =
    domainFilter === "All"
      ? insights
      : insights.filter((i) => i.domain === domainFilter);

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
        What the context is telling you
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 12.5,
          margin: "0 0 14px",
          maxWidth: 720,
        }}
      >
        Derived significance from named rules. When evidence is missing, the
        explorer shows the gap instead of filling it.
      </p>

      {/* Domain filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap" as const,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: C.muted,
            alignSelf: "center",
            marginRight: 2,
            textTransform: "uppercase" as const,
            letterSpacing: "0.4px",
          }}
        >
          Domain
        </span>
        {domains.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomainFilter(d)}
            style={{
              fontSize: 11.5,
              border: `1px solid ${C.line}`,
              background: domainFilter === d ? C.ink : "#fff",
              borderRadius: 20,
              padding: "4px 10px",
              color: domainFilter === d ? "#fff" : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
              ...(domainFilter === d ? { borderColor: C.ink } : {}),
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Insight feed */}
      <div>
        {(status === "loading" || status === "evaluating") && (
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              background: C.panel,
              padding: "18px 16px",
              color: C.muted,
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 11,
            }}
          >
            <strong style={{ color: C.ink, fontWeight: 500 }}>
              {status === "evaluating"
                ? "Evaluating live context."
                : "Loading live insights."}
            </strong>
            <br />
            {status === "evaluating"
              ? "Running significance rules against the tenant facts, then refreshing this tab."
              : "Reading context_insights from the tenant data plane."}
          </div>
        )}
        {filtered.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onSeeTheFacts={onSeeTheFacts}
          />
        ))}
        {status !== "loading" && status !== "evaluating" && filtered.length === 0 && (
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              background: C.panel,
              padding: "18px 16px",
              color: C.muted,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: C.ink, fontWeight: 500 }}>
              {status === "error"
                ? "Live insights are not available yet."
                : "No live derived insights yet."}
            </strong>
            <br />
            {status === "error"
              ? `The explorer could not read or evaluate context_insights: ${errors.join("; ")}`
              : "The evaluator ran, but no significance rule produced an active insight for this tenant yet."}
          </div>
        )}
      </div>
    </div>
  );
}

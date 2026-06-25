"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MetricProvenance } from "@/components/tower/MetricProvenance";
import { ExecutiveActionQueuePanel } from "@/components/tower/ExecutiveActionQueuePanel";
import {
  AtlasChatPanel,
  type AtlasMessage,
} from "@/components/atlas/AtlasChatPanel";
import type { AttachmentRef } from "@/components/agent/AgentDock";
import type { AtlasChatResponse, AtlasSuggestion } from "@/lib/atlas/types";
import {
  buildStrategicAlignment2x2View,
  dotsByQuadrant,
  type AlignmentDot,
  type AlignmentQuadrant,
  type StrategicAlignment2x2View,
} from "@/lib/tower/strategic-alignment-2x2-view";
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";
import type {
  BandMetric,
  BandConfidence,
  TowerLens,
  TowerBandMetricsView,
} from "@/lib/tower/band-metrics-view";
import type { MetricProvenanceKey } from "@/lib/tower/metric-provenance";
import type {
  PressureCardView,
  TowerPressuresView,
} from "@/lib/tower/pressure-cards-view";
import type { AtlasObservationsView } from "@/lib/tower/atlas-observations-view";
import type { TowerTabKey } from "@/lib/tower/tower-lens-tabs-view";

export interface TowerSubstrateCounts {
  initiatives: number;
  vendors: number;
  kpis: number;
  decisions: number;
  stakeholderNotes: number;
  scenarios: number;
}

// ─── Tower design tokens — aligned with the LOCKED AbarVa design system ───────
// Background: #F8F7F4 cream (matches /tower/onboard, /tower/portfolio, marketing).
// Headings: Fraunces serif. Body: Inter. Buttons: black / ghost. NO new colours.
const T = {
  PAGE_BG: "#F8F7F4",
  CREAM: "#F8F7F4",
  CREAM_2: "#ffffff",
  CREAM_DEEP: "#eeece6",
  RULE: "rgba(10,10,11,0.10)",
  RULE_STRONG: "rgba(10,10,11,0.22)",
  BORDER: "rgba(10,10,11,0.08)",
  BORDER_STRONG: "rgba(10,10,11,0.18)",
  INK: "#1A1A18",
  INK_2: "#525866",
  GRAY: "#9AA3B2",
  GRAY_DK: "#525866",
  GOLD: "#c9a227",
  PURPLE: "#1B2B5C",
  PURPLE_BG: "rgba(27,43,92,0.07)",
  GREEN: "#1d9e75",
  GREEN_BG: "#e1f5ee",
  AMBER: "#ba7517",
  AMBER_BG: "#faeeda",
  RED: "#a32d2d",
  RED_BG: "#fceded",
  // Pressure-specific colors (each pressure type has its own ink)
  P_COST: "#8b3a3a",
  P_ADOPT: "#2d5f8a",
  P_DUPL: "#6b3fa0",
  P_VEND: "#9C7B3F",
  P_VALUE: "#1d6b4f",
  // Fonts
  SERIF: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  SANS: 'var(--font-inter), "Inter", system-ui, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

const PANEL_SHADOW = "0 18px 42px rgba(15, 23, 42, 0.07)";

// ─── Confidence value (cval) — solid/dashed/dotted underline by confidence ────
type Confidence = "high" | "med" | "low";
function cvalStyle(conf: Confidence): CSSProperties {
  if (conf === "high")
    return { borderBottom: `2px solid ${T.INK}`, paddingBottom: 5 };
  if (conf === "med")
    return { borderBottom: `2px dashed ${T.GRAY_DK}`, paddingBottom: 5 };
  return { borderBottom: `1.5px dotted ${T.GRAY}`, paddingBottom: 5 };
}

function ConfTag({ conf }: { conf: Confidence }) {
  const bg =
    conf === "high"
      ? "rgba(10,10,11,0.08)"
      : conf === "med"
        ? "rgba(186,117,23,0.14)"
        : "rgba(136,135,128,0.16)";
  const color = conf === "high" ? T.INK : conf === "med" ? T.AMBER : T.GRAY_DK;
  return (
    <span
      style={{
        fontFamily: T.MONO,
        fontSize: 8,
        letterSpacing: "1.4px",
        fontWeight: 700,
        padding: "1px 5px",
        borderRadius: 3,
        verticalAlign: "super",
        marginLeft: 4,
        textTransform: "uppercase",
        background: bg,
        color,
      }}
    >
      {conf}
    </span>
  );
}

// ─── KPI cell · T-1 compression (Tower Fix Package) ───────────────────────────
//
// Compressed from 4-line (label / stat / delta / 3-line footnote / inline CTA)
// to 2-line (label / stat + one-line subtext) layout per
// `tower-fix-package/pr-t-1-dashboard-band-compression.md`.
//
// The displaced 3-line description goes into the native browser tooltip
// via `tooltip` prop (option 1 from spec §"Notes for implementer"). The two
// inline CTA bubbles ("+24% pending baseline →" and "Connect Okta + EntraID
// →") have been removed entirely; T-3 absorbs them as inline action chips on
// Atlas observations.
//
// Doctrine constraints preserved:
//   - confidence indicators (HIGH/MED/LOW tags) stay on the stat
//   - underline weight (solid HIGH · dashed MED · dotted LOW) preserved via
//     cvalStyle on the stat children
//   - delta arrows (▲ ▼ ●) preserved inline in the subtext
//   - "missing inputs as invitations" preserved ("2 sources missing" still
//     reads on the Adoption tile)
interface KpiProps {
  label: string;
  hero?: boolean;
  isFirst?: boolean;
  children: ReactNode;
  /** One-line subtext (~30 chars) shown directly below the stat. */
  subtext?: ReactNode;
  /** Full displaced description shown as native browser tooltip on hover. */
  tooltip?: string;
  active?: boolean;
  onActivate?: () => void;
  drillLabel?: string;
}

function Kpi({
  label,
  hero,
  isFirst,
  children,
  subtext,
  tooltip,
  active,
  onActivate,
  drillLabel,
}: KpiProps) {
  const interactive = Boolean(onActivate);
  const resolvedTitle = [tooltip, drillLabel].filter(Boolean).join("\n\n");
  return (
    <div
      title={resolvedTitle || undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onActivate?.();
      }}
      style={{
        padding: isFirst ? "0 14px 0 0" : "0 14px",
        borderLeft: isFirst ? "none" : `1px solid ${T.RULE}`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        cursor: interactive ? "pointer" : tooltip ? "help" : "default",
        outline: active ? `2px solid ${T.PURPLE}` : "none",
        outlineOffset: active ? 3 : 0,
        borderRadius: active ? 6 : 0,
        minHeight: 58,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9.5,
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          fontWeight: 700,
          color: T.GRAY_DK,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: T.SERIF,
            fontWeight: hero ? 800 : 700,
            letterSpacing: 0,
            lineHeight: 1,
            color: T.INK,
            fontSize: hero ? 32 : 28,
          }}
        >
          {children}
        </div>
        {subtext && (
          <div
            style={{
              fontFamily: T.MONO,
              fontSize: 10,
              letterSpacing: "1.0px",
              color: T.GRAY_DK,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── T-5 (Bind 1): Substrate-bound KPI tile ──────────────────────────────────
//
// Renders a band tile from a pre-computed `BandMetric` (substrate aggregation).
// Maps the view-model's confidence enum to the existing cvalStyle/ConfTag
// treatment so visual doctrine (solid HIGH · dashed MED · dotted LOW) holds
// across substrate-bound and legacy code paths.
function SubstrateKpi({
  metric,
  hero,
  isFirst,
  onAskAtlas,
  active,
  onDrill,
}: {
  metric: BandMetric;
  hero?: boolean;
  isFirst?: boolean;
  onAskAtlas?: MetricAskHandler;
  active?: boolean;
  onDrill?: (metricKey: MetricProvenanceKey) => void;
}) {
  // Map BandConfidence to the cvalStyle Confidence union; 'none' falls back
  // to 'low' so we still get the dotted-underline treatment for placeholders.
  const conf: Confidence =
    metric.confidence === "high"
      ? "high"
      : metric.confidence === "med"
        ? "med"
        : "low";
  const showConfTag =
    metric.confidence === "med" || metric.confidence === "low";
  return (
    <Kpi
      label={metric.label}
      hero={hero}
      isFirst={isFirst}
      subtext={metric.subtext}
      tooltip={metric.tooltip}
      active={active}
      onActivate={onDrill ? () => onDrill(metric.key) : undefined}
      drillLabel="Open the related Tower canvas view"
    >
      <MetricProvenance
        metricKey={metric.key}
        displayValue={metric.value}
        displayConfidence={metric.confidence}
        onAskAtlas={onAskAtlas}
      >
        <span style={cvalStyle(conf)} data-band-confidence={metric.confidence}>
          {metric.value}
          {showConfTag && <ConfTag conf={conf} />}
        </span>
      </MetricProvenance>
    </Kpi>
  );
}

const PORTFOLIO_CANVAS_TABS: Array<{
  key: PortfolioCanvasView;
  label: string;
}> = [
  { key: "alignment", label: "Value Map" },
  { key: "pressures", label: "Risk & Pressure" },
  { key: "contract", label: "Renewal Clock" },
  { key: "adoption", label: "Adoption Gaps" },
  { key: "evidence", label: "Evidence Map" },
];

function CanvasViewTabs({
  active,
  hrefFor,
}: {
  active: PortfolioCanvasView;
  hrefFor: (view: PortfolioCanvasView) => string;
}) {
  return (
    <div
      style={{
        padding: "24px 32px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9.5,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: T.GOLD,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        Canvas view
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PORTFOLIO_CANVAS_TABS.map((tab) => {
          const current = active === tab.key;
          return (
            <Link
              key={tab.key}
              href={hrefFor(tab.key)}
              scroll={false}
              style={{
                border: `1px solid ${current ? T.PURPLE : T.RULE_STRONG}`,
                borderRadius: 999,
                background: current ? T.PURPLE : "#fff",
                color: current ? "#fff" : T.INK_2,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: current
                  ? "0 8px 18px rgba(27, 43, 92, 0.18)"
                  : "none",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── T-6 (Bind 2): Substrate-bound pressure card ─────────────────────────────
//
// Renders a Pressure card from a pre-composed `PressureCardView`. Maps the
// view-model's confidence enum to the existing cvalStyle/ConfTag treatment
// so visual doctrine holds across substrate-bound and legacy code paths.
function SubstratePressure({
  card,
  detailHref,
}: {
  card: PressureCardView;
  detailHref?: string;
}) {
  const conf: Confidence =
    card.magnitudeConfidence === "high"
      ? "high"
      : card.magnitudeConfidence === "med"
        ? "med"
        : "low";
  const showConfTag = card.magnitudeConfidence !== "high";
  return (
    <Pressure
      type={card.type}
      id={card.id}
      label={card.label}
      headline={card.headline}
      lede={card.lede}
      meta={card.meta.map((m) => ({ k: m.k, v: m.v }))}
      magnitude={
        <span style={cvalStyle(conf)}>
          {card.magnitudeValue}
          {card.magnitudeUnit && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                fontStyle: "italic",
                color: T.GRAY_DK,
                marginLeft: 2,
                letterSpacing: 0,
              }}
            >
              {card.magnitudeUnit}
            </span>
          )}
          {showConfTag && <ConfTag conf={conf} />}
        </span>
      }
      magnitudeLabel={card.magnitudeLabel}
      nextAction={card.nextAction}
      detailHref={detailHref}
    />
  );
}

// ─── Pressure card ────────────────────────────────────────────────────────────
type PressureType = "cost" | "dupl" | "vend" | "adopt" | "value";
type PortfolioCanvasView =
  | "pressures"
  | "alignment"
  | "contract"
  | "adoption"
  | "evidence";

interface PressureProps {
  type: PressureType;
  id: string;
  label: string; // e.g. "Cost\nOverrun"
  headline: string;
  lede: ReactNode;
  meta: { k: string; v: string }[];
  magnitude: ReactNode;
  magnitudeLabel: string;
  nextAction: ReactNode;
  detailHref?: string;
}

function pressureColor(type: PressureType): string {
  if (type === "cost") return T.P_COST;
  if (type === "dupl") return T.P_DUPL;
  if (type === "vend") return T.P_VEND;
  if (type === "adopt") return T.P_ADOPT;
  return T.P_VALUE;
}

function Pressure(props: PressureProps) {
  const labelColor = pressureColor(props.type);
  const labelLines = props.label.split("\n");
  const wrapperStyle: CSSProperties = {
    padding: "22px 0",
    borderTop: `1px solid ${T.RULE}`,
    display: "grid",
    gridTemplateColumns: "110px 1fr 320px",
    gap: 24,
    alignItems: "start",
    cursor: props.detailHref ? "pointer" : "default",
    color: "inherit",
    textDecoration: "none",
  };
  const content = (
    <>
      {/* ptag */}
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9.5,
          letterSpacing: "1.5px",
          fontWeight: 800,
          textTransform: "uppercase",
          lineHeight: 1.4,
        }}
      >
        <span
          style={{
            display: "block",
            color: T.GRAY_DK,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {props.id}
        </span>
        <span style={{ color: labelColor }}>
          {labelLines.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </span>
      </div>

      {/* body */}
      <div>
        <h3
          style={{
            fontFamily: T.SERIF,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
            marginBottom: 6,
            margin: 0,
            color: T.INK,
          }}
        >
          {props.headline}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: T.INK_2,
            lineHeight: 1.5,
            maxWidth: "60ch",
            margin: "6px 0 10px",
          }}
        >
          {props.lede}
        </p>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            fontFamily: T.MONO,
            fontSize: 9.5,
            letterSpacing: "1.2px",
            color: T.GRAY_DK,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {props.meta.map((m, i) => (
            <span key={m.k} style={{ display: "inline-flex", gap: 4 }}>
              {i > 0 && (
                <span style={{ color: T.GRAY, marginRight: 10 }}>·</span>
              )}
              <span>
                <strong style={{ color: T.INK, fontWeight: 700 }}>
                  {m.k}:
                </strong>{" "}
                {m.v}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* panel-right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: T.SERIF,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.7px",
            lineHeight: 1,
          }}
        >
          {props.magnitude}
        </div>
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 9,
            letterSpacing: "1.3px",
            color: T.GRAY_DK,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {props.magnitudeLabel}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: T.INK_2,
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {props.nextAction}
        </div>
      </div>
    </>
  );

  if (props.detailHref) {
    return (
      <Link
        href={props.detailHref}
        scroll={false}
        data-testid={`tower-pressure-detail-link-${props.id}`}
        title="Open Tower detail in this canvas"
        style={wrapperStyle}
      >
        {content}
      </Link>
    );
  }

  return <div style={wrapperStyle}>{content}</div>;
}

// ─── Strategic alignment matrix ───────────────────────────────────────────────
interface MatrixDot {
  name: string;
  amount: string;
  left: string;
  top: string;
  /** T-4: substrate-derived dots carry extra context for outline weight + ⭐ marker. */
  displayId?: string;
  alignedCallout?: boolean;
  confidenceLevel?: "HIGH" | "MED" | "LOW";
}

function resolveQuadrantDots(
  view: StrategicAlignment2x2View,
  quadrant: AlignmentQuadrant,
): MatrixDot[] {
  if (view.dots.length === 0) return [];
  const grouped = dotsByQuadrant(view);
  const live = grouped[quadrant] ?? [];
  return live.map((d: AlignmentDot) => ({
    name: d.name,
    amount: d.amount,
    left: d.positionLeft,
    top: d.positionTop,
    displayId: d.displayId,
    alignedCallout: d.alignedCallout,
    confidenceLevel: d.confidenceLevel,
  }));
}

function TowerEmptyState({
  eyebrow,
  title,
  body,
  style,
}: {
  eyebrow: string;
  title: string;
  body: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        border: `1px dashed ${T.RULE_STRONG}`,
        background: T.CREAM_2,
        padding: "16px 18px",
        borderRadius: 8,
        color: T.INK_2,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: T.GOLD,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: T.SERIF,
          fontSize: 16,
          fontWeight: 700,
          color: T.INK,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.5,
          color: T.GRAY_DK,
          marginTop: 4,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function atlasDecisionSupportDisclosure(view?: AtlasObservationsView): {
  label: string;
  boundary: string;
  citations: string;
  assumptions: string;
  confidence: string;
} {
  const accountability =
    view && "accountabilityDisclosure" in view
      ? (view.accountabilityDisclosure as {
          decisionSupportLabel?: string;
          humanDecisionBoundary?: string;
          citationSummary?: string;
          assumptionDisclosure?: string;
          confidenceDisclosure?: string;
        })
      : null;

  return {
    label:
      accountability?.decisionSupportLabel ?? "AI-assisted decision support",
    boundary:
      accountability?.humanDecisionBoundary ??
      "aVa supports executive review only; it does not approve spend, vendor actions, sequencing, or program status changes.",
    citations:
      accountability?.citationSummary ??
      (view?.isEmpty
        ? "No citations are available because Tower substrate is missing."
        : "Citations are available in the supporting Tower evidence views."),
    assumptions:
      accountability?.assumptionDisclosure ??
      "Assumes the visible Tower registry, vendor rows, pressure cards, and evidence map are the current substrate for this read.",
    confidence:
      accountability?.confidenceDisclosure ??
      (view?.isEmpty
        ? "Confidence is low until tenant-bound Tower substrate is loaded."
        : "Confidence follows the visible Tower evidence and missing-data posture."),
  };
}

function TowerAtlasDisclosurePanel({
  view,
  compact = false,
}: {
  view?: AtlasObservationsView;
  compact?: boolean;
}) {
  const disclosure = atlasDecisionSupportDisclosure(view);
  return (
    <div
      data-testid={
        compact ? "tower-atlas-disclosure-compact" : "tower-atlas-disclosure"
      }
      style={{
        border: `1px solid ${T.RULE}`,
        borderRadius: 8,
        background: compact ? "#ffffff" : "#fdfdfc",
        padding: compact ? "9px 11px" : "13px 15px",
        marginTop: compact ? 10 : 0,
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: compact ? 8.5 : 9,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: T.GOLD,
          fontWeight: 800,
        }}
      >
        {disclosure.label} · human review required
      </div>
      <div
        style={{
          marginTop: 5,
          color: T.INK_2,
          fontSize: compact ? 11.5 : 12.5,
          lineHeight: 1.45,
        }}
      >
        {disclosure.boundary}
      </div>
      {!compact ? (
        <div
          style={{
            display: "grid",
            gap: 5,
            marginTop: 9,
            color: T.GRAY_DK,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <div>
            <strong style={{ color: T.INK }}>Citations:</strong>{" "}
            {disclosure.citations}
          </div>
          <div>
            <strong style={{ color: T.INK }}>Assumptions:</strong>{" "}
            {disclosure.assumptions}
          </div>
          <div>
            <strong style={{ color: T.INK }}>Confidence:</strong>{" "}
            {disclosure.confidence}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 5,
            color: T.GRAY_DK,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {disclosure.citations}
        </div>
      )}
    </div>
  );
}

function formatMoney(usd: number | null | undefined): string {
  const value = Number(usd ?? 0);
  if (!value) return "$0";
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function labelize(value: string | null | undefined): string {
  if (!value) return "Unassigned";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STATUS_MEANING: Record<string, string> = {
  adoption_gap:
    "Usage or operating-model evidence is below target. The issue is enablement, workflow change, or habit formation.",
  value_lag:
    "Measured value trails the commitment. The issue is realization evidence, not necessarily project activity.",
  healthy:
    "Current evidence supports the plan. Keep monitoring; this is not a promise that the program is finished.",
  foundation_phase:
    "The work is building readiness or platform capacity. It should not be judged like an ROI-producing scaled program yet.",
  stalled:
    "Decision or execution progress has stopped long enough to need an owner intervention.",
  duplication_risk:
    "Scope overlaps with another tool, vendor, or initiative and may split adoption or spend accountability.",
  cost_overrun:
    "Spend is above the expected path or commitment without enough offsetting measured value.",
  in_move:
    "The initiative is already inside an active strategic move and should be managed through that governance path.",
};

function statusMeaning(statusFlag: string | null | undefined): string {
  return (
    STATUS_MEANING[statusFlag ?? ""] ??
    "A DB status flag exists, but Tower has no special interpretation for it yet."
  );
}

function formatMetricValue(
  value: number | null | undefined,
  unit: string | null | undefined,
): string {
  const n = Number(value ?? 0);
  if (unit === "$") return formatMoney(n);
  const rounded =
    Math.abs(n) >= 100
      ? Math.round(n).toString()
      : Number.isInteger(n)
        ? String(n)
        : n.toFixed(1);
  return unit === "%" ? `${rounded}%` : `${rounded}${unit ? ` ${unit}` : ""}`;
}

function dateValueToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function formatDateLabel(value: unknown, fallback: string): string {
  const iso = dateValueToIso(value);
  if (!iso) return fallback;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return iso;
  return iso.slice(0, 10);
}

function stageTone(stage: string | null | undefined): string {
  if (stage === "scaled") return T.GREEN;
  if (stage === "pilot") return T.AMBER;
  if (stage === "multi_year_strategic_bet") return T.PURPLE;
  return T.GRAY_DK;
}

function workspaceTitle(activeTab: TowerTabKey): string {
  if (activeTab === "scorecards") return "Scorecards";
  if (activeTab === "programme_gates") return "Portfolio Gates";
  if (activeTab === "dependencies") return "Dependencies";
  if (activeTab === "executive_brief") return "Executive Brief";
  return "The IT Portfolio";
}

type DetailHrefBuilder = (
  displayId: string | null | undefined,
  pressureId?: string | null,
) => string | undefined;

type TowerDetailKpi = {
  kpiName: string;
  kpiUnit: string | null;
  quarter: string;
  kpiValue: number;
  targetValue: number | null;
  peerMedian: number | null;
  confidenceLevel: string;
};

type TowerDetailDecision = {
  decisionId: string;
  decisionName: string;
  decisionDate: string | null;
  sponsorName: string | null;
  decisionStatus: string;
  dissentRecorded: boolean;
  dissentSummary: string | null;
  outcomeStatus: string | null;
};

type TowerDetailStakeholderNote = {
  noteId: string;
  stakeholderName: string;
  stakeholderTitle: string;
  interviewDate: string;
  quote: string;
  themes: ReadonlyArray<string>;
  attributionConsent: boolean;
};

type TowerDetailVendor = {
  vendorId: string;
  vendorName: string;
  contractValueUsd: number | null;
  renewalDate: string | null;
  financialHealth: string | null;
  notes: string | null;
};

type TowerDetailScenario = {
  scenarioId: string;
  scenarioName: string;
  triggerEvent: string | null;
  timeHorizonMonths: number | null;
  probabilityPct: number | null;
  impactSummary: string;
};

type TowerInitiativeDetailPayload = {
  kpis: ReadonlyArray<TowerDetailKpi>;
  stakeholderNotes: ReadonlyArray<TowerDetailStakeholderNote>;
  decisions: ReadonlyArray<TowerDetailDecision>;
  vendors: ReadonlyArray<TowerDetailVendor>;
  scenarios: ReadonlyArray<TowerDetailScenario>;
};

function defaultPortfolioCanvasView(lens: TowerLens): PortfolioCanvasView {
  return lens === "value" ? "alignment" : "pressures";
}

function portfolioPressureCardsForCanvas(
  cards: ReadonlyArray<PressureCardView>,
  view: PortfolioCanvasView,
): ReadonlyArray<PressureCardView> {
  if (view === "contract") return cards.filter((card) => card.type === "vend");
  if (view === "adoption") return cards.filter((card) => card.type === "adopt");
  if (view === "pressures")
    return cards.filter(
      (card) =>
        card.type === "cost" || card.type === "dupl" || card.type === "value",
    );
  return cards;
}

function portfolioCanvasNarrative(
  view: PortfolioCanvasView,
  count: number,
): { eyebrow: string; headline: string; body: string } {
  if (view === "contract") {
    return {
      eyebrow: `Renewal clocks · ${count} inside the decision window`,
      headline:
        count === 1
          ? "1 renewal decision needs a CFO posture."
          : `${count} renewal decisions need a CFO posture.`,
      body: "Renewal windows are tied to the owning initiative, contract value, vendor health, and the next executive decision.",
    };
  }
  if (view === "adoption") {
    return {
      eyebrow: `Adoption blockers · ${count} active`,
      headline:
        count === 1
          ? "1 adoption blocker needs an enablement posture."
          : `${count} adoption blockers need an enablement posture.`,
      body: "Adoption gaps show where value depends on usage, workflow change, training, and operating-model conversion.",
    };
  }
  return {
    eyebrow: `Risk pressures · ${count} active`,
    headline:
      count === 1
        ? "1 risk pressure needs owner intervention."
        : `${count} risk pressures need owner intervention.`,
    body: "Cost, duplication, and value-lag pressures stay together so the CFO can see what needs an owner decision now.",
  };
}

function workspaceQuestion(activeTab: TowerTabKey): string {
  if (activeTab === "scorecards")
    return "Which AI initiatives are performing, lagging, or missing decision-grade evidence?";
  if (activeTab === "programme_gates")
    return "Where are initiatives stuck, and which governance decisions unblock value?";
  if (activeTab === "dependencies")
    return "Which vendor, platform, and adoption dependencies could change portfolio outcomes?";
  if (activeTab === "executive_brief")
    return "What should the executive sponsor say, decide, or ask for in the next governance meeting?";
  return "Is the AI portfolio creating measurable value, and what needs executive action now?";
}

function findInitiativeDetail(
  initiatives: ReadonlyArray<AIInitiative>,
  rawId: string | null,
): AIInitiative | null {
  if (!rawId) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawId).trim().toLowerCase();
  } catch {
    return null;
  }
  return (
    initiatives.find(
      (initiative) =>
        initiative.displayId.toLowerCase() === decoded ||
        initiative.initiativeId.toLowerCase() === decoded,
    ) ?? null
  );
}

function TowerInlineDetailPanel({
  detailId,
  initiative,
  vendors,
  pressure,
  closeHref,
}: {
  detailId: string | null;
  initiative: AIInitiative | null;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  pressure: PressureCardView | null;
  closeHref: string;
}) {
  const [loadedDetail, setLoadedDetail] =
    useState<TowerInitiativeDetailPayload | null>(null);
  const [detailState, setDetailState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (!detailId || !initiative) return;

    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setDetailState("loading");
      setLoadedDetail(null);
    });

    fetch(
      `/api/tower/initiative-detail?displayId=${encodeURIComponent(initiative.displayId)}`,
      {
        signal: controller.signal,
      },
    )
      .then(async (res) => {
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          detail?: TowerInitiativeDetailPayload;
        } | null;
        if (!res.ok || !json?.ok || !json.detail)
          throw new Error("detail unavailable");
        setLoadedDetail(json.detail);
        setDetailState("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadedDetail(null);
        setDetailState("error");
      });

    return () => controller.abort();
  }, [detailId, initiative]);

  if (!detailId) return null;

  if (!initiative) {
    return (
      <section
        style={{ padding: "18px 32px 0" }}
        data-testid="tower-inline-detail-panel"
      >
        <TowerEmptyState
          eyebrow="Detail unavailable"
          title="Tower could not find that item in the active tenant substrate."
          body="The URL points at an initiative that is not present for the logged-in client's DB rows. No fixture detail has been substituted."
        />
        <div style={{ marginTop: 12 }}>
          <Link
            href={closeHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1px solid ${T.RULE_STRONG}`,
              borderRadius: 8,
              background: T.CREAM_2,
              color: T.INK,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Return to portfolio
          </Link>
        </div>
      </section>
    );
  }

  const linkedVendors = vendors.filter(
    (vendor) => vendor.initiativeId === initiative.initiativeId,
  );
  const detailVendors = loadedDetail?.vendors ?? [];
  const vendorCount = detailVendors.length || linkedVendors.length;
  const kpis = loadedDetail?.kpis ?? [];
  const decisions = loadedDetail?.decisions ?? [];
  const stakeholderNotes = loadedDetail?.stakeholderNotes ?? [];
  const scenarios = loadedDetail?.scenarios ?? [];
  const committed =
    initiative.committedAnnualUsd ?? initiative.committedTotalUsd ?? 0;
  const measured = initiative.measuredValueUsd ?? 0;
  const delta = measured - committed;
  const latestKpis = [...kpis].slice(-6).reverse();
  const kpiNames = new Set(kpis.map((kpi) => kpi.kpiName));
  const quarters = new Set(kpis.map((kpi) => kpi.quarter));
  const dissentCount = decisions.filter(
    (decision) => decision.dissentRecorded,
  ).length;
  const consentedNotes = stakeholderNotes.filter(
    (note) => note.attributionConsent,
  );

  return (
    <section
      data-testid="tower-inline-detail-panel"
      style={{
        margin: "18px 32px 4px",
        border: `1px solid ${T.RULE_STRONG}`,
        borderRadius: 10,
        background: T.CREAM_2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${T.RULE}`,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.MONO,
              fontSize: 9.5,
              letterSpacing: "1.7px",
              textTransform: "uppercase",
              color: T.GOLD,
              fontWeight: 800,
            }}
          >
            Detail canvas · {initiative.displayId} ·{" "}
            {labelize(initiative.stage)}
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontFamily: T.SERIF,
              fontSize: 26,
              lineHeight: 1.08,
              color: T.INK,
            }}
          >
            {initiative.name}
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              maxWidth: "82ch",
              color: T.INK_2,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            {initiative.description}
          </p>
        </div>
        <Link
          href={closeHref}
          scroll={false}
          style={{
            alignSelf: "flex-start",
            fontFamily: T.MONO,
            fontSize: 10,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: T.INK_2,
            textDecoration: "none",
            border: `1px solid ${T.RULE_STRONG}`,
            borderRadius: 999,
            padding: "7px 10px",
            background: "#fff",
          }}
        >
          Close detail
        </Link>
      </div>

      <div style={{ padding: 18, display: "grid", gap: 16 }}>
        {detailState === "loading" ? (
          <div style={{ fontSize: 12.5, color: T.GRAY_DK }}>
            Loading DB evidence for this initiative...
          </div>
        ) : detailState === "error" ? (
          <TowerEmptyState
            eyebrow="Supporting substrate unavailable"
            title="Tower is showing registry and vendor rows only."
            body="The richer KPI, decision, stakeholder, and scenario packet could not be loaded from the active-client DB route."
          />
        ) : null}

        {pressure ? (
          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderLeft: `4px solid ${pressureColor(pressure.type)}`,
              borderRadius: 8,
              background: "#fff",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              Selected pressure · {pressure.id}
            </div>
            <div
              style={{
                marginTop: 5,
                fontFamily: T.SERIF,
                fontSize: 18,
                color: T.INK,
                fontWeight: 750,
              }}
            >
              {pressure.headline}
            </div>
            <div
              style={{
                marginTop: 5,
                color: T.INK_2,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {pressure.nextAction}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <DataCard
            title="Committed"
            meta="DB registry"
            detail={formatMoney(committed)}
            accent={T.PURPLE}
          />
          <DataCard
            title="Measured value"
            meta="DB registry"
            detail={formatMoney(measured)}
            accent={measured > 0 ? T.GREEN : T.GRAY}
          />
          <DataCard
            title="Delta"
            meta="Measured minus committed"
            detail={formatMoney(delta)}
            accent={delta >= 0 ? T.GREEN : T.RED}
          />
          <DataCard
            title="Evidence depth"
            meta="Loaded detail rows"
            detail={`${kpis.length} KPI · ${decisions.length} decisions · ${scenarios.length} scenarios`}
            accent={kpis.length > 0 ? T.GREEN : T.GRAY}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
            gap: 14,
          }}
        >
          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              aVa read · {labelize(initiative.statusFlag)} · confidence{" "}
              {initiative.confidenceLevel}
            </div>
            <p
              style={{
                margin: "8px 0 0",
                color: T.INK_2,
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {initiative.statusSummary}
            </p>
            {initiative.alignedRationale ? (
              <p
                style={{
                  margin: "10px 0 0",
                  color: T.INK,
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <strong>Alignment rationale:</strong>{" "}
                {initiative.alignedRationale}
              </p>
            ) : null}
            <p
              style={{
                margin: "10px 0 0",
                color: T.GRAY_DK,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              Meaning: {statusMeaning(initiative.statusFlag)}
            </p>
          </div>
          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              Ownership
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: T.SERIF,
                fontSize: 18,
                fontWeight: 750,
                color: T.INK,
              }}
            >
              {initiative.ownerName}
            </div>
            <div
              style={{
                marginTop: 4,
                color: T.INK_2,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {initiative.ownerTitle} ·{" "}
              {initiative.ownerFunction ?? "Unassigned function"}
            </div>
            <div
              style={{
                marginTop: 8,
                color: T.GRAY_DK,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {initiative.primaryGoalName} · {initiative.primaryCategoryName}
            </div>
            <div
              style={{
                marginTop: 10,
                color: stageTone(initiative.stage),
                fontSize: 12.5,
                lineHeight: 1.5,
                fontWeight: 800,
              }}
            >
              {labelize(initiative.stage)} ·{" "}
              {initiative.stageDetail ?? initiative.statusSummary}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 14,
          }}
        >
          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              KPI evidence · {kpiNames.size} metrics · {quarters.size} quarters
            </div>
            {latestKpis.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {latestKpis.map((kpi, index) => (
                  <div
                    key={`${kpi.kpiName}-${kpi.quarter}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      borderTop: index === 0 ? "none" : `1px solid ${T.RULE}`,
                      paddingTop: index === 0 ? 0 : 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: T.INK,
                          fontSize: 12.5,
                        }}
                      >
                        {kpi.kpiName}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          color: T.GRAY_DK,
                          fontSize: 11.5,
                        }}
                      >
                        {kpi.quarter} · target{" "}
                        {formatMetricValue(kpi.targetValue, kpi.kpiUnit)} · peer{" "}
                        {kpi.peerMedian === null
                          ? "n/a"
                          : formatMetricValue(kpi.peerMedian, kpi.kpiUnit)}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontFamily: T.SERIF,
                        fontWeight: 850,
                        fontSize: 18,
                        color: T.INK,
                      }}
                    >
                      {formatMetricValue(kpi.kpiValue, kpi.kpiUnit)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: T.GRAY_DK, fontSize: 12.5 }}>
                No KPI rows loaded for this initiative.
              </div>
            )}
          </div>

          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              Decisions · {decisions.length} rows · {dissentCount} dissent
            </div>
            {decisions.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
                {decisions.slice(0, 4).map((decision) => (
                  <div
                    key={decision.decisionId}
                    style={{
                      borderLeft: `3px solid ${decision.dissentRecorded ? T.AMBER : T.GREEN}`,
                      paddingLeft: 10,
                    }}
                  >
                    <div
                      style={{ fontWeight: 800, color: T.INK, fontSize: 12.5 }}
                    >
                      {decision.decisionName}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        color: T.GRAY_DK,
                        fontSize: 11.5,
                        lineHeight: 1.45,
                      }}
                    >
                      {labelize(decision.decisionStatus)} ·{" "}
                      {decision.sponsorName ?? "Sponsor unassigned"} ·{" "}
                      {formatDateLabel(decision.decisionDate, "date pending")}
                    </div>
                    {decision.dissentSummary ? (
                      <div
                        style={{
                          marginTop: 3,
                          color: T.AMBER,
                          fontSize: 11.5,
                          lineHeight: 1.4,
                        }}
                      >
                        {decision.dissentSummary}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: T.GRAY_DK, fontSize: 12.5 }}>
                No decision rows loaded for this initiative.
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 14,
          }}
        >
          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              Stakeholder evidence · {stakeholderNotes.length} notes ·{" "}
              {consentedNotes.length} quotable
            </div>
            {stakeholderNotes.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
                {stakeholderNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.noteId}
                    style={{ borderTop: `1px solid ${T.RULE}`, paddingTop: 8 }}
                  >
                    <div
                      style={{ fontWeight: 800, color: T.INK, fontSize: 12.5 }}
                    >
                      {note.attributionConsent
                        ? note.stakeholderName
                        : "Theme-only stakeholder"}{" "}
                      · {note.stakeholderTitle}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        color: T.GRAY_DK,
                        fontSize: 11.5,
                        lineHeight: 1.45,
                      }}
                    >
                      {note.attributionConsent
                        ? note.quote
                        : `Themes: ${note.themes.join(", ") || "not tagged"}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: T.GRAY_DK, fontSize: 12.5 }}>
                No stakeholder notes loaded for this initiative.
              </div>
            )}
          </div>

          <div
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 8,
              background: "#fff",
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: T.GRAY_DK,
                fontWeight: 800,
              }}
            >
              Scenario library · {scenarios.length} paths
            </div>
            {scenarios.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
                {scenarios.slice(0, 3).map((scenario) => (
                  <div
                    key={scenario.scenarioId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: 10,
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: T.SERIF,
                        fontSize: 20,
                        lineHeight: 1,
                        fontWeight: 850,
                        color: T.PURPLE,
                      }}
                    >
                      {scenario.probabilityPct ?? 0}%
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: T.INK,
                          fontSize: 12.5,
                        }}
                      >
                        {scenario.scenarioName}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          color: T.GRAY_DK,
                          fontSize: 11.5,
                          lineHeight: 1.45,
                        }}
                      >
                        {scenario.impactSummary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: T.GRAY_DK, fontSize: 12.5 }}>
                No scenario rows loaded for this initiative.
              </div>
            )}
          </div>
        </div>

        {vendorCount > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {(detailVendors.length > 0 ? detailVendors : linkedVendors).map(
              (vendor) => (
                <div
                  key={vendor.vendorId}
                  style={{
                    border: `1px solid ${T.RULE}`,
                    borderRadius: 8,
                    background: "#fff",
                    padding: "11px 13px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: T.INK }}>
                      {vendor.vendorName}
                    </div>
                    <div
                      style={{ marginTop: 3, color: T.GRAY_DK, fontSize: 12 }}
                    >
                      Contract {formatMoney(vendor.contractValueUsd)} · health{" "}
                      {labelize(vendor.financialHealth)}
                      {"notes" in vendor && vendor.notes
                        ? ` · ${vendor.notes}`
                        : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: T.MONO,
                      fontSize: 10,
                      letterSpacing: "1.2px",
                      color: T.GRAY_DK,
                      textTransform: "uppercase",
                    }}
                  >
                    {formatDateLabel(vendor.renewalDate, "No renewal date")}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <TowerEmptyState
            eyebrow="No vendor rows"
            title="No linked vendor dependencies are loaded for this initiative."
            body="The detail canvas is staying DB-honest: no renewal or dependency fixture is being added."
          />
        )}
      </div>
    </section>
  );
}

function stageSort(stage: string): number {
  const order = [
    "intake",
    "pilot",
    "scaled",
    "multi_year_strategic_bet",
    "retired",
  ];
  const index = order.indexOf(stage);
  return index >= 0 ? index : 99;
}

const STATUS_RISK_RANK: Record<string, number> = {
  cost_overrun: 0,
  stalled: 1,
  duplication_risk: 2,
  value_lag: 3,
  adoption_gap: 4,
  healthy: 8,
};

const HEALTH_RISK_RANK: Record<string, number> = {
  at_risk: 0,
  watch: 1,
  moderate: 2,
  strong: 3,
};

function initiativeCommitment(initiative: AIInitiative): number {
  return initiative.committedAnnualUsd ?? initiative.committedTotalUsd ?? 0;
}

function initiativeMeasured(initiative: AIInitiative): number {
  return initiative.measuredValueUsd ?? 0;
}

function initiativeDelta(initiative: AIInitiative): number {
  return initiativeMeasured(initiative) - initiativeCommitment(initiative);
}

function renewalRank(date: unknown): number {
  const iso = dateValueToIso(date);
  if (!iso) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function daysUntilLabel(date: unknown): string {
  const iso = dateValueToIso(date);
  if (!iso) return "no renewal date";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((parsed - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d past renewal`;
  if (diff === 0) return "renews today";
  return `${diff}d to renewal`;
}

function vendorsByDisplayId(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
): Map<string, AIInitiativeVendorRow[]> {
  const grouped = new Map<string, AIInitiativeVendorRow[]>();
  for (const vendor of vendors) {
    const rows = grouped.get(vendor.initiativeDisplayId) ?? [];
    rows.push(vendor);
    grouped.set(vendor.initiativeDisplayId, rows);
  }
  return grouped;
}

function nearestVendor(
  rows: ReadonlyArray<AIInitiativeVendorRow>,
): AIInitiativeVendorRow | null {
  return (
    [...rows].sort(
      (a, b) => renewalRank(a.renewalDate) - renewalRank(b.renewalDate),
    )[0] ?? null
  );
}

function rankInitiativesForLens(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  lens: TowerLens,
): AIInitiative[] {
  const vendorMap = vendorsByDisplayId(vendors);
  return [...initiatives].sort((a, b) => {
    if (lens === "contract") {
      const aVendor = nearestVendor(vendorMap.get(a.displayId) ?? []);
      const bVendor = nearestVendor(vendorMap.get(b.displayId) ?? []);
      const renewalDelta =
        renewalRank(aVendor?.renewalDate) - renewalRank(bVendor?.renewalDate);
      if (renewalDelta !== 0) return renewalDelta;
      return (
        (bVendor?.contractValueUsd ?? 0) - (aVendor?.contractValueUsd ?? 0)
      );
    }
    if (lens === "risk") {
      const riskDelta =
        (STATUS_RISK_RANK[a.statusFlag] ?? 7) -
        (STATUS_RISK_RANK[b.statusFlag] ?? 7);
      if (riskDelta !== 0) return riskDelta;
      return initiativeCommitment(b) - initiativeCommitment(a);
    }
    if (lens === "adopt") {
      const adoptDelta =
        (a.statusFlag === "adoption_gap" ? 0 : 1) -
        (b.statusFlag === "adoption_gap" ? 0 : 1);
      if (adoptDelta !== 0) return adoptDelta;
      const stageDelta = stageSort(a.stage) - stageSort(b.stage);
      if (stageDelta !== 0) return stageDelta;
      return initiativeCommitment(b) - initiativeCommitment(a);
    }
    const valueDelta = initiativeDelta(a) - initiativeDelta(b);
    if (valueDelta !== 0) return valueDelta;
    return initiativeCommitment(b) - initiativeCommitment(a);
  });
}

function rankVendorsForLens(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  initiatives: ReadonlyArray<AIInitiative>,
  lens: TowerLens,
): AIInitiativeVendorRow[] {
  const initiativeById = new Map(
    initiatives.map(
      (initiative) => [initiative.initiativeId, initiative] as const,
    ),
  );
  return [...vendors].sort((a, b) => {
    const ai = initiativeById.get(a.initiativeId);
    const bi = initiativeById.get(b.initiativeId);
    if (lens === "risk") {
      const healthDelta =
        (HEALTH_RISK_RANK[a.financialHealth ?? "moderate"] ?? 2) -
        (HEALTH_RISK_RANK[b.financialHealth ?? "moderate"] ?? 2);
      if (healthDelta !== 0) return healthDelta;
      return (
        (STATUS_RISK_RANK[ai?.statusFlag ?? "healthy"] ?? 7) -
        (STATUS_RISK_RANK[bi?.statusFlag ?? "healthy"] ?? 7)
      );
    }
    if (lens === "value") {
      return (b.contractValueUsd ?? 0) - (a.contractValueUsd ?? 0);
    }
    if (lens === "adopt") {
      const adoptDelta =
        (ai?.statusFlag === "adoption_gap" ? 0 : 1) -
        (bi?.statusFlag === "adoption_gap" ? 0 : 1);
      if (adoptDelta !== 0) return adoptDelta;
      return stageSort(ai?.stage ?? "") - stageSort(bi?.stage ?? "");
    }
    return renewalRank(a.renewalDate) - renewalRank(b.renewalDate);
  });
}

function lensLabel(lens: TowerLens): string {
  if (lens === "risk") return "Risk";
  if (lens === "contract") return "Contract";
  if (lens === "adopt") return "Adoption";
  return "Value";
}

function lensAccent(lens: TowerLens): string {
  if (lens === "risk") return T.RED;
  if (lens === "contract") return T.PURPLE;
  if (lens === "adopt") return T.GREEN;
  return T.GOLD;
}

function initiativeLensMeta(initiative: AIInitiative, lens: TowerLens): string {
  if (lens === "risk")
    return `${initiative.displayId} · risk posture · ${labelize(initiative.statusFlag)}`;
  if (lens === "contract")
    return `${initiative.displayId} · vendor exposure · ${initiative.confidenceLevel}`;
  if (lens === "adopt")
    return `${initiative.displayId} · adoption path · ${labelize(initiative.stage)}`;
  return `${initiative.displayId} · value realization · ${initiative.confidenceLevel}`;
}

function initiativeLensDetail(
  initiative: AIInitiative,
  linkedVendors: ReadonlyArray<AIInitiativeVendorRow>,
  lens: TowerLens,
): string {
  const committed = initiativeCommitment(initiative);
  const measured = initiativeMeasured(initiative);
  const delta = initiativeDelta(initiative);
  if (lens === "risk") {
    return `${labelize(initiative.statusFlag)} · ${initiative.statusSummary} Owner: ${initiative.ownerName}. Exposure: ${formatMoney(committed)}.`;
  }
  if (lens === "contract") {
    const vendor = nearestVendor(linkedVendors);
    return vendor
      ? `${vendor.vendorName} · ${daysUntilLabel(vendor.renewalDate)} · contract ${formatMoney(vendor.contractValueUsd)} · health ${labelize(vendor.financialHealth)}.`
      : `No linked vendor rows. ${initiative.name} stays outside the contract clock until ai_initiative_vendors is populated.`;
  }
  if (lens === "adopt") {
    return `${labelize(initiative.stage)} · ${initiative.stageDetail ?? initiative.statusSummary} Goal: ${initiative.primaryGoalName}.`;
  }
  const direction = delta >= 0 ? "above committed" : "below committed";
  return `Measured ${formatMoney(measured)} vs committed ${formatMoney(committed)} · ${formatMoney(Math.abs(delta))} ${direction}.`;
}

function vendorLensDetail(
  vendor: AIInitiativeVendorRow,
  initiative: AIInitiative | undefined,
  lens: TowerLens,
): string {
  if (lens === "risk") {
    return `${vendor.initiativeName}: vendor health is ${labelize(vendor.financialHealth)} from the vendor row; portfolio pressure is ${labelize(initiative?.statusFlag)} from the owning initiative.`;
  }
  if (lens === "value") {
    return `${vendor.initiativeName}: ${formatMoney(vendor.contractValueUsd)} contract exposure compared with ${formatMoney(initiative?.measuredValueUsd)} measured value.`;
  }
  if (lens === "adopt") {
    return `${vendor.initiativeName}: ${labelize(initiative?.statusFlag)} means ${statusMeaning(initiative?.statusFlag)}`;
  }
  return `${vendor.initiativeName}: ${daysUntilLabel(vendor.renewalDate)} on ${formatMoney(vendor.contractValueUsd)} contract exposure; vendor health ${labelize(vendor.financialHealth)}.`;
}

function tabLensNarrative(
  activeTab: TowerTabKey,
  lens: TowerLens,
): { eyebrow: string; title: string; body: string } {
  const label = lensLabel(lens);
  if (activeTab === "scorecards") {
    if (lens === "risk")
      return {
        eyebrow: "Scorecards · Risk posture",
        title: "Which initiatives need executive risk attention first?",
        body: "Rows are ranked by pressure status and spend exposure so a CXO sees the problem list before the healthy list.",
      };
    if (lens === "contract")
      return {
        eyebrow: "Scorecards · Contract exposure",
        title: "Which initiatives are tied to the nearest vendor clocks?",
        body: "Rows with renewal-backed vendor dependencies move up. Initiatives without vendor rows stay disclosed instead of inferred.",
      };
    if (lens === "adopt")
      return {
        eyebrow: "Scorecards · Adoption path",
        title: "Where is adoption blocking value conversion?",
        body: "Adoption gaps and early-stage programs lead so the conversation turns to behavior change, not only spend.",
      };
    return {
      eyebrow: "Scorecards · Value realization",
      title: "Which initiatives are furthest from earning their commitment?",
      body: "Rows are ranked by measured-minus-committed value so the first screen exposes the largest value gaps.",
    };
  }
  if (activeTab === "programme_gates") {
    return {
      eyebrow: `Gates · ${label} lens`,
      title:
        lens === "contract"
          ? "Gate posture, with renewal clocks inside each stage."
          : lens === "risk"
            ? "Gate posture, with the riskiest rows first inside each stage."
            : lens === "adopt"
              ? "Gate posture, with adoption blockers pulled forward."
              : "Gate posture, with value lag visible inside each stage.",
      body: "Stage groupings still come from the DB registry. The lens changes row priority and card evidence inside each stage; it does not invent missing phases.",
    };
  }
  if (activeTab === "dependencies") {
    if (lens === "risk")
      return {
        eyebrow: "Dependencies · Risk lens",
        title:
          "Vendor dependencies ranked by financial health and initiative pressure.",
        body: "At-risk and watch vendors move up, then inherit the owning initiative status so contract risk and portfolio risk stay connected.",
      };
    if (lens === "value")
      return {
        eyebrow: "Dependencies · Value lens",
        title: "Vendor dependencies ranked by contract dollars at stake.",
        body: "The view leads with the biggest spend commitments so a CXO can see where vendor exposure most affects portfolio value.",
      };
    if (lens === "adopt")
      return {
        eyebrow: "Dependencies · Adoption lens",
        title: "Vendor dependencies ranked by adoption blockers.",
        body: "Dependencies attached to adoption-gap initiatives move up so the discussion shifts to enablement, usage, and operating change.",
      };
    return {
      eyebrow: "Dependencies · Contract lens",
      title: "Vendor dependencies ranked by renewal clock.",
      body: "Nearest renewal dates lead. Timing, contract value, and financial health stay attached to the owning initiative row.",
    };
  }
  return {
    eyebrow: `Executive brief · ${label} narrative`,
    title:
      lens === "risk"
        ? "The board read starts with risk concentration."
        : lens === "contract"
          ? "The board read starts with renewal decisions."
          : lens === "adopt"
            ? "The board read starts with adoption conversion."
            : "The board read starts with value realization.",
    body: "The brief is assembled from DB-backed initiatives, vendor rows, pressure cards, and the strategic alignment matrix. The lens changes the executive question and supporting evidence.",
  };
}

function currentPageEvidence(activeTab: TowerTabKey, lens: TowerLens): string {
  if (activeTab === "dependencies") {
    if (lens === "adopt")
      return "Vendors are ranked by the owning initiative status. Adoption Gap is not a vendor diagnosis; it is the initiative adoption signal attached to that vendor dependency.";
    if (lens === "risk")
      return "Vendors are ranked by vendor financial health first, then by the owning initiative pressure. This answers which third-party relationship could amplify portfolio risk.";
    if (lens === "contract")
      return "Vendors are ranked by renewal date. This answers which decision windows are closing before the team has time to improve evidence.";
    return "Vendors are ranked by contract value. This answers where third-party spend most affects the portfolio value story.";
  }
  if (activeTab === "scorecards")
    return "Rows are initiatives. The scorecard status comes from ai_initiatives.status_flag and the dollars come from committed/measured fields in the registry.";
  if (activeTab === "programme_gates")
    return "Rows stay grouped by initiative stage. The lens only changes priority and evidence inside each stage.";
  if (activeTab === "executive_brief")
    return "The brief composes initiatives, vendors, pressure cards, and the 2x2 into an executive narrative. It should read as a decision packet, not a raw dashboard.";
  return "The portfolio view combines the registry, vendor rows, and derived pressure cards into a current-state read.";
}

function TowerDataDesignPanel({
  activeTab,
  activeLens,
  initiatives,
  vendors,
  substrateCounts,
}: {
  activeTab: TowerTabKey;
  activeLens: TowerLens;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  substrateCounts?: TowerSubstrateCounts;
}) {
  const vendorCountByDisplayId = new Map<string, number>();
  for (const vendor of vendors) {
    vendorCountByDisplayId.set(
      vendor.initiativeDisplayId,
      (vendorCountByDisplayId.get(vendor.initiativeDisplayId) ?? 0) + 1,
    );
  }

  const feedRows = [
    {
      feed: "Initiative registry",
      table: "ai_initiatives",
      count: substrateCounts?.initiatives ?? initiatives.length,
      supports:
        "Project name, owner, stage, status, confidence, committed and measured value.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes portfolio, gates, scorecards, and executive pressure cards after validated register rows commit.",
      day1: "PMO portfolio export or AI initiative inventory spreadsheet.",
    },
    {
      feed: "KPI history",
      table: "ai_initiative_kpis",
      count: substrateCounts?.kpis,
      supports:
        "Quarterly actuals, targets, peer medians, and confidence floors behind scorecards.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes value, adoption, risk, and metric explanations after KPI rows pass confidence checks.",
      day1: "Finance/BI export from Power BI, Tableau, Looker, Excel, or metric owners.",
    },
    {
      feed: "Vendor and renewals",
      table: "ai_initiative_vendors",
      count: substrateCounts?.vendors ?? vendors.length,
      supports:
        "Dependencies, contract lens, renewal clock, vendor health, and spend exposure.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes dependency ranking, contract lens, 90-day renewal count, and spend-at-risk cards.",
      day1: "Vendor master, procurement contract register, SaaS renewal calendar, Coupa/Ariba export.",
    },
    {
      feed: "Decision history",
      table: "ai_initiative_decisions",
      count: substrateCounts?.decisions,
      supports:
        "Gate posture, stalled approvals, dissent, and executive-brief decision load.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes gates and executive decision load after steering outcomes are logged.",
      day1: "Steering committee decision log, RAID log, project governance minutes.",
    },
    {
      feed: "Stakeholder notes",
      table: "ai_initiative_stakeholder_notes",
      count: substrateCounts?.stakeholderNotes,
      supports:
        "Adoption blockers, executive quotes, theme-only evidence, and confidence context.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes adoption blockers and aVa citations after consent and theme checks.",
      day1: "Interview notes, change-readiness survey, enablement feedback, workshop notes.",
    },
    {
      feed: "Scenario library",
      table: "ai_initiative_scenarios",
      count: substrateCounts?.scenarios,
      supports:
        "What-if questions, probability-weighted risk, and decision alternatives.",
      refreshNow: "Weekly",
      refreshFuture: "Daily API/export",
      dashboardUpdate:
        "Refreshes what-if answers and risk alternatives after probability and owner review.",
      day1: "Risk register, scenario workbook, architecture dependency assessment.",
    },
  ];

  return (
    <section
      style={{
        border: `1px solid ${T.RULE}`,
        borderRadius: 8,
        margin: "0 0 22px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.RULE}`,
          background: T.CREAM_2,
        }}
      >
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 9,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            color: T.GOLD,
            fontWeight: 800,
          }}
        >
          Current-state evidence map
        </div>
        <h3
          style={{
            margin: "6px 0 0",
            fontFamily: T.SERIF,
            fontSize: 22,
            lineHeight: 1.1,
            color: T.INK,
          }}
        >
          What this page is actually reading.
        </h3>
        <p
          style={{
            margin: "6px 0 0",
            color: T.INK_2,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {currentPageEvidence(activeTab, activeLens)}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
          gap: 0,
        }}
      >
        <div style={{ padding: 16, borderRight: `1px solid ${T.RULE}` }}>
          <div
            style={{
              fontFamily: T.MONO,
              fontSize: 9,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: T.GRAY_DK,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Initiative register now loaded
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    color: T.GRAY_DK,
                    fontFamily: T.MONO,
                    fontSize: 9,
                    letterSpacing: "1.1px",
                    textTransform: "uppercase",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "0 8px 8px 0" }}>ID</th>
                  <th style={{ padding: "0 8px 8px" }}>Initiative</th>
                  <th style={{ padding: "0 8px 8px" }}>State</th>
                  <th style={{ padding: "0 8px 8px" }}>Meaning</th>
                  <th style={{ padding: "0 0 8px 8px", textAlign: "right" }}>
                    Vendors
                  </th>
                </tr>
              </thead>
              <tbody>
                {initiatives.slice(0, 8).map((initiative) => (
                  <tr
                    key={initiative.initiativeId}
                    style={{ borderTop: `1px solid ${T.RULE}` }}
                  >
                    <td
                      style={{
                        padding: "9px 8px 9px 0",
                        fontFamily: T.MONO,
                        fontSize: 10,
                        color: T.GRAY_DK,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {initiative.displayId}
                    </td>
                    <td
                      style={{
                        padding: "9px 8px",
                        color: T.INK,
                        fontWeight: 700,
                      }}
                    >
                      {initiative.name}
                    </td>
                    <td
                      style={{
                        padding: "9px 8px",
                        color: T.INK_2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {labelize(initiative.stage)} ·{" "}
                      {labelize(initiative.statusFlag)}
                    </td>
                    <td
                      style={{
                        padding: "9px 8px",
                        color: T.INK_2,
                        minWidth: 220,
                      }}
                    >
                      {statusMeaning(initiative.statusFlag)}
                    </td>
                    <td
                      style={{
                        padding: "9px 0 9px 8px",
                        color: T.INK_2,
                        textAlign: "right",
                      }}
                    >
                      {vendorCountByDisplayId.get(initiative.displayId) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div
            style={{
              fontFamily: T.MONO,
              fontSize: 9,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: T.GRAY_DK,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Data feeds and Day-1 collection
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {feedRows.map((row) => (
              <div
                key={row.table}
                style={{ borderTop: `1px solid ${T.RULE}`, paddingTop: 9 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <strong style={{ color: T.INK, fontSize: 13 }}>
                    {row.feed}
                  </strong>
                  <span
                    style={{
                      fontFamily: T.MONO,
                      fontSize: 10,
                      color: T.GRAY_DK,
                    }}
                  >
                    {row.count ?? "needed"} rows
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 3,
                    color: T.INK_2,
                    fontSize: 12.5,
                    lineHeight: 1.45,
                  }}
                >
                  {row.supports}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    color: T.INK,
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Refresh: {row.refreshNow} now · {row.refreshFuture} future.
                </div>
                <div
                  style={{
                    marginTop: 3,
                    color: T.GRAY_DK,
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Dashboard rule: {row.dashboardUpdate}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    color: T.GRAY_DK,
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Day 1: {row.day1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TowerTabPanelShell({
  eyebrow,
  title,
  body,
  contextSlot,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  contextSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      style={{ padding: "28px 32px 36px" }}
      data-testid="tower-active-submenu-panel"
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 10,
          letterSpacing: "2px",
          fontWeight: 700,
          color: T.GOLD,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: T.SERIF,
          fontSize: 34,
          fontWeight: 850,
          letterSpacing: "-0.8px",
          lineHeight: 1.05,
          margin: 0,
          color: T.INK,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: "8px 0 22px",
          maxWidth: "68ch",
          fontSize: 13.5,
          color: T.GRAY_DK,
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
      {contextSlot}
      {children}
    </section>
  );
}

function DataCard({
  href,
  title,
  meta,
  detail,
  accent = T.PURPLE,
}: {
  href?: string;
  title: string;
  meta: string;
  detail: string;
  accent?: string;
}) {
  const style: CSSProperties = {
    display: "block",
    border: `1px solid ${T.RULE}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: 8,
    background: T.CREAM_2,
    padding: "14px 16px",
    color: T.INK,
    textDecoration: "none",
  };
  const content = (
    <>
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.3px",
          color: T.GRAY_DK,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {meta}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: T.SERIF,
          fontSize: 18,
          fontWeight: 760,
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12.5,
          color: T.INK_2,
          lineHeight: 1.45,
        }}
      >
        {detail}
      </div>
    </>
  );
  return href ? (
    <Link href={href} scroll={false} style={style}>
      {content}
    </Link>
  ) : (
    <div style={style}>{content}</div>
  );
}

function TowerWorkspaceTabPanel({
  activeTab,
  activeLens,
  initiatives,
  vendors,
  pressuresView,
  substrateCounts,
  detailHrefFor,
}: {
  activeTab: TowerTabKey;
  activeLens: TowerLens;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  pressuresView?: TowerPressuresView;
  substrateCounts?: TowerSubstrateCounts;
  detailHrefFor: DetailHrefBuilder;
}) {
  if (initiatives.length === 0) {
    return (
      <div style={{ padding: "28px 32px 36px" }}>
        <TowerEmptyState
          eyebrow="DB substrate required"
          title="No tenant-bound initiative rows are available for this submenu."
          body="Tower will not render fixture scorecards, gates, dependencies, or briefs. Load this client's AI Initiatives substrate in the database first."
        />
      </div>
    );
  }

  const narrative = tabLensNarrative(activeTab, activeLens);
  const groupedVendors = vendorsByDisplayId(vendors);
  const rankedInitiatives = rankInitiativesForLens(
    initiatives,
    vendors,
    activeLens,
  );
  const rankedVendors = rankVendorsForLens(vendors, initiatives, activeLens);
  const initiativeById = new Map(
    initiatives.map(
      (initiative) => [initiative.initiativeId, initiative] as const,
    ),
  );
  const accent = lensAccent(activeLens);

  if (activeTab === "scorecards") {
    return (
      <TowerTabPanelShell
        eyebrow={narrative.eyebrow}
        title={narrative.title}
        body={narrative.body}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {rankedInitiatives.map((initiative) => {
            const linkedVendors =
              groupedVendors.get(initiative.displayId) ?? [];
            return (
              <DataCard
                key={initiative.initiativeId}
                href={detailHrefFor(initiative.displayId)}
                title={initiative.name}
                meta={initiativeLensMeta(initiative, activeLens)}
                detail={initiativeLensDetail(
                  initiative,
                  linkedVendors,
                  activeLens,
                )}
                accent={
                  initiative.statusFlag === "healthy"
                    ? T.GREEN
                    : initiative.statusFlag === "cost_overrun"
                      ? T.RED
                      : accent
                }
              />
            );
          })}
        </div>
      </TowerTabPanelShell>
    );
  }

  if (activeTab === "programme_gates") {
    const byStage = new Map<string, AIInitiative[]>();
    for (const initiative of rankedInitiatives) {
      const list = byStage.get(initiative.stage) ?? [];
      list.push(initiative);
      byStage.set(initiative.stage, list);
    }
    const stages = [...byStage.entries()].sort(
      ([a], [b]) => stageSort(a) - stageSort(b),
    );
    return (
      <TowerTabPanelShell
        eyebrow={narrative.eyebrow}
        title={narrative.title}
        body={narrative.body}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {stages.map(([stage, rows]) => (
            <section
              key={stage}
              style={{
                border: `1px solid ${T.RULE}`,
                borderRadius: 8,
                padding: 16,
                background: T.CREAM_2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "baseline",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: T.SERIF,
                    fontSize: 20,
                    color: T.INK,
                  }}
                >
                  {labelize(stage)}
                </h3>
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 10,
                    letterSpacing: "1.3px",
                    color: T.GRAY_DK,
                    fontWeight: 700,
                  }}
                >
                  {rows.length} initiative{rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {rows.map((initiative) => {
                  const linkedVendors =
                    groupedVendors.get(initiative.displayId) ?? [];
                  return (
                    <DataCard
                      key={initiative.initiativeId}
                      href={detailHrefFor(initiative.displayId)}
                      title={initiative.name}
                      meta={initiativeLensMeta(initiative, activeLens)}
                      detail={initiativeLensDetail(
                        initiative,
                        linkedVendors,
                        activeLens,
                      )}
                      accent={initiative.alignedCallout ? T.GREEN : accent}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </TowerTabPanelShell>
    );
  }

  if (activeTab === "dependencies") {
    return (
      <TowerTabPanelShell
        eyebrow={narrative.eyebrow}
        title={narrative.title}
        body={narrative.body}
      >
        {vendors.length === 0 ? (
          <TowerEmptyState
            eyebrow="No dependency rows"
            title="No vendor dependency records are loaded for this tenant."
            body="Add ai_initiative_vendors rows to populate dependency and renewal exposure. Tower will not fall back to Apex fixture dependencies."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {rankedVendors.map((vendor) => (
              <DataCard
                key={vendor.vendorId}
                href={detailHrefFor(vendor.initiativeDisplayId)}
                title={vendor.vendorName}
                meta={`${vendor.initiativeDisplayId} · ${activeLens === "contract" ? daysUntilLabel(vendor.renewalDate) : lensLabel(activeLens)}`}
                detail={vendorLensDetail(
                  vendor,
                  initiativeById.get(vendor.initiativeId),
                  activeLens,
                )}
                accent={
                  vendor.financialHealth === "at_risk" ||
                  vendor.financialHealth === "watch"
                    ? T.AMBER
                    : accent
                }
              />
            ))}
          </div>
        )}
      </TowerTabPanelShell>
    );
  }

  const pressureCount = pressuresView?.cards.length ?? 0;
  return (
    <TowerTabPanelShell
      eyebrow={narrative.eyebrow}
      title={narrative.title}
      body={narrative.body}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <DataCard
          title={`${lensLabel(activeLens)} lens`}
          meta="Narrative posture"
          detail={narrative.title}
          accent={accent}
        />
        <DataCard
          title="Active pressures"
          meta="Decision load"
          detail={`${pressureCount} sorted by ${lensLabel(activeLens).toLowerCase()} priority`}
          accent={pressureCount > 0 ? T.RED : T.GREEN}
        />
        <DataCard
          title="Decision evidence"
          meta="Governance load"
          detail={`${substrateCounts?.decisions ?? 0} decision rows · ${substrateCounts?.stakeholderNotes ?? 0} stakeholder notes`}
          accent={T.PURPLE}
        />
      </div>
      {pressureCount > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {pressuresView?.cards.slice(0, 5).map((card) => (
            <DataCard
              key={card.key}
              href={detailHrefFor(card.displayId, card.id)}
              title={card.headline}
              meta={`${card.id} · ${card.magnitudeLabel}`}
              detail={card.nextAction}
              accent={pressureColor(card.type)}
            />
          ))}
        </div>
      ) : (
        <TowerEmptyState
          eyebrow="No pressure cards"
          title="No executive pressure narrative is available."
          body={
            pressuresView?.emptyHint ??
            "Load initiative status flags and vendor renewals before using the executive brief."
          }
        />
      )}
    </TowerTabPanelShell>
  );
}

function Quadrant({
  position,
  qlabel,
  qhead,
  dots,
  detailHrefFor,
}: {
  position: "tl" | "tr" | "bl" | "br";
  qlabel: string;
  qhead: ReactNode;
  dots: MatrixDot[];
  detailHrefFor: DetailHrefBuilder;
}) {
  const styles: CSSProperties = {
    padding: "15px 16px",
    position: "relative",
    background: "#fdfdfc",
    border: `1px solid rgba(16, 29, 73, 0.14)`,
    minHeight: 214,
  };
  if (position === "tl") {
    styles.gridColumn = 2;
    styles.gridRow = 1;
    styles.borderRight = "none";
  } else if (position === "tr") {
    styles.gridColumn = 3;
    styles.gridRow = 1;
  } else if (position === "bl") {
    styles.gridColumn = 2;
    styles.gridRow = 2;
    styles.borderRight = "none";
    styles.borderTop = "none";
  } else {
    styles.gridColumn = 3;
    styles.gridRow = 2;
    styles.borderTop = "none";
  }

  return (
    <div style={styles}>
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.4px",
          fontWeight: 700,
          color: T.GRAY_DK,
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        {qlabel}
      </div>
      <div
        style={{
          fontFamily: T.SERIF,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.2px",
          marginBottom: 12,
          lineHeight: 1.25,
          maxWidth: "30ch",
        }}
      >
        {qhead}
      </div>
      <div style={{ position: "relative", height: 150 }}>
        {dots.map((dot) => {
          const isSubstrate = Boolean(dot.displayId);
          const conf = dot.confidenceLevel ?? "HIGH";
          const borderStyle =
            conf === "HIGH" ? "solid" : conf === "MED" ? "dashed" : "dotted";
          const dotNumber = dot.displayId?.replace(/^[A-Z]+-0*/, "") ?? "";
          const markerTitle = `${dot.displayId ?? dot.name} · ${dot.name} · ${dot.amount}${dot.alignedCallout ? " · aligned callout" : ""}`;
          const dotStyle: CSSProperties = {
            position: "absolute",
            left: dot.left,
            top: dot.top,
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            background: dot.alignedCallout ? T.GOLD : "#fff",
            color: dot.alignedCallout ? T.INK : T.PURPLE,
            fontFamily: T.MONO,
            fontSize: 10,
            letterSpacing: "0.05em",
            fontWeight: 900,
            borderRadius: 999,
            cursor: isSubstrate ? "pointer" : "default",
            border: isSubstrate
              ? `2px ${borderStyle} ${T.PURPLE}`
              : `1px solid ${T.RULE_STRONG}`,
            boxShadow: "0 9px 20px rgba(17, 24, 39, 0.14)",
            textDecoration: "none",
          };
          const dotBody = (
            <>
              <span aria-hidden="true">{dotNumber || "•"}</span>
              {dot.alignedCallout && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: -5,
                    top: -5,
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: T.PURPLE,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 9,
                    lineHeight: 1,
                    border: `1px solid ${T.CREAM_2}`,
                  }}
                >
                  ★
                </span>
              )}
            </>
          );

          if (dot.displayId) {
            const href = detailHrefFor(dot.displayId);
            if (!href)
              return (
                <div key={dot.displayId} style={dotStyle}>
                  {dotBody}
                </div>
              );
            return (
              <Link
                key={dot.displayId}
                href={href}
                scroll={false}
                data-testid={`tower-2x2-dot-${dot.displayId}`}
                data-aligned-callout={dot.alignedCallout ? "true" : undefined}
                title={markerTitle}
                aria-label={`Open ${markerTitle} detail in this canvas`}
                style={dotStyle}
              >
                {dotBody}
              </Link>
            );
          }

          return (
            <div key={dot.name} title={markerTitle} style={dotStyle}>
              {dotBody}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface TowerIndexPageProps {
  tenantName?: string;
  context?: string;
  /** Deterministic Tower as-of date resolved on the server. */
  towerToday?: string;
  /**
   * Tenant client id for the active session — wires the AgentDock chat lane
   * to /api/v1/atlas/chat. When omitted the chat composer disables
   * gracefully (renders the rest of the page unchanged).
   */
  clientId?: string;
  /**
   * T-4 (AI Initiatives Substrate v1.1.0): real registry initiatives to plot
   * in the Strategic Alignment 2×2. When omitted or empty, Tower shows an
   * explicit DB-empty state; it never substitutes demo tenant rows.
   */
  initiatives?: ReadonlyArray<AIInitiative>;
  /** Tenant vendor rows used for Atlas metric explainability drill-downs. */
  vendors?: ReadonlyArray<AIInitiativeVendorRow>;
  /**
   * T-5 (Bind 1): pre-computed band tile aggregations from DB substrate.
   */
  bandMetrics?: TowerBandMetricsView;
  /**
   * T-6 (Bind 2): DB-derived pressure cards.
   */
  pressuresView?: TowerPressuresView;
  /**
   * T-7 (Bind 3): DB-derived Atlas observations.
   */
  atlasObservationsView?: AtlasObservationsView;
  /** Count-only DB coverage for explaining what evidence supports each Tower page. */
  substrateCounts?: TowerSubstrateCounts;
  /** Active workspace submenu resolved from /tower?tab=. */
  activeTab?: TowerTabKey;
  /** Slots are accepted for backward compatibility but not rendered in the broadsheet design. */
  provenanceSlot?: ReactNode;
  portfolioSummarySlot?: ReactNode;
  cascadeGraphSlot?: ReactNode;
  towerHandoffSlot?: ReactNode;
  portfolioSequenceSlot?: ReactNode;
  towerSubmenuSlot?: ReactNode;
  towerLensSlot?: ReactNode;
  /**
   * G8: server-rendered download control for the Tower outcome /
   * measurement report. Rendered in the masthead. Omitted = no button.
   */
  reportDownloadSlot?: ReactNode;
}

function formatTowerDateLabel(todayIso: string): {
  dayName: string;
  monthDay: string;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayIso);
  const date = match
    ? new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      )
    : new Date(Date.UTC(2026, 4, 12));

  return {
    dayName: date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }),
    monthDay: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }),
  };
}

type MetricAskHandler = (request: {
  metricKey: MetricProvenanceKey;
  metricLabel: string;
  displayValue?: string;
  displayConfidence?: BandConfidence;
  mode: "why" | "levers";
}) => void;

export function TowerIndexPage({
  tenantName = "Active client",
  context = "Control Tower · Portfolio Index",
  towerToday = "2026-05-12",
  clientId,
  initiatives,
  vendors,
  bandMetrics,
  pressuresView,
  atlasObservationsView,
  substrateCounts,
  activeTab = "portfolio",
  provenanceSlot: _p1,
  portfolioSummarySlot: _p2,
  cascadeGraphSlot: _p3,
  towerHandoffSlot: _p4,
  portfolioSequenceSlot,
  towerSubmenuSlot,
  towerLensSlot: _p6,
  reportDownloadSlot,
}: TowerIndexPageProps = {}) {
  void _p1;
  void _p2;
  void _p3;
  void _p4;
  void _p6;
  const alignment2x2View = buildStrategicAlignment2x2View(initiatives ?? []);
  // T-8: iterate metrics in lens-determined order rather than keying by name.
  const useSubstrateBand = Boolean(bandMetrics);
  const useSubstratePressures = Boolean(pressuresView);
  const searchParams = useSearchParams();
  const router = useRouter();
  const towerCanvasRef = useRef<HTMLDivElement>(null);
  // The dashboard band is fixed in the cleaned-up Tower model. Keep the
  // internal lens at value so stale ?lens= URLs cannot silently re-rank data.
  const activeLens: TowerLens = "value";
  const rawCanvasView = searchParams?.get("view");
  const activeCanvasView: PortfolioCanvasView =
    rawCanvasView === "pressures" ||
    rawCanvasView === "alignment" ||
    rawCanvasView === "contract" ||
    rawCanvasView === "adoption" ||
    rawCanvasView === "evidence"
      ? rawCanvasView
      : defaultPortfolioCanvasView(activeLens);
  const activeDetailId = searchParams?.get("detail") ?? null;
  const activePressureId = searchParams?.get("pressure") ?? null;
  const visiblePressureCards = portfolioPressureCardsForCanvas(
    pressuresView?.cards ?? [],
    activeCanvasView,
  );
  const visiblePressureNarrative = portfolioCanvasNarrative(
    activeCanvasView,
    visiblePressureCards.length,
  );
  const detailInitiative = findInitiativeDetail(
    initiatives ?? [],
    activeDetailId,
  );
  const detailPressure =
    activePressureId && pressuresView
      ? (pressuresView.cards.find((card) => card.id === activePressureId) ??
        null)
      : null;

  const buildTowerHref = useCallback(
    (
      next: {
        view?: PortfolioCanvasView;
        detail?: string | null;
        pressure?: string | null;
      } = {},
    ) => {
      const params = new URLSearchParams();
      if (activeTab !== "portfolio") params.set("tab", activeTab);
      const defaultView = defaultPortfolioCanvasView(activeLens);
      const view = next.view ?? activeCanvasView;
      if (activeTab === "portfolio" && view !== defaultView)
        params.set("view", view);
      const detail = next.detail === undefined ? activeDetailId : next.detail;
      if (detail) params.set("detail", detail);
      const pressure =
        next.pressure === undefined ? activePressureId : next.pressure;
      if (pressure) params.set("pressure", pressure);
      const query = params.toString();
      return query ? `/tower?${query}` : "/tower";
    },
    [activeCanvasView, activeDetailId, activeLens, activePressureId, activeTab],
  );

  const detailHrefFor = useCallback<DetailHrefBuilder>(
    (displayId, pressureId = null) => {
      if (!displayId) return undefined;
      return buildTowerHref({ detail: displayId, pressure: pressureId });
    },
    [buildTowerHref],
  );

  const closeDetailHref = buildTowerHref({ detail: null, pressure: null });

  useEffect(() => {
    if (!activeDetailId) return;
    towerCanvasRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeDetailId, activeTab]);

  useEffect(() => {
    if (activeDetailId || activeTab !== "portfolio") return;
    towerCanvasRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeCanvasView, activeDetailId, activeLens, activeTab]);

  // Keep this label deterministic across SSR and hydration. Live wall-clock
  // rendering causes React text mismatches when the server and browser resolve
  // the minute or time zone differently.
  const { dayName, monthDay } = formatTowerDateLabel(towerToday);
  const timestamp = "12:00 AM";

  // ─── Atlas chat state · wired to /api/v1/atlas/chat via the shared
  // <AgentDock> mounted around the workspace below. The dock owns the
  // composer (auto-grow, paperclip, mode picker, sticky bottom, resize) so
  // the previous AtlasColumn stub composer is gone. We keep the messages /
  // suggestions state here so the runtime contract (threadId, suggestions
  // round-trip) is preserved across turns. ────────────────────────────
  const initialOpener: AtlasMessage = {
    id: "atlas-opener",
    role: "atlas",
    content:
      atlasObservationsView?.headline ??
      "aVa is waiting for tenant-bound Tower substrate before it can answer portfolio questions.",
  };
  const [atlasMessages, setAtlasMessages] = useState<AtlasMessage[]>([
    initialOpener,
  ]);
  const [atlasPending, setAtlasPending] = useState(false);
  const [atlasThreadId, setAtlasThreadId] = useState<string | null>(null);
  const initialPrompts: string[] =
    atlasObservationsView?.suggestedPrompts.slice() ?? [
      "What tenant data is loaded?",
      "Which programs have pressure signals?",
      "Show renewal windows from the DB",
      "Explain missing Tower substrate",
    ];
  const [atlasSuggestions, setAtlasSuggestions] = useState<AtlasSuggestion[]>(
    initialPrompts.map((label) => ({
      label,
      value: label,
      kind: "message" as const,
    })),
  );

  const sendToAtlas = useCallback(
    async (
      text: string,
      attachments: AttachmentRef[],
      surfaceContextPatch?: Record<string, unknown>,
    ) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;
      // Without a tenant binding we can't authenticate the chat call. Keep
      // the user turn visible and surface a soft error.
      const userTurn: AtlasMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content:
          trimmed.length > 0
            ? trimmed
            : `Attached ${attachments.length} file${attachments.length === 1 ? "" : "s"}.`,
      };
      setAtlasMessages((prev) => [...prev, userTurn]);

      if (!clientId) {
        setAtlasMessages((prev) => [
          ...prev,
          {
            id: `atlas-no-tenant-${Date.now()}`,
            role: "atlas",
            content:
              "aVa needs an active tenant to answer. Sign in or pick a tenant from the top bar to wake up the live response path.",
          },
        ]);
        return;
      }

      setAtlasPending(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45_000);
      try {
        const res = await fetch("/api/v1/atlas/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            threadId: atlasThreadId,
            clientId,
            attachments: attachments.map((a) => ({
              id: a.id,
              file_name: a.file_name,
              mime: a.mime,
            })),
            surfaceContext: {
              clientId,
              tenantName,
              activeTowerLens: activeLens,
              context,
              ...surfaceContextPatch,
            },
          }),
          signal: controller.signal,
        });
        const json = (await res
          .json()
          .catch(() => ({}))) as Partial<AtlasChatResponse>;
        if (!res.ok || !json.response || !json.threadId) {
          setAtlasMessages((prev) => [
            ...prev,
            {
              id: `atlas-error-${Date.now()}`,
              role: "atlas",
              content:
                "aVa could not answer that right now. Honest read: the Tower summary is still valid, but the live response path needs a retry.",
            },
          ]);
          return;
        }
        setAtlasThreadId(json.threadId);
        setAtlasMessages((prev) => [
          ...prev,
          { id: `atlas-${Date.now()}`, role: "atlas", content: json.response! },
        ]);
        if (json.suggestions) setAtlasSuggestions(json.suggestions);
      } catch (err) {
        setAtlasMessages((prev) => [
          ...prev,
          {
            id: `atlas-error-${Date.now()}`,
            role: "atlas",
            content:
              err instanceof DOMException && err.name === "AbortError"
                ? "I could not complete the live aVa answer within this screen response window. The Tower facts below are still available. Next step: retry the same question or open the relevant program evidence view."
                : "I could not complete the live aVa answer just now. The Tower facts below are still available. Next step: retry the same question or open the relevant program evidence view.",
          },
        ]);
      } finally {
        window.clearTimeout(timeout);
        setAtlasPending(false);
      }
    },
    [activeLens, clientId, atlasThreadId, context, tenantName],
  );

  const handleMetricAsk = useCallback<MetricAskHandler>(
    (request) => {
      const valueClause = request.displayValue
        ? ` at ${request.displayValue}`
        : "";
      const prompt =
        request.mode === "levers"
          ? `Show the lever map for ${request.metricLabel}${valueClause}.`
          : `Why is ${request.metricLabel}${valueClause}?`;
      void sendToAtlas(prompt, [], {
        metricExplanationRequest: {
          source: "tower_metric_provenance",
          metricKey: request.metricKey,
          displayValue: request.displayValue,
          displayConfidence: request.displayConfidence,
          mode: request.mode,
        },
      });
    },
    [sendToAtlas],
  );

  const handleAtlasSuggestion = useCallback(
    (suggestion: AtlasSuggestion) => {
      if (suggestion.kind === "link" && suggestion.href) {
        router.push(suggestion.href);
        return;
      }
      void sendToAtlas(suggestion.value, []);
    },
    [router, sendToAtlas],
  );

  const hasTowerSubstrate =
    (substrateCounts?.initiatives ?? initiatives?.length ?? 0) > 0 ||
    (substrateCounts?.vendors ?? vendors?.length ?? 0) > 0 ||
    (substrateCounts?.kpis ?? 0) > 0 ||
    (substrateCounts?.decisions ?? 0) > 0 ||
    (substrateCounts?.scenarios ?? 0) > 0;

  const kpiBand = (
    <section
      data-testid="tower-kpi-band"
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
        padding: "9px 32px",
        borderBottom: `1px solid ${T.RULE_STRONG}`,
        gap: 0,
        alignItems: "center",
        minHeight: 66,
        background: "#fff",
      }}
    >
      {useSubstrateBand && bandMetrics ? (
        <>
          {bandMetrics.metrics.map((m, i) => (
            <SubstrateKpi
              key={m.key}
              metric={m}
              hero={m.hero}
              isFirst={i === 0}
              onAskAtlas={handleMetricAsk}
            />
          ))}
        </>
      ) : (
        <TowerEmptyState
          eyebrow="Tower data binding required"
          title="Dashboard is waiting on tenant-bound Tower rows."
          body="Home and Intelligence context may be loaded, but this Tower dashboard reads tenant-bound initiatives, vendors, KPIs, decisions, and scenarios. Tower will not substitute fixture values."
          style={{ gridColumn: "1 / -1" }}
        />
      )}
    </section>
  );

  const towerWorkspace: ReactNode = (
    <div
      ref={towerCanvasRef}
      style={{
        minHeight: "100%",
        background: T.PAGE_BG,
        color: T.INK,
        fontFamily: T.SANS,
        overflow: "auto",
        height: "100%",
      }}
    >
      {/* ─── MAIN COLUMN ─── */}
      <div style={{ minWidth: 0, padding: 0 }}>
        {/* Masthead */}
        <div
          style={{
            padding: "18px 32px 14px",
            borderBottom: `1px solid ${T.RULE_STRONG}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 10,
                  letterSpacing: "2px",
                  fontWeight: 700,
                  color: T.GOLD,
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                Tower · {workspaceTitle(activeTab)} · TWR-IDX-
                {activeTab.replace(/_/g, "-").toUpperCase()}
              </div>
              <h1
                style={{
                  fontFamily: T.SERIF,
                  fontSize: 38,
                  fontWeight: 900,
                  letterSpacing: "-0.9px",
                  lineHeight: 1,
                  marginBottom: 6,
                  margin: 0,
                  color: T.INK,
                }}
              >
                {workspaceTitle(activeTab)}{" "}
                <span
                  style={{
                    fontSize: 19,
                    fontWeight: 500,
                    fontStyle: "italic",
                    color: T.GRAY_DK,
                    letterSpacing: "-0.5px",
                  }}
                >
                  — {dayName}, {monthDay}
                </span>
              </h1>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 10,
                  letterSpacing: "1.4px",
                  color: T.GRAY_DK,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginTop: 5,
                }}
              >
                aVa · {tenantName} · {timestamp} PT
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: "#2f3848",
                  fontSize: 15.5,
                  fontWeight: 760,
                  lineHeight: 1.35,
                }}
              >
                {workspaceQuestion(activeTab)}
              </div>
              <TowerAtlasDisclosurePanel view={atlasObservationsView} compact />
            </div>
            {reportDownloadSlot ? (
              <div style={{ flex: "0 0 auto" }}>{reportDownloadSlot}</div>
            ) : null}
          </div>
        </div>

        {activeTab === "portfolio" ? (
          <>
            {kpiBand}
            {portfolioSequenceSlot}

            <CanvasViewTabs
              active={activeCanvasView}
              hrefFor={(view) =>
                buildTowerHref({ view, detail: null, pressure: null })
              }
            />

            {activeDetailId ? (
              <TowerInlineDetailPanel
                detailId={activeDetailId}
                initiative={detailInitiative}
                vendors={vendors ?? []}
                pressure={detailPressure}
                closeHref={closeDetailHref}
              />
            ) : (
              <>
                {/* Section headline */}
                {(activeCanvasView === "pressures" ||
                  activeCanvasView === "contract" ||
                  activeCanvasView === "adoption") && (
                  <>
                    <div style={{ padding: "16px 32px 10px" }}>
                      <div
                        style={{
                          fontFamily: T.MONO,
                          fontSize: 10,
                          letterSpacing: "2px",
                          fontWeight: 700,
                          color: T.GOLD,
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        {useSubstratePressures && pressuresView
                          ? visiblePressureNarrative.eyebrow
                          : "Today's pressures · DB substrate required"}
                      </div>
                      <h2
                        style={{
                          fontFamily: T.SERIF,
                          fontSize: 27,
                          fontWeight: 800,
                          letterSpacing: "-0.5px",
                          lineHeight: 1.1,
                          maxWidth: "32ch",
                          margin: 0,
                          color: T.INK,
                        }}
                      >
                        {useSubstratePressures && pressuresView
                          ? visiblePressureNarrative.headline
                          : "Tower needs tenant-bound data before it can rank portfolio pressures."}
                      </h2>
                      <p
                        style={{
                          fontSize: 13.5,
                          color: T.GRAY_DK,
                          marginTop: 6,
                          maxWidth: "64ch",
                          lineHeight: 1.55,
                        }}
                      >
                        {visiblePressureNarrative.body}
                      </p>
                    </div>

                    {/* Pressures list — T-6: substrate-bound only. */}
                    <div
                      style={{
                        padding: "0 32px 24px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {useSubstratePressures &&
                      pressuresView &&
                      visiblePressureCards.length > 0 ? (
                        visiblePressureCards.map((card) => (
                          <SubstratePressure
                            key={card.key}
                            card={card}
                            detailHref={detailHrefFor(card.displayId, card.id)}
                          />
                        ))
                      ) : (
                        <TowerEmptyState
                          eyebrow="No pressure cards"
                          title="No matching pressure cards are loaded for this canvas."
                          body={
                            pressuresView?.emptyHint ??
                            "The data is present, but this canvas has no matching pressure rows. Switch canvas views or load additional source rows."
                          }
                        />
                      )}
                    </div>
                  </>
                )}

                {/* Strategic alignment matrix */}
                {activeCanvasView === "alignment" && !hasTowerSubstrate ? (
                  <section style={{ padding: "18px 32px 34px" }}>
                    <TowerEmptyState
                      eyebrow="Tower read model empty"
                      title="No portfolio dots can be drawn yet."
                      body="Bind or load Tower rows for initiatives, vendor spend, KPI outcomes, and decision states before using the alignment dashboard. This is intentionally blank-safe: no legacy demo board will fill the gap."
                    />
                  </section>
                ) : activeCanvasView === "alignment" ? (
                  <section style={{ padding: "10px 32px 34px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "54px minmax(0, 1fr) minmax(0, 1fr)",
                        gridTemplateRows:
                          "minmax(214px, 1fr) minmax(214px, 1fr) 40px",
                        gap: 0,
                        width: "100%",
                        minHeight: "min(58vh, 560px)",
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: PANEL_SHADOW,
                      }}
                    >
                      {/* Y axis */}
                      <div
                        style={{
                          gridColumn: 1,
                          gridRow: "1 / 3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            fontFamily: T.MONO,
                            fontSize: 9.5,
                            letterSpacing: "1.6px",
                            fontWeight: 700,
                            color: T.GRAY_DK,
                            textTransform: "uppercase",
                          }}
                        >
                          Strategic alignment →
                        </span>
                      </div>

                      <Quadrant
                        position="tl"
                        qlabel="High value · Low alignment"
                        qhead="Useful but off-strategy. Sustain or rationalize."
                        dots={resolveQuadrantDots(alignment2x2View, "tl")}
                        detailHrefFor={detailHrefFor}
                      />
                      <Quadrant
                        position="tr"
                        qlabel="High value · High alignment · the prize"
                        qhead="Defend, scale, lock baselines."
                        dots={resolveQuadrantDots(alignment2x2View, "tr")}
                        detailHrefFor={detailHrefFor}
                      />
                      <Quadrant
                        position="bl"
                        qlabel="Low value · Low alignment"
                        qhead={<>Sunset candidates.</>}
                        dots={resolveQuadrantDots(alignment2x2View, "bl")}
                        detailHrefFor={detailHrefFor}
                      />
                      <Quadrant
                        position="br"
                        qlabel="Low value · High alignment"
                        qhead="Strategic but not yet earning. Watch closely."
                        dots={resolveQuadrantDots(alignment2x2View, "br")}
                        detailHrefFor={detailHrefFor}
                      />

                      {/* X axis */}
                      <div
                        style={{
                          gridColumn: "2 / 4",
                          gridRow: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingTop: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: T.MONO,
                            fontSize: 9.5,
                            letterSpacing: "1.6px",
                            fontWeight: 700,
                            color: T.GRAY_DK,
                            textTransform: "uppercase",
                          }}
                        >
                          Realized portfolio value →
                        </span>
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeCanvasView === "evidence" && (
                  <div style={{ padding: "24px 0 32px" }}>
                    <div style={{ marginBottom: 24 }}>
                      <ExecutiveActionQueuePanel />
                    </div>
                    <div style={{ padding: "0 32px" }}>
                      <TowerDataDesignPanel
                        activeTab={activeTab}
                        activeLens={activeLens}
                        initiatives={initiatives ?? []}
                        vendors={vendors ?? []}
                        substrateCounts={substrateCounts}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : activeDetailId ? (
          <>
            {kpiBand}
            <TowerInlineDetailPanel
              detailId={activeDetailId}
              initiative={detailInitiative}
              vendors={vendors ?? []}
              pressure={detailPressure}
              closeHref={closeDetailHref}
            />
          </>
        ) : (
          <>
            {kpiBand}
            {activeTab === "executive_brief" ? (
              <div style={{ padding: "16px 32px 0" }}>
                <TowerAtlasDisclosurePanel view={atlasObservationsView} />
              </div>
            ) : null}
            <TowerWorkspaceTabPanel
              activeTab={activeTab}
              activeLens={activeLens}
              initiatives={initiatives ?? []}
              vendors={vendors ?? []}
              pressuresView={pressuresView}
              substrateCounts={substrateCounts}
              detailHrefFor={detailHrefFor}
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName, showLocked: true, context }}
      middleStrip={towerSubmenuSlot}
    >
      <AtlasChatPanel
        messages={atlasMessages}
        pending={atlasPending}
        onSubmit={sendToAtlas}
        suggestions={atlasSuggestions}
        onSuggestion={handleAtlasSuggestion}
        workspace={towerWorkspace}
        surface="tower"
        variant="focused"
        surfaceContext={{
          clientId: clientId ?? null,
          tenantName,
          activeTowerLens: activeLens,
          context,
        }}
        defaultLeftPercent={35}
        minLeftPx={320}
      />
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MetricProvenance } from "@/components/tower/MetricProvenance";
import { ExecutiveActionQueuePanel } from "@/components/tower/ExecutiveActionQueuePanel";
import {
  ValueBridgeChart,
  ValueProvenBarChart,
  BudgetRunChangeChart,
  BenchmarkPeer2x2Chart,
} from "@/components/tower/charts/TowerCxoCharts";
import {
  AtlasChatPanel,
  type AtlasMessage,
} from "@/components/atlas/AtlasChatPanel";
import type { AttachmentRef } from "@/components/agent/AgentDock";
import type { AtlasSuggestion } from "@/lib/atlas/types";
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
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";
import type { TowerTabKey } from "@/lib/tower/tower-lens-tabs-view";
import {
  cioTowerMetricNumber,
  cioTowerMetricRowCount,
  findCioTowerMetricPacket,
  type CioTowerMetricPacket,
} from "@/lib/cio-tower/metric-packet";
import type {
  CioTowerCxoMeasureCard,
  CioTowerPortfolioValueRow,
  CioTowerCxoTableRow,
  CioTowerCxoViewModel,
} from "@/lib/cio-tower/cxo-view-model";
import type { TowerV3RuntimeViewModel } from "@/lib/tower/tower-v3-runtime-view";

export interface TowerSubstrateCounts {
  initiatives: number;
  vendors: number;
  kpis: number;
  decisions: number;
  stakeholderNotes: number;
  scenarios: number;
}

interface CioTowerVisibleAnswer {
  answer: string;
  followUpQuestion?: string | null;
}

interface CioTowerChatResponse {
  response?: string;
  modelOutput?: CioTowerVisibleAnswer;
  traceKey?: string;
}

function labelizeCioMeasureKey(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\bfy(\d{2})\b/gi, "FY$1")
    .replace(/\bit\b/gi, "IT")
    .replace(/\bytd\b/gi, "YTD");
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
  TEAL: "#0F766E",
  TEAL_TINT: "#5FD0C2",
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

export const TOWER_CIO_HOLDCO_STARTER_QUESTIONS = [
  "Show the holding-company IT budget by portfolio company and shared services.",
  "Which funded programs have the largest gap between promised and measured value?",
  "Which portfolio-company CIOs should I inspect first based on spend, risk, and value proof?",
  "Where is run budget crowding out change budget across the portfolio?",
  "Which vendors create the biggest renewal or concentration exposure this quarter?",
  "Which AI investments are true initiatives versus Copilot, platform, or vendor-embedded spend?",
  "What evidence is missing before this dashboard is board-ready?",
] as const;

export const TOWER_CIO_ENTERPRISE_STARTER_QUESTIONS = [
  "Show the enterprise technology budget by run, change, and funded initiatives.",
  "Which funded programs have the largest gap between promised and measured value?",
  "Which executive owners should inspect spend, risk, and value proof first?",
  "Where is run budget crowding out change capacity?",
  "Which vendors create the biggest renewal or concentration exposure this quarter?",
  "Which AI investments are true initiatives versus Copilot, platform, or vendor-embedded spend?",
  "What evidence is missing before this dashboard is board-ready?",
] as const;

export const TOWER_CIO_STARTER_QUESTIONS = TOWER_CIO_HOLDCO_STARTER_QUESTIONS;

export function towerCioStarterQuestionsForTenant(
  tenantName: string,
): ReadonlyArray<string> {
  return /lakeshore|holdings|industrial|morgan/i.test(tenantName)
    ? TOWER_CIO_HOLDCO_STARTER_QUESTIONS
    : TOWER_CIO_ENTERPRISE_STARTER_QUESTIONS;
}

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

type CioDashboardView =
  | "overview"
  | "visuals"
  | "portfolio"
  | "budget"
  | "vendors"
  | "ai_roi";

const CIO_DASHBOARD_VIEWS: Array<{
  key: CioDashboardView;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "What needs attention today.",
  },
  {
    key: "visuals",
    label: "Visuals",
    description: "The fastest cuts of spend, value, vendor, and AI exposure.",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description: "Which bets are working.",
  },
  {
    key: "budget",
    label: "Budget",
    description: "Where to shift money.",
  },
  {
    key: "vendors",
    label: "Vendors",
    description: "Renegotiate or consolidate.",
  },
  {
    key: "ai_roi",
    label: "AI ROI",
    description: "Scale, hold, or stop.",
  },
];

function parseCioDashboardView(
  raw: string | null | undefined,
): CioDashboardView {
  return (
    CIO_DASHBOARD_VIEWS.find((view) => view.key === raw)?.key ?? "overview"
  );
}

type CioGroupRow = {
  key: string;
  label: string;
  amount: number;
  count: number;
  note?: string;
};

type CioAiSpendRow = CioGroupRow & {
  category:
    | "Copilot / productivity"
    | "Vendor AI agent"
    | "AI platform"
    | "True AI initiative"
    | "Unclassified AI";
  measured: number;
};

type CioDecisionAction = {
  label: string;
  title: string;
  body: string;
  ask: string;
  tone: "green" | "amber" | "red";
};

type CioDashboardModel = {
  initiativeCount: number;
  vendorCount: number;
  budgetRowsWithAmount: number;
  vendorRowsWithAmount: number;
  initiativeEvidenceCount: number;
  committedTotal: number;
  initiativeBudgetTotal: number;
  measuredTotal: number;
  measuredCoverageCount: number;
  budgetRollupCount: number;
  actualSpendYtdTotal: number;
  forecastSpendTotal: number;
  runTotal: number;
  changeTotal: number;
  opexTotal: number;
  capexTotal: number;
  laborTotal: number;
  revenueTotal: number;
  pressureCount: number;
  spendAtRisk: number;
  vendorContractTotal: number;
  namedVendorExposureTotal: number;
  aiSpendTotal: number;
  spendQuality: "empty" | "missing_values" | "unmeasured" | "usable";
  budgetRollups: ReadonlyArray<TowerBudgetRollup>;
  topPrograms: ReadonlyArray<AIInitiative>;
  spendByFunction: ReadonlyArray<CioGroupRow>;
  spendByVendor: ReadonlyArray<CioGroupRow>;
  aiSpendRows: ReadonlyArray<CioAiSpendRow>;
  outcomeRows: ReadonlyArray<AIInitiative>;
  riskRows: ReadonlyArray<AIInitiative>;
  renewalRows: ReadonlyArray<AIInitiativeVendorRow>;
  gaps: ReadonlyArray<string>;
  executiveNarrative: string;
  commandBullets: ReadonlyArray<string>;
  decisionActions: ReadonlyArray<CioDecisionAction>;
  scenarioQuestions: ReadonlyArray<string>;
};

function initiativeBudget(initiative: AIInitiative): number {
  return Number(
    initiative.committedAnnualUsd ?? initiative.committedTotalUsd ?? 0,
  );
}

function initiativeValue(initiative: AIInitiative): number {
  return Number(initiative.measuredValueUsd ?? 0);
}

function normalizedProgramKey(initiative: AIInitiative): string {
  return initiative.name
    .toLowerCase()
    .replace(/\s*\/\s*(?:phase|wave|expansion|rollout)\s+\d+\b/g, "")
    .replace(/\s+#?\d+\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueProgramsByName(
  rows: ReadonlyArray<AIInitiative>,
): AIInitiative[] {
  const byKey = new Map<string, AIInitiative>();
  for (const row of rows) {
    const key = normalizedProgramKey(row) || row.displayId;
    const current = byKey.get(key);
    if (!current || initiativeBudget(row) > initiativeBudget(current)) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

function groupMoney(
  rows: ReadonlyArray<AIInitiative>,
  labelFor: (initiative: AIInitiative) => string | null | undefined,
): CioGroupRow[] {
  const grouped = new Map<string, CioGroupRow>();
  for (const initiative of rows) {
    const label = labelize(labelFor(initiative));
    const current =
      grouped.get(label) ??
      ({
        key: label.toLowerCase(),
        label,
        amount: 0,
        count: 0,
      } satisfies CioGroupRow);
    current.amount += initiativeBudget(initiative);
    current.count += 1;
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.amount - a.amount);
}

function groupVendorMoney(
  rows: ReadonlyArray<AIInitiativeVendorRow>,
): CioGroupRow[] {
  const grouped = new Map<string, CioGroupRow>();
  for (const vendor of rows) {
    const label = vendor.vendorName?.trim() || "Unassigned vendor";
    const current =
      grouped.get(label) ??
      ({
        key: label.toLowerCase(),
        label,
        amount: 0,
        count: 0,
      } satisfies CioGroupRow);
    current.amount += Number(vendor.contractValueUsd ?? 0);
    current.count += 1;
    grouped.set(label, current);
  }
  return [...grouped.values()].sort((a, b) => b.amount - a.amount);
}

function groupBudgetRollups(
  rows: ReadonlyArray<TowerBudgetRollup>,
  amountFor: (row: TowerBudgetRollup) => number,
): CioGroupRow[] {
  return rows
    .map((row) => ({
      key: row.portfolioCompany.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: labelize(row.portfolioCompany),
      amount: amountFor(row),
      count: 1,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function aiSpendCategory(
  initiative: AIInitiative,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
): CioAiSpendRow["category"] | null {
  const vendorNames = vendors
    .filter((vendor) => vendor.initiativeDisplayId === initiative.displayId)
    .map((vendor) => vendor.vendorName)
    .join(" ");
  const text = [
    initiative.name,
    initiative.description,
    initiative.primaryCategoryName,
    initiative.secondaryCategoryName,
    initiative.primaryGoalName,
    vendorNames,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    !/(ai|agent|automation|copilot|genai|machine learning|ml|predictive)/.test(
      text,
    )
  )
    return null;
  if (/copilot|m365|github|cursor|productivity/.test(text))
    return "Copilot / productivity";
  if (/servicenow|workday|salesforce|now assist|einstein|vendor/.test(text))
    return "Vendor AI agent";
  if (/platform|lakehouse|data product|mlops|model|foundation/.test(text))
    return "AI platform";
  if (
    /initiative|decision|predictive|forecast|optimization|automation/.test(text)
  )
    return "True AI initiative";
  return "Unclassified AI";
}

function buildCioDashboardModel(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
  budgetRollups: ReadonlyArray<TowerBudgetRollup> = [],
  metricPackets: ReadonlyArray<CioTowerMetricPacket> = [],
  tenantName = "",
): CioDashboardModel {
  const totalBudgetPacket = findCioTowerMetricPacket(
    metricPackets,
    "total_it_budget_fy26",
  );
  const initiativeBudgetPacket = findCioTowerMetricPacket(
    metricPackets,
    "initiative_budget_fy26",
  );
  const promisedValuePacket = findCioTowerMetricPacket(
    metricPackets,
    "promised_value_fy26",
  );
  const measuredValuePacket = findCioTowerMetricPacket(
    metricPackets,
    "measured_value_ytd",
  );
  const budgetRollupTotal = budgetRollups.reduce(
    (sum, row) => sum + row.totalItBudgetUsd,
    0,
  );
  const committedTotalFromInitiativesFallback = initiatives.reduce(
    (sum, initiative) => sum + initiativeBudget(initiative),
    0,
  );
  const committedTotalFromInitiatives =
    cioTowerMetricNumber(metricPackets, "initiative_budget_fy26") ??
    cioTowerMetricNumber(metricPackets, "promised_value_fy26") ??
    committedTotalFromInitiativesFallback;
  const committedTotal =
    cioTowerMetricNumber(metricPackets, "total_it_budget_fy26") ??
    (budgetRollupTotal > 0 ? budgetRollupTotal : committedTotalFromInitiatives);
  const actualSpendYtdTotal =
    cioTowerMetricNumber(metricPackets, "actual_spend_ytd") ??
    budgetRollups.reduce((sum, row) => sum + row.actualSpendYtdUsd, 0);
  const forecastSpendTotal = budgetRollups.reduce(
    (sum, row) => sum + Number(row.forecastSpendUsd ?? 0),
    0,
  );
  const runTotal =
    cioTowerMetricNumber(metricPackets, "run_budget_fy26") ??
    budgetRollups.reduce((sum, row) => sum + row.runAmountUsd, 0);
  const changeTotal =
    cioTowerMetricNumber(metricPackets, "change_budget_fy26") ??
    budgetRollups.reduce((sum, row) => sum + row.changeAmountUsd, 0);
  const opexTotal = budgetRollups.reduce(
    (sum, row) => sum + row.opexAmountUsd,
    0,
  );
  const capexTotal = budgetRollups.reduce(
    (sum, row) => sum + row.capexAmountUsd,
    0,
  );
  const laborTotal = budgetRollups.reduce(
    (sum, row) => sum + row.laborAmountUsd,
    0,
  );
  const revenueTotal = budgetRollups.reduce(
    (sum, row) => sum + Number(row.revenueUsd ?? 0),
    0,
  );
  const measuredTotal =
    cioTowerMetricNumber(metricPackets, "measured_value_ytd") ??
    initiatives.reduce(
      (sum, initiative) => sum + initiativeValue(initiative),
      0,
    );
  const initiativeEvidenceCount =
    cioTowerMetricRowCount(initiativeBudgetPacket) ??
    cioTowerMetricRowCount(promisedValuePacket) ??
    initiatives.filter((initiative) => initiativeBudget(initiative) > 0).length;
  const riskRows = initiatives
    .filter((initiative) => initiative.statusFlag !== "healthy")
    .sort((a, b) => initiativeBudget(b) - initiativeBudget(a));
  const spendAtRisk = riskRows.reduce(
    (sum, initiative) => sum + initiativeBudget(initiative),
    0,
  );
  const displayPrograms = uniqueProgramsByName(initiatives);
  const topPrograms = [...displayPrograms]
    .sort((a, b) => initiativeBudget(b) - initiativeBudget(a))
    .slice(0, 8);
  const renewalRows = vendors
    .filter((vendor) => {
      const iso = dateValueToIso(vendor.renewalDate);
      if (!iso) return false;
      const delta = Date.parse(iso) - Date.parse(todayIso);
      if (!Number.isFinite(delta)) return false;
      const days = delta / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 180;
    })
    .sort((a, b) =>
      String(a.renewalDate ?? "").localeCompare(String(b.renewalDate ?? "")),
    );

  const aiSpendByCategory = new Map<CioAiSpendRow["category"], CioAiSpendRow>();
  for (const initiative of initiatives) {
    const category = aiSpendCategory(initiative, vendors);
    if (!category) continue;
    const current =
      aiSpendByCategory.get(category) ??
      ({
        key: category.toLowerCase(),
        label: category,
        category,
        amount: 0,
        measured: 0,
        count: 0,
      } satisfies CioAiSpendRow);
    current.amount += initiativeBudget(initiative);
    current.measured += initiativeValue(initiative);
    current.count += 1;
    aiSpendByCategory.set(category, current);
  }

  const gaps: string[] = [];
  if (committedTotal === 0)
    gaps.push("Program budget rows are not loaded for Tower slicing.");
  if (committedTotal > 0 && committedTotal >= 1_000_000_000)
    gaps.push(
      "Loaded program budget magnitude needs client validation before using it as a CIO headline.",
    );
  if (vendors.length === 0)
    gaps.push(
      "Vendor contract rows are not loaded for concentration and renewal views.",
    );
  if (
    vendors.length > 0 &&
    vendors.every((vendor) => Number(vendor.contractValueUsd ?? 0) === 0)
  )
    gaps.push(
      "Vendor names and renewals are loaded, but contract values are missing.",
    );
  const measuredCoverageCount =
    cioTowerMetricRowCount(measuredValuePacket) ??
    initiatives.filter((initiative) => initiative.measuredValueUsd !== null)
      .length;
  const hasMeasuredValueEvidence =
    measuredTotal > 0 || measuredCoverageCount > 0;
  if (!hasMeasuredValueEvidence)
    gaps.push(
      "No measured value rows are loaded, so ROI is a gap rather than a claim.",
    );
  const hasRunChangeEvidence = runTotal > 0 || changeTotal > 0;
  if (
    !hasRunChangeEvidence &&
    initiatives.length > 0 &&
    initiatives.every(
      (initiative) =>
        !/run|change|opex|capex/i.test(
          `${initiative.primaryCategoryName} ${initiative.primaryGoalName} ${initiative.description}`,
        ),
    )
  )
    gaps.push("Run/change or CapEx/OpEx line-item split is not loaded.");

  const spendByFunction = (
    budgetRollups.length > 0
      ? groupBudgetRollups(budgetRollups, (row) => row.totalItBudgetUsd)
      : groupMoney(
          initiatives,
          (initiative) =>
            initiative.ownerFunction ?? initiative.primaryCategoryName,
        )
  ).slice(0, 8);
  const allSpendByVendor = groupVendorMoney(vendors);
  const spendByVendor = allSpendByVendor.slice(0, 8);
  const aiSpendRows = [...aiSpendByCategory.values()].sort(
    (a, b) => b.amount - a.amount,
  );
  const aiSpendTotal = aiSpendRows.reduce((sum, row) => sum + row.amount, 0);
  const budgetRowsWithAmount =
    cioTowerMetricRowCount(totalBudgetPacket) ??
    cioTowerMetricRowCount(initiativeBudgetPacket) ??
    (budgetRollups.length > 0
      ? budgetRollups.filter((row) => row.totalItBudgetUsd > 0).length
      : initiatives.filter((initiative) => initiativeBudget(initiative) > 0)
          .length);
  const budgetVendorTotal = budgetRollups.reduce(
    (sum, row) => sum + row.vendorAmountUsd,
    0,
  );
  const namedVendorExposureTotal = allSpendByVendor.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const vendorContractTotal =
    budgetVendorTotal > 0 ? budgetVendorTotal : namedVendorExposureTotal;
  const vendorRowsWithAmount = vendors.filter(
    (vendor) => Number(vendor.contractValueUsd ?? 0) > 0,
  ).length;
  const budgetEvidenceCount =
    cioTowerMetricRowCount(totalBudgetPacket) ?? budgetRollups.length;
  const hasMetricEvidence = metricPackets.some(
    (packet) => packet.valueNumeric !== null,
  );
  const spendQuality: CioDashboardModel["spendQuality"] =
    initiatives.length === 0 && budgetRollups.length === 0 && !hasMetricEvidence
      ? "empty"
      : committedTotal === 0
        ? "missing_values"
        : budgetRollups.length > 0 || totalBudgetPacket
          ? "usable"
          : !hasMeasuredValueEvidence
            ? "unmeasured"
            : "usable";
  const topProgram = topPrograms[0] ?? null;
  const topFunction = spendByFunction[0] ?? null;
  const topVendor = spendByVendor[0] ?? null;
  const topAiFamily = aiSpendRows[0] ?? null;
  const executiveNarrative =
    initiatives.length === 0 && budgetRollups.length === 0 && !hasMetricEvidence
      ? "Tower has the CIO canvas ready, but the tenant-bound program rows are not loaded yet."
      : !hasMeasuredValueEvidence
        ? `${formatMoney(committedTotal)} is loaded as budget evidence across ${budgetEvidenceCount > 0 ? `${budgetEvidenceCount} portfolio-company rollup${budgetEvidenceCount === 1 ? "" : "s"}` : `${initiatives.length} program row${initiatives.length === 1 ? "" : "s"}`}, but no measured value rows are loaded. Treat budget concentration as review-required and do not use the ROI tiles until value proof is supplied.`
        : budgetEvidenceCount > 0
          ? `${formatMoney(committedTotal)} of FY26 IT budget is loaded across ${budgetEvidenceCount} portfolio-company rollup${budgetEvidenceCount === 1 ? "" : "s"}. Tower is separating enterprise budget concentration from ${initiativeEvidenceCount > 0 ? `${initiativeEvidenceCount} governed initiative budget entr${initiativeEvidenceCount === 1 ? "y" : "ies"}` : `${initiatives.length} initiative row${initiatives.length === 1 ? "" : "s"}`} and value proof.`
          : committedTotal === 0
            ? `Tower has ${initiatives.length} loaded program rows, but budget amounts are not loaded. Use this as a portfolio coverage view, not a spend dashboard, until program budget fields are supplied.`
            : `${formatMoney(committedTotal)} of loaded IT budget is visible; ${formatMoney(measuredTotal)} is backed by measured value rows. Tower is showing budget, pressure, vendor exposure, and value proof as separate slices.`;
  const commandBullets = [
    topProgram && committedTotalFromInitiatives > 0
      ? `Largest loaded program: ${topProgram.name} at ${formatMoney(initiativeBudget(topProgram))}.`
      : initiatives.length > 0
        ? "Program rows are loaded, but budget amounts are missing or review-required."
        : "No loaded program can be ranked by budget yet.",
    topFunction && committedTotal > 0
      ? `Largest loaded portfolio slice: ${topFunction.label} at ${formatMoney(topFunction.amount)} (${percentOf(topFunction.amount, committedTotal)} of the loaded envelope).`
      : spendByFunction.length > 0
        ? "Owner/function slices are loaded, but spend amounts are missing."
        : "No owner/function slice is available yet.",
    topVendor && namedVendorExposureTotal > 0
      ? `Largest named contract exposure: ${topVendor.label} at ${formatMoney(topVendor.amount)}.`
      : vendors.length > 0
        ? "Vendor names are loaded; contract values are missing for concentration analysis."
        : "Vendor exposure is not yet available from loaded contract rows.",
    topAiFamily && topAiFamily.amount > 0
      ? `Largest AI spend family: ${topAiFamily.label} at ${formatMoney(topAiFamily.amount)}; measured value is ${topAiFamily.measured > 0 ? formatMoney(topAiFamily.measured) : "still a gap"}.`
      : aiSpendRows.length > 0
        ? "AI-tagged initiatives exist, but spend/value amounts are not loaded enough to benchmark."
        : "AI spend family classification needs AI-tagged initiative rows.",
  ];
  const decisionActions: CioDecisionAction[] = [];
  if (riskRows.length > 0) {
    decisionActions.push({
      label: "Inspect pressure spend",
      title: "Open the highest-pressure programs before approving new money.",
      body:
        spendAtRisk > 0
          ? `${riskRows.length} program${riskRows.length === 1 ? "" : "s"} are not marked healthy. Their loaded budgets total ${formatMoney(spendAtRisk)}; validate value proof before treating this as fundable spend.`
          : `${riskRows.length} program${riskRows.length === 1 ? "" : "s"} are not marked healthy, but their budget amounts are not loaded.`,
      ask: "Which pressure programs should the CIO inspect first, and why?",
      tone: "red",
    });
  }
  if (measuredCoverageCount < initiatives.length) {
    decisionActions.push({
      label: "Demand value proof",
      title: "Force measured outcomes onto the top programs.",
      body: `${initiatives.length - measuredCoverageCount} loaded program${initiatives.length - measuredCoverageCount === 1 ? "" : "s"} still lack measured value rows.`,
      ask: "Which top programs lack measured value proof, and what evidence is needed?",
      tone: "amber",
    });
  }
  if (renewalRows.length > 0) {
    decisionActions.push({
      label: "Review renewal clock",
      title: "Use renewals as leverage for value and simplification.",
      body: `${renewalRows.length} loaded contract row${renewalRows.length === 1 ? "" : "s"} land inside the renewal watch window.`,
      ask: "Which renewal windows should we use to reduce spend or improve value proof?",
      tone: "amber",
    });
  }
  if (aiSpendRows.length > 0) {
    decisionActions.push({
      label: "Benchmark AI mix",
      title:
        "Separate Copilot, vendor agents, platform spend, and true AI bets.",
      body: `${formatMoney(aiSpendRows.reduce((sum, row) => sum + row.amount, 0))} is tagged into AI spend families; value proof is shown only where loaded.`,
      ask: "Compare Copilot, vendor AI agents, platforms, and true AI initiatives by spend and value proof.",
      tone: "green",
    });
  }
  const scenarioQuestions = [...towerCioStarterQuestionsForTenant(tenantName)];

  return {
    initiativeCount: initiatives.length,
    vendorCount: new Set(vendors.map((vendor) => vendor.vendorName)).size,
    budgetRowsWithAmount,
    vendorRowsWithAmount,
    initiativeEvidenceCount,
    committedTotal,
    initiativeBudgetTotal: committedTotalFromInitiatives,
    measuredTotal,
    measuredCoverageCount,
    budgetRollupCount: budgetEvidenceCount,
    actualSpendYtdTotal,
    forecastSpendTotal,
    runTotal,
    changeTotal,
    opexTotal,
    capexTotal,
    laborTotal,
    revenueTotal,
    pressureCount: riskRows.length,
    spendAtRisk,
    vendorContractTotal,
    namedVendorExposureTotal,
    aiSpendTotal,
    spendQuality,
    budgetRollups,
    topPrograms,
    spendByFunction,
    spendByVendor,
    aiSpendRows,
    outcomeRows: [...initiatives]
      .sort((a, b) => initiativeValue(b) - initiativeValue(a))
      .slice(0, 8),
    riskRows: riskRows.slice(0, 8),
    renewalRows: renewalRows.slice(0, 8),
    gaps,
    executiveNarrative,
    commandBullets,
    decisionActions,
    scenarioQuestions,
  };
}

function percentOf(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function CioDashboardTabs({
  active,
  onSelect,
}: {
  active: CioDashboardView;
  onSelect: (view: CioDashboardView) => void;
}) {
  return (
    <section
      style={{
        padding: "14px 32px 12px",
        borderBottom: `1px solid ${T.RULE_STRONG}`,
        background: "#fff",
      }}
    >
      <div style={{ color: T.INK_2, fontSize: 13, lineHeight: 1.35 }}>
        {CIO_DASHBOARD_VIEWS.find((view) => view.key === active)?.description}
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
        {CIO_DASHBOARD_VIEWS.map((view) => {
          const current = view.key === active;
          return (
            <button
              key={view.key}
              type="button"
              aria-pressed={current}
              onClick={() => onSelect(view.key)}
              style={{
                border: `1px solid ${current ? T.INK : T.RULE_STRONG}`,
                borderRadius: 999,
                background: current ? T.INK : "#fff",
                color: current ? "#fff" : T.INK_2,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 760,
                fontFamily: T.SANS,
                cursor: "pointer",
              }}
            >
              {view.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CioMetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const color =
    tone === "green"
      ? T.GREEN
      : tone === "amber"
        ? T.AMBER
        : tone === "red"
          ? T.RED
          : T.INK;
  return (
    <div
      style={{
        border: `1px solid ${T.RULE_STRONG}`,
        borderRadius: 13,
        background: "#fff",
        padding: "15px 16px",
        minHeight: 112,
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: T.GRAY_DK,
          fontWeight: 850,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.SERIF,
          fontSize: 29,
          lineHeight: 1.05,
          color,
          fontWeight: 900,
          marginTop: 10,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 7, color: T.INK_2, fontSize: 12.5 }}>{note}</div>
    </div>
  );
}

function CioOverviewKpiStrip({ model }: { model: CioDashboardModel }) {
  const valueGap =
    model.initiativeBudgetTotal > 0
      ? Math.max(model.initiativeBudgetTotal - model.measuredTotal, 0)
      : 0;
  const renewalTotal = model.renewalRows.reduce(
    (sum, row) => sum + Number(row.contractValueUsd ?? 0),
    0,
  );
  const kpis = [
    {
      label: "IT spend",
      value: formatMoney(model.committedTotal),
      note:
        model.budgetRollupCount > 0
          ? `annual · ${model.budgetRollupCount} companies`
          : `${model.initiativeCount} initiative rows`,
      tone: "neutral" as const,
    },
    {
      label: "Committed value",
      value:
        model.initiativeBudgetTotal > 0
          ? formatMoney(model.initiativeBudgetTotal)
          : "gap",
      note:
        model.initiativeBudgetTotal > 0
          ? "business-case envelope"
          : "program budget not loaded",
      tone:
        model.initiativeBudgetTotal > 0
          ? ("neutral" as const)
          : ("amber" as const),
    },
    {
      label: "Proven value",
      value: model.measuredTotal > 0 ? formatMoney(model.measuredTotal) : "gap",
      note: `${model.measuredCoverageCount} attested program${model.measuredCoverageCount === 1 ? "" : "s"}`,
      tone: model.measuredTotal > 0 ? ("green" as const) : ("amber" as const),
    },
    {
      label: "Value gap",
      value:
        model.initiativeBudgetTotal > 0
          ? valueGap > 0
            ? formatMoney(valueGap)
            : "none"
          : "gap",
      note:
        model.initiativeBudgetTotal > 0
          ? "committed value minus proven value"
          : "needs initiative business-case rows",
      tone:
        model.initiativeBudgetTotal <= 0 || valueGap > 0
          ? ("amber" as const)
          : ("green" as const),
    },
    {
      label: "Renewals · 90d",
      value: renewalTotal > 0 ? formatMoney(renewalTotal) : "gap",
      note: `${model.renewalRows.length} contract${model.renewalRows.length === 1 ? "" : "s"} in focus`,
      tone:
        model.renewalRows.length > 0 ? ("red" as const) : ("neutral" as const),
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 10,
      }}
    >
      {kpis.map((kpi) => (
        <CioMetricCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          note={kpi.note}
          tone={kpi.tone}
        />
      ))}
    </section>
  );
}

function CioDetailKpiStrip({ model }: { model: CioDashboardModel }) {
  const renewalTotal = model.renewalRows.reduce(
    (sum, row) => sum + Number(row.contractValueUsd ?? 0),
    0,
  );
  const kpis = [
    {
      label: "Spent YTD",
      value:
        model.actualSpendYtdTotal > 0
          ? formatMoney(model.actualSpendYtdTotal)
          : "gap",
      note:
        model.actualSpendYtdTotal > 0
          ? "actual spend from Tower rollups"
          : "actual spend field not loaded",
      tone:
        model.actualSpendYtdTotal > 0
          ? ("neutral" as const)
          : ("amber" as const),
    },
    {
      label: "Run",
      value: model.runTotal > 0 ? formatMoney(model.runTotal) : "gap",
      note:
        model.runTotal > 0
          ? "run amount from rollups"
          : "run line item not loaded",
      tone: model.runTotal > 0 ? ("neutral" as const) : ("amber" as const),
    },
    {
      label: "Change",
      value: model.changeTotal > 0 ? formatMoney(model.changeTotal) : "gap",
      note:
        model.changeTotal > 0
          ? "change amount from rollups"
          : "change line item not loaded",
      tone: model.changeTotal > 0 ? ("green" as const) : ("amber" as const),
    },
    {
      label: "Vendor exposure",
      value:
        model.vendorContractTotal > 0
          ? formatMoney(model.vendorContractTotal)
          : "gap",
      note: `${model.vendorRowsWithAmount} contract row${model.vendorRowsWithAmount === 1 ? "" : "s"} with value`,
      tone:
        model.vendorContractTotal > 0
          ? ("neutral" as const)
          : ("amber" as const),
    },
    {
      label: "Renewals",
      value: renewalTotal > 0 ? formatMoney(renewalTotal) : "gap",
      note: `${model.renewalRows.length} inside watch window`,
      tone:
        model.renewalRows.length > 0 ? ("red" as const) : ("neutral" as const),
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {kpis.map((kpi) => (
        <CioMetricCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          note={kpi.note}
          tone={kpi.tone}
        />
      ))}
    </section>
  );
}

function CioStoryBoard({ model }: { model: CioDashboardModel }) {
  const hasCommittedValue = model.initiativeBudgetTotal > 0;
  const hasMeasuredValue = model.measuredTotal > 0;
  const valueGap = hasCommittedValue
    ? Math.max(model.initiativeBudgetTotal - model.measuredTotal, 0)
    : 0;
  const valueSurplus = hasCommittedValue
    ? Math.max(model.measuredTotal - model.initiativeBudgetTotal, 0)
    : 0;
  const realizedPct = hasCommittedValue
    ? Math.round((model.measuredTotal / model.initiativeBudgetTotal) * 100)
    : 0;
  const proofWidth = hasCommittedValue
    ? Math.max(2, Math.min(100, realizedPct))
    : 0;
  const valueThesis =
    hasCommittedValue && hasMeasuredValue
      ? `We've committed ${formatMoney(model.initiativeBudgetTotal)} in technology value and proven ${formatMoney(model.measuredTotal)} of it.`
      : hasCommittedValue
        ? "The portfolio business case is visible, but value proof is not loaded yet."
        : "The portfolio budget is visible, but committed-value business cases are not loaded yet.";
  const proofHeadline = !hasMeasuredValue
    ? "value proof gap"
    : !hasCommittedValue
      ? `${formatMoney(model.measuredTotal)} proven value`
      : valueGap > 0
        ? `${formatMoney(valueGap)} unproven`
        : valueSurplus > 0
          ? `${formatMoney(valueSurplus)} above committed value`
          : "value proof complete";
  const proofContext = !hasMeasuredValue
    ? "finance-attested outcomes are required before ROI is claimed"
    : !hasCommittedValue
      ? "committed-value business cases are required before realization can be scored"
      : valueGap > 0
        ? `${realizedPct}% realized — the gap is the funding gate`
        : valueSurplus > 0
          ? `${realizedPct}% realized — proven value exceeds the committed business case`
          : "100% realized — committed value is fully proven";

  return (
    <section
      aria-label="CIO and CFO story"
      style={{
        marginBottom: 20,
      }}
    >
      <article
        style={{
          borderRadius: 18,
          background: "#111827",
          color: "#f8f3e8",
          padding: "26px 30px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 10,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: "rgba(248,243,232,0.64)",
            fontWeight: 850,
          }}
        >
          CIO daily read
        </div>
        <div
          style={{
            fontFamily: T.SERIF,
            fontSize: 27,
            lineHeight: 1.25,
            fontWeight: 900,
            marginTop: 12,
            maxWidth: 760,
          }}
        >
          {valueThesis}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <span
            style={{
              color: "#d8b46a",
              fontSize: 30,
              fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {proofHeadline}
          </span>
          <span style={{ color: "rgba(248,243,232,0.72)", fontSize: 13.5 }}>
            {proofContext}
          </span>
        </div>
        <div
          aria-hidden="true"
          style={{
            height: 14,
            borderRadius: 999,
            background: "#3c3826",
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <div
            style={{
              width: `${proofWidth}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg,#5f9a72,#8fc09e)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            color: "rgba(248,243,232,0.72)",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          <span>proven {formatMoney(model.measuredTotal)}</span>
          <span>
            {hasCommittedValue
              ? `unproven ${formatMoney(valueGap)}`
              : "committed value gap"}
          </span>
        </div>
      </article>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          border: `1px solid ${T.RULE_STRONG}`,
          borderRadius: 14,
          background: "#fff",
          padding: "18px 22px",
        }}
      >
        <CioTrustItem
          tone="green"
          title="Proven"
          body="Budget, vendors, and measured value only appear when loaded from Tower rows."
        />
        <CioTrustItem
          tone="amber"
          title="Directional"
          body="Adoption and AI ROI remain directional until spend family, usage, and value rows are complete."
        />
        <CioTrustItem
          tone="neutral"
          title="Not loaded yet"
          body={
            model.gaps.length > 0
              ? model.gaps.join(" ")
              : "No dashboard blocking gaps were detected for this slice."
          }
        />
      </div>
    </section>
  );
}

function CioTrustItem({
  tone,
  title,
  body,
}: {
  tone: "green" | "amber" | "neutral";
  title: string;
  body: string;
}) {
  const color =
    tone === "green" ? T.GREEN : tone === "amber" ? T.AMBER : T.GRAY_DK;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span
        aria-hidden="true"
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          background: color,
          marginTop: 6,
          flex: "0 0 9px",
        }}
      />
      <span>
        <strong style={{ display: "block", fontSize: 13.5 }}>{title}</strong>
        <span style={{ display: "block", color: T.INK_2, fontSize: 12.5 }}>
          {body}
        </span>
      </span>
    </div>
  );
}

function CioSplitBar({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? Math.round((leftValue / total) * 100) : 0;
  const rightPct = total > 0 ? 100 - leftPct : 0;
  if (total <= 0) {
    return (
      <TowerEmptyState
        eyebrow="Gap, not zero"
        title={`${leftLabel}/${rightLabel} split is not loaded.`}
        body={`Tower needs explicit ${leftLabel.toLowerCase()} and ${rightLabel.toLowerCase()} fields before this can be benchmarked.`}
      />
    );
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 30,
          borderRadius: 8,
          overflow: "hidden",
          background: T.CREAM_DEEP,
        }}
      >
        <div
          style={{
            width: `${leftPct}%`,
            background: T.GREEN,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {leftPct > 12 ? `${leftLabel} ${leftPct}%` : ""}
        </div>
        <div
          style={{
            width: `${rightPct}%`,
            background: T.INK,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {rightPct > 12 ? `${rightLabel} ${rightPct}%` : ""}
        </div>
      </div>
      <div style={{ color: T.GRAY_DK, fontSize: 12, marginTop: 7 }}>
        {leftLabel}: {formatMoney(leftValue)} · {rightLabel}:{" "}
        {formatMoney(rightValue)}
      </div>
    </div>
  );
}

function CioPortfolioCompanyComparison({
  rows,
}: {
  rows: ReadonlyArray<TowerBudgetRollup>;
}) {
  if (rows.length === 0) {
    return (
      <CioPanel
        eyebrow="Tower · L2 portfolio comparison"
        title="Portfolio-company budget rollups are not loaded."
      >
        <TowerEmptyState
          eyebrow="Rollup gap"
          title="No operating-company IT intensity rows are available."
          body="Load portfolio-company revenue, IT budget, run/change, vendor, and labor fields before Tower can show holding-company comparisons."
        />
      </CioPanel>
    );
  }
  const maxPct = Math.max(
    ...rows.map((row) => Number(row.itSpendAsPctRevenue ?? 0)),
    0.01,
  );
  return (
    <CioPanel
      eyebrow="Tower · L2 portfolio comparison"
      title="IT intensity across the portfolio."
    >
      <div style={{ color: T.INK_2, fontSize: 13.5, marginBottom: 12 }}>
        Spend as a share of revenue, the holding-company view a single-entity
        dashboard cannot show.
      </div>
      <div style={{ display: "grid", gap: 0 }}>
        {rows.map((row) => {
          const pct = Number(row.itSpendAsPctRevenue ?? 0);
          const width = Math.max(4, Math.round((pct / maxPct) * 100));
          return (
            <div
              key={row.portfolioCompany}
              style={{
                display: "grid",
                gridTemplateColumns: "190px 1fr 150px",
                alignItems: "center",
                gap: 14,
                padding: "12px 0",
                borderTop: `1px solid ${T.RULE}`,
              }}
            >
              <div>
                <strong>{labelize(row.portfolioCompany)}</strong>
                <div style={{ color: T.GRAY_DK, fontSize: 12 }}>
                  {row.revenueUsd
                    ? `${formatMoney(row.revenueUsd)} revenue`
                    : "revenue gap"}{" "}
                  ·{" "}
                  {row.employees
                    ? `${Math.round(row.employees).toLocaleString()} staff`
                    : "staff gap"}
                </div>
              </div>
              <div
                style={{
                  height: 13,
                  borderRadius: 999,
                  background: T.CREAM_DEEP,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${width}%`,
                    height: "100%",
                    background: pct === maxPct ? T.AMBER : "#5a6b86",
                  }}
                />
              </div>
              <div style={{ textAlign: "right", fontSize: 13 }}>
                <strong>{formatMoney(row.totalItBudgetUsd)}</strong> IT
                <div style={{ color: T.GRAY_DK }}>
                  {formatRatioPercent(pct)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CioPanel>
  );
}

function CioDashboardViewLead({
  active,
  model,
}: {
  active: Exclude<CioDashboardView, "overview">;
  model: CioDashboardModel;
}) {
  const valueGap = Math.max(
    model.initiativeBudgetTotal - model.measuredTotal,
    0,
  );
  const lead: Record<
    Exclude<CioDashboardView, "overview">,
    { eyebrow: string; title: string; body: string; stats: string[] }
  > = {
    visuals: {
      eyebrow: "Visual view",
      title: "See where spend, value, vendors, and AI exposure concentrate.",
      body: "This view turns the same governed Tower records into chart-like slices. It does not invent missing measures; gaps remain visible when source fields are absent.",
      stats: [
        `${formatMoney(model.committedTotal)} IT budget`,
        `${formatMoney(model.vendorContractTotal)} vendor exposure`,
        `${formatMoney(model.aiSpendTotal)} AI-tagged spend`,
      ],
    },
    portfolio: {
      eyebrow: "Portfolio view",
      title: "Rank the loaded IT programs by money, owner, and proof posture.",
      body: "This view is for program accountability: which initiatives carry budget, which owners are attached, and which rows still need measured value before the CIO treats them as fundable.",
      stats: [
        `${model.initiativeCount} loaded programs`,
        `${model.measuredCoverageCount} with value proof`,
        `${model.pressureCount} under pressure`,
      ],
    },
    budget: {
      eyebrow: "Budget view",
      title:
        "Separate enterprise budget, run/change, and portfolio-company intensity.",
      body: "This view uses the Tower budget rollups first. It keeps spend, value, vendor exposure, and pressure separate so the dashboard does not add unlike measures into one headline.",
      stats: [
        `${formatMoney(model.committedTotal)} IT budget`,
        `${formatMoney(model.runTotal)} run`,
        `${formatMoney(model.changeTotal)} change`,
      ],
    },
    vendors: {
      eyebrow: "Vendor view",
      title: "Use vendor concentration and renewals as leverage.",
      body: "This view shows named contract exposure, renewal timing, and vendor health from loaded contract rows. It is not a generic spend tile; it is the negotiation and simplification lens.",
      stats: [
        `${model.vendorCount} vendors`,
        `${formatMoney(model.vendorContractTotal)} vendor exposure`,
        `${model.renewalRows.length} renewals in watch`,
      ],
    },
    ai_roi: {
      eyebrow: "AI ROI view",
      title: "Compare Copilot, vendor agents, platforms, and true AI bets.",
      body: "This view separates AI spend families and shows measured value only where it is loaded. Missing value evidence remains a gap, not a zero-ROI claim.",
      stats: [
        `${formatMoney(model.aiSpendTotal)} AI-tagged spend`,
        `${formatMoney(model.measuredTotal)} measured value`,
        `${valueGap > 0 ? formatMoney(valueGap) : "no"} value gap`,
      ],
    },
  };
  const view = lead[active];
  return (
    <section
      style={{
        border: `1px solid ${T.RULE_STRONG}`,
        borderRadius: 16,
        background: "#fff",
        padding: "24px 26px",
        marginBottom: 18,
        boxShadow: "0 18px 38px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 10,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: T.GOLD,
          fontWeight: 900,
        }}
      >
        {view.eyebrow}
      </div>
      <h2
        style={{
          margin: "9px 0 0",
          fontFamily: T.SERIF,
          fontSize: 30,
          lineHeight: 1.08,
          letterSpacing: "-0.4px",
          color: T.INK,
          maxWidth: 880,
        }}
      >
        {view.title}
      </h2>
      <p
        style={{
          margin: "10px 0 0",
          color: T.INK_2,
          maxWidth: 900,
          fontSize: 14.5,
          lineHeight: 1.5,
        }}
      >
        {view.body}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginTop: 18,
        }}
      >
        {view.stats.map((stat) => (
          <div
            key={stat}
            style={{
              border: `1px solid ${T.RULE}`,
              borderRadius: 10,
              background: T.PAGE_BG,
              padding: "12px 13px",
              color: T.INK,
              fontWeight: 850,
              fontSize: 13,
            }}
          >
            {stat}
          </div>
        ))}
      </div>
    </section>
  );
}

function CioDecisionCards({
  actions,
}: {
  actions: ReadonlyArray<CioDecisionAction>;
}) {
  if (actions.length === 0) return null;
  const toneStyle = {
    green: { border: "#86efac", background: "#f0fdf4", color: T.GREEN },
    amber: { border: T.AMBER, background: T.AMBER_BG, color: "#8a5400" },
    red: { border: "#fecaca", background: "#fef2f2", color: T.RED },
  } satisfies Record<
    CioDecisionAction["tone"],
    { border: string; background: string; color: string }
  >;
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {actions.slice(0, 4).map((action) => {
        const tone = toneStyle[action.tone];
        return (
          <div
            key={action.label}
            style={{
              border: `1px solid ${tone.border}`,
              borderRadius: 10,
              background: tone.background,
              padding: "14px 15px",
              minHeight: 145,
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: "1.3px",
                textTransform: "uppercase",
                color: tone.color,
                fontWeight: 900,
              }}
            >
              {action.label}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: T.SERIF,
                fontSize: 19,
                lineHeight: 1.12,
                fontWeight: 900,
                color: T.INK,
              }}
            >
              {action.title}
            </div>
            <div
              style={{
                marginTop: 9,
                color: T.INK_2,
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            >
              {action.body}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function CioBarList({
  rows,
  total,
  empty,
}: {
  rows: ReadonlyArray<CioGroupRow>;
  total: number;
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <TowerEmptyState
        eyebrow="Slice unavailable"
        title="No rows returned for this cut."
        body={empty}
      />
    );
  }
  const hasAmounts = total > 0;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row) => (
        <div key={row.key}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              color: T.INK,
              fontWeight: 850,
              fontSize: 13.5,
            }}
          >
            <span>{row.label}</span>
            <span>
              {hasAmounts ? formatMoney(row.amount) : "amount missing"}
            </span>
          </div>
          <div
            style={{
              height: 9,
              borderRadius: 999,
              background: T.CREAM_DEEP,
              marginTop: 7,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: percentOf(row.amount, total),
                minWidth: row.amount > 0 ? 10 : 0,
                height: "100%",
                background: T.GREEN,
              }}
            />
          </div>
          <div style={{ marginTop: 4, color: T.GRAY_DK, fontSize: 12 }}>
            {row.count} row{row.count === 1 ? "" : "s"} ·{" "}
            {hasAmounts
              ? `${percentOf(row.amount, total)} of loaded envelope`
              : "spend values not loaded"}
          </div>
        </div>
      ))}
    </div>
  );
}

function CioPanel({
  title,
  eyebrow,
  children,
  plain = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  plain?: boolean;
}) {
  return (
    <section
      style={{
        border: plain ? "none" : `1px solid ${T.RULE_STRONG}`,
        borderRadius: plain ? 0 : 10,
        background: plain ? "transparent" : "#fff",
        padding: plain ? 0 : 18,
        boxShadow: plain ? "none" : "0 12px 26px rgba(15, 23, 42, 0.04)",
        // CSS grid items default to min-width:auto, so a Recharts
        // ResponsiveContainer's intrinsic sizing can grow this panel past
        // its grid track (invisibly clipped by an ancestor's overflow, not
        // reflected in document.body.scrollWidth). Force it to respect the
        // track instead.
        minWidth: 0,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: plain ? 11 : 9,
            letterSpacing: plain ? "0.12em" : "1.5px",
            textTransform: "uppercase",
            color: T.GOLD,
            fontWeight: plain ? 600 : 850,
            marginBottom: plain ? 16 : 8,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <h3
        style={{
          margin: 0,
          fontFamily: T.SERIF,
          fontSize: plain ? 26 : 23,
          fontWeight: plain ? 500 : undefined,
          letterSpacing: plain ? "-0.02em" : undefined,
          lineHeight: plain ? 1.22 : 1.1,
          color: T.INK,
          maxWidth: plain ? "38ch" : undefined,
        }}
      >
        {title}
      </h3>
      <div style={{ marginTop: plain ? 32 : 15 }}>{children}</div>
    </section>
  );
}

function CioProgramTable({
  rows,
  detailHrefFor,
  evidenceCount = 0,
}: {
  rows: ReadonlyArray<AIInitiative>;
  detailHrefFor: DetailHrefBuilder;
  evidenceCount?: number;
}) {
  if (rows.length === 0) {
    if (evidenceCount > 0) {
      return (
        <TowerEmptyState
          eyebrow="Program detail pending"
          title="Program budget entries are summarized, but not yet bound to this table."
          body={`Tower has ${evidenceCount} governed program budget entr${evidenceCount === 1 ? "y" : "ies"} in the metric layer. Bind the program names, owners, and proof fields before ranking individual programs here.`}
        />
      );
    }
    return (
      <TowerEmptyState
        eyebrow="No programs"
        title="No Tower program rows are loaded."
        body="Load or bind IT initiative rows before Tower can rank the CIO portfolio."
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {[
              "Program",
              "Function",
              "Owner",
              "Budget",
              "Measured",
              "Status",
            ].map((head) => (
              <th
                key={head}
                style={{
                  textAlign:
                    head === "Budget" || head === "Measured" ? "right" : "left",
                  padding: "0 10px 10px",
                  fontFamily: T.MONO,
                  fontSize: 9,
                  letterSpacing: "1.2px",
                  color: T.GRAY_DK,
                  textTransform: "uppercase",
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((initiative) => (
            <tr
              key={initiative.displayId}
              style={{ borderTop: `1px solid ${T.RULE}` }}
            >
              <td style={{ padding: "12px 10px", minWidth: 220 }}>
                <Link
                  href={detailHrefFor(initiative.displayId) ?? "#"}
                  scroll={false}
                  style={{
                    color: T.INK,
                    fontWeight: 900,
                    textDecoration: "none",
                  }}
                >
                  {initiative.name}
                </Link>
                <div style={{ color: T.GRAY_DK, fontSize: 12, marginTop: 3 }}>
                  {labelize(initiative.primaryCategoryName)}
                </div>
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {labelize(
                  initiative.ownerFunction ?? initiative.primaryCategoryName,
                )}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {initiative.ownerName}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {initiativeBudget(initiative) > 0
                  ? formatMoney(initiativeBudget(initiative))
                  : "gap"}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  color: T.INK_2,
                }}
              >
                {initiative.measuredValueUsd === null
                  ? "gap"
                  : formatMoney(initiativeValue(initiative))}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {labelize(initiative.statusFlag)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CioVendorTable({
  rows,
}: {
  rows: ReadonlyArray<AIInitiativeVendorRow>;
}) {
  if (rows.length === 0) {
    return (
      <TowerEmptyState
        eyebrow="No vendor rows"
        title="Vendor concentration is a data gap."
        body="Tower has program evidence, but vendor contract rows are missing for this slice."
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {["Vendor", "Program", "Contract", "Renewal", "Health"].map(
              (head) => (
                <th
                  key={head}
                  style={{
                    textAlign: head === "Contract" ? "right" : "left",
                    padding: "0 10px 10px",
                    fontFamily: T.MONO,
                    fontSize: 9,
                    letterSpacing: "1.2px",
                    color: T.GRAY_DK,
                    textTransform: "uppercase",
                  }}
                >
                  {head}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((vendor) => (
            <tr
              key={`${vendor.vendorId}-${vendor.initiativeDisplayId}`}
              style={{ borderTop: `1px solid ${T.RULE}` }}
            >
              <td style={{ padding: "12px 10px", fontWeight: 900 }}>
                {vendor.vendorName}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {vendor.initiativeName}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {formatMoney(vendor.contractValueUsd)}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {formatDateLabel(vendor.renewalDate, "not loaded")}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {labelize(vendor.financialHealth)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CxoGovernedMeasureCard({ card }: { card: CioTowerCxoMeasureCard }) {
  const hasValue = card.valueNumeric !== null;
  const footer = hasValue
    ? `${card.period?.toUpperCase() ?? "Current"} ${card.basis ?? "plan"} · verified input`
    : card.gap;
  return (
    <article
      data-cio-tower-measure-key={card.measureKey}
      data-cio-tower-dashboard-value={card.displayValue}
      style={{
        border: `1px solid ${hasValue ? T.RULE_STRONG : T.AMBER}`,
        borderRadius: 13,
        background: "#fff",
        padding: "13px 14px",
        minHeight: 112,
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: T.GRAY_DK,
          fontWeight: 850,
        }}
      >
        {card.label || labelizeCioMeasureKey(card.measureKey)}
      </div>
      <div
        style={{
          fontFamily: T.SERIF,
          fontSize: 25,
          lineHeight: 1.05,
          color: hasValue ? T.INK : T.AMBER,
          fontWeight: 900,
          marginTop: 8,
        }}
      >
        {card.displayValue}
      </div>
      <div
        style={{ marginTop: 6, color: T.INK_2, fontSize: 12, lineHeight: 1.35 }}
      >
        {footer}
      </div>
    </article>
  );
}

function findCxoCard(
  cards: ReadonlyArray<CioTowerCxoMeasureCard>,
  measureKey: string,
): CioTowerCxoMeasureCard | null {
  return cards.find((card) => card.measureKey === measureKey) ?? null;
}

function safeRatio(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | null {
  if (
    !Number.isFinite(Number(numerator)) ||
    !Number.isFinite(Number(denominator))
  )
    return null;
  const den = Number(denominator);
  if (den <= 0) return null;
  return Number(numerator) / den;
}

function formatPlainPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio))
    return "gap";
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatMoneyGap(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "gap";
  return formatMoney(value);
}

function DerivedCxoMetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color = tone === "good" ? T.GREEN : tone === "warn" ? T.AMBER : T.INK;
  return (
    <article
      style={{
        border: `1px solid ${tone === "warn" ? T.AMBER : T.RULE_STRONG}`,
        borderRadius: 13,
        background: "#fff",
        padding: "13px 14px",
        minHeight: 108,
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: T.GRAY_DK,
          fontWeight: 850,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: T.SERIF,
          fontSize: 25,
          lineHeight: 1.05,
          color,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
      <div
        style={{ marginTop: 6, color: T.INK_2, fontSize: 12, lineHeight: 1.35 }}
      >
        {detail}
      </div>
    </article>
  );
}

function CxoGovernedTable({
  rows,
  emptyTitle,
  emptyBody,
}: {
  rows: ReadonlyArray<CioTowerCxoTableRow>;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (rows.length === 0) {
    return (
      <TowerEmptyState
        eyebrow="Missing input"
        title={emptyTitle}
        body={emptyBody}
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {["Item", "Metric", "Value", "Timing", "Where it comes from"].map(
              (head) => (
                <th
                  key={head}
                  style={{
                    textAlign: head === "Value" ? "right" : "left",
                    padding: "0 10px 10px",
                    fontFamily: T.MONO,
                    fontSize: 9,
                    letterSpacing: "1.2px",
                    color: T.GRAY_DK,
                    textTransform: "uppercase",
                  }}
                >
                  {head}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, index) => (
            <tr
              key={`${row.label}-${row.measure}-${index}`}
              style={{ borderTop: `1px solid ${T.RULE}` }}
            >
              <td style={{ padding: "12px 10px", minWidth: 220 }}>
                <strong>{row.label}</strong>
                <div style={{ color: T.GRAY_DK, fontSize: 12, marginTop: 3 }}>
                  {row.type ? labelize(row.type) : "type not loaded"} ·{" "}
                  {row.confidence}
                </div>
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {labelizeCioMeasureKey(row.measure)}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.value}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {row.period} · {row.basis}
              </td>
              <td style={{ padding: "12px 10px", color: T.INK_2 }}>
                {row.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CxoPortfolioValuePackTable({
  rows,
}: {
  rows: ReadonlyArray<CioTowerPortfolioValueRow>;
}) {
  if (rows.length === 0) {
    return (
      <TowerEmptyState
        eyebrow="Missing input"
        title="Portfolio value proof is not ready yet."
        body="Tower needs initiative budget, promised value, measured value, owner, and blocker fields before it can show the CIO value-pack view."
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        data-cio-tower-portfolio-value-pack="true"
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {[
              "Program",
              "Owner",
              "Budget",
              "Actual YTD",
              "Promised value",
              "Measured value",
              "Gap",
              "Realization",
              "Value / $",
              "Evidence",
              "Inspect because",
              "Source",
            ].map((head) => (
              <th
                key={head}
                style={{
                  textAlign: [
                    "Budget",
                    "Actual YTD",
                    "Promised value",
                    "Measured value",
                    "Gap",
                    "Realization",
                    "Value / $",
                  ].includes(head)
                    ? "right"
                    : "left",
                  padding: "0 10px 10px",
                  fontFamily: T.MONO,
                  fontSize: 9,
                  letterSpacing: "1.2px",
                  color: T.GRAY_DK,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, index) => (
            <tr
              key={`${row.program}-${index}`}
              data-cio-tower-program={row.program}
              data-cio-tower-budget={row.budget}
              data-cio-tower-actual-spend={row.actualSpend}
              data-cio-tower-promised-value={row.promisedValue}
              data-cio-tower-measured-value={row.measuredValue}
              data-cio-tower-value-gap={row.valueGap}
              data-cio-tower-inspection-reason={row.inspectionReason}
              style={{ borderTop: `1px solid ${T.RULE}` }}
            >
              <td style={{ padding: "12px 10px", minWidth: 220 }}>
                <strong>{row.program}</strong>
                <div style={{ color: T.GRAY_DK, fontSize: 12, marginTop: 3 }}>
                  {row.confidence} confidence
                </div>
              </td>
              <td
                style={{ padding: "12px 10px", color: T.INK_2, minWidth: 150 }}
              >
                {row.owner}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.budget}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.actualSpend}
                <div style={{ color: T.GRAY_DK, fontSize: 11, marginTop: 3 }}>
                  {row.spendBurnRate} burn
                </div>
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.promisedValue}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.measuredValue}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                  color: row.valueGap === "gap" ? T.AMBER : T.INK,
                }}
              >
                {row.valueGap}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.valueRealizationRate}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {row.measuredValuePerDollarSpent}
              </td>
              <td
                style={{ padding: "12px 10px", color: T.INK_2, minWidth: 150 }}
              >
                {row.evidenceStatus}
              </td>
              <td
                style={{ padding: "12px 10px", color: T.INK_2, minWidth: 220 }}
              >
                <strong style={{ color: T.INK }}>{row.inspectionReason}</strong>
                <div style={{ color: T.GRAY_DK, fontSize: 12, marginTop: 4 }}>
                  {row.blocker}
                </div>
              </td>
              <td
                style={{ padding: "12px 10px", color: T.INK_2, minWidth: 190 }}
              >
                {row.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CxoBudgetMix({
  cards,
}: {
  cards: ReadonlyArray<CioTowerCxoMeasureCard>;
}) {
  const total =
    findCxoCard(cards, "total_it_budget_fy26")?.valueNumeric ?? null;
  const run = findCxoCard(cards, "run_budget_fy26")?.valueNumeric ?? null;
  const change = findCxoCard(cards, "change_budget_fy26")?.valueNumeric ?? null;
  const initiative =
    findCxoCard(cards, "initiative_budget_fy26")?.valueNumeric ?? null;
  const actualSpend =
    findCxoCard(cards, "actual_spend_ytd")?.valueNumeric ?? null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <DerivedCxoMetricCard
        label="Run ratio"
        value={formatPlainPercent(safeRatio(run, total))}
        detail={`${formatMoneyGap(run)} run / ${formatMoneyGap(total)} total`}
      />
      <DerivedCxoMetricCard
        label="Change ratio"
        value={formatPlainPercent(safeRatio(change, total))}
        detail={`${formatMoneyGap(change)} change / ${formatMoneyGap(total)} total`}
      />
      <DerivedCxoMetricCard
        label="Initiative intensity"
        value={formatPlainPercent(safeRatio(initiative, total))}
        detail={`${formatMoneyGap(initiative)} funded work / ${formatMoneyGap(total)} total`}
      />
      <DerivedCxoMetricCard
        label="Spend burn rate"
        value={formatPlainPercent(safeRatio(actualSpend, initiative))}
        detail={`${formatMoneyGap(actualSpend)} YTD spend / ${formatMoneyGap(initiative)} initiative budget`}
      />
    </div>
  );
}

function CxoValueRealization({
  cards,
}: {
  cards: ReadonlyArray<CioTowerCxoMeasureCard>;
}) {
  const promised =
    findCxoCard(cards, "promised_value_fy26")?.valueNumeric ?? null;
  const measured =
    findCxoCard(cards, "measured_value_ytd")?.valueNumeric ?? null;
  const actualSpend =
    findCxoCard(cards, "actual_spend_ytd")?.valueNumeric ?? null;
  const initiative =
    findCxoCard(cards, "initiative_budget_fy26")?.valueNumeric ?? null;
  const gap =
    promised !== null && measured !== null
      ? Math.max(promised - measured, 0)
      : null;
  const measuredPerSpent = safeRatio(measured, actualSpend);
  const promisedPerInitiative = safeRatio(promised, initiative);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <DerivedCxoMetricCard
        label="Promised value"
        value={formatMoneyGap(promised)}
        detail="FY26 forecast value from governed initiative records"
      />
      <DerivedCxoMetricCard
        label="Measured value"
        value={formatMoneyGap(measured)}
        detail="YTD measured value only where loaded"
        tone={measured ? "good" : "warn"}
      />
      <DerivedCxoMetricCard
        label="Value gap"
        value={formatMoneyGap(gap)}
        detail="Promised value not yet measured YTD"
        tone={gap && gap > 0 ? "warn" : "good"}
      />
      <DerivedCxoMetricCard
        label="Value per dollar spent"
        value={
          measuredPerSpent === null ? "gap" : `${measuredPerSpent.toFixed(2)}x`
        }
        detail={`${formatMoneyGap(measured)} measured / ${formatMoneyGap(actualSpend)} spent YTD`}
      />
      <DerivedCxoMetricCard
        label="Promised value per initiative $"
        value={
          promisedPerInitiative === null
            ? "gap"
            : `${promisedPerInitiative.toFixed(2)}x`
        }
        detail={`${formatMoneyGap(promised)} promised / ${formatMoneyGap(initiative)} initiative budget`}
      />
      <DerivedCxoMetricCard
        label="Measured realization rate"
        value={formatPlainPercent(safeRatio(measured, promised))}
        detail={`${formatMoneyGap(measured)} measured / ${formatMoneyGap(promised)} promised`}
      />
    </div>
  );
}

function CxoTenantBenchmark({ model }: { model: CioTowerCxoViewModel }) {
  if (model.benchmarkRows.length === 0) {
    return (
      <TowerEmptyState
        eyebrow="Benchmark gap"
        title="Peer comparison is not ready yet."
        body="Tower needs comparable budget and value inputs before it can show the peer view."
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {[
              "Peer",
              "FY26 IT budget",
              "Run mix",
              "Change mix",
              "Initiative intensity",
              "Value realization",
            ].map((head) => (
              <th
                key={head}
                style={{
                  textAlign: head === "Peer" ? "left" : "right",
                  padding: "0 10px 10px",
                  fontFamily: T.MONO,
                  fontSize: 9,
                  letterSpacing: "1.2px",
                  color: T.GRAY_DK,
                  textTransform: "uppercase",
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.benchmarkRows.map((row) => (
            <tr
              key={row.tenantKey}
              style={{
                borderTop: `1px solid ${T.RULE}`,
                background: row.isCurrent ? T.GREEN_BG : "transparent",
              }}
            >
              <td style={{ padding: "12px 10px", fontWeight: 900 }}>
                {row.isCurrent ? model.tenantName : row.label}
              </td>
              <td
                style={{
                  padding: "12px 10px",
                  textAlign: "right",
                  fontWeight: 850,
                }}
              >
                {formatMoneyGap(row.totalBudget)}
              </td>
              <td style={{ padding: "12px 10px", textAlign: "right" }}>
                {formatPlainPercent(safeRatio(row.runBudget, row.totalBudget))}
              </td>
              <td style={{ padding: "12px 10px", textAlign: "right" }}>
                {formatPlainPercent(
                  safeRatio(row.changeBudget, row.totalBudget),
                )}
              </td>
              <td style={{ padding: "12px 10px", textAlign: "right" }}>
                {formatPlainPercent(
                  safeRatio(row.initiativeBudget, row.totalBudget),
                )}
              </td>
              <td style={{ padding: "12px 10px", textAlign: "right" }}>
                {formatPlainPercent(
                  safeRatio(row.measuredValue, row.promisedValue),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type CxoCommandSection =
  | "value"
  | "budget"
  | "portfolio"
  | "benchmark"
  | "evidence";

const CXO_COMMAND_SECTIONS: Array<{
  key: CxoCommandSection;
  label: string;
}> = [
  {
    key: "value",
    label: "Value",
  },
  {
    key: "budget",
    label: "Budget",
  },
  {
    key: "portfolio",
    label: "Portfolio",
  },
  {
    key: "benchmark",
    label: "Benchmark",
  },
  {
    key: "evidence",
    label: "Evidence",
  },
];

function CxoGovernedCommandCenter({
  model,
  budgetRollups = [],
}: {
  model: CioTowerCxoViewModel;
  budgetRollups?: ReadonlyArray<TowerBudgetRollup>;
}) {
  const [activeSection, setActiveSection] =
    useState<CxoCommandSection>("value");
  const flagshipProgram = model.portfolioValueRows
    .filter((row) => (row.promisedValueNumeric ?? 0) > 0)
    .slice()
    .sort(
      (a, b) => (b.promisedValueNumeric ?? 0) - (a.promisedValueNumeric ?? 0),
    )[0];
  const commandCards = [
    "total_it_budget_fy26",
    "total_it_budget_fy25_baseline",
    "run_budget_fy26",
    "change_budget_fy26",
    "initiative_budget_fy26",
    "actual_spend_ytd",
    "promised_value_fy26",
    "measured_value_ytd",
  ]
    .map((measureKey) => findCxoCard(model.cards, measureKey))
    .filter((card): card is CioTowerCxoMeasureCard => Boolean(card));
  return (
    <div
      style={{
        padding: "0 40px 90px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <section
        aria-label="Tower command center sections"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 30,
          borderBottom: `1px solid ${T.RULE}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          {CXO_COMMAND_SECTIONS.map((section) => {
            const selected = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                aria-pressed={selected}
                style={{
                  position: "relative",
                  top: 1,
                  border: "none",
                  borderRadius: 0,
                  borderBottom: selected
                    ? `2px solid ${T.GREEN}`
                    : "2px solid transparent",
                  background: "transparent",
                  color: selected ? T.INK : T.INK_2,
                  padding: "12px 2px",
                  marginRight: 28,
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  fontFamily: T.SERIF,
                  cursor: "pointer",
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "value" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {flagshipProgram ? (
            <section style={{ minWidth: 0 }}>
              <ValueBridgeChart program={flagshipProgram} />
            </section>
          ) : null}

          <div>
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9.5,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: T.GOLD,
                fontWeight: 900,
                marginBottom: 9,
              }}
            >
              Value Command Center
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {commandCards.map((card) => (
                <CxoGovernedMeasureCard key={card.measureKey} card={card} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === "budget" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {budgetRollups.length > 0 ? (
            <CioPanel
              eyebrow="Budget by Entity"
              title="Holdco and operating companies, run vs. change."
            >
              <BudgetRunChangeChart rows={budgetRollups} />
            </CioPanel>
          ) : null}

          <CioPanel eyebrow="Budget Mix" title="Where the money is committed.">
            <CxoBudgetMix cards={model.cards} />
          </CioPanel>

          <CioPanel
            eyebrow="Value Realization"
            title="Whether the portfolio is paying back."
          >
            <CxoValueRealization cards={model.cards} />
          </CioPanel>
        </section>
      ) : null}

      {activeSection === "portfolio" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {model.portfolioValueRows.length > 0 ? (
            <CioPanel
              eyebrow="Value Proven"
              title="How much of the promise is proven, by program."
            >
              <ValueProvenBarChart rows={model.portfolioValueRows} />
            </CioPanel>
          ) : null}

          <CioPanel
            eyebrow="Portfolio Value Pack"
            title="Which funded programs have value proof, owners, blockers, and gaps."
          >
            <CxoPortfolioValuePackTable rows={model.portfolioValueRows} />
          </CioPanel>
        </section>
      ) : null}

      {activeSection === "benchmark" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {model.benchmarkRows.length > 0 ? (
            <section style={{ minWidth: 0 }}>
              <BenchmarkPeer2x2Chart
                rows={model.benchmarkRows}
                currentTenantName={model.tenantName}
              />
            </section>
          ) : null}

          <CioPanel
            eyebrow="Tenant Benchmark"
            title="How this portfolio compares with peers."
          >
            <CxoTenantBenchmark model={model} />
          </CioPanel>
        </section>
      ) : null}

      {activeSection === "evidence" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <CioPanel
            eyebrow="Evidence and Trust"
            title="Where leadership can inspect the numbers."
          >
            <CxoGovernedTable
              rows={model.trustRows}
              emptyTitle="Source detail is not ready yet."
              emptyBody="Tower needs source references before it can show the inspection path."
            />
          </CioPanel>
        </section>
      ) : null}

    </div>
  );
}

function TowerContextRuntimePanel({ view }: { view: TowerV3RuntimeViewModel }) {
  return (
    <div
      data-testid="tower-context-runtime-view"
      style={{
        padding: "0 40px 90px",
        maxWidth: 1080,
        margin: "0 auto",
      }}
    >
      <section
        style={{
          border: `1px solid ${T.BORDER_STRONG}`,
          background: "#fff",
          borderRadius: 12,
          boxShadow: PANEL_SHADOW,
          padding: 24,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 10,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: T.GREEN,
            fontWeight: 900,
            marginBottom: 10,
          }}
        >
          Measurement readiness
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) repeat(3, minmax(0, .7fr))",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: T.INK,
                fontFamily: T.SERIF,
                fontSize: 30,
                lineHeight: 1.05,
                fontWeight: 650,
                letterSpacing: "-0.025em",
              }}
            >
              {view.tenantName} measurement plan is ready for gating, not outcome proof.
            </h2>
            <p
              style={{
                margin: "12px 0 0",
                color: T.INK_2,
                fontSize: 14,
                lineHeight: 1.55,
                maxWidth: 680,
              }}
            >
              {view.headline} The page is showing metric families, value hypotheses,
              evidence blockers, and next measurement actions from the governed context pack.
            </p>
          </div>
          {[
            ["Metric families", view.metricCount],
            ["Value hypotheses", view.valueRecordCount],
            ["Claim gates", view.valueClaimCount],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${T.BORDER}`,
                borderRadius: 10,
                padding: 14,
                background: T.CREAM,
              }}
            >
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 9,
                  letterSpacing: "1.3px",
                  textTransform: "uppercase",
                  color: T.GRAY_DK,
                  fontWeight: 800,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: T.SERIF,
                  fontSize: 30,
                  fontWeight: 800,
                  marginTop: 8,
                  color: T.INK,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <CioPanel
          eyebrow="Metric Families"
          title="What Tower should track before value is claimed."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {view.metricFamilies.slice(0, 10).map((metric) => (
              <div
                key={`${metric.sourceDimension}-${metric.label}`}
                style={{
                  border: `1px solid ${T.BORDER}`,
                  borderRadius: 8,
                  padding: 12,
                  background: T.CREAM,
                  minHeight: 116,
                }}
              >
                <div
                  style={{
                    fontFamily: T.SERIF,
                    fontSize: 16,
                    lineHeight: 1.18,
                    fontWeight: 750,
                    color: T.INK,
                  }}
                >
                  {metric.label}
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 5 }}>
                  <SmallEvidenceLine label="Baseline" value={metric.baselineStatus} />
                  <SmallEvidenceLine label="Target" value={metric.targetStatus} />
                  <SmallEvidenceLine label="Evidence" value={metric.evidenceStatus} />
                </div>
              </div>
            ))}
          </div>
        </CioPanel>

        <CioPanel
          eyebrow="Value Hypothesis Gate"
          title="What value language is currently safe."
        >
          <div
            style={{
              border: `1px solid ${T.AMBER}`,
              background: T.AMBER_BG,
              borderRadius: 10,
              padding: 13,
              marginBottom: 12,
              color: T.INK,
              fontSize: 13.5,
              lineHeight: 1.45,
            }}
          >
            Finance-attested measurement evidence is not yet available. Tower can show
            value hypotheses with caveats, not outcome proof.
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            {view.valueHypotheses.slice(0, 6).map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  alignItems: "center",
                  borderBottom: `1px solid ${T.RULE}`,
                  paddingBottom: 9,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, color: T.INK, fontSize: 13.5 }}>
                    {item.label}
                  </div>
                  <div style={{ color: T.INK_2, fontSize: 12.5, marginTop: 2 }}>
                    {item.claimBasis.replace(/_/g, " ")}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 10,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    borderRadius: 999,
                    padding: "5px 8px",
                    background: item.gateStatus === "allowed" ? T.GREEN_BG : T.AMBER_BG,
                    color: item.gateStatus === "allowed" ? T.GREEN : T.AMBER,
                    border: `1px solid ${
                      item.gateStatus === "allowed" ? "rgba(29,158,117,.35)" : "rgba(186,117,23,.35)"
                    }`,
                    fontWeight: 800,
                  }}
                >
                  {item.gateStatus}
                </span>
              </div>
            ))}
          </div>
        </CioPanel>
      </section>

      <CioPanel
        eyebrow="Executive Blocker Themes"
        title="Repeated row-level caveats grouped for leadership action."
      >
        <div
          data-testid="tower-gap-themes"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {view.gapThemes.map((theme) => (
            <div
              key={theme.themeId}
              style={{
                border: `1px solid ${T.BORDER}`,
                borderRadius: 10,
                padding: 14,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    fontFamily: T.SERIF,
                    fontSize: 17,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: T.INK,
                  }}
                >
                  {theme.title}
                </div>
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    color: T.GRAY_DK,
                    fontWeight: 800,
                  }}
                >
                  {theme.affectedRecordCount} records
                </span>
              </div>
              <p style={{ color: T.INK_2, fontSize: 13, lineHeight: 1.45 }}>
                {theme.whyItMatters}
              </p>
              <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
                <SmallEvidenceLine
                  label="Required"
                  value={theme.requiredEvidence.slice(0, 2).join("; ")}
                />
                <SmallEvidenceLine
                  label="Handoff"
                  value={`${theme.moduleHandoff}${theme.ownerOrSteward ? ` · ${theme.ownerOrSteward}` : ""}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CioPanel>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 18,
          marginTop: 18,
        }}
      >
        <CioPanel
          eyebrow="Next Measurement Actions"
          title="What has to happen before the dashboard can move from plan to proof."
        >
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            {view.nextMeasurementActions.map((action) => (
              <li key={action} style={{ color: T.INK_2, lineHeight: 1.45 }}>
                {action}
              </li>
            ))}
          </ol>
        </CioPanel>
        <details
          style={{
            border: `1px solid ${T.BORDER}`,
            borderRadius: 10,
            padding: 12,
            background: T.CREAM,
            color: T.INK_2,
            fontSize: 12.5,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: T.INK,
              fontWeight: 800,
              fontFamily: T.MONO,
              fontSize: 10,
              letterSpacing: "1.3px",
              textTransform: "uppercase",
            }}
          >
            Bridge diagnostics
          </summary>
          <div style={{ marginTop: 10, lineHeight: 1.5 }}>
            Existing Tower read model fallback is retained for diagnostics only. It is a
            derived bridge view and has not been reconciled row by row to governed
            context. {view.bridgeDiagnostics.message}
          </div>
        </details>
      </section>
    </div>
  );
}

function SmallEvidenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "74px minmax(0, 1fr)", gap: 8 }}>
      <span
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: T.GRAY_DK,
          fontWeight: 800,
        }}
      >
        {label}
      </span>
      <span style={{ color: T.INK_2, fontSize: 12.5, lineHeight: 1.35 }}>{value}</span>
    </div>
  );
}

function CioDashboardPanel({
  active,
  model,
  initiatives,
  vendors,
  detailHrefFor,
}: {
  active: CioDashboardView;
  model: CioDashboardModel;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  detailHrefFor: DetailHrefBuilder;
}) {
  return (
    <div style={{ padding: "22px 32px 36px" }}>
      {active === "overview" ? (
        <>
          <CioOverviewKpiStrip model={model} />
          <CioStoryBoard model={model} />
          <CioDecisionCards actions={model.decisionActions} />
        </>
      ) : (
        <>
          <CioDashboardViewLead active={active} model={model} />
          <CioDetailKpiStrip model={model} />
        </>
      )}

      {model.gaps.length > 0 ? (
        <div
          style={{
            border: `1px solid ${T.AMBER}`,
            background: T.AMBER_BG,
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 18,
            color: T.INK,
            fontSize: 13.5,
          }}
        >
          <strong>Loaded-data gaps:</strong> {model.gaps.join(" ")}
        </div>
      ) : null}

      {active === "visuals" ? (
        <div style={{ display: "grid", gap: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <CioPanel title="Run versus change.">
              <CioSplitBar
                leftLabel="Run"
                leftValue={model.runTotal}
                rightLabel="Change"
                rightValue={model.changeTotal}
              />
            </CioPanel>
            <CioPanel title="OpEx versus CapEx.">
              <CioSplitBar
                leftLabel="OpEx"
                leftValue={model.opexTotal}
                rightLabel="CapEx"
                rightValue={model.capexTotal}
              />
            </CioPanel>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <CioPanel title="Spend by function.">
              <CioBarList
                rows={model.spendByFunction.slice(0, 6)}
                total={model.committedTotal}
                empty="No function or portfolio ownership rows are available."
              />
            </CioPanel>
            <CioPanel title="Vendor exposure.">
              <CioBarList
                rows={model.spendByVendor.slice(0, 6)}
                total={model.spendByVendor.reduce(
                  (sum, row) => sum + row.amount,
                  0,
                )}
                empty="No vendor contract values are loaded."
              />
            </CioPanel>
            <CioPanel title="AI investment families.">
              <CioBarList
                rows={model.aiSpendRows.slice(0, 6)}
                total={model.aiSpendRows.reduce(
                  (sum, row) => sum + row.amount,
                  0,
                )}
                empty="No AI-tagged spend rows are loaded."
              />
            </CioPanel>
          </div>
        </div>
      ) : null}

      {active === "overview" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.9fr)",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <CioPanel title="Where the portfolio money is concentrated.">
              <CioProgramTable
                rows={model.topPrograms.slice(0, 5)}
                evidenceCount={model.initiativeEvidenceCount}
                detailHrefFor={detailHrefFor}
              />
            </CioPanel>
            <div style={{ display: "grid", gap: 18 }}>
              <CioPanel title="Which functions carry the envelope.">
                <CioBarList
                  rows={model.spendByFunction.slice(0, 5)}
                  total={model.committedTotal}
                  empty="Owner function or portfolio labels are missing from the Tower rows."
                />
              </CioPanel>
              <CioPanel title="Who holds the contract exposure.">
                <CioBarList
                  rows={model.spendByVendor.slice(0, 5)}
                  total={model.spendByVendor.reduce(
                    (sum, row) => sum + row.amount,
                    0,
                  )}
                  empty="Vendor contract values are not loaded."
                />
              </CioPanel>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <CioPanel title="How much keeps the lights on versus changes the business.">
              <CioSplitBar
                leftLabel="Run"
                leftValue={model.runTotal}
                rightLabel="Change"
                rightValue={model.changeTotal}
              />
            </CioPanel>
            <CioPanel title="What is operating cost versus capitalized change.">
              <CioSplitBar
                leftLabel="OpEx"
                leftValue={model.opexTotal}
                rightLabel="CapEx"
                rightValue={model.capexTotal}
              />
            </CioPanel>
          </div>
          <CioPortfolioCompanyComparison rows={model.budgetRollups} />
        </>
      ) : null}

      {active === "portfolio" ? (
        <CioPanel
          eyebrow="Ranked portfolio"
          title="All loaded IT initiatives by budget and proof posture."
        >
          <CioProgramTable rows={initiatives} detailHrefFor={detailHrefFor} />
        </CioPanel>
      ) : null}

      {active === "budget" ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          <CioPanel title="Spending structure.">
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <h4
                  style={{
                    margin: "0 0 4px",
                    color: T.INK,
                    fontSize: 15,
                  }}
                >
                  Run vs change
                </h4>
                <div
                  style={{ color: T.GRAY_DK, fontSize: 12.5, marginBottom: 10 }}
                >
                  How much spend moves the business forward.
                </div>
                <CioSplitBar
                  leftLabel="Run"
                  leftValue={model.runTotal}
                  rightLabel="Change"
                  rightValue={model.changeTotal}
                />
              </div>
              <div>
                <h4
                  style={{
                    margin: "0 0 4px",
                    color: T.INK,
                    fontSize: 15,
                  }}
                >
                  OpEx vs CapEx
                </h4>
                <div
                  style={{ color: T.GRAY_DK, fontSize: 12.5, marginBottom: 10 }}
                >
                  Expense versus capitalized change.
                </div>
                <CioSplitBar
                  leftLabel="OpEx"
                  leftValue={model.opexTotal}
                  rightLabel="CapEx"
                  rightValue={model.capexTotal}
                />
              </div>
            </div>
          </CioPanel>
          <CioPanel title="Spend by function.">
            <CioBarList
              rows={model.spendByFunction}
              total={model.committedTotal}
              empty="No function or portfolio ownership rows are available."
            />
          </CioPanel>
        </div>
      ) : null}

      {active === "vendors" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.2fr",
            gap: 18,
          }}
        >
          <CioPanel eyebrow="Concentration" title="Vendor spend concentration.">
            <CioBarList
              rows={model.spendByVendor}
              total={model.spendByVendor.reduce(
                (sum, row) => sum + row.amount,
                0,
              )}
              empty="No vendor contract values are loaded."
            />
          </CioPanel>
          <CioPanel eyebrow="Renewal clock" title="Contracts Tower can watch.">
            <CioVendorTable
              rows={model.renewalRows.length > 0 ? model.renewalRows : vendors}
            />
          </CioPanel>
        </div>
      ) : null}

      {active === "ai_roi" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.95fr 1.15fr",
            gap: 18,
          }}
        >
          <CioPanel
            eyebrow="AI spend families"
            title="Copilot, SaaS agents, platforms, and true AI bets."
          >
            <CioBarList
              rows={model.aiSpendRows}
              total={model.aiSpendRows.reduce(
                (sum, row) => sum + row.amount,
                0,
              )}
              empty="No AI-tagged spend rows are loaded under the Tower initiative evidence."
            />
          </CioPanel>
          <CioPanel
            eyebrow="ROI proof"
            title="Spend-to-outcome proof by AI family."
          >
            {model.aiSpendRows.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {model.aiSpendRows.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      borderTop: `1px solid ${T.RULE}`,
                      paddingTop: 10,
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: 14,
                      alignItems: "baseline",
                    }}
                  >
                    <strong>{row.label}</strong>
                    <span>{formatMoney(row.amount)} spend</span>
                    <span
                      style={{ color: row.measured > 0 ? T.GREEN : T.AMBER }}
                    >
                      {row.measured > 0
                        ? `${formatMoney(row.measured)} measured`
                        : "value gap"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <TowerEmptyState
                eyebrow="AI ROI gap"
                title="No AI spend family can be benchmarked yet."
                body="Load explicit Copilot, vendor-agent, platform, and initiative spend/outcome fields to compare ROI by AI investment type."
              />
            )}
          </CioPanel>
        </div>
      ) : null}
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

function formatRatioPercent(value: number | null | undefined): string {
  const ratio = Number(value ?? 0);
  if (!Number.isFinite(ratio) || ratio <= 0) return "intensity gap";
  const pct = ratio <= 1 ? ratio * 100 : ratio;
  return `${pct.toFixed(1)}% of revenue`;
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
            Detail canvas · {labelize(initiative.stage)}
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
              Selected pressure
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
              {labelize(initiative.ownerFunction ?? "Unassigned function")}
            </div>
            <div
              style={{
                marginTop: 8,
                color: T.GRAY_DK,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {labelize(initiative.primaryGoalName)} ·{" "}
              {labelize(initiative.primaryCategoryName)}
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
    return `Risk posture · ${labelize(initiative.statusFlag)}`;
  if (lens === "contract")
    return `Vendor exposure · ${initiative.confidenceLevel}`;
  if (lens === "adopt") return `Adoption path · ${labelize(initiative.stage)}`;
  return `Value realization · ${initiative.confidenceLevel}`;
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
                  <th style={{ padding: "0 8px 8px 0" }}>Category</th>
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
                      {initiative.primaryCategoryName}
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
                meta={`${vendor.initiativeName || "Linked program"} · ${activeLens === "contract" ? daysUntilLabel(vendor.renewalDate) : lensLabel(activeLens)}`}
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
              meta={card.magnitudeLabel}
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
          const markerTitle = `${dot.name} · ${dot.amount}${dot.alignedCallout ? " · aligned callout" : ""}`;
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
              <span aria-hidden="true">•</span>
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
   * to /api/tower/cio-chat. When omitted the chat composer disables
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
  /** CIO budget rollups from the governed Tower budget read model. */
  budgetRollups?: ReadonlyArray<TowerBudgetRollup>;
  /** Derived metric packet from cio_tower.measure_results. Dashboard and chat share this read model. */
  metricPackets?: ReadonlyArray<CioTowerMetricPacket>;
  /** Derived CXO command-center projection from cio_tower.*; not the Tower source of truth. */
  cxoView?: CioTowerCxoViewModel | null;
  /** Flagged TowerContextPack runtime view for selected measurement/readiness proof. */
  towerV3RuntimeView?: TowerV3RuntimeViewModel | null;
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
  budgetRollups,
  metricPackets,
  cxoView,
  towerV3RuntimeView,
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
  const dashboardParam = searchParams?.get("dashboard");
  const [activeCioDashboardView, setActiveCioDashboardView] =
    useState<CioDashboardView>(() => parseCioDashboardView(dashboardParam));
  useEffect(() => {
    setActiveCioDashboardView(parseCioDashboardView(dashboardParam));
  }, [dashboardParam]);
  const activeDetailId = searchParams?.get("detail") ?? null;
  const activePressureId = searchParams?.get("pressure") ?? null;
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
        dashboard?: CioDashboardView;
        detail?: string | null;
        pressure?: string | null;
      } = {},
    ) => {
      const params = new URLSearchParams();
      if (activeTab !== "portfolio") params.set("tab", activeTab);
      const dashboard = next.dashboard ?? activeCioDashboardView;
      if (dashboard !== "overview") params.set("dashboard", dashboard);
      const detail = next.detail === undefined ? activeDetailId : next.detail;
      if (detail) params.set("detail", detail);
      const pressure =
        next.pressure === undefined ? activePressureId : next.pressure;
      if (pressure) params.set("pressure", pressure);
      const query = params.toString();
      return query ? `/tower?${query}` : "/tower";
    },
    [activeCioDashboardView, activeDetailId, activePressureId, activeTab],
  );

  const detailHrefFor = useCallback<DetailHrefBuilder>(
    (displayId, pressureId = null) => {
      if (!displayId) return undefined;
      return buildTowerHref({ detail: displayId, pressure: pressureId });
    },
    [buildTowerHref],
  );
  const selectCioDashboardView = useCallback(
    (dashboard: CioDashboardView) => {
      setActiveCioDashboardView(dashboard);
      router.push(
        buildTowerHref({
          dashboard,
          detail: null,
          pressure: null,
        }),
      );
    },
    [buildTowerHref, router],
  );

  const closeDetailHref = buildTowerHref({ detail: null, pressure: null });

  useEffect(() => {
    if (!activeDetailId) return;
    towerCanvasRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeDetailId, activeTab]);

  useEffect(() => {
    if (activeDetailId || activeTab !== "portfolio") return;
    towerCanvasRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeCioDashboardView, activeDetailId, activeTab]);

  const cioDashboardModel = buildCioDashboardModel(
    initiatives ?? [],
    vendors ?? [],
    towerToday,
    budgetRollups ?? [],
    metricPackets ?? [],
    cxoView?.tenantName ?? tenantName,
  );
  const hasTowerEvidenceForAva =
    Boolean(cxoView) ||
    cioDashboardModel.initiativeCount > 0 ||
    cioDashboardModel.initiativeEvidenceCount > 0 ||
    cioDashboardModel.budgetRollupCount > 0 ||
    cioDashboardModel.committedTotal > 0;

  // ─── aVa chat state · wired to /api/tower/cio-chat via the shared
  // <AgentDock> mounted around the workspace below. The dock owns the
  // composer (auto-grow, paperclip, mode picker, sticky bottom, resize) so
  // the previous Tower stub composer is gone. We keep the messages /
  // suggestions state here so the runtime contract (threadId, suggestions
  // round-trip) is preserved across turns. ────────────────────────────
  const initialOpener: AtlasMessage = {
    id: "atlas-opener",
    role: "atlas",
    content: cxoView
      ? cxoView.headline
      : hasTowerEvidenceForAva
        ? cioDashboardModel.executiveNarrative
        : (atlasObservationsView?.headline ??
          "aVa is waiting for tenant-bound Tower substrate before it can answer portfolio questions."),
  };
  const [atlasMessages, setAtlasMessages] = useState<AtlasMessage[]>([
    initialOpener,
  ]);
  const [atlasPending, setAtlasPending] = useState(false);
  const [atlasThreadId, setAtlasThreadId] = useState<string | null>(null);
  const initialPrompts: string[] = hasTowerEvidenceForAva
    ? [
        ...cioDashboardModel.scenarioQuestions,
        ...cioDashboardModel.decisionActions.map((action) => action.ask),
      ].slice(0, 7)
    : (atlasObservationsView?.suggestedPrompts.slice() ?? [
        "What Tower evidence is loaded for this tenant?",
        "Which Tower metrics are missing source evidence?",
        "Which portfolio or vendor facts should be loaded next?",
        "What can Tower answer today without assumptions?",
      ]);
  const [atlasSuggestions, setAtlasSuggestions] = useState<AtlasSuggestion[]>(
    initialPrompts.map((label) => ({
      label,
      value: label,
      kind: "message" as const,
    })),
  );

  const sendToAtlas = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
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
        const res = await fetch("/api/tower/cio-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
          }),
          signal: controller.signal,
        });
        const json = (await res
          .json()
          .catch(() => ({}))) as Partial<CioTowerChatResponse>;
        const modelOutput = json.modelOutput;
        if (!res.ok || !modelOutput?.answer) {
          setAtlasMessages((prev) => [
            ...prev,
            {
              id: `atlas-error-${Date.now()}`,
              role: "atlas",
              content:
                json.modelOutput?.answer ??
                json.response ??
                "aVa could not complete the advisory synthesis. Use the visible Tower measures as the governed read and try the question again.",
            },
          ]);
          return;
        }
        setAtlasThreadId(json.traceKey ?? atlasThreadId);
        setAtlasMessages((prev) => [
          ...prev,
          {
            id: `atlas-${Date.now()}`,
            role: "atlas",
            content: modelOutput.answer,
          },
        ]);
        if (modelOutput.followUpQuestion) {
          setAtlasSuggestions([
            {
              label: modelOutput.followUpQuestion,
              value: modelOutput.followUpQuestion,
              kind: "message",
            },
          ]);
        }
      } catch (err) {
        setAtlasMessages((prev) => [
          ...prev,
          {
            id: `atlas-error-${Date.now()}`,
            role: "atlas",
            content:
              err instanceof DOMException && err.name === "AbortError"
                ? "aVa did not finish the Tower answer within the response window. Use the visible dashboard measures as the governed read and try again."
                : "aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.",
          },
        ]);
      } finally {
        window.clearTimeout(timeout);
        setAtlasPending(false);
      }
    },
    [clientId, atlasThreadId],
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
      void sendToAtlas(prompt, []);
    },
    [sendToAtlas],
  );

  const towerMastheadName = cxoView?.tenantName ?? tenantName;
  const towerBudgetEnvelope = cxoView
    ? findCxoCard(cxoView.cards, "total_it_budget_fy26")
    : null;
  const towerEntityCount = budgetRollups?.length ?? 0;

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
            padding: "28px 40px 24px",
            maxWidth: 1080,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                  color: T.GOLD,
                  textTransform: "uppercase",
                  marginBottom: 11,
                }}
              >
                Tower
              </div>
              <h1
                style={{
                  fontFamily: T.SERIF,
                  fontSize: 40,
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.03,
                  margin: 0,
                  color: T.INK,
                  whiteSpace: "nowrap",
                }}
              >
                CXO Executive Dashboard
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  marginTop: 10,
                  flexWrap: "wrap",
                  color: T.INK_2,
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.35,
                }}
              >
                <span style={{ fontFamily: T.SERIF, fontWeight: 500 }}>
                  {towerMastheadName}
                </span>
                <span style={{ color: T.GRAY }}>·</span>
                <em>Every number citable.</em>
                {towerEntityCount > 0 ? (
                  <>
                    <span style={{ color: T.GRAY }}>·</span>
                    <span>
                      {towerEntityCount} entit
                      {towerEntityCount === 1 ? "y" : "ies"}
                    </span>
                  </>
                ) : null}
                {towerBudgetEnvelope ? (
                  <>
                    <span style={{ color: T.GRAY }}>·</span>
                    <span>
                      <b
                        style={{
                          color: T.INK,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {towerBudgetEnvelope.displayValue}
                      </b>{" "}
                      FY26 in view
                    </span>
                  </>
                ) : null}
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: T.INK_2,
                  fontSize: 13,
                  fontWeight: 520,
                  lineHeight: 1.35,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Budget, top programs, value proof, vendor exposure, and risks
                the CIO should inspect this week.
              </div>
            </div>
            {reportDownloadSlot ? (
              <div style={{ flex: "0 0 auto" }}>{reportDownloadSlot}</div>
            ) : null}
          </div>
        </div>

        {activeTab === "portfolio" ? (
          <>
            {portfolioSequenceSlot}

            {activeDetailId ? (
              <TowerInlineDetailPanel
                detailId={activeDetailId}
                initiative={detailInitiative}
                vendors={vendors ?? []}
                pressure={detailPressure}
                closeHref={closeDetailHref}
              />
            ) : towerV3RuntimeView ? (
              <TowerContextRuntimePanel view={towerV3RuntimeView} />
            ) : cxoView ? (
              <CxoGovernedCommandCenter
                model={cxoView}
                budgetRollups={budgetRollups}
              />
            ) : (
              <>
                <CioDashboardTabs
                  active={activeCioDashboardView}
                  onSelect={selectCioDashboardView}
                />
                <CioDashboardPanel
                  active={activeCioDashboardView}
                  model={cioDashboardModel}
                  initiatives={initiatives ?? []}
                  vendors={vendors ?? []}
                  detailHrefFor={detailHrefFor}
                />
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
      topBarProps={{
        tenantName,
        preserveTenantName: true,
        showLocked: true,
        context,
      }}
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
        preserveVisibleText
        keepSuggestedActionsVisible
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

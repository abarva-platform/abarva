"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  AtlasChatPanel,
  type AtlasMessage,
} from "@/components/atlas/AtlasChatPanel";
import type { AtlasSuggestion } from "@/lib/atlas/types";
import type { AttachmentRef } from "@/components/agent/AgentDock";
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";
import type { TowerBandMetricsView } from "@/lib/tower/band-metrics-view";
import type { TowerPressuresView } from "@/lib/tower/pressure-cards-view";
import type { TowerSubstrateCounts } from "@/components/tower/TowerIndexPage";
import type { AiControlTowerLens } from "@/lib/ai-control-tower/contracts";

type LensKey = AiControlTowerLens;

interface AiControlTowerPageProps {
  tenantName: string;
  clientId?: string;
  towerToday: string;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  bandMetrics: TowerBandMetricsView;
  pressuresView: TowerPressuresView;
  substrateCounts: TowerSubstrateCounts;
}

const TOKENS = {
  bg: "#f7f6f2",
  surface: "#ffffff",
  ink: "#151816",
  muted: "#59645e",
  faint: "#eef0ec",
  rule: "#d9ded6",
  navy: "#10254f",
  green: "#1f7a5a",
  teal: "#1c6f78",
  amber: "#a26113",
  red: "#9e2f2f",
  blue: "#2c5f9e",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  sans: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  serif: "var(--font-fraunces), Georgia, serif",
} as const;

const LENSES: Array<{
  key: LensKey;
  label: string;
  shortLabel: string;
  question: string;
}> = [
  {
    key: "value_adoption",
    label: "Value and adoption",
    shortLabel: "Value",
    question:
      "Is AI spend turning into measurable productivity, governed adoption, and defensible business value?",
  },
  {
    key: "productivity",
    label: "Productivity",
    shortLabel: "Productivity",
    question:
      "Where did work get faster, and did quality stay inside guardrails?",
  },
  {
    key: "agents",
    label: "Agents",
    shortLabel: "Agents",
    question:
      "Which AI agents are resolving work instead of only adding usage?",
  },
  {
    key: "spend",
    label: "Spend",
    shortLabel: "Spend",
    question:
      "Which spend should be scaled, challenged, renegotiated, or stopped?",
  },
  {
    key: "risk",
    label: "Risk",
    shortLabel: "Risk",
    question:
      "Which AI claims are blocked by risk, governance, or weak evidence?",
  },
  {
    key: "evidence",
    label: "Evidence",
    shortLabel: "Evidence",
    question:
      "Which answers are evidence-backed, review-required, missing, or stale?",
  },
  {
    key: "actions",
    label: "Actions",
    shortLabel: "Actions",
    question:
      "What should the CIO, CFO, and owners do before the next steering meeting?",
  },
];

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

function percent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function normalizeStatus(status?: string | null): string {
  return (status ?? "unknown").replace(/_/g, " ");
}

function initiativeCommitment(initiative: AIInitiative): number {
  return Number(
    initiative.committedTotalUsd ?? initiative.committedAnnualUsd ?? 0,
  );
}

function initiativeMeasured(initiative: AIInitiative): number {
  return Number(initiative.measuredValueUsd ?? 0);
}

function summarize(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
) {
  const committed = initiatives.reduce(
    (sum, item) => sum + initiativeCommitment(item),
    0,
  );
  const measured = initiatives.reduce(
    (sum, item) => sum + initiativeMeasured(item),
    0,
  );
  const spend = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.contractValueUsd ?? 0),
    0,
  );
  const atRisk = initiatives.filter((item) =>
    /risk|blocked|gap|watch/i.test(String(item.statusFlag ?? "")),
  ).length;
  const active = initiatives.filter(
    (item) => !/closed|cancel|settled/i.test(String(item.stage ?? "")),
  ).length;
  const adoptionGaps = initiatives.filter((item) =>
    /adoption/i.test(String(item.statusFlag ?? "")),
  ).length;
  const valueCapture = committed > 0 ? (measured / committed) * 100 : 0;
  return {
    active,
    committed,
    measured,
    spend,
    atRisk,
    adoptionGaps,
    valueCapture,
    renewal90: vendors.filter((vendor) => {
      if (!vendor.renewalDate) return false;
      const days = Math.ceil(
        (new Date(vendor.renewalDate).getTime() - Date.now()) / 86_400_000,
      );
      return days >= 0 && days <= 90;
    }).length,
  };
}

function topInitiatives(initiatives: ReadonlyArray<AIInitiative>) {
  return [...initiatives]
    .sort(
      (a, b) =>
        Math.abs(initiativeCommitment(b) - initiativeMeasured(b)) -
        Math.abs(initiativeCommitment(a) - initiativeMeasured(a)),
    )
    .slice(0, 5);
}

function buildInitialMessages(tenantName: string): AtlasMessage[] {
  return [
    {
      id: "atlas-welcome",
      role: "atlas",
      content: `I am watching ${tenantName}'s AI portfolio by value, adoption, productivity, agents, spend, risk, evidence, and derived actions. Pick a question or ask in plain English.`,
    },
  ];
}

function atlasResponseFor(lens: LensKey, tenantName: string): AtlasMessage {
  const lensMeta = LENSES.find((item) => item.key === lens) ?? LENSES[0];
  const rows: Record<LensKey, string> = {
    value_adoption:
      "Recommended read: separate licensed adoption from active value. Start with initiatives that have measured value, usage proof, and a named owner.",
    productivity:
      "Recommended read: show before/after by persona or team, then pair speed gains with quality counterweights such as defects, incidents, and rework.",
    agents:
      "Recommended read: rank agents by resolved work, avoided touches, and exception rate, not only interactions or vendor-reported usage.",
    spend:
      "Recommended read: challenge spend where licenses or agent transactions are growing faster than realized benefit and adoption evidence.",
    risk: "Recommended read: do not scale claims with unresolved model risk, privacy gaps, missing evidence, or unsupported benefit attribution.",
    evidence:
      "Recommended read: promote only retrieval-proven, source-linked facts into the executive brief; send weak document-derived claims to review.",
    actions:
      "Recommended read: actions are derived. The system proposes them from spend, value, usage, evidence, risk, and renewal pressure; humans approve the move.",
  };
  return {
    id: `atlas-${lens}-${Date.now()}`,
    role: "atlas",
    content: `${tenantName} - ${lensMeta.shortLabel}: ${rows[lens]}`,
  };
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
}) {
  const color =
    tone === "green"
      ? TOKENS.green
      : tone === "amber"
        ? TOKENS.amber
        : tone === "red"
          ? TOKENS.red
          : tone === "blue"
            ? TOKENS.blue
            : TOKENS.muted;
  return (
    <span
      style={{
        border: `1px solid ${color}33`,
        background: `${color}12`,
        color,
        borderRadius: 999,
        padding: "4px 8px",
        fontFamily: TOKENS.mono,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
}) {
  return (
    <div style={metricTileStyle}>
      <div style={eyebrowStyle}>{label}</div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontFamily: TOKENS.serif,
            fontSize: 31,
            fontWeight: 760,
            lineHeight: 1,
            color: TOKENS.ink,
          }}
        >
          {value}
        </div>
        <StatusPill tone={tone}>
          {tone === "neutral" ? "read" : tone}
        </StatusPill>
      </div>
      <div
        style={{
          marginTop: 8,
          color: TOKENS.muted,
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12,
          color: TOKENS.ink,
          fontWeight: 700,
        }}
      >
        <span>{label}</span>
        <span style={{ color: TOKENS.muted, fontWeight: 600 }}>{detail}</span>
      </div>
      <div
        style={{
          height: 8,
          background: TOKENS.faint,
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 7,
        }}
      >
        <div
          style={{
            width: `${Math.max(4, Math.min(100, value))}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function ActionsTable({
  activeLens,
  initiatives,
  vendors,
}: {
  activeLens: LensKey;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
}) {
  const rows = useMemo(() => {
    const items = topInitiatives(initiatives)
      .slice(0, 4)
      .map((initiative) => {
        const gap =
          initiativeCommitment(initiative) - initiativeMeasured(initiative);
        return {
          owner: initiative.ownerName || "Named owner",
          item: initiative.name,
          action: gap > 0 ? "Prove or reduce claim" : "Prepare scale decision",
          basis: `${money(Math.abs(gap))} value delta`,
          tone: gap > 0 ? "amber" : "green",
        };
      });
    const renewal = vendors.find((vendor) => vendor.renewalDate);
    if (renewal) {
      items.unshift({
        owner: "Vendor owner",
        item: renewal.vendorName,
        action: "Review renewal before scale",
        basis: `${money(Number(renewal.contractValueUsd ?? 0))} contract exposure`,
        tone: "blue",
      });
    }
    return items.slice(0, 5);
  }, [initiatives, vendors]);

  if (activeLens !== "actions") return null;
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>Derived actions</div>
          <h2 style={sectionTitleStyle}>
            System-synthesized recommendations for human approval.
          </h2>
        </div>
        <StatusPill tone="blue">derived</StatusPill>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}
        >
          <thead>
            <tr>
              {["Action", "Subject", "Owner", "Basis", "State"].map((head) => (
                <th key={head} style={tableHeadStyle}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.item}-${row.action}`}>
                <td style={tableCellStyle}>{row.action}</td>
                <td style={tableCellStyle}>{row.item}</td>
                <td style={tableCellStyle}>{row.owner}</td>
                <td style={tableCellStyle}>{row.basis}</td>
                <td style={tableCellStyle}>
                  <StatusPill tone={row.tone as "green" | "amber" | "blue"}>
                    proposed
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AiControlTowerPage({
  tenantName,
  clientId,
  towerToday,
  initiatives,
  vendors,
  bandMetrics,
  pressuresView,
  substrateCounts,
}: AiControlTowerPageProps) {
  const [activeLens, setActiveLens] = useState<LensKey>("value_adoption");
  const [messages, setMessages] = useState<AtlasMessage[]>(() =>
    buildInitialMessages(tenantName),
  );
  const summary = useMemo(
    () => summarize(initiatives, vendors),
    [initiatives, vendors],
  );
  const priorityInitiatives = useMemo(
    () => topInitiatives(initiatives),
    [initiatives],
  );
  const lensMeta = LENSES.find((item) => item.key === activeLens) ?? LENSES[0];

  const suggestions: AtlasSuggestion[] = [
    {
      kind: "message",
      label: "Where should we scale or hold?",
      value: "Where should we scale or hold AI investment?",
    },
    {
      kind: "message",
      label: "Which spend lacks proof?",
      value: "Which AI spend lacks adoption or value proof?",
    },
    {
      kind: "message",
      label: "What actions go to steering?",
      value: "What actions should go to the next steering meeting?",
    },
  ];

  const selectLens = (lens: LensKey) => {
    setActiveLens(lens);
    setMessages((current) => [...current, atlasResponseFor(lens, tenantName)]);
  };

  const onAtlasSubmit = async (text: string, attachments: AttachmentRef[]) => {
    void attachments;
    const lower = text.toLowerCase();
    const nextLens = lower.includes("agent")
      ? "agents"
      : lower.includes("spend") || lower.includes("cost")
        ? "spend"
        : lower.includes("risk") || lower.includes("govern")
          ? "risk"
          : lower.includes("evidence") || lower.includes("proof")
            ? "evidence"
            : lower.includes("productiv") || lower.includes("dora")
              ? "productivity"
              : lower.includes("action") || lower.includes("steering")
                ? "actions"
                : "value_adoption";
    setActiveLens(nextLens);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: text },
      atlasResponseFor(nextLens, tenantName),
    ]);
  };

  const workspace = (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AI Control Tower · {tenantName}</div>
          <h1 style={heroTitleStyle}>
            AI value, productivity, spend, and risk in one executive read.
          </h1>
          <p style={heroQuestionStyle}>{lensMeta.question}</p>
        </div>
        <div style={heroActionsStyle}>
          <Link
            href="/admin/context-layer/templates"
            style={primaryButtonStyle}
          >
            Templates
          </Link>
        </div>
      </section>

      <nav aria-label="AI Control Tower lenses" style={tabBarStyle}>
        {LENSES.map((lens) => {
          const selected = lens.key === activeLens;
          return (
            <button
              key={lens.key}
              type="button"
              onClick={() => selectLens(lens.key)}
              style={{
                ...tabStyle,
                color: selected ? TOKENS.surface : TOKENS.ink,
                background: selected ? TOKENS.navy : TOKENS.surface,
                borderColor: selected ? TOKENS.navy : TOKENS.rule,
              }}
            >
              {lens.label}
            </button>
          );
        })}
      </nav>

      <section style={metricGridStyle}>
        <MetricTile
          label="Observed initiatives"
          value={String(substrateCounts.initiatives || initiatives.length)}
          detail={`${summary.active} active or in-flight`}
          tone="blue"
        />
        <MetricTile
          label="Measured value"
          value={money(summary.measured)}
          detail={`${percent(summary.valueCapture)} of declared commitment`}
          tone={summary.valueCapture >= 60 ? "green" : "amber"}
        />
        <MetricTile
          label="AI spend exposure"
          value={money(summary.spend)}
          detail={`${summary.renewal90} renewals inside 90 days`}
          tone="amber"
        />
        <MetricTile
          label="Evidence posture"
          value={String(
            substrateCounts.kpis +
              substrateCounts.decisions +
              substrateCounts.stakeholderNotes,
          )}
          detail="facts, decisions, notes tracked"
          tone={summary.atRisk > 0 ? "red" : "green"}
        />
      </section>

      <section style={dashboardGridStyle}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Executive portfolio</div>
              <h2 style={sectionTitleStyle}>
                Spend-to-value view, with adoption and evidence pressure.
              </h2>
            </div>
            <StatusPill tone="green">live read</StatusPill>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <BarRow
              label="Value captured"
              value={summary.valueCapture}
              color={TOKENS.green}
              detail={`${money(summary.measured)} realized`}
            />
            <BarRow
              label="Adoption confidence"
              value={Math.max(18, 100 - summary.adoptionGaps * 8)}
              color={TOKENS.teal}
              detail={`${summary.adoptionGaps} gaps`}
            />
            <BarRow
              label="Evidence completeness"
              value={Math.min(
                100,
                ((substrateCounts.kpis +
                  substrateCounts.decisions +
                  substrateCounts.stakeholderNotes) /
                  Math.max(1, initiatives.length * 3)) *
                  100,
              )}
              color={TOKENS.blue}
              detail={`${substrateCounts.kpis} KPI rows`}
            />
            <BarRow
              label="Risk pressure"
              value={Math.min(100, summary.atRisk * 12)}
              color={TOKENS.red}
              detail={`${summary.atRisk} watch items`}
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Focus list</div>
              <h2 style={sectionTitleStyle}>Where Atlas will look first.</h2>
            </div>
            <StatusPill tone="amber">{`${pressuresView.cards.length} pressures`}</StatusPill>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {priorityInitiatives.slice(0, 4).map((initiative) => (
              <div key={initiative.initiativeId} style={rowStyle}>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 800, color: TOKENS.ink }}
                  >
                    {initiative.name}
                  </div>
                  <div
                    style={{ marginTop: 4, fontSize: 12, color: TOKENS.muted }}
                  >
                    {initiative.ownerName || "Unassigned owner"} ·{" "}
                    {normalizeStatus(initiative.stage)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 800, color: TOKENS.ink }}
                  >
                    {money(initiativeMeasured(initiative))}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <StatusPill
                      tone={
                        /risk|gap|blocked|watch/i.test(
                          String(initiative.statusFlag ?? ""),
                        )
                          ? "red"
                          : "green"
                      }
                    >
                      {normalizeStatus(initiative.statusFlag)}
                    </StatusPill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <ActionsTable
        activeLens={activeLens}
        initiatives={initiatives}
        vendors={vendors}
      />

      {activeLens !== "actions" ? (
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Monthly refresh model</div>
              <h2 style={sectionTitleStyle}>Templates now, APIs later.</h2>
            </div>
            <StatusPill tone="blue">{towerToday}</StatusPill>
          </div>
          <div style={sourceGridStyle}>
            {[
              [
                "M365 Copilot",
                "Usage, active users, licenses, persona adoption",
              ],
              [
                "SDLC tools",
                "DORA before/after, PR cycle time, defects, incidents",
              ],
              [
                "ServiceNow agents",
                "Tickets deflected, exception rate, human override",
              ],
              ["ERP agents", "HR, finance, and supply-chain process uplift"],
              [
                "Finance and PMO",
                "Business case, realized value, approval evidence",
              ],
              [
                "Risk and governance",
                "Policy gates, model risk, privacy, audit posture",
              ],
            ].map(([label, detail]) => (
              <div key={label} style={sourceTileStyle}>
                <div
                  style={{ fontSize: 13, fontWeight: 800, color: TOKENS.ink }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    color: TOKENS.muted,
                    lineHeight: 1.35,
                  }}
                >
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "none" }} aria-hidden="true">
        {bandMetrics.metrics.map((metric) => metric.key).join(",")}
      </div>
    </main>
  );

  return (
    <AtlasChatPanel
      messages={messages}
      pending={false}
      suggestions={suggestions}
      onSuggestion={(suggestion) => onAtlasSubmit(suggestion.value, [])}
      onSubmit={onAtlasSubmit}
      workspace={workspace}
      surface="ai-control-tower"
      surfaceContext={{ surface: "ai-control-tower", activeLens, clientId }}
      initialQuote="Ask about value, adoption, productivity, agents, spend, risk, evidence, or actions."
      defaultLeftPercent={27}
      minLeftPx={310}
    />
  );
}

const pageStyle: CSSProperties = {
  minHeight: "calc(100vh - 64px)",
  background: TOKENS.bg,
  padding: "24px clamp(18px, 3vw, 38px) 38px",
  fontFamily: TOKENS.sans,
  color: TOKENS.ink,
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  paddingBottom: 18,
  borderBottom: `1px solid ${TOKENS.rule}`,
};

const heroTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: TOKENS.serif,
  fontSize: "clamp(30px, 3vw, 46px)",
  lineHeight: 1,
  fontWeight: 820,
  letterSpacing: 0,
  maxWidth: 820,
};

const heroQuestionStyle: CSSProperties = {
  margin: "10px 0 0",
  color: TOKENS.muted,
  fontSize: 15,
  lineHeight: 1.4,
  maxWidth: 780,
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const primaryButtonStyle: CSSProperties = {
  border: `1px solid ${TOKENS.navy}`,
  borderRadius: 7,
  background: TOKENS.navy,
  color: TOKENS.surface,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  padding: "16px 0",
};

const tabStyle: CSSProperties = {
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 999,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
  gap: 12,
};

const metricTileStyle: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 8,
  padding: 15,
  minHeight: 118,
};

const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
  gap: 14,
  marginTop: 14,
};

const sectionStyle: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 8,
  padding: 16,
  marginTop: 14,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 16,
};

const eyebrowStyle: CSSProperties = {
  fontFamily: TOKENS.mono,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: TOKENS.muted,
  fontWeight: 800,
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: TOKENS.serif,
  fontSize: 23,
  lineHeight: 1.05,
  fontWeight: 760,
  letterSpacing: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "11px 0",
  borderTop: `1px solid ${TOKENS.faint}`,
};

const sourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const sourceTileStyle: CSSProperties = {
  border: `1px solid ${TOKENS.faint}`,
  borderRadius: 8,
  padding: 12,
  background: "#fbfcfa",
};

const tableHeadStyle: CSSProperties = {
  textAlign: "left",
  padding: "9px 8px",
  borderBottom: `1px solid ${TOKENS.rule}`,
  fontFamily: TOKENS.mono,
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: TOKENS.muted,
};

const tableCellStyle: CSSProperties = {
  padding: "11px 8px",
  borderBottom: `1px solid ${TOKENS.faint}`,
  fontSize: 13,
  color: TOKENS.ink,
};

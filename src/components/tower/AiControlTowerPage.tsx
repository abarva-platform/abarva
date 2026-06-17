"use client";

import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { AtlasChatPanel, type AtlasMessage } from "@/components/atlas/AtlasChatPanel";
import type { AtlasSuggestion, AtlasChatResponse } from "@/lib/atlas/types";
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
type PillTone = "green" | "amber" | "red" | "blue" | "neutral";

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
  bg: "#f8f7f4",
  surface: "#ffffff",
  ink: "#151816",
  muted: "#59645e",
  faint: "#eef0ec",
  rule: "#d9ded6",
  navy: "#10254f",
  green: "#1f7a5a",
  amber: "#a26113",
  red: "#9e2f2f",
  blue: "#2c5f9e",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  sans: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  serif: "var(--font-fraunces), Georgia, serif",
} as const;

const LENSES: Array<{
  key: LensKey;
  kicker: string;
  label: string;
  shortLabel: string;
  question: string;
}> = [
  {
    key: "value_adoption",
    kicker: "VALUE · L2",
    label: "Value and adoption",
    shortLabel: "Value",
    question:
      "Is AI spend turning into measurable productivity, governed adoption, and defensible business value?",
  },
  {
    key: "productivity",
    kicker: "FLOW · L2",
    label: "Productivity",
    shortLabel: "Productivity",
    question:
      "Where did work get faster, and did quality stay inside guardrails?",
  },
  {
    key: "agents",
    kicker: "AGENTS · L1",
    label: "Agents",
    shortLabel: "Agents",
    question:
      "Which AI agents are resolving work instead of only adding usage?",
  },
  {
    key: "spend",
    kicker: "COST · L1",
    label: "Spend",
    shortLabel: "Spend",
    question:
      "Which spend should be scaled, challenged, renegotiated, or stopped?",
  },
  {
    key: "risk",
    kicker: "GATES · L1",
    label: "Risk",
    shortLabel: "Risk",
    question:
      "Which AI claims are blocked by risk, governance, or weak evidence?",
  },
  {
    key: "evidence",
    kicker: "TRUST · L0",
    label: "Evidence",
    shortLabel: "Evidence",
    question:
      "Which answers are evidence-backed, review-required, missing, or stale?",
  },
  {
    key: "actions",
    kicker: "MOVES · L3",
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

function captureRate(initiative: AIInitiative): number {
  const committed = initiativeCommitment(initiative);
  return committed > 0 ? (initiativeMeasured(initiative) / committed) * 100 : 0;
}

function renewalDays(vendor: AIInitiativeVendorRow): number | null {
  if (!vendor.renewalDate) return null;
  const days = Math.ceil(
    (new Date(vendor.renewalDate).getTime() - Date.now()) / 86_400_000,
  );
  return Number.isFinite(days) ? days : null;
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

function atRiskInitiatives(initiatives: ReadonlyArray<AIInitiative>) {
  return [...initiatives]
    .filter((initiative) =>
      /risk|blocked|gap|watch|lag|review/i.test(
        `${initiative.statusFlag} ${initiative.statusSummary} ${initiative.confidenceLevel}`,
      ),
    )
    .sort(
      (a, b) =>
        initiativeCommitment(b) - initiativeMeasured(b) -
        (initiativeCommitment(a) - initiativeMeasured(a)),
    )
    .slice(0, 5);
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: PillTone;
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
        padding: "3px 7px",
        fontFamily: TOKENS.mono,
        fontSize: 9,
        fontWeight: 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

type LensRow = {
  subject: string;
  owner: string;
  metric: string;
  basis: string;
  state: string;
  tone: PillTone;
};

type LensCallout = {
  label: string;
  value: string;
  detail: string;
  tone: PillTone;
};

function lensRowsFor(
  lens: LensKey,
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  summary: ReturnType<typeof summarize>,
  substrateCounts: TowerSubstrateCounts,
): LensRow[] {
  const priority = topInitiatives(initiatives);
  const riskRows = atRiskInitiatives(initiatives);
  const vendorRows = [...vendors]
    .sort(
      (a, b) =>
        Number(b.contractValueUsd ?? 0) - Number(a.contractValueUsd ?? 0),
    )
    .slice(0, 5);

  if (lens === "value_adoption") {
    return priority.map((initiative) => {
      const rate = captureRate(initiative);
      return {
        subject: initiative.name,
        owner: initiative.ownerName || "Named owner required",
        metric: `${percent(rate)} captured`,
        basis: `${money(initiativeMeasured(initiative))} of ${money(initiativeCommitment(initiative))}`,
        state: normalizeStatus(initiative.statusFlag),
        tone: rate >= 70 ? "green" : rate >= 35 ? "amber" : "red",
      };
    });
  }

  if (lens === "productivity") {
    return priority.map((initiative) => ({
      subject: initiative.name,
      owner: initiative.ownerFunction || initiative.ownerTitle || "Team owner",
      metric: initiative.primaryGoalName,
      basis:
        initiative.confidenceLevel === "HIGH"
          ? "before/after evidence ready"
          : "needs DORA or persona baseline",
      state: normalizeStatus(initiative.stage),
      tone: initiative.confidenceLevel === "HIGH" ? "green" : "amber",
    }));
  }

  if (lens === "agents") {
    return priority.map((initiative) => ({
      subject: initiative.name,
      owner: initiative.ownerName || "Process owner",
      metric: initiative.primaryCategoryName,
      basis:
        /agent|copilot|automation|workflow/i.test(
          `${initiative.name} ${initiative.primaryCategoryName}`,
        )
          ? "resolution and exception rate required"
          : "usage alone is insufficient",
      state: normalizeStatus(initiative.statusFlag),
      tone: /healthy|aligned|green/i.test(String(initiative.statusFlag))
        ? "green"
        : "amber",
    }));
  }

  if (lens === "spend") {
    if (vendorRows.length === 0) {
      return [
        {
          subject: "Spend contracts",
          owner: "Finance / sourcing",
          metric: "0 committed rows",
          basis: "load or commit Spend Contracts before CFO demo",
          state: "missing",
          tone: "red",
        },
      ];
    }
    return vendorRows.map((vendor) => {
      const days = renewalDays(vendor);
      return {
        subject: vendor.vendorName,
        owner: vendor.initiativeName,
        metric: money(Number(vendor.contractValueUsd ?? 0)),
        basis:
          days === null
            ? "renewal date missing"
            : days >= 0
              ? `${days} days to renewal`
              : `${Math.abs(days)} days past renewal`,
        state: normalizeStatus(vendor.financialHealth),
        tone:
          vendor.financialHealth === "strong"
            ? "green"
            : vendor.financialHealth === "at_risk"
              ? "red"
              : "amber",
      };
    });
  }

  if (lens === "risk") {
    const rows = riskRows.length > 0 ? riskRows : priority;
    return rows.map((initiative) => ({
      subject: initiative.name,
      owner: initiative.ownerName || "Risk owner",
      metric: normalizeStatus(initiative.statusFlag),
      basis: initiative.statusSummary || "risk basis not stated",
      state: normalizeStatus(initiative.confidenceLevel),
      tone: /high/.test(String(initiative.confidenceLevel)) ? "amber" : "red",
    }));
  }

  if (lens === "evidence") {
    return [
      {
        subject: "KPI evidence",
        owner: "Finance / PMO",
        metric: `${substrateCounts.kpis} KPI rows`,
        basis: "benefit claims need metric lineage",
        state: substrateCounts.kpis > 0 ? "available" : "missing",
        tone: substrateCounts.kpis > 0 ? "green" : "red",
      },
      {
        subject: "Decision log",
        owner: "AI governance",
        metric: `${substrateCounts.decisions} decisions`,
        basis: "scale, hold, and exception decisions need approval trail",
        state: substrateCounts.decisions > 0 ? "available" : "missing",
        tone: substrateCounts.decisions > 0 ? "green" : "amber",
      },
      {
        subject: "Stakeholder notes",
        owner: "Business owners",
        metric: `${substrateCounts.stakeholderNotes} notes`,
        basis: "persona uplift requires named source context",
        state: substrateCounts.stakeholderNotes > 0 ? "available" : "missing",
        tone: substrateCounts.stakeholderNotes > 0 ? "green" : "amber",
      },
      {
        subject: "Initiative registry",
        owner: "AI portfolio office",
        metric: `${substrateCounts.initiatives || initiatives.length} initiatives`,
        basis: "portfolio questions route through the initiative grain",
        state: summary.active > 0 ? "loaded" : "empty",
        tone: summary.active > 0 ? "green" : "red",
      },
    ];
  }

  const actionRows: LensRow[] = priority.slice(0, 4).map((initiative) => {
    const gap = initiativeCommitment(initiative) - initiativeMeasured(initiative);
    return {
      subject: initiative.name,
      owner: initiative.ownerName || "Named owner required",
      metric: gap > 0 ? "prove or reduce" : "prepare scale decision",
      basis: `${money(Math.abs(gap))} value delta`,
      state: "proposed",
      tone: gap > 0 ? "amber" : "green",
    } satisfies LensRow;
  });
  const renewal = vendors.find((vendor) => vendor.renewalDate);
  if (renewal) {
    actionRows.unshift({
      subject: renewal.vendorName,
      owner: "Vendor owner",
      metric: "review renewal",
      basis: `${money(Number(renewal.contractValueUsd ?? 0))} exposure`,
      state: "proposed",
      tone: "blue",
    });
  }
  return actionRows.slice(0, 5);
}

function lensCalloutsFor(
  lens: LensKey,
  summary: ReturnType<typeof summarize>,
  substrateCounts: TowerSubstrateCounts,
): LensCallout[] {
  const evidenceRows =
    substrateCounts.kpis +
    substrateCounts.decisions +
    substrateCounts.stakeholderNotes;
  const callouts: Record<LensKey, LensCallout[]> = {
    value_adoption: [
      {
        label: "Value capture",
        value: percent(summary.valueCapture),
        detail: `${money(summary.measured)} realized`,
        tone: summary.valueCapture >= 60 ? "green" : "amber",
      },
      {
        label: "Adoption gaps",
        value: String(summary.adoptionGaps),
        detail: "initiatives flagged by usage/adoption",
        tone: summary.adoptionGaps > 0 ? "amber" : "green",
      },
    ],
    productivity: [
      {
        label: "Tracked initiatives",
        value: String(summary.active),
        detail: "need before/after baselines by persona or team",
        tone: "blue",
      },
      {
        label: "Quality guardrail",
        value: String(substrateCounts.kpis),
        detail: "KPI rows available for counter-metrics",
        tone: substrateCounts.kpis > 0 ? "green" : "amber",
      },
    ],
    agents: [
      {
        label: "Agent lens",
        value: String(summary.active),
        detail: "rank by resolution, exception rate, and avoided work",
        tone: "blue",
      },
      {
        label: "Evidence need",
        value: String(evidenceRows),
        detail: "facts, decisions, notes available",
        tone: evidenceRows > 0 ? "green" : "amber",
      },
    ],
    spend: [
      {
        label: "Spend exposure",
        value: money(summary.spend),
        detail: "vendor contracts in the AI portfolio",
        tone: summary.spend > 0 ? "amber" : "red",
      },
      {
        label: "Renewals",
        value: String(summary.renewal90),
        detail: "inside 90 days",
        tone: summary.renewal90 > 0 ? "red" : "green",
      },
    ],
    risk: [
      {
        label: "Watch items",
        value: String(summary.atRisk),
        detail: "risk, blocked, gap, or watch status",
        tone: summary.atRisk > 0 ? "red" : "green",
      },
      {
        label: "Governance trail",
        value: String(substrateCounts.decisions),
        detail: "approval decisions captured",
        tone: substrateCounts.decisions > 0 ? "green" : "amber",
      },
    ],
    evidence: [
      {
        label: "Evidence rows",
        value: String(evidenceRows),
        detail: "facts, decisions, notes",
        tone: evidenceRows > 0 ? "green" : "red",
      },
      {
        label: "Answerability",
        value: substrateCounts.initiatives > 0 ? "On" : "Thin",
        detail: "depends on loaded initiative substrate",
        tone: substrateCounts.initiatives > 0 ? "green" : "amber",
      },
    ],
    actions: [
      {
        label: "Proposals",
        value: String(Math.min(5, Math.max(1, summary.active))),
        detail: "derived from value, spend, risk, and evidence",
        tone: "blue",
      },
      {
        label: "Human gate",
        value: "Required",
        detail: "Atlas does not approve writes or decisions",
        tone: "amber",
      },
    ],
  };
  return callouts[lens];
}

function LensCanvas({
  activeLens,
  lensMeta,
  initiatives,
  vendors,
  summary,
  substrateCounts,
  towerToday,
}: {
  activeLens: LensKey;
  lensMeta: (typeof LENSES)[number];
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  summary: ReturnType<typeof summarize>;
  substrateCounts: TowerSubstrateCounts;
  towerToday: string;
}) {
  const rows = useMemo(
    () => lensRowsFor(activeLens, initiatives, vendors, summary, substrateCounts),
    [activeLens, initiatives, vendors, summary, substrateCounts],
  );
  const callouts = useMemo(
    () => lensCalloutsFor(activeLens, summary, substrateCounts),
    [activeLens, summary, substrateCounts],
  );
  const title: Record<LensKey, string> = {
    value_adoption: "Which AI investments are converting into value?",
    productivity: "Where did work get faster without quality drift?",
    agents: "Which agents are resolving work, not just creating usage?",
    spend: "Which spend should be scaled, challenged, or stopped?",
    risk: "Which claims are blocked by governance or weak evidence?",
    evidence: "What can Atlas answer from loaded context?",
    actions: "What should go to the next steering meeting?",
  };

  return (
    <section style={lensCanvasStyle} key={activeLens}>
      <section style={{ ...sectionStyle, marginTop: 0 }}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>{lensMeta.kicker} · Active canvas</div>
            <h2 style={sectionTitleStyle}>{title[activeLens]}</h2>
            <p style={sectionDeckStyle}>{lensMeta.question}</p>
          </div>
          <StatusPill tone="blue">{towerToday}</StatusPill>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["Subject", "Owner", "Metric", "Basis", "State"].map(
                  (head) => (
                    <th key={head} style={tableHeadStyle}>
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${activeLens}-${row.subject}-${index}`}>
                  <td style={tableCellStrongStyle}>{row.subject}</td>
                  <td style={tableCellStyle}>{row.owner}</td>
                  <td style={tableCellStyle}>{row.metric}</td>
                  <td style={tableCellStyle}>{row.basis}</td>
                  <td style={tableCellStyle}>
                    <StatusPill tone={row.tone}>{row.state}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside style={{ ...sectionStyle, marginTop: 0 }}>
        <div style={eyebrowStyle}>Decision read</div>
        <h2 style={sectionTitleStyle}>{lensMeta.shortLabel}</h2>
        <p style={sectionDeckStyle}>
          Atlas should answer this lens from loaded metrics, evidence status, and
          owner-linked portfolio records.
        </p>
        <div style={calloutGridStyle}>
          {callouts.map((callout) => (
            <div key={callout.label} style={calloutStyle}>
              <div style={eyebrowStyle}>{callout.label}</div>
              <div style={calloutValueStyle}>{callout.value}</div>
              <div style={calloutDetailStyle}>{callout.detail}</div>
              <div style={{ marginTop: 8 }}>
                <StatusPill tone={callout.tone}>
                  {callout.tone === "neutral" ? "read" : callout.tone}
                </StatusPill>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
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
          marginTop: 7,
        }}
      >
        <div
          style={{
            fontFamily: TOKENS.serif,
            fontSize: 22,
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
          marginTop: 7,
          color: TOKENS.muted,
          fontSize: 10,
          lineHeight: 1.25,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

export function AiControlTowerPage({
  tenantName,
  clientId,
  towerToday,
  initiatives,
  vendors,
  bandMetrics,
  substrateCounts,
}: AiControlTowerPageProps) {
  const [activeLens, setActiveLens] = useState<LensKey>("value_adoption");
  const [atlasMessages, setAtlasMessages] = useState<AtlasMessage[]>([]);
  const [atlasPending, setAtlasPending] = useState(false);
  const [atlasThreadId, setAtlasThreadId] = useState<string | null>(null);
  const [atlasSuggestions, setAtlasSuggestions] = useState<AtlasSuggestion[]>([
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
  ]);
  const summary = useMemo(
    () => summarize(initiatives, vendors),
    [initiatives, vendors],
  );
  const lensMeta = LENSES.find((item) => item.key === activeLens) ?? LENSES[0];
  const evidenceRows =
    substrateCounts.kpis +
    substrateCounts.decisions +
    substrateCounts.stakeholderNotes;

  const selectLens = (lens: LensKey) => {
    setActiveLens(lens);
  };

  const sendToAtlas = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;
      const userTurn: AtlasMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed || `Attached ${attachments.length} file${attachments.length === 1 ? "" : "s"}.`,
      };
      setAtlasMessages((prev) => [...prev, userTurn]);

      if (!clientId) {
        setAtlasMessages((prev) => [
          ...prev,
          {
            id: `atlas-no-tenant-${Date.now()}`,
            role: "atlas",
            content: "Atlas needs an active tenant to answer. Sign in to wake up the live response path.",
          },
        ]);
        return;
      }

      setAtlasPending(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 18_000);
      try {
        const res = await fetch("/api/v1/atlas/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            threadId: atlasThreadId,
            clientId,
            attachments: attachments.map((a) => ({ id: a.id, file_name: a.file_name, mime: a.mime })),
            surfaceContext: {
              surface: "ai-control-tower",
              clientId,
              tenantName,
              activeLens,
            },
          }),
          signal: controller.signal,
        });
        const json = (await res.json().catch(() => ({}))) as Partial<AtlasChatResponse>;
        if (!res.ok || !json.response || !json.threadId) {
          setAtlasMessages((prev) => [
            ...prev,
            {
              id: `atlas-error-${Date.now()}`,
              role: "atlas",
              content: "Atlas could not answer that right now. The Tower summary is still valid — retry or ask a different question.",
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
                ? "Atlas timed out. Retry the prompt or check back in a moment."
                : "Atlas could not reach the response path just now. Retry when ready.",
          },
        ]);
      } finally {
        window.clearTimeout(timeout);
        setAtlasPending(false);
      }
    },
    [activeLens, atlasThreadId, clientId, tenantName],
  );

  const onAtlasSubmit = sendToAtlas;

  const workspace = (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AI Control Tower · {tenantName}</div>
          <h1 style={heroTitleStyle}>AI Control Tower.</h1>
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
          detail={
            summary.spend > 0
              ? `${summary.renewal90} renewals inside 90 days`
              : "0 committed contract rows"
          }
          tone={summary.spend > 0 ? "amber" : "red"}
        />
        <MetricTile
          label="Evidence posture"
          value={String(evidenceRows)}
          detail={
            evidenceRows > 0
              ? "facts, decisions, notes tracked"
              : "no committed evidence rows"
          }
          tone={evidenceRows > 0 ? "green" : "red"}
        />
      </section>

      <nav aria-label="AI Control Tower lenses" style={tabBarStyle}>
        {LENSES.map((lens) => {
          const selected = lens.key === activeLens;
          return (
            <button
              key={lens.key}
              type="button"
              aria-pressed={selected}
              onClick={() => selectLens(lens.key)}
              style={{
                ...tabStyle,
                color: TOKENS.ink,
                background: selected ? "#fbfcff" : TOKENS.surface,
                borderColor: selected ? "#0b63ff" : TOKENS.rule,
                boxShadow: selected ? "inset 0 0 0 1px #0b63ff" : "none",
              }}
            >
              <span style={tabKickerStyle}>{lens.kicker}</span>
              <span style={tabLabelStyle}>{lens.label}</span>
            </button>
          );
        })}
      </nav>

      <LensCanvas
        activeLens={activeLens}
        lensMeta={lensMeta}
        initiatives={initiatives}
        vendors={vendors}
        summary={summary}
        substrateCounts={substrateCounts}
        towerToday={towerToday}
      />

      <div style={{ display: "none" }} aria-hidden="true">
        {bandMetrics.metrics.map((metric) => metric.key).join(",")}
      </div>
    </main>
  );

  return (
    <AtlasChatPanel
      messages={atlasMessages}
      pending={atlasPending}
      suggestions={atlasSuggestions}
      onSuggestion={(suggestion) => void sendToAtlas(suggestion.value, [])}
      onSubmit={onAtlasSubmit}
      workspace={workspace}
      surface="ai-control-tower"
      surfaceContext={{ surface: "ai-control-tower", activeLens, clientId }}
      initialQuote="Ask Atlas about value, adoption, productivity, agents, spend, risk, evidence, or actions."
      defaultLeftPercent={22}
      minLeftPx={260}
    />
  );
}

const pageStyle: CSSProperties = {
  minHeight: "calc(100vh - 64px)",
  background: TOKENS.bg,
  padding: "14px clamp(16px, 2.6vw, 28px) 24px",
  fontFamily: TOKENS.sans,
  color: TOKENS.ink,
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  paddingBottom: 10,
  borderBottom: `1px solid ${TOKENS.rule}`,
};

const heroTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: TOKENS.serif,
  fontSize: "clamp(22px, 2vw, 30px)",
  lineHeight: 0.98,
  fontWeight: 820,
  letterSpacing: 0,
  maxWidth: 760,
};

const heroQuestionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: TOKENS.muted,
  fontSize: 12,
  lineHeight: 1.25,
  maxWidth: 1040,
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const primaryButtonStyle: CSSProperties = {
  border: `1px solid ${TOKENS.navy}`,
  borderRadius: 6,
  background: TOKENS.navy,
  color: TOKENS.surface,
  padding: "7px 10px",
  fontSize: 11,
  fontWeight: 800,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  overflowX: "auto",
  padding: "10px 0 8px",
};

const tabStyle: CSSProperties = {
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 4,
  padding: "7px 10px 8px",
  display: "grid",
  gap: 2,
  minWidth: 86,
  textAlign: "center",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const tabKickerStyle: CSSProperties = {
  fontFamily: TOKENS.mono,
  fontSize: 8,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: TOKENS.muted,
  fontWeight: 800,
};

const tabLabelStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.15,
  fontWeight: 850,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
  gap: 8,
  marginTop: 10,
};

const metricTileStyle: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 6,
  padding: "9px 10px",
  minHeight: 70,
};

const lensCanvasStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.55fr) minmax(250px, 0.45fr)",
  gap: 10,
};

const sectionStyle: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 6,
  padding: 11,
  marginTop: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 9,
};

const eyebrowStyle: CSSProperties = {
  fontFamily: TOKENS.mono,
  fontSize: 8,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: TOKENS.muted,
  fontWeight: 800,
};

const sectionTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: TOKENS.serif,
  fontSize: 17,
  lineHeight: 1,
  fontWeight: 760,
  letterSpacing: 0,
};

const sectionDeckStyle: CSSProperties = {
  margin: "4px 0 0",
  color: TOKENS.muted,
  fontSize: 11,
  lineHeight: 1.25,
  maxWidth: 780,
};

const calloutGridStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  marginTop: 10,
};

const calloutStyle: CSSProperties = {
  border: `1px solid ${TOKENS.faint}`,
  borderRadius: 6,
  padding: 8,
  background: "#fbfcfa",
};

const calloutValueStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: TOKENS.serif,
  fontSize: 19,
  lineHeight: 1,
  fontWeight: 780,
  color: TOKENS.ink,
};

const calloutDetailStyle: CSSProperties = {
  marginTop: 4,
  color: TOKENS.muted,
  fontSize: 10,
  lineHeight: 1.25,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 700,
};

const tableHeadStyle: CSSProperties = {
  textAlign: "left",
  padding: "7px 6px",
  borderBottom: `1px solid ${TOKENS.rule}`,
  fontFamily: TOKENS.mono,
  fontSize: 8,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: TOKENS.muted,
};

const tableCellStyle: CSSProperties = {
  padding: "7px 6px",
  borderBottom: `1px solid ${TOKENS.faint}`,
  fontSize: 11,
  lineHeight: 1.25,
  color: TOKENS.ink,
};

const tableCellStrongStyle: CSSProperties = {
  ...tableCellStyle,
  fontWeight: 800,
};

"use client";

// ContextExploreTab · Explore tab (L1 entity-centric)
//
// Entity-type tab strip + segmented IT Systems table as default view.
// Other entity types show placeholder. Click row → inline expand.

import { useState } from "react";
import type {
  ContextEntitySummary,
  ContextReadModelResult,
} from "@/lib/intelligence/context-read-model";

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
  unknown: "#A39C90",
};

type HealthStatus = "loaded" | "attention" | "stale" | "review";

interface ItSystem {
  id?: string;
  nm: string;
  vendor: string;
  ver: string;
  users: number;
  contract: string;
  cost: string;
  health: HealthStatus;
  crit: string;
  owner: string;
  note: string;
  lifecycleState?: string;
  classificationSource?: string | null;
  sourceSystem?: string | null;
}

interface ItSegment {
  seg: string;
  systems: ItSystem[];
}

const IT_SEGMENTS: ItSegment[] = [
  {
    seg: "Data & Analytics",
    systems: [
      {
        nm: "Snowflake",
        vendor: "Snowflake Inc.",
        ver: "9.1",
        users: 220,
        contract: "Aug 2027",
        cost: "$0.82M",
        health: "loaded",
        crit: "Tier-1",
        owner: "CDO Office",
        note: "Primary data platform; feeds Tableau + dbt",
      },
      {
        nm: "Tableau",
        vendor: "Salesforce",
        ver: "2024.1",
        users: 310,
        contract: "Sep 2026",
        cost: "$0.41M",
        health: "attention",
        crit: "Tier-2",
        owner: "Data Platform",
        note: "Contract renewing Sep '26 — benchmark on file",
      },
      {
        nm: "Databricks",
        vendor: "Databricks Inc.",
        ver: "13.3 LTS",
        users: 44,
        contract: "Feb 2028",
        cost: "$0.61M",
        health: "loaded",
        crit: "Tier-2",
        owner: "Data Engineering",
        note: "ML / feature store; Copilot scoring pipeline",
      },
    ],
  },
  {
    seg: "ERP",
    systems: [
      {
        nm: "SAP S/4 HANA",
        vendor: "SAP SE",
        ver: "2023 FPS01",
        users: 580,
        contract: "Dec 2028",
        cost: "$2.1M",
        health: "loaded",
        crit: "Tier-1",
        owner: "Finance & Ops",
        note: "Core finance + procurement; 0 open P1 incidents",
      },
      {
        nm: "SAP Ariba",
        vendor: "SAP SE",
        ver: "2024 Q1",
        users: 190,
        contract: "Dec 2028",
        cost: "$0.38M",
        health: "loaded",
        crit: "Tier-2",
        owner: "Procurement",
        note: "Bundled under SAP EA — renewal with S/4",
      },
      {
        nm: "SAP Concur",
        vendor: "SAP SE",
        ver: "2024",
        users: 1200,
        contract: "Dec 2028",
        cost: "$0.22M",
        health: "loaded",
        crit: "Tier-3",
        owner: "Finance",
        note: "T&E; bundled renewal",
      },
    ],
  },
  {
    seg: "Digital / CX",
    systems: [
      {
        nm: "Salesforce CRM",
        vendor: "Salesforce",
        ver: "Spring '26",
        users: 420,
        contract: "Jan 2027",
        cost: "$0.91M",
        health: "attention",
        crit: "Tier-1",
        owner: "Commercial IT",
        note: "Loyalty + contact-centre integration in flight",
      },
      {
        nm: "ServiceNow",
        vendor: "ServiceNow",
        ver: "Xanadu",
        users: 850,
        contract: "Mar 2028",
        cost: "$1.4M",
        health: "stale",
        crit: "Tier-1",
        owner: "IT Operations",
        note: "⚠ Telemetry stale Apr 30 — MTTR insight degraded",
      },
      {
        nm: "Adobe Experience",
        vendor: "Adobe",
        ver: "2024",
        users: 35,
        contract: "Oct 2027",
        cost: "$0.27M",
        health: "loaded",
        crit: "Tier-2",
        owner: "Digital",
        note: "Web / marketing personalisation",
      },
    ],
  },
  {
    seg: "Operations (Airline)",
    systems: [
      {
        nm: "CrewSched",
        vendor: "Internal / SITA OEM",
        ver: "4.2",
        users: 2100,
        contract: "perpetual",
        cost: "$0.19M supp.",
        health: "attention",
        crit: "Tier-1",
        owner: "⚠ conflict — see insight",
        note: "Ownership conflict: Ops says M. Reyes; IT Org says D. Kahn",
      },
      {
        nm: "FlightLogic ODS",
        vendor: "NAVBLUE",
        ver: "21.4",
        users: 340,
        contract: "Jun 2027",
        cost: "$0.88M",
        health: "loaded",
        crit: "Tier-1",
        owner: "Flight Ops",
        note: "Operational data store; feeds crew + dispatch",
      },
      {
        nm: "ACARS Gateway",
        vendor: "ARINC / Collins",
        ver: "3.1",
        users: 18,
        contract: "Dec 2026",
        cost: "$0.31M",
        health: "loaded",
        crit: "Tier-1",
        owner: "Tech Ops",
        note: "Aircraft comms relay; contract approaching review",
      },
    ],
  },
  {
    seg: "Infrastructure & Cloud",
    systems: [
      {
        nm: "AWS (primary)",
        vendor: "Amazon",
        ver: "—",
        users: 280,
        contract: "on-demand",
        cost: "$3.2M",
        health: "loaded",
        crit: "Tier-1",
        owner: "Infra & Cloud",
        note: "Primary hyperscaler; multi-AZ us-east-1",
      },
      {
        nm: "Azure (DR / AI)",
        vendor: "Microsoft",
        ver: "—",
        users: 60,
        contract: "on-demand",
        cost: "$0.48M",
        health: "loaded",
        crit: "Tier-1",
        owner: "Infra & Cloud",
        note: "DR + OpenAI endpoints via Azure AI Foundry",
      },
      {
        nm: "VMware ESXi",
        vendor: "Broadcom",
        ver: "8.0",
        users: 8,
        contract: "Jun 2026",
        cost: "$0.29M",
        health: "attention",
        crit: "Tier-2",
        owner: "Infra & Cloud",
        note: "⚠ Contract Jun '26 — Broadcom licensing uplift risk",
      },
    ],
  },
  {
    seg: "Security & Identity",
    systems: [
      {
        nm: "CrowdStrike Falcon",
        vendor: "CrowdStrike",
        ver: "7.x",
        users: 1800,
        contract: "Nov 2026",
        cost: "$0.55M",
        health: "loaded",
        crit: "Tier-1",
        owner: "CISO",
        note: "Endpoint + cloud workload protection",
      },
      {
        nm: "Okta",
        vendor: "Okta",
        ver: "2024.2",
        users: 1800,
        contract: "Oct 2027",
        cost: "$0.33M",
        health: "loaded",
        crit: "Tier-1",
        owner: "CISO",
        note: "SSO + MFA; covers all SaaS + on-prem",
      },
      {
        nm: "Qualys VMDR",
        vendor: "Qualys",
        ver: "—",
        users: 18,
        contract: "Feb 2027",
        cost: "$0.18M",
        health: "loaded",
        crit: "Tier-2",
        owner: "Security Ops",
        note: "Vulnerability management + patch reporting",
      },
    ],
  },
];

const EXPLORE_VIEWS = [
  {
    key: "it-systems",
    label: "IT Systems",
    count: 142,
    dim: 3,
    dimName: "IT system landscape",
    dimStatus: "loaded" as HealthStatus,
  },
  {
    key: "ai-initiatives",
    label: "AI Initiatives",
    count: 38,
    dim: 6,
    dimName: "Program inventory",
    dimStatus: "loaded" as HealthStatus,
  },
  {
    key: "vendors",
    label: "Vendors & Contracts",
    count: 67,
    dim: 11,
    dimName: "Vendor & contract",
    dimStatus: "attention" as HealthStatus,
  },
  {
    key: "kpis",
    label: "KPIs",
    count: 24,
    dim: 5,
    dimName: "KPI dictionary",
    dimStatus: "loaded" as HealthStatus,
  },
  {
    key: "org",
    label: "Org & People",
    count: 186,
    dim: 2,
    dimName: "Org structure",
    dimStatus: "loaded" as HealthStatus,
  },
  {
    key: "evidence",
    label: "Evidence",
    count: 12,
    dim: 9,
    dimName: "Evidence ledger",
    dimStatus: "loaded" as HealthStatus,
  },
];

const DOMAIN_SEGMENT_LABELS: Record<string, string> = {
  DATA_ANALYTICS: "Data & Analytics",
  ERP: "ERP",
  DIGITAL_CX: "Digital / CX",
  OPERATIONS: "Operations",
  INFRASTRUCTURE: "Infrastructure & Cloud",
  SECURITY_IDENTITY: "Security & Identity",
  HR_WORKFORCE: "HR & Workforce",
  COLLABORATION: "Collaboration",
};

function segmentLabel(value: string | null): string {
  if (!value) return "Unsegmented";
  return DOMAIN_SEGMENT_LABELS[value] ?? value.replace(/_/g, " ");
}

function liveHealth(
  status: ContextEntitySummary["freshnessStatus"],
): HealthStatus {
  if (status === "fresh") return "loaded";
  if (status === "stale") return "stale";
  if (status === "review") return "review";
  return "attention";
}

function payloadText(
  payload: Record<string, unknown>,
  key: string,
  fallback = "—",
): string {
  const value = payload[key];
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatUsdLabel(raw: string): string {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return raw === "—" ? "—" : raw;
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value.toLocaleString()}`;
}

function classificationNote(source: string | null): string | null {
  if (source === "NEEDS_CLASSIFICATION") return "Needs steward review";
  if (source === "AUTO_INFERRED") return "Suggested by source pattern";
  if (source === "CMDB_FEED") return "Confirmed from CMDB feed";
  if (source === "OPERATOR_CONFIRMED") return "Confirmed by operator";
  return null;
}

function buildLiveSegments(rows: ContextEntitySummary[]): ItSegment[] {
  const groups = new Map<string, ItSystem[]>();
  for (const row of rows) {
    const segment = segmentLabel(row.domainSegment);
    const systems = groups.get(segment) ?? [];
    systems.push({
      id: row.recordId,
      nm: row.title,
      vendor: payloadText(row.payload, "vendor_name"),
      ver: payloadText(row.payload, "hosting_model"),
      users: Number(payloadText(row.payload, "active_users", "0")) || 0,
      contract: payloadText(row.payload, "contract_end_date"),
      cost: formatUsdLabel(payloadText(row.payload, "annual_cost_usd")),
      health: liveHealth(row.freshnessStatus),
      crit: row.criticality ?? "Unrated",
      owner: row.owner ?? "Unassigned",
      note:
        [
          row.businessFunction ? `Function: ${row.businessFunction}` : null,
          classificationNote(row.classificationSource),
          row.sourceSystem ? `Source: ${row.sourceSystem}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "No context note captured yet.",
      lifecycleState: row.lifecycleState,
      classificationSource: row.classificationSource,
      sourceSystem: row.sourceSystem,
    });
    groups.set(segment, systems);
  }
  return Array.from(groups.entries()).map(([seg, systems]) => ({
    seg,
    systems,
  }));
}

function healthColor(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    loaded: C.fresh,
    attention: C.attention,
    stale: C.stale,
    review: C.review,
  };
  return map[status];
}

function grndChipStyle(status: HealthStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 20,
    whiteSpace: "nowrap" as const,
    fontWeight: 500,
    display: "inline-block",
  };
  if (status === "loaded")
    return {
      ...base,
      background: C.freshBg,
      color: C.fresh,
      border: `1px solid ${C.fresh}33`,
    };
  if (status === "attention")
    return {
      ...base,
      background: C.attentionBg,
      color: C.attention,
      border: `1px solid ${C.attention}33`,
    };
  return {
    ...base,
    background: C.staleBg,
    color: C.stale,
    border: `1px solid ${C.stale}33`,
  };
}

function isNearExpiry(contract: string): boolean {
  return (
    contract.includes("2026") &&
    contract !== "perpetual" &&
    contract !== "on-demand"
  );
}

interface SystemExpandedRowProps {
  system: ItSystem;
  dim: number;
  dimName: string;
}

function SystemExpandedRow({ system, dim, dimName }: SystemExpandedRowProps) {
  const near = isNearExpiry(system.contract);
  const hcolor = healthColor(system.health);
  const insightLink =
    system.nm === "ServiceNow"
      ? {
          text: "⚠ MTTR worsening insight uses this system — telemetry stale Apr 30",
          color: C.stale,
          bg: C.staleBg,
        }
      : system.nm === "CrewSched"
        ? {
            text: "⚠ Ownership conflict — stewardship task open",
            color: C.attention,
            bg: C.attentionBg,
          }
        : null;

  return (
    <tr>
      <td
        colSpan={8}
        style={{
          padding: "14px 16px 16px",
          borderBottom: `1px solid ${C.line2}`,
          verticalAlign: "top",
          background: "#FAFAF6",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 18,
          }}
        >
          {/* System facts */}
          <div>
            <strong
              style={{
                fontSize: 11.5,
                display: "block",
                marginBottom: 7,
                color: C.muted,
                textTransform: "uppercase" as const,
                letterSpacing: "0.4px",
                fontWeight: 600,
              }}
            >
              System facts
            </strong>
            {[
              ["Version", system.ver],
              ["Users", system.users.toLocaleString()],
              ["Criticality", system.crit],
              ["Owner", system.owner],
              ["Contract", system.contract],
              ["Cost / yr", system.cost],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  fontSize: 12.5,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderTop: `1px solid ${C.line2}`,
                }}
              >
                <span style={{ color: C.muted }}>{k}</span>
                <span
                  style={{
                    fontWeight: k === "Contract" && near ? 600 : 400,
                    color: k === "Contract" && near ? C.attention : "inherit",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Context note */}
          <div>
            <strong
              style={{
                fontSize: 11.5,
                display: "block",
                marginBottom: 7,
                color: C.muted,
                textTransform: "uppercase" as const,
                letterSpacing: "0.4px",
                fontWeight: 600,
              }}
            >
              Context note
            </strong>
            <p
              style={{
                fontSize: 12.5,
                color: C.muted,
                margin: "4px 0 12px",
                lineHeight: 1.5,
              }}
            >
              {system.note}
            </p>
            <div
              style={{
                fontSize: 12.5,
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderTop: `1px solid ${C.line2}`,
              }}
            >
              <span style={{ color: C.muted }}>Data freshness</span>
              <span
                style={{
                  fontSize: 10.5,
                  padding: "2px 7px",
                  borderRadius: 20,
                  background:
                    system.health === "loaded"
                      ? C.freshBg
                      : system.health === "attention"
                        ? C.attentionBg
                        : C.staleBg,
                  color: hcolor,
                }}
              >
                {system.health}
              </span>
            </div>
            <div
              style={{
                fontSize: 12.5,
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderTop: `1px solid ${C.line2}`,
              }}
            >
              <span style={{ color: C.muted }}>Source</span>
              <span style={{ color: C.muted }}>
                Dim {dim} · {dimName}
              </span>
            </div>
          </div>

          {/* Linked insights */}
          <div>
            <strong
              style={{
                fontSize: 11.5,
                display: "block",
                marginBottom: 7,
                color: C.muted,
                textTransform: "uppercase" as const,
                letterSpacing: "0.4px",
                fontWeight: 600,
              }}
            >
              Linked insights &amp; actions
            </strong>
            {insightLink ? (
              <div
                style={{
                  fontSize: 12,
                  margin: "4px 0 8px",
                  padding: "7px 9px",
                  borderRadius: 5,
                  background: insightLink.bg,
                  color: insightLink.color,
                }}
              >
                {insightLink.text}
              </div>
            ) : (
              <div
                style={{ fontSize: 12, color: C.muted, margin: "4px 0 8px" }}
              >
                No active insights linked to this system.
              </div>
            )}
            <button
              type="button"
              style={{
                border: `1px solid ${C.ink}`,
                background: "none",
                color: C.ink,
                borderRadius: 7,
                padding: "5px 10px",
                fontSize: 11.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Ask Ava about {system.nm} →
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

import React from "react";

interface Props {
  initialEntityName?: string | null;
  contextSummary?: ContextReadModelResult | null;
}

export function ContextExploreTab({
  initialEntityName,
  contextSummary,
}: Props) {
  const [activeView, setActiveView] = useState("it-systems");
  const [activeSeg, setActiveSeg] = useState("all");
  const liveSegments = contextSummary?.entitySummaries.length
    ? buildLiveSegments(contextSummary.entitySummaries)
    : [];
  const sourceSegments = liveSegments.length > 0 ? liveSegments : IT_SEGMENTS;
  const liveSystemCount = sourceSegments.reduce(
    (count, segment) => count + segment.systems.length,
    0,
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    initialEntityName
      ? (() => {
          for (const seg of sourceSegments) {
            const idx = seg.systems.findIndex(
              (s) => s.nm === initialEntityName,
            );
            if (idx >= 0) return `${seg.seg.replace(/[\s/&]+/g, "-")}-${idx}`;
          }
          return null;
        })()
      : null,
  );

  const views = EXPLORE_VIEWS.map((view) =>
    view.key === "it-systems" ? { ...view, count: liveSystemCount } : view,
  );
  const currentView = views.find((v) => v.key === activeView) ?? views[0];
  const segs = sourceSegments.map((s) => s.seg);
  const filtered =
    activeSeg === "all"
      ? sourceSegments
      : sourceSegments.filter((s) => s.seg === activeSeg);

  const handleRowClick = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const dimSt = currentView.dimStatus;

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
        Explore the facts
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 12.5,
          margin: "0 0 14px",
          maxWidth: 720,
        }}
      >
        Facts from the context — segmented by domain, not by file. Click any row
        to expand details.
      </p>

      {/* Entity-type tab strip */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap" as const,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => {
              setActiveView(v.key);
              setActiveSeg("all");
              setExpandedId(null);
            }}
            style={{
              fontSize: 12,
              padding: "5px 13px",
              border: `1px solid ${activeView === v.key ? C.ink : C.line}`,
              borderRadius: 20,
              background: activeView === v.key ? C.ink : "#fff",
              color: activeView === v.key ? "#fff" : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "0.1s",
            }}
          >
            {v.label} <span style={{ opacity: 0.55 }}>{v.count}</span>
          </button>
        ))}
      </div>

      {activeView === "it-systems" ? (
        <>
          {/* Segment filter + grounded chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
              <button
                type="button"
                onClick={() => {
                  setActiveSeg("all");
                  setExpandedId(null);
                }}
                style={{
                  fontSize: 11,
                  padding: "3px 9px",
                  border: `1px solid ${activeSeg === "all" ? C.ink : C.line}`,
                  borderRadius: 20,
                  background: activeSeg === "all" ? C.ink : "#fff",
                  color: activeSeg === "all" ? "#fff" : C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                All segments
              </button>
              {segs.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setActiveSeg(s);
                    setExpandedId(null);
                  }}
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    border: `1px solid ${activeSeg === s ? C.ink : C.line}`,
                    borderRadius: 20,
                    background: activeSeg === s ? C.ink : "#fff",
                    color: activeSeg === s ? "#fff" : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <span style={grndChipStyle(dimSt)}>
              Dim 3 · IT System Landscape · {liveSystemCount} records · {dimSt}
            </span>
          </div>

          {/* Segmented table */}
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12.5,
              }}
            >
              <thead>
                <tr>
                  {[
                    "System",
                    "Vendor",
                    "Segment",
                    "Users",
                    "Status",
                    "Contract end",
                    "Cost / yr",
                    "Health",
                  ].map((h) => (
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
                {filtered.map((seg) => {
                  const rows: React.ReactElement[] = [];
                  // Segment header row
                  rows.push(
                    <tr key={`seg-${seg.seg}`}>
                      <td
                        colSpan={8}
                        style={{
                          background: C.chip,
                          fontSize: 9.5,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.7px",
                          color: C.muted,
                          fontWeight: 700,
                          padding: "6px 10px",
                          borderTop: `2px solid ${C.line}`,
                          borderBottom: `1px solid ${C.line}`,
                        }}
                      >
                        {seg.seg}
                      </td>
                    </tr>,
                  );
                  // Data rows
                  seg.systems.forEach((s, i) => {
                    const rowId = `${seg.seg.replace(/[\s/&]+/g, "-")}-${i}`;
                    const isExp = expandedId === rowId;
                    const near = isNearExpiry(s.contract);
                    const hcolor = healthColor(s.health);
                    rows.push(
                      <tr
                        key={`row-${rowId}`}
                        onClick={() => handleRowClick(rowId)}
                        style={{
                          cursor: "pointer",
                          background: isExp ? "#fffdf8" : "transparent",
                        }}
                      >
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                          }}
                        >
                          <strong>{s.nm}</strong>
                          <br />
                          <span style={{ fontSize: 10.5, color: C.muted }}>
                            {s.crit} · {s.owner}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                            fontSize: 12.5,
                          }}
                        >
                          {s.vendor}
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
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
                            {seg.seg}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: 12.5,
                          }}
                        >
                          {s.users.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: "2px 7px",
                              borderRadius: 20,
                              background: C.freshBg,
                              color: C.fresh,
                            }}
                          >
                            Active
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: 12.5,
                            color: near
                              ? C.attention
                              : s.contract === "perpetual"
                                ? C.muted
                                : C.ink,
                          }}
                        >
                          {s.contract}
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          <strong>{s.cost}</strong>
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.line2}`,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: hcolor,
                              display: "inline-block",
                              verticalAlign: "middle",
                              marginRight: 6,
                            }}
                          />
                          <span style={{ fontSize: 11, color: C.muted }}>
                            {s.health}
                          </span>
                        </td>
                      </tr>,
                    );
                    // Expanded detail row
                    if (isExp) {
                      rows.push(
                        <SystemExpandedRow
                          key={`exp-${rowId}`}
                          system={s}
                          dim={currentView.dim}
                          dimName={currentView.dimName}
                        />,
                      );
                    }
                  });
                  return rows;
                })}
              </tbody>
            </table>
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 9,
              textAlign: "right",
            }}
          >
            Showing {filtered.reduce((n, s) => n + s.systems.length, 0)} of{" "}
            {liveSystemCount} systems · click any row to expand
          </div>
        </>
      ) : (
        /* Placeholder for other entity types */
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12.5, color: C.muted }}>
              Segmented table — same pattern as IT Systems
            </span>
            <span style={grndChipStyle(currentView.dimStatus)}>
              Dim {currentView.dim} · {currentView.dimName} ·{" "}
              {currentView.count} records · {currentView.dimStatus}
            </span>
          </div>
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: "28px 20px",
              textAlign: "center",
              color: C.muted,
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 18,
                marginBottom: 8,
                color: C.ink,
              }}
            >
              {currentView.label}
            </div>
            <div style={{ fontSize: 12.5, maxWidth: 460, margin: "0 auto" }}>
              Tabular view — segmented by domain, same pattern as IT Systems.
              Columns and segments are dimension-specific in the live build. Ask
              Ava to explore, or switch to IT Systems to see a full
              example.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

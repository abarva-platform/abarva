"use client";

import { useMemo, useState } from "react";

import type { ArchitectureView, ArchitectureViewNode } from "@/lib/visual-system/architecture-view-contract";
import { resolveArchitectureView } from "@/lib/visual-system/resolveArchitectureView";
import type { TechRecordType } from "@/lib/home/preview/types";
import { ArchitectureRefusal } from "./ArchitectureRefusal";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The estate as a portfolio board, rendered from a validated ArchitectureView. Semantics come from
 * the shared resolver; this file only chooses the reading profile. A rectangle treemap made the
 * largest function truthful but visually useless, so the L0 view uses ranked rows plus a detail
 * pane: the same concentration is visible without turning whitespace into the dominant artifact.
 */

const HATCH_SOFT = "repeating-linear-gradient(135deg,rgba(12,26,58,0.09) 0 7px,rgba(12,26,58,0.03) 7px 14px)";

export function ArchitecturePage({
  tenantKey,
  tenantDisplayName,
  applications,
  integrations,
  infrastructure,
  canonicalBuild,
}: {
  tenantKey: string;
  tenantDisplayName: string;
  applications: TechRecordType;
  integrations?: TechRecordType;
  infrastructure?: TechRecordType;
  canonicalBuild?: string;
}) {
  const [capability, setCapability] = useState<string | null>(null);

  const result = useMemo(
    () =>
      resolveArchitectureView({
        format: "executive_landscape",
        tenantKey,
        tenantDisplayName,
        applications,
        capability,
        canonicalBuild,
      }),
    [capability, tenantKey, tenantDisplayName, applications, canonicalBuild],
  );
  if (result.status === "refused") {
    return <ArchitectureRefusal refusal={result.refusal} />;
  }
  const view: ArchitectureView = result.view;
  const architectureTitle = capability
    ? view.title
    : `Current-state architecture map for ${tenantDisplayName}`;
  const architectureQuestion = capability
    ? view.primaryQuestion
    : "How do business capabilities, applications, data movement, and platforms fit together today?";

  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ padding: `46px ${PAGE_X}px 0` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.blue)}>
            {capability ? "Logical architecture · one capability" : "Current-state architecture · whole estate"}
          </span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: V4.slate, letterSpacing: "-0.01em" }}>
            {architectureQuestion}
          </span>
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: "clamp(28px,2.5vw,40px)",
            lineHeight: 1.14,
            letterSpacing: "-0.027em",
            margin: "16px 0 0",
            maxWidth: "36ch",
            textWrap: "balance",
          }}
        >
          {architectureTitle}
        </h1>
        {view.contextLine ? (
          <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
            {view.contextLine}
          </p>
        ) : null}
        {capability ? (
          <button
            type="button"
            onClick={() => setCapability(null)}
            style={{
              marginTop: 18,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              border: "1px solid rgba(0,102,204,0.35)",
              borderRadius: 999,
              padding: "7px 13px",
              background: "transparent",
              color: V4.blue,
              cursor: "pointer",
            }}
          >
            ← Whole estate
          </button>
        ) : null}
      </header>

      {capability ? (
        <L2Capability view={view} capability={capability} />
      ) : (
        <L0Landscape
          applications={applications}
          integrations={integrations}
          infrastructure={infrastructure}
          onDrill={setCapability}
        />
      )}

      {view.limitations.length > 0 ? (
        <div style={{ padding: `0 ${PAGE_X}px`, margin: "30px 0 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(19px,1.6vw,24px)",
                fontWeight: 500,
                letterSpacing: "-0.022em",
                margin: 0,
                color: V4.amber,
              }}
            >
              What this drawing does not establish
            </h2>
            <span style={{ flex: 1, height: 1, background: "rgba(186,117,23,0.35)" }} />
          </div>
          <ul
            style={{
              margin: "14px 0 0",
              paddingLeft: 20,
              fontFamily: SANS,
              fontSize: 14.5,
              lineHeight: 1.7,
              color: V4.inkSoft,
              maxWidth: "82ch",
            }}
          >
            {view.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ── L0 · current-state architecture map ─────────────────────────────────────────────────── */

type ApplicationRecord = Record<string, unknown>;
type IntegrationRecord = Record<string, unknown>;
type InfrastructureRecord = Record<string, unknown>;

interface ArchitectureSlice {
  name: string;
  applications: ApplicationRecord[];
  integrations: IntegrationRecord[];
  infrastructure: InfrastructureRecord[];
  count: number;
  share: number;
  tier1: number;
  watch: number;
  replace: number;
  aging: number;
  spend: number;
  regulatedFlows: number;
  qualityWatch: number;
  appCategories: Array<[string, number]>;
  appPlatforms: Array<[string, number]>;
  integrationTypes: Array<[string, number]>;
  dataDomains: Array<[string, number]>;
  dataPlatforms: Array<[string, number]>;
  destinations: Array<[string, number]>;
  hostingModels: Array<[string, number]>;
  infrastructureTypes: Array<[string, number]>;
}

function L0Landscape({
  applications,
  integrations,
  infrastructure,
  onDrill,
}: {
  applications: TechRecordType;
  integrations?: TechRecordType;
  infrastructure?: TechRecordType;
  onDrill: (capability: string) => void;
}) {
  const rows = useMemo(() => (applications.rows ?? []) as ApplicationRecord[], [applications.rows]);
  const integrationRows = useMemo(() => (integrations?.rows ?? []) as IntegrationRecord[], [integrations?.rows]);
  const infrastructureRows = useMemo(() => (infrastructure?.rows ?? []) as InfrastructureRecord[], [infrastructure?.rows]);
  const slices = useMemo(
    () => buildArchitectureSlices(rows, integrationRows, infrastructureRows),
    [rows, integrationRows, infrastructureRows],
  );
  const [selectedName, setSelectedName] = useState<string>("Whole estate");
  const selected = slices.find((slice) => slice.name === selectedName) ?? slices[0];
  const wholeEstate = slices[0];

  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <style>{`
        @media (max-width: 1180px) {
          [data-arch-layout] { grid-template-columns: 1fr !important; }
          [data-arch-side] { position: static !important; }
        }
        @media (max-width: 980px) {
          [data-arch-map] { grid-template-columns: 1fr !important; }
          [data-arch-arrow] { display: none !important; }
        }
        @media (max-width: 760px) {
          [data-arch-metrics] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          margin: "34px 0 0",
          paddingBottom: 16,
          borderBottom: `1px solid ${V4.rule}`,
        }}
      >
        <span style={eyebrow(V4.slate)}>Current-state architecture map</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.stone }}>
          BUSINESS · APPLICATIONS · INTEGRATION · DATA · PLATFORMS
        </span>
      </div>

      <div
        data-arch-metrics
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,minmax(0,1fr))",
          gap: "1px",
          marginTop: 18,
          border: `1px solid ${V4.rule}`,
          background: V4.rule,
        }}
      >
        <ArchitectureMetric value={wholeEstate.count.toLocaleString()} label="applications" />
        <ArchitectureMetric value={(slices.length - 1).toLocaleString()} label="business capabilities" />
        <ArchitectureMetric value={wholeEstate.integrations.length.toLocaleString()} label="data movements" />
        <ArchitectureMetric value={wholeEstate.infrastructure.length.toLocaleString()} label="platforms" />
        <ArchitectureMetric value={moneyShort(wholeEstate.spend)} label="annual cost" />
      </div>

      <div
        data-arch-layout
        style={{
          display: "grid",
          gridTemplateColumns: "300px minmax(0,1fr)",
          gap: "clamp(18px,2.5vw,34px)",
          alignItems: "start",
          marginTop: 22,
        }}
      >
        <section style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.slate)}>Architecture scope</span>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {slices.map((slice, index) => (
              <ScopeButton
                key={slice.name}
                slice={slice}
                rank={index}
                active={selected?.name === slice.name}
                onClick={() => setSelectedName(slice.name)}
              />
            ))}
          </div>
        </section>

        {selected ? (
          <ArchitectureMap slice={selected} onDrill={onDrill} />
        ) : null}
      </div>
    </div>
  );
}

function ScopeButton({
  slice,
  rank,
  active,
  onClick,
}: {
  slice: ArchitectureSlice;
  rank: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "grid",
        gridTemplateColumns: "28px minmax(0,1fr) 48px",
        gap: 9,
        alignItems: "center",
        border: `1px solid ${active ? "rgba(0,102,204,0.45)" : V4.rule}`,
        borderRadius: 7,
        background: active ? "rgba(0,102,204,0.06)" : V4.surface,
        padding: "9px 10px",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>{rank === 0 ? "ALL" : rank}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 650, color: V4.ink, lineHeight: 1.24, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {slice.name}
        </span>
        <span style={{ display: "block", marginTop: 4, fontFamily: MONO, fontSize: 10.5, color: V4.slate }}>
          {rank === 0
            ? `${slice.integrations.length} flows · ${slice.infrastructure.length} platforms`
            : `${slice.integrations.length} flows · platform joins unproven`}
        </span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: V4.ink, textAlign: "right" }}>{slice.count}</span>
    </button>
  );
}

function ArchitectureMap({ slice, onDrill }: { slice: ArchitectureSlice; onDrill: (capability: string) => void }) {
  const isWholeEstate = slice.name === "Whole estate";
  return (
    <section style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, marginBottom: 10 }}>
        <span style={eyebrow(V4.blue)}>{slice.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
          {slice.count} applications · {slice.integrations.length} flows · {slice.infrastructure.length} platforms
        </span>
      </div>

      <div
        data-arch-map
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 34px 1fr 34px 1fr 34px 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        <ArchitectureLane
          tone={V4.blue}
          label="Business capability"
          title={isWholeEstate ? "Enterprise capability portfolio" : slice.name}
          meta={isWholeEstate ? `${Math.max(0, slice.appCategories.length)} dominant families` : `${slice.share.toFixed(1)}% of estate`}
          items={isWholeEstate ? slice.appCategories.slice(0, 6) : [["application scope", slice.count], ["tier-1 systems", slice.tier1], ["watch items", slice.watch]]}
        />
        <MapArrow label="supports" />
        <ArchitectureLane
          tone={V4.navy}
          label="Applications & core systems"
          title={`${slice.count.toLocaleString()} recorded systems`}
          meta={`${slice.tier1.toLocaleString()} tier-1 · ${slice.replace.toLocaleString()} replacement candidates`}
          items={slice.appPlatforms.slice(0, 6)}
        />
        <MapArrow label="moves data" />
        <ArchitectureLane
          tone={V4.green}
          label="Integration & data"
          title={`${slice.integrations.length.toLocaleString()} recorded flows/assets`}
          meta={`${slice.regulatedFlows.toLocaleString()} regulated · ${slice.qualityWatch.toLocaleString()} quality watch`}
          items={slice.integrationTypes.length ? slice.integrationTypes.slice(0, 4) : slice.dataDomains.slice(0, 4)}
        />
        <MapArrow label="runs on" />
        <ArchitectureLane
          tone={V4.amber}
          label="Platforms & hosting"
          title={
            slice.infrastructure.length
              ? `${slice.infrastructure.length.toLocaleString()} platform records`
              : "Platform joins are not recorded for this scope"
          }
          meta={slice.hostingModels.map(([name, count]) => `${name} ${count}`).slice(0, 2).join(" · ") || "hosting relationship missing"}
          items={slice.infrastructureTypes.length ? slice.infrastructureTypes.slice(0, 4) : slice.hostingModels.slice(0, 4)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <EvidencePanel
          title="Data paths"
          detail="Source-to-target movements from the integration record"
          items={slice.destinations.slice(0, 5)}
        />
        <EvidencePanel
          title="Data domains"
          detail="Domains crossing this architecture scope"
          items={slice.dataDomains.slice(0, 5)}
        />
        <EvidencePanel
          title="Architecture constraints"
          detail="What needs attention inside this scope"
          items={[
            ["lifecycle watch", slice.watch],
            ["replacement candidates", slice.replace],
            ["quality watch", slice.qualityWatch],
            ["regulated flows", slice.regulatedFlows],
          ]}
        />
      </div>

      {!isWholeEstate ? (
        <button
          type="button"
          onClick={() => onDrill(slice.name)}
          style={{
            marginTop: 16,
            border: `1px solid ${V4.blue}`,
            borderRadius: 7,
            background: V4.surface,
            color: V4.blue,
            padding: "10px 12px",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Open capability dependency detail
        </button>
      ) : null}

      <div
        style={{
          marginTop: 18,
          border: `1px solid rgba(186,117,23,0.35)`,
          borderLeft: `3px solid ${V4.amber}`,
          borderRadius: 8,
          background: "rgba(186,117,23,0.045)",
          padding: "14px 16px",
        }}
      >
        <span style={eyebrow(V4.amber)}>Architecture evidence boundary</span>
        <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: V4.inkSoft }}>
          This map uses recorded application, integration, and infrastructure fields. It does not claim
          confirmed runtime dependency direction, deployment topology, network zones, or system-to-platform
          hosting joins where those relationships are not recorded.
        </p>
      </div>
    </section>
  );
}

function ArchitectureLane({
  tone,
  label,
  title,
  meta,
  items,
}: {
  tone: string;
  label: string;
  title: string;
  meta: string;
  items: Array<[string, number]>;
}) {
  const max = Math.max(1, ...items.map(([, count]) => count));
  return (
    <article
      style={{
        minWidth: 0,
        border: `1px solid ${V4.ruleStrong}`,
        borderTop: `4px solid ${tone}`,
        borderRadius: 8,
        background: V4.surface,
        padding: "15px 16px",
      }}
    >
      <span style={eyebrow(tone)}>{label}</span>
      <h2
        style={{
          margin: "10px 0 0",
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
          color: V4.ink,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: "8px 0 0", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.04em", color: V4.slate }}>
        {meta}
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {items.slice(0, 6).map(([name, count]) => (
          <div key={name} style={{ minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 34px", gap: 10, alignItems: "baseline" }}>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: V4.ink, textAlign: "right" }}>{count}</span>
            </div>
            <span style={{ display: "block", height: 4, borderRadius: 99, background: V4.cream, overflow: "hidden", marginTop: 4 }}>
              <span style={{ display: "block", width: `${Math.max(5, (count / max) * 100)}%`, height: "100%", background: tone }} />
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MapArrow({ label }: { label: string }) {
  return (
    <div
      data-arch-arrow
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: V4.slate,
      }}
    >
      <span style={{ width: 22, height: 1, background: V4.ruleStrong }} />
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.07em", textTransform: "uppercase", writingMode: "vertical-rl" }}>
        {label}
      </span>
    </div>
  );
}

function EvidencePanel({ title, detail, items }: { title: string; detail: string; items: Array<[string, number]> }) {
  return (
    <article style={{ border: `1px solid ${V4.rule}`, borderRadius: 8, background: V4.surface, padding: "14px 15px" }}>
      <span style={eyebrow(V4.slate)}>{title}</span>
      <p style={{ margin: "7px 0 12px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.slate }}>{detail}</p>
      <div style={{ display: "grid", gap: 7 }}>
        {items.filter(([, count]) => count > 0).slice(0, 5).map(([name, count]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${V4.rule}`, paddingTop: 7 }}>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.ink }}>{count}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function buildArchitectureSlices(
  rows: ApplicationRecord[],
  integrations: IntegrationRecord[],
  infrastructure: InfrastructureRecord[],
): ArchitectureSlice[] {
  const groups = new Map<string, ApplicationRecord[]>();
  for (const row of rows) {
    const key = text(row, "businessFunction") || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const total = Math.max(1, rows.length);
  const slices = [...groups.entries()]
    .map(([name, groupRows]) => buildSlice(name, groupRows, integrationsForApps(integrations, groupRows), [], total))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return [buildSlice("Whole estate", rows, integrations, infrastructure, total), ...slices];
}

function buildSlice(
  name: string,
  appRows: ApplicationRecord[],
  integrations: IntegrationRecord[],
  infrastructure: InfrastructureRecord[],
  estateTotal: number,
): ArchitectureSlice {
  const aging = appRows.filter((row) =>
    ["legacy_stable", "sunset_planned", "deprecated"].includes(text(row, "lifecycleState")),
  ).length;
  const replace = appRows.filter((row) => text(row, "replacementCandidate").toLowerCase() === "yes").length;
  const qualityWatch = integrations.filter((row) =>
    ["developing_governance", "needs_remediation", "unknown"].includes(text(row, "qualityStatus").toLowerCase()),
  ).length;

  return {
    name,
    applications: appRows,
    integrations,
    infrastructure,
    count: appRows.length,
    share: name === "Whole estate" ? 100 : (appRows.length / Math.max(1, estateTotal)) * 100,
    tier1: appRows.filter((row) => text(row, "criticality").toLowerCase() === "tier1").length,
    watch: aging + replace,
    replace,
    aging,
    spend: appRows.reduce((sum, row) => sum + numeric(row.annualCostUsd), 0),
    regulatedFlows: integrations.filter((row) => text(row, "regulatedDataFlag").toLowerCase() === "true").length,
    qualityWatch,
    appCategories: topCounts(appRows, "systemCategory").slice(0, 8),
    appPlatforms: topCounts(appRows, "deploymentModel").slice(0, 8),
    integrationTypes: topCounts(integrations, "integrationType").slice(0, 8),
    dataDomains: topCounts(integrations, "dataDomain").slice(0, 8),
    dataPlatforms: topCounts(integrations, "platformOrDatabase").slice(0, 8),
    destinations: topCounts(integrations, "targetSystem").slice(0, 8),
    hostingModels: topCounts(infrastructure, "hostingModel").slice(0, 8),
    infrastructureTypes: topCounts(infrastructure, "platformType").slice(0, 8),
  };
}

function integrationsForApps(integrations: IntegrationRecord[], appRows: ApplicationRecord[]): IntegrationRecord[] {
  const systems = new Set(appRows.flatMap((row) => [text(row, "systemName")]).filter(Boolean));
  if (!systems.size) {
    return [];
  }
  return integrations.filter((row) => systems.has(text(row, "sourceSystem")) || systems.has(text(row, "targetSystem")));
}

function topCounts(rows: ApplicationRecord[], field: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = text(row, field) || "Not specified";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function text(row: ApplicationRecord, field: string): string {
  const value = row[field];
  if (value === null || value === undefined) return "";
  return String(value);
}

function numeric(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function moneyShort(value: number): string {
  if (!value) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function ArchitectureMetric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: V4.surface, padding: "13px 15px", minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: SERIF,
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: V4.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 7,
          fontFamily: SANS,
          fontSize: 12,
          lineHeight: 1.35,
          color: V4.slate,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={label}
      >
        {label}
      </span>
    </div>
  );
}

/* ── L2 · one capability, relationship declared once ─────────────────────────────────────── */

function L2Capability({ view, capability }: { view: ArchitectureView; capability: string }) {
  const capabilityNode = view.nodes.find((n) => n.semanticRole === "business_capability");
  const supporting = view.nodes.filter((n) => n.id !== capabilityNode?.id);
  const maxSystems = Math.max(1, ...supporting.map(systemsOf));

  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <div
        style={{
          margin: "34px 0 0",
          background: V4.surface,
          border: `1px solid ${V4.rule}`,
          borderRadius: 10,
          padding: "30px 32px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.blue)}>Logical architecture · one capability</span>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: V4.slate }}>
            {view.edges.length} RELATIONSHIPS · DECLARED ONCE
          </span>
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              border: `1px solid ${V4.navy}`,
              background: HATCH_SOFT,
              borderRadius: 8,
              padding: "18px 26px",
              textAlign: "center",
              maxWidth: "44ch",
            }}
          >
            <div style={{ ...eyebrow(V4.slate), letterSpacing: "0.1em" }}>
              Group of {capabilityNode ? systemsOf(capabilityNode) : 0}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, letterSpacing: "-0.024em", lineHeight: 1.2, marginTop: 7 }}>
              {capability}
            </div>
            {capabilityNode?.note ? (
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate, marginTop: 8 }}>
                {capabilityNode.note}
              </div>
            ) : null}
          </div>

          {/* The fan-in rule: one declared relationship, not N identical labels. */}
          <div style={{ width: 1, height: 20, background: "rgba(12,26,58,0.45)" }} />
          <div style={{ border: "1px solid rgba(12,26,58,0.45)", borderRadius: 999, padding: "6px 14px", background: V4.paper }}>
            <span style={{ ...eyebrow(V4.navy), letterSpacing: "0.11em" }}>Supported by {supporting.length} groups</span>
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(12,26,58,0.45)" }} />
          <div style={{ width: "100%", height: 1, background: "rgba(12,26,58,0.3)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,188px),1fr))", gap: 10, marginTop: 18 }}>
          {supporting.map((node) => {
            const systems = systemsOf(node);
            const isGroup = Boolean(node.aggregation);
            return (
              <div
                key={node.id}
                style={{
                  border: `1px solid ${isGroup ? V4.ruleStrong : V4.navy}`,
                  borderRadius: 8,
                  background: isGroup ? V4.cream : V4.surface,
                  padding: "13px 14px",
                }}
              >
                <span style={{ display: "block", width: 1, height: 14, background: "rgba(12,26,58,0.3)", margin: "-27px auto 13px" }} />
                <span style={{ display: "block", fontFamily: SANS, fontSize: 13.5, fontWeight: 500, lineHeight: 1.35, color: V4.ink }}>
                  {node.label}
                </span>
                <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 9 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: V4.slate }}>
                    {isGroup ? `${systems} systems` : "1 record"}
                  </span>
                  {typeof node.metrics?.distinctVendors === "number" ? (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: V4.stone }}>{node.metrics.distinctVendors}v</span>
                  ) : null}
                </span>
                <span style={{ display: "block", marginTop: 9, height: 3, background: V4.cream, borderRadius: 2, overflow: "hidden" }}>
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${Math.max(3, (systems / maxSystems) * 100)}%`,
                      background: isGroup ? "rgba(12,26,58,0.55)" : V4.navy,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          margin: "22px 0 0",
          border: `1px solid ${V4.ruleStrong}`,
          borderLeft: `2px solid ${V4.navy}`,
          borderRadius: 8,
          background: V4.surface,
          padding: "22px 24px",
        }}
      >
        <div style={eyebrow(V4.slate)}>Relationships are preserved, not collapsed</div>
        <p style={{ margin: "10px 0 0", fontFamily: SANS, fontSize: 15, lineHeight: 1.58, color: V4.inkSoft, maxWidth: "88ch", textWrap: "pretty" }}>
          Every one of the {view.edges.length} relationships stays in the model. The projection declares the verb once
          instead of printing it {view.edges.length} times, which is what keeps a high fan-in readable without dropping
          a single edge.
        </p>
      </div>
    </div>
  );
}

function systemsOf(node: ArchitectureViewNode): number {
  const metric = node.metrics?.systems;
  if (typeof metric === "number") return metric;
  return node.aggregation?.memberCount ?? 1;
}

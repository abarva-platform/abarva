"use client";

import { useMemo, useState, type CSSProperties } from "react";

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

const grainNoticeStyle = {
  border: `1px solid rgba(186,117,23,0.34)`,
  borderLeft: `3px solid ${V4.amber}`,
  borderRadius: 8,
  background: "rgba(186,117,23,0.045)",
  padding: "12px 14px",
  marginBottom: 12,
} as const;

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
  dataWorkloads: IntegrationRecord[];
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
  workloadTypes: Array<[string, number]>;
  workloadTechnologies: Array<[string, number]>;
  workloadPlatforms: Array<[string, number]>;
  workloadTotal: number;
  workloadUsers: number;
  workloadDataVolumeTb: number;
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
          [aria-label="Architecture wheel"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 980px) {
          [data-arch-map] { grid-template-columns: 1fr !important; }
          [data-arch-flow] { display: none !important; }
          [data-arch-core-nodes] { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          [aria-label="Architecture wheel"] [data-wheel-basis] { text-align: left !important; }
        }
        @media (max-width: 760px) {
          [data-arch-metrics] { grid-template-columns: 1fr !important; }
          [data-arch-axis-label] { width: 100% !important; white-space: normal !important; overflow-wrap: anywhere !important; }
          [data-wheel-canvas] { min-height: 520px !important; }
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
        <span data-arch-axis-label style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.stone }}>
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

      <ExecutiveRunMap
        applications={rows}
        integrations={integrationRows}
        infrastructure={infrastructureRows}
        onDrill={onDrill}
      />

      <div
        data-arch-layout
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr)",
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

interface RunMapBlock {
  key: string;
  title: string;
  subtitle: string;
  count: number;
  denominator: string;
  records: ApplicationRecord[];
  relatedIntegrations: IntegrationRecord[];
  anchors: string[];
  ownerSignal: string;
  hostingSignal: string;
  dependencySignal: string;
  gapSignal: string;
  tone: string;
  drillTarget?: string;
}

function ExecutiveRunMap({
  applications,
  integrations,
  infrastructure,
  onDrill,
}: {
  applications: ApplicationRecord[];
  integrations: IntegrationRecord[];
  infrastructure: InfrastructureRecord[];
  onDrill: (capability: string) => void;
}) {
  const blocks = useMemo(
    () => buildRunMapBlocks(applications, integrations, infrastructure),
    [applications, integrations, infrastructure],
  );
  const [selectedKey, setSelectedKey] = useState(blocks[0]?.key ?? "");
  const selectedBlock = blocks.find((block) => block.key === selectedKey) ?? blocks[0];
  const totals = {
    applications: applications.length,
    integrations: integrations.length,
    infrastructure: infrastructure.length,
  };

  return (
    <section
      aria-label="Enterprise run map"
      style={{
        marginTop: 28,
        borderTop: `1px solid ${V4.rule}`,
        paddingTop: 22,
      }}
    >
      <style>{`
        @media (max-width: 1080px) {
          [data-run-map] { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }
        @media (max-width: 760px) {
          [data-run-map] { grid-template-columns: 1fr !important; }
          [data-run-map-head] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        data-run-map-head
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.1fr) minmax(280px,0.9fr)",
          gap: "clamp(18px,3vw,42px)",
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <span style={eyebrow(V4.green)}>Enterprise run map</span>
          <h2
            style={{
              margin: "9px 0 0",
              fontFamily: SERIF,
              fontSize: "clamp(24px,2.1vw,34px)",
              fontWeight: 500,
              lineHeight: 1.12,
              color: V4.ink,
              textWrap: "balance",
            }}
          >
            Start with the business blocks, then drill into systems and platforms.
          </h2>
        </div>
        <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.58, color: V4.slate }}>
          This is the conceptual view for a new executive: what runs the plan, what runs delivery,
          what runs back office, where data and platforms concentrate, and where vendor dependency
          sits. Detailed system rows remain below.
        </p>
      </div>

      <ArchitectureWheel
        blocks={blocks}
        totals={totals}
        selectedKey={selectedBlock?.key ?? ""}
        onSelect={setSelectedKey}
        onDrill={onDrill}
      />

      <div data-run-map style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        {blocks.map((block) => (
          <article
            key={block.key}
            style={{
              minWidth: 0,
              minHeight: 260,
              border: `1px solid ${selectedBlock?.key === block.key ? block.tone : V4.ruleStrong}`,
              borderTop: `5px solid ${block.tone}`,
              borderRadius: 8,
              background: selectedBlock?.key === block.key ? "rgba(0,102,204,0.035)" : V4.surface,
              padding: "16px 17px",
              display: "grid",
              gridTemplateRows: "auto auto 1fr auto",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={eyebrow(block.tone)}>{block.denominator}</span>
              <span style={{ fontFamily: MONO, fontSize: 18, color: V4.ink, fontVariantNumeric: "tabular-nums" }}>
                {block.count.toLocaleString()}
              </span>
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontSize: 24,
                  fontWeight: 500,
                  lineHeight: 1.08,
                  color: V4.ink,
                }}
              >
                {block.title}
              </h3>
              <p style={{ margin: "7px 0 0", fontFamily: SANS, fontSize: 13, lineHeight: 1.45, color: V4.slate }}>
                {block.subtitle}
              </p>
            </div>

            <div style={{ display: "grid", gap: 11 }}>
              <RunMapLine label="anchors" value={block.anchors.length ? block.anchors.join(" · ") : "No named anchors in this slice"} />
              <RunMapLine label="owner" value={block.ownerSignal} />
              <RunMapLine label="hosting" value={block.hostingSignal} />
              <RunMapLine label="dependency" value={block.dependencySignal} />
              <RunMapLine label="gap" value={block.gapSignal} tone={V4.amber} />
            </div>

            {block.drillTarget ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" onClick={() => setSelectedKey(block.key)} style={runMapButtonStyle}>
                  Review passport
                </button>
                <button type="button" onClick={() => onDrill(block.drillTarget!)} style={runMapButtonStyle}>
                  Open logical view
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setSelectedKey(block.key)} style={runMapButtonStyle}>
                Review passport
              </button>
            )}
          </article>
        ))}
      </div>
      {selectedBlock ? <RunMapPassport block={selectedBlock} /> : null}
    </section>
  );
}

function ArchitectureWheel({
  blocks,
  totals,
  selectedKey,
  onSelect,
  onDrill,
}: {
  blocks: RunMapBlock[];
  totals: { applications: number; integrations: number; infrastructure: number };
  selectedKey: string;
  onSelect: (key: string) => void;
  onDrill: (capability: string) => void;
}) {
  const selectedBlock = blocks.find((block) => block.key === selectedKey) ?? blocks[0];
  const nodes = blocks.map((block, index) => {
    const angle = -90 + (360 / Math.max(1, blocks.length)) * index;
    const radius = 43;
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { block, x, y };
  });

  if (!selectedBlock) return null;

  return (
    <section aria-label="Architecture wheel" style={wheelShellStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={wheelHeaderStyle}>
          <div>
            <span style={eyebrow(V4.green)}>Architecture wheel</span>
            <h3 style={wheelTitleStyle}>Where the enterprise runs, and who answers for it.</h3>
          </div>
          <span data-wheel-basis style={wheelBasisStyle}>
            {blocks.length.toLocaleString()} business blocks · {totals.applications.toLocaleString()} applications ·{" "}
            {totals.infrastructure.toLocaleString()} platforms · {totals.integrations.toLocaleString()} movements
          </span>
        </div>

        <div data-wheel-canvas style={wheelCanvasStyle}>
          <div aria-hidden="true" style={{ ...wheelRingStyle, width: "76%", height: "76%" }} />
          <div aria-hidden="true" style={{ ...wheelRingStyle, width: "54%", height: "54%" }} />
          <div aria-hidden="true" style={{ ...wheelRingStyle, width: "32%", height: "32%" }} />
          <div style={wheelCenterStyle}>
            <span style={wheelCenterNameStyle}>Meridian</span>
            <span style={wheelCenterMetaStyle}>conceptual view</span>
            <span style={wheelCenterMetaStyle}>typed views only</span>
          </div>
          {nodes.map(({ block, x, y }) => {
            const active = block.key === selectedBlock.key;
            return (
              <button
                key={block.key}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(block.key)}
                style={{
                  ...wheelNodeStyle,
                  left: `${x}%`,
                  top: `${y}%`,
                  borderColor: active ? block.tone : "rgba(12,26,58,0.2)",
                  background: active ? "rgba(255,255,255,0.98)" : V4.surface,
                  boxShadow: active ? `0 0 0 3px ${block.tone}22, 0 14px 30px rgba(12,26,58,0.12)` : "0 9px 20px rgba(12,26,58,0.08)",
                }}
              >
                <span style={{ ...wheelNodeCountStyle, color: block.tone }}>{block.count.toLocaleString()}</span>
                <span style={wheelNodeLabelStyle}>{block.title}</span>
                <span style={wheelNodeMetaStyle}>{block.denominator}</span>
              </button>
            );
          })}
        </div>
      </div>

      <aside style={wheelDetailStyle}>
        <span style={eyebrow(selectedBlock.tone)}>Selected business block</span>
        <h3 style={wheelDetailTitleStyle}>{selectedBlock.title}</h3>
        <p style={wheelDetailTextStyle}>{selectedBlock.subtitle}</p>
        <div style={wheelDetailMetricGridStyle}>
          <ArchitectureMetric value={selectedBlock.count.toLocaleString()} label={selectedBlock.denominator} />
          <ArchitectureMetric value={selectedBlock.relatedIntegrations.length.toLocaleString()} label="data movements" />
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <RunMapLine label="anchor systems" value={selectedBlock.anchors.length ? selectedBlock.anchors.join(" · ") : "No named anchors in this block"} />
          <RunMapLine label="accountability" value={selectedBlock.ownerSignal} />
          <RunMapLine label="hosting posture" value={selectedBlock.hostingSignal} />
          <RunMapLine label="open evidence" value={selectedBlock.gapSignal} tone={V4.amber} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {selectedBlock.drillTarget ? (
            <button type="button" onClick={() => onDrill(selectedBlock.drillTarget!)} style={runMapButtonStyle}>
              Open logical view
            </button>
          ) : null}
          <button type="button" onClick={() => onSelect(selectedBlock.key)} style={runMapButtonStyle}>
            Keep selected
          </button>
        </div>
      </aside>
    </section>
  );
}

function RunMapPassport({ block }: { block: RunMapBlock }) {
  const topRecords = [...block.records]
    .sort((a, b) => numeric(recordCost(b)) - numeric(recordCost(a)) || recordName(a).localeCompare(recordName(b)))
    .slice(0, 6);
  const totalCost = block.records.reduce((sum, row) => sum + numeric(recordCost(row)), 0);
  const tierOne = block.records.filter((row) => isTierOne(text(row, "criticality"))).length;
  const vendors = topCounts(block.records, "vendor").filter(([name]) => name !== "Not specified").slice(0, 3);
  const hosting = topCounts(block.records, "deploymentModel").filter(([name]) => name !== "Not specified").slice(0, 3);

  return (
    <section aria-label={`${block.title} system passport`} style={passportStyle}>
      <div style={{ minWidth: 0 }}>
        <span style={eyebrow(block.tone)}>System passport</span>
        <h3 style={passportTitleStyle}>{block.title}</h3>
        <p style={passportTextStyle}>{block.subtitle}</p>
      </div>
      <div style={passportMetricGridStyle}>
        <ArchitectureMetric value={block.count.toLocaleString()} label={block.denominator} />
        <ArchitectureMetric value={moneyShort(totalCost)} label="annual cost where recorded" />
        <ArchitectureMetric value={tierOne.toLocaleString()} label="tier-1 records" />
        <ArchitectureMetric value={block.relatedIntegrations.length.toLocaleString()} label="touching data movements" />
      </div>
      <div style={passportBodyStyle}>
        <section style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.slate)}>Top systems in this block</span>
          <div style={passportListStyle}>
            {topRecords.length ? (
              topRecords.map((record) => (
                <article key={`${block.key}:${recordName(record)}:${text(record, "originalRowId")}`} style={passportRecordStyle}>
                  <strong style={passportRecordNameStyle}>{recordName(record)}</strong>
                  <span style={passportRecordMetaStyle}>
                    {[recordCategory(record), text(record, "vendor"), text(record, "deploymentModel"), moneyShort(numeric(recordCost(record)))]
                      .filter((item) => item && item !== "—")
                      .join(" · ")}
                  </span>
                </article>
              ))
            ) : (
              <p style={passportTextStyle}>No named systems or platforms are mapped to this block yet.</p>
            )}
          </div>
        </section>
        <section style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.slate)}>Decision context</span>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <RunMapLine label="owners" value={block.ownerSignal} />
            <RunMapLine label="hosting" value={hosting.length ? formatTopLabels(hosting) : block.hostingSignal} />
            <RunMapLine label="vendors" value={vendors.length ? formatTopLabels(vendors) : "Vendor evidence not recorded in this block"} />
            <RunMapLine label="dependency" value={block.dependencySignal} />
            <RunMapLine label="evidence gap" value={block.gapSignal} tone={V4.amber} />
          </div>
        </section>
      </div>
    </section>
  );
}

function RunMapLine({ label, value, tone = V4.slate }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ minWidth: 0, borderTop: `1px solid ${V4.rule}`, paddingTop: 8 }}>
      <span style={{ display: "block", fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: tone }}>
        {label}
      </span>
      <span
        title={value}
        style={{
          display: "block",
          marginTop: 4,
          fontFamily: SANS,
          fontSize: 12.5,
          lineHeight: 1.35,
          color: V4.inkSoft,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
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
  const isDataPlatformScope = isDataAndAiScope(slice);
  const batchFlows = keywordCount(slice.integrations, "integrationType", ["batch", "file", "etl"]);
  const apiFlows = keywordCount(slice.integrations, "integrationType", ["api", "hl7", "fhir", "edi"]);
  const streamingFlows = keywordCount(slice.integrations, "integrationType", ["stream", "event", "real-time", "realtime"]);
  const unstructuredFlows = keywordCount(slice.integrations, "dataDomain", ["document", "image", "note", "unstructured"]);
  const servingCount = slice.destinations.length;
  const hasWorkloadEvidence = slice.dataWorkloads.length > 0;
  const platformSignals = platformSignalCounts(slice, isWholeEstate);
  const platformAttribution = isWholeEstate
    ? `${slice.infrastructure.length.toLocaleString()} platform records · ${formatTopLabels(slice.hostingModels)}`
    : `Direct platform joins not recorded · app deployment ${formatTopLabels(slice.appPlatforms)} · integration platforms ${formatTopLabels(slice.dataPlatforms)}`;

  return (
    <section style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, marginBottom: 10 }}>
        <span style={eyebrow(V4.blue)}>{slice.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
          {slice.count} applications · {slice.integrations.length} flows ·{" "}
          {isWholeEstate ? `${slice.infrastructure.length} platforms` : "platform attribution unproven"}
        </span>
      </div>

      <div style={grainNoticeStyle}>
        <span style={eyebrow(V4.amber)}>Counting basis</span>
        <p style={{ margin: "7px 0 0", fontFamily: SANS, fontSize: 13, lineHeight: 1.52, color: V4.inkSoft }}>
          Counts here are recorded systems, movements, platform records, and product-facing evidence slices.
          Movement counts are source-to-target rows. Data, BI, ETL, report, script, and analytics volumes
          are shown only when segment-level workload evidence is present in the governed projection.
        </p>
      </div>

      <div
          data-arch-map
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(112px,1fr) 14px minmax(112px,1fr) 14px minmax(188px,1.28fr) 14px minmax(112px,1fr) 14px minmax(112px,1fr)",
            gap: 5,
            alignItems: "stretch",
            border: `2px solid rgba(29,158,117,0.34)`,
            borderTop: `7px solid ${V4.green}`,
            borderRadius: 10,
            background: "rgba(255,255,255,0.55)",
            padding: 10,
          }}
        >
        <ArchitectureStage
          index="1"
          zoneLabel="source zone"
          tone={V4.navy}
          title={isDataPlatformScope ? "Data platforms" : "Operational systems"}
          caption={isDataPlatformScope ? "Recorded data and AI estate" : "Business applications in this scope"}
          items={[
            [isDataPlatformScope ? "data / AI systems" : "application systems", slice.count],
            ["interfaces", slice.integrations.length],
            [isWholeEstate ? "platform records" : "direct platform joins", slice.infrastructure.length],
            ["tier-1 systems", slice.tier1],
          ]}
        />
        <FlowArrow label="ingest" />

        <ArchitectureStage
          index="2"
          zoneLabel="ingestion zone"
          tone={V4.blue}
          title="Ingestion"
          caption="Patterns declared on integration rows"
          items={[
            ["batch / file", batchFlows],
            ["API / HL7 / FHIR", apiFlows],
            ["streaming", streamingFlows],
            ["unstructured", unstructuredFlows],
          ]}
        />
        <FlowArrow label="land" />

        <section
          data-arch-zone="governed lakehouse"
          style={{
            minWidth: 0,
            border: `1px solid ${V4.ruleStrong}`,
            borderRadius: 8,
            background: V4.surface,
            padding: 10,
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span style={eyebrow(V4.green)}>
              {isWholeEstate || isDataPlatformScope ? "3 · governed lakehouse" : "3 · data / reporting layer"}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: V4.slate }}>
              RECORDED FLOWS · CANONICAL · SERVING TARGETS
            </span>
          </div>
          <div
            data-arch-core-nodes
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 8,
              alignItems: "stretch",
            }}
          >
            <ArchitectureNode label="Recorded flows" value={slice.integrations.length} detail="source movements" tone={V4.red} />
            <ArchitectureNode label="Compiled records" value={slice.count + slice.integrations.length} detail="apps + movements" tone={V4.stone} />
            <ArchitectureNode label="Facts + dimensions" value={slice.appCategories.length + slice.dataDomains.length} detail="recorded groupings" tone={V4.amber} />
            <ArchitectureNode label="Serving targets" value={slice.destinations.length} detail="not report count" tone={V4.green} />
          </div>
          <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 9 }}>
            <span style={eyebrow(V4.slate)}>Canonical context model</span>
            <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.inkSoft }}>
              Business records, application systems, integration rows, and platform records are compiled into
              governed Home read models. Platform hosting joins remain marked as unproven when absent.
            </p>
          </div>
        </section>
        <FlowArrow label="analyze" />

        <ArchitectureStage
          index="4"
          zoneLabel="intelligence zone"
          tone={V4.amber}
          title="Intelligence"
          caption="Analysis and retrieval surfaces"
          items={[
            ["engineering views", slice.dataDomains.length],
            ["constraints", slice.watch],
            ["quality watch", slice.qualityWatch],
            ["regulated flags", slice.regulatedFlows],
          ]}
        />
        <FlowArrow label="serve" />

        <ArchitectureStage
          index="5"
          zoneLabel="consumption zone"
          tone={V4.navy}
          title="Serve & consume"
          caption="Product and operator access"
          items={[
            ["recorded targets", servingCount],
            ["recorded fact groups", slice.appCategories.length],
            ["product surfaces", 4],
            ["business context", isWholeEstate ? Math.max(1, slice.appCategories.length) : 1],
          ]}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <FoundationBand
          title="Governance"
          detail={`${slice.regulatedFlows.toLocaleString()} regulated flows · ${slice.qualityWatch.toLocaleString()} quality-watch records`}
          tone={V4.green}
        />
        <FoundationBand
          title={isWholeEstate ? "Platform inventory" : "Platform attribution"}
          detail={platformAttribution}
          tone={V4.navy}
        />
        <FoundationBand
          title="Consumers"
          detail="Home, Source, Tower, Intelligence; Moves remains outside this Home evidence map"
          tone={V4.blue}
        />
      </div>

      <ArchitectureRelationshipCrosswalk slice={slice} />

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
          title={isWholeEstate ? "Platform estate" : "Platform signals"}
          detail={isWholeEstate ? "Recorded platform object types" : "Hosting and integration-platform mentions, not confirmed hosting joins"}
          items={platformSignals.slice(0, 5)}
        />
        {hasWorkloadEvidence ? (
          <DataWorkloadEvidencePanel slice={slice} />
        ) : (
          <SourceGapPanel
            title="Workload evidence not loaded"
            detail="This scope has movements but no segment-level data/BI/ETL workload rows in the governed projection"
            items={[
              "Report, ETL, script, and analytics workload counts by function",
              "BI platform, mart, and semantic-model usage by segment",
              "Active users and data-volume measures by technology",
            ]}
          />
        )}
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
          This map uses recorded application, integration, infrastructure, and data/BI/ETL workload fields. It does not claim
          confirmed runtime dependency direction, deployment topology, network zones, or system-to-platform
          hosting joins where those relationships are not recorded. Report, ETL, script, user, and data-volume
          counts come from segment-level workload rows; they are not inferred from source-to-target movements.
        </p>
      </div>
    </section>
  );
}

function ArchitectureRelationshipCrosswalk({ slice }: { slice: ArchitectureSlice }) {
  const isWholeEstate = slice.name === "Whole estate";
  const cards = [
    {
      title: isWholeEstate ? "Functions → cloud / hosting posture" : "System families → cloud / hosting posture",
      detail: "Applications mapped from business capability to deployment model.",
      entries: relationshipMatrix(
        slice.applications,
        isWholeEstate ? "businessFunction" : "systemCategory",
        "deploymentModel",
      ).slice(0, 4),
    },
    {
      title: isWholeEstate ? "Functions → vendor concentration" : "Vendors → criticality",
      detail: isWholeEstate
        ? "Supplier exposure by the business capabilities they support."
        : "Critical-system exposure by supplier inside this capability.",
      entries: relationshipMatrix(slice.applications, isWholeEstate ? "businessFunction" : "vendor", isWholeEstate ? "vendor" : "criticality").slice(0, 4),
    },
    {
      title: "Ownership → lifecycle posture",
      detail: "Where accountable owners intersect with current, legacy, and sunset posture.",
      entries: relationshipMatrix(slice.applications, "businessOwner", "lifecycleState").slice(0, 4),
    },
    {
      title: isWholeEstate ? "Data domains → integration patterns" : "Data domains → platforms",
      detail: isWholeEstate
        ? "How recorded domains move through the estate."
        : "Where this scope's data movements land or run.",
      entries: relationshipMatrix(slice.integrations, "dataDomain", isWholeEstate ? "integrationType" : "platformOrDatabase").slice(0, 4),
    },
  ].filter((card) => card.entries.length > 0);

  if (!cards.length) return null;

  return (
    <section
      data-arch-relationships
      style={{
        marginTop: 16,
        border: `1px solid ${V4.ruleStrong}`,
        borderRadius: 10,
        background: V4.surface,
        padding: "16px 16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <span style={eyebrow(V4.blue)}>Enterprise relationship crosswalk</span>
          <h2
            style={{
              margin: "8px 0 0",
              fontFamily: SERIF,
              fontSize: "clamp(21px,1.65vw,28px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: V4.ink,
            }}
          >
            Applications are mapped to owners, vendors, hosting posture, lifecycle, and data movement.
          </h2>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.07em", color: V4.slate }}>
          {slice.count.toLocaleString()} APPS · {slice.integrations.length.toLocaleString()} FLOWS
        </span>
      </div>
      <div
        data-arch-crosswalk-grid
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              minWidth: 0,
              border: `1px solid ${V4.rule}`,
              borderRadius: 8,
              background: V4.cream,
              padding: "13px 14px",
            }}
          >
            <span style={eyebrow(V4.slate)}>{card.title}</span>
            <p style={{ margin: "7px 0 12px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.slate }}>
              {card.detail}
            </p>
            <div style={{ display: "grid", gap: 9 }}>
              {card.entries.map((entry) => (
                <RelationshipMiniCard key={entry.leftValue} entry={entry} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RelationshipMiniCard({
  entry,
}: {
  entry: { leftValue: string; count: number; rightCounts: Array<[string, number]> };
}) {
  const max = Math.max(1, ...entry.rightCounts.map(([, count]) => count));
  return (
    <div style={{ minWidth: 0, borderTop: `1px solid ${V4.rule}`, paddingTop: 9 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "baseline" }}>
        <strong
          title={entry.leftValue}
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: SANS,
            fontSize: 13,
            color: V4.ink,
          }}
        >
          {entry.leftValue}
        </strong>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.ink }}>{entry.count.toLocaleString()}</span>
      </div>
      <div style={{ display: "grid", gap: 5, marginTop: 7 }}>
        {entry.rightCounts.slice(0, 3).map(([label, count]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 30px", gap: 8, alignItems: "baseline" }}>
              <span
                title={label}
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: SANS,
                  fontSize: 12,
                  color: V4.inkSoft,
                }}
              >
                {label}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: V4.slate, textAlign: "right" }}>{count}</span>
            </div>
            <span style={{ display: "block", height: 3, borderRadius: 99, background: "rgba(12,26,58,0.08)", overflow: "hidden", marginTop: 3 }}>
              <span style={{ display: "block", width: `${Math.max(6, (count / max) * 100)}%`, height: "100%", background: V4.blue }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureStage({
  index,
  zoneLabel,
  tone,
  title,
  caption,
  items,
}: {
  index: string;
  zoneLabel: string;
  tone: string;
  title: string;
  caption: string;
  items: Array<[string, number]>;
}) {
  const max = Math.max(1, ...items.map(([, count]) => count));
  return (
    <article
      data-arch-zone={zoneLabel}
      style={{
        minWidth: 0,
        border: `1px solid ${V4.ruleStrong}`,
        borderRadius: 8,
        background: V4.surface,
        padding: 10,
        position: "relative",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -11,
          left: 12,
          width: 26,
          height: 26,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: "#77c8b5",
          border: `2px solid ${V4.navy}`,
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          color: V4.navy,
        }}
      >
        {index}
      </span>
      <span style={{ ...eyebrow(tone), display: "block", marginLeft: 34 }}>{index} · {zoneLabel}</span>
      <h2
        style={{
          margin: "14px 0 0",
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
          color: V4.ink,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: "8px 0 0", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.04em", color: V4.slate }}>
        {caption}
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {items.filter(([, count]) => count > 0).slice(0, 6).map(([name, count]) => (
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

function FlowArrow({ label }: { label: string }) {
  return (
    <div
      data-arch-flow
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto 1fr",
        alignItems: "center",
        justifyItems: "center",
        color: V4.navy,
      }}
    >
      <span />
      <span
        aria-hidden="true"
        style={{
          width: 24,
          maxWidth: "100%",
          height: 1,
          background: V4.navy,
          position: "relative",
          display: "block",
        }}
      >
        <span
          style={{
            position: "absolute",
            right: -1,
            top: -4,
            width: 8,
            height: 8,
            borderTop: `1px solid ${V4.navy}`,
            borderRight: `1px solid ${V4.navy}`,
            transform: "rotate(45deg)",
          }}
        />
      </span>
      <span style={{ marginTop: 8, fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", writingMode: "vertical-rl", color: V4.slate }}>
        {label}
      </span>
    </div>
  );
}

function ArchitectureNode({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        border: `1px dashed ${V4.ruleStrong}`,
        borderRadius: 8,
        background: V4.cream,
        padding: "12px 10px",
        textAlign: "center",
      }}
    >
      <span style={{ display: "block", fontFamily: SERIF, fontSize: 23, lineHeight: 1, color: tone }}>
        {value.toLocaleString()}
      </span>
      <span style={{ display: "block", marginTop: 7, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: V4.ink, lineHeight: 1.2 }}>
        {label}
      </span>
      <span style={{ display: "block", marginTop: 4, fontFamily: MONO, fontSize: 10, color: V4.slate, lineHeight: 1.3 }}>
        {detail}
      </span>
    </div>
  );
}

function FoundationBand({ title, detail, tone }: { title: string; detail: string; tone: string }) {
  return (
    <article
      style={{
        border: `1px solid ${V4.ruleStrong}`,
        borderTop: `4px solid ${tone}`,
        borderRadius: 8,
        background: V4.surface,
        padding: "12px 14px",
      }}
    >
      <span style={eyebrow(tone)}>{title}</span>
      <p style={{ margin: "7px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.inkSoft }}>
        {detail}
      </p>
    </article>
  );
}

function EvidencePanel({ title, detail, items }: { title: string; detail: string; items: Array<[string, number]> }) {
  return (
    <article style={{ minWidth: 0, border: `1px solid ${V4.rule}`, borderRadius: 8, background: V4.surface, padding: "14px 15px" }}>
      <span style={eyebrow(V4.slate)}>{title}</span>
      <p style={{ margin: "7px 0 12px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.slate }}>{detail}</p>
      <div style={{ display: "grid", gap: 7 }}>
        {items.filter(([, count]) => count > 0).slice(0, 5).map(([name, count]) => (
          <div key={name} style={{ minWidth: 0, display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${V4.rule}`, paddingTop: 7 }}>
            <span style={{ flex: "1 1 auto", fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>
              {name}
            </span>
            <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 11, color: V4.ink }}>{count}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function DataWorkloadEvidencePanel({ slice }: { slice: ArchitectureSlice }) {
  const items: Array<[string, number]> = [
    ["workload segments", slice.dataWorkloads.length],
    ["workload items", Math.round(slice.workloadTotal)],
    ["active users", Math.round(slice.workloadUsers)],
    ["data volume TB", Number(slice.workloadDataVolumeTb.toFixed(1))],
  ];
  const technologySummary = slice.workloadTechnologies
    .filter(([, count]) => count > 0)
    .slice(0, 2)
    .map(([name, count]) => `${name} ${count}`)
    .join(" · ");
  return (
    <article
      style={{
        minWidth: 0,
        border: `1px solid rgba(29,158,117,0.35)`,
        borderRadius: 8,
        background: "rgba(29,158,117,0.045)",
        padding: "14px 15px",
      }}
    >
      <span style={eyebrow(V4.green)}>Data/BI/ETL evidence loaded</span>
      <p style={{ margin: "7px 0 12px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.slate }}>
        Segment-level workload counts, users, and data volumes are present in the governed projection
        {technologySummary ? ` across ${technologySummary}.` : "."}
      </p>
      <div style={{ display: "grid", gap: 7 }}>
        {items.filter(([, count]) => count > 0).map(([name, count]) => (
          <div key={name} style={{ minWidth: 0, display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid rgba(29,158,117,0.18)`, paddingTop: 7 }}>
            <span style={{ flex: "1 1 auto", fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>
              {name}
            </span>
            <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 11, color: V4.ink }}>{count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function SourceGapPanel({ title, detail, items }: { title: string; detail: string; items: string[] }) {
  return (
    <article
      style={{
        minWidth: 0,
        border: `1px solid rgba(186,117,23,0.34)`,
        borderRadius: 8,
        background: "rgba(186,117,23,0.045)",
        padding: "14px 15px",
      }}
    >
      <span style={eyebrow(V4.amber)}>{title}</span>
      <p style={{ margin: "7px 0 12px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: V4.slate }}>{detail}</p>
      <div style={{ display: "grid", gap: 7 }}>
        {items.map((item) => (
          <div key={item} style={{ display: "grid", gridTemplateColumns: "10px minmax(0,1fr)", gap: 8, alignItems: "baseline", borderTop: `1px solid rgba(186,117,23,0.18)`, paddingTop: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: V4.amber }} />
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft, lineHeight: 1.35 }}>{item}</span>
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

function buildRunMapBlocks(
  applications: ApplicationRecord[],
  integrations: IntegrationRecord[],
  infrastructure: InfrastructureRecord[],
): RunMapBlock[] {
  const payerApps = matchingApps(applications, [
    "payer",
    "health plan",
    "claims",
    "membership",
    "enrollment",
    "provider network",
    "care management",
    "risk adjustment",
    "raf",
    "stars",
    "hedis",
    "actuarial",
    "pharmacy benefit",
  ]);
  const providerApps = matchingApps(applications, [
    "clinical",
    "acute",
    "ambulatory",
    "nursing",
    "lab",
    "imaging",
    "pharmacy",
    "patient",
    "revenue cycle",
    "hospital",
    "provider delivery",
  ]);
  const backOfficeApps = matchingApps(applications, [
    "finance",
    "accounting",
    "human resources",
    "hr",
    "workforce",
    "supply chain",
    "procurement",
    "legal",
    "facilities",
    "payroll",
    "expense",
  ]);
  const dataApps = matchingApps(applications, [
    "data",
    "analytics",
    "ai",
    "report",
    "business intelligence",
    "bi",
    "warehouse",
    "mart",
    "sas",
    "tableau",
    "power bi",
  ]);
  const infrastructureApps = matchingApps(applications, [
    "infrastructure",
    "hosting",
    "cloud",
    "security",
    "identity",
    "network",
    "storage",
    "integration",
    "middleware",
    "mft",
  ]);
  const vendorRows = applications.filter((row) => Boolean(text(row, "vendor")));

  return [
    runMapBlock({
      key: "payer",
      title: "Health Plan / Payer",
      subtitle: "Enrollment, claims, provider network, care management, RAF, Stars, pharmacy, and actuarial operations.",
      rows: payerApps,
      integrations,
      denominator: "applications",
      tone: V4.blue,
    }),
    runMapBlock({
      key: "provider",
      title: "Provider / Delivery",
      subtitle: "Clinical, acute, ambulatory, patient access, revenue cycle, pharmacy, lab, and imaging operations.",
      rows: providerApps,
      integrations,
      denominator: "applications",
      tone: V4.green,
    }),
    runMapBlock({
      key: "back-office",
      title: "Back Office",
      subtitle: "Finance, HR, supply chain, procurement, legal, facilities, workforce, and shared-services backbone.",
      rows: backOfficeApps,
      integrations,
      denominator: "applications",
      tone: V4.navy,
    }),
    runMapBlock({
      key: "data-ai",
      title: "Data, Analytics & AI",
      subtitle: "Operational sources, ingestion, marts, reporting, advanced analytics, AI tooling, and data governance.",
      rows: dataApps,
      integrations,
      denominator: "applications",
      tone: V4.amber,
      gapOverride: dataFlowGap(integrations),
    }),
    {
      key: "infrastructure",
      title: "Infrastructure & Hosting",
      subtitle: "SaaS, public cloud, private cloud, data centers, integration engines, identity, network, and storage.",
      count: infrastructure.length,
      denominator: "platforms",
      records: infrastructure,
      relatedIntegrations: integrations.filter((row) =>
        infrastructure.some((platform) => {
          const name = text(platform, "platformName");
          return name && (text(row, "targetSystem") === name || text(row, "platformOrDatabase") === name);
        }),
      ),
      anchors: namedAnchors(infrastructure, "platformName", "platformType"),
      ownerSignal: ownerSignal(infrastructure, "operationalOwner"),
      hostingSignal: formatTopLabels(topCounts(infrastructure, "hostingModel").slice(0, 3)),
      dependencySignal:
        infrastructureApps.length > 0
          ? `${infrastructureApps.length.toLocaleString()} application records also carry infrastructure or hosting signals`
          : "Application-to-platform hosting joins remain evidence-limited",
      gapSignal: "Confirm app-to-platform hosting, environment, capacity, and resilience relationships",
      tone: V4.stone,
    },
    {
      key: "commercial",
      title: "Vendor & Commercial Spine",
      subtitle: "Strategic suppliers, contracts, managed services, renewal exposure, and commercial leverage.",
      count: new Set(vendorRows.map((row) => text(row, "vendor")).filter(Boolean)).size,
      denominator: "vendors named on apps",
      records: vendorRows,
      relatedIntegrations: integrationsForApps(integrations, vendorRows),
      anchors: topCounts(vendorRows, "vendor").slice(0, 3).map(([name, count]) => `${name} (${count})`),
      ownerSignal: ownerSignal(vendorRows, "businessOwner"),
      hostingSignal: formatTopLabels(topCounts(vendorRows, "deploymentModel").slice(0, 3)),
      dependencySignal: `${vendorRows.length.toLocaleString()} application records name a vendor`,
      gapSignal: "Use Vendor Contracts for contract terms, spend, renewal, and document proof",
      tone: V4.red,
    },
  ];
}

function runMapBlock({
  key,
  title,
  subtitle,
  rows,
  integrations,
  denominator,
  tone,
  gapOverride,
}: {
  key: string;
  title: string;
  subtitle: string;
  rows: ApplicationRecord[];
  integrations: IntegrationRecord[];
  denominator: string;
  tone: string;
  gapOverride?: string;
}): RunMapBlock {
  const linkedIntegrations = integrationsForApps(integrations, rows);
  return {
    key,
    title,
    subtitle,
    count: rows.length,
    denominator,
    records: rows,
    relatedIntegrations: linkedIntegrations,
    anchors: namedAnchors(rows, "systemName", "systemCategory"),
    ownerSignal: ownerSignal(rows, "businessOwner"),
    hostingSignal: formatTopLabels(topCounts(rows, "deploymentModel").slice(0, 3)),
    dependencySignal: `${linkedIntegrations.length.toLocaleString()} recorded data movements touch this block`,
    gapSignal: gapOverride ?? gapSignalForBlock(rows, linkedIntegrations),
    tone,
    drillTarget: bestDrillTarget(rows),
  };
}

function matchingApps(rows: ApplicationRecord[], keywords: string[]): ApplicationRecord[] {
  return rows.filter((row) => {
    const haystack = [
      text(row, "businessFunction"),
      text(row, "systemCategory"),
      text(row, "systemName"),
      text(row, "dataDomains"),
      text(row, "vendor"),
    ]
      .join(" ")
      .toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });
}

function namedAnchors(rows: ApplicationRecord[], nameField: string, fallbackField: string): string[] {
  const anchors: string[] = [];
  for (const name of [...rows]
    .sort((a, b) => numeric(b.annualCostUsd) - numeric(a.annualCostUsd) || text(a, nameField).localeCompare(text(b, nameField)))
    .map((row) => displayName(text(row, nameField) || text(row, fallbackField)))
    .filter(Boolean)) {
    if (!anchors.includes(name)) anchors.push(name);
    if (anchors.length === 3) break;
  }
  return anchors;
}

function recordName(row: ApplicationRecord): string {
  return displayName(text(row, "systemName") || text(row, "platformName") || text(row, "dataAssetName") || text(row, "originalRowId")) || "Unnamed record";
}

function displayName(value: string): string {
  return value
    .replace(/\s+\d{2,4}$/u, "")
    .replace(/\s+[-–—]\s+(?:Production|Prod|Test|Training|Dev|QA|UAT)$/iu, "")
    .trim();
}

function recordCategory(row: ApplicationRecord): string {
  return text(row, "systemCategory") || text(row, "platformType") || text(row, "dataDomain");
}

function recordCost(row: ApplicationRecord): unknown {
  return row.annualCostUsd ?? row.annualSpendUsd;
}

function ownerSignal(rows: ApplicationRecord[], ownerField: string): string {
  const topOwners = topCounts(rows, ownerField)
    .filter(([name]) => name !== "Not specified")
    .slice(0, 2);
  if (!rows.length) return "No owned records in this slice";
  if (!topOwners.length) return "Owner not recorded";
  return topOwners.map(([name, count]) => `${name} (${count})`).join(" · ");
}

function bestDrillTarget(rows: ApplicationRecord[]): string | undefined {
  const topFunction = topCounts(rows, "businessFunction").find(([name]) => name !== "Not specified");
  return topFunction?.[0];
}

function gapSignalForBlock(rows: ApplicationRecord[], integrations: IntegrationRecord[]): string {
  if (!rows.length) return "No mapped systems yet; source or adapter coverage is missing";
  const missingOwner = rows.filter((row) => !text(row, "businessOwner")).length;
  const missingHosting = rows.filter((row) => !text(row, "deploymentModel")).length;
  const missingFlow = integrations.length === 0;
  if (missingOwner > 0) return `${missingOwner.toLocaleString()} system records need business-owner evidence`;
  if (missingHosting > 0) return `${missingHosting.toLocaleString()} system records need hosting evidence`;
  if (missingFlow) return "No recorded data movements touch this block";
  return "Gaps move to logical and physical drilldown";
}

function dataFlowGap(integrations: IntegrationRecord[]): string {
  const workloads = dataWorkloadRows(integrations);
  if (workloads.length > 0) {
    const workloadTotal = workloads.reduce((sum, row) => sum + numeric(row.workloadCount), 0);
    const activeUsers = workloads.reduce((sum, row) => sum + numeric(row.activeUserCount), 0);
    const dataVolume = workloads.reduce((sum, row) => sum + numeric(row.dataVolumeTb), 0);
    return `${workloads.length.toLocaleString()} workload segments carry ${Math.round(workloadTotal).toLocaleString()} report/ETL/script items, ${Math.round(activeUsers).toLocaleString()} active users, and ${Number(dataVolume.toFixed(1)).toLocaleString()} TB`;
  }
  const missingConsumption = integrations.filter((row) => !text(row, "consumptionLayer")).length;
  if (missingConsumption > 0) {
    return `${missingConsumption.toLocaleString()} movements need consumption/reporting-layer evidence`;
  }
  return "No segment-level workload evidence is present for reports, ETL jobs, users, scripts, or platform volumes";
}

function buildSlice(
  name: string,
  appRows: ApplicationRecord[],
  integrationsAndWorkloads: IntegrationRecord[],
  infrastructure: InfrastructureRecord[],
  estateTotal: number,
): ArchitectureSlice {
  const integrations = dataMovementRows(integrationsAndWorkloads);
  const dataWorkloads = dataWorkloadRows(integrationsAndWorkloads);
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
    dataWorkloads,
    infrastructure,
    count: appRows.length,
    share: name === "Whole estate" ? 100 : (appRows.length / Math.max(1, estateTotal)) * 100,
    tier1: appRows.filter((row) => isTierOne(text(row, "criticality"))).length,
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
    workloadTypes: topCounts(dataWorkloads, "workloadType").slice(0, 8),
    workloadTechnologies: topCounts(dataWorkloads, "technologyName").slice(0, 8),
    workloadPlatforms: topCounts(dataWorkloads, "platformName").slice(0, 8),
    workloadTotal: dataWorkloads.reduce((sum, row) => sum + numeric(row.workloadCount), 0),
    workloadUsers: dataWorkloads.reduce((sum, row) => sum + numeric(row.activeUserCount), 0),
    workloadDataVolumeTb: dataWorkloads.reduce((sum, row) => sum + numeric(row.dataVolumeTb), 0),
    hostingModels: topCounts(infrastructure, "hostingModel").slice(0, 8),
    infrastructureTypes: topCounts(infrastructure, "platformType").slice(0, 8),
  };
}

function integrationsForApps(integrations: IntegrationRecord[], appRows: ApplicationRecord[]): IntegrationRecord[] {
  const systems = new Set(appRows.flatMap((row) => [text(row, "systemName")]).filter(Boolean));
  const functions = new Set(appRows.flatMap((row) => [text(row, "businessFunction")]).filter(Boolean));
  if (!systems.size && !functions.size) {
    return [];
  }
  return integrations.filter((row) => {
    if (systems.has(text(row, "sourceSystem")) || systems.has(text(row, "targetSystem"))) return true;
    return functions.has(text(row, "ownerFunction")) || functions.has(text(row, "dataDomain"));
  });
}

function dataWorkloadRows(rows: IntegrationRecord[]): IntegrationRecord[] {
  return rows.filter((row) => text(row, "recordKind") === "data_analytics_workload");
}

function dataMovementRows(rows: IntegrationRecord[]): IntegrationRecord[] {
  return rows.filter((row) => text(row, "recordKind") !== "data_analytics_workload");
}

function keywordCount(rows: Array<Record<string, unknown>>, field: string, keywords: string[]): number {
  return rows.filter((row) => {
    const value = text(row, field).toLowerCase();
    return keywords.some((keyword) => value.includes(keyword));
  }).length;
}

function formatTopLabels(items: Array<[string, number]>): string {
  const labels = items
    .filter(([, count]) => count > 0)
    .slice(0, 2)
    .map(([name, count]) => `${name} ${count}`);
  return labels.length ? labels.join(" · ") : "hosting model not specified";
}

function topCounts(rows: ApplicationRecord[], field: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = text(row, field) || "Not specified";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function mergeCounts(...groups: Array<Array<[string, number]>>): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const group of groups) {
    for (const [label, count] of group) {
      counts.set(label, (counts.get(label) ?? 0) + count);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function platformSignalCounts(slice: ArchitectureSlice, isWholeEstate: boolean): Array<[string, number]> {
  if (isWholeEstate) {
    const anchors = strategicPlatformAnchors(slice.infrastructure);
    return anchors.length ? anchors : mergeCounts(slice.infrastructureTypes, slice.hostingModels);
  }
  return mergeCounts(priorityFlowTargets(slice.integrations), slice.appPlatforms, slice.dataPlatforms, slice.hostingModels);
}

function isDataAndAiScope(slice: ArchitectureSlice): boolean {
  if (/data|analytics|ai/i.test(slice.name)) return true;
  const dataLikeSystems = slice.applications.filter((row) =>
    /data|analytics|warehouse|lake|snowflake|teradata|databricks|bi|report/i.test(
      `${text(row, "systemCategory")} ${text(row, "systemName")} ${text(row, "hostingLocation")}`,
    ),
  ).length;
  return dataLikeSystems > 0 && dataLikeSystems / Math.max(1, slice.applications.length) >= 0.55;
}

function strategicPlatformAnchors(rows: InfrastructureRecord[]): Array<[string, number]> {
  const priorityPattern = /mainframe|teradata|warehouse|snowflake|databricks|data lake|analytics/i;
  return rows
    .filter((row) =>
      priorityPattern.test(`${text(row, "platformName")} ${text(row, "platformType")} ${text(row, "technologyStack")}`),
    )
    .map((row) => [text(row, "platformName") || text(row, "platformType") || "Platform record", 1] as [string, number])
    .sort((a, b) => platformPriority(a[0]) - platformPriority(b[0]) || a[0].localeCompare(b[0]));
}

function priorityFlowTargets(rows: IntegrationRecord[]): Array<[string, number]> {
  const priorityPattern = /mainframe|teradata|warehouse|snowflake|databricks|data lake|mart|report|power bi|tableau/i;
  return topCounts(
    rows.filter((row) =>
      priorityPattern.test(`${text(row, "targetSystem")} ${text(row, "platformOrDatabase")} ${text(row, "dataAssetName")}`),
    ),
    "targetSystem",
  ).slice(0, 8);
}

function platformPriority(label: string): number {
  if (/mainframe/i.test(label)) return 0;
  if (/teradata/i.test(label)) return 1;
  if (/snowflake|databricks|data lake|analytics/i.test(label)) return 2;
  if (/warehouse/i.test(label)) return 3;
  return 4;
}

function relationshipMatrix(rows: ApplicationRecord[], leftField: string, rightField: string) {
  const byLeft = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const leftValues = splitValues(row[leftField]);
    const rightValues = splitValues(row[rightField]);
    for (const left of leftValues) {
      if (!byLeft.has(left)) byLeft.set(left, new Map());
      const rights = byLeft.get(left)!;
      for (const right of rightValues) {
        rights.set(right, (rights.get(right) ?? 0) + 1);
      }
    }
  }
  return [...byLeft.entries()]
    .map(([leftValue, rightCounts]) => ({
      leftValue,
      count: [...rightCounts.values()].reduce((sum, count) => sum + count, 0),
      rightCounts: [...rightCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    }))
    .sort((a, b) => b.count - a.count || a.leftValue.localeCompare(b.leftValue));
}

function splitValues(value: unknown): string[] {
  const raw = value === null || value === undefined ? "" : String(value);
  return raw
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function isTierOne(value: unknown): boolean {
  const normalized = String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["p0", "critical", "missioncritical", "tier1", "tier01"].includes(normalized);
}

function moneyShort(value: number): string {
  if (!value) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const runMapButtonStyle = {
  justifySelf: "start",
  border: `1px solid rgba(0,102,204,0.38)`,
  borderRadius: 7,
  background: "transparent",
  color: V4.blue,
  padding: "8px 10px",
  fontFamily: MONO,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
} satisfies CSSProperties;

const passportStyle = {
  background: V4.surface,
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 10,
  boxShadow: "0 16px 34px rgba(12,26,58,0.055)",
  display: "grid",
  gap: 16,
  marginTop: 14,
  padding: "17px 18px 18px",
} satisfies CSSProperties;

const passportTitleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: "clamp(23px,2vw,32px)",
  fontWeight: 500,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  margin: "8px 0 0",
} satisfies CSSProperties;

const passportTextStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.5,
  margin: "8px 0 0",
} satisfies CSSProperties;

const passportMetricGridStyle = {
  background: V4.rule,
  border: `1px solid ${V4.rule}`,
  display: "grid",
  gap: 1,
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,145px),1fr))",
} satisfies CSSProperties;

const passportBodyStyle = {
  display: "grid",
  gap: 18,
  gridTemplateColumns: "minmax(0,1fr) minmax(260px,0.75fr)",
} satisfies CSSProperties;

const passportListStyle = {
  display: "grid",
  gap: 8,
  marginTop: 10,
} satisfies CSSProperties;

const passportRecordStyle = {
  border: `1px solid ${V4.rule}`,
  borderRadius: 8,
  minWidth: 0,
  padding: "10px 11px",
} satisfies CSSProperties;

const passportRecordNameStyle = {
  color: V4.ink,
  display: "block",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const passportRecordMetaStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 10.8,
  letterSpacing: "0.04em",
  lineHeight: 1.35,
  marginTop: 6,
  overflow: "hidden",
  textOverflow: "ellipsis",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const wheelShellStyle = {
  alignItems: "stretch",
  background: V4.surface,
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 10,
  boxShadow: "0 18px 42px rgba(12,26,58,0.07)",
  display: "grid",
  gap: 20,
  gridTemplateColumns: "minmax(0,1fr) minmax(280px,340px)",
  marginTop: 18,
  padding: "18px 18px 18px 20px",
} satisfies CSSProperties;

const wheelHeaderStyle = {
  alignItems: "end",
  display: "flex",
  gap: 18,
  justifyContent: "space-between",
  marginBottom: 12,
} satisfies CSSProperties;

const wheelTitleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: "clamp(24px,2.2vw,34px)",
  fontWeight: 500,
  lineHeight: 1.08,
  margin: "8px 0 0",
  textWrap: "balance",
} satisfies CSSProperties;

const wheelBasisStyle = {
  color: V4.slate,
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.06em",
  lineHeight: 1.45,
  maxWidth: 260,
  textAlign: "right",
  textTransform: "uppercase",
} satisfies CSSProperties;

const wheelCanvasStyle = {
  aspectRatio: "1.62 / 1",
  background:
    "radial-gradient(circle at center, rgba(29,158,117,0.08) 0 13%, transparent 13.4%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,246,241,0.7))",
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  minHeight: 430,
  overflow: "hidden",
  position: "relative",
} satisfies CSSProperties;

const wheelRingStyle = {
  border: `1px dashed rgba(12,26,58,0.18)`,
  borderRadius: 999,
  left: "50%",
  position: "absolute",
  top: "50%",
  transform: "translate(-50%, -50%)",
} satisfies CSSProperties;

const wheelCenterStyle = {
  alignItems: "center",
  background: V4.surface,
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 999,
  boxShadow: "0 10px 28px rgba(12,26,58,0.12)",
  display: "grid",
  height: 116,
  justifyItems: "center",
  left: "50%",
  padding: 12,
  position: "absolute",
  textAlign: "center",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: 116,
} satisfies CSSProperties;

const wheelCenterNameStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: 19,
  fontWeight: 600,
  lineHeight: 1.05,
} satisfies CSSProperties;

const wheelCenterMetaStyle = {
  color: V4.slate,
  fontFamily: MONO,
  fontSize: 9.5,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
} satisfies CSSProperties;

const wheelNodeStyle = {
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 8,
  cursor: "pointer",
  display: "grid",
  gap: 3,
  minHeight: 82,
  padding: "9px 10px",
  position: "absolute",
  textAlign: "left",
  transform: "translate(-50%, -50%)",
  width: 154,
} satisfies CSSProperties;

const wheelNodeCountStyle = {
  display: "block",
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 500,
  lineHeight: 1,
} satisfies CSSProperties;

const wheelNodeLabelStyle = {
  color: V4.ink,
  display: "block",
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 700,
  lineHeight: 1.16,
} satisfies CSSProperties;

const wheelNodeMetaStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 9.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
} satisfies CSSProperties;

const wheelDetailStyle = {
  background: V4.cream,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  minWidth: 0,
  padding: "16px 16px 18px",
} satisfies CSSProperties;

const wheelDetailTitleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: "clamp(22px,1.8vw,30px)",
  fontWeight: 500,
  lineHeight: 1.08,
  margin: "9px 0 0",
} satisfies CSSProperties;

const wheelDetailTextStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.52,
  margin: "9px 0 0",
} satisfies CSSProperties;

const wheelDetailMetricGridStyle = {
  background: V4.rule,
  border: `1px solid ${V4.rule}`,
  display: "grid",
  gap: 1,
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  marginTop: 14,
} satisfies CSSProperties;

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

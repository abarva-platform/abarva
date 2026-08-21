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
  canonicalBuild,
}: {
  tenantKey: string;
  tenantDisplayName: string;
  applications: TechRecordType;
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

  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ padding: `46px ${PAGE_X}px 0` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.blue)}>
            {capability ? "Logical architecture · one capability" : "Executive landscape · whole estate"}
          </span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: V4.slate, letterSpacing: "-0.01em" }}>
            {view.primaryQuestion}
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
          {view.title}
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
        <L0Landscape applications={applications} onDrill={setCapability} />
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

/* ── L0 · weighted landscape ─────────────────────────────────────────────────────────────── */

type ApplicationRecord = Record<string, unknown>;

interface FunctionCluster {
  name: string;
  rows: ApplicationRecord[];
  count: number;
  share: number;
  tier1: number;
  watch: number;
  replace: number;
  aging: number;
  vendorCount: number;
  spend: number;
  topCategories: Array<[string, number]>;
}

function L0Landscape({
  applications,
  onDrill,
}: {
  applications: TechRecordType;
  onDrill: (capability: string) => void;
}) {
  const rows = useMemo(() => (applications.rows ?? []) as ApplicationRecord[], [applications.rows]);
  const clusters = useMemo(() => buildFunctionClusters(rows), [rows]);
  const [selectedName, setSelectedName] = useState<string | null>(clusters[0]?.name ?? null);
  const selected = clusters.find((cluster) => cluster.name === selectedName) ?? clusters[0];
  const totalSpend = clusters.reduce((sum, cluster) => sum + cluster.spend, 0);
  const tier1 = clusters.reduce((sum, cluster) => sum + cluster.tier1, 0);
  const watch = clusters.reduce((sum, cluster) => sum + cluster.watch, 0);
  const replacement = clusters.reduce((sum, cluster) => sum + cluster.replace, 0);

  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <style>{`
        @media (max-width: 1180px) {
          [data-arch-workspace] { grid-template-columns: 1fr !important; }
          [data-arch-side] { position: static !important; }
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
        <span style={eyebrow(V4.slate)}>Architecture workbench</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.stone }}>
          FUNCTION · SYSTEM MIX · APPLICATION ROSTER
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
        <ArchitectureMetric value={rows.length.toLocaleString()} label="applications" />
        <ArchitectureMetric value={clusters.length.toLocaleString()} label="business functions" />
        <ArchitectureMetric value={tier1.toLocaleString()} label="tier-1 systems" />
        <ArchitectureMetric value={watch.toLocaleString()} label="lifecycle watch" />
        <ArchitectureMetric value={moneyShort(totalSpend)} label="annual cost" />
      </div>

      <div
        data-arch-workspace
        style={{
          display: "grid",
          gridTemplateColumns: "290px minmax(0,1fr) 390px",
          gap: "clamp(18px,2.5vw,34px)",
          alignItems: "start",
          marginTop: 22,
        }}
      >
        <section style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.slate)}>Functions</span>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {clusters.map((cluster, index) => (
              <FunctionButton
                key={cluster.name}
                cluster={cluster}
                rank={index + 1}
                active={selected?.name === cluster.name}
                onClick={() => setSelectedName(cluster.name)}
              />
            ))}
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, marginBottom: 10 }}>
            <span style={eyebrow(V4.slate)}>System mix</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
              top categories by function
            </span>
          </div>
          <div style={{ border: `1px solid ${V4.rule}`, background: V4.surface, borderRadius: 8, overflow: "hidden" }}>
            {clusters.slice(0, 12).map((cluster) => (
              <button
                key={cluster.name}
                type="button"
                onClick={() => setSelectedName(cluster.name)}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "minmax(170px,0.72fr) minmax(0,1fr) 74px",
                  gap: 14,
                  alignItems: "center",
                  textAlign: "left",
                  border: "none",
                  borderBottom: `1px solid ${V4.rule}`,
                  padding: "12px 14px",
                  background: selected?.name === cluster.name ? "rgba(0,102,204,0.055)" : V4.surface,
                  cursor: "pointer",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", fontFamily: SANS, fontSize: 13.5, color: V4.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cluster.name}
                  </strong>
                  <span style={{ display: "block", marginTop: 3, fontFamily: MONO, fontSize: 10.5, color: V4.slate }}>
                    {cluster.count} systems · {cluster.share.toFixed(1)}%
                  </span>
                </span>
                <span style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  {cluster.topCategories.slice(0, 3).map(([category, count]) => (
                    <span key={category} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 34px", gap: 10, alignItems: "center" }}>
                      <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                        <span style={{ fontFamily: SANS, fontSize: 12, color: V4.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {category}
                        </span>
                        <span style={{ height: 4, borderRadius: 99, background: V4.cream, overflow: "hidden" }}>
                          <span
                            style={{
                              display: "block",
                              width: `${Math.max(6, (count / Math.max(1, cluster.count)) * 100)}%`,
                              height: "100%",
                              background: "rgba(0,102,204,0.42)",
                            }}
                          />
                        </span>
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: V4.blue, textAlign: "right" }}>{count}</span>
                    </span>
                  ))}
                </span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontFamily: SERIF, fontSize: 22, lineHeight: 1, color: cluster.watch ? V4.amber : V4.slate }}>
                    {cluster.watch || 0}
                  </span>
                  <span style={{ display: "block", marginTop: 5, fontFamily: MONO, fontSize: 10, color: V4.slate, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    watch
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 10, marginTop: 14 }}>
            <ExceptionMetric label="replacement candidates" value={replacement} />
            <ExceptionMetric label="legacy/sunset/deprecated" value={watch} />
            <ExceptionMetric
              label="missing vendor"
              value={rows.filter((row) => !text(row, "vendor")).length}
            />
          </div>
        </section>

        {selected ? (
          <aside
            data-arch-side
            style={{
              position: "sticky",
              top: 24,
              borderLeft: `1px solid ${V4.rule}`,
              paddingLeft: 22,
              minWidth: 0,
            }}
          >
            <span style={eyebrow(V4.blue)}>Selected function</span>
            <h2
              style={{
                margin: "10px 0 0",
                fontFamily: SERIF,
                fontSize: 27,
                fontWeight: 500,
                letterSpacing: "-0.026em",
                lineHeight: 1.12,
                color: V4.ink,
              }}
            >
              {selected.name}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 1, marginTop: 18, border: `1px solid ${V4.rule}`, background: V4.rule }}>
              <ArchitectureMetric value={selected.count.toLocaleString()} label="applications" />
              <ArchitectureMetric value={`${selected.share.toFixed(1)}%`} label="of estate" />
              <ArchitectureMetric value={selected.tier1.toLocaleString()} label="tier-1 systems" />
              <ArchitectureMetric value={selected.watch.toLocaleString()} label="watch items" />
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={eyebrow(V4.slate)}>Application roster</span>
              <div style={{ marginTop: 9, borderTop: `1px solid ${V4.rule}` }}>
                {selected.rows.slice(0, 18).map((row) => (
                  <div key={`${text(row, "systemName")}-${text(row, "originalRowId")}`} style={{ padding: "9px 0", borderBottom: `1px solid ${V4.rule}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                      <strong style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.25, color: V4.ink }}>{text(row, "systemName")}</strong>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: text(row, "criticality") === "tier1" ? V4.blue : V4.slate }}>
                        {text(row, "criticality") || "—"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontFamily: SANS, fontSize: 12, lineHeight: 1.35, color: V4.slate }}>
                      {text(row, "systemCategory") || "Unclassified"} · {text(row, "lifecycleState") || "no lifecycle"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDrill(selected.name)}
              style={{
                marginTop: 18,
                width: "100%",
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
              Open capability detail
            </button>
            <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55, color: V4.slate }}>
              This uses recorded application fields only. It is a working view of concentration, mix, and exceptions, not a formal capability taxonomy.
            </p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function FunctionButton({
  cluster,
  rank,
  active,
  onClick,
}: {
  cluster: FunctionCluster;
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
        gridTemplateColumns: "24px minmax(0,1fr) 42px",
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
      <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>{rank}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 650, color: V4.ink, lineHeight: 1.24, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cluster.name}
        </span>
        <span style={{ display: "block", height: 4, background: V4.cream, borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
          <span style={{ display: "block", width: `${Math.max(2, cluster.share)}%`, height: "100%", background: active ? V4.blue : "rgba(12,26,58,0.58)" }} />
        </span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: V4.ink, textAlign: "right" }}>{cluster.count}</span>
    </button>
  );
}

function ExceptionMetric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ borderTop: `1px solid ${value ? "rgba(186,117,23,0.55)" : V4.rule}`, paddingTop: 10 }}>
      <span style={{ display: "block", fontFamily: SERIF, fontSize: 24, lineHeight: 1, color: value ? V4.amber : V4.ink }}>
        {value.toLocaleString()}
      </span>
      <span style={{ display: "block", marginTop: 6, fontFamily: SANS, fontSize: 12, color: V4.slate }}>{label}</span>
    </div>
  );
}

function buildFunctionClusters(rows: ApplicationRecord[]): FunctionCluster[] {
  const groups = new Map<string, ApplicationRecord[]>();
  for (const row of rows) {
    const key = text(row, "businessFunction") || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const total = Math.max(1, rows.length);
  return [...groups.entries()]
    .map(([name, groupRows]) => {
      const aging = groupRows.filter((row) =>
        ["legacy_stable", "sunset_planned", "deprecated"].includes(text(row, "lifecycleState")),
      ).length;
      const replace = groupRows.filter((row) => text(row, "replacementCandidate").toLowerCase() === "yes").length;
      const vendors = new Set(groupRows.map((row) => text(row, "vendor")).filter(Boolean));
      return {
        name,
        rows: groupRows,
        count: groupRows.length,
        share: (groupRows.length / total) * 100,
        tier1: groupRows.filter((row) => text(row, "criticality").toLowerCase() === "tier1").length,
        watch: aging + replace,
        replace,
        aging,
        vendorCount: vendors.size,
        spend: groupRows.reduce((sum, row) => sum + numeric(row.annualCostUsd), 0),
        topCategories: topCounts(groupRows, "systemCategory").slice(0, 4),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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

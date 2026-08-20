"use client";

import { useMemo, useState } from "react";

import { buildBusinessCapabilityLandscapeView } from "@/lib/visual-system/projections/capability-landscape";
import { buildCapabilityToTechnologyView } from "@/lib/visual-system/projections/capability-to-technology";
import type { ArchitectureView, ArchitectureViewNode } from "@/lib/visual-system/architecture-view-contract";
import type { TechRecordType } from "@/lib/home/preview/types";
import { buildTileLayout, type Tile } from "./architecture-tiles";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The estate as a picture, rendered to the approved Architecture Explorer design.
 *
 * Semantics come from the shared projections, which produce a validated `ArchitectureView`; this
 * file is a rendering profile over that model and decides nothing about what a node means, what is
 * related to what, or where evidence came from. The engineering SVG renderer is a correctness
 * baseline, not the visual target -- the design's own treatment is HTML tiles, and that is what
 * ships.
 *
 * Two design decisions that are load-bearing:
 *
 *  - **L0 is weighted, not a uniform grid.** Footprint is proportional to recorded system count,
 *    so concentration answers itself before a number is read. Grouping and counts are identical to
 *    the card treatment; only the speed of reading changes.
 *  - **L2 declares the relationship once.** A capability supported by thirty-three categories does
 *    not get thirty-three identical `supports` labels -- one pill states the verb at group level,
 *    and every underlying relationship stays in the model.
 *
 * The hatched fill means "this is a group, not a system" and is never decorative.
 */

const HATCH = "repeating-linear-gradient(135deg,rgba(12,26,58,0.5) 0 6px,rgba(12,26,58,0.24) 6px 12px)";
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

  const view: ArchitectureView = useMemo(
    () =>
      capability
        ? buildCapabilityToTechnologyView({ tenantKey, tenantDisplayName, applications, capability, canonicalBuild })
        : buildBusinessCapabilityLandscapeView({
            tenantKey,
            tenantDisplayName,
            applications,
            audienceLevel: "L1_domain",
            canonicalBuild,
          }),
    [capability, tenantKey, tenantDisplayName, applications, canonicalBuild],
  );

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
        <L0Landscape view={view} onDrill={setCapability} />
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

function L0Landscape({ view, onDrill }: { view: ArchitectureView; onDrill: (capability: string) => void }) {
  const layout = useMemo(() => buildTileLayout(view), [view]);

  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
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
        <span style={eyebrow(V4.slate)}>Weighted by estate share</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.stone }}>
          FOOTPRINT IS PROPORTIONAL TO RECORDED SYSTEM COUNT
        </span>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {layout.rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 10, height: row.height }}>
            {row.items.map((tile) => (
              <TileCard key={tile.id} tile={tile} onClick={() => onDrill(tile.label)} />
            ))}
          </div>
        ))}

        {layout.tail ? (
          <div style={{ marginTop: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <span style={{ ...eyebrow(V4.slate), letterSpacing: "0.11em" }}>
                {layout.tail.count} functions below the legible tile width
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: V4.slate }}>
                {layout.tail.systems} SYSTEMS · {layout.tail.sharePct.toFixed(1)}% OF ESTATE · ALL LISTED
              </span>
            </div>
            <div style={{ height: 8, background: V4.cream, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
              <span style={{ display: "block", height: "100%", width: `${layout.tail.sharePct}%`, background: HATCH }} />
            </div>
            <p style={{ margin: "0 0 10px", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55, color: V4.slate, maxWidth: "80ch" }}>
              Too small to hold a legible tile, so share is carried by the bar above rather than by tile area. Every
              function is listed with its own count.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: 8 }}>
              {layout.tail.items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onDrill(t.label)}
                  style={{
                    textAlign: "left",
                    border: `1px solid ${V4.rule}`,
                    borderRadius: 7,
                    background: V4.surface,
                    padding: "11px 13px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: V4.ink }}>
                    {t.label}
                  </span>
                  <span
                    style={{ display: "block", fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: V4.slate, marginTop: 4 }}
                  >
                    {t.systems} · {t.sharePct.toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: V4.slate, maxWidth: "80ch" }}>
        Footprint is proportional to recorded system count. The concentration answers itself before a number is read —
        and the hatch says every tile is a group, not a system.
      </p>

      <Legend />
    </div>
  );
}

function TileCard({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${tile.label} — ${tile.systems} systems`}
      style={{
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: `${tile.widthPct.toFixed(2)}%`,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textAlign: "left",
        border: `1px solid ${V4.navy}`,
        borderRadius: 8,
        background: HATCH_SOFT,
        padding: "14px 16px",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <span style={{ display: "block", minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: SERIF,
            fontSize: "clamp(15px,1.25vw,20px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: V4.ink,
            overflow: "hidden",
          }}
        >
          {tile.label}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            marginTop: 6,
            color: V4.slate,
          }}
        >
          Group of {tile.systems} · {tile.sharePct.toFixed(1)}%
        </span>
      </span>
      <span style={{ display: "block", minWidth: 0 }}>
        {tile.note ? (
          <span style={{ display: "block", fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: V4.slate, overflow: "hidden" }}>
            {tile.note}
          </span>
        ) : null}
        {tile.overlayMark ? (
          <span style={{ display: "block", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.amber, marginTop: 4 }}>
            {tile.overlayMark}
          </span>
        ) : null}
        <span style={{ display: "block", marginTop: 6, fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: V4.blue }}>
          OPEN →
        </span>
      </span>
    </button>
  );
}

function Legend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "18px 34px",
        alignItems: "center",
        margin: "26px 0 0",
        paddingTop: 18,
        borderTop: `1px solid ${V4.rule}`,
      }}
    >
      <LegendKey swatch={<span style={{ width: 34, height: 18, border: `1px solid ${V4.ruleStrong}`, background: HATCH, flexShrink: 0 }} />}>
        Grouped from a field the record holds — never a single system
      </LegendKey>
      <LegendKey swatch={<span style={{ width: 34, height: 18, border: `1px solid ${V4.navy}`, background: V4.surface, flexShrink: 0 }} />}>
        One canonical record
      </LegendKey>
    </div>
  );
}

function LegendKey({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 13, color: V4.slate }}>
      {swatch}
      {children}
    </span>
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

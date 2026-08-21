"use client";

import { useMemo } from "react";

import { renderArchitectureViewSvg } from "@/lib/visual-system/architecture-svg-renderer";
import { resolveArchitectureView, type ArchitectureViewRefusal } from "@/lib/visual-system/resolveArchitectureView";
import type { TechRecordType } from "@/lib/home/preview/types";
import { ArchitectureRefusal } from "./ArchitectureRefusal";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * Current-state data flow: what moves data to what, through what.
 *
 * The estate landscape answers where technology is concentrated. This answers how it is wired --
 * the question a reader actually arrives with, and the one the record could always have answered.
 * The `sourceSystem -> targetSystem` rows sat unread while the page offered four tables and a fact
 * inventory.
 *
 * SVG rather than the HTML tile treatment used elsewhere, because this view's content is edges.
 * Connectors need real routing between lanes; boxes with counts do not.
 */
export function DataFlowPage({
  tenantKey,
  tenantDisplayName,
  integrations,
  applications,
  canonicalBuild,
}: {
  tenantKey: string;
  tenantDisplayName: string;
  integrations: TechRecordType;
  /** Required to resolve endpoints to named systems rather than raw recorded ids. */
  applications?: TechRecordType;
  canonicalBuild?: string;
}) {
  const result = useMemo(
    () =>
      resolveArchitectureView({
        format: "end_to_end_data_flow",
        tenantKey,
        tenantDisplayName,
        integrations,
        applications,
        canonicalBuild,
      }),
    [tenantKey, tenantDisplayName, integrations, applications, canonicalBuild],
  );
  const view = result.status === "ready" ? result.view : null;
  const svg = useMemo(
    () => (view ? renderArchitectureViewSvg(view, { width: 1260 }).svg : ""),
    [view],
  );

  if (result.status === "refused") {
    if (result.refusal.supportedAlternatives.includes("movement_profile")) {
      return (
        <MovementProfile
          tenantDisplayName={tenantDisplayName}
          integrations={integrations}
          refusal={result.refusal}
        />
      );
    }
    return <ArchitectureRefusal refusal={result.refusal} />;
  }
  if (!view) return null;

  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ padding: `46px ${PAGE_X}px 0` }}>
        <style>{`
          @media (max-width: 760px) {
            [data-flow-metrics] { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.blue)}>Current-state data flow · whole estate</span>
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
        <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
          {view.contextLine}
        </p>
      </header>

      <section style={{ padding: `0 ${PAGE_X}px`, marginTop: 26 }}>
        <div
          data-flow-metrics
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 1,
            border: `1px solid ${V4.rule}`,
            background: V4.rule,
          }}
        >
          <FlowMetric value={view.nodes.length.toLocaleString()} label="drawn nodes" />
          <FlowMetric value={view.edges.length.toLocaleString()} label="connector groups" />
          <FlowMetric value={`${view.evidenceCoverage.memberTraceablePct}%`} label="traceable members" />
          <FlowMetric value={view.evidenceCoverage.edgesCanonical.toLocaleString()} label="canonical edges" />
        </div>
      </section>

      <figure style={{ margin: "28px 0 0", padding: `0 ${PAGE_X}px` }}>
        <div
          style={{
            overflowX: "auto",
            border: `1px solid ${V4.ruleStrong}`,
            borderTop: `5px solid ${V4.navy}`,
            borderRadius: 10,
            background: V4.surface,
            boxShadow: "0 16px 36px rgba(12,26,58,0.06)",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <figcaption
          style={{
            margin: "22px 0 0",
            paddingTop: 18,
            borderTop: `1px solid ${V4.rule}`,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(22rem,38%)),1fr))",
            gap: "clamp(18px,3vw,44px)",
          }}
        >
          <div>
            <div style={{ ...eyebrow(V4.slate), marginBottom: 9 }}>How to read this</div>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: V4.slate, maxWidth: "70ch" }}>
              Lanes are role in the flow — what originates data, what carries it, where it lands. A solid box is one
              recorded system; a stacked box stands for many and says how many. Connector weight is the number of
              recorded flows.
            </p>
          </div>
          <div>
            <div style={{ ...eyebrow(V4.slate), marginBottom: 9 }}>Evidence</div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: V4.slate }}>
              {view.evidenceCoverage.aggregationSummary}
            </p>
          </div>
        </figcaption>
      </figure>

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

function FlowMetric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: V4.surface, padding: "14px 16px" }}>
      <span style={{ display: "block", fontFamily: SERIF, fontSize: 27, lineHeight: 1, color: V4.ink }}>{value}</span>
      <span style={{ display: "block", marginTop: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: V4.slate }}>
        {label}
      </span>
    </div>
  );
}

function MovementProfile({
  tenantDisplayName,
  integrations,
  refusal,
}: {
  tenantDisplayName: string;
  integrations: TechRecordType;
  refusal: ArchitectureViewRefusal;
}) {
  const rows = useMemo(() => (integrations.rows ?? []) as Array<Record<string, unknown>>, [integrations.rows]);
  const sources = useMemo(() => countsFor(rows, "sourceSystem"), [rows]);
  const targets = useMemo(() => countsFor(rows, "targetSystem"), [rows]);
  const mechanisms = useMemo(() => countsFor(rows, "integrationType"), [rows]);
  const domains = useMemo(() => countsFor(rows, "dataDomain"), [rows]);
  const quality = useMemo(() => countsFor(rows, "qualityStatus"), [rows]);
  const regulated = rows.filter((row) => /true|yes|phi|hipaa/i.test(String(row.regulatedDataFlag ?? ""))).length;
  const maxMechanism = Math.max(1, ...mechanisms.slice(0, 5).map(([, count]) => count));

  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ padding: `46px ${PAGE_X}px 0` }}>
        <style>{`
          @media (max-width: 980px) {
            [data-movement-map] { grid-template-columns: 1fr !important; }
            [data-movement-arrow] { display: none !important; }
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={eyebrow(V4.green)}>Current-state data movement · whole estate</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: V4.slate, letterSpacing: "-0.01em" }}>
            End-to-end lineage is not established; movement evidence is.
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
            maxWidth: "38ch",
            textWrap: "balance",
          }}
        >
          {rows.length.toLocaleString()} recorded movements show how data is exchanged across {tenantDisplayName}.
        </h1>
        <p style={{ margin: "14px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
          Movement profile · observed · {tenantDisplayName} · consumption and landing proof still gated
        </p>
      </header>

      <section style={{ padding: `0 ${PAGE_X}px`, marginTop: 26 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))",
            gap: 1,
            border: `1px solid ${V4.rule}`,
            background: V4.rule,
          }}
        >
          <FlowMetric value={rows.length.toLocaleString()} label="recorded movements" />
          <FlowMetric value={sources.length.toLocaleString()} label="source systems" />
          <FlowMetric value={targets.length.toLocaleString()} label="targets named" />
          <FlowMetric value={regulated.toLocaleString()} label="regulated flags" />
        </div>
      </section>

      <section style={{ padding: `0 ${PAGE_X}px`, marginTop: 26 }}>
        <div
          data-movement-map
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(150px,0.9fr) 34px minmax(170px,1fr) 34px minmax(170px,1fr) 34px minmax(150px,0.9fr)",
            gap: 8,
            alignItems: "stretch",
            border: `2px solid rgba(29,158,117,0.32)`,
            borderTop: `7px solid ${V4.green}`,
            borderRadius: 10,
            background: "rgba(255,255,255,0.58)",
            padding: 14,
          }}
        >
          <MovementZone index="1" title="Origin systems" eyebrow="source records" tone={V4.navy} items={sources.slice(0, 5)} />
          <MovementArrow label="from" />
          <MovementZone index="2" title="Movement mechanisms" eyebrow="declared patterns" tone={V4.blue} items={mechanisms.slice(0, 5)} max={maxMechanism} />
          <MovementArrow label="through" />
          <MovementZone index="3" title="Targets named" eyebrow="recorded destinations" tone={V4.green} items={targets.slice(0, 5)} />
          <MovementArrow label="toward" />
          <MovementZone index="4" title="Use posture" eyebrow="consumption not proven" tone={V4.amber} items={quality.slice(0, 5)} />
        </div>
      </section>

      <section
        style={{
          padding: `0 ${PAGE_X}px`,
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
          gap: 12,
        }}
      >
        <MovementPanel title="Data domains" detail="Domains carried by the movement rows" items={domains.slice(0, 6)} />
        <MovementPanel title="Why this is not end-to-end" detail={refusal.failedRules.map((rule) => rule.headline).join(" · ")} items={refusal.evidenceNeeded.map((need) => [need.evidenceType, 1])} />
      </section>
    </div>
  );
}

function MovementZone({
  index,
  title,
  eyebrow: zoneEyebrow,
  tone,
  items,
  max,
}: {
  index: string;
  title: string;
  eyebrow: string;
  tone: string;
  items: Array<[string, number]>;
  max?: number;
}) {
  const largest = max ?? Math.max(1, ...items.map(([, count]) => count));
  return (
    <article style={{ minWidth: 0, border: `1px solid ${V4.ruleStrong}`, borderRadius: 8, background: V4.surface, padding: 12 }}>
      <span style={eyebrow(tone)}>{index} · {zoneEyebrow}</span>
      <h2 style={{ margin: "13px 0 0", fontFamily: SERIF, fontSize: 20, lineHeight: 1.14, fontWeight: 500, color: V4.ink }}>
        {title}
      </h2>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {items.map(([label, count]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 38px", gap: 8, alignItems: "baseline" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft }} title={label}>
                {label.replace(/_/g, " ")}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: V4.ink, textAlign: "right" }}>{count.toLocaleString()}</span>
            </div>
            <span style={{ display: "block", height: 4, borderRadius: 99, background: V4.cream, overflow: "hidden", marginTop: 4 }}>
              <span style={{ display: "block", height: "100%", width: `${Math.max(6, (count / largest) * 100)}%`, background: tone }} />
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MovementArrow({ label }: { label: string }) {
  return (
    <div data-movement-arrow style={{ display: "grid", gridTemplateRows: "1fr auto 1fr", alignItems: "center", justifyItems: "center", color: V4.navy }}>
      <span />
      <span aria-hidden="true" style={{ width: 30, height: 1, background: V4.navy, position: "relative", display: "block" }}>
        <span style={{ position: "absolute", right: -1, top: -4, width: 8, height: 8, borderTop: `1px solid ${V4.navy}`, borderRight: `1px solid ${V4.navy}`, transform: "rotate(45deg)" }} />
      </span>
      <span style={{ marginTop: 8, fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", writingMode: "vertical-rl", color: V4.slate }}>
        {label}
      </span>
    </div>
  );
}

function MovementPanel({ title, detail, items }: { title: string; detail: string; items: Array<[string, number]> }) {
  return (
    <article style={{ border: `1px solid ${V4.rule}`, borderRadius: 8, background: V4.surface, padding: "15px 16px" }}>
      <span style={eyebrow(V4.slate)}>{title}</span>
      <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: V4.slate }}>{detail}</p>
      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {items.map(([label, count]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${V4.ruleSoft}`, paddingTop: 7 }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: V4.inkSoft }}>{label.replace(/_/g, " ")}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>{count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function countsFor(rows: Array<Record<string, unknown>>, field: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[field];
    const value = raw === null || raw === undefined || raw === "" ? "(not recorded)" : String(raw);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

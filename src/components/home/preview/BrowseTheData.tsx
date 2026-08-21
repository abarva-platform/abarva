"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { DOMAIN_ORDER, domainLabel } from "./domain-labels";
import type { ContextItem, EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "../v4/tokens";

type Row = (Signal & { origin: "signal" }) | (ContextItem & { origin: "context"; kind?: undefined });
type IndexedRow = Row & { key: string };

export function BrowseTheData({ signalPacket }: { signalPacket: EnterpriseSignalPacket }) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState<"all" | "signal" | "context">("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows: IndexedRow[] = useMemo(
    () => [
      ...signalPacket.signals.map((signal): IndexedRow => ({ ...signal, origin: "signal", key: `signal:${signal.id}` })),
      ...signalPacket.contextItems.map((context): IndexedRow => ({ ...context, origin: "context", key: `context:${context.id}` })),
    ],
    [signalPacket],
  );

  const domainCounts = useMemo(() => buildDomainCounts(rows), [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (domainFilter !== "all" && !row.domains.includes(domainFilter)) return false;
      if (originFilter !== "all" && row.origin !== originFilter) return false;
      if (!q) return true;
      return (
        row.statement.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.domains.some((domain) => domainLabel(domain).toLowerCase().includes(q))
      );
    });
  }, [domainFilter, originFilter, query, rows]);

  const selected = filtered.find((row) => row.key === selectedKey) ?? filtered[0] ?? rows[0];
  const signalCount = rows.filter((row) => row.origin === "signal").length;
  const contextCount = rows.length - signalCount;
  const topDomains = domainCounts.slice(0, 6);
  const maxDomainCount = Math.max(1, ...topDomains.map((domain) => domain.count));

  return (
    <section style={{ padding: `46px ${PAGE_X}px 72px` }}>
      <style>{`
        @media (max-width: 1160px) {
          [data-fact-layout] { grid-template-columns: 1fr !important; }
          [data-fact-detail] { position: static !important; }
          [data-fact-command] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          [data-fact-metrics], [data-fact-controls] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={{ maxWidth: 980 }}>
        <span style={eyebrow(V4.blue)}>Browse the record</span>
        <h1 style={titleStyle}>Fact-level evidence behind the Home narrative</h1>
        <p style={ledeStyle}>
          Search the packet, filter by domain, and inspect the selected fact without leaving the
          page. This is the evidence layer behind the chapters, not another chapter.
        </p>
      </header>

      <section data-fact-metrics style={metricGridStyle}>
        <Metric value={rows.length.toLocaleString()} label="facts in packet" />
        <Metric value={signalCount.toLocaleString()} label="deterministic signals" />
        <Metric value={contextCount.toLocaleString()} label="governed context facts" />
        <Metric value={domainCounts.length.toLocaleString()} label="domains represented" />
      </section>

      <section data-fact-command style={commandStripStyle}>
        <div>
          <span style={eyebrow(V4.green)}>Domain signal map</span>
          <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: V4.slate }}>
            The largest evidence families stay visible while search and filters narrow the fact list.
          </p>
        </div>
        <div style={domainSparkGridStyle}>
          {topDomains.map(({ domain, count }) => (
            <button
              key={domain}
              type="button"
              onClick={() => setDomainFilter(domainFilter === domain ? "all" : domain)}
              style={{
                ...domainSparkStyle,
                borderColor: domainFilter === domain ? "rgba(0,102,204,0.45)" : V4.rule,
                background: domainFilter === domain ? "rgba(0,102,204,0.055)" : V4.surface,
              }}
            >
              <span style={domainSparkLabelStyle}>{domainLabel(domain)}</span>
              <span style={domainSparkTrackStyle}>
                <span style={{ ...domainSparkFillStyle, width: `${Math.max(7, (count / maxDomainCount) * 100)}%` }} />
              </span>
              <span style={domainSparkCountStyle}>{count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </section>

      <div data-fact-controls style={controlsStyle}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search facts, IDs, or domains"
          aria-label="Search facts"
          style={searchStyle}
        />
        <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} aria-label="Filter by domain" style={selectStyle}>
          <option value="all">All domains</option>
          {domainCounts.map(({ domain }) => (
            <option key={domain} value={domain}>
              {domainLabel(domain)}
            </option>
          ))}
        </select>
        <select
          value={originFilter}
          onChange={(event) => setOriginFilter(event.target.value as "all" | "signal" | "context")}
          aria-label="Filter by fact type"
          style={selectStyle}
        >
          <option value="all">All fact types</option>
          <option value="signal">Signals</option>
          <option value="context">Governed facts</option>
        </select>
      </div>

      <div data-fact-layout style={layoutStyle}>
        <aside style={{ minWidth: 0 }}>
          <div style={sectionHeaderStyle}>
            <span style={eyebrow(V4.slate)}>Domains</span>
            <span style={monoStyle}>{filtered.length.toLocaleString()} shown</span>
          </div>
          <div style={domainRailStyle}>
            <FilterButton label="All domains" count={rows.length} active={domainFilter === "all"} onClick={() => setDomainFilter("all")} />
            {domainCounts.map(({ domain, count }) => (
              <FilterButton
                key={domain}
                label={domainLabel(domain)}
                count={count}
                active={domainFilter === domain}
                onClick={() => setDomainFilter(domainFilter === domain ? "all" : domain)}
              />
            ))}
          </div>
        </aside>

        <section style={{ minWidth: 0 }}>
          <div style={sectionHeaderStyle}>
            <span style={eyebrow(V4.slate)}>Matched facts</span>
            <span style={monoStyle}>{filtered.length.toLocaleString()} of {rows.length.toLocaleString()}</span>
          </div>
          <div style={listStyle}>
            {filtered.slice(0, 80).map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setSelectedKey(row.key)}
                style={{
                  ...factButtonStyle,
                  background: selected?.key === row.key ? "rgba(0,102,204,0.055)" : V4.surface,
                  borderLeftColor: selected?.key === row.key ? V4.blue : "transparent",
                }}
              >
                <span style={factMetaStyle}>
                  <span>{row.id}</span>
                  <span>{row.origin === "signal" ? row.kind : "governed fact"}</span>
                  <span>{row.domains.map(domainLabel).slice(0, 2).join(" / ")}</span>
                </span>
                <span style={factTextStyle}>{row.statement}</span>
              </button>
            ))}
            {filtered.length === 0 ? <p style={emptyStyle}>No facts match the current filters.</p> : null}
          </div>
        </section>

        <aside data-fact-detail style={detailStyle}>
          {selected ? (
            <>
              <span style={eyebrow(selected.origin === "signal" ? V4.blue : V4.green)}>
                {selected.origin === "signal" ? "Selected signal" : "Selected governed fact"}
              </span>
              <h2 style={detailTitleStyle}>{selected.id}</h2>
              <p style={detailStatementStyle}>{selected.statement}</p>
              <div style={detailMetaGridStyle}>
                <Detail label="Type" value={selected.origin === "signal" ? selected.kind : "governed fact"} />
                <Detail label="Domains" value={selected.domains.map(domainLabel).join(", ")} />
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function buildDomainCounts(rows: IndexedRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const domain of row.domains) counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  const ordered = [
    ...DOMAIN_ORDER.filter((domain) => counts.has(domain)),
    ...Array.from(counts.keys()).filter((domain) => !DOMAIN_ORDER.includes(domain)).sort(),
  ];
  return ordered.map((domain) => ({ domain, count: counts.get(domain) ?? 0 }));
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={metricStyle}>
      <span style={metricValueStyle}>{value}</span>
      <span style={metricLabelStyle}>{label}</span>
    </div>
  );
}

function FilterButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...filterButtonStyle,
        background: active ? "rgba(0,102,204,0.055)" : V4.surface,
        borderColor: active ? "rgba(0,102,204,0.42)" : V4.rule,
      }}
    >
      <span style={filterLabelStyle}>{label}</span>
      <span style={filterCountStyle}>{count.toLocaleString()}</span>
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

const titleStyle = { margin: "14px 0 0", fontFamily: SERIF, fontSize: "clamp(30px,2.8vw,44px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, color: V4.ink, textWrap: "balance" } satisfies CSSProperties;
const ledeStyle = { margin: "18px 0 0", maxWidth: "62ch", fontFamily: SANS, fontSize: 16, lineHeight: 1.62, color: V4.slate } satisfies CSSProperties;
const metricGridStyle = { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 1, marginTop: 26, border: `1px solid ${V4.rule}`, background: V4.rule } satisfies CSSProperties;
const metricStyle = { padding: "15px 16px", background: V4.surface } satisfies CSSProperties;
const metricValueStyle = { display: "block", fontFamily: SERIF, fontSize: 27, lineHeight: 1, color: V4.ink } satisfies CSSProperties;
const metricLabelStyle = { display: "block", marginTop: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: V4.slate } satisfies CSSProperties;
const commandStripStyle = { display: "grid", gridTemplateColumns: "minmax(220px,0.72fr) minmax(0,1fr)", gap: 18, alignItems: "start", marginTop: 24, padding: 16, border: `1px solid ${V4.rule}`, borderRadius: 10, background: "rgba(255,255,255,0.72)" } satisfies CSSProperties;
const domainSparkGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: 8 } satisfies CSSProperties;
const domainSparkStyle = { minWidth: 0, border: "1px solid", borderRadius: 8, padding: "10px 11px", textAlign: "left", cursor: "pointer" } satisfies CSSProperties;
const domainSparkLabelStyle = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SANS, fontSize: 12.5, color: V4.ink } satisfies CSSProperties;
const domainSparkTrackStyle = { display: "block", height: 5, borderRadius: 99, background: V4.cream, overflow: "hidden", marginTop: 8 } satisfies CSSProperties;
const domainSparkFillStyle = { display: "block", height: "100%", borderRadius: 99, background: V4.blue } satisfies CSSProperties;
const domainSparkCountStyle = { display: "block", marginTop: 7, fontFamily: MONO, fontSize: 11, color: V4.slate } satisfies CSSProperties;
const controlsStyle = { display: "grid", gridTemplateColumns: "minmax(260px,1fr) 250px 190px", gap: 10, marginTop: 22 } satisfies CSSProperties;
const searchStyle = { minWidth: 0, padding: "10px 12px", border: `1px solid ${V4.ruleStrong}`, borderRadius: 7, background: V4.surface, fontFamily: SANS, fontSize: 13.5, color: V4.ink } satisfies CSSProperties;
const selectStyle = { padding: "10px 12px", border: `1px solid ${V4.ruleStrong}`, borderRadius: 7, background: V4.surface, fontFamily: SANS, fontSize: 13.5, color: V4.ink } satisfies CSSProperties;
const layoutStyle = { display: "grid", gridTemplateColumns: "260px minmax(0,1fr) 360px", gap: 24, alignItems: "start", marginTop: 24 } satisfies CSSProperties;
const sectionHeaderStyle = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginBottom: 10 } satisfies CSSProperties;
const monoStyle = { fontFamily: MONO, fontSize: 11, color: V4.slate } satisfies CSSProperties;
const domainRailStyle = { display: "grid", gap: 7 } satisfies CSSProperties;
const filterButtonStyle = { display: "grid", gridTemplateColumns: "minmax(0,1fr) 42px", gap: 10, alignItems: "center", width: "100%", border: "1px solid", borderRadius: 7, padding: "9px 10px", textAlign: "left", cursor: "pointer" } satisfies CSSProperties;
const filterLabelStyle = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SANS, fontSize: 12.5, color: V4.inkSoft } satisfies CSSProperties;
const filterCountStyle = { fontFamily: MONO, fontSize: 11, color: V4.blue, textAlign: "right" } satisfies CSSProperties;
const listStyle = { border: `1px solid ${V4.rule}`, borderRadius: 8, overflow: "hidden", background: V4.surface } satisfies CSSProperties;
const factButtonStyle = { display: "block", width: "100%", border: "none", borderLeft: "3px solid transparent", borderBottom: `1px solid ${V4.rule}`, padding: "11px 13px", textAlign: "left", cursor: "pointer" } satisfies CSSProperties;
const factMetaStyle = { display: "flex", gap: 10, flexWrap: "wrap", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: V4.slate } satisfies CSSProperties;
const factTextStyle = { display: "block", marginTop: 4, fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, color: V4.inkSoft } satisfies CSSProperties;
const emptyStyle = { margin: 0, padding: 18, fontFamily: SANS, fontSize: 13.5, color: V4.slate } satisfies CSSProperties;
const detailStyle = { position: "sticky", top: 24, borderLeft: `1px solid ${V4.rule}`, paddingLeft: 22, minWidth: 0 } satisfies CSSProperties;
const detailTitleStyle = { margin: "10px 0 0", fontFamily: SERIF, fontSize: 28, fontWeight: 500, letterSpacing: "-0.026em", color: V4.ink } satisfies CSSProperties;
const detailStatementStyle = { margin: "14px 0 0", fontFamily: SANS, fontSize: 16, lineHeight: 1.55, color: V4.inkSoft } satisfies CSSProperties;
const detailMetaGridStyle = { display: "grid", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${V4.rule}` } satisfies CSSProperties;
const detailItemStyle = { display: "grid", gap: 3 } satisfies CSSProperties;
const detailLabelStyle = { fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: V4.slate } satisfies CSSProperties;
const detailValueStyle = { fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, color: V4.inkSoft } satisfies CSSProperties;

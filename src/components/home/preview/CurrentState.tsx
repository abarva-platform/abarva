"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { DOMAIN_ORDER, domainLabel } from "./domain-labels";
import type { ContextItem, EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "../v4/tokens";

type Row = (Signal & { origin: "signal" }) | (ContextItem & { origin: "context"; kind?: undefined });

interface DomainProfile {
  domain: string;
  label: string;
  rows: Row[];
  signals: number;
  governedFacts: number;
  kinds: Array<[string, number]>;
}

const PRIORITY_DOMAINS = [
  "application_system",
  "data_asset_or_integration",
  "infrastructure_platform",
  "vendor_contract",
  "business_function",
];

export function CurrentState({ signalPacket }: { signalPacket: EnterpriseSignalPacket }) {
  const rows: Row[] = useMemo(
    () => [
      ...signalPacket.signals.map((signal): Row => ({ ...signal, origin: "signal" })),
      ...signalPacket.contextItems.map((context): Row => ({ ...context, origin: "context" })),
    ],
    [signalPacket],
  );

  const profiles = useMemo(() => buildProfiles(rows), [rows]);
  const [selectedDomain, setSelectedDomain] = useState(
    profiles.find((profile) => PRIORITY_DOMAINS.includes(profile.domain))?.domain ?? profiles[0]?.domain ?? "",
  );
  const selected = profiles.find((profile) => profile.domain === selectedDomain) ?? profiles[0];
  const priorityCoverage = profiles
    .filter((profile) => PRIORITY_DOMAINS.includes(profile.domain))
    .reduce((sum, profile) => sum + profile.rows.length, 0);
  const totalMemberships = profiles.reduce((sum, profile) => sum + profile.rows.length, 0);
  const priorityProfiles = PRIORITY_DOMAINS.map((domain) => profiles.find((profile) => profile.domain === domain)).filter(
    (profile): profile is DomainProfile => Boolean(profile),
  );
  const largestPriority = Math.max(1, ...priorityProfiles.map((profile) => profile.rows.length));

  return (
    <section style={{ padding: `46px ${PAGE_X}px 72px` }}>
      <style>{`
        @media (max-width: 1160px) {
          [data-current-state-layout] { grid-template-columns: 1fr !important; }
          [data-current-state-side] { position: static !important; }
        }
        @media (max-width: 760px) {
          [data-current-state-metrics] { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }
      `}</style>

      <header style={{ maxWidth: 980 }}>
        <span style={eyebrow(V4.green)}>Current state</span>
        <h1 style={titleStyle}>Loaded enterprise context, by object family</h1>
        <p style={ledeStyle}>
          The packet is grouped by what the record can actually substantiate: systems, flows,
          platforms, contracts, functions, risks, programs, metrics and evidence. Facts that belong
          to more than one family are counted in each family they support.
        </p>
      </header>

      <section data-current-state-metrics style={metricGridStyle}>
        <Metric value={rows.length.toLocaleString()} label="unique facts and signals" />
        <Metric value={profiles.length.toLocaleString()} label="loaded object families" />
        <Metric value={totalMemberships.toLocaleString()} label="domain memberships" />
        <Metric value={priorityCoverage.toLocaleString()} label="core estate facts" />
      </section>

      <section style={pulseStyle}>
        <div style={sectionHeaderStyle}>
          <span style={eyebrow(V4.green)}>Object family pulse</span>
          <span style={monoStyle}>core context used by Home</span>
        </div>
        <div style={pulseGridStyle}>
          {priorityProfiles.map((profile, index) => (
            <button
              key={profile.domain}
              type="button"
              onClick={() => setSelectedDomain(profile.domain)}
              style={{
                ...pulseCardStyle,
                borderColor: selected?.domain === profile.domain ? "rgba(29,158,117,0.58)" : V4.rule,
                background: selected?.domain === profile.domain ? "rgba(29,158,117,0.06)" : V4.surface,
              }}
            >
              <span style={pulseIndexStyle}>{String(index + 1).padStart(2, "0")}</span>
              <strong style={pulseTitleStyle}>{profile.label}</strong>
              <span style={pulseMetaStyle}>
                {profile.signals.toLocaleString()} signals · {profile.governedFacts.toLocaleString()} governed facts
              </span>
              <span style={pulseTrackStyle}>
                <span style={{ ...pulseFillStyle, width: `${Math.max(8, (profile.rows.length / largestPriority) * 100)}%` }} />
              </span>
              <span style={pulseCountStyle}>{profile.rows.length.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </section>

      <div data-current-state-layout style={layoutStyle}>
        <section style={{ minWidth: 0 }}>
          <div style={sectionHeaderStyle}>
            <span style={eyebrow(V4.slate)}>Coverage ledger</span>
            <span style={monoStyle}>{profiles.length} families</span>
          </div>
          <div style={ledgerStyle}>
            {profiles.map((profile) => (
              <button
                key={profile.domain}
                type="button"
                onClick={() => setSelectedDomain(profile.domain)}
                style={{
                  ...ledgerRowStyle,
                  background: selected?.domain === profile.domain ? "rgba(0,102,204,0.055)" : V4.surface,
                  borderLeftColor: selected?.domain === profile.domain ? V4.blue : "transparent",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={rowTitleStyle}>{profile.label}</strong>
                  <span style={rowMetaStyle}>
                    {profile.signals.toLocaleString()} signals · {profile.governedFacts.toLocaleString()} governed facts
                  </span>
                </span>
                <span style={rowCountStyle}>{profile.rows.length.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          {selected ? (
            <>
              <div style={sectionHeaderStyle}>
                <span style={eyebrow(V4.blue)}>{selected.label}</span>
                <span style={monoStyle}>{selected.rows.length.toLocaleString()} linked facts</span>
              </div>
              <div style={detailShellStyle}>
                <div style={kindGridStyle}>
                  {selected.kinds.slice(0, 4).map(([kind, count]) => (
                    <div key={kind} style={kindStyle}>
                      <span style={kindValueStyle}>{count.toLocaleString()}</span>
                      <span style={kindLabelStyle}>{kind.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>

                <div style={factListStyle}>
                  {selected.rows.slice(0, 12).map((row) => (
                    <article key={`${row.origin}-${row.id}`} style={factStyle}>
                      <div style={factMetaStyle}>
                        <span>{row.id}</span>
                        <span>{row.origin === "signal" ? row.kind : "governed fact"}</span>
                      </div>
                      <p style={factTextStyle}>{row.statement}</p>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </section>

        <aside data-current-state-side style={sideStyle}>
          <span style={eyebrow(V4.slate)}>Readiness cues</span>
          <Cue label="Architecture" value={countFor(profiles, "application_system")} />
          <Cue label="Data flow" value={countFor(profiles, "data_asset_or_integration")} />
          <Cue label="Commercial context" value={countFor(profiles, "vendor_contract")} />
          <Cue label="Infrastructure context" value={countFor(profiles, "infrastructure_platform")} />
        </aside>
      </div>
    </section>
  );
}

function buildProfiles(rows: Row[]): DomainProfile[] {
  const byDomain = new Map<string, Row[]>();
  for (const row of rows) {
    for (const domain of row.domains) {
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain)!.push(row);
    }
  }

  const orderedDomains = [
    ...DOMAIN_ORDER.filter((domain) => byDomain.has(domain)),
    ...Array.from(byDomain.keys()).filter((domain) => !DOMAIN_ORDER.includes(domain)).sort(),
  ];

  return orderedDomains.map((domain) => {
    const domainRows = byDomain.get(domain) ?? [];
    const kindCounts = new Map<string, number>();
    for (const row of domainRows) {
      const kind = row.origin === "signal" ? row.kind : "governed_fact";
      kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
    }
    return {
      domain,
      label: domainLabel(domain),
      rows: domainRows,
      signals: domainRows.filter((row) => row.origin === "signal").length,
      governedFacts: domainRows.filter((row) => row.origin === "context").length,
      kinds: [...kindCounts.entries()].sort((a, b) => b[1] - a[1]),
    };
  });
}

function countFor(profiles: DomainProfile[], domain: string): number {
  return profiles.find((profile) => profile.domain === domain)?.rows.length ?? 0;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={metricStyle}>
      <span style={metricValueStyle}>{value}</span>
      <span style={metricLabelStyle}>{label}</span>
    </div>
  );
}

function Cue({ label, value }: { label: string; value: number }) {
  return (
    <div style={cueStyle}>
      <span style={{ fontFamily: SANS, fontSize: 13, color: V4.inkSoft }}>{label}</span>
      <strong style={{ fontFamily: MONO, fontSize: 13, color: V4.blue }}>{value.toLocaleString()}</strong>
    </div>
  );
}

const titleStyle = {
  margin: "14px 0 0",
  fontFamily: SERIF,
  fontSize: "clamp(30px,2.8vw,44px)",
  fontWeight: 500,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  color: V4.ink,
  textWrap: "balance",
} satisfies CSSProperties;

const ledeStyle = {
  margin: "18px 0 0",
  maxWidth: "64ch",
  fontFamily: SANS,
  fontSize: 16,
  lineHeight: 1.62,
  color: V4.slate,
} satisfies CSSProperties;

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 1,
  marginTop: 26,
  border: `1px solid ${V4.rule}`,
  background: V4.rule,
} satisfies CSSProperties;

const pulseStyle = { marginTop: 24 } satisfies CSSProperties;
const pulseGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 10 } satisfies CSSProperties;
const pulseCardStyle = { minWidth: 0, border: "1px solid", borderRadius: 8, padding: "13px 14px", textAlign: "left", cursor: "pointer", boxShadow: "0 10px 24px rgba(12,26,58,0.045)" } satisfies CSSProperties;
const pulseIndexStyle = { display: "block", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", color: V4.green } satisfies CSSProperties;
const pulseTitleStyle = { display: "block", marginTop: 8, fontFamily: SANS, fontSize: 13.5, lineHeight: 1.25, color: V4.ink, minHeight: 34 } satisfies CSSProperties;
const pulseMetaStyle = { display: "block", marginTop: 8, fontFamily: MONO, fontSize: 10, lineHeight: 1.45, color: V4.slate } satisfies CSSProperties;
const pulseTrackStyle = { display: "block", height: 5, borderRadius: 999, background: V4.cream, overflow: "hidden", marginTop: 12 } satisfies CSSProperties;
const pulseFillStyle = { display: "block", height: "100%", borderRadius: 999, background: V4.green } satisfies CSSProperties;
const pulseCountStyle = { display: "block", marginTop: 8, fontFamily: SERIF, fontSize: 24, lineHeight: 1, color: V4.ink } satisfies CSSProperties;
const metricStyle = { padding: "15px 16px", background: V4.surface } satisfies CSSProperties;
const metricValueStyle = { display: "block", fontFamily: SERIF, fontSize: 27, lineHeight: 1, color: V4.ink } satisfies CSSProperties;
const metricLabelStyle = { display: "block", marginTop: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: V4.slate } satisfies CSSProperties;
const layoutStyle = { display: "grid", gridTemplateColumns: "340px minmax(0,1fr) 260px", gap: 28, alignItems: "start", marginTop: 26 } satisfies CSSProperties;
const sectionHeaderStyle = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginBottom: 10 } satisfies CSSProperties;
const monoStyle = { fontFamily: MONO, fontSize: 11, color: V4.slate } satisfies CSSProperties;
const ledgerStyle = { border: `1px solid ${V4.rule}`, borderRadius: 8, overflow: "hidden", background: V4.surface } satisfies CSSProperties;
const ledgerRowStyle = { width: "100%", display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px", gap: 12, alignItems: "center", textAlign: "left", border: "none", borderLeft: "3px solid transparent", borderBottom: `1px solid ${V4.rule}`, padding: "11px 13px", cursor: "pointer" } satisfies CSSProperties;
const rowTitleStyle = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SANS, fontSize: 13.5, color: V4.ink } satisfies CSSProperties;
const rowMetaStyle = { display: "block", marginTop: 3, fontFamily: MONO, fontSize: 10.5, color: V4.slate } satisfies CSSProperties;
const rowCountStyle = { fontFamily: MONO, fontSize: 12, color: V4.blue, textAlign: "right" } satisfies CSSProperties;
const detailShellStyle = { border: `1px solid ${V4.rule}`, borderRadius: 8, background: V4.surface, padding: 16 } satisfies CSSProperties;
const kindGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))", gap: 1, border: `1px solid ${V4.rule}`, background: V4.rule } satisfies CSSProperties;
const kindStyle = { padding: "12px 13px", background: V4.cream } satisfies CSSProperties;
const kindValueStyle = { display: "block", fontFamily: SERIF, fontSize: 23, color: V4.ink, lineHeight: 1 } satisfies CSSProperties;
const kindLabelStyle = { display: "block", marginTop: 6, fontFamily: MONO, fontSize: 10, color: V4.slate, textTransform: "uppercase", letterSpacing: "0.07em" } satisfies CSSProperties;
const factListStyle = { display: "grid", gap: 0, marginTop: 14, borderTop: `1px solid ${V4.rule}` } satisfies CSSProperties;
const factStyle = { padding: "11px 0", borderBottom: `1px solid ${V4.rule}` } satisfies CSSProperties;
const factMetaStyle = { display: "flex", gap: 10, flexWrap: "wrap", fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: V4.slate } satisfies CSSProperties;
const factTextStyle = { margin: "4px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: V4.inkSoft } satisfies CSSProperties;
const sideStyle = { position: "sticky", top: 24, display: "grid", gap: 8, borderLeft: `1px solid ${V4.rule}`, paddingLeft: 20 } satisfies CSSProperties;
const cueStyle = { display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0", borderBottom: `1px solid ${V4.rule}` } satisfies CSSProperties;

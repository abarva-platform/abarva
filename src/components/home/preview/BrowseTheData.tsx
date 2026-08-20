"use client";

import { useMemo, useState } from "react";

import { domainLabel } from "./domain-labels";
import { HOME_HEX } from "./visuals/home-chart-kit";
import type { ContextItem, EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";

type Row = (Signal & { origin: "signal" }) | (ContextItem & { origin: "context"; kind?: undefined });

/**
 * The factual explorer beneath the narrative -- every deterministic signal and governed context
 * item in the tenant's packet, searchable and filterable by domain, independent of whether a
 * chapter happened to cite it. This is what closes the composition loop the workstream named:
 * thesis -> chapter -> insight -> fact -> visual -> evidence -> exploration. A reader who doesn't
 * trust a chapter's synthesis can always drop down here and look at the raw material themselves.
 */
export function BrowseTheData({ signalPacket }: { signalPacket: EnterpriseSignalPacket }) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const rows: Row[] = useMemo(
    () => [
      ...signalPacket.signals.map((s): Row => ({ ...s, origin: "signal" })),
      ...signalPacket.contextItems.map((c): Row => ({ ...c, origin: "context" })),
    ],
    [signalPacket],
  );

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const d of r.domains) set.add(d);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (domainFilter !== "all" && !r.domains.includes(domainFilter)) return false;
      if (!q) return true;
      return r.statement.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    });
  }, [rows, query, domainFilter]);

  return (
    <section style={{ maxWidth: 1040, padding: "40px 40px 96px" }}>
      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.teal }}>
        Browse the data
      </p>
      <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-body-serif)", fontSize: 26, color: HOME_HEX.textPrimary }}>
        Every deterministic fact behind this narrative
      </h2>
      <p style={{ margin: "0 0 24px", fontFamily: "var(--font-body-sans)", fontSize: 14, color: HOME_HEX.textMuted }}>
        {rows.length} signals and governed facts, whether or not a chapter cited them. Search or filter to inspect the
        raw material directly.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search facts…"
          aria-label="Search facts"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: `1px solid ${HOME_HEX.border}`,
            fontFamily: "var(--font-body-sans)",
            fontSize: 13.5,
          }}
        />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          aria-label="Filter by domain"
          style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${HOME_HEX.border}`, fontFamily: "var(--font-body-sans)", fontSize: 13.5 }}
        >
          <option value="all">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {domainLabel(d)}
            </option>
          ))}
        </select>
      </div>

      <p style={{ margin: "0 0 12px", fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.textDisabled }}>
        {filtered.length} of {rows.length} shown
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${HOME_HEX.border}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
              <span style={{ fontFamily: "var(--font-body-mono)", fontSize: 10.5, color: HOME_HEX.textDisabled }}>{r.id}</span>
              <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 10, fontWeight: 600, color: r.origin === "signal" ? HOME_HEX.navy : HOME_HEX.textDisabled }}>
                {r.origin === "signal" ? (r.kind ?? "signal").toUpperCase() : "GOVERNED FACT"}
              </span>
              <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 10, color: HOME_HEX.textDisabled, marginLeft: "auto" }}>
                {r.domains.map(domainLabel).join(", ")}
              </span>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-body-sans)", fontSize: 13, lineHeight: 1.5, color: HOME_HEX.textSecondary }}>
              {r.statement}
            </p>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body-sans)", fontSize: 13, color: HOME_HEX.textMuted, fontStyle: "italic" }}>
            No facts match this search.
          </p>
        ) : null}
      </div>
    </section>
  );
}

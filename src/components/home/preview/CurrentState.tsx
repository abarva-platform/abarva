"use client";

import { useMemo, useState } from "react";

import { DOMAIN_ORDER, domainLabel } from "./domain-labels";
import { HOME_HEX } from "./visuals/home-chart-kit";
import type { ContextItem, EnterpriseSignalPacket, Signal } from "@/lib/home/preview/types";

type Row = (Signal & { origin: "signal" }) | (ContextItem & { origin: "context"; kind?: undefined });

/** Categories expanded by default -- the ones that actually answer "what does the current
 * technology/operating estate look like," since a reviewer asking for a current-state view is
 * usually starting from that question, not from AI-value interview evidence or evidence sources.
 * Everything else is one click away, not hidden. */
const DEFAULT_EXPANDED = new Set([
  "application_system",
  "infrastructure_platform",
  "vendor_contract",
  "data_asset_or_integration",
  "workforce_role",
]);

/**
 * "What has been loaded" as a real current-state survey, not a flat searchable list (that's
 * BrowseTheData's job). Every signal and context item grouped under every domain it belongs to,
 * ordered enterprise-identity -> technology -> people -> risk/programs/AI, collapsed by default
 * except the categories a reviewer asking "what does the estate look like" would open first.
 */
export function CurrentState({ signalPacket }: { signalPacket: EnterpriseSignalPacket }) {
  const rows: Row[] = useMemo(
    () => [
      ...signalPacket.signals.map((s): Row => ({ ...s, origin: "signal" })),
      ...signalPacket.contextItems.map((c): Row => ({ ...c, origin: "context" })),
    ],
    [signalPacket],
  );

  const byDomain = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      for (const domain of row.domains) {
        if (!map.has(domain)) map.set(domain, []);
        map.get(domain)!.push(row);
      }
    }
    return map;
  }, [rows]);

  const orderedDomains = [
    ...DOMAIN_ORDER.filter((d) => byDomain.has(d)),
    ...Array.from(byDomain.keys()).filter((d) => !DOMAIN_ORDER.includes(d)).sort(),
  ];

  const [expanded, setExpanded] = useState<Set<string>>(new Set(DEFAULT_EXPANDED));
  function toggle(domain: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  return (
    <div style={{ padding: "40px 40px 96px" }}>
      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.teal }}>
        Current state
      </p>
      <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-body-serif)", fontSize: 26, color: HOME_HEX.textPrimary }}>
        What has been loaded for this enterprise
      </h2>
      <p style={{ margin: "0 0 28px", fontFamily: "var(--font-body-sans)", fontSize: 14, color: HOME_HEX.textMuted, maxWidth: 760 }}>
        Every domain the compiled context covers, with its real fact count -- the estate survey
        underneath the narrative. Open a category to see the individual facts; a fact spanning
        multiple domains (e.g. a vendor concentration that is also a risk) appears in each one it
        genuinely belongs to.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {orderedDomains.map((domain) => {
          const domainRows = byDomain.get(domain) ?? [];
          const isOpen = expanded.has(domain);
          return (
            <div key={domain} style={{ border: `1px solid ${HOME_HEX.border}`, borderRadius: 10, background: "#FFFFFF", alignSelf: "start" }}>
              <button
                type="button"
                onClick={() => toggle(domain)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 14.5, fontWeight: 600, color: HOME_HEX.textPrimary }}>
                  {domainLabel(domain)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body-mono)",
                      fontSize: 11,
                      color: HOME_HEX.textMuted,
                      background: HOME_HEX.navyDim,
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {domainRows.length}
                  </span>
                  <span style={{ color: HOME_HEX.textDisabled, fontSize: 12 }}>{isOpen ? "−" : "+"}</span>
                </span>
              </button>
              {isOpen ? (
                <div style={{ borderTop: `1px solid ${HOME_HEX.border}`, padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
                  {domainRows.map((row) => (
                    <div key={row.id}>
                      <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                        <span style={{ fontFamily: "var(--font-body-mono)", fontSize: 10, color: HOME_HEX.textDisabled }}>{row.id}</span>
                        {row.origin === "signal" ? (
                          <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 9.5, fontWeight: 600, color: HOME_HEX.navy }}>
                            {row.kind.toUpperCase()}
                          </span>
                        ) : null}
                      </div>
                      <p style={{ margin: "2px 0 0", fontFamily: "var(--font-body-sans)", fontSize: 12.5, lineHeight: 1.5, color: HOME_HEX.textSecondary }}>
                        {row.statement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

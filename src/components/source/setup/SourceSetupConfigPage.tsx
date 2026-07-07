import type { CSSProperties, ReactNode } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";

// ─────────────────────────────────────────────────────────────────────────────
// Source configuration — the flag-gated (`source_analytics`) redesign of the
// Source Setup tab. Matches the standalone "Source configuration" surface: an
// eyebrow + serif H1 + sub-line, then three list-row cards (icon · title ·
// sub-line · status chip · Manage).
//
// Honesty contract: this repo has no tenant-wide "connected evidence sources"
// registry and no tenant "default archetype" config store, so every card
// renders an HONEST placeholder chip ("NOT CONFIGURED") unless a real, sourced
// value is passed in via `evidenceSources` / `archetypeDefault`. We never
// fabricate a "2 of 4 connected" count with no backing.
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceEvidenceSourcesConfig {
  /** Number of evidence connectors currently connected. */
  connected: number;
  /** Total number of evidence connectors offered. */
  total: number;
}

export interface SourceSetupConfigPageProps {
  tenantName: string;
  /**
   * Real connected-evidence-source counts, when sourceable. Omit (or pass
   * null) to render the honest "not configured" placeholder — never a
   * fabricated number.
   */
  evidenceSources?: SourceEvidenceSourcesConfig | null;
  /**
   * The tenant's default archetype label for a new event (e.g. "AMS"), when
   * sourceable. Omit / null → honest placeholder.
   */
  archetypeDefault?: string | null;
  /**
   * Whether approver routing is configured for this tenant, when sourceable.
   * Omit / null → honest placeholder.
   */
  approversConfigured?: boolean | null;
}

const PLACEHOLDER_CHIP = "NOT CONFIGURED";

const PAGE: CSSProperties = {
  background: ANALYTICS.PAGE_BG,
  flex: 1,
  overflowY: "auto",
  padding: "32px clamp(18px, 4vw, 48px)",
  fontFamily: ANALYTICS.SANS,
  color: ANALYTICS.INK,
};

const EYEBROW: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  color: ANALYTICS.FAINT,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

interface CardRow {
  key: string;
  icon: string;
  title: string;
  sub: string;
  /** Right-aligned status chip text. */
  chip: string;
  /** Whether the chip reflects a real, sourced value vs. an honest placeholder. */
  chipReal: boolean;
}

function chipStyle(real: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid",
    borderColor: real ? ANALYTICS.GREEN : ANALYTICS.LINE,
    background: real ? ANALYTICS.GREEN_TINT : ANALYTICS.SOFT,
    color: real ? ANALYTICS.GREEN_TEXT : ANALYTICS.MUTED,
    fontFamily: ANALYTICS.MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
}

function ListRowCard({ row }: { row: CardRow }): ReactNode {
  return (
    <article
      aria-label={row.title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 20px",
        background: ANALYTICS.CARD,
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: ANALYTICS.RADIUS,
        boxShadow: ANALYTICS.SHADOW_SM,
      }}
    >
      <div
        aria-hidden
        style={{
          flex: "0 0 auto",
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          borderRadius: ANALYTICS.RADIUS_SM,
          background: ANALYTICS.SOFT,
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          fontSize: 18,
        }}
      >
        {row.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 3 }}>
        <strong style={{ fontSize: 14, color: ANALYTICS.INK }}>
          {row.title}
        </strong>
        <span style={{ fontSize: 12.5, color: ANALYTICS.MUTED, lineHeight: 1.5 }}>
          {row.sub}
        </span>
      </div>
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={chipStyle(row.chipReal)}>{row.chip}</span>
        <button
          type="button"
          style={{
            appearance: "none",
            cursor: "pointer",
            border: `1px solid ${ANALYTICS.INK}`,
            background: ANALYTICS.INK,
            color: "#ffffff",
            borderRadius: 8,
            padding: "7px 16px",
            fontFamily: ANALYTICS.SANS,
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          Manage
        </button>
      </div>
    </article>
  );
}

export function SourceSetupConfigPage({
  tenantName,
  evidenceSources = null,
  archetypeDefault = null,
  approversConfigured = null,
}: SourceSetupConfigPageProps): ReactNode {
  const evidenceReal =
    !!evidenceSources && Number.isFinite(evidenceSources.total) &&
    evidenceSources.total > 0;
  const evidenceSub = evidenceReal
    ? `CMDB, ServiceNow, contract store — ${evidenceSources!.connected} of ${evidenceSources!.total} connected`
    : "CMDB, ServiceNow, contract store — no connectors registered yet";
  const evidenceChip = evidenceReal
    ? `${evidenceSources!.connected} CONNECTED`
    : PLACEHOLDER_CHIP;

  const approversReal = approversConfigured === true;
  const approversChip = approversReal ? "CONFIGURED" : PLACEHOLDER_CHIP;

  const archetypeReal =
    typeof archetypeDefault === "string" && archetypeDefault.trim().length > 0;
  const archetypeChip = archetypeReal
    ? archetypeDefault!.trim().toUpperCase()
    : PLACEHOLDER_CHIP;

  const rows: CardRow[] = [
    {
      key: "evidence-sources",
      icon: "🗂️",
      title: "Evidence sources",
      sub: evidenceSub,
      chip: evidenceChip,
      chipReal: evidenceReal,
    },
    {
      key: "approvers",
      icon: "✅",
      title: "Approvers",
      sub: "Who can confirm a gate, per entity",
      chip: approversChip,
      chipReal: approversReal,
    },
    {
      key: "archetype-defaults",
      icon: "🧭",
      title: "Archetype defaults",
      sub: "Which archetype loads for a new event",
      chip: archetypeChip,
      chipReal: archetypeReal,
    },
  ];

  return (
    <AppShell
      surface="source"
      topBarProps={{ showLocked: true, context: "Source · Setup" }}
      subNav={<SourceSubNav />}
    >
      <main style={PAGE}>
        <section style={{ maxWidth: 880, display: "grid", gap: 20 }}>
          <header style={{ display: "grid", gap: 10 }}>
            <div style={EYEBROW}>Source · Setup</div>
            <h1
              style={{
                margin: 0,
                fontFamily: ANALYTICS.SERIF,
                fontSize: "clamp(28px, 3.6vw, 40px)",
                lineHeight: 1.08,
                color: ANALYTICS.INK,
              }}
            >
              Source configuration
            </h1>
            <p
              style={{
                margin: 0,
                color: ANALYTICS.MUTED,
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              Connections, evidence sources, and who can approve gates for{" "}
              {tenantName}.
            </p>
          </header>

          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row) => (
              <ListRowCard key={row.key} row={row} />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

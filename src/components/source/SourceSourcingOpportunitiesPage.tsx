"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sourcing Opportunities — section 5 of the recommended 8-section Source
// workspace restructure. A ranked, Source-computed list of contracts worth a
// negotiation or renegotiation conversation, derived from the same verified
// source.contract_vendor_360 register as the Vendor & Contract Portfolio page
// (see sourcing-opportunities.ts for why this is computed here rather than
// read from a dedicated Postgres view).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import {
  computeSourcingOpportunities,
  type SourcingOpportunityReason,
} from "@/lib/source/data-model/sourcing-opportunities";
import { excludeSupplementalContracts } from "@/lib/source/data-model/vendor-contract-portfolio";
import { formatUsdCompact } from "@/lib/source/data-model/vendor-portfolio-view";
import type { SourceContractVendor360Row } from "@/lib/source/data-model/types";

interface SourceSourcingOpportunitiesPageProps {
  rows: readonly SourceContractVendor360Row[];
  tenantName: string;
  asOfDateIso: string;
}

const REASON_LABEL: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: "Weak leverage",
  notice_deadline_passed: "Notice deadline passed",
  top_concentration_vendor: "Top concentration vendor",
};

const REASON_COLOR: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: ANALYTICS.RUST,
  notice_deadline_passed: ANALYTICS.RUST,
  top_concentration_vendor: ANALYTICS.INK,
};

export function SourceSourcingOpportunitiesPage({
  rows,
  tenantName,
  asOfDateIso,
}: SourceSourcingOpportunitiesPageProps) {
  const result = useMemo(() => {
    const cleaned = excludeSupplementalContracts(rows);
    return computeSourcingOpportunities(cleaned, asOfDateIso);
  }, [rows, asOfDateIso]);

  return (
    <AppShell
      surface="source"
      agentName="Ava"
      surfaceContext={{
        sourceSourcingOpportunitiesMode: true,
        opportunityCount: result.opportunities.length,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: "Source · Sourcing Opportunities",
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-sourcing-opportunities" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <Link href="/source/preview/workspace" style={BACK_LINK_STYLE}>
            &larr; Back to Source workspace
          </Link>
          <header style={HEADER_STYLE}>
            <div style={EYEBROW_STYLE}>Source · Sourcing Opportunities</div>
            <h1 style={H1_STYLE}>Where should sourcing act next?</h1>
            <p style={SUBLINE_STYLE}>
              Ranked by annual value, across {tenantName}&rsquo;s reconciled
              vendor register. Computed from weak-leverage signals, missed
              renewal-notice deadlines, and vendor concentration — never a
              fabricated priority score.
            </p>
          </header>
          {result.opportunities.length === 0 ? (
            <div
              style={EMPTY_STYLE}
              data-testid="source-sourcing-opportunities-empty"
            >
              <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
                No opportunities surfaced — either no vendor/contract rows are
                available for this tenant, or none met the weak-leverage,
                missed-notice-deadline, or top-concentration criteria.
              </p>
            </div>
          ) : (
            <ul style={LIST_STYLE}>
              {result.opportunities.map((opp) => (
                <li key={opp.contractId} style={CARD_STYLE}>
                  <div style={CARD_HEAD_STYLE}>
                    <div style={{ minWidth: 0, display: "grid", gap: 2 }}>
                      <Link
                        href={`/source/preview/workspace?contractId=${encodeURIComponent(opp.contractId)}`}
                        style={CARD_TITLE_STYLE}
                      >
                        {opp.contractName}
                      </Link>
                      <div style={CARD_SUB_STYLE}>{opp.vendorName}</div>
                    </div>
                    <div style={CARD_VALUE_STYLE}>
                      {formatUsdCompact(opp.annualValue)}
                    </div>
                  </div>
                  <div style={BADGE_ROW_STYLE}>
                    {opp.reasons.map((reason) => (
                      <span
                        key={reason}
                        style={{ ...BADGE_STYLE, color: REASON_COLOR[reason] }}
                      >
                        {REASON_LABEL[reason]}
                      </span>
                    ))}
                  </div>
                  <ul style={RATIONALE_LIST_STYLE}>
                    {opp.rationale.map((line, i) => (
                      <li key={i} style={RATIONALE_ITEM_STYLE}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppShell>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  background: ANALYTICS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "28px 32px 64px",
  display: "grid",
  gap: 20,
};

const BACK_LINK_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  color: ANALYTICS.MUTED,
  textDecoration: "none",
  justifySelf: "start",
};

const HEADER_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
};

const H1_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 30,
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: ANALYTICS.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: ANALYTICS.SANS,
  fontSize: 14,
  lineHeight: 1.5,
  color: ANALYTICS.MUTED,
  maxWidth: 720,
};

const LIST_STYLE: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 14,
};

const CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "16px 18px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
};

const CARD_HEAD_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const CARD_TITLE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 17,
  fontWeight: 500,
  color: ANALYTICS.INK,
  textDecoration: "underline",
};

const CARD_SUB_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  color: ANALYTICS.MUTED,
};

const CARD_VALUE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 20,
  color: ANALYTICS.INK,
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

const BADGE_ROW_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const BADGE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "3px 8px",
  borderRadius: 999,
  border: `1px solid currentColor`,
};

const RATIONALE_LIST_STYLE: CSSProperties = {
  margin: 0,
  padding: "0 0 0 18px",
  display: "grid",
  gap: 4,
};

const RATIONALE_ITEM_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  color: ANALYTICS.INK,
};

const EMPTY_STYLE: CSSProperties = {
  padding: "24px 20px",
  border: `1px dashed ${ANALYTICS.LINE_STRONG}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
};

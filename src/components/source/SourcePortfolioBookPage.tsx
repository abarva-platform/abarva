"use client";

// ─────────────────────────────────────────────────────────────────────────────
// "Your sourcing book" — the redesigned Source Portfolio home.
//
// Shipped behind the `source_analytics` platform flag. `/source/portfolio`
// renders THIS for every tenant; the legacy table remains only as emergency
// fallback plumbing in the route.
//
// Design bridges to the analytics-canvas tokens (ANALYTICS) so this reads as one
// system with the redesigned stage canvas — serif headings, paper ground,
// hairlines, teal aVa accent.
//
// Honesty: every number comes from `buildPortfolioBookView` (real derivations)
// or renders an honest empty state. Sections with no substrate backing
// (renewals, aVa nudge) render empty — never fabricated numbers.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import { selectVisibleSourceEvents } from "@/lib/source/portfolio-metrics";
import {
  buildPortfolioBookView,
  type PortfolioStatCard,
  type PortfolioFlightCard,
  type PortfolioBookView,
} from "@/lib/source/portfolio-book-view";
import type { SourcingEventSummary } from "@/lib/source/types";

interface SourcePortfolioBookPageProps {
  events: SourcingEventSummary[];
  tenantName: string;
  canViewFinancialValues?: boolean;
}

export function SourcePortfolioBookPage({
  events,
  tenantName,
  canViewFinancialValues = true,
}: SourcePortfolioBookPageProps) {
  const visibleEvents = useMemo(
    () => selectVisibleSourceEvents(events),
    [events],
  );
  const view = useMemo(
    () => buildPortfolioBookView(visibleEvents, { canViewFinancialValues }),
    [visibleEvents, canViewFinancialValues],
  );

  return (
    <AppShell
      surface="source"
      agentName="Ava"
      surfaceContext={{
        sourcePortfolioMode: true,
        sourceEventCount: visibleEvents.length,
        eventType: "sourcing book overview",
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `Source · ${visibleEvents.length} events`,
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-portfolio-book" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <BookHeader tenantName={tenantName} />
          <StatCardRow cards={view.statCards} />
          <BookBody view={view} />
        </div>
      </main>
    </AppShell>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function BookHeader({ tenantName }: { tenantName: string }) {
  return (
    <header data-testid="source-book-header" style={HEADER_STYLE}>
      <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
        <div style={EYEBROW_STYLE}>Source · Portfolio</div>
        <h1 style={H1_STYLE}>Your sourcing book</h1>
        <p style={SUBLINE_STYLE}>
          Events in flight, renewals on the clock, and value captured across{" "}
          {tenantName}.
        </p>
      </div>
      <div style={HEADER_ACTIONS_STYLE}>
        <Link
          href="/source/preview/workspace"
          style={GHOST_BTN_STYLE}
          data-testid="source-book-vendor-portfolio"
        >
          Source workspace
        </Link>
        <Link
          href="/source/optimize"
          style={GHOST_BTN_STYLE}
          data-testid="source-book-optimize"
        >
          Optimize a contract
        </Link>
        <Link
          href="/source/new"
          style={SOLID_BTN_STYLE}
          data-testid="source-book-new-event"
        >
          New event
        </Link>
      </div>
    </header>
  );
}

// ── Stat cards ───────────────────────────────────────────────────────────────

function StatCardRow({ cards }: { cards: PortfolioStatCard[] }) {
  return (
    <section
      aria-label="Portfolio headline metrics"
      data-testid="source-book-stats"
      style={STAT_ROW_STYLE}
    >
      {cards.map((card) => (
        <StatCard key={card.key} card={card} />
      ))}
    </section>
  );
}

function StatCard({ card }: { card: PortfolioStatCard }) {
  const subColor = card.empty
    ? ANALYTICS.FAINT
    : card.tone === "green"
      ? ANALYTICS.GREEN_TEXT
      : card.tone === "amber"
        ? ANALYTICS.AMBER_TEXT
        : ANALYTICS.MUTED;
  return (
    <div style={STAT_CARD_STYLE} data-testid={`source-book-stat-${card.key}`}>
      <div style={STAT_LABEL_STYLE}>{card.label}</div>
      <div
        style={{
          ...STAT_VALUE_STYLE,
          color: card.empty ? ANALYTICS.FAINT : ANALYTICS.INK,
        }}
      >
        {card.value}
      </div>
      <div style={{ ...STAT_SUB_STYLE, color: subColor }}>{card.sub}</div>
    </div>
  );
}

// ── Body (two columns) ───────────────────────────────────────────────────────

function BookBody({ view }: { view: PortfolioBookView }) {
  return (
    <div style={BODY_GRID_STYLE}>
      <div style={{ minWidth: 0 }}>
        <EventsInFlight cards={view.flightCards} />
      </div>
      <aside
        style={RAIL_STYLE}
        aria-label="Renewals and proactive intelligence"
      >
        {view.proactiveNudge ? (
          <div style={NUDGE_CARD_STYLE} data-testid="source-book-nudge">
            <div style={NUDGE_HEAD_STYLE}>
              <span style={AVA_AVATAR_STYLE} aria-hidden>
                a
              </span>
              <span style={NUDGE_EYEBROW_STYLE}>aVa · Proactive</span>
            </div>
            <p style={NUDGE_BODY_STYLE}>{view.proactiveNudge.sentence}</p>
            <Link href={view.proactiveNudge.href} style={NUDGE_LINK_STYLE}>
              Start optimization →
            </Link>
          </div>
        ) : null}
        <RenewalsOnTheClock view={view} />
      </aside>
    </div>
  );
}

function EventsInFlight({ cards }: { cards: PortfolioFlightCard[] }) {
  return (
    <section aria-label="Events in flight" data-testid="source-book-flight">
      <div style={SECTION_HEAD_STYLE}>
        <span style={SECTION_LABEL_STYLE}>Events in flight</span>
        <span style={SECTION_COUNT_STYLE}>{cards.length} shown</span>
      </div>
      {cards.length === 0 ? (
        <div style={EMPTY_BLOCK_STYLE} data-testid="source-book-flight-empty">
          No events in flight. Start one with New event.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {cards.map((card) => (
            <FlightCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}

function FlightCard({ card }: { card: PortfolioFlightCard }) {
  return (
    <Link
      href={card.href}
      style={FLIGHT_CARD_STYLE}
      data-testid={`source-book-flight-card-${card.code}`}
    >
      <div style={FLIGHT_TOP_STYLE}>
        <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
          <div style={FLIGHT_TITLE_ROW_STYLE}>
            <span style={FLIGHT_TITLE_STYLE}>{card.title}</span>
            <span
              style={{
                ...KIND_BADGE_STYLE,
                ...(card.kind === "door1" ? KIND_BADGE_DOOR1 : KIND_BADGE_FULL),
              }}
            >
              {card.kindLabel}
            </span>
          </div>
          <div style={FLIGHT_SUB_STYLE}>{card.subline}</div>
        </div>
        {card.value ? (
          <div style={FLIGHT_VALUE_STYLE}>
            <div style={FLIGHT_VALUE_PRIMARY_STYLE}>{card.value.primary}</div>
            <div style={FLIGHT_VALUE_SECONDARY_STYLE}>
              {card.value.secondary}
            </div>
          </div>
        ) : null}
      </div>
      <StageRail activeIndex={card.stageIndex} stepCount={card.stepCount} />
      <div style={FLIGHT_PROGRESS_STYLE}>{card.progressLabel}</div>
    </Link>
  );
}

// 11-dot stage rail. Completed dots filled, active dot teal-accented, future
// dots muted, connected by a hairline.
function StageRail({
  activeIndex,
  stepCount,
}: {
  activeIndex: number;
  stepCount: number;
}) {
  const dots = Array.from({ length: stepCount }, (_, i) => i);
  return (
    <div
      style={RAIL_TRACK_STYLE}
      role="img"
      aria-label={`Stage ${activeIndex + 1} of ${stepCount}`}
    >
      {dots.map((i) => {
        const state =
          i < activeIndex ? "done" : i === activeIndex ? "active" : "future";
        return (
          <React.Fragment key={i}>
            {i > 0 ? <span style={RAIL_HAIRLINE_STYLE} aria-hidden /> : null}
            <span
              aria-hidden
              style={{
                ...RAIL_DOT_STYLE,
                ...(state === "done"
                  ? RAIL_DOT_DONE
                  : state === "active"
                    ? RAIL_DOT_ACTIVE
                    : RAIL_DOT_FUTURE),
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

function RenewalsOnTheClock({ view }: { view: PortfolioBookView }) {
  return (
    <section
      aria-label="Renewals on the clock"
      data-testid="source-book-renewals"
    >
      <div style={SECTION_HEAD_STYLE}>
        <span style={SECTION_LABEL_STYLE}>Renewals on the clock</span>
      </div>
      {view.renewalsEmpty || view.renewals.length === 0 ? (
        <div style={EMPTY_BLOCK_STYLE} data-testid="source-book-renewals-empty">
          No renewal clock is wired to this tenant yet. Renewal dates surface
          here once contract baselines are connected.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {view.renewals.map((row) => (
            <div key={row.id} style={RENEWAL_ROW_STYLE}>
              <div style={RENEWAL_DAYS_STYLE}>{row.dayCount}d</div>
              <div style={{ minWidth: 0, display: "grid", gap: 2 }}>
                <div style={RENEWAL_NAME_STYLE}>{row.name}</div>
                <div style={RENEWAL_META_STYLE}>
                  {row.account} · {row.spend} · {row.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 32px 64px",
  display: "grid",
  gap: 28,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
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
  fontSize: 34,
  fontWeight: 400,
  lineHeight: 1.08,
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
  maxWidth: 640,
};

const HEADER_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const GHOST_BTN_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 16px",
  borderRadius: ANALYTICS.RADIUS_SM,
  border: `1px solid ${ANALYTICS.LINE_STRONG}`,
  background: ANALYTICS.CARD,
  color: ANALYTICS.INK,
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const SOLID_BTN_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 16px",
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.INK,
  color: "#ffffff",
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const STAT_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
};

const STAT_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "16px 18px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  minWidth: 0,
};

const STAT_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  fontWeight: 700,
};

const STAT_VALUE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 32,
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  fontVariantNumeric: "tabular-nums",
};

const STAT_SUB_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
};

const BODY_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  gap: 28,
  alignItems: "start",
};

const RAIL_STYLE: CSSProperties = {
  display: "grid",
  gap: 20,
  minWidth: 0,
};

const SECTION_HEAD_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const SECTION_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: ANALYTICS.MUTED,
  fontWeight: 700,
};

const SECTION_COUNT_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  fontWeight: 600,
};

const EMPTY_BLOCK_STYLE: CSSProperties = {
  padding: "18px 16px",
  border: `1px dashed ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.SOFT,
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: ANALYTICS.MUTED,
};

const FLIGHT_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "16px 18px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  textDecoration: "none",
  color: "inherit",
};

const FLIGHT_TOP_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const FLIGHT_TITLE_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  minWidth: 0,
};

const FLIGHT_TITLE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 18,
  fontWeight: 400,
  letterSpacing: "-0.01em",
  color: ANALYTICS.INK,
};

const KIND_BADGE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: 999,
  fontFamily: ANALYTICS.MONO,
  fontSize: 9.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const KIND_BADGE_FULL: CSSProperties = {
  background: "rgba(10,10,11,0.06)",
  color: ANALYTICS.MUTED,
};

const KIND_BADGE_DOOR1: CSSProperties = {
  background: "rgba(63,184,168,0.16)",
  color: "#1f8578",
};

const FLIGHT_SUB_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
  color: ANALYTICS.MUTED,
};

const FLIGHT_VALUE_STYLE: CSSProperties = {
  display: "grid",
  gap: 2,
  textAlign: "right",
  flexShrink: 0,
};

const FLIGHT_VALUE_PRIMARY_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 13,
  fontWeight: 700,
  color: ANALYTICS.INK,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const FLIGHT_VALUE_SECONDARY_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 9.5,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  whiteSpace: "nowrap",
};

const RAIL_TRACK_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
};

const RAIL_DOT_STYLE: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  flexShrink: 0,
};

const RAIL_DOT_DONE: CSSProperties = {
  background: ANALYTICS.INK,
};

const RAIL_DOT_ACTIVE: CSSProperties = {
  background: ANALYTICS.TEAL_BRIGHT,
  boxShadow: `0 0 0 3px rgba(95,208,194,0.28)`,
};

const RAIL_DOT_FUTURE: CSSProperties = {
  background: "rgba(10,10,11,0.14)",
};

const RAIL_HAIRLINE_STYLE: CSSProperties = {
  flex: 1,
  height: 1,
  minWidth: 6,
  background: ANALYTICS.LINE,
};

const FLIGHT_PROGRESS_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.MUTED,
  fontWeight: 600,
};

const NUDGE_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "16px 18px",
  borderRadius: ANALYTICS.RADIUS,
  border: `1px solid rgba(63,184,168,0.28)`,
  background: ANALYTICS.GREEN_TINT,
};

const NUDGE_HEAD_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const AVA_AVATAR_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: 999,
  background: ANALYTICS.TEAL_DEEP,
  color: ANALYTICS.TEAL_BRIGHT,
  fontFamily: ANALYTICS.SERIF,
  fontSize: 13,
  fontWeight: 600,
};

const NUDGE_EYEBROW_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 9.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#1f8578",
  fontWeight: 700,
};

const NUDGE_BODY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: ANALYTICS.INK_2,
};

const NUDGE_LINK_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 12.5,
  fontWeight: 600,
  color: "#1f8578",
  textDecoration: "none",
};

const RENEWAL_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 14px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.CARD,
};

const RENEWAL_DAYS_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 22,
  fontWeight: 400,
  color: ANALYTICS.AMBER_TEXT,
  lineHeight: 1,
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
};

const RENEWAL_NAME_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  fontWeight: 600,
  color: ANALYTICS.INK,
};

const RENEWAL_META_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 12,
  color: ANALYTICS.MUTED,
};

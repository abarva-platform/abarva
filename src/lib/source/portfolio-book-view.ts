// ─────────────────────────────────────────────────────────────────────────────
// "Your sourcing book" view-model — the redesigned Source Portfolio home.
//
// Pure, deterministic, and HONEST. This module maps the real
// `SourcingEventSummary[]` (from `listSourcingEvents()`) into the exact shape
// the redesigned portfolio renders — and, critically, it is explicit about
// which cells have real substrate backing and which do not.
//
// Honesty contract (non-negotiable — see the redesign brief):
//   - Every number surfaced here is derived from the real portfolio
//     derivations, OR the field is marked absent so the renderer shows an
//     honest empty/placeholder state.
//   - The substrate carries NO renewal-date, contract-term, or year-over-year
//     column today. So the "renewals on the clock" list and the value-captured
//     YoY comparison have NO real backing and are surfaced as empty — never a
//     fabricated live figure.
//   - `realizedValueUsd` is `0` for every persisted row (queries.ts), so
//     "value captured" resolves to an honest empty when the aggregate is 0.
//
// See `portfolio-derivations.ts` / `portfolio-metrics.ts` for the underlying
// real derivations this composes.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourcingEventSummary } from "./types";
import type { SourceV4WorkspaceSnapshot } from "./data-model/source-v4-workspace-snapshot";
import { computePortfolioKpis, attentionEvents } from "./portfolio-filtering";
import { deriveValuePosture } from "./portfolio-derivations";
import {
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  sourceJourneyLabelForStage,
  sourceJourneyStageKeys,
} from "./sourcing-motion-journeys";

// ── Event kind (Full event vs optimization) ──────────────────────────────────
// The substrate has no first-class "door" column. We classify HONESTLY from the
// signals that ARE present: an event whose archetype/name reads as a contract
// optimization or renewal is badged "Optimization"; everything else is a "Full
// event". When the substrate adds a first-class event-kind field this becomes a
// passthrough.

export type PortfolioEventKind = "full" | "door1";

export function classifyEventKind(
  event: SourcingEventSummary,
): PortfolioEventKind {
  return getSourceJourneyForEvent({ event }).id === "contract_optimization"
    ? "door1"
    : "full";
}

export function eventKindLabel(kind: PortfolioEventKind): string {
  return kind === "door1" ? "Optimization" : "Full event";
}

// ── Stat cards ───────────────────────────────────────────────────────────────
// Four headline cards. `value` is always real (a count or a real aggregate) or
// the honest em-dash placeholder. `sample` marks a card whose whole premise has
// no real backing for this tenant — the renderer badges it "Sample" (it never
// fabricates a live figure).

export interface PortfolioStatCard {
  key: "active" | "renewals" | "spend" | "value_captured";
  label: string;
  value: string;
  sub: string;
  /** Sub-line tone — drives the accent color in the renderer. */
  tone: "ink" | "green" | "amber";
  /** True when this card has NO real backing and shows an honest empty state. */
  empty: boolean;
}

// ── Event-in-flight card ─────────────────────────────────────────────────────

export interface PortfolioFlightCard {
  id: string;
  code: string;
  href: string;
  title: string;
  kind: PortfolioEventKind;
  kindLabel: string;
  /** "{account} · {sponsor}" — real fields only; term is omitted (no substrate). */
  subline: string;
  /** 0-based active step index in the 11-step lifecycle. */
  stageIndex: number;
  stepCount: number;
  stageLabel: string;
  /** "NOW AT {stage}" progress line. */
  progressLabel: string;
  /** Projected value posture — real point ±20% band, or null when absent. */
  value: { primary: string; secondary: string } | null;
}

// ── Renewal row (the right rail) ─────────────────────────────────────────────
// The substrate has NO renewal-date column. This list is therefore rendered as
// an honest empty state; the type exists so the renderer contract is stable if
// a real renewal substrate lands later.

export interface PortfolioRenewalRow {
  id: string;
  dayCount: number;
  name: string;
  account: string;
  spend: string;
  status: string;
}

// ── Proactive nudge (aVa) ────────────────────────────────────────────────────
// Driven ONLY from real renewal data. There is no renewal substrate today, so
// this is always null and the renderer omits the card (never fabricates one).

export interface PortfolioProactiveNudge {
  sentence: string;
  href: string;
}

export interface PortfolioBookView {
  statCards: PortfolioStatCard[];
  flightCards: PortfolioFlightCard[];
  /** Honest empty flag for the renewals list (no substrate backing today). */
  renewals: PortfolioRenewalRow[];
  renewalsEmpty: boolean;
  proactiveNudge: PortfolioProactiveNudge | null;
  contractCount: number;
}

function formatCompactUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "—";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${usd}`;
}

function formatValuePosture(
  event: SourcingEventSummary,
  canViewFinancialValues: boolean,
): { primary: string; secondary: string } | null {
  if (!canViewFinancialValues) {
    return { primary: "Restricted", secondary: "financial visibility off" };
  }
  const posture = deriveValuePosture(event);
  if (!posture) return null;
  const low = formatCompactUsd(posture.low);
  const high = formatCompactUsd(posture.high);
  return {
    primary: low === high ? low : `${low} – ${high}`,
    secondary: posture.isDerivedBand ? "Projected · v2 pending" : "Projected",
  };
}

/**
 * Compose the redesigned portfolio view-model from the canonical visible event
 * set. Pass the ALREADY-filtered/deduped events (via
 * `selectVisibleSourceEvents`) so counts can never drift from other surfaces.
 */
export function buildPortfolioBookView(
  events: SourcingEventSummary[],
  opts: {
    canViewFinancialValues: boolean;
    governedSnapshot?: SourceV4WorkspaceSnapshot | null;
  },
): PortfolioBookView {
  const { canViewFinancialValues, governedSnapshot = null } = opts;
  const kpis = computePortfolioKpis(events);

  const openEvents = events.filter(
    (e) => e.status !== "completed" && e.status !== "archived",
  );
  const fullCount = openEvents.filter(
    (e) => classifyEventKind(e) === "full",
  ).length;
  const door1Count = openEvents.filter(
    (e) => classifyEventKind(e) === "door1",
  ).length;
  const contractCount = events.length;

  // Value captured YTD — from REAL realizedValueUsd only. This is 0 for every
  // persisted row today (queries.ts), so the card resolves to an honest empty
  // rather than a fabricated figure. No YoY comparison is shown (no substrate).
  const valueCapturedUsd = events.reduce(
    (sum, e) => sum + Math.max(0, e.realizedValueUsd ?? 0),
    0,
  );
  const hasValueCaptured = canViewFinancialValues && valueCapturedUsd > 0;

  const spendUnderMgmtUsd = kpis.valueAtStakeUsd;
  const governedContractCount =
    governedSnapshot?.contextCoverage.contracts ??
    governedSnapshot?.executivePortfolio.contractCount ??
    0;
  const governedVendorCount = governedSnapshot?.contextCoverage.vendors ?? 0;
  const governedAnnualValue =
    governedSnapshot?.contextCoverage.annualValue ??
    governedSnapshot?.executivePortfolio.annualValue ??
    0;
  const hasGovernedPortfolio =
    governedContractCount > 0 && governedAnnualValue > 0;
  const hasSpend =
    canViewFinancialValues &&
    (hasGovernedPortfolio ? governedAnnualValue > 0 : spendUnderMgmtUsd > 0);

  const statCards: PortfolioStatCard[] = [
    {
      key: "active",
      label: "Active events",
      value: String(openEvents.length),
      sub: `${fullCount} full event${fullCount === 1 ? "" : "s"} · ${door1Count} optimization${door1Count === 1 ? "" : "s"}`,
      tone: "ink",
      empty: false,
    },
    {
      // Renewals · 90 days — NO renewal-date substrate. Honest empty.
      key: "renewals",
      label: "Renewals · 90 days",
      value: "—",
      sub: "No renewal clock wired to this tenant yet",
      tone: "amber",
      empty: true,
    },
    {
      key: "spend",
      label: hasGovernedPortfolio
        ? "Governed contract base"
        : "Spend under management",
      value: hasSpend
        ? formatCompactUsd(
            hasGovernedPortfolio ? governedAnnualValue : spendUnderMgmtUsd,
          )
        : "—",
      sub: hasGovernedPortfolio
        ? `${governedContractCount} source.contract_360 row${governedContractCount === 1 ? "" : "s"} · ${governedVendorCount} vendor${governedVendorCount === 1 ? "" : "s"}`
        : hasSpend
          ? `across ${contractCount} contract${contractCount === 1 ? "" : "s"}`
          : canViewFinancialValues
            ? "No open value at stake yet"
            : "Financial visibility off",
      tone: "ink",
      empty: !hasSpend,
    },
    {
      key: "value_captured",
      label: "Value captured YTD",
      value: hasValueCaptured ? formatCompactUsd(valueCapturedUsd) : "—",
      sub: hasValueCaptured
        ? "realized to date"
        : "No realized value recorded yet",
      tone: "green",
      empty: !hasValueCaptured,
    },
  ];

  const flightCards: PortfolioFlightCard[] = openEvents
    .slice()
    .sort((a, b) => (b.agingDays | 0) - (a.agingDays | 0))
    .map((event) => {
      const kind = classifyEventKind(event);
      const journey = getSourceJourneyForEvent({ event });
      const visibleStage = coerceStageToSourceJourney(
        journey,
        event.currentStageKey,
        event.currentStageKey,
      );
      const stageKeys = sourceJourneyStageKeys(journey);
      const idx = Math.max(0, stageKeys.indexOf(visibleStage));
      const stepCount = stageKeys.length;
      const stageLabel =
        sourceJourneyLabelForStage(journey, visibleStage) || "Strategy";
      const sponsor = (event.decisionOwner || event.owner || "").trim();
      const subline = sponsor
        ? `${event.accountName} · sponsor ${sponsor}`
        : event.accountName;
      return {
        id: event.id,
        code: event.code,
        href: `/source/events/${event.id}`,
        title: event.name,
        kind,
        kindLabel: eventKindLabel(kind),
        subline,
        stageIndex: idx,
        stepCount,
        stageLabel,
        progressLabel: `Now at ${stageLabel} · step ${idx + 1} of ${stepCount}`,
        value: formatValuePosture(event, canViewFinancialValues),
      };
    });

  // Renewals on the clock — no renewal-date substrate. Always honest empty.
  const renewals: PortfolioRenewalRow[] = [];
  const renewalsEmpty = true;

  // aVa proactive nudge — driven ONLY from real renewal data. None exists, so
  // this is always null and the card is omitted (never fabricated).
  const proactiveNudge: PortfolioProactiveNudge | null = null;
  // `attentionEvents` is real, but the brief scopes the nudge specifically to a
  // renewal running above market — which needs renewal substrate we don't have.
  // Referencing it here keeps the honest intent legible without emitting a card.
  void attentionEvents;

  return {
    statCards,
    flightCards,
    renewals,
    renewalsEmpty,
    proactiveNudge,
    contractCount,
  };
}

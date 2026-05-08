// TOWER · T-7 (Bind 3) — Atlas observations view-model.
//
// Synthesizes the Atlas right-rail observations (3 + "if you only do one
// thing today" + 4 suggested prompts) from the AI Initiatives substrate
// (initiatives + vendors + composed pressures).
//
// Replaces the hardcoded Apex Retail observations (EA renewal, Joule/Copilot
// E5/Now Assist ROI, Okta/EntraID adoption confidence) with text composed
// from real status flags + status_summary + vendor renewals + portfolio shape.
//
// Synthesis pattern (3 observations):
//   Obs 01 · Top pressure — most urgent decision (vendor clock or HIGH-conf cost)
//   Obs 02 · Portfolio pattern — aggregate signal across pressures
//   Obs 03 · Look-ahead — strategic bets / foundation / scaled stage shape
//
// "If you only do one thing today" anchors on Obs 01's recommendation.
// Suggested prompts derive from the pressure-type mix.
//
// Pure deterministic helper. Same input → identical output.

import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type {
  PressureCardView,
  TowerPressuresView,
} from '@/lib/tower/pressure-cards-view';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface AtlasObservationAction {
  label: string;
  href: string;
  /** Optional time hint, shown as "(5 min)" parenthetical. */
  timeHint?: string;
  /** Secondary chips render with `↳` indent under the primary. */
  secondary?: boolean;
  /** Pending=true marks placeholder destinations for the next wave to wire. */
  pending?: boolean;
}

export interface AtlasObservation {
  /** Sequential 1-based number for the observation header (01/02/03). */
  number: number;
  /** Single short label for the underlying signal (e.g. "Vendor clock"). */
  topic: string;
  /** Body paragraph (1-3 sentences) — plain text, no JSX. */
  body: string;
  /** Action chips rendered below the body. Empty array = no chips. */
  actions: ReadonlyArray<AtlasObservationAction>;
}

export interface AtlasObservationsView {
  /** Headline above the observations (e.g. "Three threads run through this morning's pressures."). */
  headline: string;
  /** Meta line (e.g. "Read time 90 sec · 3 observations · 4 prompts"). Keeps timestamp in the caller. */
  metaSuffix: string;
  /** 1–3 composed observations. Always at least 1 when not empty. */
  observations: ReadonlyArray<AtlasObservation>;
  /** Italic prose for the "If you only do one thing today" block. */
  ifYouOnlyDoOneToday: string;
  /** Four suggested prompts for the chat input. */
  suggestedPrompts: ReadonlyArray<string>;
  /** True when no substrate (no initiatives + no vendors). */
  isEmpty: boolean;
  emptyHint: string | null;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROMPTS = [
  'Show me the lagging programs by realized value',
  'What if I cut LLM tokens by 30%?',
  'Re-rank pressures by attribution confidence',
  'Brief me for the next governance meeting',
];

const PROMPTS_BY_PRESSURE_TYPE: Record<string, string> = {
  cost: 'What if I cut LLM tokens by 30%?',
  vend: 'Draft a negotiation thesis tied to current pressures',
  value: 'Show me the lagging programs by realized value',
  dupl: 'Run a clean attribution study on the duplicating tools',
  adopt: 'Map adoption gap to identity-source coverage',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatUsdCompact(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}

function pressureTopicLabel(card: PressureCardView): string {
  switch (card.type) {
    case 'cost':  return 'Cost overrun';
    case 'dupl':  return 'Capability duplication';
    case 'vend':  return 'Vendor clock';
    case 'value': return 'Value lag';
    case 'adopt': return 'Adoption gap';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Observation composers
// ─────────────────────────────────────────────────────────────────────────────

/** Obs 01 — top pressure with the strongest CFO-decision posture. */
function composeTopPressureObservation(
  topPressure: PressureCardView,
  number: number,
): AtlasObservation {
  const topic = pressureTopicLabel(topPressure);

  // Extract the action chip from the pressure's nextAction if it
  // contains a verb-leading recommendation. Otherwise generic chip.
  const actions: AtlasObservationAction[] = [];
  if (topPressure.type === 'vend') {
    actions.push({
      label: 'Open the renewal brief in Source',
      href: '/source',
      pending: true,
    });
  } else if (topPressure.type === 'cost') {
    actions.push({
      label: 'Open Move on cost-routing policy',
      href: '/programs/new?move=cost-routing',
      pending: true,
    });
  } else if (topPressure.type === 'dupl') {
    actions.push({
      label: 'Run attribution study',
      href: '/programs/new?move=attribution-study',
      pending: true,
    });
  } else if (topPressure.type === 'value') {
    actions.push({
      label: 'Open re-baseline review',
      href: `/admin/ai-initiatives/${encodeURIComponent(topPressure.displayId ?? '')}`,
    });
  } else if (topPressure.type === 'adopt') {
    actions.push({
      label: 'Connect identity sources',
      timeHint: '5 min',
      href: '/admin/connectors',
    });
  }

  return {
    number,
    topic,
    body: `${topPressure.headline} ${topPressure.lede}`.trim(),
    actions,
  };
}

/**
 * Obs 02 — portfolio pattern. Looks at the shape of the pressure mix and
 * surfaces the dominant theme (e.g., "two of three pressures are value-lag").
 */
function composePortfolioPatternObservation(
  pressures: ReadonlyArray<PressureCardView>,
  initiatives: ReadonlyArray<AIInitiative>,
  number: number,
): AtlasObservation | null {
  if (pressures.length === 0) return null;

  // Group pressures by type; dominant type drives the observation.
  const byType = new Map<string, PressureCardView[]>();
  for (const p of pressures) {
    const list = byType.get(p.type) ?? [];
    list.push(p);
    byType.set(p.type, list);
  }
  const sortedTypes = [...byType.entries()].sort((a, b) => b[1].length - a[1].length);
  const [dominantType, dominantCards] = sortedTypes[0]!;

  // Compose body keyed off the dominant type.
  let body: string;
  if (dominantType === 'value' && dominantCards.length >= 2) {
    const ids = dominantCards.map((c) => c.displayId).filter(Boolean).join(', ');
    body = `${dominantCards.length} of ${pressures.length} active pressure${pluralize(pressures.length, '', 's')} are value-lag (${ids}). Realized value is trailing committed across multiple programs — the pattern points to either over-promised business cases or under-instrumented adoption telemetry.`;
  } else if (dominantType === 'cost') {
    body = `${dominantCards.length} initiative${pluralize(dominantCards.length, '', 's')} ${pluralize(dominantCards.length, 'is', 'are')} flagged for cost overrun. The shared signal across the portfolio is rising token/inference burn outpacing the originally-committed envelope.`;
  } else if (dominantType === 'vend') {
    body = `${dominantCards.length} vendor renewal${pluralize(dominantCards.length, '', 's')} sit${pluralize(dominantCards.length, 's', '')} in the next 90 days. CFO decision posture is undefined on each — the renewals are a forcing function, not an opportunity to defer.`;
  } else if (dominantType === 'dupl') {
    body = `${dominantCards.length} initiative${pluralize(dominantCards.length, '', 's')} ${pluralize(dominantCards.length, 'shows', 'show')} duplication risk against another in-portfolio capability. Without a clean attribution study, consolidation decisions remain politically charged but evidentially weak.`;
  } else {
    body = `Pressure mix is varied: ${pressures.length} active across ${sortedTypes.length} different types. No single dominant theme — each pressure deserves its own decision posture.`;
  }

  // Add a portfolio-shape addendum: aligned-callouts highlight where to defend.
  const aligned = initiatives.filter((i) => i.alignedCallout);
  if (aligned.length > 0) {
    const ids = aligned.map((i) => i.displayId).join(' and ');
    body += ` ${ids} ${pluralize(aligned.length, 'is', 'are')} flagged as aligned-callout — defend ${pluralize(aligned.length, 'it', 'them')} while the pressures elsewhere are resolved.`;
  }

  return {
    number,
    topic: 'Portfolio pattern',
    body,
    actions: [
      {
        label: 'See programs lagging on value',
        href: '/programs?lens=value',
      },
    ],
  };
}

/**
 * Obs 03 — look-ahead. Strategic bets, foundation-phase items, or upcoming
 * vendor renewals beyond the 90d window.
 */
function composeLookAheadObservation(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
  number: number,
): AtlasObservation | null {
  const strategicBets = initiatives.filter(
    (i) =>
      i.stage === 'multi_year_strategic_bet' &&
      i.statusFlag === 'foundation_phase' &&
      (i.measuredValueUsd === null || i.measuredValueUsd <= 0),
  );

  const today = Date.parse(todayIso);
  const upcomingRenewals = vendors
    .filter((v) => v.renewalDate !== null)
    .filter((v) => {
      const t = Date.parse(v.renewalDate!);
      const days = (t - today) / (1000 * 60 * 60 * 24);
      return days > 90 && days <= 365;
    })
    .sort((a, b) => Date.parse(a.renewalDate!) - Date.parse(b.renewalDate!));

  if (strategicBets.length === 0 && upcomingRenewals.length === 0) {
    return null;
  }

  const bits: string[] = [];
  const actions: AtlasObservationAction[] = [];

  if (strategicBets.length > 0) {
    const lead = strategicBets[0]!;
    const totalCommitted = strategicBets.reduce(
      (s, b) => s + (b.committedTotalUsd ?? b.committedAnnualUsd ?? 0),
      0,
    );
    bits.push(
      `${strategicBets.length} multi-year strategic bet${pluralize(strategicBets.length, '', 's')} (${strategicBets.map((b) => b.displayId).join(', ')}) ${pluralize(strategicBets.length, 'is', 'are')} in foundation phase totaling ${formatUsdCompact(totalCommitted)} committed. Won't show measured value until programs migrate; attribution to ${lead.displayId} is loose by design.`,
    );
    actions.push({
      label: `Review ${lead.displayId} strategic bet`,
      href: `/admin/ai-initiatives/${encodeURIComponent(lead.initiativeId)}`,
    });
  }

  if (upcomingRenewals.length > 0) {
    const lead = upcomingRenewals[0]!;
    const t = Date.parse(lead.renewalDate!);
    const days = Math.floor((t - today) / (1000 * 60 * 60 * 24));
    bits.push(
      `${upcomingRenewals.length} vendor renewal${pluralize(upcomingRenewals.length, '', 's')} sit${pluralize(upcomingRenewals.length, 's', '')} in the 90–365 day horizon (next: ${lead.vendorName} in ${days}d).`,
    );
  }

  return {
    number,
    topic: 'Look-ahead',
    body: bits.join(' '),
    actions,
  };
}

/** Compose 1–3 observations for a healthy portfolio (no pressures). */
function composeHealthyObservations(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
): ReadonlyArray<AtlasObservation> {
  const aligned = initiatives.filter((i) => i.alignedCallout);
  const scaled = initiatives.filter((i) => i.stage === 'scaled');

  const observations: AtlasObservation[] = [];

  if (initiatives.length > 0) {
    const ids = aligned.length > 0 ? aligned.map((i) => i.displayId).join(' and ') : null;
    observations.push({
      number: 1,
      topic: 'Healthy posture',
      body: ids
        ? `Portfolio is healthy this week. ${ids} ${pluralize(aligned.length, 'leads', 'lead')} on aligned-value; ${scaled.length} of ${initiatives.length} initiatives ${pluralize(scaled.length, 'is', 'are')} in scaled stage. No active CFO-decision pressures.`
        : `Portfolio is healthy this week. ${scaled.length} of ${initiatives.length} initiatives ${pluralize(scaled.length, 'is', 'are')} in scaled stage. No active CFO-decision pressures.`,
      actions: [
        { label: 'Open Executive brief', href: '/tower?tab=executive_brief' },
      ],
    });
  }

  const lookAhead = composeLookAheadObservation(initiatives, vendors, todayIso, observations.length + 1);
  if (lookAhead) observations.push(lookAhead);

  return observations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the Atlas observations view from substrate + composed pressures.
 * Returns an empty view (with hint) if neither initiatives nor vendors are
 * loaded.
 */
export function buildTowerAtlasObservationsView(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  pressuresView: TowerPressuresView,
  todayIso: string,
): AtlasObservationsView {
  if (initiatives.length === 0 && vendors.length === 0) {
    return {
      headline: 'Atlas needs substrate to synthesize observations.',
      metaSuffix: 'No initiatives loaded',
      observations: [],
      ifYouOnlyDoOneToday:
        'Load initiatives via Setup → AI Initiatives so Atlas can observe pressures, value, and renewal posture.',
      suggestedPrompts: DEFAULT_PROMPTS,
      isEmpty: true,
      emptyHint: 'Atlas is empty until substrate is loaded.',
      deterministicSeed: true,
    };
  }

  const observations: AtlasObservation[] = [];

  if (pressuresView.cards.length > 0) {
    // 3-observation pressure composition.
    const top = pressuresView.cards[0]!;
    observations.push(composeTopPressureObservation(top, observations.length + 1));

    const pattern = composePortfolioPatternObservation(
      pressuresView.cards,
      initiatives,
      observations.length + 1,
    );
    if (pattern) observations.push(pattern);

    const lookAhead = composeLookAheadObservation(
      initiatives,
      vendors,
      todayIso,
      observations.length + 1,
    );
    if (lookAhead) observations.push(lookAhead);
  } else {
    // Healthy portfolio → 1–2 observations.
    observations.push(...composeHealthyObservations(initiatives, vendors, todayIso));
  }

  // Cap at 3 observations.
  const capped = observations.slice(0, 3);

  // Headline scales with observation count.
  const wordCount: Record<number, string> = { 1: 'One', 2: 'Two', 3: 'Three' };
  const numberWord = wordCount[capped.length] ?? `${capped.length}`;
  const headline =
    pressuresView.cards.length > 0
      ? `${numberWord} thread${pluralize(capped.length, '', 's')} run${pluralize(capped.length, 's', '')} through this morning's pressures.`
      : capped.length === 0
        ? "Portfolio is quiet this morning. Nothing demands a CFO decision today."
        : `${numberWord} read${pluralize(capped.length, '', 's')} on a healthy portfolio this morning.`;

  // Compose "If you only do one thing today" from the top observation.
  const top = capped[0];
  const ifYouOnlyDoOneToday = top
    ? top.actions.length > 0
      ? `${top.actions[0]!.label}. ${top.topic} is the highest-priority CFO posture this week.`
      : `Read the ${top.topic.toLowerCase()} observation. Other pressures route through it.`
    : 'No pressures need a decision today. Use the time to review strategic bets.';

  // Suggested prompts: prefer prompts that match observed pressure types.
  const observedTypes = new Set(pressuresView.cards.map((c) => c.type));
  const matchedPrompts = [...observedTypes]
    .map((t) => PROMPTS_BY_PRESSURE_TYPE[t])
    .filter((p): p is string => p !== undefined);
  const remaining = DEFAULT_PROMPTS.filter((p) => !matchedPrompts.includes(p));
  const suggestedPrompts = [...matchedPrompts, ...remaining].slice(0, 4);

  const metaSuffix = `${capped.length} observation${pluralize(capped.length, '', 's')} · ${suggestedPrompts.length} prompts`;

  return {
    headline,
    metaSuffix,
    observations: capped,
    ifYouOnlyDoOneToday,
    suggestedPrompts,
    isEmpty: false,
    emptyHint: null,
    deterministicSeed: true,
  };
}

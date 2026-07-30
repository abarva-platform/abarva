/**
 * Pure render-gate decision logic for the Knowledge UI. No JSX here on purpose --
 * this module is the single place that decides "may this envelope's data be
 * rendered as fact" so every component (table, chart, card, banner) makes that
 * call the same way, per the AGENTS.md render-gate discipline:
 *
 *   missing is never rendered as zero; uncertified is never rendered as clean;
 *   proposed is never rendered as accepted; restricted evidence is never
 *   exposed; stale data is visibly marked, not silently shown fresh; unobserved
 *   metrics produce no chart; unsupported/candidate relationships are not
 *   rendered as accepted edges.
 */

import type {
  AuthorityState,
  AvailabilityState,
  ConsumptionEnvelope,
  FreshnessState,
} from "@/lib/knowledge/providers/types";

export type GateTone =
  | "blocked"
  | "restricted"
  | "stale"
  | "gap"
  | "candidate"
  | "neutral";

export interface GateDecision {
  /** true only when the envelope's data may be handed to a render function as fact. */
  readonly renderable: boolean;
  readonly tone: GateTone;
  readonly title: string;
  readonly body: string;
}

const AVAILABILITY_TITLES: Record<AvailabilityState, string> = {
  available: "Available",
  not_loaded: "Not loaded",
  not_measured: "Not measured",
  withheld: "Withheld",
  conflicting: "Sources disagree",
  stale: "Needs refresh",
  not_applicable: "Not assessed",
};

const AVAILABILITY_BODY: Record<AvailabilityState, string> = {
  available: "",
  not_loaded:
    "The source for this has not been received or has not been published into the governed knowledge layer yet.",
  not_measured:
    "No observation exists for this yet. Shown as absent, never as zero.",
  withheld:
    "This is classified or otherwise access-restricted. Its existence and state are shown; its content is not.",
  conflicting:
    "Two or more accepted sources disagree here. Held out of decisions until the disagreement is resolved.",
  stale:
    "The last accepted evidence for this has aged past its refresh window.",
  not_applicable:
    "This domain is not published for this tenant. Not the same as clean or zero -- it has not been assessed.",
};

/**
 * Core gate: decide whether an envelope's `data` may be treated as fact by a
 * component. `available` is necessary but not sufficient -- a `candidate` or
 * `proposed`/`disputed` authorityState still blocks rendering as accepted
 * truth unless the caller explicitly opts into rendering candidates (the
 * Relationships "Show candidates" toggle is the one legitimate opt-in case,
 * handled by callers via `allowCandidate`).
 */
export function gateEnvelope<T>(
  envelope: Pick<
    ConsumptionEnvelope<T>,
    "availabilityState" | "authorityState" | "freshnessState" | "data"
  >,
  options: { readonly allowCandidate?: boolean } = {},
): GateDecision {
  const { availabilityState, authorityState, freshnessState, data } = envelope;

  if (
    availabilityState !== "available" ||
    data === null ||
    data === undefined
  ) {
    return {
      renderable: false,
      tone: toneForAvailability(availabilityState),
      title: AVAILABILITY_TITLES[availabilityState],
      body: AVAILABILITY_BODY[availabilityState],
    };
  }

  if (
    authorityState &&
    !options.allowCandidate &&
    (authorityState === "candidate" ||
      authorityState === "disputed" ||
      authorityState === "proposed")
  ) {
    return {
      renderable: false,
      tone: authorityState === "disputed" ? "gap" : "candidate",
      title: authorityTitle(authorityState),
      body: authorityBody(authorityState),
    };
  }

  if (freshnessState === "stale") {
    // Stale data may still render -- it must be visibly marked, not withheld
    // outright (per the rule "stale data is visibly marked, not silently
    // shown fresh"). Callers render the data AND a stale badge.
    return {
      renderable: true,
      tone: "stale",
      title: "Needs refresh",
      body: "This is the last accepted value. It has aged past its normal refresh window.",
    };
  }

  return { renderable: true, tone: "neutral", title: "Available", body: "" };
}

function toneForAvailability(state: AvailabilityState): GateTone {
  switch (state) {
    case "withheld":
      return "restricted";
    case "conflicting":
      return "gap";
    case "stale":
      return "stale";
    case "not_applicable":
      return "neutral";
    default:
      return "blocked";
  }
}

function authorityTitle(state: AuthorityState): string {
  switch (state) {
    case "candidate":
      return "Candidate -- awaiting review";
    case "disputed":
      return "Disputed";
    case "proposed":
      return "Proposed, not approved";
    default:
      return "Not yet accepted";
  }
}

function authorityBody(state: AuthorityState): string {
  switch (state) {
    case "candidate":
      return "This has not been reviewed. It stays out of accepted knowledge, counts, and decisions until it is.";
    case "disputed":
      return "This is contested between accepted sources and cannot support a decision until resolved.";
    case "proposed":
      return "This is a proposed target, not an approved plan of record. It renders separately from current state.";
    default:
      return "";
  }
}

/** True when a freshness value should show a visible "stale" badge alongside
 * otherwise-renderable content. */
export function isVisiblyStale(freshnessState: FreshnessState): boolean {
  return freshnessState === "stale";
}

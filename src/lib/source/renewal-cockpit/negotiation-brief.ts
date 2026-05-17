// Renewal Cockpit — negotiation brief composer (Practitioner-Fit §4).
//
// The Negotiation Room re-fronts commercial advice as a brief: walk-away
// position, must-have terms, give/get concessions, BATNA. The full Slice 1.5
// negotiation-posture generator needs a proposal-normalization matrix — an
// artifact a *renewal* does not have (there are no competing proposals yet).
// So this module composes a renewal-shaped brief directly from the cockpit's
// already-grounded evidence: the should-cost gap, the incumbent-leverage
// read, and the scouted alternatives.
//
// Every line is grounded — when the cockpit lacks the fact behind a brief
// item, that item is simply omitted. No fabricated leverage.
//
// Pure module: no DB, no network, no clock. Deterministic for a cockpit.

import type { RenewalCockpit } from './cockpit';

/** One negotiable point in the brief, with the script to use it. */
export interface BriefPoint {
  /** Short imperative title — the lever or term named. */
  title: string;
  /** The grounded rationale — what in the cockpit makes this real. */
  rationale: string;
}

/** A renewal negotiation brief — the VP's prep sheet for the vendor call. */
export interface RenewalNegotiationBrief {
  /** Deal label — vendor + product. */
  dealLabel: string;
  /** The opening commercial position the VP should take into the room. */
  headline: string;
  /** The walk-away position — what makes the buyer willing to leave. */
  walkAway: BriefPoint;
  /** The BATNA — the best alternative if this renewal does not land. */
  batna: BriefPoint;
  /** Levers worth pulling, strongest first. */
  levers: BriefPoint[];
  /** Concessions the buyer can offer cheaply in exchange for price. */
  concessions: BriefPoint[];
  /** True — keeps the surface honest that this is prep, not a signed deal. */
  isBrief: true;
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Compose a renewal negotiation brief from a Renewal Cockpit.
 *
 * The brief is renewal-specific: the incumbent IS the counterparty, so the
 * leverage read and the alternatives are the spine of the brief.
 */
export function buildRenewalNegotiationBrief(
  cockpit: RenewalCockpit,
): RenewalNegotiationBrief {
  const dealLabel = `${cockpit.vendorName} — ${cockpit.product}`;
  const sc = cockpit.shouldCost;

  const levers: BriefPoint[] = [];

  // Lever 1 — the should-cost / benchmark gap.
  if (sc.overspendVsBenchmarkUsd !== null && sc.overspendVsBenchmarkUsd > 0) {
    levers.push({
      title: `Press the ${formatUsd(sc.overspendVsBenchmarkUsd)} benchmark gap`,
      rationale: `Current spend runs ${formatUsd(
        sc.overspendVsBenchmarkUsd,
      )} above a defensible category benchmark. Anchor the conversation to the benchmark, not last year's price.`,
    });
  }

  // Lever 2 — competitive tension from scouted alternatives.
  if (cockpit.alternatives.length > 0) {
    const names = cockpit.alternatives.map((a) => a.vendorName).join(', ');
    levers.push({
      title: 'Make the competitive tension explicit',
      rationale: `Deal-ready alternatives are scouted (${names}). Competitive tension is the strongest lever on a renewal — name it on the call.`,
    });
  }

  // Lever 3 — shelfware / utilization.
  if (
    cockpit.usage.utilizationRate !== null &&
    cockpit.usage.utilizationRate < 0.7
  ) {
    levers.push({
      title: 'Right-size to actual utilization',
      rationale: `Utilization sits at ${Math.round(
        cockpit.usage.utilizationRate * 100,
      )}% of entitlement. Push to renew against consumed capacity, not the over-provisioned entitlement.`,
    });
  }

  // Lever 4 — timing pressure (only when the buyer holds it).
  if (
    cockpit.timing.daysToTermEnd !== null &&
    cockpit.timing.daysToTermEnd > 60
  ) {
    levers.push({
      title: 'Use the runway as leverage',
      rationale: `${cockpit.timing.daysToTermEnd} days remain on the term — enough runway to run a credible process. Time pressure favors the buyer here, not the vendor.`,
    });
  }

  // The leverage read always carries a play — surface it as a lever too.
  levers.push({
    title: 'Incumbent-leverage play',
    rationale: cockpit.leverage.recommendedPlay,
  });

  // Concessions — cheap-to-give, valuable-to-vendor.
  const concessions: BriefPoint[] = [
    {
      title: 'Offer a multi-year commitment',
      rationale:
        'A two- or three-year term is low-cost to the buyer and valuable to the vendor — trade it explicitly for a price reduction, not a rate hold.',
    },
    {
      title: 'Offer reference / case-study value',
      rationale:
        'If the buyer is a credible logo, a reference commitment is free to give and material to the vendor. Trade it for commercial concessions.',
    },
  ];

  const walkAway: BriefPoint =
    cockpit.leverage.leverageHolder === 'vendor'
      ? {
          title: 'Walk-away is constrained — set it deliberately',
          rationale:
            'Leverage currently sits with the vendor. Define the walk-away price internally before the call, and do not signal it; scout an alternative to move the line.',
        }
      : {
          title: 'Walk-away: the benchmark plus a defensible premium',
          rationale: `The buyer can credibly walk if the vendor will not move toward the benchmark. ${
            cockpit.alternatives.length > 0
              ? 'A scouted alternative makes the walk-away real.'
              : 'Scouting one alternative would make the walk-away credible.'
          }`,
        };

  const batna: BriefPoint =
    cockpit.alternatives.length > 0
      ? {
          title: `BATNA: switch to ${cockpit.alternatives[0].vendorName}`,
          rationale: cockpit.alternatives[0].switchingNote,
        }
      : {
          title: 'BATNA is thin — invest in one before the call',
          rationale:
            'No deal-ready alternative is scouted. Without a BATNA the incumbent holds the price; scouting one materially shifts the room.',
        };

  return {
    dealLabel,
    headline: `Open from the recommended posture — ${cockpit.postureLabel.toLowerCase()}. ${cockpit.postureRationale}`,
    walkAway,
    batna,
    levers,
    concessions,
    isBrief: true,
  };
}

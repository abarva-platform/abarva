// Renewal Cockpit — vendor email draft generator (Practitioner-Fit §4).
//
// Turns a `RenewalCockpit` view-model into a vendor-facing email draft a VP
// can copy into their mail client and edit. The draft is grounded entirely in
// the cockpit's posture + evidence — it never invents a number, a date, or a
// commitment. When the cockpit lacks a fact (an unpriced contract, an
// unmeasured utilization), the draft omits the corresponding sentence rather
// than fabricating one.
//
// Pure module: no DB, no network, no clock. Deterministic for a given
// cockpit. This is a *draft* — the cockpit surface labels it as such and the
// VP is the one who sends it.

import type { RenewalCockpit, RenewalPosture } from './cockpit';

/** A vendor-facing email draft, ready to be reviewed and sent by the VP. */
export interface VendorEmailDraft {
  /** The email subject line. */
  subject: string;
  /** The email body — plain text, paragraph-separated by blank lines. */
  body: string;
  /**
   * The posture the draft is written from — lets the surface label the tone
   * ("renegotiation-pressure email" vs. "renewal-confirmation email").
   */
  posture: RenewalPosture;
  /**
   * Always `true` — a constant the surface uses to keep the "draft, not sent"
   * labelling honest. The generator never sends mail.
   */
  isDraft: true;
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** Opening line keyed to the posture — the tone the VP takes into the email. */
const POSTURE_OPENERS: Record<RenewalPosture, string> = {
  renew:
    'We are reviewing our upcoming renewal and want to confirm terms for the next period.',
  renegotiate:
    'Ahead of our upcoming renewal, we need to revisit the commercial terms before we can commit to another period.',
  rebid:
    'Ahead of our upcoming renewal, we are formally evaluating the market for this capability and want to give you the opportunity to participate.',
  consolidate:
    'As part of a portfolio review, we are consolidating overlapping capability and need to discuss how this contract fits the consolidated footprint.',
  exit:
    'Following a review of usage and fit, we are planning to wind down this engagement and want to coordinate an orderly transition.',
};

/** Closing ask keyed to the posture. */
const POSTURE_CLOSERS: Record<RenewalPosture, string> = {
  renew:
    'Please confirm the renewal terms in writing so we can complete this ahead of the deadline.',
  renegotiate:
    'Please come back with a revised proposal that reflects the points above. We are ready to move quickly once the commercials work.',
  rebid:
    'Please confirm whether you intend to submit a proposal, and we will share the evaluation timeline and requirements.',
  consolidate:
    'Please let us know your flexibility on scope and term so we can model the consolidated arrangement.',
  exit:
    'Please confirm the notice requirements and the data-export and offboarding support available during transition.',
};

/**
 * Build a vendor-facing email draft from a Renewal Cockpit.
 *
 * The body is assembled from sentences that are each individually grounded:
 * a sentence is included only when the cockpit carries the fact behind it.
 */
export function buildVendorEmailDraft(cockpit: RenewalCockpit): VendorEmailDraft {
  const posture = cockpit.recommendedPosture;
  const vendorLabel = `${cockpit.vendorName} — ${cockpit.product}`;

  const subject = `${vendorLabel}: ${cockpit.postureLabel} discussion ahead of renewal`;

  const paragraphs: string[] = [];

  // 1. Opening — posture-keyed.
  paragraphs.push(`Hello,\n\n${POSTURE_OPENERS[posture]}`);

  // 2. The grounded facts — each sentence guarded by the fact existing.
  const facts: string[] = [];
  if (cockpit.currentAnnualSpendUsd !== null) {
    facts.push(
      `Our current annual spend on this contract is ${formatUsd(cockpit.currentAnnualSpendUsd)}.`,
    );
  }
  if (cockpit.timing.termEndDate) {
    facts.push(`The current term ends ${cockpit.timing.termEndDate}.`);
  }
  if (cockpit.timing.autoRenew && cockpit.timing.daysToNoticeDeadline !== null) {
    facts.push(
      `This contract auto-renews; the notice deadline is ${cockpit.timing.daysToNoticeDeadline} day(s) away.`,
    );
  }
  if (
    cockpit.usage.utilizationRate !== null &&
    cockpit.usage.utilizationRate < 0.7
  ) {
    facts.push(
      `Our internal review shows utilization at ${Math.round(
        cockpit.usage.utilizationRate * 100,
      )}% of the entitlement, which we will want to reflect in the next term.`,
    );
  }
  if (
    cockpit.shouldCost.overspendVsBenchmarkUsd !== null &&
    cockpit.shouldCost.overspendVsBenchmarkUsd > 0
  ) {
    facts.push(
      `Our benchmarking puts the current spend ${formatUsd(
        cockpit.shouldCost.overspendVsBenchmarkUsd,
      )} above a defensible category benchmark.`,
    );
  }
  if (facts.length > 0) {
    paragraphs.push(facts.join(' '));
  }

  // 3. The leverage / alternatives line — only when there is something real.
  if (posture !== 'renew' && cockpit.alternatives.length > 0) {
    const altNames = cockpit.alternatives.map((a) => a.vendorName).join(', ');
    paragraphs.push(
      `We have viable alternatives under evaluation (${altNames}), so we are approaching this renewal as a genuine commercial decision rather than a formality.`,
    );
  }

  // 4. Closing ask — posture-keyed.
  paragraphs.push(POSTURE_CLOSERS[posture]);

  paragraphs.push('Thank you,\n[Your name]');

  return {
    subject,
    body: paragraphs.join('\n\n'),
    posture,
    isDraft: true,
  };
}

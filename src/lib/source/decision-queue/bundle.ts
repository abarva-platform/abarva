// Decision Queue bundling — raw detector hits → one card per contract.
//
// The usability review (docs/strategy/VP-SOURCING-USABILITY-TEST-SCRIPT.md)
// found the queue emitting a renewal card + a notice-window card + a savings
// card for the SAME contract — three competing rows for one decision. The VP
// asked for ONE decision bundle per contract/vendor (Practitioner-Fit FIX 2):
// a single headline, with the renewal / notice-window / benchmark / shelfware
// signals living *inside* the card as grounded sub-issues.
//
// The detectors are unchanged: they still emit `SourceDecisionItem`s. This
// pure layer folds those items into `SourceDecisionBundle`s, keyed on the
// contract id carried in `evidenceRefs[0]`. No fabrication — a bundle only
// ever carries sub-issues that came from a real detector hit.
//
// Pure: no DB, no network, no clock.

import type { SourceDecisionItem } from './types';
import type {
  DecisionPosture,
  DecisionSubIssue,
  DecisionTriggerKind,
  DecisionUrgency,
  SourceDecisionBundle,
} from './types';
import { URGENCY_ORDER } from './types';

/** Short sub-issue labels per detector kind. */
const SUB_ISSUE_LABEL: Record<DecisionTriggerKind, string> = {
  renewal: 'Renewal approaching',
  notice_window: 'Notice window closing',
  savings_opportunity: 'Spend above benchmark',
  overlap_shelfware: 'Overlap / shelfware',
  blocked_missing_evidence: 'Context gap',
};

/**
 * The contract id a detector item is anchored to. Every contract-scoped
 * detector puts the contract id first in `evidenceRefs`; overlap cards anchor
 * on their lowest contract id (also `evidenceRefs[0]`). Blocked-evidence items
 * carry no contract id — they bundle on their own `itemId`.
 */
function anchorContractId(item: SourceDecisionItem): string | null {
  if (item.kind === 'blocked_missing_evidence') return null;
  const first = item.evidenceRefs[0];
  return first && first.trim().length > 0 ? first : null;
}

/** The more-urgent of two bands. */
function moreUrgent(a: DecisionUrgency, b: DecisionUrgency): DecisionUrgency {
  return URGENCY_ORDER[a] <= URGENCY_ORDER[b] ? a : b;
}

/**
 * Pick the bundle posture from the set of contributing kinds. Notice-window
 * and renewal => renegotiate; an overlap dominates as consolidate; a lone
 * shelfware flag => right_size; a blocked gap => unblock.
 */
function derivePosture(kinds: Set<DecisionTriggerKind>): DecisionPosture {
  if (kinds.has('blocked_missing_evidence')) return 'unblock';
  if (kinds.has('overlap_shelfware') && kinds.size === 1) return 'right_size';
  if (kinds.has('overlap_shelfware')) return 'consolidate';
  if (kinds.has('notice_window') || kinds.has('savings_opportunity')) {
    return 'renegotiate';
  }
  if (kinds.has('renewal')) return 'review';
  return 'review';
}

const POSTURE_LABEL: Record<DecisionPosture, string> = {
  renegotiate: 'renegotiate',
  consolidate: 'consolidate',
  right_size: 'right-size',
  review: 'review',
  unblock: 'unblock',
};

/** Convert one detector item into a sub-issue inside a bundle. */
function toSubIssue(item: SourceDecisionItem): DecisionSubIssue {
  return {
    kind: item.kind,
    label: SUB_ISSUE_LABEL[item.kind],
    detail: item.whyItMatters,
    valueAtStakeUsd: item.valueAtStakeUsd,
    evidenceRefs: item.evidenceRefs,
  };
}

function formatUsdShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

/**
 * Extract a vendor name from a renewal/notice headline of the shape
 * "Vendor — Product renewal in N days". Falls back to the raw headline.
 */
function vendorFromHeadline(headline: string): string {
  const dash = headline.indexOf(' — ');
  return dash > 0 ? headline.slice(0, dash) : headline;
}

/**
 * Fold raw detector items into one bundle per contract/vendor decision.
 *
 * Deterministic: items for the same contract always bundle the same way, and
 * sub-issues are ordered by detector-kind priority (renewal, notice_window,
 * savings, overlap) so the same input always yields an identical bundle.
 */
export function bundleDecisionItems(
  clientKey: string,
  items: SourceDecisionItem[],
  surfacedAt: string,
): SourceDecisionBundle[] {
  // Group by the bundle key — contract id, or the item id for non-contract
  // (blocked-evidence) items.
  const groups = new Map<string, SourceDecisionItem[]>();
  for (const item of items) {
    const contractId = anchorContractId(item);
    const key = contractId ?? `gap:${item.itemId}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  // Sub-issue display priority — most decision-relevant first.
  const KIND_PRIORITY: Record<DecisionTriggerKind, number> = {
    renewal: 0,
    notice_window: 1,
    savings_opportunity: 2,
    overlap_shelfware: 3,
    blocked_missing_evidence: 4,
  };

  const bundles: SourceDecisionBundle[] = [];
  for (const [key, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind],
    );
    const contractId = anchorContractId(sorted[0]);
    const kinds = new Set(sorted.map((i) => i.kind));
    const posture = derivePosture(kinds);

    // Urgency = the most-urgent band across the bundle's sub-issues.
    const urgency = sorted.reduce<DecisionUrgency>(
      (acc, i) => moreUrgent(acc, i.urgency),
      'watch',
    );

    // Value at stake = the largest quantified sub-issue, NOT a sum — summing
    // a renewal ACV and an overlap total would double-count the same dollars.
    const quantified = sorted
      .map((i) => i.valueAtStakeUsd)
      .filter((v): v is number => v !== null);
    const valueAtStakeUsd =
      quantified.length > 0 ? Math.max(...quantified) : null;

    // The bundle anchors on the highest-priority sub-issue's framing.
    const anchor = sorted[0];
    const vendorName = vendorFromHeadline(anchor.headline);

    // Compose the headline: "<Vendor> renewal · <urgency phrase> · <value> ·
    // posture: <posture>". Only include the parts that are grounded.
    const headlineParts: string[] = [anchor.headline];
    if (valueAtStakeUsd !== null) {
      headlineParts.push(`${formatUsdShort(valueAtStakeUsd)} at stake`);
    }
    headlineParts.push(`posture: ${POSTURE_LABEL[posture]}`);
    const headline = headlineParts.join(' · ');

    const otherCount = sorted.length - 1;
    const summary =
      otherCount > 0
        ? `${anchor.whyItMatters} ${otherCount} further signal${
            otherCount === 1 ? '' : 's'
          } on this contract — see the breakdown below.`
        : anchor.whyItMatters;

    const evidenceRefs = Array.from(
      new Set(sorted.flatMap((i) => i.evidenceRefs)),
    );

    bundles.push({
      bundleId: contractId ? `bundle:${contractId}` : `bundle:${key}`,
      clientKey,
      contractId,
      vendorName,
      urgency,
      headline,
      summary,
      posture,
      recommendedAction: anchor.recommendedAction,
      deepLink: anchor.deepLink,
      subIssues: sorted.map(toSubIssue),
      evidenceRefs,
      valueAtStakeUsd,
      surfacedAt,
      // The pure assembler has no data plane — accountability is enriched
      // from persisted `sourcing_work_items` by the loader. Always null here.
      accountability: null,
    });
  }
  return bundles;
}

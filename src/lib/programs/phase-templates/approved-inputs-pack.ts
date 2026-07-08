// Moves — the approved next-phase Inputs Pack (Level 2 feed-forward).
// When the client confirms the What-Changed review, AbarVa assembles this
// Move-scoped payload and persists it through the EXISTING governed artifact
// store (no new table). The next phase reads the latest approved pack if
// present; otherwise it falls back to deterministic feed-forward from current
// state. Pure + typed here — storage lives in the adapter/route. NEVER promoted
// to enterprise context.

import type { FeedForwardPack } from './feed-forward';
import type { WhatChangedResult } from './what-changed';

/** The discriminator used in the existing artifact store's `type`/`kind`. */
export const APPROVED_INPUTS_PACK_TYPE = 'approved_inputs_pack';

export interface ApprovedInputsPackSection {
  title: string;
  items: string[];
}

export interface ApprovedInputsPack {
  moveId: string;
  /** The phase whose review produced this pack (e.g. 2 for a P2→P3 hand-off). */
  sourcePhase: number;
  /** The phase that should read this pack (e.g. 3). */
  targetPhase: number;
  targetPhaseLabel: string;
  approvedBy: string;
  /** ISO timestamp — supplied by the caller (deterministic core takes no clock). */
  approvedAt: string;
  /** The completed-template upload this was reviewed from, if any. */
  sourceUploadId: string | null;
  /** Plain-English carry-forward bullets. */
  carriesForward: string[];
  /** The populated feed-forward sections. */
  sections: ApprovedInputsPackSection[];
  /** What the client changed vs. the draft, if a comparison was made. */
  changeSummary: {
    sectionsChanged: string[];
    sectionsAdded: string[];
    sectionsRemoved: string[];
  } | null;
  /** Invariants: Move-scoped, never auto-promoted. */
  moveScopedOnly: true;
  enterprisePromotion: 'not_eligible';
}

export interface BuildApprovedInputsPackInput {
  moveId: string;
  sourcePhase: number;
  targetPhase: number;
  targetPhaseLabel: string;
  approvedBy: string;
  approvedAt: string;
  sourceUploadId?: string | null;
  feedForward: FeedForwardPack;
  whatChanged?: WhatChangedResult | null;
}

export function buildApprovedInputsPack(
  input: BuildApprovedInputsPackInput,
): ApprovedInputsPack {
  const sections: ApprovedInputsPackSection[] = input.feedForward.sections
    .filter((s) => s.status === 'ready' && s.items.length > 0)
    .map((s) => ({ title: s.title, items: s.items }));

  const changeSummary =
    input.whatChanged && input.whatChanged.hasChanges
      ? {
          sectionsChanged: input.whatChanged.sectionsChanged,
          sectionsAdded: input.whatChanged.sectionsAdded,
          sectionsRemoved: input.whatChanged.sectionsRemoved,
        }
      : null;

  return {
    moveId: input.moveId,
    sourcePhase: input.sourcePhase,
    targetPhase: input.targetPhase,
    targetPhaseLabel: input.targetPhaseLabel,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    sourceUploadId: input.sourceUploadId ?? null,
    carriesForward: input.feedForward.carriesForward,
    sections,
    changeSummary,
    moveScopedOnly: true,
    enterprisePromotion: 'not_eligible',
  };
}

/** Type guard for a persisted payload read back from the artifact store. */
export function isApprovedInputsPack(x: unknown): x is ApprovedInputsPack {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.moveId === 'string' &&
    typeof p.targetPhase === 'number' &&
    p.moveScopedOnly === true &&
    p.enterprisePromotion === 'not_eligible' &&
    Array.isArray(p.sections)
  );
}

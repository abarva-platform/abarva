// deliverable-canvas-polish-view.ts — PROG22
//
// Deliverables canvas interaction polish view model.
//
// Answers: "Can this deliverable be trusted or approved?"
//
// Projects the phasePanel deliverables + evidenceItems into an enriched
// canvas view with per-item readiness, evidence trace, missing inputs,
// and disabled approval/export actions.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// Approval and export actions are ALWAYS disabled — no real state machine here.

import type { ProgramDetailView, EvidenceItem } from './programs-types';
import { PHASE_LABEL_MAP } from './programs-fixture';
import type { ProgramPhaseId } from './programs-types';

// ─── Output types ─────────────────────────────────────────────────────────────

/** Per-deliverable readiness classification. */
export type DelCanvasItemReadiness =
  | 'trustworthy'        // done + evidence on file
  | 'partial'            // pending + some evidence present
  | 'missing_evidence'   // pending + no usable evidence
  | 'blocked';           // blocked status

export type DelCanvasActionKey = 'approve' | 'export';

export interface DelCanvasAction {
  key: DelCanvasActionKey;
  label: string;
  enabled: false;
  /** Why this action is not yet available. */
  reason: string;
}

export interface DelCanvasItem {
  /** Original deliverable label from fixture. */
  label: string;
  /** Lifecycle status from fixture. */
  status: 'done' | 'pending' | 'blocked';
  /** Derived trustworthiness classification. */
  readiness: DelCanvasItemReadiness;
  /** Human-readable readiness label. */
  readinessLabel: string;
  /**
   * Evidence citation strings that back this deliverable.
   * Empty when no usable evidence is available.
   */
  evidenceCitations: string[];
  /**
   * What must be resolved before this deliverable can be approved.
   * Empty for 'done' items.
   */
  missingInputs: string[];
  /** What the owner should do next for this item. */
  nextAction: string;
  /** Both approve and export are always disabled. */
  actions: DelCanvasAction[];
}

export interface DeliverablesCanvasView {
  phaseLabel: string;
  /** Prioritised: current-phase blocked first, then pending, then done. */
  items: DelCanvasItem[];
  totalCount: number;
  doneCount: number;
  pendingCount: number;
  blockedCount: number;
  /** "3 of 5 deliverables complete" */
  canvasSummary: string;
  /**
   * Honest disclaimer.
   * Approval and export are deferred; content is deterministic seed only.
   */
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_REASONS: Record<DelCanvasActionKey, string> = {
  approve:
    'Steward sign-off is not yet wired — approval state machine deferred to a later slice.',
  export:
    'Export pipeline is deferred to a later slice; no live download available.',
};

const MISSING_INPUTS_BY_STATUS: Record<'pending' | 'blocked', string[]> = {
  pending: [
    'Supporting evidence not yet linked',
    'Steward review not yet scheduled',
  ],
  blocked: [
    'Blocking dependency must be resolved',
    'Steward sign-off required before this deliverable can advance',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveReadiness(
  status: 'done' | 'pending' | 'blocked',
  hasEvidence: boolean,
): DelCanvasItemReadiness {
  if (status === 'blocked') return 'blocked';
  if (status === 'done') return 'trustworthy';
  return hasEvidence ? 'partial' : 'missing_evidence';
}

function readinessLabel(r: DelCanvasItemReadiness): string {
  switch (r) {
    case 'trustworthy':      return 'Trustworthy';
    case 'partial':          return 'Partial evidence';
    case 'missing_evidence': return 'Missing evidence';
    case 'blocked':          return 'Blocked';
  }
}

function nextActionFor(
  status: 'done' | 'pending' | 'blocked',
  readiness: DelCanvasItemReadiness,
): string {
  if (status === 'done') return 'Confirm with Steward';
  if (status === 'blocked') return 'Resolve blocking dependency';
  if (readiness === 'missing_evidence') return 'Upload or link supporting evidence';
  return 'Complete remaining evidence gaps';
}

/**
 * Select supporting evidence citations for a done deliverable.
 * For pending/blocked items we show nothing (evidence is missing/contradicting).
 */
function selectEvidence(
  status: 'done' | 'pending' | 'blocked',
  items: EvidenceItem[],
): string[] {
  if (status !== 'done' || items.length === 0) return [];
  return items
    .filter((e) => e.confidence !== 'low' && !e.hasContradiction)
    .map((e) => e.citation)
    .slice(0, 2);
}

function buildActions(): DelCanvasAction[] {
  return (['approve', 'export'] as DelCanvasActionKey[]).map((key) => ({
    key,
    label: key === 'approve' ? 'Approve' : 'Export',
    enabled: false as const,
    reason: ACTION_REASONS[key],
  }));
}

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the deliverables canvas polish view from a ProgramDetailView.
 *
 * Returns null when phasePanel.deliverables is missing or empty.
 */
export function buildDeliverablesCanvasView(
  view: ProgramDetailView,
): DeliverablesCanvasView | null {
  const { deliverables, evidenceItems } = view.phasePanel;
  if (!deliverables || deliverables.length === 0) return null;

  const phaseLabel =
    PHASE_LABEL_MAP[view.viewingPhase as ProgramPhaseId] ?? `Phase ${view.viewingPhase}`;
  const evidence = evidenceItems ?? [];

  const rawItems: DelCanvasItem[] = deliverables.map((d) => {
    const hasEvidence = evidence.some(
      (e) => e.confidence !== 'low' && !e.hasContradiction,
    );
    const readiness = deriveReadiness(d.status, hasEvidence);

    const missingInputs =
      d.status === 'done'
        ? []
        : MISSING_INPUTS_BY_STATUS[d.status as 'pending' | 'blocked'];

    return {
      label: d.label,
      status: d.status,
      readiness,
      readinessLabel: readinessLabel(readiness),
      evidenceCitations: selectEvidence(d.status, evidence),
      missingInputs,
      nextAction: nextActionFor(d.status, readiness),
      actions: buildActions(),
    };
  });

  // Sort: blocked first, then pending, then done — within each group keep original order
  const PRIORITY: Record<'done' | 'pending' | 'blocked', number> = {
    blocked: 0,
    pending: 1,
    done: 2,
  };
  const sortedItems = [...rawItems].sort(
    (a, b) => PRIORITY[a.status] - PRIORITY[b.status],
  );

  const doneCount = rawItems.filter((i) => i.status === 'done').length;
  const pendingCount = rawItems.filter((i) => i.status === 'pending').length;
  const blockedCount = rawItems.filter((i) => i.status === 'blocked').length;
  const totalCount = rawItems.length;
  const canvasSummary = `${doneCount} of ${totalCount} deliverables complete`;

  const honestDisclaimer =
    `Deterministic seed · ${view.displayId} P${view.viewingPhase} ${phaseLabel} deliverables ` +
    `reflect fixture context only. Approval and export actions are disabled — ` +
    `state machine and export pipeline are deferred.`;

  return {
    phaseLabel,
    items: sortedItems,
    totalCount,
    doneCount,
    pendingCount,
    blockedCount,
    canvasSummary,
    honestDisclaimer,
    deterministicSeed: true,
  };
}

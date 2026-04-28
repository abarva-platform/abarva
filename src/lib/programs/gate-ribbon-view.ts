// gate-ribbon-view.ts — PRG-STA-GATE-V2
//
// View model for the gate ribbon strip shown on ProgramDetailPage
// when a program's gateStatus is 'pending'.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Input: a ProgramDetailView (already built from the fixture or DB).
// Output: a GateRibbonView snapshot or null (if gate is not active).

import type { ProgramDetailView, ProgramPhaseId } from './programs-types';
import { PHASE_LABEL_MAP } from './programs-fixture';

// ─── Output types ────────────────────────────────────────────────────────────

export interface GateRibbonView {
  /** Phase currently active (e.g. 3 for Design) */
  fromPhase: ProgramPhaseId;
  /** Phase that would be unlocked (fromPhase + 1) */
  toPhase: ProgramPhaseId;
  fromPhaseLabel: string;
  toPhaseLabel: string;
  /** Formatted "P3 Design → P4 Build" */
  ribbonLabel: string;
  totalCriteria: number;
  metCriteria: number;
  unmetCriteria: string[];
  /** "2 of 5 criteria met" */
  gateSummary: string;
  /**
   * True when all criteria are met — enables the "Approve gate" button
   * without requiring an override rationale.
   */
  isAllMet: boolean;
  /**
   * True when at least one evidence item has hasContradiction = true.
   * Triggers the contradiction warning on the evidence panel.
   */
  hasContradiction: boolean;
  contradictionCount: number;
  /** Passed through from ProgramDetailView.gateStatus */
  gateStatus: 'pending';
  deterministicSeed: true;
}

// ─── Phase label helper (re-export for consumers) ─────────────────────────────

export function getPhaseLabel(phaseId: number): string {
  return PHASE_LABEL_MAP[phaseId as ProgramPhaseId] ?? `Phase ${phaseId}`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build the gate ribbon view model for a given ProgramDetailView.
 *
 * Returns null when:
 * - `gateStatus` is not 'pending'
 * - `phasePanel.gateCriteria` is missing or empty
 * - `currentPhase` is 6 (Operate — no next phase)
 */
export function buildGateRibbonView(
  view: ProgramDetailView,
): GateRibbonView | null {
  if (view.gateStatus !== 'pending') return null;
  const { gateCriteria, evidenceItems } = view.phasePanel;
  if (!gateCriteria || gateCriteria.length === 0) return null;
  if (view.currentPhase >= 6) return null;

  const fromPhase = view.currentPhase;
  const toPhase = (fromPhase + 1) as ProgramPhaseId;
  const fromPhaseLabel = getPhaseLabel(fromPhase);
  const toPhaseLabel = getPhaseLabel(toPhase);
  const ribbonLabel = `P${fromPhase} ${fromPhaseLabel} → P${toPhase} ${toPhaseLabel}`;

  const metCriteria = gateCriteria.filter((c) => c.met).length;
  const totalCriteria = gateCriteria.length;
  const unmetCriteria = gateCriteria
    .filter((c) => !c.met)
    .map((c) => c.criterion);
  const gateSummary = `${metCriteria} of ${totalCriteria} criteria met`;
  const isAllMet = metCriteria === totalCriteria;

  const contradictions = (evidenceItems ?? []).filter(
    (item) => item.hasContradiction === true,
  );
  const hasContradiction = contradictions.length > 0;
  const contradictionCount = contradictions.length;

  return {
    fromPhase,
    toPhase,
    fromPhaseLabel,
    toPhaseLabel,
    ribbonLabel,
    totalCriteria,
    metCriteria,
    unmetCriteria,
    gateSummary,
    isAllMet,
    hasContradiction,
    contradictionCount,
    gateStatus: 'pending',
    deterministicSeed: true,
  };
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Returns the short badge label rendered in the gate ribbon criteria chip.
 * e.g. "2 of 5" (without "criteria met")
 */
export function getGateBadgeLabel(ribbon: GateRibbonView): string {
  return `${ribbon.metCriteria} of ${ribbon.totalCriteria}`;
}

/**
 * Returns the approval posture copy for the modal button.
 * - All met: "Approve gate"
 * - Unmet items: "Approve with override"
 */
export function getApprovalButtonLabel(ribbon: GateRibbonView): string {
  return ribbon.isAllMet ? 'Approve gate' : 'Approve with override';
}

/**
 * Returns the Steward headline copy for the approval modal.
 * e.g. "Steward: P3 Design gate approval pending → P4 Build"
 */
export function getGateModalHeadline(ribbon: GateRibbonView): string {
  return `Steward: P${ribbon.fromPhase} ${ribbon.fromPhaseLabel} gate approval pending → P${ribbon.toPhase} ${ribbon.toPhaseLabel}`;
}

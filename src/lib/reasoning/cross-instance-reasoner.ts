// src/lib/reasoning/cross-instance-reasoner.ts
//
// REASON-18 — Cross-instance reasoner
//
// Pure functions that derive a renderable "linked program chip" payload from
// the linked ProgramInstance's current state. Replaces hardcoded chip text
// (e.g. "LINKED PROGRAM · APX-CDP-2026 P3 Design") so that if the linked
// program's phase or blocker status changes, the chip reflects the change
// at render time rather than lying.
//
// Deterministic: no network, no LLM calls, no randomness.

import type { LinkType } from './types';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Status color for the chip:
 * - `green` — linked program found, no open blocker affects the current phase
 * - `amber` — linked program has an open blocker whose phase ≤ current phase
 * - `gray`  — linked program could not be resolved
 */
export type LinkedProgramChipStatus = 'green' | 'amber' | 'gray';

/**
 * Pure data payload for rendering a linked-program chip.
 * Contains everything the UI needs — no JSX, no styling — so the same
 * payload can be rendered by a server component, a client chip, or asserted
 * against in tests.
 */
export interface LinkedProgramChipData {
  /** Constant label, e.g. "LINKED PROGRAM" — included so callers don't hardcode. */
  label: string;
  /** Numeric phase index of the linked program (0-6), or null if unresolved. */
  phase: number | null;
  /** Human label, e.g. "P3 Design", or "Unknown" if unresolved. */
  phaseLabel: string;
  /** Whether the linked program has an open blocker affecting the current phase. */
  hasBlocker: boolean;
  /** Description of the most relevant open blocker, if any. */
  blockerLabel?: string;
  /** Color status — see `LinkedProgramChipStatus` above. */
  status: LinkedProgramChipStatus;
  /** The linked program ID (echoed back for convenience). */
  linkedProgramId: string;
  /** Display name of the linked program, or the ID if unresolved. */
  linkedProgramName: string;
  /** The link type that was passed in. */
  linkType: LinkType;
}

// ─── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Look up a ProgramInstance by ID across the active program instances corpus.
 * Returns null if not found.
 *
 * Today this scans `APEX_RETAIL_PROGRAM_INSTANCES`; when additional tenants
 * are added the lookup can be widened without changing the call site.
 */
export function resolveLinkedProgram(linkedProgramId: string): ProgramInstance | null {
  return APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === linkedProgramId) ?? null;
}

// ─── Chip builder ──────────────────────────────────────────────────────────────

/**
 * Format a phase index (0-6) into a human label like "P3 Design".
 * Falls back to "P{n}" if the phase has no recorded label.
 */
function formatPhaseLabel(instance: ProgramInstance): string {
  const phase = instance.phases.find((p) => p.phaseId === instance.currentPhase);
  if (phase) return `P${phase.phaseId} ${phase.phaseLabel}`;
  return `P${instance.currentPhase}`;
}

/**
 * Locate the most-relevant open blocker on the linked program.
 *
 * Rule: a blocker is "relevant" if the program has any open `kind: 'blocker'`
 * flag. We additionally check linkedSourceEvents that depend-on a source
 * event whose blockedAtPhase ≤ currentPhase — these are upstream blocks.
 */
function findRelevantOpenBlocker(instance: ProgramInstance): string | null {
  const openBlocker = instance.flags.find((f) => f.kind === 'blocker' && f.status === 'open');
  if (openBlocker) return openBlocker.description;

  // Cross-instance source-event block at or before current phase
  const upstream = instance.linkedSourceEvents.find(
    (l) =>
      l.linkType === 'depends-on' &&
      l.blockedAtPhase !== undefined &&
      l.blockedAtPhase <= instance.currentPhase,
  );
  if (upstream) {
    return `Upstream block from ${upstream.sourceEventName}: ${upstream.description}`;
  }

  return null;
}

/**
 * Build a renderable chip payload for a linked program.
 *
 * Status logic:
 * - `gray`  if the linked program is not found
 * - `amber` if the linked program has any open blocker (or upstream depends-on
 *           block whose phase ≤ current phase)
 * - `green` otherwise
 *
 * Pure function — no async, no I/O. Same inputs always yield same outputs.
 */
export function buildLinkedProgramChip(
  linkedProgramId: string,
  linkType: LinkType,
): LinkedProgramChipData {
  const instance = resolveLinkedProgram(linkedProgramId);

  if (!instance) {
    return {
      label: 'LINKED PROGRAM',
      phase: null,
      phaseLabel: 'Unknown',
      hasBlocker: false,
      status: 'gray',
      linkedProgramId,
      linkedProgramName: linkedProgramId,
      linkType,
    };
  }

  const phaseLabel = formatPhaseLabel(instance);
  const blockerLabel = findRelevantOpenBlocker(instance);
  const hasBlocker = blockerLabel !== null;

  return {
    label: 'LINKED PROGRAM',
    phase: instance.currentPhase,
    phaseLabel,
    hasBlocker,
    ...(blockerLabel !== null ? { blockerLabel } : {}),
    status: hasBlocker ? 'amber' : 'green',
    linkedProgramId,
    linkedProgramName: instance.name,
    linkType,
  };
}

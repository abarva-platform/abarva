// Phase-capture integrity — placeholder rejection and revision fencing.
//
// Why this exists: a client-side defect let a phase page render synthetic
// boilerplate for P0 inputs (a `draftedBrief` state that was never hydrated,
// falling back to a stale hardcoded draft list) and then POST that boilerplate
// back as authoritative capture state. The route merged it over the real,
// correctly-persisted values — and, on phase 0, also wrote the same boilerplate
// into `engagements.charter`, the authoritative record.
//
// The client bug is fixed separately. This module is the server-side floor, so
// the same class of overwrite cannot happen again from an older browser tab, a
// replayed request, or the next component that reintroduces a default value:
//
//   1. Known placeholder text is never persisted as authoritative capture.
//   2. A write carrying a stale revision is rejected rather than applied.
//
// Pure module: no I/O.

import { createHash } from "node:crypto";

/**
 * Legacy synthetic drafts from `ORIGINATE_FIELDS`, the stale P0 list the
 * broken client fell back to. These are the exact strings that could have been
 * written over real capture values, so they are also the deterministic match
 * set the blast-radius diagnostic uses to identify corrupted rows.
 *
 * This list must not grow casually — every entry asserts "this exact text was
 * once shipped as a default and can therefore never be a real client answer."
 */
export const LEGACY_ORIGINATE_PLACEHOLDERS: readonly string[] = [
  "A focused AI/transformation bet that improves a measurable business workflow without bypassing human decision rights.",
  "Assisted workflow automation with governed data, human approval, and explicit value tracking.",
  "Business sponsor and technology owner to confirm at charter.",
  "In: the target workflow, evidence set, decision gates, and value metrics. Out: unrelated platform rebuilds.",
  "Operational logs, system exports, workflow samples, KPI baselines, and owner-reviewed session notes.",
  "Reduce cycle time, run cost, and leakage while improving reliability and adoption.",
  "Confirm data quality, security posture, process ownership, and evaluation controls before automation expands.",
  // The hardcoded recommendation the same phase-0 branch synthesized.
  "Advance to Charter after authorized workspace-user review; retain open evidence questions as explicit gate caveats.",
];

const NORMALIZED_PLACEHOLDERS = new Set(
  LEGACY_ORIGINATE_PLACEHOLDERS.map((s) => normalizeForCompare(s)),
);

/**
 * Client-synthesized phase capture templates from older phase workspaces.
 *
 * These were not client answers. They were UI scaffolds derived from charter
 * values, selected options, phase labels, evidence summaries, and hardcoded
 * guidance, then rendered in editable capture fields. If submitted, they would
 * make empty P1-P5 capture look complete and persist renderer output as
 * authoritative phase input.
 */
export const CLIENT_SYNTHESIZED_PHASE_CAPTURE_MARKERS: readonly string[] = [
  "Operating owners and technology/data co-sponsors must confirm cadence, authority, and phase-gate attendance.",
  "Discovery should validate baseline, target direction, measurement owner, evidence confidence, and what cannot yet be claimed.",
  "Core roles: executive sponsor, operating owner, technology/data owner, risk/privacy/compliance owner, finance value owner, and change/adoption owner.",
  // Keep rejecting this retired template: older clients may still submit it.
  "Sponsor approves scope and phase advancement; operating owner approves process fit; technology/data owner approves platform and integration assumptions; risk/privacy/compliance approve controls and PHI boundaries; finance validates value logic.",
  "The authorized workspace user records product approval. Sponsor, operating, technology/data, risk/privacy/compliance, and finance stakeholders provide evidence and review input; listing a stakeholder does not create another product approver.",
  "P2 must collect enough process, technology, data, controls, org/change, and baseline metric evidence to decide whether to proceed, hold, or narrow the Move.",
  "Approval note: accountable owner review and caveats must remain attached to the gate record.",
];

const NORMALIZED_CLIENT_SYNTHESIS_MARKERS =
  CLIENT_SYNTHESIZED_PHASE_CAPTURE_MARKERS.map((s) => normalizeForCompare(s));

/** Collapse whitespace and case so trivial reformatting cannot evade the guard. */
export function normalizeForCompare(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * True when a submitted value is known synthetic placeholder text that must
 * never be persisted as an authoritative client answer.
 */
export function isKnownPlaceholderValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = normalizeForCompare(value);
  if (!normalized) return false;
  return (
    NORMALIZED_PLACEHOLDERS.has(normalized) ||
    NORMALIZED_CLIENT_SYNTHESIS_MARKERS.some((marker) =>
      normalized.includes(marker),
    )
  );
}

export interface PlaceholderRejection {
  key: string;
  value: string;
}

/**
 * Find every incoming section whose value is known placeholder text.
 *
 * Deliberately returns the offenders rather than silently dropping them: a
 * client sending placeholders is a bug, and the response should say so loudly
 * enough that it gets fixed rather than absorbed.
 */
export function findPlaceholderValues(
  incoming: Record<string, unknown>,
): PlaceholderRejection[] {
  const rejected: PlaceholderRejection[] = [];
  for (const [key, value] of Object.entries(incoming)) {
    if (isKnownPlaceholderValue(value)) {
      rejected.push({ key, value: String(value) });
    }
  }
  return rejected;
}

/**
 * A content-addressed revision of the persisted capture values.
 *
 * Deliberately derived from content rather than stored as a counter column: it
 * needs no migration, it cannot drift out of sync with the rows it describes,
 * and it detects any change to the values regardless of which path wrote them.
 * Keys are sorted so the hash is stable across object construction order.
 */
export function computeCaptureRevision(
  values: Record<string, unknown>,
  basisBySection?: Record<string, unknown>,
): string {
  const valueCanonical = Object.keys(values)
    .sort()
    .map((key) => `${key}\u0000${String(values[key] ?? "")}`)
    .join("\u0001");
  const basisKeys = Object.keys(basisBySection ?? {}).sort();
  const basisCanonical = basisKeys.length
    ? `\u0002${basisKeys
        .map((key) => `${key}\u0000${JSON.stringify(basisBySection?.[key] ?? null)}`)
        .join("\u0001")}`
    : "";
  const canonical = `${valueCanonical}${basisCanonical}`;
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export interface ChangedSection {
  key: string;
  previous: string;
  next: string;
}

/**
 * The sections whose value genuinely differs from what is already persisted.
 *
 * This is what makes a no-edit save a no-op: if a client re-submits exactly
 * what it was given, nothing is written at all. Comparison is on the raw
 * trimmed string, not the normalized form — a deliberate whitespace edit by a
 * human is a real edit, even though it would not change meaning.
 */
export function diffCaptureValues(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): ChangedSection[] {
  const changed: ChangedSection[] = [];
  for (const [key, rawNext] of Object.entries(incoming)) {
    const next = String(rawNext ?? "").trim();
    const previous = String(current[key] ?? "").trim();
    if (next !== previous) changed.push({ key, previous, next });
  }
  return changed;
}

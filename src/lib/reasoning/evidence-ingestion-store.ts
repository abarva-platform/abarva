// src/lib/reasoning/evidence-ingestion-store.ts
//
// In-memory evidence ingestion store.
//
// Purpose: lets the demo UI add evidence items to a typed instance and watch
// gate state flip live, without touching the fixture files. This is the
// per-process / non-persisted path. A future task will graduate this to
// Postgres; today the contributions live in module memory and reset on
// process restart.
//
// Pure module: no side effects on import, no I/O. Safe to call from server
// routes and from tests (use `_resetForTests()` to clear state between cases).
//
// The stored EvidenceItem type is intentionally loose (`unknown`) — both
// SourceEventInstance.evidence (`EvidenceItem`) and ProgramInstance.evidence
// (`ProgramEvidenceItem`) feed into this store, and the consumer
// (`buildEvidenceMapWithIngestions`) shape-checks before merging.

/**
 * Loose typing — the demo accepts items shaped like SourceEventInstance's
 * EvidenceItem (`{ id, kind, field, value, source, recordedAt }`) and falls
 * back gracefully when fields are missing. The merge step in
 * `buildEvidenceMapWithIngestions` reads `.field` / `.value` if present and
 * always pushes a copy onto an `evidence-uploaded-since-baseline` array.
 */
export type IngestedEvidenceItem = Record<string, unknown>;

/** Per-process store. Never persisted. Reset on process restart. */
const store: Map<string, IngestedEvidenceItem[]> = new Map();

/**
 * Add a single evidence item for an instance. The item is appended to the
 * existing list (preserving insertion order so the UI can show "newest at
 * the bottom" if desired).
 */
export function addEvidence(instanceId: string, item: IngestedEvidenceItem): void {
  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    throw new Error('addEvidence: instanceId must be a non-empty string');
  }
  if (!item || typeof item !== 'object') {
    throw new Error('addEvidence: item must be an object');
  }
  const existing = store.get(instanceId);
  if (existing) {
    existing.push(item);
  } else {
    store.set(instanceId, [item]);
  }
}

/**
 * Return all evidence items contributed for the instance. Returns a fresh
 * copy so callers can't mutate the internal array.
 */
export function getEvidenceFor(instanceId: string): IngestedEvidenceItem[] {
  const list = store.get(instanceId);
  if (!list) return [];
  return list.slice();
}

/** Clear contributions for one instance. */
export function clearEvidenceFor(instanceId: string): void {
  store.delete(instanceId);
}

/**
 * Test-only helper: clear every instance's contributions.
 * Exposed because Jest reuses the module across test cases.
 */
export function _resetForTests(): void {
  store.clear();
}

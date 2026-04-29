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
//
// Each ingestion is also tagged with a sidecar ISO-8601 timestamp captured at
// `addEvidence` time. The original item shape is left untouched (some callers
// already include their own `recordedAt` field), and the sidecar timestamps
// are exposed via `getEvidenceTimestampsFor` so the per-instance reasoning
// timeline can show *when* a piece of evidence was ingested, even when the
// caller did not embed a timestamp on the item itself.

/**
 * Loose typing — the demo accepts items shaped like SourceEventInstance's
 * EvidenceItem (`{ id, kind, field, value, source, recordedAt }`) and falls
 * back gracefully when fields are missing. The merge step in
 * `buildEvidenceMapWithIngestions` reads `.field` / `.value` if present and
 * always pushes a copy onto an `evidence-uploaded-since-baseline` array.
 */
export type IngestedEvidenceItem = Record<string, unknown>;

/**
 * Pluggable persistence backend. Implementations are write-only and
 * best-effort — callers do not await them and failures are swallowed by the
 * dispatch site. The default (no backend installed) preserves the original
 * in-memory-only semantics.
 */
export interface EvidenceIngestionBackend {
  /** Persist an ingestion for the given instance id. */
  write(instanceId: string, item: unknown): Promise<void>;
  /** Persist a clear of every ingestion row tagged for the instance. */
  clearForInstance(instanceId: string): Promise<void>;
}

let activeBackend: EvidenceIngestionBackend | null = null;

/**
 * Install a write-through backend for evidence ingestion persistence. Pass
 * `null` to restore the default in-memory-only behavior.
 */
export function setEvidenceIngestionBackend(
  backend: EvidenceIngestionBackend | null,
): void {
  activeBackend = backend;
}

/** Read the currently-installed backend (mostly for tests + diagnostics). */
export function getEvidenceIngestionBackend(): EvidenceIngestionBackend | null {
  return activeBackend;
}

/** Per-process store. Never persisted. Reset on process restart. */
const store: Map<string, IngestedEvidenceItem[]> = new Map();

/**
 * Sidecar parallel-array of ingestion timestamps, indexed alongside `store`.
 * `timestamps.get(instanceId)?.[i]` corresponds to `store.get(instanceId)?.[i]`.
 * Captured at `addEvidence` time so callers do not have to embed their own
 * recordedAt on the body.
 */
const timestamps: Map<string, string[]> = new Map();

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
  const ingestedAt = new Date().toISOString();
  const existing = store.get(instanceId);
  if (existing) {
    existing.push(item);
    timestamps.get(instanceId)!.push(ingestedAt);
  } else {
    store.set(instanceId, [item]);
    timestamps.set(instanceId, [ingestedAt]);
  }
  if (activeBackend) {
    void activeBackend.write(instanceId, item).catch(() => {});
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

/**
 * Return the parallel ISO-8601 ingestion timestamps for the instance.
 * `getEvidenceFor(id)[i]` was ingested at `getEvidenceTimestampsFor(id)[i]`.
 * Returns a fresh copy so callers can't mutate the internal array.
 */
export function getEvidenceTimestampsFor(instanceId: string): string[] {
  const list = timestamps.get(instanceId);
  if (!list) return [];
  return list.slice();
}

/** Clear contributions for one instance. */
export function clearEvidenceFor(instanceId: string): void {
  store.delete(instanceId);
  timestamps.delete(instanceId);
  if (activeBackend) {
    void activeBackend.clearForInstance(instanceId).catch(() => {});
  }
}

/**
 * Test-only helper: clear every instance's contributions.
 * Exposed because Jest reuses the module across test cases.
 */
export function _resetForTests(): void {
  store.clear();
  timestamps.clear();
  activeBackend = null;
}

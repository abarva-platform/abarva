// Deterministic fact identity + supersede planning (Workstream B).
//
// Fixes the duplication defects found in WS0 discovery:
//  - a CHANGED fact value used to insert a second row (onConflict included
//    value_hash) while the old row stayed lifecycle_state="active" → two active
//    rows for one logical fact.
//  - chunks used a per-upload `uploadId` in the chunk_id, so every re-upload
//    created a fresh, duplicate chunk set via a plain insert.
//
// This module is PURE so the update/supersede decision is fully unit-testable
// without a DB. The loader applies the returned plan; the live replay is an ACA
// operator step (the private DB is unreachable from localhost).

import { createHash } from 'node:crypto';

/** Stable content hash for a fact value (order-independent for objects). */
export function computeValueHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

/** Logical fact identity — independent of value, so updates target one row. */
export function computeFactKey(parts: {
  tenantKey: string;
  recordKey: string;
  attribute: string;
}): string {
  return `${parts.recordKey}:${slug(parts.attribute)}`;
}

/**
 * Content+location-stable chunk id. Independent of upload id and file name, so
 * re-uploading the same logical content maps to the same chunk (upsert no-op),
 * and a changed chunk updates in place instead of orphaning the old one.
 */
export function computeStableChunkId(parts: {
  tenantKey: string;
  sourceSegmentId: string;
  sourceRecordId: string;
  chunkIndex: number;
}): string {
  return [
    'ctx',
    slug(parts.tenantKey),
    slug(parts.sourceSegmentId),
    slug(parts.sourceRecordId),
    `c${parts.chunkIndex}`,
  ].join(':');
}

/**
 * Deterministic load-batch id from the load identity + content. Same content =
 * same batch id, so re-uploading the identical payload is a recognizable no-op.
 */
export function computeLoadBatchId(parts: {
  tenantKey: string;
  sourceFileId: string;
  contentHash: string;
}): string {
  return createHash('sha256')
    .update(`${parts.tenantKey}|${parts.sourceFileId}|${parts.contentHash}`)
    .digest('hex')
    .slice(0, 32);
}

export type UploadMode = 'partial_update' | 'replace_dimension' | 'deprecate_fact';

export interface IncomingFact {
  factKey: string;
  valueHash: string;
}

export interface ExistingFact {
  factKey: string;
  valueHash: string;
  /** identifier of the current/active row, used to supersede it. */
  factId: string;
}

export interface FactPlan {
  /** new active facts to insert (factKey). */
  insert: string[];
  /** factIds to mark superseded, paired with the replacing factKey (or null). */
  supersede: Array<{ factId: string; replacedByFactKey: string | null }>;
  /** factKeys already current and unchanged — nothing to do. */
  noop: string[];
  /** factKeys explicitly deprecated (deprecate_fact mode). */
  deprecate: string[];
}

/**
 * Decide, for one (tenant, record, dimension) load, what to insert / supersede /
 * leave alone so there is exactly ONE active row per fact_key and no duplicate.
 */
export function planFactSupersession(args: {
  existing: ExistingFact[];
  incoming: IncomingFact[];
  mode: UploadMode;
}): FactPlan {
  const { existing, incoming, mode } = args;
  const existingByKey = new Map(existing.map((f) => [f.factKey, f]));
  const incomingKeys = new Set(incoming.map((f) => f.factKey));
  const plan: FactPlan = { insert: [], supersede: [], noop: [], deprecate: [] };

  if (mode === 'deprecate_fact') {
    for (const inc of incoming) {
      const cur = existingByKey.get(inc.factKey);
      if (cur) plan.supersede.push({ factId: cur.factId, replacedByFactKey: null });
      plan.deprecate.push(inc.factKey);
    }
    return plan;
  }

  for (const inc of incoming) {
    const cur = existingByKey.get(inc.factKey);
    if (!cur) {
      plan.insert.push(inc.factKey);
    } else if (cur.valueHash === inc.valueHash) {
      plan.noop.push(inc.factKey);
    } else {
      plan.supersede.push({ factId: cur.factId, replacedByFactKey: inc.factKey });
      plan.insert.push(inc.factKey);
    }
  }

  // replace_dimension: the file is the full current truth — retire any current
  // fact the file no longer asserts. partial_update leaves untouched facts alone.
  if (mode === 'replace_dimension') {
    for (const cur of existing) {
      if (!incomingKeys.has(cur.factKey)) {
        plan.supersede.push({ factId: cur.factId, replacedByFactKey: null });
        plan.deprecate.push(cur.factKey);
      }
    }
  }

  return plan;
}

// ── helpers ───────────────────────────────────────────────────────────────

function slug(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Deterministic JSON (sorted keys) so value hashes are stable. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

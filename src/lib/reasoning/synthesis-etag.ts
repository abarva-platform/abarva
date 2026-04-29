// Pure helper to derive a deterministic weak ETag for a synthesis cache key.
//
// The cache key is itself a stable, hashed-input string built by the synthesis
// routes (e.g. `${instanceId}:${stateHash}:${patternVersion}:${agentVariant}`).
// We hash that key with SHA-1 and wrap it in the weak-validator form so that
// HTTP intermediaries don't try to enforce byte-for-byte body equality on a
// streamed response.
//
// Format: W/"<40-char-lowercase-hex-sha1>"
//   - "W/" weak-validator prefix (RFC 7232 §2.3)
//   - 40 hex chars = SHA-1 digest length
//   - Quotes are part of the etag value, per spec.

import { createHash } from 'node:crypto';

/**
 * Compute a deterministic weak ETag for a synthesis cache key.
 *
 * Stable: identical input always yields the same output.
 * Unique: different inputs produce different outputs (collision-resistant
 * within the SHA-1 space, which is sufficient for cache-validator purposes).
 */
export function computeSynthesisEtag(key: string): string {
  const digest = createHash('sha1').update(key).digest('hex');
  return `W/"${digest}"`;
}

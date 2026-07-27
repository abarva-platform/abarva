/**
 * Deterministic content hash for envelopes. Small FNV-1a over stable JSON so
 * fixtures and tests are reproducible (no time/random input). Real providers
 * carry the server-computed content_hash; this local hash is a fallback only.
 */

export function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const walk = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v as object)) return "[circular]";
    seen.add(v as object);
    if (Array.isArray(v)) return v.map(walk);
    const obj = v as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = walk(obj[k]);
        return acc;
      }, {});
  };
  return JSON.stringify(walk(value));
}

export function contentHash(value: unknown, prefix = "sha-fx"): string {
  const str = stableStringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // to unsigned hex
  return `${prefix}-${(h >>> 0).toString(16).padStart(8, "0")}`;
}

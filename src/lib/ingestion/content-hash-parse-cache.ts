import { createHash } from "node:crypto";

const DEFAULT_MAX_ENTRIES = 256;

export const CONTENT_HASH_PARSE_CACHE_VERSION = "content-hash-parse-cache-v1";

export interface ContentHashParseCacheKey {
  cacheScope: string;
  mimeType: string;
  parserId: string;
  parserVersion: string;
  sha256: string;
}

export interface ContentHashParseCacheResult<T> {
  value: T;
  cacheHit: boolean;
  cacheSource: "memory" | "persistent" | "miss";
  key: ContentHashParseCacheKey;
}

export interface ContentHashParseCachePersistentStore<T = unknown> {
  get(key: ContentHashParseCacheKey): Promise<T | null>;
  set(key: ContentHashParseCacheKey, value: T): Promise<void>;
}

interface CacheEntry {
  value: unknown;
  createdSequence: number;
  lastHitSequence: number;
  hits: number;
}

const cache = new Map<string, CacheEntry>();
let cacheSequence = 0;

function normalizeBytes(bytes: ArrayBuffer | Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes;
  if (bytes instanceof ArrayBuffer) return Buffer.from(bytes);
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function computeContentSha256(
  bytes: ArrayBuffer | Uint8Array | Buffer,
): string {
  return createHash("sha256").update(normalizeBytes(bytes)).digest("hex");
}

export function buildContentHashParseCacheKey(args: {
  cacheScope?: string | null;
  mimeType: string;
  parserId: string;
  parserVersion?: string | null;
  sha256: string;
}): ContentHashParseCacheKey {
  return {
    cacheScope: args.cacheScope?.trim() || "unscoped",
    mimeType: args.mimeType.trim().toLowerCase() || "application/octet-stream",
    parserId: args.parserId.trim() || "unknown-parser",
    parserVersion:
      args.parserVersion?.trim() || CONTENT_HASH_PARSE_CACHE_VERSION,
    sha256: args.sha256.trim().toLowerCase(),
  };
}

function serializeKey(key: ContentHashParseCacheKey): string {
  return [
    key.cacheScope,
    key.mimeType,
    key.parserId,
    key.parserVersion,
    key.sha256,
  ].join("|");
}

function enforceMaxEntries(maxEntries: number) {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    cache.delete(oldestKey);
  }
}

export async function withContentHashParseCache<T>(
  args: {
    cacheScope?: string | null;
    mimeType: string;
    parserId: string;
    parserVersion?: string | null;
    bytes: ArrayBuffer | Uint8Array | Buffer;
    maxEntries?: number;
    persistentStore?: ContentHashParseCachePersistentStore<T> | null;
  },
  parse: () => Promise<T>,
): Promise<ContentHashParseCacheResult<T>> {
  const sha256 = computeContentSha256(args.bytes);
  const key = buildContentHashParseCacheKey({
    cacheScope: args.cacheScope,
    mimeType: args.mimeType,
    parserId: args.parserId,
    parserVersion: args.parserVersion,
    sha256,
  });
  const serializedKey = serializeKey(key);
  const cached = cache.get(serializedKey);
  if (cached) {
    cache.delete(serializedKey);
    cache.set(serializedKey, {
      ...cached,
      lastHitSequence: ++cacheSequence,
      hits: cached.hits + 1,
    });
    return {
      value: cached.value as T,
      cacheHit: true,
      cacheSource: "memory",
      key,
    };
  }

  const persistentValue = await readPersistentCache(args.persistentStore, key);
  if (persistentValue !== null) {
    cache.set(serializedKey, {
      value: persistentValue,
      createdSequence: ++cacheSequence,
      lastHitSequence: cacheSequence,
      hits: 1,
    });
    enforceMaxEntries(args.maxEntries ?? DEFAULT_MAX_ENTRIES);
    return {
      value: persistentValue,
      cacheHit: true,
      cacheSource: "persistent",
      key,
    };
  }

  const value = await parse();
  cache.set(serializedKey, {
    value,
    createdSequence: ++cacheSequence,
    lastHitSequence: cacheSequence,
    hits: 0,
  });
  enforceMaxEntries(args.maxEntries ?? DEFAULT_MAX_ENTRIES);
  await writePersistentCache(args.persistentStore, key, value);
  return { value, cacheHit: false, cacheSource: "miss", key };
}

export function getContentHashParseCacheStats(): {
  entries: number;
  hits: number;
  oldestCreatedSequence: number | null;
} {
  let hits = 0;
  let oldestCreatedSequence: number | null = null;
  for (const entry of cache.values()) {
    hits += entry.hits;
    oldestCreatedSequence =
      oldestCreatedSequence === null
        ? entry.createdSequence
        : Math.min(oldestCreatedSequence, entry.createdSequence);
  }
  return { entries: cache.size, hits, oldestCreatedSequence };
}

export function clearContentHashParseCacheForTests() {
  cache.clear();
  cacheSequence = 0;
}

async function readPersistentCache<T>(
  persistentStore: ContentHashParseCachePersistentStore<T> | null | undefined,
  key: ContentHashParseCacheKey,
): Promise<T | null> {
  if (!persistentStore) return null;
  try {
    return await persistentStore.get(key);
  } catch {
    return null;
  }
}

async function writePersistentCache<T>(
  persistentStore: ContentHashParseCachePersistentStore<T> | null | undefined,
  key: ContentHashParseCacheKey,
  value: T,
) {
  if (!persistentStore) return;
  try {
    await persistentStore.set(key, value);
  } catch {
    // Persistence is an optimization. Parser correctness must never depend on it.
  }
}

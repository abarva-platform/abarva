import {
  buildContentHashParseCacheKey,
  clearContentHashParseCacheForTests,
  type ContentHashParseCacheKey,
  type ContentHashParseCachePersistentStore,
  computeContentSha256,
  getContentHashParseCacheStats,
  withContentHashParseCache,
} from "../content-hash-parse-cache";

beforeEach(() => {
  clearContentHashParseCacheForTests();
});

describe("content-hash parse cache", () => {
  it("reuses parser output for the same scoped content hash", async () => {
    const parse = jest.fn(async () => "parsed body");
    const bytes = Buffer.from("same upload");

    const first = await withContentHashParseCache(
      {
        cacheScope: "client-a",
        mimeType: "application/pdf",
        parserId: "pdf-parse",
        parserVersion: "parser-v1",
        bytes,
      },
      parse,
    );
    const second = await withContentHashParseCache(
      {
        cacheScope: "client-a",
        mimeType: "application/pdf",
        parserId: "pdf-parse",
        parserVersion: "parser-v1",
        bytes,
      },
      parse,
    );

    expect(first).toMatchObject({ value: "parsed body", cacheHit: false });
    expect(second).toMatchObject({ value: "parsed body", cacheHit: true });
    expect(second.key.sha256).toBe(computeContentSha256(bytes));
    expect(parse).toHaveBeenCalledTimes(1);
    expect(getContentHashParseCacheStats()).toMatchObject({
      entries: 1,
      hits: 1,
    });
  });

  it("keeps identical bytes isolated by cache scope", async () => {
    let parseCount = 0;
    const parse = jest.fn(async () => {
      parseCount += 1;
      return `parsed-${parseCount}`;
    });
    const args = {
      mimeType: "application/pdf",
      parserId: "pdf-parse",
      parserVersion: "parser-v1",
      bytes: Buffer.from("tenant-specific upload"),
    };

    const clientA = await withContentHashParseCache(
      { ...args, cacheScope: "client-a" },
      parse,
    );
    const clientB = await withContentHashParseCache(
      { ...args, cacheScope: "client-b" },
      parse,
    );

    expect(clientA).toMatchObject({ value: "parsed-1", cacheHit: false });
    expect(clientB).toMatchObject({ value: "parsed-2", cacheHit: false });
    expect(parse).toHaveBeenCalledTimes(2);
    expect(getContentHashParseCacheStats()).toMatchObject({
      entries: 2,
      hits: 0,
    });
  });

  it("misses when the parser version changes", async () => {
    let parseCount = 0;
    const parse = jest.fn(async () => {
      parseCount += 1;
      return `parsed-${parseCount}`;
    });
    const baseArgs = {
      cacheScope: "client-a",
      mimeType: "application/pdf",
      parserId: "pdf-parse",
      bytes: Buffer.from("same upload"),
    };

    const first = await withContentHashParseCache(
      { ...baseArgs, parserVersion: "parser-v1" },
      parse,
    );
    const second = await withContentHashParseCache(
      { ...baseArgs, parserVersion: "parser-v2" },
      parse,
    );

    expect(first).toMatchObject({ value: "parsed-1", cacheHit: false });
    expect(second).toMatchObject({ value: "parsed-2", cacheHit: false });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("reuses a persistent store across in-memory cache resets", async () => {
    const persistentStore = createTestPersistentStore<string>();
    const parse = jest.fn(async () => "persistent parsed body");
    const args = {
      cacheScope: "client-a",
      mimeType: "application/pdf",
      parserId: "pdf-parse",
      parserVersion: "parser-v1",
      bytes: Buffer.from("same upload across sessions"),
      persistentStore,
    };

    const first = await withContentHashParseCache(args, parse);
    clearContentHashParseCacheForTests();
    const second = await withContentHashParseCache(args, parse);

    expect(first).toMatchObject({
      value: "persistent parsed body",
      cacheHit: false,
      cacheSource: "miss",
    });
    expect(second).toMatchObject({
      value: "persistent parsed body",
      cacheHit: true,
      cacheSource: "persistent",
    });
    expect(parse).toHaveBeenCalledTimes(1);
    expect(getContentHashParseCacheStats()).toMatchObject({
      entries: 1,
      hits: 1,
    });
  });

  it("falls back to parsing when the persistent store fails", async () => {
    const persistentStore: ContentHashParseCachePersistentStore<string> = {
      async get() {
        throw new Error("store read failed");
      },
      async set() {
        throw new Error("store write failed");
      },
    };
    const parse = jest.fn(async () => "fresh parse");

    const result = await withContentHashParseCache(
      {
        cacheScope: "client-a",
        mimeType: "application/pdf",
        parserId: "pdf-parse",
        parserVersion: "parser-v1",
        bytes: Buffer.from("store failure upload"),
        persistentStore,
      },
      parse,
    );

    expect(result).toMatchObject({
      value: "fresh parse",
      cacheHit: false,
      cacheSource: "miss",
    });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("normalizes cache keys without dropping tenant or parser boundaries", () => {
    const sha256 = computeContentSha256(new Uint8Array([1, 2, 3]));

    expect(
      buildContentHashParseCacheKey({
        cacheScope: " Client-A ",
        mimeType: " Application/PDF ",
        parserId: " pdf-parse ",
        parserVersion: " parser-v1 ",
        sha256: sha256.toUpperCase(),
      }),
    ).toEqual({
      cacheScope: "Client-A",
      mimeType: "application/pdf",
      parserId: "pdf-parse",
      parserVersion: "parser-v1",
      sha256,
    });
  });
});

function createTestPersistentStore<
  T,
>(): ContentHashParseCachePersistentStore<T> {
  const values = new Map<string, T>();
  return {
    async get(key) {
      return values.get(serializeTestKey(key)) ?? null;
    },
    async set(key, value) {
      values.set(serializeTestKey(key), value);
    },
  };
}

function serializeTestKey(key: ContentHashParseCacheKey): string {
  return [
    key.cacheScope,
    key.mimeType,
    key.parserId,
    key.parserVersion,
    key.sha256,
  ].join("|");
}

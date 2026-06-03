import {
  buildContentHashParseCacheKey,
  clearContentHashParseCacheForTests,
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

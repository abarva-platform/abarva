// Source · Stage Guidebooks · repository tests.
//
// Mocks the Azure fluent client so this stays deterministic. SQL/RLS
// semantics live in the migration.

interface FakeRow {
  id: string;
  stage_key: string;
  client_key: string | null;
  title: string;
  purpose: string;
  duration_minutes: number;
  status: string;
  sections: unknown;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FilterCall {
  kind: "eq" | "is" | "or" | "order" | "limit";
  args: unknown[];
}

const filterCalls: FilterCall[] = [];
const maybeSingleQueue: { data: FakeRow | null; error: unknown }[] = [];

function queueMaybeSingles(
  ...results: { data: FakeRow | null; error: unknown }[]
) {
  maybeSingleQueue.push(...results);
}

interface FakeBuilder {
  select: jest.Mock<FakeBuilder, []>;
  eq: jest.Mock<FakeBuilder, unknown[]>;
  is: jest.Mock<FakeBuilder, unknown[]>;
  or: jest.Mock<FakeBuilder, unknown[]>;
  order: jest.Mock<FakeBuilder, unknown[]>;
  limit: jest.Mock<FakeBuilder, unknown[]>;
  maybeSingle: jest.Mock<Promise<{ data: FakeRow | null; error: unknown }>, []>;
}

function makeBuilder(): FakeBuilder {
  const builder: FakeBuilder = {
    select: jest.fn(() => builder),
    eq: jest.fn((...args: unknown[]) => {
      filterCalls.push({ kind: "eq", args });
      return builder;
    }),
    is: jest.fn((...args: unknown[]) => {
      filterCalls.push({ kind: "is", args });
      return builder;
    }),
    or: jest.fn((...args: unknown[]) => {
      filterCalls.push({ kind: "or", args });
      return builder;
    }),
    order: jest.fn((...args: unknown[]) => {
      filterCalls.push({ kind: "order", args });
      return builder;
    }),
    limit: jest.fn((...args: unknown[]) => {
      filterCalls.push({ kind: "limit", args });
      return builder;
    }),
    maybeSingle: jest.fn(
      async () => maybeSingleQueue.shift() ?? { data: null, error: null },
    ),
  };
  return builder;
}

const fakeClient = { from: jest.fn(() => makeBuilder()) };

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => fakeClient,
}));

import { getSourceStageGuidebook } from "../repository";

function baseRow(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: "guidebook-1",
    stage_key: "strategy",
    client_key: null,
    title: "Strategy Gate Review",
    purpose: "Get a clean sponsor decision before scope work starts.",
    duration_minutes: 20,
    status: "published",
    sections: [
      {
        type: "agenda",
        title: "Agenda (20 min)",
        body: "1. Why now...",
        timeBoxMinutes: 20,
      },
    ],
    version: 1,
    created_by: null,
    updated_by: null,
    published_at: "2026-07-20T00:00:00.000Z",
    created_at: "2026-07-20T00:00:00.000Z",
    updated_at: "2026-07-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("getSourceStageGuidebook", () => {
  beforeEach(() => {
    filterCalls.length = 0;
    maybeSingleQueue.length = 0;
    fakeClient.from.mockClear();
  });

  it("maps a row into the typed record shape, normalizing sections", async () => {
    queueMaybeSingles(
      { data: null, error: null },
      { data: baseRow(), error: null },
    );

    const result = await getSourceStageGuidebook("strategy", "healthcare-demo");

    expect(result).toMatchObject({
      id: "guidebook-1",
      stageKey: "strategy",
      clientKey: null,
      title: "Strategy Gate Review",
      durationMinutes: 20,
      status: "published",
    });
    expect(result?.sections).toEqual([
      {
        type: "agenda",
        title: "Agenda (20 min)",
        body: "1. Why now...",
        timeBoxMinutes: 20,
      },
    ]);
  });

  it("uses an exact client guidebook before checking the global default", async () => {
    queueMaybeSingles({
      data: baseRow({
        id: "guidebook-lakeshore",
        client_key: "lakeshore-holdings",
        title: "Lakeshore Strategy Gate",
      }),
      error: null,
    });

    const result = await getSourceStageGuidebook(
      "strategy",
      "lakeshore-holdings",
    );

    expect(result).toMatchObject({
      id: "guidebook-lakeshore",
      clientKey: "lakeshore-holdings",
      title: "Lakeshore Strategy Gate",
    });
    expect(fakeClient.from).toHaveBeenCalledTimes(1);
    expect(filterCalls).toContainEqual({
      kind: "eq",
      args: ["stage_key", "strategy"],
    });
    expect(filterCalls).toContainEqual({
      kind: "eq",
      args: ["status", "published"],
    });
    expect(filterCalls).toContainEqual({
      kind: "eq",
      args: ["client_key", "lakeshore-holdings"],
    });
    expect(filterCalls.some((call) => call.kind === "or")).toBe(false);
  });

  it("falls back to the global guidebook when no exact client override exists", async () => {
    queueMaybeSingles(
      { data: null, error: null },
      { data: baseRow({ client_key: null }), error: null },
    );

    const result = await getSourceStageGuidebook(
      "strategy",
      "lakeshore-holdings",
    );

    expect(result).toMatchObject({
      id: "guidebook-1",
      clientKey: null,
      title: "Strategy Gate Review",
    });
    expect(fakeClient.from).toHaveBeenCalledTimes(2);
    expect(filterCalls).toContainEqual({
      kind: "eq",
      args: ["client_key", "lakeshore-holdings"],
    });
    expect(filterCalls).toContainEqual({
      kind: "is",
      args: ["client_key", null],
    });
  });

  it("orders each lookup by newest published version deterministically", async () => {
    queueMaybeSingles({
      data: baseRow({ client_key: "lakeshore-holdings", version: 3 }),
      error: null,
    });

    await getSourceStageGuidebook("strategy", "lakeshore-holdings");

    expect(filterCalls).toContainEqual({
      kind: "order",
      args: ["version", { ascending: false }],
    });
    expect(filterCalls).toContainEqual({
      kind: "order",
      args: ["published_at", { ascending: false, nullsFirst: false }],
    });
    expect(filterCalls).toContainEqual({
      kind: "order",
      args: ["updated_at", { ascending: false }],
    });
    expect(filterCalls).toContainEqual({ kind: "limit", args: [1] });
  });

  it("returns null when no guidebook is authored for the stage yet, without throwing", async () => {
    queueMaybeSingles(
      { data: null, error: null },
      { data: null, error: null },
    );

    await expect(
      getSourceStageGuidebook("pricing", "healthcare-demo"),
    ).resolves.toBeNull();
  });

  it("degrades a malformed sections payload to an empty array instead of throwing", async () => {
    queueMaybeSingles(
      { data: null, error: null },
      { data: baseRow({ sections: "not-an-array" }), error: null },
    );

    const result = await getSourceStageGuidebook("strategy", "healthcare-demo");
    expect(result?.sections).toEqual([]);
  });

  it("propagates a real query error rather than silently returning null", async () => {
    queueMaybeSingles({
      data: null,
      error: new Error("connection reset"),
    });

    await expect(
      getSourceStageGuidebook("strategy", "healthcare-demo"),
    ).rejects.toThrow("connection reset");
  });
});

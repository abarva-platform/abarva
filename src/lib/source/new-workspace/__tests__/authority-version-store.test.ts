import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

import {
  persistSourceAuthorityVersion,
  readSourceAuthorityVersionState,
} from "../authority-version-store";
import {
  computeSourceAuthorityContentHash,
  evaluateRequestVersionApproval,
  evaluateStrategyVersionApprovals,
} from "../source-version-authority";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const getClient = getAzureReadFluentClient as jest.Mock;

const HASH = "a".repeat(64);

type Result = { data: unknown; error: { message: string } | null };

type Chain = {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (value: Result) => unknown) => Promise<unknown>;
};

/**
 * Two tables are read in sequence, so the fixture answers per table rather
 * than per call. Keyed on the table name: a fixture that answered positionally
 * would still pass if the two queries were issued in the wrong order.
 */
function serve(byTable: Record<string, Result>) {
  const calls: {
    table: string;
    eq: Record<string, unknown>;
    is: Record<string, unknown>;
  }[] = [];

  const from = jest.fn((table: string) => {
    const record = {
      table,
      eq: {} as Record<string, unknown>,
      is: {} as Record<string, unknown>,
    };
    calls.push(record);
    const result = byTable[table] ?? {
      data: null,
      error: { message: `no fixture for ${table}` },
    };
    // Built first, chained after: referencing `query` inside its own
    // initializer leaves it implicitly `any`, which ts-jest accepts and `tsc`
    // rejects.
    const query: Chain = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      maybeSingle: jest.fn().mockResolvedValue(result),
      // The approvals read is awaited without `maybeSingle`, so the builder
      // has to be thenable to stand in for it.
      then: (resolve: (value: Result) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    query.select.mockReturnValue(query);
    query.eq.mockImplementation((column: string, value: unknown) => {
      record.eq[column] = value;
      return query;
    });
    query.is.mockImplementation((column: string, value: unknown) => {
      record.is[column] = value;
      return query;
    });
    return query;
  });

  getClient.mockReturnValue({ from });
  return { from, calls };
}

/**
 * A fixture that APPLIES the recorded predicates instead of answering the same
 * rows whichever filters were asked for.
 *
 * `serve` above cannot see a predicate change: it returns its fixture no matter
 * what `.eq` was called with, so deleting `.eq("version_id", …)` from the
 * approvals read leaves every one of its cases green. That is the shape this
 * item was filed against — a control that is computed and then not executed by
 * the thing that claims to test it. Here the row set is the table and the
 * builder is a query over it, so the fence under test is the predicate itself.
 *
 * Only `.eq` and `.is` are honoured, which is all `readSourceAuthorityVersionState`
 * issues. `maybeSingle` mirrors the real client: more than one surviving row is
 * an error, not a silent first-row pick.
 */
function serveTable(rows: {
  versions: Record<string, unknown>[];
  approvals: Record<string, unknown>[];
}) {
  const ROWS: Record<string, Record<string, unknown>[]> = {
    source_event_authority_versions: rows.versions,
    source_event_authority_version_approvals: rows.approvals,
  };

  const from = jest.fn((table: string) => {
    const predicates: [string, unknown][] = [];
    const matched = () =>
      (ROWS[table] ?? []).filter((row) =>
        predicates.every(([column, value]) => row[column] === value),
      );
    const query: Chain = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      maybeSingle: jest.fn(async () => {
        const hits = matched();
        if (hits.length > 1) {
          return {
            data: null,
            error: { message: "multiple rows returned" },
          } satisfies Result;
        }
        return { data: hits[0] ?? null, error: null } satisfies Result;
      }),
      then: (resolve: (value: Result) => unknown) =>
        Promise.resolve({ data: matched(), error: null } as Result).then(
          resolve,
        ),
    };
    query.select.mockReturnValue(query);
    query.eq.mockImplementation((column: string, value: unknown) => {
      predicates.push([column, value]);
      return query;
    });
    query.is.mockImplementation((column: string, value: unknown) => {
      predicates.push([column, value]);
      return query;
    });
    return query;
  });

  getClient.mockReturnValue({ from });
  return { from };
}

const VERSION_ROW = {
  id: "version-1",
  event_id: "event-1",
  client_key: "tenant-1",
  authority_kind: "request",
  version_number: 3,
  content_hash: HASH,
};

function versions(data: unknown, error: { message: string } | null = null) {
  return { source_event_authority_versions: { data, error } };
}

function approvals(data: unknown, error: { message: string } | null = null) {
  return { source_event_authority_version_approvals: { data, error } };
}

describe("Source authority version store", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the current version and the approvals recorded against it", async () => {
    serve({
      ...versions(VERSION_ROW),
      ...approvals([
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "request_acceptor",
          decision: "approved",
          actor_user_id: "user-7",
        },
      ]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({
      kind: "available",
      currentVersion: { id: "version-1", versionNumber: 3, contentHash: HASH },
      approvals: [
        {
          versionId: "version-1",
          role: "request_acceptor",
          actorId: "user-7",
          decision: "approved",
        },
      ],
    });
  });

  it("scopes both reads by tenant, event and kind, and takes only the unsuperseded version", async () => {
    const { calls } = serve({ ...versions(VERSION_ROW), ...approvals([]) });

    await readSourceAuthorityVersionState("event-1", "tenant-1", "request");

    const versionCall = calls.find(
      (c) => c.table === "source_event_authority_versions",
    );
    expect(versionCall?.eq).toEqual({
      event_id: "event-1",
      client_key: "tenant-1",
      authority_kind: "request",
    });
    // Without this the query returns every historical version and maybeSingle
    // fails — or worse, returns a superseded one.
    expect(versionCall?.is).toEqual({ superseded_at: null });

    const approvalCall = calls.find(
      (c) => c.table === "source_event_authority_version_approvals",
    );
    expect(approvalCall?.eq).toEqual({
      version_id: "version-1",
      client_key: "tenant-1",
    });
  });

  it("refuses a version row belonging to another tenant", async () => {
    // The predicate should make this unreachable. It is asserted anyway,
    // because the re-check is the thing that survives a future edit to the
    // predicate, and this is the failure that leaks one client's Request
    // authority into another's surface.
    serve({
      ...versions({ ...VERSION_ROW, client_key: "tenant-2" }),
      ...approvals([]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("refuses an approval row belonging to another tenant", async () => {
    serve({
      ...versions(VERSION_ROW),
      ...approvals([
        {
          version_id: "version-1",
          client_key: "tenant-2",
          role: "request_acceptor",
          decision: "approved",
          actor_user_id: "user-7",
        },
      ]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("reports no version yet as a readable state, not a failure", async () => {
    serve({ ...versions(null), ...approvals([]) });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({
      kind: "available",
      currentVersion: null,
      approvals: [],
    });
  });

  it("fails closed while the migration is unapplied", async () => {
    serve({
      ...versions(null, {
        message: 'relation "source_event_authority_versions" does not exist',
      }),
      ...approvals([]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("fails closed on a content hash the table's own CHECK would have refused", async () => {
    serve({
      ...versions({ ...VERSION_ROW, content_hash: "not-a-sha256" }),
      ...approvals([]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("fails closed on a version number the table's own CHECK would have refused", async () => {
    serve({
      ...versions({ ...VERSION_ROW, version_number: 0 }),
      ...approvals([]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("fails closed on an unknown role rather than dropping the row", async () => {
    // Dropping it is the dangerous direction: a changes_requested row that
    // fails to parse would leave the version reading as accepted.
    serve({
      ...versions(VERSION_ROW),
      ...approvals([
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "chief_procurement_officer",
          decision: "changes_requested",
          actor_user_id: "user-9",
        },
      ]),
    });

    await expect(
      readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("feeds the contract's own resolvers", async () => {
    // The point of the wiring: the shapes this returns are the shapes
    // `source-version-authority.ts` already consumes, with no adaptation.
    serve({
      ...versions({ ...VERSION_ROW, authority_kind: "strategy" }),
      ...approvals([
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "business_owner",
          decision: "approved",
          actor_user_id: "user-a",
        },
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "procurement_lead",
          decision: "approved",
          actor_user_id: "user-b",
        },
      ]),
    });

    const state = await readSourceAuthorityVersionState(
      "event-1",
      "tenant-1",
      "strategy",
    );
    expect(state.kind).toBe("available");
    if (state.kind !== "available" || !state.currentVersion)
      throw new Error("unreachable");

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: state.currentVersion.id,
        approvals: state.approvals,
      }),
    ).toEqual({
      status: "approved",
      approvedBy: { businessOwner: "user-a", procurementLead: "user-b" },
    });
  });

  it("carries separation of duties through the wiring", async () => {
    // Same person in both roles. The resolver blocks it; this proves the store
    // hands it the actor ids it needs to see that, rather than collapsing them.
    serve({
      ...versions({ ...VERSION_ROW, authority_kind: "strategy" }),
      ...approvals([
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "business_owner",
          decision: "approved",
          actor_user_id: "user-a",
        },
        {
          version_id: "version-1",
          client_key: "tenant-1",
          role: "procurement_lead",
          decision: "approved",
          actor_user_id: "user-a",
        },
      ]),
    });

    const state = await readSourceAuthorityVersionState(
      "event-1",
      "tenant-1",
      "strategy",
    );
    if (state.kind !== "available" || !state.currentVersion)
      throw new Error("unreachable");

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: state.currentVersion.id,
        approvals: state.approvals,
      }).status,
    ).toBe("blocked");
  });

  it("reports a request version with no acceptance as pending", async () => {
    serve({ ...versions(VERSION_ROW), ...approvals([]) });

    const state = await readSourceAuthorityVersionState(
      "event-1",
      "tenant-1",
      "request",
    );
    if (state.kind !== "available" || !state.currentVersion)
      throw new Error("unreachable");

    expect(
      evaluateRequestVersionApproval({
        currentVersionId: state.currentVersion.id,
        approvals: state.approvals,
      }),
    ).toEqual({ status: "pending", missing: ["Request acceptance pending"] });
  });

  describe("the version-freeze fence — which mechanism holds it", () => {
    // C-408 asked which of three candidate mechanisms actually keeps a
    // superseded version's acceptance from presenting as current: the read
    // query's own predicate, the row re-check in the store, or
    // `approvalsForCurrentVersion` in the contract. Each case below removes one
    // and says what happens, because "defence in depth" is a claim about three
    // layers and each has to be executed to be worth anything.

    const SUPERSEDED = {
      id: "version-1",
      event_id: "event-1",
      client_key: "tenant-1",
      authority_kind: "request",
      version_number: 1,
      content_hash: HASH,
      superseded_at: "2026-09-26T00:00:00.000Z",
    };
    const CURRENT = {
      id: "version-2",
      event_id: "event-1",
      client_key: "tenant-1",
      authority_kind: "request",
      version_number: 2,
      content_hash: "b".repeat(64),
      superseded_at: null,
    };
    const STALE_ACCEPTANCE = {
      version_id: "version-1",
      client_key: "tenant-1",
      role: "request_acceptor",
      decision: "approved",
      actor_user_id: "user-7",
    };

    it("withdraws an acceptance the superseding edit left behind, and the SQL predicate is what does it", async () => {
      // The one case the item is actually about: an approved Request version is
      // materially edited, so version 2 is current and version 1 keeps its
      // acceptance row. Nothing deleted that row, and nothing has to: the
      // approvals read never asks for it.
      serveTable({
        versions: [SUPERSEDED, CURRENT],
        approvals: [STALE_ACCEPTANCE],
      });

      const state = await readSourceAuthorityVersionState(
        "event-1",
        "tenant-1",
        "request",
      );

      // Asserted on the store's own return value, not only through the
      // resolver. `approvalsForCurrentVersion` would filter this row out a
      // second time, so a test that looked only at the resolver's verdict would
      // stay green with the predicate deleted — the redundant guard would
      // absorb the mutation and the fence would go untested.
      expect(state).toEqual({
        kind: "available",
        currentVersion: {
          id: "version-2",
          versionNumber: 2,
          contentHash: "b".repeat(64),
        },
        approvals: [],
      });

      if (state.kind !== "available" || !state.currentVersion)
        throw new Error("unreachable");
      expect(
        evaluateRequestVersionApproval({
          currentVersionId: state.currentVersion.id,
          approvals: state.approvals,
        }),
      ).toEqual({ status: "pending", missing: ["Request acceptance pending"] });
    });

    it("withdraws both Strategy approvals the same way, though nothing in production asks", async () => {
      // The Strategy half is `F2`'s half and its resolver has no production
      // caller, which is a separate open decision. The fence is not waiting on
      // that decision: it is the same query, so the same edit withdraws a
      // business-owner and a procurement-lead approval together. Proven here so
      // wiring the resolver later cannot be mistaken for wiring the fence.
      serveTable({
        versions: [
          { ...SUPERSEDED, authority_kind: "strategy" },
          { ...CURRENT, authority_kind: "strategy" },
        ],
        approvals: [
          { ...STALE_ACCEPTANCE, role: "business_owner", actor_user_id: "u-a" },
          {
            ...STALE_ACCEPTANCE,
            role: "procurement_lead",
            actor_user_id: "u-b",
          },
        ],
      });

      const state = await readSourceAuthorityVersionState(
        "event-1",
        "tenant-1",
        "strategy",
      );
      if (state.kind !== "available" || !state.currentVersion)
        throw new Error("unreachable");
      expect(state.approvals).toEqual([]);
      expect(
        evaluateStrategyVersionApprovals({
          currentVersionId: state.currentVersion.id,
          approvals: state.approvals,
        }),
      ).toEqual({
        status: "pending",
        missing: [
          "Business owner approval pending",
          "Procurement lead approval pending",
        ],
      });
    });

    it("fails closed rather than leaking if that predicate is ever widened", async () => {
      // The second layer, executed on its own. `serve` answers whichever rows
      // it was given regardless of the filters, which is exactly a widened
      // predicate: the stale row comes back from the database. The store must
      // refuse the whole read rather than hand the row on — dropping it quietly
      // would under-count a `changes_requested` on the current version, and
      // passing it through would report the edited version as accepted.
      serve({
        ...versions(CURRENT),
        ...approvals([STALE_ACCEPTANCE]),
      });

      await expect(
        readSourceAuthorityVersionState("event-1", "tenant-1", "request"),
      ).resolves.toEqual({ kind: "unavailable" });
    });

    it("does not write to the approvals table when a version supersedes another", async () => {
      // The third candidate mechanism, and the answer is that it does not
      // exist. `planSourceAuthorityVersion` used to return an
      // `invalidatedApprovalVersionIds` list that no caller read; this asserts
      // the write path still touches only the versions table, so the read-time
      // predicate above is the single mechanism holding the invariant. It goes
      // red if a second writer of the same invariant is ever introduced, which
      // is the thing worth being told about: two writers of one rule is two
      // things to keep honest.
      const tables: string[] = [];
      const session = jest.fn(
        async (work: (run: jest.Mock) => Promise<unknown>) =>
          work(
            jest.fn(async (sql: string) => {
              for (const table of [
                "source_event_authority_version_approvals",
                "source_event_authority_versions",
              ]) {
                if (sql.includes(table)) {
                  tables.push(table);
                  break;
                }
              }
              if (sql.includes("SELECT id, version_number, content_hash")) {
                return [
                  { id: "version-1", version_number: 1, content_hash: HASH },
                ];
              }
              if (sql.includes("INSERT INTO source_event_authority_versions")) {
                return [{ id: "version-2" }];
              }
              return [{ id: "updated" }];
            }),
          ),
      );

      await persistSourceAuthorityVersion(
        {
          eventId: "event-1",
          clientKey: "tenant-1",
          authorityKind: "request",
          payload: { trigger: "Materially changed" },
          createdByUserId: "user-2",
        },
        session as never,
      );

      expect(tables).not.toContain("source_event_authority_version_approvals");
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  it("persists the first immutable Request version with its canonical hash", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const session = jest.fn(
      async (work: (run: jest.Mock) => Promise<unknown>) =>
        work(
          jest.fn(async (sql: string, params: unknown[]) => {
            calls.push({ sql, params });
            if (sql.includes("SELECT id, version_number, content_hash"))
              return [];
            if (sql.includes("INSERT INTO source_event_authority_versions")) {
              return [{ id: "version-1" }];
            }
            return [];
          }),
        ),
    );

    const result = await persistSourceAuthorityVersion(
      {
        eventId: "event-1",
        clientKey: "tenant-1",
        authorityKind: "request",
        payload: { trigger: "Renewal", owner: "CPO" },
        createdByUserId: "user-1",
      },
      session as never,
    );

    expect(result.action).toBe("create_version");
    expect(result.versionNumber).toBe(1);
    expect(result.versionId).toBe("version-1");
    const insert = calls.find((call) =>
      call.sql.includes("INSERT INTO source_event_authority_versions"),
    );
    expect(insert?.params).toEqual(
      expect.arrayContaining([
        "event-1",
        "tenant-1",
        "request",
        1,
        expect.stringMatching(/^[a-f0-9]{64}$/),
        JSON.stringify({ owner: "CPO", trigger: "Renewal" }),
        "user-1",
      ]),
    );
  });

  it("supersedes a material edit inside one transaction before exposing the new current version", async () => {
    const statements: string[] = [];
    const session = jest.fn(
      async (work: (run: jest.Mock) => Promise<unknown>) =>
        work(
          jest.fn(async (sql: string) => {
            statements.push(sql);
            if (sql.includes("SELECT id, version_number, content_hash")) {
              return [
                { id: "version-1", version_number: 1, content_hash: HASH },
              ];
            }
            if (sql.includes("INSERT INTO source_event_authority_versions")) {
              return [{ id: "version-2" }];
            }
            return [{ id: "updated" }];
          }),
        ),
    );

    const result = await persistSourceAuthorityVersion(
      {
        eventId: "event-1",
        clientKey: "tenant-1",
        authorityKind: "request",
        payload: { trigger: "Materially changed" },
        createdByUserId: "user-2",
      },
      session as never,
    );

    expect(result).toMatchObject({
      action: "create_version",
      versionNumber: 2,
    });
    expect(
      statements.filter((sql) =>
        sql.includes("UPDATE source_event_authority_versions"),
      ),
    ).toHaveLength(2);
    expect(statements.at(-1)).toContain("superseded_at = NULL");
  });

  it("reuses identical current content without writing another version", async () => {
    const payload = { owner: "CPO", trigger: "Renewal" } as const;
    const hash = computeSourceAuthorityContentHash(payload);
    const run = jest.fn(async (sql: string) => {
      if (sql.includes("SELECT id, version_number, content_hash")) {
        return [{ id: "version-1", version_number: 1, content_hash: hash }];
      }
      throw new Error("unexpected write");
    });
    const session = jest.fn(
      async (work: (run: jest.Mock) => Promise<unknown>) => work(run),
    );

    await expect(
      persistSourceAuthorityVersion(
        {
          eventId: "event-1",
          clientKey: "tenant-1",
          authorityKind: "request",
          payload,
          createdByUserId: "user-1",
        },
        session as never,
      ),
    ).resolves.toMatchObject({
      action: "reuse_current",
      versionId: "version-1",
    });
    expect(run).toHaveBeenCalledTimes(1);
  });
});

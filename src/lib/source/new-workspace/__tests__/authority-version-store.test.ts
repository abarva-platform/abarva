import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

import { readSourceAuthorityVersionState } from "../authority-version-store";
import {
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
  const calls: { table: string; eq: Record<string, unknown>; is: Record<string, unknown> }[] = [];

  const from = jest.fn((table: string) => {
    const record = { table, eq: {} as Record<string, unknown>, is: {} as Record<string, unknown> };
    calls.push(record);
    const result = byTable[table] ?? { data: null, error: { message: `no fixture for ${table}` } };
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
      then: (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve),
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

    const versionCall = calls.find((c) => c.table === "source_event_authority_versions");
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
    expect(approvalCall?.eq).toEqual({ version_id: "version-1", client_key: "tenant-1" });
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
    ).resolves.toEqual({ kind: "available", currentVersion: null, approvals: [] });
  });

  it("fails closed while the migration is unapplied", async () => {
    serve({
      ...versions(null, { message: 'relation "source_event_authority_versions" does not exist' }),
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
    serve({ ...versions({ ...VERSION_ROW, version_number: 0 }), ...approvals([]) });

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

    const state = await readSourceAuthorityVersionState("event-1", "tenant-1", "strategy");
    expect(state.kind).toBe("available");
    if (state.kind !== "available" || !state.currentVersion) throw new Error("unreachable");

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

    const state = await readSourceAuthorityVersionState("event-1", "tenant-1", "strategy");
    if (state.kind !== "available" || !state.currentVersion) throw new Error("unreachable");

    expect(
      evaluateStrategyVersionApprovals({
        currentVersionId: state.currentVersion.id,
        approvals: state.approvals,
      }).status,
    ).toBe("blocked");
  });

  it("reports a request version with no acceptance as pending", async () => {
    serve({ ...versions(VERSION_ROW), ...approvals([]) });

    const state = await readSourceAuthorityVersionState("event-1", "tenant-1", "request");
    if (state.kind !== "available" || !state.currentVersion) throw new Error("unreachable");

    expect(
      evaluateRequestVersionApproval({
        currentVersionId: state.currentVersion.id,
        approvals: state.approvals,
      }),
    ).toEqual({ status: "pending", missing: ["Request acceptance pending"] });
  });
});

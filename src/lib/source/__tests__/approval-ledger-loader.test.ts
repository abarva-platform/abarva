jest.mock("server-only", () => ({}), { virtual: true });

const mockClerkClient = jest.fn(async () => ({
  users: {
    getUser: jest.fn(async () => ({
      firstName: "Approval",
      lastName: "Verifier",
      primaryEmailAddress: { emailAddress: "approval-verifier@example.test" },
    })),
  },
}));

const builderCalls: Array<{ name: string; args: unknown[] }> = [];
let queuedRows: { data: unknown[] | null; error: unknown } = {
  data: [],
  error: null,
};
let queuedPersonRows: { data: unknown[] | null; error: unknown } = {
  data: [],
  error: null,
};

interface FakeBuilder {
  select: jest.Mock<FakeBuilder, unknown[]>;
  eq: jest.Mock<FakeBuilder, unknown[]>;
  in: jest.Mock<FakeBuilder, unknown[]>;
  limit: jest.Mock<
    Promise<{ data: unknown[] | null; error: unknown }>,
    unknown[]
  >;
  order: jest.Mock<
    Promise<{ data: unknown[] | null; error: unknown }>,
    unknown[]
  >;
}

function makeBuilder(table: string): FakeBuilder {
  const builder: FakeBuilder = {
    select: jest.fn((...args: unknown[]) => {
      builderCalls.push({ name: "select", args });
      return builder;
    }),
    eq: jest.fn((...args: unknown[]) => {
      builderCalls.push({ name: "eq", args });
      return builder;
    }),
    in: jest.fn((...args: unknown[]) => {
      builderCalls.push({ name: "in", args });
      return builder;
    }),
    limit: jest.fn(async (...args: unknown[]) => {
      builderCalls.push({ name: "limit", args });
      return table === "persons" ? queuedPersonRows : queuedRows;
    }),
    order: jest.fn(async (...args: unknown[]) => {
      builderCalls.push({ name: "order", args });
      return queuedRows;
    }),
  };
  return builder;
}

const fakeClient = {
  from: jest.fn((table: string) => makeBuilder(table)),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => fakeClient,
}));

jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: mockClerkClient,
}));

import { loadApprovalLedger } from "../approval-ledger";

describe("loadApprovalLedger", () => {
  beforeEach(() => {
    builderCalls.length = 0;
    queuedRows = { data: [], error: null };
    queuedPersonRows = { data: [], error: null };
    fakeClient.from.mockClear();
    mockClerkClient.mockClear();
  });

  it("resolves canonical person UUIDs without sending them to Clerk", async () => {
    const personId = "d6ed8004-c031-4eb5-ad59-53135f61369e";
    queuedRows = {
      data: [
        {
          stage_key: "value",
          approved_by_user_id: personId,
          action: "admin_review",
          approved_at: "2026-09-09T12:34:56.000Z",
          notes: "Final value gate approved.",
        },
      ],
      error: null,
    };
    queuedPersonRows = {
      data: [{ id: personId, name: "Approval Operator", email: null }],
      error: null,
    };

    const ledger = await loadApprovalLedger("event-1", "value", [
      { key: "value", label: "Value" },
    ]);

    expect(fakeClient.from).toHaveBeenCalledWith("persons");
    expect(builderCalls.find((call) => call.name === "in")?.args).toEqual([
      "id",
      [personId],
    ]);
    expect(mockClerkClient).not.toHaveBeenCalled();
    expect(ledger[0]).toMatchObject({
      stageKey: "value",
      state: "approved",
      approverName: "Approval Operator",
      authorizationNote: "Approved by Approval Operator.",
    });
  });

  it("uses the canonical email when the person name is a generic placeholder", async () => {
    const personId = "d6ed8004-c031-4eb5-ad59-53135f61369e";
    queuedRows = {
      data: [
        {
          stage_key: "value",
          approved_by_user_id: personId,
          action: "admin_review",
          approved_at: "2026-09-09T12:34:56.000Z",
          notes: "Final value gate approved.",
        },
      ],
      error: null,
    };
    queuedPersonRows = {
      data: [{ id: personId, name: "User", email: "operator@example.test" }],
      error: null,
    };

    const ledger = await loadApprovalLedger("event-1", "value", [
      { key: "value", label: "Value" },
    ]);

    expect(mockClerkClient).not.toHaveBeenCalled();
    expect(ledger[0]).toMatchObject({
      approverName: "operator@example.test",
      authorizationNote: "Approved by operator@example.test.",
    });
  });

  it("reads approved_at from the database and maps it into the ledger timestamp", async () => {
    queuedRows = {
      data: [
        {
          stage_key: "strategy",
          approved_by_user_id: "user-approval-verifier",
          action: "admin_review",
          approved_at: "2026-09-08T12:34:56.000Z",
          notes: "Approved for verification.",
        },
      ],
      error: null,
    };

    const ledger = await loadApprovalLedger("event-1", "scope", [
      { key: "strategy", label: "Strategy" },
      { key: "scope", label: "Scope" },
    ]);

    expect(fakeClient.from).toHaveBeenCalledWith("source_event_approvals");
    expect(builderCalls.find((call) => call.name === "select")?.args[0]).toBe(
      "stage_key, approved_by_user_id, action, approved_at, notes",
    );
    expect(builderCalls.find((call) => call.name === "order")?.args).toEqual([
      "approved_at",
      { ascending: true },
    ]);
    expect(ledger[0]).toMatchObject({
      stageKey: "strategy",
      state: "approved",
      approverName: "Approval Verifier",
      approvedAtIso: "2026-09-08T12:34:56.000Z",
      approverRationale: "Approved for verification.",
    });
    expect(mockClerkClient).toHaveBeenCalledTimes(1);
  });

  it("can skip Clerk lookup for ACA operator repository readback", async () => {
    queuedRows = {
      data: [
        {
          stage_key: "strategy",
          approved_by_user_id: "db-migration-lab",
          action: "admin_review",
          approved_at: "2026-09-08T12:34:56.000Z",
          notes: "Approved for verification.",
        },
      ],
      error: null,
    };

    const ledger = await loadApprovalLedger(
      "event-1",
      "scope",
      [
        { key: "strategy", label: "Strategy" },
        { key: "scope", label: "Scope" },
      ],
      undefined,
      { resolveApproverNames: false },
    );

    expect(mockClerkClient).not.toHaveBeenCalled();
    expect(ledger[0]).toMatchObject({
      stageKey: "strategy",
      state: "approved",
      approverName: "Unknown approver",
      approvedAtIso: "2026-09-08T12:34:56.000Z",
      approverRationale: "Approved for verification.",
    });
  });
});

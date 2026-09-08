jest.mock("server-only", () => ({}), { virtual: true });

const builderCalls: Array<{ name: string; args: unknown[] }> = [];
let queuedRows: { data: unknown[] | null; error: unknown } = {
  data: [],
  error: null,
};

interface FakeBuilder {
  select: jest.Mock<FakeBuilder, unknown[]>;
  eq: jest.Mock<FakeBuilder, unknown[]>;
  order: jest.Mock<Promise<{ data: unknown[] | null; error: unknown }>, unknown[]>;
}

function makeBuilder(): FakeBuilder {
  const builder: FakeBuilder = {
    select: jest.fn((...args: unknown[]) => {
      builderCalls.push({ name: "select", args });
      return builder;
    }),
    eq: jest.fn((...args: unknown[]) => {
      builderCalls.push({ name: "eq", args });
      return builder;
    }),
    order: jest.fn(async (...args: unknown[]) => {
      builderCalls.push({ name: "order", args });
      return queuedRows;
    }),
  };
  return builder;
}

const fakeClient = {
  from: jest.fn(() => makeBuilder()),
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => fakeClient,
}));

jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: jest.fn(async () => ({
    users: {
      getUser: jest.fn(async () => ({
        firstName: "Approval",
        lastName: "Verifier",
        primaryEmailAddress: { emailAddress: "approval-verifier@example.test" },
      })),
    },
  })),
}));

import { loadApprovalLedger } from "../approval-ledger";

describe("loadApprovalLedger", () => {
  beforeEach(() => {
    builderCalls.length = 0;
    queuedRows = { data: [], error: null };
    fakeClient.from.mockClear();
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
  });
});

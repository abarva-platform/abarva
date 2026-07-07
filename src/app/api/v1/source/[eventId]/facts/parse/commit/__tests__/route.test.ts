// POST /api/v1/source/:eventId/facts/parse/commit — behavior tests.
//
// Covers: the flag-OFF path (404, no write), the happy path (confirm/edit commit,
// reject dropped, counts returned), and a tenant-fenced event miss (404). The
// write adapter is mocked — only confirmed/edited facts reach it.

const tenancy = {
  clientId: "client-1",
  clientKey: "lakeshore",
  userId: "person-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "cxo@lakeshore.example",
  name: "CXO",
  primaryRole: "maestro",
  metadataClientKey: "lakeshore",
};

let flagEnabled = true;
const insertFacts = jest.fn(async (facts: readonly unknown[]) => ({
  ok: true,
  data: { inserted: facts.length },
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "unauthenticated" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ id: "client-1", key: "lakeshore" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => flagEnabled),
}));

jest.mock("@/lib/source/queries", () => ({
  resolveSourceEventUuidForClient: jest.fn(async () => "evt-1"),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceFactWriteAdapter", () => ({
  selectSourceFactWriteAdapter: jest.fn(() => ({ insertFacts })),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { POST } from "../route";

let eventClientKey = "lakeshore";

function fakeFluentClient() {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => {
          if (table === "source_events") {
            return { data: { id: "evt-1", client_key: eventClientKey }, error: null };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

function request(body: unknown): import("next/server").NextRequest {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

const ctx = { params: Promise.resolve({ eventId: "evt-1" }) };

const DOCUMENT = {
  doc: "Acme AMS Proposal.pdf",
  blocks: [
    {
      text: "The one-time transition fee is $250,000, payable on signature.",
      locator: "page 4, §Transition",
    },
    {
      text: "Annual change-order spend under the incumbent averaged $1,200,000.",
      locator: "page 2, §Current State",
    },
  ],
};

const RULES = [
  {
    factKey: "transition_fee",
    patterns: ["transition fee is \\$([\\d,]+)"],
    entityRef: "vendor-acme",
  },
  {
    factKey: "annual_change_order_spend",
    patterns: ["change-order spend .*?averaged \\$([\\d,]+)"],
  },
];

// candidateId is `${factKey}::${entityRef ?? '-'}::${locator}` — deterministic.
const TRANSITION_ID = "transition_fee::vendor-acme::page 4, §Transition";
const CHANGE_ID = "annual_change_order_spend::-::page 2, §Current State";

beforeEach(() => {
  jest.clearAllMocks();
  flagEnabled = true;
  eventClientKey = "lakeshore";
});

describe("POST facts/parse/commit — flag gating", () => {
  it("returns 404 and writes nothing when source_analytics is OFF", async () => {
    flagEnabled = false;
    const res = await POST(
      request({ document: DOCUMENT, rules: RULES, decisions: [] }),
      ctx,
    );
    expect(res.status).toBe(404);
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

describe("POST facts/parse/commit — happy path", () => {
  it("commits only confirmed/edited facts and drops the rejected one", async () => {
    const res = await POST(
      request({
        document: DOCUMENT,
        rules: RULES,
        decisions: [
          { candidateId: TRANSITION_ID, action: "confirm" },
          { candidateId: CHANGE_ID, action: "reject" },
        ],
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      committed: number;
      dropped: number;
    };
    expect(json.ok).toBe(true);
    expect(json.committed).toBe(1);
    expect(json.dropped).toBe(1);

    expect(insertFacts).toHaveBeenCalledTimes(1);
    const written = insertFacts.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(written).toHaveLength(1);
    expect(written[0].fact_key).toBe("transition_fee");
    expect(written[0].source_method).toBe("parsed");
    expect(written[0].client_key).toBe("lakeshore");
  });

  it("writes nothing when every candidate is rejected", async () => {
    const res = await POST(
      request({
        document: DOCUMENT,
        rules: RULES,
        decisions: [
          { candidateId: TRANSITION_ID, action: "reject" },
          { candidateId: CHANGE_ID, action: "reject" },
        ],
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { committed: number; dropped: number };
    expect(json.committed).toBe(0);
    expect(json.dropped).toBe(2);
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("commits an edited value through the write seam", async () => {
    const res = await POST(
      request({
        document: DOCUMENT,
        rules: RULES,
        decisions: [
          { candidateId: TRANSITION_ID, action: "edit", valueNumeric: 300000 },
        ],
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const written = insertFacts.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(written[0].value_numeric).toBe(300000);
  });
});

describe("POST facts/parse/commit — validation + fencing", () => {
  it("returns 400 for a malformed body", async () => {
    const res = await POST(request({ document: DOCUMENT }), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("bad_request");
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns 404 when the event belongs to a different tenant", async () => {
    eventClientKey = "apexretail";
    const res = await POST(
      request({
        document: DOCUMENT,
        rules: RULES,
        decisions: [{ candidateId: TRANSITION_ID, action: "confirm" }],
      }),
      ctx,
    );
    expect(res.status).toBe(404);
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

// POST /api/v1/source/:eventId/facts/parse — behavior tests.
//
// Covers: the flag-OFF path (404, nothing proposed), the happy path (a locatable
// value → a cited candidate), an unlocatable value (rejected, not proposed), a
// malformed body (400), and a tenant-fenced event miss (404). No live backend.

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

const PARSE_BODY = {
  document: {
    doc: "Acme AMS Proposal.pdf",
    blocks: [
      {
        text: "The one-time transition fee is $250,000, payable on signature.",
        locator: "page 4, §Transition",
      },
    ],
  },
  rules: [
    {
      factKey: "transition_fee",
      patterns: ["transition fee is \\$([\\d,]+)"],
      entityRef: "vendor-acme",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  flagEnabled = true;
  eventClientKey = "lakeshore";
});

describe("POST facts/parse — flag gating", () => {
  it("returns 404 and proposes nothing when source_analytics is OFF", async () => {
    flagEnabled = false;
    const res = await POST(request(PARSE_BODY), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
  });
});

describe("POST facts/parse — happy path", () => {
  it("proposes a cited, catalog-typed candidate for a locatable value", async () => {
    const res = await POST(request(PARSE_BODY), ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      candidates: Array<{
        insert: {
          fact_key: string;
          source_method: string;
          value_numeric: number;
          entity_ref: string | null;
          source_citation: { doc: string; locator: string } | null;
        };
        validationState: string;
      }>;
      rejected: unknown[];
    };
    expect(json.ok).toBe(true);
    expect(json.candidates).toHaveLength(1);
    const c = json.candidates[0];
    expect(c.validationState).toBe("proposed");
    expect(c.insert.fact_key).toBe("transition_fee");
    expect(c.insert.source_method).toBe("parsed");
    expect(c.insert.value_numeric).toBe(250000);
    expect(c.insert.entity_ref).toBe("vendor-acme");
    expect(c.insert.source_citation?.locator).toBe("page 4, §Transition");
    expect(json.rejected).toHaveLength(0);
  });

  it("does NOT propose (rejects) a value that cannot be located", async () => {
    const res = await POST(
      request({
        document: {
          doc: "empty.pdf",
          blocks: [{ text: "No numbers here at all.", locator: "p1" }],
        },
        rules: [
          {
            factKey: "transition_fee",
            patterns: ["transition fee is \\$([\\d,]+)"],
            entityRef: "vendor-acme",
          },
        ],
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      candidates: unknown[];
      rejected: Array<{ factKey: string; reason: string }>;
    };
    expect(json.candidates).toHaveLength(0);
    expect(json.rejected).toHaveLength(1);
    expect(json.rejected[0].reason).toMatch(/located/i);
  });
});

describe("POST facts/parse — validation + fencing", () => {
  it("returns 400 for a malformed body", async () => {
    const res = await POST(request({ document: { doc: "x" } }), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("bad_request");
  });

  it("returns 404 when the event belongs to a different tenant", async () => {
    eventClientKey = "apexretail";
    const res = await POST(request(PARSE_BODY), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
  });
});

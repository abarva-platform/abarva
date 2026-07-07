// POST /api/v1/source/:eventId/facts/ingest — behavior tests.
//
// Covers: the flag-OFF path (404, no write), the happy path (deterministic map →
// write, provenance + counts returned), an unknown template code (400), and a
// tenant-fenced event miss (404). All dependencies injected — no live backend.

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
const insertFacts = jest.fn(async (facts: unknown[]) => ({
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
            return {
              data: { id: "evt-1", client_key: eventClientKey },
              error: null,
            };
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

const APP_INVENTORY_BODY = {
  templateCode: "APP_INVENTORY_V1",
  upload: {
    headers: [
      "Application ID",
      "Annual Run Cost (USD)",
      "Loaded FTE Cost (USD)",
      "Extra Column",
    ],
    rows: [
      {
        "Application ID": "APP-1",
        "Annual Run Cost (USD)": "1,000,000",
        "Loaded FTE Cost (USD)": "180000",
        "Extra Column": "ignored",
      },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  flagEnabled = true;
  eventClientKey = "lakeshore";
});

describe("POST facts/ingest — flag gating", () => {
  it("returns 404 and writes nothing when source_analytics is OFF", async () => {
    flagEnabled = false;
    const res = await POST(request(APP_INVENTORY_BODY), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

describe("POST facts/ingest — happy path", () => {
  it("maps the template deterministically, writes facts, returns counts + provenance", async () => {
    const res = await POST(request(APP_INVENTORY_BODY), ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      factsWritten: number;
      unmappedColumns: string[];
      templateCode: string;
    };
    expect(json.ok).toBe(true);
    expect(json.templateCode).toBe("APP_INVENTORY_V1");
    // Two mapped, valued cells → two facts.
    expect(json.factsWritten).toBe(2);
    expect(json.unmappedColumns).toContain("Extra Column");

    // The write adapter received typed, cited facts.
    expect(insertFacts).toHaveBeenCalledTimes(1);
    const facts = insertFacts.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(facts).toHaveLength(2);
    for (const f of facts) {
      expect(f.source_method).toBe("structured_map");
      expect(f.confidence).toBe("high");
      expect(f.client_key).toBe("lakeshore");
      expect(f.source_event_id).toBe("evt-1");
    }
  });
});

describe("POST facts/ingest — validation + fencing", () => {
  it("returns 400 for an unknown template code", async () => {
    const res = await POST(
      request({ templateCode: "NOPE", upload: { headers: [], rows: [] } }),
      ctx,
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("unknown_template");
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed body", async () => {
    const res = await POST(request({ templateCode: "APP_INVENTORY_V1" }), ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("bad_request");
  });

  it("returns 404 when the event belongs to a different tenant", async () => {
    eventClientKey = "apexretail"; // not the caller's tenant
    const res = await POST(request(APP_INVENTORY_BODY), ctx);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("not_found");
    expect(insertFacts).not.toHaveBeenCalled();
  });
});

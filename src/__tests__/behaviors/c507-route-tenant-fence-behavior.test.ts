/**
 * C-507 · Two governed route tenant fences, proven by behavior rather than by
 * the order of two substrings in a file.
 *
 * Item 26 draw 7 (PR #8420) triaged six suites that assert their subject by its
 * bytes, and recorded three of them as `vacuous_control_proof`. Two of those
 * three are tenant fences on governed routes, and the triage recorded the exact
 * mutation that survived each one. It named them as a residual rather than
 * repairing them, so the fences ship today with no executable proof.
 *
 * The two surviving mutations, reproduced on `origin/main` 2b98de396 before this
 * file was written:
 *
 *   M-A  src/app/api/chat/step/route.ts
 *        `body.clientId !== tenancy.clientId && body.clientId !== tenancy.clientKey`
 *        inverted to `===` on both sides, so a request naming a FOREIGN tenant
 *        passes the fence and a legitimate one is refused.
 *
 *   M-B  src/app/api/intelligence/query/route.ts
 *        the `catch` branch stops returning `tenancyErrorResponse(err)`, so a
 *        failed tenancy resolution falls THROUGH into the handler.
 *
 * Applied together, both byte-scanner suites stayed 4 of 4 green: every string
 * they read is still present and still in the same order.
 *
 * This suite asserts the responses instead. Each case is written so that
 * exactly one of the two mutations turns it red, and the negative and positive
 * halves are separate cases because they fail separately -- an inverted fence
 * breaks BOTH directions, and a fence that merely stopped running breaks only
 * the negative one. A suite that only tested the happy path would pass M-A.
 *
 * The two byte-scanner suites are deliberately left byte-identical. Their
 * import-boundary cases are sound, and `zero-product-source-suite-triage.test.ts`
 * recomputes `sourceTextScanner` from each file body, so rewriting one as a
 * behavioral test would turn that control red. This adds the missing proof; it
 * does not relocate the old one.
 */

import { TenancyError } from "@/lib/auth/tenancy";

// ---------------------------------------------------------------------------
// Module boundary. Nothing below reaches a database, a model or a retriever.
// ---------------------------------------------------------------------------

const requireTenancy = jest.fn();
jest.mock("@/lib/auth/tenancy", () => {
  const actual = jest.requireActual("@/lib/auth/tenancy");
  return {
    ...actual,
    requireTenancy: (...args: unknown[]) => requireTenancy(...args),
  };
});

/**
 * The collaborator the chat/step fence guards. A call to it is the observable
 * event "the route built RAG context for this tenant", which is precisely what
 * the vacuous case claimed to order the fence before.
 */
const retrieveStrategyStepContext = jest.fn(async () => "");
jest.mock("@/lib/agent/strategy-step-context", () => ({
  retrieveStrategyStepContext: (...args: unknown[]) =>
    retrieveStrategyStepContext(...(args as [])),
}));

/**
 * Egress preflight is stubbed as ALLOWED, deliberately. It also answers 403, so
 * a denied stub would make the fence's 403 indistinguishable from the egress
 * refusal and the positive cases below would pass for the wrong reason -- which
 * is how this suite first read. Allowing it means a 403 here can only be the
 * fence.
 */
const preflightAnthropicDirectClient = jest.fn(async () => ({
  ok: true as const,
  client: {
    messages: {
      stream: async () => ({
        async *[Symbol.asyncIterator]() {
          /* no chunks: the route drains an empty stream and closes */
        },
      }),
    },
  },
}));
jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: (...args: unknown[]) =>
    preflightAnthropicDirectClient(...(args as [])),
}));

jest.mock("@/lib/agent/userContext", () => ({
  getUserContextPromptBlock: async () => "",
}));
jest.mock("@/lib/agent/tools/registry", () => ({
  getRelevantTools: () => [],
  toAnthropicToolDefinition: (t: unknown) => t,
}));

/** The collaborator the intelligence/query fence guards. */
const runBrokeredGenomeQuery = jest.fn(async () => ({
  status: 200,
  body: { answer: "brokered" },
}));
jest.mock("@/lib/intelligence/genome-query-broker", () => ({
  runBrokeredGenomeQuery: (...args: unknown[]) =>
    runBrokeredGenomeQuery(...(args as [])),
}));

import { POST as chatStepPost } from "@/app/api/chat/step/route";
import { POST as intelligenceQueryPost } from "@/app/api/intelligence/query/route";

// ---------------------------------------------------------------------------

/** The signed-in tenant for every case below. */
const ACTIVE = {
  clientId: "00000000-0000-4000-8000-0000000000aa",
  clientKey: "meridian-health",
  userId: "00000000-0000-4000-8000-0000000000bb",
};

/** A different tenant. Neither field of it matches either field of ACTIVE. */
const FOREIGN_CLIENT_ID = "00000000-0000-4000-8000-0000000000cc";
const FOREIGN_CLIENT_KEY = "apex-retail";

/** A body that clears every guard ABOVE the fence, so only the fence can refuse it. */
function stepBody(clientId: string) {
  return {
    stepId: "1.1",
    clientId,
    selectedOption: "A",
    priorStepsSummary: "",
    clientContext: { name: "A Client", vertical: "healthcare" },
  };
}

async function postStep(clientId: string): Promise<Response> {
  return chatStepPost(
    new Request("http://localhost/api/chat/step", {
      method: "POST",
      body: JSON.stringify(stepBody(clientId)),
    }),
  );
}

async function postQuery(): Promise<Response> {
  return intelligenceQueryPost(
    new Request("http://localhost/api/intelligence/query", {
      method: "POST",
      body: JSON.stringify({ query: "what is the graph readiness" }),
    }) as never,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(ACTIVE);
  retrieveStrategyStepContext.mockResolvedValue("");
  runBrokeredGenomeQuery.mockResolvedValue({
    status: 200,
    body: { answer: "brokered" },
  });
});

describe("C-507 · POST /api/chat/step refuses a foreign tenant before building RAG context", () => {
  it("refuses a clientId that matches neither the active clientId nor the active clientKey", async () => {
    const response = await postStep(FOREIGN_CLIENT_ID);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "forbidden",
      detail: "clientId does not match active tenant",
    });
  });

  it("builds no RAG context for a foreign tenant", async () => {
    // The consequence, asserted separately from the status code. A fence that
    // returns 403 *after* retrieving is a leak with a tidy response.
    await postStep(FOREIGN_CLIENT_ID);

    expect(retrieveStrategyStepContext).not.toHaveBeenCalled();
  });

  it("refuses a foreign clientKey, not only a foreign clientId", async () => {
    const response = await postStep(FOREIGN_CLIENT_KEY);

    expect(response.status).toBe(403);
    expect(retrieveStrategyStepContext).not.toHaveBeenCalled();
  });

  it("admits the active clientId and reaches retrieval", async () => {
    // The positive half. Without it an inverted fence -- which refuses the
    // legitimate request and admits the foreign one -- still passes every
    // negative case above.
    const response = await postStep(ACTIVE.clientId);

    expect(response.status).toBe(200);
    expect(retrieveStrategyStepContext).toHaveBeenCalledTimes(1);
  });

  it("admits the active clientKey and reaches retrieval", async () => {
    const response = await postStep(ACTIVE.clientKey);

    expect(response.status).toBe(200);
    expect(retrieveStrategyStepContext).toHaveBeenCalledTimes(1);
  });

  it("scopes retrieval to the resolved tenant, never to the caller's string", async () => {
    // The caller names the clientId; the retrieval key must be the resolved
    // clientKey. Posting the KEY here would make the two strings identical and
    // the case could not fail -- a mutation substituting `body.clientId` for
    // the resolved key survived exactly that fixture. The admitted value and
    // the expected key must disagree for this assertion to mean anything.
    expect(ACTIVE.clientId).not.toBe(ACTIVE.clientKey);

    await postStep(ACTIVE.clientId);

    expect(retrieveStrategyStepContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: ACTIVE.clientKey }),
    );
  });
});

describe("C-507 · POST /api/intelligence/query fails closed when tenancy does not resolve", () => {
  it("returns 401 and never brokers a query when the caller is unauthenticated", async () => {
    requireTenancy.mockRejectedValue(new TenancyError("unauthenticated"));

    const response = await postQuery();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(runBrokeredGenomeQuery).not.toHaveBeenCalled();
  });

  it("returns 403 and never brokers a query when the caller has no active client", async () => {
    requireTenancy.mockRejectedValue(new TenancyError("no_client"));

    const response = await postQuery();

    expect(response.status).toBe(403);
    expect(runBrokeredGenomeQuery).not.toHaveBeenCalled();
  });

  it("returns 503 rather than 403 when the tenant lookup is unavailable", async () => {
    // A retryable outage must not read as a settled authorization answer.
    requireTenancy.mockRejectedValue(
      new TenancyError("tenant_lookup_unavailable"),
    );

    const response = await postQuery();

    expect(response.status).toBe(503);
    expect(runBrokeredGenomeQuery).not.toHaveBeenCalled();
  });

  it("brokers the query under the resolved tenant when tenancy does resolve", async () => {
    const response = await postQuery();

    expect(response.status).toBe(200);
    expect(runBrokeredGenomeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: ACTIVE.clientId,
        clientKey: ACTIVE.clientKey,
      }),
    );
  });
});

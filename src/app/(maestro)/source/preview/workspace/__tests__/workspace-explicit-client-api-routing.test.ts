/**
 * Which client a Source workspace API request is answered for.
 *
 * A reader can hold an explicit client in the URL that is not the one their
 * session defaults to. Each API has to resolve that client for itself and
 * check access — rather than trusting the session default and quietly
 * answering for the wrong tenant, or rejecting a legitimate explicit client
 * after tenancy has already approved it.
 *
 * ---
 *
 * This file used to read `WorkspaceClient.tsx` and the two route files with
 * `fs.readFileSync` and assert substrings of them. Every case was green, and
 * would have stayed green against a file whose only mention of
 * `checkTenantAccessByKey` was a comment. Worse, the assertions named
 * *identifiers* — so the strongest claim the suite could make about tenant
 * routing was that a symbol appeared somewhere in a file.
 *
 * These cases run the two route handlers and ask the question that matters:
 * for which tenant was the read actually issued? The browser half of the same
 * contract — that the resolved client reaches the fetch at all — needs a DOM
 * and lives in `workspace-explicit-client-api-routing.browser.test.tsx`.
 */

jest.mock("server-only", () => ({}));

const SESSION_DEFAULT_CLIENT = "lakeshore";
const EXPLICIT_CLIENT = "meridian";
const CONTRACT_ID = "MER-CTR-SSO-BPO-001";

type AccessVerdict = { ok: boolean; reason?: string };

const checkTenantAccessByKey = jest.fn(
  async (key: string): Promise<AccessVerdict> => ({ ok: Boolean(key) }),
);
jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: (key: string) => checkTenantAccessByKey(key),
}));

const requireTenancy = jest.fn(
  async (options?: {
    requestedClientKey?: string;
  }): Promise<{ clientKey: string }> => ({
    clientKey: options?.requestedClientKey ?? SESSION_DEFAULT_CLIENT,
  }),
);
/*
 * The error class is declared inside the factory. A class declared beside the
 * mocks above is still in its temporal dead zone when the factory runs, since
 * the factory executes at the hoisted `import` of the route, before any
 * module-scope `const` has initialized.
 */
jest.mock("@/lib/auth/tenancy", () => {
  class TenancyError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return {
    requireTenancy: (options?: { requestedClientKey?: string }) =>
      requireTenancy(options),
    TenancyError,
  };
});

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => null),
}));

/**
 * Every read the detail route makes returns nothing, and each one records the
 * tenant key it was called with. The route's answer is not the subject; the
 * tenant it read under is.
 */
const readsByTenant: string[] = [];
jest.mock("@/lib/source/data-model/read-adapter", () =>
  new Proxy(
    {},
    {
      // `getX` reads one row or none; `listX` reads a set. An empty array is
      // truthy, so a single stub for both would hand the route a "contract"
      // and turn a 404 case into a 200.
      get: (_target, name: string) =>
        jest.fn(async (tenantKey: string) => {
          readsByTenant.push(tenantKey);
          return name.startsWith("list") ? [] : null;
        }),
    },
  ),
);

const loadUserSourceAccessPolicy = jest.fn(async () => ({
  canCreateSourceEvents: false,
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) =>
    loadUserSourceAccessPolicy(...(args as [])),
}));

import { TenancyError } from "@/lib/auth/tenancy";

import { GET as getContractDetail } from "@/app/api/source/workspace/contract/[contractId]/route";
import { POST as postOptimization } from "@/app/api/source/workspace/contract/[contractId]/optimization/route";

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;

function detailRequest(query = "") {
  return getContractDetail(
    new Request(
      `https://app.example/api/source/workspace/contract/${CONTRACT_ID}${query}`,
    ),
    { params: Promise.resolve({ contractId: CONTRACT_ID }) },
  );
}

function optimizationRequest(query = "") {
  return postOptimization(
    new Request(
      `https://app.example/api/source/workspace/contract/${CONTRACT_ID}/optimization${query}`,
      { method: "POST" },
    ),
    { params: Promise.resolve({ contractId: CONTRACT_ID }) },
  );
}

beforeEach(() => {
  readsByTenant.length = 0;
  checkTenantAccessByKey.mockReset();
  checkTenantAccessByKey.mockResolvedValue({ ok: true });
  requireTenancy.mockReset();
  requireTenancy.mockResolvedValue({ clientKey: SESSION_DEFAULT_CLIENT });
  loadUserSourceAccessPolicy.mockReset();
  loadUserSourceAccessPolicy.mockResolvedValue({
    canCreateSourceEvents: false,
  });
  // Keeps the detail route on the one read path, so a case about tenant
  // routing is not also a case about projection fallbacks.
  process.env.SOURCE_WORKSPACE_PROVIDER = "legacy";
});

afterEach(() => {
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env.SOURCE_WORKSPACE_PROVIDER;
  } else {
    process.env.SOURCE_WORKSPACE_PROVIDER = ORIGINAL_PROVIDER;
  }
});

describe("the contract-detail API", () => {
  it("reads under an explicit client rather than the session default", async () => {
    const response = await detailRequest(`?client=${EXPLICIT_CLIENT}`);

    expect(readsByTenant).toContain(EXPLICIT_CLIENT);
    // The whole point. Answering a request made for one tenant with another
    // tenant's contract is the failure this route exists to prevent.
    expect(readsByTenant).not.toContain(SESSION_DEFAULT_CLIENT);
    expect(checkTenantAccessByKey).toHaveBeenCalledWith(EXPLICIT_CLIENT);
    expect(response.status).toBe(404); // no such contract, under that tenant
  });

  it("falls back to the session default when no client is named", async () => {
    await detailRequest();

    expect(readsByTenant).toContain(SESSION_DEFAULT_CLIENT);
    expect(readsByTenant).not.toContain(EXPLICIT_CLIENT);
    expect(requireTenancy).toHaveBeenCalled();
  });

  it("refuses a client it cannot resolve, and reads nothing", async () => {
    const response = await detailRequest("?client=not-a-real-client");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "unknown_client" });
    // An unresolved client must not degrade into the session default.
    expect(readsByTenant).toEqual([]);
  });

  it("refuses a resolvable client the caller has no access to", async () => {
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const response = await detailRequest(`?client=${EXPLICIT_CLIENT}`);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
    expect(readsByTenant).toEqual([]);
  });

  it("reports an unauthenticated caller as 401 rather than as a missing tenant", async () => {
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
    });

    const response = await detailRequest(`?client=${EXPLICIT_CLIENT}`);

    expect(response.status).toBe(401);
    expect(readsByTenant).toEqual([]);
  });
});

describe("the optimization API", () => {
  it("hands the explicit client to tenancy rather than checking it afterwards", async () => {
    // The rejected design resolved tenancy from the session and then compared
    // the requested key against it, which refused every legitimate explicit
    // client. Tenancy has to be asked the question, not told the answer.
    const response = await optimizationRequest(`?client=${EXPLICIT_CLIENT}`);

    expect(requireTenancy).toHaveBeenCalledWith({
      requestedClientKey: EXPLICIT_CLIENT,
    });
    // Stopped at the create-access gate, not at a tenant mismatch.
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "forbidden_source_create_required",
    });
  });

  it("propagates tenancy's own refusal of an explicit client", async () => {
    requireTenancy.mockRejectedValue(new TenancyError("forbidden"));

    const response = await optimizationRequest(`?client=${EXPLICIT_CLIENT}`);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "forbidden" });
  });

  it("refuses a client it cannot resolve before consulting tenancy at all", async () => {
    const response = await optimizationRequest("?client=not-a-real-client");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unknown_client",
    });
    expect(requireTenancy).not.toHaveBeenCalled();
  });
});

/**
 * The engagement console HOST, not just the decider.
 *
 * `engagement-tenant-fence.test.ts` pins the decision. This file pins that the
 * live surface asks it, because a correct decision reaching a page that never
 * calls it is the failure mode this fix exists to avoid: the module could be
 * perfect and `/engagements/[engagementId]` would still render one tenant's
 * Move to another tenant's session.
 *
 * It lives in `src/lib/programs/__tests__` rather than beside the page. That
 * directory is swept wholesale by the required AI surface control catalog, so
 * these cases can fail a merge the moment they land. The catalog names app
 * page tests one path at a time, so a `__tests__` directory under the route
 * would need a workflow edit to block anything -- and an unwired test that
 * blocks nothing is how a fence like this rots.
 */
import React from "react";

const TENANT_A = "aaaaaaaa-1a1a-4a1a-8a1a-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-2b2b-4b2b-8b2b-bbbbbbbbbbbb";

class NotFoundSignal extends Error {}

const notFound = jest.fn(() => {
  throw new NotFoundSignal("not-found");
});
const redirect = jest.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});
const getEngagementByAnyId = jest.fn();
const requireTenancy = jest.fn();

jest.mock("next/navigation", () => ({ notFound, redirect }));
jest.mock("@/lib/db/engagement", () => ({ getEngagementByAnyId }));
jest.mock("@/app/api/v1/programs/_auth", () => ({ requireTenancy }));

// Everything downstream of the fence. The fence runs before any of it, so a
// refused read must never reach these; the happy path needs them to be inert.
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => {
    const builder: Record<string, unknown> = {};
    for (const method of ["from", "select", "eq", "in", "order", "limit"]) {
      builder[method] = () => builder;
    }
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    builder.maybeSingle = async () => ({ data: null, error: null });
    builder.single = async () => ({ data: null, error: null });
    return builder;
  },
}));
jest.mock("@/lib/db/person", () => ({ getPersonById: async () => null }));
jest.mock("@/lib/db/turn", () => ({ getRecentTurns: async () => [] }));
jest.mock("@/lib/knowledge/graph-access", () => ({
  getActivePatterns: async () => [],
  getPeerDecisionsForPhase: async () => [],
  getChainedPatterns: async () => [],
}));
jest.mock("@/components/engagement/EngagementConsole", () => ({
  EngagementConsole: () =>
    React.createElement("div", { "data-testid": "engagement-console" }),
}));
jest.mock("@/components/engagement/EngagementMetaStrip", () => ({
  EngagementMetaStrip: () =>
    React.createElement("div", { "data-testid": "engagement-meta-strip" }),
}));
jest.mock("@/lib/auth/maestro", () => ({ getCurrentPerson: async () => null }));
jest.mock("@/lib/agent/prompts/_shared/user-context", () => ({
  loadVipGreetingData: async () => null,
}));
jest.mock("@/lib/topics/db", () => ({
  listAllTopics: async () => [],
  listEngagementTopics: async () => [],
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientKey: async () => "tenant-under-test",
}));
jest.mock("@/lib/deliverables/legacy-route-resolver", () => ({
  resolveSeedProgramPath: () => null,
}));

type PageModule = {
  default: (args: {
    params: Promise<{ engagementId: string }>;
    searchParams: Promise<{ client?: string }>;
  }) => Promise<unknown>;
};

async function renderPage(engagementId = "move-under-test") {
  const mod: PageModule = await import(
    "@/app/(maestro)/engagements/[engagementId]/page"
  );
  return mod.default({
    params: Promise.resolve({ engagementId }),
    searchParams: Promise.resolve({}),
  });
}

/**
 * Run the page and report whether it refused with `notFound()`.
 *
 * Any OTHER error is rethrown. An earlier draft swallowed them, which made
 * every "does not refuse" case vacuous: a failed module import would have
 * returned false and passed. The rethrow is what keeps a green run meaningful.
 */
async function pageRefusedAsNotFound(): Promise<boolean> {
  try {
    const rendered = await renderPage();
    // Reaching here means the fence allowed the read, so the page must have
    // produced its tree -- proof that the host really ran rather than that an
    // import quietly failed.
    expect(rendered).toBeTruthy();
  } catch (error) {
    if (error instanceof NotFoundSignal) return true;
    throw error;
  }
  return notFound.mock.calls.length > 0;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue({
    clientId: TENANT_A,
    userId: "user-1",
  });
});

describe("the engagement console refuses a cross-tenant Move", () => {
  it("answers notFound for a Move owned by another client — the defect", async () => {
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: null,
      client_id: TENANT_B,
      current_phase: 2,
    });
    await expect(pageRefusedAsNotFound()).resolves.toBe(true);
  });

  it("asks tenancy for the requesting client before it decides", async () => {
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: null,
      client_id: TENANT_B,
      current_phase: 2,
    });
    await pageRefusedAsNotFound();
    // A page that refused without ever resolving tenancy would be refusing on
    // something other than the tenant, and would refuse the demo walk too.
    expect(requireTenancy).toHaveBeenCalled();
  });

  it("refuses BEFORE the canonical-path redirect, so it confirms nothing", async () => {
    const { resolveSeedProgramPath } = jest.requireMock(
      "@/lib/deliverables/legacy-route-resolver",
    ) as { resolveSeedProgramPath: () => string | null };
    expect(resolveSeedProgramPath()).toBeNull();
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: "graph-1",
      client_id: TENANT_B,
      current_phase: 2,
    });
    await expect(pageRefusedAsNotFound()).resolves.toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("the engagement console still renders every read it allowed before", () => {
  it("does not refuse a Move owned by the requesting client", async () => {
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: null,
      client_id: TENANT_A,
      current_phase: 2,
    });
    await expect(pageRefusedAsNotFound()).resolves.toBe(false);
  });

  it("does not refuse a Move that records no client", async () => {
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: null,
      client_id: null,
      current_phase: 2,
    });
    await expect(pageRefusedAsNotFound()).resolves.toBe(false);
  });

  it("does not refuse when tenancy itself could not resolve a client", async () => {
    requireTenancy.mockRejectedValue(new Error("tenant_lookup_unavailable"));
    getEngagementByAnyId.mockResolvedValue({
      id: "eng-1",
      graph_node_id: null,
      client_id: TENANT_A,
      current_phase: 2,
    });
    await expect(pageRefusedAsNotFound()).resolves.toBe(false);
  });

  it("still refuses a missing Move, the refusal it already made", async () => {
    getEngagementByAnyId.mockResolvedValue(null);
    await expect(pageRefusedAsNotFound()).resolves.toBe(true);
  });
});

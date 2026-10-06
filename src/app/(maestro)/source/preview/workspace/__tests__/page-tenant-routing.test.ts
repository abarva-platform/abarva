/**
 * @jest-environment jsdom
 */

/**
 * Source workspace tenant routing — asserted by running the route, not by
 * reading it.
 *
 * WHAT THIS FILE USED TO BE. 208 lines, 13 cases, six synchronous reads of
 * source files and a hundred substring assertions over their text: `page.tsx`,
 * `loading.tsx`, `WorkspaceClientLoader.tsx`, the preview `page.tsx` and the
 * portfolio API route. Every case asserted that a line had been *written*. A
 * behaviour-preserving rename broke it, and a comment satisfied it. Its only
 * reach was `COMMAND_CHECKS` in `scripts/ecl/run_product_ecl_predeploy_gate.mjs`,
 * driven by `ecl-product-live-proof.yml` — `workflow_dispatch` plus
 * `workflow_run` AFTER "ACA main deploy", so it also ran after the deploy it
 * might have stopped.
 *
 * WHAT IT IS NOW. The route is executed. `SourceWorkspacePage` is called with
 * real `searchParams`, its returned tree is rendered in jsdom with the real
 * `WorkspaceClientLoader` and the real `WorkspaceClient` beneath it, and the
 * assertions read the URLs those components actually requested.
 *
 * THE DESTINATION, NOT THE DEPARTURE. `sourceClientKey` arriving as a prop on
 * `WorkspaceExecutiveShell` proves a key left the page; a page that sends it
 * nowhere satisfies that just as well. So the tenant assertions here read the
 * `client` parameter off the **contract-detail request**, which is the last
 * point before the wire, and the fail-closed cases assert that **no request was
 * made at all** rather than that a component rendered.
 *
 * WHAT IS DELIBERATELY NOT HERE. `workspace-explicit-client-api-routing.browser.test.tsx`
 * already proves `WorkspaceClient` puts a *given* `sourceClientKey` on a
 * contract-detail fetch. This file proves the complementary half that nothing
 * covered: which key the **page** resolves from the request and the session,
 * and that an unauthorised tenant is refused before any read happens. Retry
 * behaviour belongs to `contractDetailRetry.test.tsx`; the portfolio adapter's
 * provider modes belong to `portfolioAdapter.ecl.test.ts`. The old file's
 * assertions on prop *names* (`initialContractTab`, `initialWorkspaceTab`) are
 * dropped rather than transcribed: a prop name is not a contract, and the tab
 * deep links are not what this file is for.
 */

jest.mock("server-only", () => ({}));

// `notFound()` and `redirect()` halt a server component by throwing. Encoding
// the outcome in the message keeps the factory free of any reference to a
// module-scope binding, which would be in its temporal dead zone when the page
// module is first required.
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NAVIGATION:notFound");
  },
  redirect: (target: string) => {
    throw new Error(`NAVIGATION:redirect:${target}`);
  },
  forbidden: () => {
    throw new Error("NAVIGATION:forbidden");
  },
}));

const checkTenantAccessByKey = jest.fn();
jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: (key: string) => checkTenantAccessByKey(key),
}));

const requireTenancy = jest.fn();
jest.mock("@/lib/auth/tenancy", () => {
  class TenancyError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return {
    TenancyError,
    requireTenancy: () => requireTenancy(),
  };
});

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (key?: string) => getActiveClientRow(key),
}));

const resolveTenant = jest.fn();
jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: (input?: unknown) => resolveTenant(input),
}));

// The presentational surface below `WorkspaceClient` is stubbed out: none of
// these cases reads anything off it. The requests under assertion are the ones
// the route issues on its own — the loader's portfolio read and, for a
// deep-linked contract, `WorkspaceClient`'s own contract-detail read — so no
// interaction handle is needed here. `workspace-explicit-client-api-routing.browser.test.tsx`
// is the file that drives the view model by hand.
jest.mock("../WorkspaceExecutiveShell", () => ({
  WorkspaceExecutiveShell: () => null,
}));
jest.mock("@/components/agent/AgentDock", () => {
  const { createElement } = jest.requireActual("react");
  return {
    AgentDock: ({ workspace }: { workspace: unknown }) =>
      createElement("div", null, workspace),
  };
});
jest.mock("@/components/ecl/EclDemoFindingsPanel", () => ({
  EclDemoFindingsPanel: () => null,
}));
jest.mock("@/components/ecl/EclServingSurfaceCoverage", () => ({
  EclServingSurfaceCoverage: () => null,
}));
jest.mock("../Tooltip", () => ({ Tooltip: () => null }));
jest.mock("../buildViewModel", () => ({
  buildViewModel: () => ({
    title: "Source",
    tip: null,
    detailState: "ready",
    avaSuggestedActions: [],
    avaSurfaceContext: {},
  }),
}));

import { act, render } from "@testing-library/react";

import SourceWorkspacePage from "../../../workspace/page";
import SourceWorkspacePreviewRedirect from "../page";
import { SOURCE_V4_CUBE_AS_OF_DATE } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

/** An alias the real resolver maps to a distinct app client key. */
const REQUESTED_TENANT = "meridian";
/** A second real tenant, so an opposite-tenant case names a live key. */
const OTHER_TENANT = "apex-retail";
const OTHER_TENANT_KEY = "apexretail";
const SESSION_TENANT_KEY = "lakeshore";
const CONTRACT_ID = "MER-CTR-SSO-BPO-001";

const PORTFOLIO = {
  asOfDateIso: `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`,
  isEmpty: false,
  impact: {},
  workspaceDiagnostics: {},
} as unknown as SourceWorkspacePortfolioData;

const realFetch = global.fetch;

beforeEach(() => {
  checkTenantAccessByKey.mockReset();
  requireTenancy.mockReset();
  getActiveClientRow.mockReset();
  resolveTenant.mockReset();

  // Defaults describe the ordinary authorised session; each case overrides only
  // the leg it is about.
  checkTenantAccessByKey.mockResolvedValue({ ok: true, user: { id: "u1" } });
  requireTenancy.mockResolvedValue({ clientKey: SESSION_TENANT_KEY });
  getActiveClientRow.mockResolvedValue(null);
  resolveTenant.mockResolvedValue(null);

  global.fetch = jest.fn(async (input: unknown) => {
    const url = String(input);
    const body = url.includes("scope=impact")
      ? { impact: {}, sourceProviderKey: "ecl_projection_db" }
      : url.includes("/api/source/workspace/portfolio")
        ? {
            portfolio: PORTFOLIO,
            sourceProviderKey: "ecl_projection_db",
            impactMode: "deferred",
          }
        : { contract_id: CONTRACT_ID };
    return {
      ok: true,
      status: 200,
      json: async () => body,
    } as unknown as Response;
  }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
});

type SearchParams = Record<string, string>;

/** Run the route the way Next runs it, then mount what it returned. */
async function renderRoute(params: SearchParams) {
  const element = await SourceWorkspacePage({
    searchParams: Promise.resolve(params),
  });
  await act(async () => {
    render(element);
  });
  // The loader resolves the portfolio, mounts `WorkspaceClient`, and its own
  // effects then issue the contract-detail read. Two flushes, so the assertion
  // sees the whole chain rather than the first link of it.
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

/** The error a halted server component threw, or null if it did not halt. */
async function routeHalt(params: SearchParams): Promise<string | null> {
  try {
    const element = await SourceWorkspacePage({
      searchParams: Promise.resolve(params),
    });
    await act(async () => {
      render(element);
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

function requestedUrls(): string[] {
  return (global.fetch as unknown as jest.Mock).mock.calls.map((call) =>
    String(call[0]),
  );
}

function contractDetailUrl(): URL {
  const match = requestedUrls().find((candidate) =>
    candidate.includes("/api/source/workspace/contract/"),
  );
  expect(match).toBeDefined();
  return new URL(match as string, "https://app.example");
}

function portfolioUrl(): URL {
  const match = requestedUrls().find((candidate) =>
    candidate.includes("/api/source/workspace/portfolio"),
  );
  expect(match).toBeDefined();
  return new URL(match as string, "https://app.example");
}

describe("the Source workspace route resolves a tenant and carries it to the wire", () => {
  it("puts the explicitly requested client on the contract-detail read", async () => {
    await renderRoute({ client: REQUESTED_TENANT, contractId: CONTRACT_ID });

    expect(checkTenantAccessByKey).toHaveBeenCalledWith(REQUESTED_TENANT);
    // The destination: the key the route resolved is the key on the request.
    expect(contractDetailUrl().searchParams.get("client")).toBe(
      REQUESTED_TENANT,
    );
    expect(contractDetailUrl().pathname).toBe(
      `/api/source/workspace/contract/${encodeURIComponent(CONTRACT_ID)}`,
    );
  });

  it("prefers the explicit client over the session tenant on the same read", async () => {
    requireTenancy.mockResolvedValue({ clientKey: SESSION_TENANT_KEY });
    await renderRoute({ client: REQUESTED_TENANT, contractId: CONTRACT_ID });

    const client = contractDetailUrl().searchParams.get("client");
    expect(client).toBe(REQUESTED_TENANT);
    expect(client).not.toBe(SESSION_TENANT_KEY);
    // An explicit client must not consult the session tenant at all.
    expect(requireTenancy).not.toHaveBeenCalled();
  });

  it("falls back to the session tenant when no client is requested", async () => {
    await renderRoute({ contractId: CONTRACT_ID });

    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(contractDetailUrl().searchParams.get("client")).toBe(
      SESSION_TENANT_KEY,
    );
  });

  it("names no client rather than an empty one when nothing resolves", async () => {
    requireTenancy.mockResolvedValue({ clientKey: "" });
    await renderRoute({ contractId: CONTRACT_ID });

    // `client=` is not the same as naming no client: the API reads an empty
    // value as a client it cannot resolve and answers 404.
    expect(contractDetailUrl().searchParams.has("client")).toBe(false);
  });

  it("carries the governed provider and as-of cut on the portfolio read", async () => {
    await renderRoute({ client: REQUESTED_TENANT });

    const url = portfolioUrl();
    expect(url.searchParams.get("client")).toBe(REQUESTED_TENANT);
    expect(url.searchParams.get("sourceProvider")).toBe("ecl_projection_db");
    expect(url.searchParams.get("asOf")).toBe(
      `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`,
    );
    // The first paint defers the heavy impact layer explicitly.
    expect(url.searchParams.get("impact")).toBe("deferred");
  });

  it("honours an operator as-of override instead of the governed cut", async () => {
    await renderRoute({ client: REQUESTED_TENANT, asOf: "2028-01-31T00:00:00Z" });

    expect(portfolioUrl().searchParams.get("asOf")).toBe(
      "2028-01-31T00:00:00Z",
    );
  });

  it("ignores an unapproved provider override unless the flag is set", async () => {
    await renderRoute({ client: REQUESTED_TENANT, sourceProvider: "legacy" });

    expect(portfolioUrl().searchParams.get("sourceProvider")).toBe(
      "ecl_projection_db",
    );
  });
});

describe("an unauthorised tenant fails closed before any read", () => {
  it("reads nothing at all when the requested tenant is another tenant's", async () => {
    // The session is Lakeshore; the URL asks for a different live tenant.
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const element = await SourceWorkspacePage({
      searchParams: Promise.resolve({
        client: OTHER_TENANT,
        contractId: CONTRACT_ID,
      }),
    });
    const { container } = render(element);
    await act(async () => {
      await Promise.resolve();
    });

    // The fence was consulted with the resolved key, not the raw alias.
    expect(checkTenantAccessByKey).toHaveBeenCalledWith(OTHER_TENANT_KEY);
    // Fails closed: the blocked surface is rendered and NOTHING was fetched.
    // Asserting the absence of the read is the point — a page that rendered a
    // warning and still read the other tenant's contracts would pass a
    // render-only assertion.
    // The only substring assertion left in this file, and it is against
    // rendered DOM text — not the bytes of a source file.
    expect(container.textContent).toContain(
      "This session cannot open the requested tenant",
    );
    expect(requestedUrls()).toEqual([]);
  });

  it("sends an unauthenticated session to sign-in without reading", async () => {
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
    });

    const halt = await routeHalt({
      client: REQUESTED_TENANT,
      contractId: CONTRACT_ID,
    });
    expect(halt).toBe("NAVIGATION:redirect:/sign-in");
    expect(requestedUrls()).toEqual([]);
  });

  it("answers 404 for a tenant the session may not learn exists", async () => {
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "tenant_not_found",
    });

    const halt = await routeHalt({ client: REQUESTED_TENANT });
    expect(halt).toBe("NAVIGATION:notFound");
    expect(requestedUrls()).toEqual([]);
  });

  it("answers 404 for a client string that resolves to no tenant", async () => {
    const halt = await routeHalt({ client: "not-a-real-tenant" });

    expect(halt).toBe("NAVIGATION:notFound");
    // Refused by the real alias resolver, before the membership fence runs.
    expect(checkTenantAccessByKey).not.toHaveBeenCalled();
    expect(requestedUrls()).toEqual([]);
  });

  it("does not fall back to the session tenant when an explicit client is refused", async () => {
    checkTenantAccessByKey.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const element = await SourceWorkspacePage({
      searchParams: Promise.resolve({ client: OTHER_TENANT }),
    });
    render(element);
    await act(async () => {
      await Promise.resolve();
    });

    // The silent-downgrade defect this route exists to prevent: refusing the
    // requested tenant and then answering for the session's own.
    expect(requireTenancy).not.toHaveBeenCalled();
    expect(requestedUrls()).toEqual([]);
  });
});

describe("the historical preview route", () => {
  it("redirects to the canonical route and preserves the query", async () => {
    const halt = await (async () => {
      try {
        await SourceWorkspacePreviewRedirect({
          searchParams: Promise.resolve({
            client: REQUESTED_TENANT,
            contractId: CONTRACT_ID,
          }),
        });
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    })();

    expect(halt).toBe(
      `NAVIGATION:redirect:/source?client=${REQUESTED_TENANT}&contractId=${CONTRACT_ID}`,
    );
  });

  it("redirects with no query when none was given", async () => {
    const halt = await (async () => {
      try {
        await SourceWorkspacePreviewRedirect({
          searchParams: Promise.resolve({}),
        });
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    })();

    expect(halt).toBe("NAVIGATION:redirect:/source");
  });
});

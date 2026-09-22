/**
 * @jest-environment jsdom
 */

/**
 * The browser half of explicit-client routing.
 *
 * `workspace-explicit-client-api-routing.test.ts` proves the two APIs resolve
 * an explicit client for themselves. That is only half the contract: if the
 * workspace never puts the resolved client on the request, the API resolves
 * nothing and every reader is answered for their session default.
 *
 * These cases used to be a regular expression run over `WorkspaceClient.tsx`
 * looking for the shape of one call — which proved the call was written, not
 * that the client reached the wire. They now drive the real component and read
 * the URL it built.
 */

jest.mock("server-only", () => ({}));

/*
 * The surface is stubbed to a handle on the real view model, so each case
 * triggers the component's own request rather than a mock's idea of one.
 */
type Logic = {
  fetchContractDetail: (contractId: string) => void;
  startContractOptimization: (
    contractId: string,
    opportunityId?: string | null,
  ) => void;
};
let lastLogic: Logic | null = null;

jest.mock("../WorkspaceExecutiveShell", () => ({
  WorkspaceExecutiveShell: ({ logic }: { logic: Logic }) => {
    lastLogic = logic;
    return null;
  },
}));
jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: React.ReactNode }) => <>{workspace}</>,
}));
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

import { WorkspaceClient } from "../WorkspaceClient";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

const EXPLICIT_CLIENT = "meridian";
const CONTRACT_ID = "MER-CTR-SSO-BPO-001";

const PORTFOLIO = {
  asOfDateIso: "2027-06-30T00:00:00Z",
  isEmpty: false,
  workspaceDiagnostics: {},
} as unknown as SourceWorkspacePortfolioData;

const realFetch = global.fetch;

beforeEach(() => {
  lastLogic = null;
  global.fetch = jest.fn(
    async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }) as unknown as Response,
  ) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
});

function requestedUrls(): string[] {
  return (global.fetch as unknown as jest.Mock).mock.calls.map((call) =>
    String(call[0]),
  );
}

function contractUrl(suffix = ""): URL {
  const match = requestedUrls().find(
    (candidate) =>
      candidate.includes(encodeURIComponent(CONTRACT_ID)) &&
      (suffix === "" || candidate.includes(suffix)),
  );
  expect(match).toBeDefined();
  return new URL(match as string, "https://app.example");
}

function renderWorkspace(
  props: Partial<{
    sourceClientKey: string | null;
    sourceProviderKey: "legacy" | "ecl_projection" | "ecl_projection_db";
  }> = {},
) {
  render(
    <WorkspaceClient
      portfolio={PORTFOLIO}
      tenantName="A Tenant"
      sourceClientKey={
        props.sourceClientKey === undefined
          ? EXPLICIT_CLIENT
          : props.sourceClientKey
      }
      sourceProviderKey={props.sourceProviderKey ?? "ecl_projection_db"}
    />,
  );
}

describe("the workspace browser", () => {
  it("carries the resolved client and provider into a contract-detail fetch", async () => {
    renderWorkspace();
    await act(async () => {
      lastLogic?.fetchContractDetail(CONTRACT_ID);
    });

    const url = contractUrl();
    expect(url.searchParams.get("client")).toBe(EXPLICIT_CLIENT);
    expect(url.searchParams.get("sourceProvider")).toBe("ecl_projection_db");
  });

  it("carries the same client into an optimization request", async () => {
    renderWorkspace();
    await act(async () => {
      lastLogic?.startContractOptimization(CONTRACT_ID, "opp-1");
    });

    const url = contractUrl("/optimization");
    expect(url.searchParams.get("client")).toBe(EXPLICIT_CLIENT);
    expect(url.searchParams.get("opportunityId")).toBe("opp-1");
  });

  it("omits the client parameter entirely when no client is resolved", async () => {
    renderWorkspace({ sourceClientKey: null });
    await act(async () => {
      lastLogic?.fetchContractDetail(CONTRACT_ID);
    });

    // An empty `client=` is not the same as naming no client: the API reads it
    // as a client it cannot resolve and answers 404.
    expect(contractUrl().searchParams.has("client")).toBe(false);
  });
});

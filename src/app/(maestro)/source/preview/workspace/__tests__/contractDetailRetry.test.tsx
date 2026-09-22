/**
 * @jest-environment jsdom
 */

/**
 * A deep link that met one cold-start failure said the contract could not be
 * loaded -- and meant it, because the stored `"error"` made the guard treat
 * that contract as already handled. It recovered only when the reader happened
 * to open the same contract again from the register, since the fetch below the
 * guard ran whether or not the guard had allowed the attempt.
 *
 * The previous version of this file asserted the *declarations* that carry
 * that fix: `const detailRequests = useRef<`, `CONTRACT_DETAIL_RETRY_ATTEMPTS
 * = 2`, `attempt(remaining - 1)`. Three things were wrong with that. A
 * behaviour-preserving rename broke it. A comment containing the text
 * satisfied it. And its own header said the behavioural coverage lived in the
 * ECL browser suite -- which, measured on `3e08ad5f2`, contains no `retry`,
 * `reject`, `error` or failing-response case anywhere in its 1,927 lines. The
 * failure path, which is the entire defect, was proved by nobody.
 *
 * These cases drive the real component through the real failure.
 */
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("server-only", () => ({}));

/*
 * The surface is stubbed down to the request ledger's two observable effects:
 * what the component decided about each contract, and the reader's ability to
 * open that contract again. `logic` is the real `WorkspaceViewModel`, so both
 * are read from the component's own state, not from a mock's memory.
 */
type Logic = {
  state: { contractDetail: Record<string, unknown> };
  fetchContractDetail: (contractId: string) => void;
};
let lastLogic: Logic | null = null;

jest.mock("../WorkspaceExecutiveShell", () => ({
  WorkspaceExecutiveShell: ({ logic }: { logic: Logic }) => {
    lastLogic = logic;
    const detail = logic.state.contractDetail[CONTRACT_ID];
    return (
      <div>
        <span data-testid="detail-state">
          {detail === undefined
            ? "absent"
            : typeof detail === "string"
              ? detail
              : "loaded"}
        </span>
        <button
          type="button"
          onClick={() => logic.fetchContractDetail(CONTRACT_ID)}
        >
          Open contract again
        </button>
      </div>
    );
  },
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: ReactNode }) => <>{workspace}</>,
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

import { WorkspaceClient } from "../WorkspaceClient";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

const CONTRACT_ID = "MER-CTR-SSO-BPO-001";

/** Matches the component's own constants; see WorkspaceClient.tsx. */
const RETRY_DELAY_MS = 600;
const INITIAL_REQUEUE_DELAY_MS = 1200;

const PORTFOLIO = {
  asOfDateIso: "2027-06-30T00:00:00Z",
  isEmpty: false,
  workspaceDiagnostics: {},
} as unknown as SourceWorkspacePortfolioData;

function contractApiCallCount(): number {
  const mock = global.fetch as unknown as jest.Mock;
  return mock.mock.calls.filter((call) =>
    String(call[0]).includes(CONTRACT_ID),
  ).length;
}

function okResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ contractId: CONTRACT_ID, vendorName: "A Vendor" }),
  } as unknown as Response;
}

function failedResponse(status = 503): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: "upstream" }),
  } as unknown as Response;
}

/** Let the in-flight promise chain settle, then run any scheduled retry. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

function renderDeepLink() {
  return render(
    <WorkspaceClient
      portfolio={PORTFOLIO}
      tenantName="Meridian Health"
      sourceClientKey="meridian"
      initialContractId={CONTRACT_ID}
    />,
  );
}

describe("contract detail fetch", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    lastLogic = null;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  it("retries a transient deep-link failure instead of reporting it", async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      // One 503, then the contract. This is the cold-start window the fix
      // exists for.
      return calls === 1 ? failedResponse() : okResponse();
    }) as unknown as typeof fetch;

    renderDeepLink();
    await advance(RETRY_DELAY_MS);

    expect(screen.getByTestId("detail-state").textContent).toBe("loaded");
    // The negative half: reaching "loaded" on the first call would mean the
    // retry never ran and the case proves nothing.
    expect(contractApiCallCount()).toBeGreaterThan(1);
  });

  it("states the failure once the attempts are spent, rather than spinning", async () => {
    global.fetch = jest.fn(async () => failedResponse()) as unknown as typeof fetch;

    renderDeepLink();
    await advance(RETRY_DELAY_MS);
    await advance(RETRY_DELAY_MS);

    expect(screen.getByTestId("detail-state").textContent).toBe("error");
  });

  it("releases a failed contract, so opening it again tries afresh", async () => {
    // This is the defect itself. With the contract latched as handled, the
    // guard returns early and the click below sends no request at all.
    global.fetch = jest.fn(async () => failedResponse()) as unknown as typeof fetch;

    renderDeepLink();
    await advance(RETRY_DELAY_MS);
    await advance(RETRY_DELAY_MS);
    expect(screen.getByTestId("detail-state").textContent).toBe("error");

    const afterFailure = contractApiCallCount();
    global.fetch = jest.fn(async () => okResponse()) as unknown as typeof fetch;

    await act(async () => {
      screen.getByRole("button", { name: "Open contract again" }).click();
      await Promise.resolve();
    });

    expect(contractApiCallCount()).toBeGreaterThan(0);
    expect(afterFailure).toBeGreaterThan(0);
    expect(screen.getByTestId("detail-state").textContent).toBe("loaded");
  });

  it("requeues the deep link itself once, without the reader doing anything", async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      // The deep link spends all three of its attempts (t=0, +600, +1200) and
      // reaches "error"; the contract is there by the time the requeue fires.
      return calls <= 3 ? failedResponse() : okResponse();
    }) as unknown as typeof fetch;

    renderDeepLink();
    await advance(RETRY_DELAY_MS);
    await advance(RETRY_DELAY_MS);
    expect(screen.getByTestId("detail-state").textContent).toBe("error");

    await advance(INITIAL_REQUEUE_DELAY_MS);

    expect(screen.getByTestId("detail-state").textContent).toBe("loaded");
  });

  it("does not request a loaded contract twice", async () => {
    global.fetch = jest.fn(async () => okResponse()) as unknown as typeof fetch;

    renderDeepLink();
    await advance(0);
    expect(screen.getByTestId("detail-state").textContent).toBe("loaded");

    const afterLoad = contractApiCallCount();
    await act(async () => {
      screen.getByRole("button", { name: "Open contract again" }).click();
      await Promise.resolve();
    });

    expect(contractApiCallCount()).toBe(afterLoad);
  });

  it("decides synchronously, so a second open during flight sends no second request", async () => {
    // The ledger is a ref rather than state precisely because a state updater
    // may not have run by the time the function returns. An earlier attempt at
    // this fix read a flag set inside setState and consequently never fetched.
    global.fetch = jest.fn(
      () => new Promise<Response>(() => undefined),
    ) as unknown as typeof fetch;

    renderDeepLink();
    await advance(0);
    const inFlight = contractApiCallCount();
    expect(inFlight).toBe(1);

    act(() => {
      lastLogic?.fetchContractDetail(CONTRACT_ID);
      lastLogic?.fetchContractDetail(CONTRACT_ID);
    });

    expect(contractApiCallCount()).toBe(1);
    expect(screen.getByTestId("detail-state").textContent).toBe("loading");
  });
});

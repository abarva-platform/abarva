/**
 * @jest-environment jsdom
 */

jest.mock("server-only", () => ({}));

/**
 * The evidence layer must reach a terminal state.
 *
 * The workspace makes two reads of the same API: the portfolio totals and the
 * impact/evidence payload. `fetchPortfolio` was given retry when transient
 * portfolio reads were failing. The impact read was not, and carried no
 * timeout either — so a transient fault the totals recovered from took the
 * whole evidence layer down with it, and a stalled read left "Evidence depth
 * updating" on screen indefinitely with zero rows beneath it.
 *
 * These cases pin the asymmetry closed. They assert the two reads behave the
 * same way under the same fault, and that no fault leaves the badge in
 * `loading` — a spinner that cannot time out reports a failure as progress.
 */
import { render, screen, waitFor } from "@testing-library/react";

import { WorkspaceClientLoader } from "../WorkspaceClientLoader";

jest.mock("../../preview/workspace/WorkspaceClient", () => ({
  // The loader is the subject; the shell is replaced so the cases read the
  // state the loader resolved rather than the surface it eventually paints.
  WorkspaceClient: ({ impactLoadState }: { impactLoadState: string }) => (
    <div data-testid="impact-state">{impactLoadState}</div>
  ),
}));

const PORTFOLIO = {
  portfolio: {
    asOfDateIso: "2026-06-30",
    impact: null,
    workspaceDiagnostics: { lastCompletedLoadAtIso: null },
  },
  sourceProviderKey: "ecl_projection_db",
};
const IMPACT = { impact: { rows: [] }, sourceProviderKey: "ecl_projection_db" };

function json(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function renderLoader() {
  return render(
    <WorkspaceClientLoader
      tenantName="Tenant"
      tenantKey="tenant-1"
      asOfDateIso="2026-06-30"
      sourceProviderKey="ecl_projection_db"
    />,
  );
}

/** Which of the two reads a URL is for. They differ only by `scope=impact`. */
const isImpactUrl = (url: string) => url.includes("scope=impact");

describe("Source workspace impact read", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it("retries a transient impact failure, as the portfolio read already does", async () => {
    let impactCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!isImpactUrl(url)) return json(PORTFOLIO);
      impactCalls += 1;
      // One 503, then success — the shape the portfolio read survives.
      return impactCalls === 1 ? json({ error: "upstream" }, 503) : json(IMPACT);
    }) as unknown as typeof fetch;

    renderLoader();

    await waitFor(() =>
      expect(screen.getByTestId("impact-state").textContent).toBe("ready"),
    );
    // The negative half: "ready" reached on the first call would mean the
    // retry never happened and the case proves nothing.
    expect(impactCalls).toBeGreaterThan(1);
  });

  it("does not retry a 4xx, which will not become a different answer", async () => {
    let impactCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!isImpactUrl(url)) return json(PORTFOLIO);
      impactCalls += 1;
      return json({ error: "bad request" }, 400);
    }) as unknown as typeof fetch;

    renderLoader();

    await waitFor(() =>
      expect(screen.getByTestId("impact-state").textContent).toBe("error"),
    );
    expect(impactCalls).toBe(1);
  });

  it("reaches a terminal state when the impact read never settles", async () => {
    // The reported failure: totals present, evidence badge stuck on
    // "updating" with zero rows. A promise that never resolves reproduces it.
    jest.useFakeTimers();
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (!isImpactUrl(url)) return json(PORTFOLIO);
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      });
    }) as unknown as typeof fetch;

    renderLoader();

    await jest.advanceTimersByTimeAsync(120_000);
    jest.useRealTimers();

    await waitFor(() =>
      expect(screen.getByTestId("impact-state").textContent).not.toBe("loading"),
    );
  });
});

/**
 * @jest-environment jsdom
 */

// Regression coverage for the decoupling fix: PhaseApproveAndBuild used to
// call its "gate approval" callback (formerly onBuildQueued) the instant
// generation jobs were QUEUED, before any of them had actually finished —
// so the parent (MovesPhaseStandaloneClient) would submit phase-gate
// approval while real generation was still in flight or had already failed.
// onBuildSettled must fire exactly once, only after every queued run in the
// batch reaches a terminal status, and must report failed/blocked keys
// separately from succeeded ones so the parent can refuse to approve when
// anything failed.

import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import { PhaseApproveAndBuild, type BuildSettledResult } from "../PhaseApproveAndBuild";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function fakeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockFetchSequence(opts: {
  runId: string;
  intermediateStatus: "queued" | "running";
  finalStatus: "succeeded" | "failed" | "blocked";
}) {
  let runCallCount = 0;
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/v1/deliverables/generate-phase") {
      return fakeResponse(
        {
          phase: 1,
          phaseLabel: "P1 Charter",
          queued: 1,
          total: 1,
          deliverables: [
            {
              deliverableTypeKey: "charter",
              documentTitle: "Program Charter",
              gateArtifact: true,
              runId: opts.runId,
              status: "queued",
            },
          ],
        },
        202,
      );
    }
    if (url === `/api/v1/deliverables/runs/${opts.runId}`) {
      runCallCount += 1;
      // First poll: still in flight. Second poll onward: terminal.
      const status = runCallCount === 1 ? opts.intermediateStatus : opts.finalStatus;
      return fakeResponse({
        status,
        artifactId: status === "succeeded" ? "art_1" : null,
        blobUrl: status === "succeeded" ? "/api/v1/artifacts/art_1" : null,
        progressPct: status === "succeeded" ? 100 : 40,
        progressLabel: null,
        blockers: status === "blocked" ? ["evidence_below_gate"] : [],
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;
}

describe("PhaseApproveAndBuild onBuildSettled sequencing", () => {
  it("does not call onBuildSettled while the run is still queued/running", async () => {
    mockFetchSequence({ runId: "run_pending", intermediateStatus: "running", finalStatus: "succeeded" });
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(async () => {});

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: /Approve & Build P1 Charter/i }).click();
    });

    // Immediately after queueing (before the first poll resolves as terminal),
    // onBuildSettled must NOT have fired — this is the exact bug: the old
    // onBuildQueued fired here, submitting gate approval before generation
    // had actually completed.
    expect(onBuildSettled).not.toHaveBeenCalled();

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), { timeout: 8000 });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual(["charter"]);
    expect(result.failedKeys).toEqual([]);
  });

  it("reports a failed deliverable in failedKeys instead of silently succeeding", async () => {
    mockFetchSequence({ runId: "run_fails", intermediateStatus: "running", finalStatus: "failed" });
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(async () => {});

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: /Approve & Build P1 Charter/i }).click();
    });

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), { timeout: 8000 });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual([]);
    expect(result.failedKeys).toEqual(["charter"]);
  });

  it("reports an enqueue-time error deliverable in failedKeys with no runId and no poll", async () => {
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/v1/deliverables/generate-phase") {
        return fakeResponse(
          {
            phase: 1,
            phaseLabel: "P1 Charter",
            queued: 0,
            total: 1,
            deliverables: [
              {
                deliverableTypeKey: "charter",
                documentTitle: "Program Charter",
                gateArtifact: true,
                runId: null,
                status: "error",
                error: "quality gate rejected input",
              },
            ],
          },
          202,
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
    const onBuildSettled = jest.fn<Promise<void>, [BuildSettledResult]>(async () => {});

    render(
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
        onBuildSettled={onBuildSettled}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: /Approve & Build P1 Charter/i }).click();
    });

    await waitFor(() => expect(onBuildSettled).toHaveBeenCalledTimes(1), { timeout: 8000 });
    const result = onBuildSettled.mock.calls[0][0];
    expect(result.succeededKeys).toEqual([]);
    expect(result.failedKeys).toEqual(["charter"]);
  });
});

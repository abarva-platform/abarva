/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WorkspaceExplorer } from "../WorkspaceExplorer";
import type {
  WorkspaceGenerateCandidate,
  WorkspaceItem,
} from "@/lib/workspace-explorer/types";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const item: WorkspaceItem = {
  id: "source-artifact-state:state-1",
  name: "Sourcing Strategy Memo",
  module: "source",
  type: "sourcing_strategy",
  kind: "deliverable",
  origin: "generated",
  state: "missing",
  version: null,
  stageKey: "strategy",
  artifactCode: "d01_strategy_memo",
  sourceLabel: "Source canvas substrate",
  description: "Why now and value target.",
  href: null,
  classification: null,
  lineage: { cites: [], usedBy: [], status: "not_recorded" },
  audit: { createdAt: "2026-06-01T00:00:00.000Z" },
  blobPath: null,
};

const candidate: WorkspaceGenerateCandidate = {
  id: "source-generate:d01_strategy_memo",
  module: "source",
  artifactCode: "d01_strategy_memo",
  label: "Sourcing Strategy Memo",
  description: "Why now, scope, value target, archetype, rigor level.",
  stageKey: "strategy",
  state: "missing",
  generateHref: "/api/v1/source/event-1/artifacts/d01_strategy_memo/generate",
  reviewHref: "/source/events/event-1?stage=strategy",
};

describe("WorkspaceExplorer", () => {
  beforeEach(() => {
    refresh.mockClear();
    global.fetch = jest.fn();
  });

  it("posts the selected candidate to the existing Source generate route and shows quality review", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        generation: {
          qualityGate: {
            passed: true,
            attempts: 1,
            finalSummary: "Partner-grade review passed.",
          },
        },
      }),
    });

    render(
      <WorkspaceExplorer
        title="AMS Outsourcing 2026"
        eyebrow="SRC-004 · Source workspace"
        backHref="/source/events/event-1"
        items={[item]}
        generateIntent={{
          module: "source",
          eventId: "event-1",
          stageKey: "strategy",
          candidates: [candidate],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-generate-submit"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(candidate.generateHref, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
    });

    expect(
      (await screen.findByTestId("workspace-generate-success")).textContent,
    ).toContain(
      "Quality review: passed · 1 attempt(s). Partner-grade review passed.",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces missing upstream errors without fabricating a draft", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: "upstream_required",
        detail: "Cannot generate d05_scope_memo.",
        missingUpstream: ["d01_strategy_memo"],
      }),
    });

    render(
      <WorkspaceExplorer
        title="AMS Outsourcing 2026"
        eyebrow="SRC-004 · Source workspace"
        backHref="/source/events/event-1"
        items={[item]}
        generateIntent={{
          module: "source",
          eventId: "event-1",
          stageKey: "strategy",
          candidates: [candidate],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-generate-submit"));

    expect(
      (await screen.findByTestId("workspace-generate-error")).textContent,
    ).toContain("Missing upstream: d01_strategy_memo");
    expect(refresh).not.toHaveBeenCalled();
  });
});

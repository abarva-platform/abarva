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

  it("organizes items by step and surfaces what the step still needs", () => {
    render(
      <WorkspaceExplorer
        title="AMS Outsourcing 2026"
        eyebrow="SRC-004 · Source workspace"
        backHref="/source/events/event-1"
        items={[item]}
      />,
    );
    // the left nav is the lifecycle step as a folder
    expect(screen.getByTestId("workspace-step-strategy")).toBeTruthy();
    // the selected step surfaces its canonical evidence needs (templates / gaps)
    expect(screen.getByTestId("workspace-step-needs")).toBeTruthy();
    expect(screen.getByText("Needed for this step")).toBeTruthy();
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

  it("can generate through an existing Moves HTML route without changing that contract", async () => {
    const movesCandidate: WorkspaceGenerateCandidate = {
      id: "moves-generate:costed-business-case",
      module: "moves",
      artifactCode: "costed-business-case",
      label: "Costed Business-Case Pack",
      description: "Board-grade business case.",
      stageKey: "Design & Plan",
      state: "available",
      generateHref: "/api/v1/moves/board-grade-business-case?moveId=move-1",
      reviewHref: "/strategic-moves/move-1/workspace",
      method: "GET",
      responseKind: "html",
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => "<!doctype html><title>Costed Business Case</title>",
    });

    render(
      <WorkspaceExplorer
        title="Irregular Operations Recovery AI"
        eyebrow="MOV-001 · Moves workspace"
        backHref="/strategic-moves/move-1"
        items={[{ ...item, module: "moves" }]}
        generateIntent={{
          module: "moves",
          eventId: "move-1",
          candidates: [movesCandidate],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-generate-submit"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(movesCandidate.generateHref, {
        method: "GET",
      });
    });
    expect(
      (await screen.findByTestId("workspace-generate-success")).textContent,
    ).toContain("Costed Business-Case Pack draft generated");
    expect(refresh).toHaveBeenCalled();
  });

  it("uploads files through the governed Source upload route and shows version state", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: {
          originalName: "vendor-response.pdf",
          version: 2,
          parseStatus: "parsed",
        },
      }),
    });

    render(
      <WorkspaceExplorer
        title="AMS Outsourcing 2026"
        eyebrow="SRC-004 · Source workspace"
        backHref="/source/events/event-1"
        items={[item]}
        uploadIntent={{
          module: "source",
          eventId: "event-1",
          stageKey: "responses",
          uploadHref: "/api/v1/source/event-1/artifacts/upload",
          acceptedFormats: ".pdf",
          defaultClassification: "Confidential",
          classificationOptions: ["Internal", "Confidential"],
          defaultFamily: "proposal",
          familyOptions: [{ value: "proposal", label: "Vendor response" }],
        }}
      />,
    );

    const file = new File(["vendor answer"], "vendor-response.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByTestId("workspace-upload-file"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByTestId("workspace-upload-submit"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/source/event-1/artifacts/upload",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });

    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(body.get("stageKey")).toBe("responses");
    expect(body.get("dataClassification")).toBe("Confidential");
    expect(body.get("artifactFamily")).toBe("proposal");

    expect(
      (await screen.findByTestId("workspace-upload-success")).textContent,
    ).toContain("Registry version: v2 · Parse status: parsed");
    expect(refresh).toHaveBeenCalled();
  });
});

/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PhaseDocumentsPanel } from "../PhaseDocumentsPanel";
import { GeneratePhasePackage } from "../GeneratePhasePackage";
import { AI_DECISION_SUPPORT_WATERMARK } from "@/lib/ai-liability/human-decision-controls";
import {
  MOVES_AI_DRAFT_LABEL,
  MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
} from "@/lib/programs/deliverable-canvas-polish-view";

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

jest.mock("@/lib/programs/attachments", () => ({
  listAttachmentsForProgram: async () => [],
}));

describe("Strategic Moves visible AI liability controls", () => {
  it("labels phase generation controls as AI drafts requiring human edit before commit", () => {
    render(
      <GeneratePhasePackage
        programId="5f5d7993-18ba-4eb6-84a3-72373aab042b"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
      />,
    );

    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(AI_DECISION_SUPPORT_WATERMARK)).toBeInTheDocument();
    // The orchestrated, governed generate control (replaces the retired
    // single-pass "Generate all … AI Draft documents" button).
    expect(
      screen.getByRole("button", {
        name: /Generate Program Charter/i,
      }),
    ).toBeInTheDocument();
  });

  it("labels the production documents tab rows with AI Draft and edit-before-commit controls", async () => {
    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 1,
        compact: true,
        archetype: "ai_enabled_sdlc",
        moveName: "Contact Center AI",
        clientDisplayName: "Apex Retail",
      }),
    );

    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(AI_DECISION_SUPPORT_WATERMARK)).toBeInTheDocument();
  });
});

// ── Documents tab uses the governed async orchestrator, NOT the single-pass route ──
//
// Asserts the engine swap is real: clicking a per-document Generate control POSTs
// to /api/v1/deliverables/generate (the multi-pass, gated, async orchestrator) and
// NEVER to /api/v1/programs/:id/generate (the retired single-pass streamAgentTurn
// path). Guards against a regression that re-wires the UI back to the fabrication-
// capable engine.
describe("Documents tab routes generation through the orchestrated async path", () => {
  const ORCHESTRATED = "/api/v1/deliverables/generate";
  const SINGLE_PASS_RE = /\/api\/v1\/programs\/[^/]+\/generate/;

  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POSTs to the orchestrator generate route (not the single-pass programs route) and polls the run", async () => {
    const { fireEvent, act, waitFor } = await import("@testing-library/react");
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    global.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init });
      if (url === ORCHESTRATED) {
        return new Response(
          JSON.stringify({ runId: "run_test_1", status: "queued" }),
          { status: 202, headers: { "content-type": "application/json" } },
        );
      }
      // run poll → terminal succeeded so the component stops polling
      return new Response(
        JSON.stringify({
          status: "succeeded",
          artifactId: "art_1",
          sectionCount: 7,
          retrievedEvidence: 3,
          progressPct: 100,
          progressLabel: "Done",
          warnings: [],
          blockers: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    render(
      <GeneratePhasePackage
        programId="5f5d7993-18ba-4eb6-84a3-72373aab042b"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Generate Program Charter/i }),
      );
    });

    // Wait for the POST to fire (and the first poll to settle the run).
    await waitFor(() =>
      expect(calls.some((c) => c.init?.method === "POST")).toBe(true),
    );

    const postCall = calls.find((c) => c.init?.method === "POST");
    expect(postCall).toBeDefined();
    expect(postCall!.url).toBe(ORCHESTRATED);

    // The body carries the orchestrated contract for the moves module.
    const body = JSON.parse(String(postCall!.init!.body)) as {
      module: string;
      deliverableType: string;
      sourceArtifactRef: string;
      useCaseArchetype: string;
    };
    expect(body.module).toBe("moves");
    expect(body.deliverableType).toBe("charter");
    expect(body.useCaseArchetype).toBe("ai_enabled_sdlc");
    expect(body.sourceArtifactRef).toBe(
      "5f5d7993-18ba-4eb6-84a3-72373aab042b",
    );

    // No call may target the retired single-pass programs generate route.
    expect(
      calls.some((c) => SINGLE_PASS_RE.test(c.url)),
    ).toBe(false);
  });
});

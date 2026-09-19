/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PhaseDocumentsPanel } from "../PhaseDocumentsPanel";
import { PhaseApproveAndBuild } from "../PhaseApproveAndBuild";
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

// PhaseDocumentsPanel now reads succeeded runs (orchestrator output) to additively
// show built docs; mock those server deps so the jsdom render doesn't pull the
// data-plane (ESM) chain. Null active client → no run-built rows, leaving the
// liability-label assertions unchanged.
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: async () => null,
}));
jest.mock("@/lib/deliverables/orchestrator/runs-repository", () => ({
  listSucceededRunsForMove: async () => [],
}));

// `PhaseDocumentsPanel` resolves tenancy to decide whether it can load discovery
// evidence readiness. `getStrategicMovesTenancy` reaches `requireTenancy` →
// `@/lib/auth/current-user` → `@clerk/nextjs/server`, whose `@clerk/backend`
// dependency ships bare ESM that next/jest's transform ignores — so importing
// this component under jsdom made the whole suite fail to parse before a single
// test ran. The panel already treats a null context as "no tenancy, no evidence
// packets", which is exactly the truth in jsdom, so returning null here is the
// component's own unauthenticated branch and not a weakened assertion.
jest.mock("@/lib/programs/strategic-moves-context", () => ({
  getStrategicMovesTenancy: async () => null,
}));

/**
 * The deepest element whose own text carries `needle`.
 *
 * `screen.getByText("…")` compares a string against an element's *whole*
 * normalized text, so a control that shares one element with another string —
 * `PhaseApproveAndBuild` renders `{WATERMARK}. {REQUIREMENT}` in a single div —
 * matches nothing even though the sentence is on screen. Matching on
 * `textContent.includes` alone matches every ancestor up to `<html>`; excluding
 * elements whose children already carry it leaves exactly the element that
 * renders it.
 */
function renderedText(needle: string): HTMLElement[] {
  return screen.getAllByText((_content, element) => {
    if (!element?.textContent?.includes(needle)) return false;
    return Array.from(element.children).every(
      (child) => !child.textContent?.includes(needle),
    );
  });
}

describe("Strategic Moves visible AI liability controls", () => {
  it("labels the phase Approve & Build action as AI drafts requiring human edit before commit", () => {
    render(
      <PhaseApproveAndBuild
        moveId="5f5d7993-18ba-4eb6-84a3-72373aab042b"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
      />,
    );

    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(renderedText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length).toBe(1);
    expect(renderedText(AI_DECISION_SUPPORT_WATERMARK).length).toBe(1);
    // Both sentences are one element, so the reader cannot meet the watermark
    // without the requirement that follows it.
    expect(renderedText(AI_DECISION_SUPPORT_WATERMARK)[0]).toBe(
      renderedText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT)[0],
    );
    expect(
      screen.getByRole("button", { name: /Approve & Build P1 Charter/i }),
    ).toBeInTheDocument();
  });

  // `compact: true` is the mode the panel treats as presentation
  // (`calmBrowse = Boolean(compact) || presentationMode`), and presentation mode
  // suppresses every internal label — including all three of these controls. The
  // only route that mounts this panel passes `compact={false}`, so that is what
  // the reader of the documents tab actually sees and what this case renders.
  it("labels the production documents tab rows with AI Draft and edit-before-commit controls", async () => {
    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 1,
        compact: false,
        archetype: "ai_enabled_sdlc",
        moveName: "Contact Center AI",
        clientDisplayName: "Apex Retail",
      }),
    );

    expect(screen.getAllByText(MOVES_AI_DRAFT_LABEL).length).toBeGreaterThan(0);
    expect(
      renderedText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT).length,
    ).toBeGreaterThan(0);
    expect(renderedText(AI_DECISION_SUPPORT_WATERMARK).length).toBe(1);
  });

  // The suppression above is deliberate, and it is also the reason the previous
  // case could not observe a thing: pinned here so that a caller who asks for a
  // compact layout and silently loses the AI-draft disclosure shows up as a
  // changed test rather than as a quieter page.
  it("suppresses those controls in presentation mode, which `compact` also selects", async () => {
    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 1,
        compact: true,
        archetype: "ai_enabled_sdlc",
        moveName: "Contact Center AI",
        clientDisplayName: "Example Client",
      }),
    );

    expect(screen.queryAllByText(MOVES_AI_DRAFT_LABEL)).toHaveLength(0);
    expect(
      screen.queryAllByText(MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT, {
        exact: false,
      }),
    ).toHaveLength(0);
    expect(
      screen.queryAllByText(AI_DECISION_SUPPORT_WATERMARK, { exact: false }),
    ).toHaveLength(0);
  });
});

// ── Approve & Build uses the governed BATCH orchestrator, NOT the single-pass route ──
describe("Approve & Build routes generation through the batch orchestrated path", () => {
  const BATCH = "/api/v1/deliverables/generate-phase";
  const SINGLE_PASS_RE = /\/api\/v1\/programs\/[^/]+\/generate/;

  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POSTs to the batch generate-phase route (not the single-pass programs route) and polls the runs", async () => {
    const { fireEvent, act, waitFor } = await import("@testing-library/react");
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push({ url, init });
      if (url === BATCH) {
        return new Response(
          JSON.stringify({
            phase: 1,
            phaseLabel: "P1 Charter",
            queued: 1,
            total: 1,
            deliverables: [
              {
                deliverableTypeKey: "charter",
                documentTitle: "Program Charter",
                gateArtifact: true,
                runId: "run_test_1",
                status: "queued",
              },
            ],
          }),
          { status: 202, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          status: "succeeded",
          artifactId: "art_1",
          blobUrl: "/api/v1/artifacts/art_1",
          progressPct: 100,
          progressLabel: "Done",
          blockers: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    render(
      <PhaseApproveAndBuild
        moveId="5f5d7993-18ba-4eb6-84a3-72373aab042b"
        phaseNum={1}
        phaseLabel="P1 Charter"
        archetype="ai_enabled_sdlc"
        moveName="Contact Center AI"
        clientDisplayName="Apex Retail"
      />,
    );

    // The phase action opens a pre-commit confirmation dialog; generation is
    // what the named approver confirms, not what the button does. Asserting the
    // button alone writes nothing is the control, so it is asserted first.
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Approve & Build P1 Charter/i }),
      );
    });

    expect(calls.some((c) => c.init?.method === "POST")).toBe(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^Approve & Build$/i }),
      );
    });

    await waitFor(() =>
      expect(calls.some((c) => c.init?.method === "POST")).toBe(true),
    );

    const postCall = calls.find((c) => c.init?.method === "POST");
    expect(postCall).toBeDefined();
    expect(postCall!.url).toBe(BATCH);

    const body = JSON.parse(String(postCall!.init!.body)) as {
      moveId: string;
      phase: number;
      useCaseArchetype: string;
    };
    expect(body.moveId).toBe("5f5d7993-18ba-4eb6-84a3-72373aab042b");
    expect(body.phase).toBe(1);
    expect(body.useCaseArchetype).toBe("ai_enabled_sdlc");

    // No call may target the retired single-pass programs generate route.
    expect(calls.some((c) => SINGLE_PASS_RE.test(c.url))).toBe(false);
  });
});

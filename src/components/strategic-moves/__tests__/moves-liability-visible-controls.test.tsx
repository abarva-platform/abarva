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

let mockDeliverablesData: unknown[] = [];
let mockActiveClient: { id: string } | null = null;
let mockRunHistory: Array<[string, unknown]> = [];
let mockDeliverableSelect: string | undefined;
let mockCanApproveGates = true;

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: (query: string) => {
        mockDeliverableSelect = query;
        return {
          eq: () => ({
            order: async () => ({ data: mockDeliverablesData, error: null }),
          }),
        };
      },
    }),
  }),
}));

jest.mock("@/lib/programs/attachments", () => ({
  listAttachmentsForProgram: async () => [],
}));

// PhaseDocumentsPanel reads tenant-scoped run history to show current output and
// failed latest attempts; mock those server deps so jsdom doesn't pull the
// data-plane (ESM) chain. Null active client → no run-built rows, leaving the
// liability-label assertions unchanged.
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: async () => mockActiveClient,
}));
jest.mock("@/lib/deliverables/orchestrator/runs-repository", () => ({
  listDeliverableRunHistoryForMove: async () => new Map(mockRunHistory),
}));

// `PhaseDocumentsPanel` resolves tenancy and the scoped approval capability.
// Mock the boundary so the suite can exercise both authorized and denied UI
// states without importing Clerk's ESM-only server dependency under jsdom.
jest.mock("@/lib/programs/strategic-moves-context", () => ({
  getStrategicMovesTenancy: async () => ({
    userId: "workspace-user",
    clientId: "client-1",
    clientKey: "tenant-1",
    role: "workspace_approver",
  }),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: async () => ({
    canApproveGates: mockCanApproveGates,
  }),
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
  beforeEach(() => {
    mockDeliverablesData = [];
    mockActiveClient = null;
    mockRunHistory = [];
    mockDeliverableSelect = undefined;
    mockCanApproveGates = true;
  });

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

  it("shows the sign-off action when Approve & Build has materialized a deliverables_v2 draft with content", async () => {
    mockDeliverablesData = [
      {
        id: "deliverable-charter-1",
        deliverable_type_key: "charter",
        title: "Program Charter",
        status: "draft",
        current_version: 1,
        updated_at: "2026-09-26T00:00:00Z",
        signed_off_version: null,
        approved_artifact_id: null,
        deliverable_versions: [
          {
            content: "<p>Generated charter content.</p>",
            version: 1,
          },
        ],
      },
    ];

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

    expect(
      screen.getByRole("button", { name: /Approve as-is/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("does not offer sign-off when the workspace user lacks gate-approval capability", async () => {
    mockCanApproveGates = false;
    mockDeliverablesData = [
      {
        id: "deliverable-charter-1",
        deliverable_type_key: "charter",
        title: "Program Charter",
        status: "draft",
        current_version: 1,
        updated_at: "2026-09-26T00:00:00Z",
        signed_off_version: null,
        approved_artifact_id: null,
        deliverable_versions: [
          { content: "<p>Generated charter content.</p>", version: 1 },
        ],
      },
    ];

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

    expect(
      screen.queryByRole("button", { name: /Approve as-is/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps a run-built gate artifact signable when its deliverable row has no readable version content", async () => {
    mockActiveClient = { id: "client-1" };
    mockRunHistory = [[
      "charter",
      {
        latest: {
          id: "run-charter-1",
          status: "succeeded",
          deliverableType: "charter",
          artifactId: "generated-charter-1",
          updatedAt: "2026-09-29T12:00:00Z",
          error: null,
          blockers: [],
        },
        latestSucceeded: {
          id: "run-charter-1",
          status: "succeeded",
          deliverableType: "charter",
          artifactId: "generated-charter-1",
          updatedAt: "2026-09-29T12:00:00Z",
          error: null,
          blockers: [],
        },
      },
    ]];
    mockDeliverablesData = [
      {
        id: "deliverable-charter-1",
        deliverable_type_key: "charter",
        title: "Program Charter",
        status: "draft",
        current_version: 1,
        updated_at: "2026-09-29T12:00:00Z",
        signed_off_version: null,
        approved_artifact_id: null,
        deliverable_versions: [],
      },
    ];

    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 1,
        compact: false,
        archetype: "ai_enabled_sdlc",
        moveName: "Contact Center AI",
        clientDisplayName: "Example Client",
      }),
    );

    expect(mockDeliverableSelect).not.toContain("!inner");
    expect(
      screen.getByRole("button", { name: /Approve as-is/i }),
    ).toBeInTheDocument();
  });

  it("never offers sign-off from a run artifact without its deliverables_v2 row", async () => {
    mockActiveClient = { id: "client-1" };
    mockRunHistory = [[
      "charter",
      {
        latest: {
          id: "run-charter-1",
          status: "succeeded",
          deliverableType: "charter",
          artifactId: "generated-charter-1",
          updatedAt: "2026-09-29T12:00:00Z",
          error: null,
          blockers: [],
        },
        latestSucceeded: {
          id: "run-charter-1",
          status: "succeeded",
          deliverableType: "charter",
          artifactId: "generated-charter-1",
          updatedAt: "2026-09-29T12:00:00Z",
          error: null,
          blockers: [],
        },
      },
    ]];

    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 1,
        compact: false,
        archetype: "ai_enabled_sdlc",
        moveName: "Contact Center AI",
        clientDisplayName: "Example Client",
      }),
    );

    expect(
      screen.getByRole("link", { name: "Download Word" }),
    ).toHaveAttribute(
      "href",
      "/api/v1/artifacts/generated-charter-1?format=docx",
    );
    expect(
      screen.queryByRole("button", { name: /Approve as-is/i }),
    ).not.toBeInTheDocument();
  });

  it("does not present a prior successful artifact as current after the latest attempt fails", async () => {
    mockActiveClient = { id: "client-1" };
    mockRunHistory = [[
      "root_cause_worksheet",
      {
        latest: {
          id: "run-latest-failed",
          status: "failed",
          deliverableType: "root_cause_worksheet",
          artifactId: null,
          updatedAt: "2026-09-29T13:00:00Z",
          error: "Generation response did not satisfy the output contract",
          blockers: [],
        },
        latestSucceeded: {
          id: "run-prior-success",
          status: "succeeded",
          deliverableType: "root_cause_worksheet",
          artifactId: "prior-root-cause-artifact",
          updatedAt: "2026-09-29T12:00:00Z",
          error: null,
          blockers: [],
        },
      },
    ]];

    render(
      await PhaseDocumentsPanel({
        moveId: "5f5d7993-18ba-4eb6-84a3-72373aab042b",
        currentPhase: 2,
        compact: false,
        archetype: "ai_enabled_sdlc",
        moveName: "Synthetic test initiative",
        clientDisplayName: "Synthetic test workspace",
      }),
    );

    expect(screen.getByText("Latest build failed")).toBeInTheDocument();
    expect(
      screen.getByText(/did not satisfy the output contract/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Previous build — not current" }),
    ).toHaveAttribute(
      "href",
      "/api/v1/artifacts/prior-root-cause-artifact?format=html",
    );
    expect(screen.queryByText("Built")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve as-is/i }),
    ).not.toBeInTheDocument();
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

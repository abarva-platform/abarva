/**
 * @jest-environment jsdom
 */

// The Documents list on Files & Evidence must show the documents the Move's
// recorded solution route actually builds — the same set the phase workspace
// hands its Approve & Build control. It listed the unnarrowed canonical set, so
// a route-narrowed Move showed four P3 rows nothing would ever produce and
// stated its tally over six.
//
// This suite renders the real server component, so it pins the WIRING: that the
// panel loads the Move's route at all, and that the list and the tally are both
// derived from it. Asserting the pure set decision is the display-set module's
// own suite; neither case here passes if the panel stops asking.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PhaseDocumentsPanel } from "../PhaseDocumentsPanel";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

let mockConfirmedRoute: ConfirmedSolutionRoute | null = null;
let mockRouteLoaderCalls: Array<{ moveId: string }> = [];
let mockDeliverablesData: unknown[] = [];
let mockActiveClient: { id: string } | null = null;
let mockRunHistory: Array<[string, unknown]> = [];

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: mockDeliverablesData, error: null }),
        }),
      }),
    }),
  }),
}));
jest.mock("@/lib/programs/attachments", () => ({
  listAttachmentsForProgram: async () => [],
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: async () => mockActiveClient,
}));
jest.mock("@/lib/deliverables/orchestrator/runs-repository", () => ({
  listDeliverableRunHistoryForMove: async () => new Map(mockRunHistory),
}));
jest.mock("@/lib/programs/strategic-moves-context", () => ({
  getStrategicMovesTenancy: async () => ({
    userId: "workspace-user",
    clientId: "client-1",
    clientKey: "tenant-1",
    role: "workspace_approver",
  }),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: async () => ({ canApproveGates: true }),
}));
jest.mock("@/lib/programs/load-move-confirmed-route", () => ({
  loadMoveConfirmedSolutionRoute: async (
    _ctx: unknown,
    moveId: string,
  ) => {
    mockRouteLoaderCalls.push({ moveId });
    return mockConfirmedRoute;
  },
}));

const MOVE_ID = "5f5d7993-18ba-4eb6-84a3-72373aab042b";

/**
 * The tally rendered in ONE phase's section header.
 *
 * Every phase renders the same "<generated>/<shown>" shape, and several phases
 * declare the same number of documents, so a bare `getByText("0/3")` is
 * satisfied by a different phase's header — P5 also declares three. Reading the
 * tally out of the header that carries the phase's own label is the only
 * assertion that can fail when THIS phase's denominator is wrong.
 */
function phaseTally(phaseLabel: string): string {
  const label = screen.getByText(phaseLabel);
  const header = label.closest("div")?.parentElement;
  const tally = Array.from(header?.querySelectorAll("span") ?? [])
    .map((node) => node.textContent?.trim() ?? "")
    .find((text) => /^\d+\/\d+$/.test(text));
  if (!tally) throw new Error(`No tally found in the ${phaseLabel} header`);
  return tally;
}

const TECHNICAL_PRODUCT_ROUTE: ConfirmedSolutionRoute = {
  route: "technical_product",
  recommendation: "technical_product",
  solutionOutput: "data_product",
  workflowChange: "limited",
  roleAccountabilityChange: "none",
  adoptionOwner: "Named owner",
  adoptionResponsibility: "business",
  decision: "confirm",
  evidenceReference: "evidence-1",
  validatedBy: "reviewer@example.com",
  rationale: "Confirmed system recommendation.",
};

// Titles, not keys — what the reader of the page actually sees.
const BUILT_BY_TECHNICAL_PRODUCT = [
  "Target State Reference Architecture",
  "Requirements Traceability Matrix",
];
const NOT_BUILT_BY_TECHNICAL_PRODUCT = [
  "Solution Design Specification",
  "Operating Model Design",
  "Sourcing Strategy Brief",
  "Planning Workshop Guide",
];

describe("Files & Evidence documents list is scoped to the Move's route", () => {
  beforeEach(() => {
    mockConfirmedRoute = null;
    mockRouteLoaderCalls = [];
    mockDeliverablesData = [];
    mockActiveClient = null;
    mockRunHistory = [];
  });

  it("lists every P3 document for a Move with no recorded route", async () => {
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    for (const title of [
      ...BUILT_BY_TECHNICAL_PRODUCT,
      ...NOT_BUILT_BY_TECHNICAL_PRODUCT,
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    // The control: nothing is hidden before a route exists, so the next case's
    // absences are the route's doing and not a broken render.
    expect(mockRouteLoaderCalls).toEqual([{ moveId: MOVE_ID }]);
  });

  it("hides the four P3 documents a technical-product route will not build", async () => {
    mockConfirmedRoute = TECHNICAL_PRODUCT_ROUTE;
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    for (const title of BUILT_BY_TECHNICAL_PRODUCT) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    for (const title of NOT_BUILT_BY_TECHNICAL_PRODUCT) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
  });

  it("states the P3 tally over the two documents the route builds", async () => {
    mockConfirmedRoute = TECHNICAL_PRODUCT_ROUTE;
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    // "0/6" was P3's tally for this Move before the fix.
    expect(phaseTally("P3 Design Future State")).toBe("0/2");
    // P4 declares six documents and the route does not scope it, so the
    // unnarrowed tally is still correct there. Without this the case would also
    // pass if narrowing had been applied to every phase.
    expect(phaseTally("P4 Roadmap & Business Case")).toBe("0/6");
  });

  it("keeps an off-route document that this Move has already generated", async () => {
    mockConfirmedRoute = TECHNICAL_PRODUCT_ROUTE;
    mockDeliverablesData = [
      {
        id: "d-1",
        deliverable_type_key: "solution_design",
        title: "Solution Design Specification",
        status: "draft",
        current_version: 1,
        updated_at: "2026-10-06T00:00:00.000Z",
        signed_off_version: null,
        approved_artifact_id: null,
        deliverable_versions: [
          { content: "Recorded before the route was corrected.", version: 1 },
        ],
      },
    ];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    // Files & Evidence is where the person looks for what exists, so narrowing
    // must never make an existing document disappear.
    expect(
      screen.getByText("Solution Design Specification"),
    ).toBeInTheDocument();
    // It is in the tally on both sides: three shown, one of them generated.
    expect(phaseTally("P3 Design Future State")).toBe("1/3");
    // Still narrowed otherwise — retention adds a row, it does not restore the
    // whole canonical set.
    expect(screen.queryByText("Sourcing Strategy Brief")).not.toBeInTheDocument();
  });

  // Retention is deliberately wider than "has a file". A build that FAILED is
  // the state most worth not hiding: the person has an error to act on, and a
  // route correction after the failure would otherwise remove the only row that
  // reports it. Nothing was generated, so this row is in the denominator and
  // not the numerator.
  it("keeps an off-route document whose last build failed", async () => {
    mockConfirmedRoute = TECHNICAL_PRODUCT_ROUTE;
    mockActiveClient = { id: "client-1" };
    mockRunHistory = [
      [
        // Keyed by orchestrator type, which is how the panel reads run history.
        "solution_design",
        {
          latest: {
            id: "run-1",
            clientId: "client-1",
            tenantKey: "tenant-1",
            userId: "workspace-user",
            module: "moves",
            archetype: "governed_data_foundation",
            deliverableType: "solution_design",
            status: "failed",
            artifactId: null,
            sectionCount: null,
            retrievedEvidence: null,
            contextCoverage: null,
            blockers: [],
            warnings: [],
            error: "Generation failed.",
            progressPct: null,
            progressLabel: null,
            updatedAt: "2026-10-06T00:00:00.000Z",
          },
          latestSucceeded: null,
        },
      ],
    ];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    expect(
      screen.getByText("Solution Design Specification"),
    ).toBeInTheDocument();
    // Three shown, none generated — the failure is visible and is not counted
    // as output.
    expect(phaseTally("P3 Design Future State")).toBe("0/3");
  });
});

// ── The superseded state ──────────────────────────────────────────────────────
//
// `POST .../solution-options/approve` sets every P3 architecture deliverable in
// the Move to `superseded` when the chosen option is approved. The list named
// that state `Draft` and offered the approve control beside it, and the sign-off
// route refuses every submission from there with the `deliverable_superseded`
// 409. These cases pin the list's two answers — what the state is called, and
// that approving is not offered from it — against the real render.
describe("Files & Evidence names a superseded document and does not offer its approval", () => {
  const SUPERSEDED_ROW = {
    id: "d-superseded",
    deliverable_type_key: "solution_design",
    title: "Solution Design Specification",
    status: "superseded",
    current_version: 2,
    updated_at: "2026-10-07T00:00:00.000Z",
    signed_off_version: null,
    approved_artifact_id: null,
    deliverable_versions: [
      { content: "Built on the prior solution basis.", version: 2 },
    ],
  };

  beforeEach(() => {
    mockConfirmedRoute = null;
    mockRouteLoaderCalls = [];
    mockDeliverablesData = [];
    mockActiveClient = null;
    mockRunHistory = [];
  });

  it("calls the state Superseded rather than Draft", async () => {
    mockDeliverablesData = [SUPERSEDED_ROW];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    expect(screen.getByText("Superseded")).toBeInTheDocument();
    // The defect: the two-arm ladder let this row fall through to the most
    // actionable label in the domain. No row in this render is a draft, so a
    // surviving "Draft" here is this row wearing the wrong name.
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("replaces the approve control with the action that can succeed", async () => {
    mockDeliverablesData = [SUPERSEDED_ROW];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    // `signed_off_version` is null, so `alreadyApproved` is false and the full
    // approve/upload control rendered here before the fix — against a row whose
    // every submission the route answers with the superseded 409.
    expect(screen.queryAllByRole("button", { name: /approve/i })).toHaveLength(
      0,
    );
    // Regeneration is the one action that clears the state, and the list has to
    // say so: the refusal naming it only arrives after a click that fails.
    expect(
      screen.getByText(/generate it again to return it to draft/i),
    ).toBeInTheDocument();
  });

  it("still offers approval for a draft document in the same render", async () => {
    // The control for the fix: the suppression is the superseded status's doing
    // and not a render that lost its approve control altogether.
    mockDeliverablesData = [
      { ...SUPERSEDED_ROW, status: "draft", id: "d-draft" },
    ];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    expect(screen.getByText("Draft")).toBeInTheDocument();
    // The control renders more than one approve affordance (as-is and
    // upload-a-replacement), so the assertion is on the count being non-zero.
    expect(
      screen.queryAllByRole("button", { name: /approve/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/generate it again to return it to draft/i),
    ).not.toBeInTheDocument();
  });

  it("keeps a superseded document visible and in the tally's denominator", async () => {
    mockConfirmedRoute = TECHNICAL_PRODUCT_ROUTE;
    mockDeliverablesData = [SUPERSEDED_ROW];
    render(
      await PhaseDocumentsPanel({
        moveId: MOVE_ID,
        currentPhase: 3,
        compact: false,
      }),
    );
    // Naming the state must not hide the row: `solution_design` is off this
    // Move's route, and retention is what keeps the reader able to see that a
    // document exists and needs rebuilding.
    expect(
      screen.getByText("Solution Design Specification"),
    ).toBeInTheDocument();
    expect(phaseTally("P3 Design Future State")).toBe("1/3");
  });
});

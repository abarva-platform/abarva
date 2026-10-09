/**
 * @jest-environment jsdom
 */

// The Documents tab on Files & Evidence joins two independent reads: the
// `deliverables_v2` projection, which owns sign-off state and the row the
// approve control targets, and the orchestrator run history, which owns "a
// file was built". The projection read destructured `data` alone, so a failed
// query fail-opened to an EMPTY MAP — the identical shape to "no document on
// record". One failed read therefore stripped the sign-off column from every
// row at once while the panel went on asserting the default: the "Signed off"
// badge vanished, the AI-draft badge took its place, and the approve control
// was withheld without a word.
//
// `GET .../artifacts` reads the SAME projection for the in-workspace ledger and
// already returns `available` beside its map. This suite pins the surface half.
//
// It renders the real server component, so each case fails if the panel stops
// asking — asserting the pure decision is the readback module's own suite.

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { PhaseDocumentsPanel } from "../PhaseDocumentsPanel";
import { MOVES_AI_DRAFT_LABEL } from "@/lib/programs/deliverable-canvas-polish-view";
import { describeDeliverableStatus } from "@/lib/programs/deliverable-status-presentation";

/** The STATUS slot's label for a signed-off row, read from its owner. */
const SIGNED_OFF_STATUS_LABEL = describeDeliverableStatus("signed_off").label;

let mockDeliverablesData: unknown[] = [];
let mockDeliverablesError: unknown = null;
/** Rows the client returns ALONGSIDE an error — the case `data`-only misses. */
let mockDeliverablesRowsDespiteError: unknown[] | null = null;
let mockActiveClient: { id: string } | null = null;
let mockRunHistory: Array<[string, unknown]> = [];
let mockCanApproveGates = true;

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({
            data: mockDeliverablesError
              ? mockDeliverablesRowsDespiteError
              : mockDeliverablesData,
            error: mockDeliverablesError,
          }),
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
  loadUserProgramAccessPolicy: async () => ({
    canApproveGates: mockCanApproveGates,
  }),
}));
jest.mock("@/lib/programs/load-move-confirmed-route", () => ({
  loadMoveConfirmedSolutionRoute: async () => null,
}));

const MOVE_ID = "5f5d7993-18ba-4eb6-84a3-72373aab042b";

/** A succeeded P1 charter build — the "a file exists" half of the join. */
const SUCCEEDED_CHARTER_RUN: Array<[string, unknown]> = [
  [
    "charter",
    {
      latest: {
        id: "run-charter-1",
        status: "succeeded",
        deliverableType: "charter",
        artifactId: "generated-charter-1",
        updatedAt: "2026-10-09T12:00:00Z",
        error: null,
        blockers: [],
      },
      latestSucceeded: {
        id: "run-charter-1",
        status: "succeeded",
        deliverableType: "charter",
        artifactId: "generated-charter-1",
        updatedAt: "2026-10-09T12:00:00Z",
        error: null,
        blockers: [],
      },
    },
  ],
];

/** A charter row the projection holds as signed off at its current version. */
const SIGNED_OFF_CHARTER_ROW = {
  id: "deliverable-charter-1",
  deliverable_type_key: "charter",
  title: "Program Charter",
  status: "signed_off",
  current_version: 2,
  updated_at: "2026-10-09T12:00:00Z",
  signed_off_version: 2,
  approved_artifact_id: "artifact-1",
  deliverable_versions: [{ content: "<h1>Charter</h1>", version: 2 }],
};

/**
 * The one document row, by the title the reader sees.
 *
 * Scoped deliberately: the panel renders every canonical document, and a row
 * the register legitimately holds nothing for carries the AI-draft badge for
 * the right reason. A panel-wide badge assertion is satisfied by those
 * siblings, so it cannot fail when THIS row's badge is wrong.
 */
function documentRow(title: string): HTMLElement {
  const heading = screen.getByText(title);
  const row = heading.parentElement?.parentElement;
  if (!row) throw new Error(`No document row found for ${title}`);
  return row as HTMLElement;
}

async function renderPanel() {
  render(
    await PhaseDocumentsPanel({
      moveId: MOVE_ID,
      currentPhase: 1,
      compact: false,
      archetype: "ai_enabled_sdlc",
      moveName: "Example Move",
      clientDisplayName: "Example Client",
    }),
  );
}

describe("the Documents tab states whether its sign-off column was read", () => {
  beforeEach(() => {
    mockDeliverablesData = [];
    mockDeliverablesError = null;
    mockDeliverablesRowsDespiteError = null;
    mockActiveClient = { id: "client-1" };
    mockRunHistory = SUCCEEDED_CHARTER_RUN;
    mockCanApproveGates = true;
  });

  it("warns once when the document register could not be read", async () => {
    mockDeliverablesError = { message: "connection reset" };
    await renderPanel();

    const warnings = screen.getAllByTestId(
      "document-register-unreadable-warning",
    );
    // Once for the list, not once per row: the condition is a property of the
    // only sign-off read the panel makes.
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toHaveTextContent(/unknown for every document/i);
  });

  it("treats a register that reported an error as unread even when it still returned rows", async () => {
    // The separating case for reading `error` at all. A client that resolves a
    // failed query to `{ data: null, error }` is caught by the array check
    // alone, so a fixture that nulls `data` alongside the error cannot fail
    // when the error term is dropped — and dropping that term is what made
    // this read fail open in the first place.
    mockDeliverablesError = { message: "statement timeout" };
    mockDeliverablesRowsDespiteError = [SIGNED_OFF_CHARTER_ROW];
    await renderPanel();

    expect(
      screen.getByTestId("document-register-unreadable-warning"),
    ).toBeInTheDocument();
    // And nothing was asserted off those rows.
    const row = documentRow("Program Charter");
    expect(within(row).queryByText(/Client Approved/i)).not.toBeInTheDocument();
    expect(
      within(row).queryByText(MOVES_AI_DRAFT_LABEL),
    ).not.toBeInTheDocument();
  });

  it("says nothing about an unreadable register when the read succeeded", async () => {
    mockDeliverablesData = [SIGNED_OFF_CHARTER_ROW];
    await renderPanel();

    expect(
      screen.queryByTestId("document-register-unreadable-warning"),
    ).not.toBeInTheDocument();
  });

  it("withholds the AI-draft badge rather than asserting it from an unread register", async () => {
    mockDeliverablesError = { message: "connection reset" };
    await renderPanel();

    // The badge's own condition is the DEFAULT for an absent row, so before
    // the fix a failed read turned it on for every document at once.
    expect(screen.queryByText(MOVES_AI_DRAFT_LABEL)).not.toBeInTheDocument();
  });

  it("still shows the approved badge for a row the register reported as signed off", async () => {
    mockDeliverablesData = [SIGNED_OFF_CHARTER_ROW];
    await renderPanel();

    // The positive half of the pair. Suppressing both badges unconditionally
    // would pass the case above while erasing a fact the panel did read.
    const row = documentRow("Program Charter");
    // Asserted on the BADGE's own text. The row's status slot renders
    // "Signed off" for this same row from `describeDeliverableStatus`, so a
    // `/Signed off/i` assertion here is satisfied by that sibling and cannot
    // fail when the badge is gone — which is how the first version of this
    // case passed with the badge deleted.
    expect(within(row).getByText(/Client Approved/i)).toBeInTheDocument();
    expect(
      within(row).queryByText(MOVES_AI_DRAFT_LABEL),
    ).not.toBeInTheDocument();
    // And the two slots keep distinct vocabulary, so neither assertion can
    // ever be met by the other.
    expect(/Client Approved/i.test(SIGNED_OFF_STATUS_LABEL)).toBe(false);
  });

  it("names the unreadable register on a built row that has no approve control", async () => {
    mockDeliverablesError = { message: "connection reset" };
    await renderPanel();

    // The control is correctly withheld — sign-off is bound to a row this read
    // did not produce. What was missing is the row saying so: previously it
    // rendered a green "Built" with a download link and nothing else, beside a
    // gate that goes on asking for a sign-off the screen offered no way to give.
    expect(
      screen.queryByRole("button", { name: /Approve as-is/i }),
    ).not.toBeInTheDocument();
    // Exactly the one row with a built file. A note on a row with nothing
    // built would be noise, and a note per row would restate the panel warning.
    const notes = screen.getAllByTestId("document-no-approvable-record");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toHaveTextContent(/unknown, not missing/i);
    // Not the other cause's sentence: nothing here says a record is absent.
    expect(notes[0]).not.toHaveTextContent(/Building again/i);
  });

  it("names the absent record, not a read failure, when the register answered and held no row", async () => {
    mockDeliverablesData = [];
    await renderPanel();

    const notes = screen.getAllByTestId("document-no-approvable-record");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toHaveTextContent(/Building again/i);
    expect(notes[0]).toHaveTextContent(/gate will still ask/i);
    // The two causes must not collapse: a single shared sentence would pass
    // whichever case was written first.
    expect(notes[0]).not.toHaveTextContent(/unknown, not missing/i);
    expect(
      screen.queryByTestId("document-register-unreadable-warning"),
    ).not.toBeInTheDocument();
  });

  it("keeps the approve control where the register did supply a row", async () => {
    mockDeliverablesData = [
      { ...SIGNED_OFF_CHARTER_ROW, signed_off_version: null, status: "draft" },
    ];
    await renderPanel();

    // The note must not displace the control on a row that has one.
    expect(
      screen.getByRole("button", { name: /Approve as-is/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("document-no-approvable-record"),
    ).not.toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */

/**
 * aVa's "Draft proposed inputs" control, asserted through the REAL host.
 *
 * The capture-v2 workspace hands its leading actions to the shared `AgentDock`,
 * which renders each one as an enabled button. The host used to hand it a
 * literal one-action list on every mounted phase, while the click handler
 * returned silently below P1 — so on P0 Originate, which the demo tenant mounts
 * (`moves_capture_v2` + `moves_capture_p0_v1`), the walk's FIRST step carried an
 * enabled button that did nothing at all: no dock state, no message, no request.
 *
 * The adapter's own cases pin the decision; these pin the chain, which the
 * sibling client suite cannot see because its dock mock drops `suggestedActions`
 * entirely. The mock here renders them the way `AgentDock` does.
 */

import "@testing-library/jest-dom";
import { readFileSync } from "fs";
import { join } from "path";
import { createElement as mockCreateElement } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({
    suggestedActions = [],
    workspace,
  }: {
    suggestedActions?: ReadonlyArray<{
      id: string;
      label: string;
      onClick?: () => void;
    }>;
    workspace?: unknown;
  }) =>
    mockCreateElement(
      "div",
      { "data-testid": "agent-dock" },
      ...suggestedActions.map((action) =>
        mockCreateElement(
          "button",
          {
            key: action.id,
            type: "button",
            "data-testid": `agent-dock-suggestion-${action.id}`,
            onClick: () => action.onClick?.(),
          },
          action.label,
        ),
      ),
      workspace as never,
    ),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";
import { MovesPhaseStandaloneClient } from "../MovesPhaseStandaloneClient";
import {
  AVA_PHASE_INPUT_DRAFT_ACTION_ID,
  avaPhaseInputDraftAvailability,
} from "../ava-dock-adapter";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { StrategicMove } from "@/lib/programs/types.ui";

// jsdom provides none of these; the component runs in a browser in production.
if (typeof global.TextEncoder === "undefined") {
  (global as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
    TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as unknown as typeof global.TextDecoder;
}
if (typeof global.ReadableStream === "undefined") {
  (
    global as unknown as { ReadableStream: typeof ReadableStream }
  ).ReadableStream = ReadableStream;
}

const DRAFT_ACTION_TESTID = `agent-dock-suggestion-${AVA_PHASE_INPUT_DRAFT_ACTION_ID}`;

const phaseTallies: PhaseTallyRow[] = [0, 1, 2, 3, 4, 5].map((phase) => ({
  phase,
  label: `P${phase}`,
  met: 0,
  total: 2,
  state: phase === 0 ? "current" : "upcoming",
}));

function makeMove(currentPhase: number, phaseLabel: string): StrategicMove {
  return {
    id: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    displayCode: "GLOBAL_NETWORK_AIRLINE-CANARY-2026",
    name: "CANARY - SkyHarbor Recovery Command IROPS Architecture",
    archetype: "ai_product_enablement",
    tenant: {
      id: "tenant-skyharbor",
      name: "Airline Demo",
      industryCode: "airline",
    },
    charter: null,
    functionPackKey: null,
    currentPhase,
    phaseLabel,
    status: {
      key: "on_track",
      text: "On track",
      description: "Phase capture in progress",
    },
    statusColor: "green",
    sponsor: {
      id: "sponsor",
      name: "Victor Hale",
      role: "Chief Technology Officer",
    },
    participants: [],
    valueAtStake: {
      projected: { low: 75_000_000, high: 145_000_000, currency: "USD" },
      verified: null,
      assumptions: null,
    },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "Recovery command",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
  };
}

function renderPhase(phaseNum: number, captureP0Enabled: boolean) {
  return render(
    <MovesPhaseStandaloneClient
      canApproveGates
      captureP0Enabled={captureP0Enabled}
      captureV2Enabled
      carriesForwardContent={[]}
      evidenceNeedPackets={[]}
      move={makeMove(phaseNum, `P${phaseNum} capture`)}
      phaseNum={phaseNum}
      phaseTallies={[...phaseTallies]}
    />,
  );
}

describe("aVa drafting control reaches only the phases that can be drafted", () => {
  let requestedUrls: string[] = [];

  beforeEach(() => {
    requestedUrls = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input));
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, proposals: [], refusal: null }),
      } as Response;
    }) as unknown as typeof global.fetch;
  });

  function draftRequests(): string[] {
    return requestedUrls.filter((url) => url.includes("/phase-input-draft"));
  }

  it("P0 Originate under both demo-tenant flags offers NO drafting button", () => {
    renderPhase(0, true);
    // The P0 capture flow really is mounted, so this is the live arm, not a
    // surface that happens to be dark.
    expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
    expect(screen.queryByTestId(DRAFT_ACTION_TESTID)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Draft proposed inputs" }),
    ).not.toBeInTheDocument();
  });

  it("P1 Charter offers the drafting button and clicking it requests drafts", async () => {
    renderPhase(1, false);
    const button = screen.getByTestId(DRAFT_ACTION_TESTID);
    expect(button).toBeEnabled();
    await act(async () => {
      fireEvent.click(button);
    });
    await waitFor(() => {
      expect(draftRequests().length).toBeGreaterThan(0);
    });
  });

  it("the drafting handler is unreachable from P0's dock, so no request is made", () => {
    renderPhase(0, true);
    expect(draftRequests()).toEqual([]);
  });

  it("P0's refusal sentence is the one the dock would have to show", () => {
    // The handler answers rather than returning silently, so a click that
    // reaches it some other way states a reason. Pinned here against the host's
    // own authority so the two cannot disagree.
    const availability = avaPhaseInputDraftAvailability(0);
    expect(availability.available).toBe(false);
    expect(availability.unavailableReason).toEqual(
      expect.stringContaining("P1 Charter onward"),
    );
  });

  it("the legacy (non-capture-v2) dock also withholds the offer on P0", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove(0, "P0 Originate")}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(screen.queryByTestId("moves-capture-flow")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Draft proposed inputs" }),
    ).not.toBeInTheDocument();
  });
});

/**
 * The handler's own refusal arm is UNREACHABLE from this host once the control
 * is withheld — neither trigger offers it below P1, and the phase route 404s
 * anything outside [0,5]. So it cannot be exercised by rendering, and these
 * cases assert the invariant instead: ONE authority decides whether aVa can
 * draft, the handler reads it, and it no longer returns silently on a phase it
 * will not draft. A silent return is what put a dead button on P0 to begin
 * with, and the guard is what stops a future surface reintroducing one.
 */
describe("the drafting handler states a reason rather than returning silently", () => {
  const handlerSource = (() => {
    const source = readFileSync(
      join(__dirname, "..", "MovesPhaseStandaloneClient.tsx"),
      "utf8",
    );
    const start = source.indexOf(
      "const requestAvaPhaseInputDrafts = useCallback",
    );
    const end = source.indexOf(
      "}, [avaDraftStatus, move.id, phase.phase]);",
      start,
    );
    return { source, start, end, body: source.slice(start, end) };
  })();

  it("locates the drafting handler (guards the slice these cases read)", () => {
    expect(handlerSource.start).toBeGreaterThan(-1);
    expect(handlerSource.end).toBeGreaterThan(handlerSource.start);
    expect(handlerSource.body).toContain("phase-input-draft");
  });

  it("decides with the shared availability authority, not its own comparison", () => {
    expect(handlerSource.body).toContain("avaPhaseInputDraftAvailability(");
    expect(handlerSource.body).not.toContain("phase.phase < 1");
  });

  it("answers an unavailable phase with the authority's reason", () => {
    expect(handlerSource.body).toContain("unavailableReason");
    expect(handlerSource.body).toMatch(/setAvaDraftStatus\("error"\)/);
  });

  it("builds the dock's leading actions from that same authority", () => {
    expect(handlerSource.source).toContain(
      "avaLeadingActions={avaDraftLeadingActions}",
    );
    expect(handlerSource.source).toContain(
      "avaPhaseInputDraftLeadingActions(phase.phase",
    );
  });
});

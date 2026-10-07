/**
 * @jest-environment jsdom
 */

// `POST /api/v1/deliverables/generate-phase` refuses a held phase with 409
// `required_evidence_open`, and that body carries `requiredEvidenceGaps` —
// each open slot by name, with its next action. The enqueue error path read
// only `detail`, which states the COUNT ("1 required evidence item is not yet
// approved in Files & Evidence"), so the one item holding the build was named
// nowhere on the screen. These cases pin the named reading AND the fallback,
// so dropping the wiring fails here rather than staying green.

import "@testing-library/jest-dom";
import { render, screen, act, within } from "@testing-library/react";
import { PhaseApproveAndBuild } from "../PhaseApproveAndBuild";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const HELD_DETAIL =
  "1 required evidence item is not yet approved in Files & Evidence. No phase build was queued.";

function mockEnqueueRefusal(body: unknown) {
  global.fetch = jest.fn(async () => ({
    ok: false,
    status: 409,
    json: async () => body,
  })) as unknown as typeof fetch;
}

function renderPhase() {
  render(
    <>
      <div id="phase-build-refusal-action" />
      <PhaseApproveAndBuild
        moveId="move-1"
        phaseNum={2}
        phaseLabel="P2 Discover"
        archetype="governed_data_foundation"
        moveName="Example Move"
        clientDisplayName="Client"
        actionPortalTargetId="phase-build-refusal-action"
      />
    </>,
  );
}

async function clickApproveAndBuild() {
  await act(async () => {
    screen.getByRole("button", { name: /Approve & Build/i }).click();
  });
  await act(async () => {
    within(screen.getByRole("dialog"))
      .getByRole("button", { name: /^Approve & Build$/i })
      .click();
  });
}

describe("the phase build refusal names the evidence it is held by", () => {
  it("names the one open slot and its next action beside the route's wording", async () => {
    mockEnqueueRefusal({
      error: "required_evidence_open",
      detail: HELD_DETAIL,
      requiredEvidenceGaps: [
        {
          evidenceSlot: "Data governance ownership",
          status: "open",
          nextAction: "Upload the ownership record and approve it.",
        },
      ],
    });
    renderPhase();
    await clickApproveAndBuild();

    expect(
      screen.getByText(
        `${HELD_DETAIL} Open: Data governance ownership (Upload the ownership record and approve it.).`,
      ),
    ).toBeInTheDocument();
  });

  it("names every open slot when several are held", async () => {
    mockEnqueueRefusal({
      error: "required_evidence_open",
      detail: HELD_DETAIL,
      requiredEvidenceGaps: [
        { evidenceSlot: "Data quality rules" },
        { evidenceSlot: "Source system data access" },
      ],
    });
    renderPhase();
    await clickApproveAndBuild();

    const message = screen.getByText(/Open: /);
    expect(message).toHaveTextContent("Data quality rules");
    expect(message).toHaveTextContent("Source system data access");
  });

  // The ladder below the named reading must be unchanged: every other refusal
  // code on this route carries no gap list, and those still read `detail`.
  it("still reports a refusal that names no slot from its detail", async () => {
    mockEnqueueRefusal({
      error: "evidence_readiness_unavailable",
      detail:
        "Required evidence readiness could not be verified. No phase build was queued; retry after evidence readiness is available.",
    });
    renderPhase();
    await clickApproveAndBuild();

    expect(
      screen.getByText(/Required evidence readiness could not be verified/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Open: /)).not.toBeInTheDocument();
  });

  it("falls back to detail when the gap list names nothing usable", async () => {
    mockEnqueueRefusal({
      error: "required_evidence_open",
      detail: HELD_DETAIL,
      requiredEvidenceGaps: [{ nextAction: "Upload it." }],
    });
    renderPhase();
    await clickApproveAndBuild();

    expect(screen.getByText(HELD_DETAIL)).toBeInTheDocument();
    expect(screen.queryByText(/Open: /)).not.toBeInTheDocument();
  });
});

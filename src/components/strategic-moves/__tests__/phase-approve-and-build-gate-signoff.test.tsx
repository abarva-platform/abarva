/**
 * @jest-environment jsdom
 */

// Coverage for the in-workspace gate attestation ledger added to
// PhaseApproveAndBuild. The gate step used to offer sign-off only on the
// separate /evidence page; the ledger surfaces per-gate-deliverable sign-off
// state (and the existing DeliverableApprovalAction) right where the gate is
// submitted, and the submit control refuses while a built gate document is
// still unsigned.

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { PhaseApproveAndBuild } from "../PhaseApproveAndBuild";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

// Phase 1 ships a gate deliverable (charter) and a non-gate one
// (discovery_plan); the ledger must list only the gate deliverable.
const CHARTER = {
  artifactId: "art_charter",
  deliverableTypeKey: "charter",
  documentTitle: "Program Charter",
  phase: 1 as number | null,
  status: "draft",
  version: 1,
  downloadUrl: "/api/v1/programs/move-1/artifacts/art_charter/download",
  deliverableId: "deliv_charter",
};
const DISCOVERY = {
  artifactId: "art_discovery",
  deliverableTypeKey: "discovery_plan",
  documentTitle: "Discovery Workshop Guide",
  phase: 1 as number | null,
  status: "draft",
  version: 1,
  downloadUrl: "/api/v1/programs/move-1/artifacts/art_discovery/download",
  deliverableId: "deliv_discovery",
};

type Artifact = typeof CHARTER & {
  signedOffVersion?: number | null;
  currentVersion?: number | null;
};

function renderFlow(
  artifacts: Artifact[],
  opts: { canApproveGates?: boolean } = {},
) {
  // No build is started in these cases, so the component must issue no fetch.
  global.fetch = jest.fn() as unknown as typeof fetch;
  return render(
    <PhaseApproveAndBuild
      moveId="move-1"
      phaseNum={1}
      phaseLabel="P1 Charter"
      archetype="ai_enabled_sdlc"
      moveName="Example Move"
      clientDisplayName="Client"
      canApproveGates={opts.canApproveGates ?? true}
      initialArtifacts={artifacts}
      onBuildSettled={async () => {}}
    />,
  );
}

function ledger() {
  return screen.getByRole("region", { name: /Gate deliverable sign-off/i });
}

describe("PhaseApproveAndBuild gate sign-off ledger", () => {
  it("lists only gate deliverables, not the non-gate ones beside them", () => {
    renderFlow([
      { ...CHARTER, currentVersion: 2, signedOffVersion: 2 },
      { ...DISCOVERY, currentVersion: 1, signedOffVersion: 1 },
    ]);
    const section = ledger();
    expect(within(section).getByText("Program Charter")).toBeInTheDocument();
    // The non-gate deliverable is present in the status list but must never
    // appear in the gate sign-off ledger.
    expect(
      within(section).queryByText("Discovery Workshop Guide"),
    ).not.toBeInTheDocument();
  });

  it("mounts the sign-off control for a built gate deliverable still in draft", () => {
    renderFlow([{ ...CHARTER, currentVersion: 2, signedOffVersion: null }]);
    const section = ledger();
    expect(
      within(section).getByText("Draft · awaiting sign-off"),
    ).toBeInTheDocument();
    // DeliverableApprovalAction, mounted verbatim, renders these controls.
    expect(
      within(section).getByRole("button", { name: /Approve as-is/i }),
    ).toBeInTheDocument();
    expect(
      within(section).getByLabelText(/Approval note/i),
    ).toBeInTheDocument();
  });

  it("shows a non-approver sign-off state only, never an approve button", () => {
    renderFlow([{ ...CHARTER, currentVersion: 2, signedOffVersion: null }], {
      canApproveGates: false,
    });
    const section = ledger();
    expect(
      within(section).queryByRole("button", { name: /Approve as-is/i }),
    ).not.toBeInTheDocument();
    expect(
      within(section).getByText(/available to an authorized workspace user/i),
    ).toBeInTheDocument();
  });

  it("disables the submit control with a sign-off reason while a gate deliverable is unsigned", () => {
    renderFlow([{ ...CHARTER, currentVersion: 2, signedOffVersion: null }]);
    // Relabelled + disabled: it must not read as an actionable submit.
    const submit = screen.getByRole("button", {
      name: /Sign off 1 document to submit/i,
    });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: /Submit P1 Charter gate approval/i,
      }),
    ).not.toBeInTheDocument();
    // Amber reason line directing the user to the ledger.
    expect(
      screen.getByText(/needs sign-off\. Approve it in the sign-off ledger/i),
    ).toBeInTheDocument();
  });

  it("enables the submit control once every gate deliverable is signed off", () => {
    renderFlow([{ ...CHARTER, currentVersion: 3, signedOffVersion: 3 }]);
    const submit = screen.getByRole("button", {
      name: /Submit P1 Charter gate approval/i,
    });
    expect(submit).toBeEnabled();
    // And the ledger shows the signed-off state at the signed version.
    expect(
      within(ledger()).getByText(/Signed off · v3/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sign off .* to submit/i }),
    ).not.toBeInTheDocument();
  });
});

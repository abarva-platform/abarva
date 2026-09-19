/** @jest-environment jsdom */

/**
 * Behavioral test for the `program-gate-approval` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * Approving a gate here is a stateful write: it POSTs to
 * `/api/v1/programs/<id>/advance` with `bypassGate: true`, which moves a
 * program past criteria that are not met. The declared control is that a human
 * must accept responsibility and write a rationale of real length before that
 * can fire, with the AI-support watermark and the attestation visible while
 * they do it.
 *
 * The catalog checker proves `HumanApprovalGate`, `canSubmitHumanApproval` and
 * `MOVES_HUMAN_RATIONALE_MIN_CHARS` appear in the file. It cannot prove the
 * advance refuses to fire, that the rationale sent is the one typed, or that a
 * whitespace-padded rationale is rejected. Every other test over this file
 * reads it as source text; this one renders the real page and drives the real
 * modal.
 *
 * `GateApproveModal` is not exported, so the page itself is mounted and the
 * gate section opened the way a user opens it. That is the point — the catalog
 * entry's own reason for having no test was that the modal cannot be reached
 * alone.
 */

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/programs/APX-01",
  useSearchParams: () => new URLSearchParams(),
}));

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/shell/Toast";
import { buildProgramDetailView } from "@/lib/programs/programs-detail-view";
import { MOVES_HUMAN_RATIONALE_MIN_CHARS } from "@/lib/programs/moves-ai-liability";
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from "@/lib/ai-liability/human-decision-controls";
import { ProgramDetailPage } from "../ProgramDetailPage";

// Hoisted, not an inline literal: `initialNexusArtifacts` is a useEffect
// dependency, and a fresh array on every render re-fires that effect forever.
// The route passes a value computed once per request on the server, so this
// mirrors production identity rather than papering over a defect.
const NO_ARTIFACTS: never[] = [];

const RATIONALE =
  "The sponsor reviewed the two open criteria and accepted the risk of advancing now.";

/** Phase 3 is the first phase whose fixture view carries gate criteria. */
const VIEWING_PHASE = 3;

function advanceRequests(): Array<[string, RequestInit]> {
  return (global.fetch as jest.Mock).mock.calls.filter(
    ([url]: [string]) => typeof url === "string" && url.includes("/advance"),
  );
}

async function openGateModal() {
  const view = buildProgramDetailView("APX-01", VIEWING_PHASE);
  render(
    <ToastProvider>
      <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
    </ToastProvider>,
  );
  // The page fires its own background requests on mount (the Nexus synthesis
  // quote streams). Flush them here so their state updates land inside act,
  // rather than mocking the children away and testing a thinner page than the
  // one a user opens.
  await act(async () => {});
  fireEvent.click(screen.getByTestId("program-phase-archive-gate"));
  fireEvent.click(
    screen.getByRole("button", { name: /Request gate approval/i }),
  );
  return view;
}

function approveButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: "Approve human decision",
  }) as HTMLButtonElement;
}

function writeRationale(text: string) {
  fireEvent.change(screen.getByTestId("human-approval-justification"), {
    target: { value: text },
  });
}

function acceptResponsibility() {
  fireEvent.click(
    screen.getByTestId("human-approval-responsibility-checkbox"),
  );
}

describe("program gate approval · human decision control", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (url: string) => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ ok: true, newPhase: VIEWING_PHASE + 1 }),
      text: async () => "",
      // The synthesis quote streams; hand it an empty, immediately-finished
      // reader so the page settles instead of taking its error branch.
      body: url.includes("/synthesis")
        ? { getReader: () => ({ read: async () => ({ done: true, value: undefined }) }) }
        : null,
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows the AI-support watermark and the attestation while the human decides", async () => {
    await openGateModal();

    const attestation = screen.getByTestId("human-approval-attestation");
    expect(attestation.textContent).toContain(AI_DECISION_SUPPORT_WATERMARK);
    expect(attestation.textContent).toContain(HUMAN_DECISION_ATTESTATION_TEXT);
  });

  it("will not advance the program with no rationale and no accepted responsibility", async () => {
    await openGateModal();

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    // The absent request is the assertion. A disabled button that still posts
    // would satisfy the catalog and bypass a gate with nobody named for it.
    expect(advanceRequests()).toHaveLength(0);
  });

  it("will not advance on a rationale alone, without accepted responsibility", async () => {
    await openGateModal();
    writeRationale(RATIONALE);

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    expect(advanceRequests()).toHaveLength(0);
  });

  it("will not advance on accepted responsibility alone, without a rationale", async () => {
    await openGateModal();
    acceptResponsibility();

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    expect(advanceRequests()).toHaveLength(0);
  });

  it("will not advance on a rationale shorter than the stated minimum", async () => {
    await openGateModal();
    acceptResponsibility();
    writeRationale("x".repeat(MOVES_HUMAN_RATIONALE_MIN_CHARS - 1));

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    expect(advanceRequests()).toHaveLength(0);
  });

  it("will not accept whitespace padded to reach the minimum", async () => {
    await openGateModal();
    acceptResponsibility();
    // 19 visible characters, padded past 20 with spaces. Counting raw length
    // instead of normalized length would let this through, and the rendered
    // rationale would read as a one-word reason on the decision record.
    writeRationale(`ok${" ".repeat(MOVES_HUMAN_RATIONALE_MIN_CHARS)}`);

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    expect(advanceRequests()).toHaveLength(0);
  });

  it("advances only once both halves are given, and sends the rationale the human typed", async () => {
    const view = await openGateModal();
    acceptResponsibility();
    writeRationale(RATIONALE);

    expect(approveButton().disabled).toBe(false);
    fireEvent.click(approveButton());

    await waitFor(() => expect(advanceRequests()).toHaveLength(1));

    const [url, init] = advanceRequests()[0];
    expect(url).toBe(`/api/v1/programs/${view.programId}/advance`);
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body));
    expect(body.humanRationale).toBe(RATIONALE);
    expect(body.snapshot.humanRationale).toBe(RATIONALE);
    expect(body.toPhase).toBe(VIEWING_PHASE + 1);
    // The gate is being bypassed deliberately; that is exactly why the
    // rationale and the named responsibility are not optional.
    expect(body.bypassGate).toBe(true);
  });

  it("names the criteria that are not met before asking for the rationale", async () => {
    const view = await openGateModal();
    const unmet = (view.phasePanel.gateCriteria ?? []).filter((c) => !c.met);

    expect(unmet.length).toBeGreaterThan(0);
    for (const criterion of unmet) {
      expect(screen.getAllByText(criterion.criterion).length).toBeGreaterThan(0);
    }
  });
});

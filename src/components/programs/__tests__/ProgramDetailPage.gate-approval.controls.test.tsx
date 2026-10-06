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
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/programs/APX-01",
  useSearchParams: () => new URLSearchParams(),
}));

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ToastProvider } from "@/components/shell/Toast";
import { buildProgramDetailView } from "@/lib/programs/programs-detail-view";
import { buildMaestroNextActionView } from "@/lib/programs/maestro-next-action-view";
import { MOVES_HUMAN_RATIONALE_MIN_CHARS } from "@/lib/programs/moves-ai-liability";
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from "@/lib/ai-liability/human-decision-controls";
import { ProgramDetailPage } from "../ProgramDetailPage";

// The route passes a value computed once per request on the server. Keep the
// ordinary gate tests close to that production shape; a separate regression
// case below proves the optional prop is also safe when omitted.
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
  fireEvent.click(screen.getByTestId("human-approval-responsibility-checkbox"));
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
        ? {
            getReader: () => ({
              read: async () => ({ done: true, value: undefined }),
            }),
          }
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
      expect(screen.getAllByText(criterion.criterion).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("settles when the optional initial artifact list is omitted", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      const view = buildProgramDetailView("APX-01", VIEWING_PHASE);
      render(
        <ToastProvider>
          <ProgramDetailPage view={view} />
        </ToastProvider>,
      );
      await act(async () => {});

      const errors = consoleError.mock.calls.flat().join(" ");
      expect(errors).not.toContain("Maximum update depth exceeded");
      expect(screen.getByTestId("program-agent-canvas")).toBeTruthy();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("labels a UUID-backed program as a live database record", async () => {
    const view = {
      ...buildProgramDetailView("APX-01", VIEWING_PHASE),
      programId: "24fc65af-8223-4884-9241-ef5736960a1b",
    };

    render(
      <ToastProvider>
        <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
      </ToastProvider>,
    );
    await act(async () => {});

    expect(screen.getByText("Live strategic move · Live DB record")).toBeTruthy();
    expect(screen.queryByText(/Deterministic seed/)).toBeNull();
  });

  it("shows truthful upload capabilities through the rendered overlay", async () => {
    const view = buildProgramDetailView("APX-01", VIEWING_PHASE);
    render(
      <ToastProvider>
        <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
      </ToastProvider>,
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: "↑ Upload document" }));

    expect(
      screen.getByText(/Text, Markdown, CSV, and JSON are parsed immediately/),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Paste workshop notes" })).toBeTruthy();
    expect(screen.queryByText("Document parsed · 3 insights extracted")).toBeNull();
  });

  it("navigates the visible strategic-move record instead of only declaring tab keys", async () => {
    const view = buildProgramDetailView("APX-01", VIEWING_PHASE);
    render(
      <ToastProvider>
        <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
      </ToastProvider>,
    );
    await act(async () => {});

    for (const section of [
      "overview",
      "gate",
      "evidence",
      "deliverables",
      "workshop",
      "actions",
      "decisions",
    ]) {
      fireEvent.click(screen.getByTestId(`program-phase-archive-${section}`));
      expect(screen.getByTestId(`program-record-browser-${section}`)).toBeTruthy();
    }
  });

  it("renders the Maestro action composer with choices and a disabled dispatch", async () => {
    const view = buildProgramDetailView("APX-01", VIEWING_PHASE);
    render(
      <ToastProvider>
        <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
      </ToastProvider>,
    );
    await act(async () => {});

    fireEvent.click(screen.getByTestId("program-phase-archive-workshop"));
    fireEvent.click(screen.getByRole("button", { name: "Open detailed record below" }));

    expect(screen.getByTestId("maestro-next-action-composer")).toBeTruthy();
    for (const key of ["A", "B", "C", "custom"]) {
      expect(screen.getByTestId(`maestro-action-choice-${key}`)).toBeTruthy();
    }
    expect(
      (screen.getByTestId("maestro-action-submit") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByTestId("maestro-action-composer-disclaimer").textContent).toContain(
      "Deterministic seed",
    );

    const composer = buildMaestroNextActionView(view);
    expect(composer.choices.map((choice) => choice.key)).toEqual(["A", "B", "C"]);
    expect(composer.deterministicSeed).toBe(true);
    expect(composer.choices.every((choice) => choice.label && choice.detail)).toBe(true);
    expect(composer.contextLine).toContain(`P${view.viewingPhase}`);
    expect(composer.customPlaceholder).toContain(view.name);
    expect(composer.submitDisabledReason.toLowerCase()).toContain("deferred");
    expect(composer.honestDisclaimer).toContain("Deterministic seed");
  });

  it("disables Phase 0 advance until signed seed artifacts exist", async () => {
    const view = {
      ...buildProgramDetailView("APX-01", 0),
      lifecycleState: "approved" as const,
      currentPhase: 0 as const,
      viewingPhase: 0 as const,
      gateStatus: "pending" as const,
    };
    render(
      <ToastProvider>
        <ProgramDetailPage view={view} initialNexusArtifacts={NO_ARTIFACTS} />
      </ToastProvider>,
    );
    await act(async () => {});

    const advance = screen.getByRole("button", {
      name: "Complete current gate first",
    }) as HTMLButtonElement;
    expect(advance.disabled).toBe(true);
    expect(advance.title).toBe(
      "Complete and sign off the P0 seed artifacts before requesting Discovery.",
    );
  });
});

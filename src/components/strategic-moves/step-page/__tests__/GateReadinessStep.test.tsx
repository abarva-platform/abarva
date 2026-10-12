/**
 * @jest-environment jsdom
 *
 * The gate step page (template v1.3) on the governed paths: build, version-
 * bound sign-off (with the client-readiness refusal), and approve-and-submit
 * as one action that records the approver's own rationale. Checks come from
 * the evaluator; an unreadable gate is Blocked; a non-approver is offered
 * nothing they cannot do.
 */

import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import {
  GateReadinessStep,
  type GateReadinessStepProps,
} from "../GateReadinessStep";
import type { PhaseBuildArtifact } from "@/components/strategic-moves/PhaseApproveAndBuild";
import type { BuildSettledResult } from "@/components/strategic-moves/use-phase-document-build";

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe("stored P0 approval projection", () => {
  it("shows the stored approval and rationale without a new approval form or submission", () => {
    const onSubmit = jest.fn(async () => undefined);
    const { container } = render(
      <GateReadinessStep
        {...props({
          phaseNum: 0,
          phaseCode: "P0",
          phaseName: "Originate",
          routeDocumentKeys: [],
          initialArtifacts: [],
          onSubmit,
          originationApproval: {
            state: "recorded",
            moveId: "move-1",
            snapshotId: "snapshot-a",
            approvedAt: "2026-10-12T12:00:00Z",
            rationale: "Approved after reviewing the captured source.",
          },
        })}
      />,
    );
    expect(container.textContent).toContain("Phase gate approval recorded");
    expect(container.textContent).toContain(
      "Approved after reviewing the captured source.",
    );
    expect(container.textContent).not.toContain("Approval not yet recorded");
    expect(container.querySelector("textarea")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("button")).some(
        (b) => b.textContent === "Approve origination",
      ),
    ).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it.each(["unavailable", "foreign", "not-recorded"])(
    "refuses a %s readback without offering a second approval",
    (mode) => {
      const { container } = render(
        <GateReadinessStep
          {...props({
            phaseNum: 0,
            originationApproval:
              mode === "unavailable"
                ? { state: "unavailable", moveId: "move-1" }
                : mode === "not-recorded"
                  ? { state: "not_recorded", moveId: "move-1" }
                  : {
                      state: "recorded",
                      moveId: "other-move",
                      snapshotId: "snapshot-a",
                      approvedAt: null,
                      rationale: "Other source",
                    },
          })}
        />,
      );
      expect(container.textContent).toContain(
        "Wait for the stored origination approval to be read.",
      );
      expect(container.textContent).not.toContain("Other source");
      expect(container.querySelector("textarea")).toBeNull();
    },
  );
});

const KEYS = [
  "target_state_architecture",
  "process_change_estimate_brief",
  "requirements_traceability",
  "solution_design",
];

const artifact = (
  key: string,
  overrides: Partial<PhaseBuildArtifact> = {},
): PhaseBuildArtifact => ({
  artifactId: `art-${key}`,
  deliverableTypeKey: key,
  documentTitle: key,
  phase: 3,
  status: "draft",
  version: 1,
  downloadUrl: `/api/v1/artifacts/art-${key}`,
  deliverableId: `del-${key}`,
  currentVersion: 1,
  signedOffVersion: 1,
  ...overrides,
});

const signedAll = () => KEYS.map((key) => artifact(key));

function props(
  overrides: Partial<GateReadinessStepProps> = {},
): GateReadinessStepProps {
  return {
    moveId: "move-1",
    moveName: "Governed data foundation",
    archetype: "governed_data_foundation",
    clientDisplayName: "Client",
    phaseNum: 3,
    phaseCode: "P3",
    phaseName: "Design",
    nextPhaseLabel: "P4 Roadmap",
    phases: [{ code: "P3", name: "Design", status: "", current: true }],
    steps: [
      { title: "Root cause → design", depth: "full", done: true },
      { title: "Gate readiness", depth: "full" },
    ],
    stepIndex: 1,
    criteria: [
      {
        id: "solution_route_validated",
        label: "Solution route validated",
        severity: "hard",
        completed: true,
        verified: true,
      },
      {
        id: "design_approved",
        label: "Design approved",
        severity: "hard",
        completed: true,
        verified: true,
      },
      {
        id: "cxo_interview_complete",
        label: "Owners interviewed",
        severity: "soft",
        completed: false,
        verified: true,
      },
    ],
    routeDocumentKeys: KEYS,
    notBuilt: [
      {
        title: "Sourcing Strategy Brief",
        reason: "Not needed for this profile.",
      },
    ],
    initialArtifacts: signedAll(),
    signOffReadable: true,
    canApprove: true,
    approverName: "the gate approver",
    buildHeldReason: null,
    onSubmit: jest.fn(async () => undefined),
    ...overrides,
  };
}

const footer = (c: HTMLElement) => c.querySelector("footer") as HTMLElement;
const docsRow = (c: HTMLElement) => c.querySelector("#row-DOCS") as HTMLElement;
const status = (c: HTMLElement) =>
  c.querySelector('[role="status"]') as HTMLElement;

function writeRationale(
  c: HTMLElement,
  text = "Every root cause has a design element.",
) {
  fireEvent.change(c.querySelector("#gate-rationale") as HTMLTextAreaElement, {
    target: { value: text },
  });
}

describe("GateReadinessStep", () => {
  it("shows P1 charter sign-off and sponsor checks without claiming a Discovery baseline", () => {
    const p1 = props({
      phaseNum: 1,
      phaseCode: "P1",
      phaseName: "Charter",
      nextPhaseLabel: "P2 Discover",
      criteria: [
        {
          id: "charter_signed_off",
          label: "Charter signed off",
          severity: "hard",
          completed: false,
          verified: true,
        },
        {
          id: "sponsor_assigned",
          label: "Sponsor participant assigned",
          severity: "hard",
          completed: false,
          verified: true,
        },
        {
          id: "baseline_captured",
          label: "Baseline captured",
          severity: "soft",
          completed: false,
          verified: true,
        },
      ],
    });
    const { container } = render(<GateReadinessStep {...p1} />);
    expect(container.textContent).toContain("Sponsor participant assigned");
    expect(container.textContent).toContain("Charter signed off");
    expect(container.textContent).not.toContain("Baseline captured");
  });

  it("keeps P0 seed checks pending until a person approves the brief", async () => {
    const onSubmit = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => undefined,
    );
    const p0 = props({
      phaseNum: 0,
      phaseCode: "P0",
      phaseName: "Originate",
      nextPhaseLabel: "P1 Charter",
      routeDocumentKeys: [],
      initialArtifacts: [],
      criteria: [
        {
          id: "program_seed_recorded",
          label: "Origination brief signed off",
          severity: "hard",
          completed: false,
          verified: true,
        },
        {
          id: "value_hypothesis_seed",
          label: "Value hypothesis seed recorded",
          severity: "hard",
          completed: false,
          verified: true,
        },
      ],
      originationReady: true,
      onSubmit,
    });
    const { container } = render(<GateReadinessStep {...p0} />);
    expect(container.textContent).toContain(
      "The seed checks clear only after that approval.",
    );
    expect(
      within(container).getByRole("heading", {
        name: /^Needs your decision/,
      }),
    ).toBeTruthy();
    expect(container.textContent).toContain(
      "Why origination should pass the gate",
    );
    expect(container.querySelectorAll("#gate-rationale")).toHaveLength(1);
    const button = within(footer(container)).getByRole("button", {
      name: "Approve origination",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    writeRationale(container, "I approve this synthetic origination brief.");
    expect(container.querySelectorAll("#gate-rationale")).toHaveLength(1);
    expect(button.disabled).toBe(false);
    await act(async () => fireEvent.click(button));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        humanRationale: "I approve this synthetic origination brief.",
        succeededKeys: ["origination_brief"],
      }),
    );
  });

  it("captures the remaining P0 recommendation before enabling approval", () => {
    const onSave = jest.fn();
    const gate = props({
      phaseNum: 0,
      phaseCode: "P0",
      phaseName: "Originate",
      routeDocumentKeys: [],
      initialArtifacts: [],
      originationReady: false,
      originationRecommendation: { value: "", saved: false, onSave },
    });
    const mounted = render(<GateReadinessStep {...gate} />);
    expect(status(mounted.container).textContent).toContain(
      "Record the recommendation to advance",
    );
    fireEvent.change(
      within(mounted.container).getByRole("textbox", {
        name: "Why should this Move advance to Charter?",
      }),
      {
        target: { value: "The reviewed source supports a Discovery decision." },
      },
    );
    fireEvent.click(
      within(mounted.container).getByRole("button", {
        name: "Save recommendation",
      }),
    );
    expect(onSave).toHaveBeenCalledWith(
      "The reviewed source supports a Discovery decision.",
    );
    expect(
      (
        within(footer(mounted.container)).getByRole("button", {
          name: "Approve origination",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    mounted.rerender(
      <GateReadinessStep
        {...gate}
        originationReady
        originationRecommendation={{
          value: "The reviewed source supports a Discovery decision.",
          saved: true,
          onSave,
        }}
      />,
    );
    expect(
      within(mounted.container).getByText("Recommendation to advance", {
        selector: ".rc-cause",
      }),
    ).toBeTruthy();
    expect(status(mounted.container).textContent).toContain(
      "Write the approval rationale",
    );
  });

  it("does not offer P0 approval without reviewed source evidence", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          phaseNum: 0,
          phaseCode: "P0",
          phaseName: "Originate",
          routeDocumentKeys: [],
          initialArtifacts: [],
          originationReady: false,
        })}
      />,
    );
    writeRationale(container);
    expect(
      (
        within(footer(container)).getByRole("button", {
          name: "Approve origination",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("holds submission until the approver writes a rationale, then records it with the submission", async () => {
    const onSubmit = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => undefined,
    );
    const { container } = render(
      <GateReadinessStep {...props({ onSubmit })} />,
    );
    const submit = within(footer(container)).getByRole("button", {
      name: "Approve and submit Design",
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(status(container).textContent).toContain(
      "Write the approval rationale.",
    );

    writeRationale(container);
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      source: "existing_documents",
      humanRationale: "Every root cause has a design element.",
      failed: [],
    });
    expect(
      onSubmit.mock.calls[0][0].succeeded.map((s) => s.deliverableTypeKey),
    ).toEqual(KEYS);
  });

  it("shows the gate's refusal as a decision and keeps the rationale", async () => {
    const onSubmit = jest.fn(async () => {
      throw new Error("Design approved: the architecture is not signed off.");
    });
    const { container } = render(
      <GateReadinessStep {...props({ onSubmit })} />,
    );
    writeRationale(container);
    await act(async () => {
      fireEvent.click(
        within(footer(container)).getByRole("button", {
          name: "Approve and submit Design",
        }),
      );
    });
    expect(container.querySelector("#row-SUBMIT")?.textContent).toContain(
      "Design approved: the architecture is not signed off.",
    );
    expect(container.querySelector("#row-APPROVE")?.textContent).toContain(
      "Every root cause has a design element.",
    );
  });

  it("an advisory check does not hold submission; an unmet required one does", () => {
    const ready = render(<GateReadinessStep {...props()} />);
    writeRationale(ready.container);
    expect(
      (
        within(footer(ready.container)).getByRole("button", {
          name: "Approve and submit Design",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    cleanup();
    const held = render(
      <GateReadinessStep
        {...props({
          criteria: [
            {
              id: "design_approved",
              label: "Design approved",
              severity: "hard",
              completed: false,
              verified: true,
              reason: "Not signed.",
            },
          ],
        })}
      />,
    );
    writeRationale(held.container);
    expect(
      (
        within(footer(held.container)).getByRole("button", {
          name: "Approve and submit Design",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(status(held.container).textContent).toContain(
      "0 of 1 required checks met",
    );
  });

  it("not built: one ink action to build every gate document, and nothing to sign", () => {
    const { container } = render(
      <GateReadinessStep {...props({ initialArtifacts: [] })} />,
    );
    expect(
      within(docsRow(container)).getByRole("button", {
        name: "Build the 3 gate documents",
      }),
    ).toBeTruthy();
    expect(
      within(docsRow(container)).queryByRole("button", { name: "Sign off" }),
    ).toBeNull();
    expect(docsRow(container).textContent).toContain("Not built yet.");
  });

  it("holds the build with its reason", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          initialArtifacts: [],
          buildHeldReason: "Two required evidence items are still open.",
        })}
      />,
    );
    const build = within(docsRow(container)).getByRole("button", {
      name: "Build the 3 gate documents",
    }) as HTMLButtonElement;
    expect(build.disabled).toBe(true);
    expect(docsRow(container).textContent).toContain(
      "Two required evidence items are still open.",
    );
  });

  it("an unsigned version is signed off through the version-bound sign-off route with the note", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const reload = jest.fn();
    const { container } = render(
      <GateReadinessStep
        {...props({
          onRecordChanged: reload,
          initialArtifacts: [
            artifact(KEYS[0], { signedOffVersion: null }),
            ...signedAll().slice(1),
          ],
        })}
      />,
    );
    expect(docsRow(container).textContent).toContain("Built v1 · not signed");
    fireEvent.click(
      within(docsRow(container)).getByRole("button", { name: "Sign off" }),
    );
    fireEvent.change(
      container.querySelector(`#sign-note-${KEYS[0]}`) as HTMLTextAreaElement,
      { target: { value: "Reviewed with the team." } },
    );
    await act(async () => {
      fireEvent.click(
        within(docsRow(container)).getByRole("button", { name: "Sign off v1" }),
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/programs/move-1/deliverables/del-${KEYS[0]}/sign-off`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ approvalRationale: "Reviewed with the team." }),
      }),
    );
    expect(reload).toHaveBeenCalled();
  });

  it("a client-readiness refusal lists the findings inline and offers an acknowledged sign-off", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: "client_readiness_blockers",
          detail: "Findings must be acknowledged.",
          blockers: [
            {
              kind: "Placeholder",
              match: "[TBD: outcome owner]",
              why: "A placeholder would reach the client.",
            },
            {
              kind: "Unsupported claim",
              match: "eliminates all conflicts",
              why: "No evidence supports all.",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;
    const { container } = render(
      <GateReadinessStep
        {...props({
          onRecordChanged: jest.fn(),
          initialArtifacts: [
            artifact(KEYS[0], { signedOffVersion: null }),
            ...signedAll().slice(1),
          ],
        })}
      />,
    );
    fireEvent.click(
      within(docsRow(container)).getByRole("button", { name: "Sign off" }),
    );
    await act(async () => {
      fireEvent.click(
        within(docsRow(container)).getByRole("button", { name: "Sign off v1" }),
      );
    });
    expect(docsRow(container).textContent).toContain(
      "Not signed: 2 client-readiness findings in v1.",
    );
    expect(docsRow(container).textContent).toContain("“[TBD: outcome owner]”");
    await act(async () => {
      fireEvent.click(
        within(docsRow(container)).getByRole("button", {
          name: "Sign off anyway, acknowledging 2 findings",
        }),
      );
    });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      body: JSON.stringify({ acknowledgeReadinessBlockers: true }),
    });
  });

  it("a superseded signature asks to sign again", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          initialArtifacts: [
            artifact(KEYS[0], { currentVersion: 3, signedOffVersion: 2 }),
            ...signedAll().slice(1),
          ],
        })}
      />,
    );
    expect(docsRow(container).textContent).toContain(
      "Signed v2 · v3 needs signing again",
    );
  });

  it("an unread sign-off state is never shown as signed or unsigned, and offers no sign-off", () => {
    const { container } = render(
      <GateReadinessStep {...props({ signOffReadable: false })} />,
    );
    expect(docsRow(container).textContent).toContain(
      "sign-off state could not be read",
    );
    expect(
      within(docsRow(container)).queryByRole("button", { name: "Sign off" }),
    ).toBeNull();
    expect(docsRow(container).textContent).not.toContain("Signed v1");
  });

  it("rebuilding warns that every signed gate document is replaced with an unsigned version", () => {
    const { container } = render(<GateReadinessStep {...props()} />);
    // One rebuild control, for the whole set: no single document offers one.
    expect(
      within(docsRow(container)).queryAllByRole("button", {
        name: /^Rebuild…$/,
      }),
    ).toHaveLength(0);
    fireEvent.click(
      within(docsRow(container)).getByRole("button", {
        name: "Rebuild the gate documents…",
      }),
    );
    expect(docsRow(container).textContent).toContain(
      "replaces the signed Target State Reference Architecture, Process Change Estimate Brief, and Requirements Traceability Matrix with unsigned new versions",
    );
    expect(
      within(docsRow(container)).getByRole("button", {
        name: "Rebuild anyway",
      }),
    ).toBeTruthy();
  });

  it("a rebuild the server refuses leaves the signed documents signed and the gate submittable", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: "capture_incomplete",
        detail: "Finish the Design steps before building.",
      }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const onSubmit = jest.fn<Promise<void>, [BuildSettledResult]>(
      async () => undefined,
    );
    const { container } = render(
      <GateReadinessStep
        {...props({ onSubmit, onRecordChanged: jest.fn() })}
      />,
    );
    fireEvent.click(
      within(docsRow(container)).getByRole("button", {
        name: "Rebuild the gate documents…",
      }),
    );
    await act(async () => {
      fireEvent.click(
        within(docsRow(container)).getByRole("button", {
          name: "Rebuild anyway",
        }),
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/deliverables/generate-phase",
      expect.objectContaining({ method: "POST" }),
    );
    expect(docsRow(container).textContent).toContain(
      "Finish the Design steps before building.",
    );
    // Nothing was queued, so nothing on the record changed.
    expect(docsRow(container).textContent).not.toContain("Not built yet");
    expect(within(docsRow(container)).getAllByText(/Signed v1/)).toHaveLength(
      3,
    );

    writeRationale(container);
    await act(async () => {
      fireEvent.click(
        within(footer(container)).getByRole("button", {
          name: "Approve and submit Design",
        }),
      );
    });
    expect(container.querySelector("#row-SUBMIT")).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(
      onSubmit.mock.calls[0][0].succeeded.map((s) => s.deliverableTypeKey),
    ).toEqual(KEYS);
  });

  it("a failed build offers one whole-set Build again, at row level", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          initialArtifacts: [
            artifact(KEYS[0], { status: "quarantined" }),
            ...signedAll().slice(1),
          ],
        })}
      />,
    );
    expect(
      within(docsRow(container)).getAllByRole("button", {
        name: "Build again",
      }),
    ).toHaveLength(1);
  });

  it("keeps the rationale editable while the gate state cannot be read", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          criteria: [
            {
              id: "design_approved",
              label: "Design approved",
              severity: "hard",
              completed: false,
              verified: false,
            },
          ],
        })}
      />,
    );
    expect(container.textContent).toContain(
      "Documents and signatures are unchanged.",
    );
    // "Try again" closes the Blocked sentence, where the eye goes (v1.6).
    expect(
      within(status(container)).getByRole("button", { name: "Try again" }),
    ).toBeTruthy();
    writeRationale(container, "Kept while blocked.");
    expect(
      (container.querySelector("#gate-rationale") as HTMLTextAreaElement).value,
    ).toBe("Kept while blocked.");
  });

  it("a non-approver sees state only: no sign-off, no rationale input, no submit", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          canApprove: false,
          initialArtifacts: [
            artifact(KEYS[0], { signedOffVersion: null }),
            ...signedAll().slice(1),
          ],
        })}
      />,
    );
    expect(
      within(container).queryByRole("button", { name: "Sign off" }),
    ).toBeNull();
    expect(container.querySelector("#gate-rationale")).toBeNull();
    expect(
      within(footer(container)).queryByRole("button", {
        name: /Approve and submit/,
      }),
    ).toBeNull();
    expect(footer(container).textContent).toContain(
      "Only the gate approver can approve this gate.",
    );
    expect(docsRow(container).textContent).toContain("Awaiting sign-off");
    expect(container.textContent).not.toMatch(
      /Awaiting The|with The gate approver/,
    );
  });

  it("blocked: an unreadable gate shows every check as not evaluated and offers no submission", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({
          criteria: [
            {
              id: "design_approved",
              label: "Design approved",
              severity: "hard",
              completed: false,
              verified: false,
            },
          ],
        })}
      />,
    );
    expect(status(container).textContent).toContain(
      "The gate state could not be read",
    );
    expect(status(container).textContent).toContain(
      "Not evaluated · gate state could not be read",
    );
    expect(
      container.querySelector('[aria-label="not evaluated"]'),
    ).not.toBeNull();
    expect(container.querySelector('[aria-label="met"]')).toBeNull();
    expect(docsRow(container)).toBeNull();
    expect(
      (
        within(footer(container)).getByRole("button", {
          name: "Approve and submit Design",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("draws no aVa panel of its own and hands aVa's briefing to the host's dock", () => {
    const frame = jest.fn<React.ReactNode, [React.ReactNode, string]>(
      (page) => <div data-testid="dock">{page}</div>,
    );
    const { container } = render(<GateReadinessStep {...props({ frame })} />);
    expect(container.querySelector('[data-testid="dock"]')).not.toBeNull();
    expect(container.querySelector("aside")).toBeNull();
    expect(container.textContent).not.toContain("Read from your evidence");
    const briefing = frame.mock.calls[0][1];
    expect(briefing).toContain(
      "I checked every Design gate rule against this Move.",
    );
    expect(briefing).toContain("I left out Sourcing Strategy Brief");
    expect(briefing).not.toMatch(/\d/);
  });

  it("gives each gate document its purpose, drops a Details that would repeat the depth, and names what carries forward", () => {
    const { container } = render(<GateReadinessStep {...props()} />);
    expect(container.querySelector("details.context")).toBeNull();
    expect(container.textContent).toContain(
      "Carries to P4 This phase's approved answers and signed documents.",
    );
    expect(
      docsRow(container).querySelectorAll(".item-note").length,
    ).toBeGreaterThan(0);
  });

  it("introduces a role approver indefinitely in the footer", () => {
    const { container } = render(
      <GateReadinessStep
        {...props({ canApprove: false, approverIsRole: true })}
      />,
    );
    expect(footer(container).textContent).toContain(
      "Only a gate approver can approve this gate.",
    );
  });

  it("lists the documents this profile does not build, with why", () => {
    const { container } = render(<GateReadinessStep {...props()} />);
    expect(docsRow(container).textContent).toContain(
      "Not built for this profile",
    );
    expect(docsRow(container).textContent).toContain(
      "Sourcing Strategy BriefNot needed for this profile.",
    );
    expect(docsRow(container).textContent).toContain(
      "Also built · not signed at the gate",
    );
    expect(docsRow(container).textContent).toContain(
      "Solution Design Specification",
    );
  });
});

describe("a phase approval does not decide the origination request", () => {
  it("displays a pending request and submitted lifecycle beside the stored phase approval without a decision form", () => {
    const onSubmit = jest.fn(async () => undefined);
    const { container } = render(
      <GateReadinessStep
        {...props({
          phaseNum: 0,
          originationApproval: {
            state: "recorded",
            moveId: "move-1",
            snapshotId: "phase-a",
            approvedAt: null,
            rationale: "Stored rationale",
            requestLifecycle: { readable: true, status: "pending" },
            moveLifecycle: "submitted_for_approval",
          },
          onSubmit,
        })}
      />,
    );
    expect(container.textContent).toContain("Phase gate approval recorded");
    expect(container.textContent).toContain("Origination request: pending.");
    expect(container.textContent).toContain(
      "Move lifecycle: submitted for approval.",
    );
    expect(container.querySelector("textarea")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("retained capture correction in the normal P0 product page", () => {
  beforeEach(() => {
    global.fetch = jest.fn(
      async () =>
        ({ ok: true, json: async () => ({ deliverables: [] }) }) as Response,
    );
  });
  const captureCorrection = {
    state: "available" as const,
    snapshotId: "snapshot-a",
    captureRevision: "capture-a",
    sourceRevision: "a".repeat(64),
    snapshotRevision: "b".repeat(64),
    signatureRevision: "c".repeat(64),
    fields: [
      {
        key: "business_trigger",
        label: "Business trigger",
        moduleId: "module-a",
        current: "Current stored text",
        retained: "Retained reviewed text",
      },
    ],
  };
  const approval = {
    state: "recorded" as const,
    moveId: "move-1",
    snapshotId: "snapshot-a",
    approvedAt: "2026-10-12T11:00:00Z",
    rationale: "Original approval words",
    captureCorrection,
  };
  const successful = {
    ok: true,
    persisted: true,
    programId: "move-1",
    phase: 0,
    snapshotId: "snapshot-a",
    signedOffVersion: 1,
    preservedBindings: true,
    correctionAuditId: "audit-a",
    values: { business_trigger: "Retained reviewed text" },
  };
  it("reviews the exact before and retained values, then submits once without another approval", async () => {
    const onRecordChanged = jest.fn();
    const onSubmit = jest.fn();
    let resolveResponse!: (response: Response) => void;
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation((url) =>
      String(url).endsWith("/phase-capture")
        ? new Promise((resolve) => {
            resolveResponse = resolve;
          })
        : Promise.resolve({
            ok: true,
            json: async () => ({ deliverables: [] }),
          } as Response),
    );
    const ui = render(
      <GateReadinessStep
        {...props({
          routeDocumentKeys: [],
          initialArtifacts: [],
          phaseNum: 0,
          originationApproval: approval,
          onRecordChanged,
          onSubmit,
        })}
      />,
    );
    expect(ui.getByText("Current stored text")).toBeTruthy();
    expect(ui.getByText("Retained reviewed text")).toBeTruthy();
    const button = ui.getByRole("button", { name: "Restore reviewed input" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.change(ui.getByLabelText("Correction rationale"), {
      target: { value: "Restore the retained source." },
    });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    const writes = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/phase-capture"),
    );
    expect(writes).toHaveLength(1);
    expect(writes[0][0]).toBe("/api/v1/programs/move-1/phase-capture");
    const body = JSON.parse(String(writes[0][1]?.body));
    expect(body).toEqual({
      phase: 0,
      expectedRevision: "capture-a",
      restoreReviewedP0: {
        snapshotId: "snapshot-a",
        sourceRevision: "a".repeat(64),
        snapshotRevision: "b".repeat(64),
        signatureRevision: "c".repeat(64),
        rationale: "Restore the retained source.",
      },
    });
    await act(async () => {
      resolveResponse({ ok: true, json: async () => successful } as Response);
    });
    expect(onRecordChanged).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it.each(["audit", "values", "snapshot", "version", "preserved", "refusal"])(
    "keeps the gate held when correction %s proof fails",
    async (failure) => {
      const onRecordChanged = jest.fn();
      const response = { ...successful, values: { ...successful.values } };
      if (failure === "audit") response.correctionAuditId = "";
      if (failure === "values") response.values.business_trigger = "Other text";
      if (failure === "snapshot") response.snapshotId = "Other snapshot";
      if (failure === "version") response.signedOffVersion = 2;
      if (failure === "preserved") response.preservedBindings = false;
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: failure !== "refusal",
        json: async () =>
          failure === "refusal"
            ? { detail: "Reload the correction preview." }
            : response,
      } as Response);
      const ui = render(
        <GateReadinessStep
          {...props({
            routeDocumentKeys: [],
            initialArtifacts: [],
            phaseNum: 0,
            originationApproval: approval,
            onRecordChanged,
          })}
        />,
      );
      fireEvent.change(ui.getByLabelText("Correction rationale"), {
        target: { value: "Restore source." },
      });
      await act(async () => {
        fireEvent.click(
          ui.getByRole("button", { name: "Restore reviewed input" }),
        );
      });
      expect(ui.getByRole("alert").textContent).toContain(
        failure === "refusal"
          ? "Reload the correction preview."
          : "readback could not be confirmed",
      );
      expect(onRecordChanged).not.toHaveBeenCalled();
    },
  );
  it("offers no correction write to a reader without approval permission", () => {
    const ui = render(
      <GateReadinessStep
        {...props({
          routeDocumentKeys: [],
          initialArtifacts: [],
          phaseNum: 0,
          canApprove: false,
          originationApproval: approval,
        })}
      />,
    );
    expect(ui.queryByLabelText("Correction rationale")).toBeNull();
    expect(
      ui
        .getByRole("button", { name: "Restore reviewed input" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("holds continuation while the retained source cannot be verified", () => {
    const ui = render(
      <GateReadinessStep
        {...props({
          routeDocumentKeys: [],
          initialArtifacts: [],
          phaseNum: 0,
          originationApproval: {
            ...approval,
            captureCorrection: {
              state: "unavailable",
              reason: "Source unavailable.",
            },
          },
        })}
      />,
    );
    expect(
      ui
        .getByRole("button", { name: "Open P1 Charter" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("renders the existing transition workbook producer alongside a held gate build", () => {
    const ui = render(
      <GateReadinessStep
        {...props({
          buildHeldReason:
            "1 required evidence item must be covered before final build.",
          readinessWorkbookActions: (
            <button type="button">Parse existing readiness workbook</button>
          ),
        })}
      />,
    );
    expect(
      ui.getByRole("region", { name: "Transition readiness workbook" }),
    ).toBeTruthy();
    expect(
      ui.getByRole("button", { name: "Parse existing readiness workbook" }),
    ).toBeTruthy();
    expect(ui.container.textContent).toContain("Required transition evidence");
  });
});

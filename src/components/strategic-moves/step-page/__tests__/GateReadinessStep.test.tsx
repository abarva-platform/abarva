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

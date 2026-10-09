/**
 * @jest-environment jsdom
 *
 * P3 Step 1 on the design traceability record: rows are P2's settled causes in
 * the consultant's rank; each is designed here or handed off with a named
 * owner; filling from notes drafts only; the step is blocked until P2 settles
 * a cause.
 */

import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import { useState, type ReactNode } from "react";
import {
  DesignTraceabilityStep,
  type DesignTraceabilityStepProps,
} from "../DesignTraceabilityStep";
import type { StepAvaAction } from "../RootCausesStep";
import { parseDesignTraceability } from "@/lib/programs/design-traceability";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";
import { serializeDiagnosisFacts } from "@/lib/programs/diagnosis-facts";

afterEach(() => {
  cleanup();
  (global as { fetch?: unknown }).fetch = undefined;
});

const P2 = serializeRootCauseRegister({
  kind: "root_cause_register",
  version: 1,
  orderConfirmedAt: "2026-10-02",
  causes: [
    {
      id: "RC-2",
      cause: "Definitions conflict",
      short: "definitions",
      status: "accepted",
      evidence: ["Profile"],
      drives: "Measures certified",
    },
    {
      id: "RC-4",
      cause: "Identity not resolved across EHR and claims",
      short: "identity",
      status: "known_gap",
      owner: "MDM lead",
    },
  ],
});
const BASELINE = serializeDiagnosisFacts([
  {
    metric: "Measures certified",
    value: "12 of 40",
    source: "Measure register",
  },
]);

type Dock = {
  briefing: string;
  actions: StepAvaAction[];
  notesPanel: ReactNode;
};
const frameSpy = jest.fn<void, [Dock]>();
const dockNow = (): Dock =>
  frameSpy.mock.calls[frameSpy.mock.calls.length - 1][0];
let saved: string[] = [];

function Harness({
  initial = "",
  ...rest
}: Partial<DesignTraceabilityStepProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <DesignTraceabilityStep
      moveId="move-1"
      canReviewEvidence
      moveName="Governed data foundation"
      phases={[{ code: "P3", name: "Design", status: "", current: true }]}
      steps={[{ title: "Root cause → design", depth: "full" }]}
      stepIndex={0}
      value={value}
      onChange={(next) => {
        saved.push(next);
        setValue(next);
      }}
      p2RootCauses={P2}
      p2Baseline={BASELINE}
      p2StepHref="/p2"
      decidedBy="me"
      today="2026-10-09"
      frame={(page, d) => {
        frameSpy(d);
        return (
          <div>
            <div>{d.notesPanel}</div>
            {page}
          </div>
        );
      }}
      {...rest}
    />
  );
}

beforeEach(() => {
  saved = [];
  frameSpy.mockClear();
});

const last = () => parseDesignTraceability(saved[saved.length - 1])!;
const status = (c: HTMLElement) =>
  c.querySelector('[role="status"]') as HTMLElement;
const row = (c: HTMLElement, id: string) =>
  c.querySelector(`#row-${id}`) as HTMLElement;

describe("DesignTraceabilityStep", () => {
  it("shows P2's settled causes in rank, each needing a design or a hand-off", () => {
    const { container } = render(<Harness />);
    expect(status(container).textContent).toContain(
      "Design definitions (RC-2) here or hand it off and design identity (RC-4) here or hand it off.",
    );
    expect(row(container, "RC-2").textContent).toContain(
      "FactBaseline: measures certified, 12 of 40 · Measure register",
    );
    expect(row(container, "RC-2").textContent).toContain(
      "No design element yet.",
    );
  });

  it("designs a cause here and hands another off with a named owner, then is ready", () => {
    const { container } = render(<Harness />);
    fireEvent.click(
      within(row(container, "RC-2")).getByRole("button", {
        name: "Design it here",
      }),
    );
    fireEvent.change(
      container.querySelector("#de-RC-2") as HTMLTextAreaElement,
      {
        target: { value: "Certified semantic layer" },
      },
    );
    fireEvent.click(
      within(row(container, "RC-2")).getByRole("button", { name: "Accept" }),
    );
    expect(last().links[0]).toMatchObject({
      causeId: "RC-2",
      status: "accepted",
      element: "Certified semantic layer",
    });

    fireEvent.click(
      within(row(container, "RC-4")).getByRole("button", { name: "Hand off…" }),
    );
    const record = within(row(container, "RC-4")).getByRole("button", {
      name: "Record hand-off",
    }) as HTMLButtonElement;
    expect(record.disabled).toBe(true);
    fireEvent.change(container.querySelector("#hp-RC-4") as HTMLInputElement, {
      target: { value: "Master-data program" },
    });
    fireEvent.change(container.querySelector("#ho-RC-4") as HTMLInputElement, {
      target: { value: "Dana Ruiz" },
    });
    fireEvent.click(record);
    expect(last().links[1]).toMatchObject({
      causeId: "RC-4",
      status: "handed_off",
      owner: "Dana Ruiz",
    });
    expect(status(container).textContent).toContain("Ready");
  });

  it("is blocked, with a link to P2, until P2 settles a cause", () => {
    const { container } = render(<Harness p2RootCauses="" />);
    expect(status(container).textContent).toContain("Waiting on P2");
    expect(
      within(status(container))
        .getByRole("link", { name: "Open P2 Discover →" })
        .getAttribute("href"),
    ).toBe("/p2");
  });

  it("fills open causes from notes as drafts, and accepts nothing", () => {
    const { container } = render(<Harness />);
    act(() => dockNow().actions[0].onClick());
    fireEvent.change(
      container.querySelector("#dt-notes") as HTMLTextAreaElement,
      {
        target: {
          value:
            "Definitions: a certified semantic layer with versioned measures.\nIdentity matching would be owned by Dana Ruiz (master-data program).",
        },
      },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    expect(last().links).toEqual([
      expect.objectContaining({
        causeId: "RC-2",
        status: "draft",
        source: "team",
      }),
    ]);
    expect(
      (container.querySelector("#ho-RC-4") as HTMLInputElement).value,
    ).toBe("Dana Ruiz");
    expect(
      (container.querySelector("#hp-RC-4") as HTMLInputElement).value,
    ).toBe("master-data program");
    expect(row(container, "RC-2").textContent).toContain(
      "Session notes · review",
    );
    expect(status(container).textContent).not.toContain("Ready");
  });

  it("hands aVa's briefing to the dock, with no figures beyond row ids", () => {
    render(<Harness />);
    expect(dockNow().briefing).toContain(
      "RC-2, RC-4 have no design element yet.",
    );
    // Row ids and phase codes are names, not figures.
    expect(
      dockNow()
        .briefing.replace(/RC-\d+/g, "")
        .replace(/\bP\d\b/g, ""),
    ).not.toMatch(/\d/);
  });
});

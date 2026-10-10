/**
 * @jest-environment jsdom
 *
 * P2 Step 3 on the root-cause register: the order is the consultant's, a
 * cause is accepted only on approved evidence or resolved by a named owner,
 * an earlier free-text answer becomes drafts without loss, and filling from
 * notes adds drafts — never ranking, accepting, or overwriting a typed owner.
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
  RootCausesStep,
  type RootCausesStepProps,
  type StepAvaAction,
} from "../RootCausesStep";
import {
  parseRootCauseRegister,
  serializeRootCauseRegister,
  type RootCauseEntry,
} from "@/lib/programs/root-cause-register";
import { serializeDiagnosisFacts } from "@/lib/programs/diagnosis-facts";

afterEach(() => {
  cleanup();
  (global as { fetch?: unknown }).fetch = undefined;
});

const BY = "consultant@example.test";
const register = (causes: RootCauseEntry[], confirmed = false) =>
  serializeRootCauseRegister({
    kind: "root_cause_register",
    version: 1,
    causes,
    ...(confirmed
      ? { orderConfirmedAt: "2026-10-01", orderConfirmedBy: BY }
      : {}),
  });

let saved: string[] = [];
type Dock = {
  briefing: string;
  actions: StepAvaAction[];
  notesPanel: ReactNode;
};
const frameSpy = jest.fn<void, [Dock]>();
const dockNow = (): Dock =>
  frameSpy.mock.calls[frameSpy.mock.calls.length - 1][0];

function Harness({
  initial,
  ...rest
}: Partial<RootCausesStepProps> & { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <RootCausesStep
      moveId="move-1"
      canReviewEvidence
      moveName="Governed data foundation"
      clientDisplayName="Demo tenant"
      phases={[{ code: "P2", name: "Discover", status: "", current: true }]}
      steps={[
        { title: "Evidence plan", depth: "full", done: true },
        { title: "Baseline", depth: "full", done: true },
        { title: "Root causes", depth: "full" },
      ]}
      stepIndex={2}
      value={value}
      onChange={(next) => {
        saved.push(next);
        setValue(next);
      }}
      baselineValue={serializeDiagnosisFacts([
        {
          metric: "Priority measures certified",
          value: "12 of 40",
          source: "Measure register",
        },
      ])}
      approvedEvidence={[{ id: "ev-1", title: "Data quality profile" }]}
      decidedBy={BY}
      today="2026-10-02"
      frame={(page, d) => {
        frameSpy(d);
        return (
          <div>
            <div data-testid="notes">{d.notesPanel}</div>
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

const last = () => parseRootCauseRegister(saved[saved.length - 1])!;
const status = (c: HTMLElement) =>
  c.querySelector('[role="status"]') as HTMLElement;
const row = (c: HTMLElement, id: string) =>
  c.querySelector(`#row-${id}`) as HTMLElement;

describe("RootCausesStep", () => {
  it("a cause whose file is in review points to that review instead of asking for evidence", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        evidenceReviewStatus: "available",
        pendingEvidenceReviews: [
          {
            evidenceId: "ev-9",
            title: "Duplicate-match report, EHR x claims.xlsx",
            phase: 2,
            parseMethod: "xlsx",
            confidence: 0.8,
            sourceTextPreview: "",
            extraction: { summary: "3 statements about member matching." },
          },
        ],
        reviewedEvidence: [],
      }),
    })) as unknown as typeof fetch;
    const { container, findByText } = render(
      <Harness
        initial={register([
          {
            id: "RC-4",
            cause: "Identity unresolved",
            short: "identity",
            status: "no_evidence",
            evidenceInReview: "duplicate-match report",
          },
        ])}
      />,
    );
    await findByText("3 statements about member matching.");
    expect(row(container, "RC-4").textContent).toContain(
      "Evidence in review: duplicate-match report.",
    );
    expect(
      within(row(container, "RC-4"))
        .getByRole("link", { name: "Review the file" })
        .getAttribute("href"),
    ).toBe("#row-EV-1");
    expect(status(container).textContent).toContain(
      "Review the duplicate-match report extraction and confirm the order.",
    );
    expect(status(container).textContent).not.toContain("Find evidence");
  });

  it("reviews an extraction inline in the canon form and approves it through the governed route", async () => {
    const calls: Array<{ url: string; body?: unknown }> = [];
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({
          url,
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
        if (url.endsWith("/approve"))
          return { ok: true, json: async () => ({ ok: true }) };
        return {
          ok: true,
          json: async () => ({
            evidenceReviewStatus: "available",
            pendingEvidenceReviews: [
              {
                evidenceId: "ev-9",
                title: "Duplicate-match report.xlsx",
                phase: 2,
                parseMethod: "xlsx",
                confidence: 0.8,
                sourceTextPreview: "Member ids drift.",
                extraction: {
                  version: 1,
                  summary: "Member ids drift between claims and EHR.",
                  structured: {
                    decisions: [],
                    risks: [],
                    baselineCandidates: [],
                    actionItems: [],
                    observations: ["Ids drift"],
                    assumptions: [],
                    openQuestions: [],
                    citations: [
                      { quote: "Member ids drift", locator: "Sheet 1" },
                    ],
                  },
                },
              },
            ],
            reviewedEvidence: [],
          }),
        };
      },
    ) as unknown as typeof fetch;
    const { container, findByText } = render(
      <Harness
        initial={register(
          [{ id: "RC-1", cause: "A", status: "accepted", evidence: ["P"] }],
          true,
        )}
      />,
    );
    await findByText("Member ids drift between claims and EHR.");
    fireEvent.click(
      within(row(container, "EV-1")).getByRole("button", {
        name: "Review extraction",
      }),
    );
    const evRow = row(container, "EV-1");
    expect(within(evRow).getByLabelText("What the file says")).toBeTruthy();
    expect(within(evRow).getByRole("button", { name: "Reject" })).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        within(evRow).getByRole("button", { name: "Approve extraction" }),
      );
    });
    const approve = calls.find((c) =>
      c.url.endsWith("/current-state/evidence/ev-9/approve"),
    );
    expect(approve?.body).toMatchObject({
      decision: "approved",
      reviewedExtraction: expect.objectContaining({
        summary: "Member ids drift between claims and EHR.",
      }),
    });
  });

  it("an uploaded extraction awaiting review leads the step and holds it", async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        evidenceReviewStatus: "available",
        pendingEvidenceReviews: [
          {
            evidenceId: "ev-9",
            title: "Duplicate-match report",
            phase: 2,
            parseMethod: "xlsx",
            confidence: 0.8,
            sourceTextPreview: "",
            extraction: {},
          },
          { evidenceId: "ev-other", title: "Other phase", phase: 3 },
        ],
        reviewedEvidence: [{ phase: 2 }, { phase: 1 }],
      }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { container, findByText } = render(
      <Harness
        initial={register(
          [{ id: "RC-1", cause: "A", status: "accepted", evidence: ["P"] }],
          true,
        )}
      />,
    );
    await findByText("Extraction needs review.");
    expect(row(container, "EV-1").textContent).toContain(
      "Duplicate-match report",
    );
    // Another phase's upload is not this step's decision.
    expect(container.textContent).not.toContain("Other phase");
    expect(status(container).textContent).toContain(
      "Review the duplicate-match report extraction.",
    );
    expect(status(container).textContent).not.toContain("Ready");
    expect(container.textContent).toContain("1 approved file · 1 in review");
    // The upload sits at the right end of the Context line, outside the
    // summary's toggle (v1.6).
    expect(container.querySelector(".ctx-action button")?.textContent).toBe(
      "Upload evidence",
    );
    expect(
      within(container).getByRole("button", { name: "Upload evidence" }),
    ).toBeTruthy();
  });

  it("an empty step offers to add the first cause", () => {
    const { container } = render(<Harness initial="" />);
    expect(status(container).textContent).toContain(
      "Add the first root cause.",
    );
    fireEvent.click(
      within(row(container, "FIRST")).getByRole("button", {
        name: "Add a cause",
      }),
    );
    fireEvent.change(
      container.querySelector("#rc-cause") as HTMLTextAreaElement,
      {
        target: { value: "Definitions conflict across sources" },
      },
    );
    fireEvent.change(
      container.querySelector("#rc-drives") as HTMLSelectElement,
      {
        target: { value: "Priority measures certified" },
      },
    );
    fireEvent.click(within(container).getByLabelText(/Data quality profile/));
    fireEvent.click(
      within(row(container, "ADD")).getByRole("button", {
        name: "Add to the ranking",
      }),
    );
    expect(last().causes[0]).toMatchObject({
      id: "RC-1",
      status: "accepted",
      drives: "Priority measures certified",
      evidence: ["Data quality profile"],
    });
    // The number comes from the approved baseline, labelled as a FACT.
    expect(row(container, "RC-1").textContent).toContain(
      "FactBaseline: priority measures certified, 12 of 40 · Measure register",
    );
  });

  it("turns an earlier free-text answer into draft causes, losing nothing", () => {
    const { container } = render(
      <Harness initial={"No ownership\nDefinitions conflict"} />,
    );
    expect(status(container).textContent).toContain(
      "Turn your earlier answer into ranked causes.",
    );
    fireEvent.click(
      within(row(container, "EARLIER")).getByRole("button", {
        name: "Turn into ranked causes",
      }),
    );
    expect(last().causes.map((c) => [c.cause, c.status])).toEqual([
      ["No ownership", "no_evidence"],
      ["Definitions conflict", "no_evidence"],
    ]);
  });

  it("the order is the consultant's: a move clears the confirmation", () => {
    const { container } = render(
      <Harness
        initial={register(
          [
            { id: "RC-1", cause: "A", status: "accepted", evidence: ["P"] },
            { id: "RC-2", cause: "B", status: "accepted", evidence: ["P"] },
          ],
          true,
        )}
      />,
    );
    expect(status(container).textContent).toContain("Ready");
    fireEvent.click(
      within(row(container, "RC-2")).getByRole("button", { name: "Move up" }),
    );
    expect(last().causes.map((c) => c.id)).toEqual(["RC-2", "RC-1"]);
    expect(last().orderConfirmedAt).toBeUndefined();
    expect(status(container).textContent).toContain("Confirm the order.");
    fireEvent.click(
      within(container).getByRole("button", { name: "Confirm this order" }),
    );
    expect(last().orderConfirmedAt).toBe("2026-10-02");
  });

  it("a cause without evidence is resolved only with a named owner", () => {
    const { container } = render(
      <Harness
        initial={register([
          { id: "RC-4", cause: "Identity unresolved", status: "no_evidence" },
        ])}
      />,
    );
    expect(status(container).textContent).toContain(
      "Find evidence for RC-4 or name its owner",
    );
    fireEvent.click(
      within(row(container, "RC-4")).getByRole("button", {
        name: "Resolve with an owner…",
      }),
    );
    const gap = within(row(container, "RC-4")).getByRole("button", {
      name: "Carry as a known gap",
    }) as HTMLButtonElement;
    expect(gap.disabled).toBe(true);
    fireEvent.change(container.querySelector("#own-RC-4") as HTMLInputElement, {
      target: { value: "Master-data lead" },
    });
    fireEvent.click(gap);
    expect(last().causes[0]).toMatchObject({
      status: "known_gap",
      owner: "Master-data lead",
    });
  });

  it("refuses to accept a draft with no evidence, and says why", () => {
    const { container } = render(
      <Harness
        initial={register([
          { id: "RC-1", cause: "Draft", status: "draft", source: "ava" },
        ])}
      />,
    );
    expect(row(container, "RC-1").textContent).toContain("Ava draft · review");
    fireEvent.click(
      within(row(container, "RC-1")).getByRole("button", { name: "Accept" }),
    );
    expect(saved).toEqual([]);
    expect(row(container, "REFUSED").textContent).toContain(
      "accepted only on approved evidence",
    );
  });

  it("filling from notes adds a candidate at the bottom and drafts the open cause's owner", () => {
    const { container } = render(
      <Harness
        initial={register([
          {
            id: "RC-1",
            cause: "No accountable ownership",
            status: "accepted",
            evidence: ["Interviews"],
          },
          {
            id: "RC-4",
            cause: "Identity not resolved across EHR and claims",
            status: "no_evidence",
          },
        ])}
      />,
    );
    expect(dockNow().actions.map((a) => a.label)).toEqual([
      "Fill this step from my notes",
    ]);
    act(() => dockNow().actions[0].onClick());
    const notes = container.querySelector("#rc-notes") as HTMLTextAreaElement;
    fireEvent.change(notes, {
      target: {
        value:
          "If we carry identity as a gap, Dana Ruiz (master-data program) would own it.\nAnother candidate: provider reference IDs drift between claims and EHR.",
      },
    });
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    // A candidate joins at the bottom — aVa does not rank — with no evidence.
    expect(last().causes.map((c) => [c.id, c.status])).toEqual([
      ["RC-1", "accepted"],
      ["RC-4", "no_evidence"],
      ["RC-5", "no_evidence"],
    ]);
    expect(
      (container.querySelector("#own-RC-4") as HTMLInputElement).value,
    ).toBe("Dana Ruiz (master-data program)");
    expect(row(container, "RC-4").textContent).toContain("Ava draft · review");
    expect(container.textContent).toContain(
      "nothing is accepted, and I don't rank",
    );
  });

  it("filling never overwrites an owner the consultant typed", () => {
    const { container } = render(
      <Harness
        initial={register([
          { id: "RC-4", cause: "Identity unresolved", status: "no_evidence" },
        ])}
      />,
    );
    fireEvent.click(
      within(row(container, "RC-4")).getByRole("button", {
        name: "Resolve with an owner…",
      }),
    );
    fireEvent.change(container.querySelector("#own-RC-4") as HTMLInputElement, {
      target: { value: "Grace Lin" },
    });
    act(() => dockNow().actions[0].onClick());
    fireEvent.change(
      container.querySelector("#rc-notes") as HTMLTextAreaElement,
      {
        target: { value: "Dana Ruiz (master-data program) would own it." },
      },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    expect(
      (container.querySelector("#own-RC-4") as HTMLInputElement).value,
    ).toBe("Grace Lin");
    expect(container.textContent).toContain(
      "I left the owner for RC-4 alone because you had typed one.",
    );
  });

  it("hands aVa's briefing to the dock, with no figures", () => {
    render(
      <Harness
        initial={register([
          { id: "RC-4", cause: "Identity", status: "no_evidence" },
        ])}
      />,
    );
    expect(dockNow().briefing).toContain(
      "I couldn't find approved evidence for RC-4.",
    );
    expect(dockNow().briefing).toContain(
      "I haven't ranked anything. The order is yours.",
    );
    expect(dockNow().briefing.replace(/RC-\d+/g, "")).not.toMatch(/\d/);
  });

  it("sets a symptom aside and promotes it back to the bottom of the ranking", () => {
    const { container } = render(
      <Harness
        initial={register([
          { id: "RC-1", cause: "A", status: "accepted", evidence: ["P"] },
          {
            id: "S-1",
            cause: "Reports disagree",
            status: "symptom",
            symptomOf: "RC-1",
          },
        ])}
      />,
    );
    expect(container.textContent).toContain("Set aside · 1");
    fireEvent.click(
      within(row(container, "S-1")).getByRole("button", {
        name: "Promote to a cause",
      }),
    );
    expect(last().causes.map((c) => [c.id, c.status])).toEqual([
      ["RC-1", "accepted"],
      ["RC-2", "no_evidence"],
    ]);
  });
});

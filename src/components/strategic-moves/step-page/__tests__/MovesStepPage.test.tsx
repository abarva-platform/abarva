/**
 * @jest-environment jsdom
 *
 * Pins the step page template regions against the shared rules: the
 * next-action sentence and count come from `resolveStepNextAction`, rows sit
 * in their fixed groups, and each of the five states shows exactly what the
 * template says — and Continue opens only for ready, skipped and done.
 */

import { cleanup, render, within } from "@testing-library/react";
import {
  MovesStepPage,
  StepPageTabs,
  type MovesStepPageProps,
  type StepPageRow,
} from "../MovesStepPage";
import {
  resolveStepNextAction,
  type StepPageInput,
} from "@/lib/programs/step-page-model";

afterEach(cleanup);

const row = (
  overrides: Partial<StepPageRow> & Pick<StepPageRow, "id" | "rank" | "state">,
): StepPageRow => ({
  subject: `Cause ${overrides.id}`,
  shortName: `short ${overrides.id}`,
  middle: <p>proposal {overrides.id}</p>,
  ...overrides,
});

const ROWS: StepPageRow[] = [
  row({ id: "RC-1", rank: 1, state: "settled" }),
  row({
    id: "RC-3",
    rank: 3,
    state: "draft",
    draftName: "the lineage draft",
    facts: [{ kind: "fact", text: "35 of 100 elements traceable", cite: "P2 discovery report" }],
    basis: [{ kind: "pattern", text: "PAT-IND-HC-AI-XF-003" }],
  }),
  row({
    id: "RC-4",
    rank: 4,
    state: "decision",
    clause: "decide who designs identity resolution",
    actions: <button type="button">Design it here</button>,
  }),
];

function props(
  rows: StepPageRow[],
  input: Partial<StepPageInput> = {},
  extra: Partial<MovesStepPageProps> = {},
): MovesStepPageProps {
  const nextAction = resolveStepNextAction({
    depth: "full",
    rows,
    readySentence: "Every root cause has a design element. Continue to Architecture options",
    emptySentence: "Add the design session output",
    ...input,
  });
  return {
    moveName: "Governed data foundation",
    syntheticNote: "Synthetic demo data",
    phases: [
      { code: "P2", name: "Discover", status: "Done" },
      { code: "P3", name: "Design", status: "", current: true },
      { code: "P4", name: "Roadmap", status: "Not started" },
    ],
    phaseCode: "P3",
    phaseName: "Design",
    steps: [
      { title: "Root cause → design", depth: "full" },
      { title: "Architecture options", depth: "full" },
      { title: "Operating & adoption", depth: "light" },
    ],
    stepIndex: 0,
    title: "Map every root cause to a design element",
    intro: "Each P2 root cause needs one design element.",
    nextAction,
    context: {
      items: ["Full depth", "Design session 1, Oct 7"],
      details: [{ term: "Depth", detail: "Full." }],
    },
    rows,
    ava: <p>I read both files.</p>,
    ...extra,
  };
}

const status = (container: HTMLElement) =>
  container.querySelector('[role="status"]') as HTMLElement;
const continueButton = (container: HTMLElement) =>
  within(container.querySelector("footer") as HTMLElement).getByRole("button", {
    name: "Continue",
  }) as HTMLButtonElement;
const groupTitles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("h2")).map((h) => h.textContent);

describe("MovesStepPage", () => {
  it("in progress: one sentence, decisions first, the count, Continue disabled", () => {
    const { container } = render(<MovesStepPage {...props(ROWS)} />);
    expect(status(container).textContent).toContain(
      "Decide who designs identity resolution and review the lineage draft.",
    );
    expect(status(container).textContent).toContain("1 of 3 settled");
    expect(groupTitles(container)).toEqual([
      "Needs your decision · 1",
      "Drafts to review · 1",
      "Settled · 1",
    ]);
    expect(continueButton(container).disabled).toBe(true);
    expect(container.querySelector("footer")?.textContent).toContain("Step 1 of 3 · 2 still open");
  });

  it("keeps the settled group collapsed and summarised by id and short name", () => {
    const { container } = render(<MovesStepPage {...props(ROWS)} />);
    const settled = container.querySelector("details.settled") as HTMLDetailsElement;
    expect(settled.open).toBe(false);
    expect(settled.querySelector("summary")?.textContent).toContain("RC-1 short RC-1");
  });

  it("labels a number as a Fact and keeps the basis collapsed", () => {
    const { container } = render(<MovesStepPage {...props(ROWS)} />);
    const draft = container.querySelector("#row-RC-3") as HTMLElement;
    expect(draft.textContent).toContain("Fact35 of 100 elements traceable · P2 discovery report");
    expect((draft.querySelector("details.basis") as HTMLDetailsElement).open).toBe(false);
  });

  it("ready: every row settled opens Continue with the step's own sentence", () => {
    const settled = ROWS.map((r) => ({ ...r, state: "settled" as const }));
    const { container } = render(<MovesStepPage {...props(settled)} />);
    expect(status(container).textContent).toContain("Ready");
    expect(status(container).textContent).toContain("Continue to Architecture options.");
    expect(continueButton(container).disabled).toBe(false);
  });

  it("blocked: the outside cause and its link, no count, rows withheld, Continue disabled", () => {
    const { container } = render(
      <MovesStepPage
        {...props(ROWS, { blockedBy: "Waiting on P2: Discover was reopened" }, {
          blockedLink: { label: "Open P2 Discover →", href: "/p2" },
          blockedWork: "Your accepted rows are kept.",
        })}
      />,
    );
    expect(status(container).textContent).toContain("Waiting on P2: Discover was reopened. Open P2 Discover →");
    expect(status(container).textContent).not.toContain("settled");
    expect(container.querySelector("#row-RC-4")).toBeNull();
    expect(container.textContent).toContain("Your accepted rows are kept.");
    expect(continueButton(container).disabled).toBe(true);
    expect(container.querySelector("footer")?.textContent).toContain("· blocked");
  });

  it("skipped: the attestation with a named owner replaces the rows and Continue opens", () => {
    const { container } = render(
      <MovesStepPage
        {...props(ROWS, { depth: "skip" }, {
          skipped: { statement: "Nothing here needs deciding.", owner: "Named Owner", date: "Oct 8" },
        })}
      />,
    );
    expect(status(container).textContent).toContain("skipped for this use case, by attestation");
    expect(container.textContent).toContain("Attested by Named Owner, Oct 8");
    expect(container.querySelector("#row-RC-4")).toBeNull();
    expect(continueButton(container).disabled).toBe(false);
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain("· Skipped");
  });

  it("done: dated eyebrow, settled group open, the current step ticked", () => {
    const settled = ROWS.map((r) => ({ ...r, state: "settled" as const }));
    const { container } = render(
      <MovesStepPage {...props(settled, { doneAt: "2026-10-09T12:00:00Z" })} />,
    );
    expect(status(container).textContent).toContain("Done · Oct 9");
    expect((container.querySelector("details.settled") as HTMLDetailsElement).open).toBe(true);
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain("✓");
  });

  it("shows depth on the step bar only when it is not Full", () => {
    const { container } = render(<MovesStepPage {...props(ROWS)} />);
    const steps = Array.from(container.querySelectorAll("nav[aria-label='Design steps'] li")).map(
      (li) => li.textContent,
    );
    expect(steps[0]).not.toContain("·");
    expect(steps[2]).toContain("· Light");
  });

  it("closes the Work region with what the step carries forward", () => {
    const { container } = render(
      <MovesStepPage {...props(ROWS, {}, { carry: { label: "Carries to P4", text: "The chosen option." } })} />,
    );
    const work = container.querySelector(".work") as HTMLElement;
    expect(work.lastElementChild?.textContent).toBe("Carries to P4The chosen option.");
  });

  it("renders the ranking and set-aside groups in the template's order", () => {
    const rows = [
      row({ id: "S-1", rank: 9, state: "set_aside" }),
      row({ id: "RC-2", rank: 2, state: "ranked", eyebrow: "Rank 02 · RC-2" }),
      row({ id: "RC-4", rank: 4, state: "decision", clause: "find evidence for identity or name its owner" }),
      row({ id: "D", rank: 7, state: "draft" }),
      row({ id: "RC-1", rank: 1, state: "settled" }),
    ];
    const { container } = render(
      <MovesStepPage
        {...props(rows, { rankingClause: "confirm the order" }, { rankingFoot: <button type="button">Confirm this order</button> })}
      />,
    );
    expect(groupTitles(container)).toEqual([
      "Needs your decision · 1",
      "Your ranking · 1",
      "Drafts to review · 1",
      "Set aside · 1",
      "Settled · 1",
    ]);
    expect((container.querySelectorAll("details.settled")[0] as HTMLDetailsElement).open).toBe(false);
    expect(container.querySelector("#row-RC-2")?.textContent).toContain("RANK 02 · RC-2");
    expect(container.textContent).toContain("Confirm this order");
    expect(status(container).textContent).toContain(
      "Find evidence for identity or name its owner, confirm the order, and review 1 draft.",
    );
  });

  it("uses the gate's count label and, once submitted, replaces the forward button", () => {
    const settled = ROWS.map((r) => ({ ...r, state: "settled" as const }));
    const { container } = render(
      <MovesStepPage
        {...props(settled, {}, { countLabel: "6 of 6 required checks met", submittedLabel: "Submitted Oct 20" })}
      />,
    );
    expect(status(container).textContent).toContain("6 of 6 required checks met");
    expect(status(container).textContent).not.toContain("of 3 settled");
    const footer = container.querySelector("footer") as HTMLElement;
    expect(footer.textContent).toContain("Submitted Oct 20");
    expect(within(footer).queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("marks the current workspace tab", () => {
    const { container } = render(
      <StepPageTabs current="steps" hrefs={{ steps: "/s", files: "/f", record: "/r" }} />,
    );
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("Steps");
    expect(container.querySelectorAll("a")).toHaveLength(3);
  });

  it("shows the current phase's step position in the phase bar", () => {
    const { container } = render(<MovesStepPage {...props(ROWS)} />);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toContain("Step 1 of 3");
  });
});

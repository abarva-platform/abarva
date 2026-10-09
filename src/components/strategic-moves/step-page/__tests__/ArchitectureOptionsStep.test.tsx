/**
 * @jest-environment jsdom
 *
 * P3 Step 2 on the architecture choice record: the team's options as written
 * (no scores, no rank, none preselected); choosing writes the step record
 * with the rule's text-matched pre-marks as drafts; coverage asks every Step 1
 * design element except a hand-off, and a Partly needs a how; the rationale
 * is the `recommendation` answer, confirmed here; notes fill only empty
 * fields; blocked until Step 1 is settled.
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
  ArchitectureOptionsStep,
  type ArchitectureOptionsStepProps,
} from "../ArchitectureOptionsStep";
import type { StepAvaAction } from "../RootCausesStep";
import { parseArchitectureChoice } from "@/lib/programs/architecture-choice";
import { serializeDesignTraceability } from "@/lib/programs/design-traceability";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";
import type {
  P3OptionSet,
  P3SolutionOption,
} from "@/lib/programs/phase-templates/p3-option-assembler";

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
    },
    {
      id: "RC-4",
      cause: "Identity unresolved",
      short: "identity",
      status: "known_gap",
      owner: "MDM lead",
    },
    {
      id: "RC-6",
      cause: "Defects reach reports",
      short: "quality",
      status: "accepted",
      evidence: ["Profile"],
    },
  ],
});

const TRACE = serializeDesignTraceability({
  kind: "design_traceability",
  version: 1,
  links: [
    {
      causeId: "RC-2",
      cause: "Definitions conflict",
      rank: 1,
      status: "accepted",
      element: "Certified semantic layer: a governed measure register",
    },
    {
      causeId: "RC-4",
      cause: "Identity unresolved",
      rank: 2,
      status: "handed_off",
      program: "Master-data program",
      owner: "Dana Ruiz",
    },
    {
      causeId: "RC-6",
      cause: "Defects reach reports",
      rank: 3,
      status: "accepted",
      element: "Quarantine zone held until a steward releases it",
    },
  ],
});

function clientOption(
  id: string,
  name: string,
  c: { scope: string; benefit: string; tradeoff: string; condition: string },
): P3SolutionOption {
  return {
    id,
    label: name,
    summary: c.benefit,
    businessImpact: c.benefit,
    requiredBuildingBlocks: [],
    dataPlatformImplications: "",
    humanAiSplit: "",
    controls: "",
    timeToValue: "",
    effort: "",
    risks: [c.tradeoff],
    dependencies: [],
    reusePotential: "",
    readinessConditions: [c.condition],
    notRecommendedYetReasons: [],
    scores: {} as P3SolutionOption["scores"],
    totalScore: 0,
    confidence: "low",
    recommended: false,
    recommendationLabel: "Client-supplied option",
    evidenceBasis: [],
    missingEvidence: [],
    clientSupplied: c,
  };
}

const SET: P3OptionSet = {
  moveId: "move-1",
  source: "move_uploaded_options",
  sourceTitle: "Architecture options deck",
  useCasePattern: "generic_governed_ai" as P3OptionSet["useCasePattern"],
  options: [
    clientOption("OPT-A", "Configure", {
      scope: "Govern the existing warehouse: owners and access.",
      benefit: "Fastest visible progress.",
      tradeoff: "Quality untouched.",
      condition: "The warehouse licence holds.",
    }),
    clientOption("OPT-B", "Build", {
      scope: "Governed layers with a certified semantic layer.",
      benefit: "Certifies measures before any AI use.",
      tradeoff: "Identity is left to the master-data program.",
      condition: "The master-data program owns identity, in writing.",
    }),
  ],
  recommendedOptionId: null,
  recommendationConfidence: "low",
  missingEvidence: [],
  evidenceBasis: [],
  usedGlobalStaticFallback: false,
};

type Dock = {
  briefing: string;
  actions: StepAvaAction[];
  notesPanel: ReactNode;
};
const frameSpy = jest.fn<void, [Dock]>();
const dockNow = (): Dock =>
  frameSpy.mock.calls[frameSpy.mock.calls.length - 1][0];
let saved: string[] = [];
let reasons: string[] = [];

function Harness({
  initial = "",
  initialWhy = "",
  ...rest
}: Partial<ArchitectureOptionsStepProps> & {
  initial?: string;
  initialWhy?: string;
}) {
  const [value, setValue] = useState(initial);
  const [why, setWhy] = useState(initialWhy);
  return (
    <ArchitectureOptionsStep
      moveId="move-1"
      canReviewEvidence
      moveName="Governed data foundation"
      phases={[{ code: "P3", name: "Design", status: "", current: true }]}
      steps={[
        { title: "Root cause → design", depth: "full" },
        { title: "Architecture options", depth: "full" },
      ]}
      stepIndex={1}
      value={value}
      onChange={(next) => {
        saved.push(next);
        setValue(next);
      }}
      recommendation={why}
      onRecommendationChange={(next) => {
        reasons.push(next);
        setWhy(next);
      }}
      optionSet={SET}
      p2RootCauses={P2}
      designTraceability={TRACE}
      step1Href="/step1"
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
  reasons = [];
  frameSpy.mockClear();
});

const last = () => parseArchitectureChoice(saved[saved.length - 1])!;
const status = (c: HTMLElement) =>
  c.querySelector('[role="status"]') as HTMLElement;
const row = (c: HTMLElement, id: string) =>
  c.querySelector(`#row-${id}`) as HTMLElement;
const choose = (c: HTMLElement, k: string) =>
  fireEvent.click(
    within(row(c, "DIR")).getAllByRole("button", { name: `Choose ${k}` })[0],
  );
const markOf = (c: HTMLElement, short: string, label: string) =>
  within(
    within(row(c, "COV")).getByRole("radiogroup", {
      name: `Does option B answer ${short}?`,
    }),
  ).getByRole("radio", { name: label });

describe("ArchitectureOptionsStep", () => {
  it("shows the options as written, unscored and unranked, with nothing chosen", () => {
    const { container } = render(<Harness />);
    expect(status(container).textContent).toContain("Choose a direction.");
    expect(status(container).textContent).toContain("0 of 3 settled");
    const dir = row(container, "DIR");
    expect(dir.textContent).toContain(
      "As written in Architecture options deck · not scored or ranked",
    );
    expect(dir.textContent).toContain("Choose one of two options");
    expect(dir.textContent).toContain(
      "Governed layers with a certified semantic layer.",
    );
    expect(dir.textContent).toContain(
      "Identity is left to the master-data program.",
    );
    // A client option carries no estimate, score or recommendation of ours.
    expect(dir.textContent).not.toMatch(/\bscore\b|recommend|estimate|effort/i);
    expect(row(container, "COV")).toBeNull();
  });

  it("choosing writes the record with the rule's text-matched pre-marks as drafts", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    expect(last()).toMatchObject({
      optionId: "OPT-B",
      optionLabel: "Build",
      chosenBy: "me",
      coverage: [
        expect.objectContaining({
          causeId: "RC-2",
          mark: "covers",
          source: "option_text",
        }),
      ],
    });
    expect(row(container, "DIR").textContent).toContain("Chosen by you, Oct 9");
    expect(status(container).textContent).toContain("1 of 3 settled");
    // The pre-mark is the rule's, labelled as such, never credited to aVa.
    expect(row(container, "COV").textContent).toContain(
      "Named in the option · review",
    );
    expect(row(container, "COV").textContent).not.toMatch(/Ava/);
    expect(
      markOf(container, "definitions", "Covers").getAttribute("aria-checked"),
    ).toBe("true");
    expect(status(container).textContent).toContain(
      "Mark what option B answers and say why option B.",
    );
    expect(dockNow().briefing).toContain(
      "Option B’s own scope or benefit names RC-2, so that is pre-marked Covers for you to review.",
    );
  });

  it("lists a hand-off without asking it, and a Partly needs a how before coverage is accepted", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    const cov = row(container, "COV");
    expect(cov.textContent).toContain(
      "Handed to the Master-data program in Step 1",
    );
    expect(cov.textContent).toContain("Not this option’s to answer");
    expect(
      within(cov).queryByRole("radiogroup", { name: /identity/ }),
    ).toBeNull();
    const accept = within(cov).getByRole("button", {
      name: "Accept coverage",
    }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    expect(cov.textContent).toContain("1 still to mark");
    fireEvent.click(markOf(container, "quality", "Partly"));
    expect(accept.disabled).toBe(true);
    fireEvent.change(container.querySelector("#how-RC-6") as HTMLInputElement, {
      target: { value: "Release step in a Step 4 package" },
    });
    expect(accept.disabled).toBe(false);
    fireEvent.click(accept);
    expect(last().coverageAcceptedBy).toBe("me");
    expect(last().coverage.every((c) => c.source === "team")).toBe(true);
    expect(row(container, "COV").textContent).toContain(
      "How it gets answered: Release step in a Step 4 package",
    );
  });

  it("writes and confirms why as the recommendation answer, then is ready", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    fireEvent.click(markOf(container, "quality", "Covers"));
    fireEvent.click(
      within(row(container, "COV")).getByRole("button", {
        name: "Accept coverage",
      }),
    );
    fireEvent.change(
      container.querySelector("#why-text") as HTMLTextAreaElement,
      {
        target: { value: "It certifies measures before any AI use." },
      },
    );
    fireEvent.click(
      // The consultant's own words are saved, not accepted.
      within(row(container, "WHY")).getByRole("button", { name: "Save" }),
    );
    expect(reasons).toEqual(["It certifies measures before any AI use."]);
    expect(last().why).toBe("It certifies measures before any AI use.");
    expect(status(container).textContent).toContain("Ready");
  });

  it("asks to confirm a recommendation written elsewhere, and again after it changes", () => {
    const { container, rerender } = render(
      <Harness initialWhy="Build answers most of the design." />,
    );
    choose(container, "B");
    const why = row(container, "WHY");
    expect(why.textContent).toContain("Your capture answer · review");
    fireEvent.click(within(why).getByRole("button", { name: "Accept" }));
    expect(row(container, "WHY").textContent).toContain(
      "Confirmed by you, Oct 9",
    );
    rerender(
      <Harness
        key="reloaded"
        initial={saved[saved.length - 1]}
        initialWhy="Edited elsewhere."
      />,
    );
    expect(row(container, "WHY").textContent).toContain(
      "Your capture answer · review",
    );
  });

  it("says when the capture answer argues for another option, and offers only Edit", () => {
    const { container } = render(
      <Harness initialWhy="Configure is the fastest route on what is licensed." />,
    );
    choose(container, "B");
    const why = row(container, "WHY");
    expect(why.textContent).toContain(
      "Your capture answer argues for option A; you chose B.",
    );
    expect(within(why).queryByRole("button", { name: "Accept" })).toBeNull();
    expect(within(why).getByRole("button", { name: "Edit" })).toBeTruthy();
  });

  it("warns before Change discards marks or a confirmed reason", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    // Only the rule's pre-marks so far: nothing of the team's to lose.
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", { name: "Change" }),
    );
    expect(last()).toBeNull();
    choose(container, "B");
    fireEvent.click(markOf(container, "quality", "Covers"));
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", { name: "Change" }),
    );
    expect(row(container, "DIR").textContent).toContain(
      "Changing the option clears its coverage marks and the confirmation of why.",
    );
    expect(last()?.optionId).toBe("OPT-B");
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", { name: "Cancel" }),
    );
    expect(last()?.optionId).toBe("OPT-B");
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", { name: "Change" }),
    );
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", {
        name: "Change anyway",
      }),
    );
    expect(last()).toBeNull();
    expect(status(container).textContent).toContain("Choose a direction.");
  });

  it("warns before Change discards a confirmed reason, with no marks of the team's", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    fireEvent.change(
      container.querySelector("#why-text") as HTMLTextAreaElement,
      {
        target: { value: "It certifies measures first." },
      },
    );
    fireEvent.click(
      within(row(container, "WHY")).getByRole("button", { name: "Save" }),
    );
    expect(last().coverage.every((c) => c.source === "option_text")).toBe(true);
    fireEvent.click(
      within(row(container, "DIR")).getByRole("button", { name: "Change" }),
    );
    expect(last()?.optionId).toBe("OPT-B");
    expect(
      within(row(container, "DIR")).getByRole("button", {
        name: "Change anyway",
      }),
    ).toBeTruthy();
  });

  it("shows the charter's platform fit read-only under the chosen direction", () => {
    const { container } = render(
      <Harness
        platformFit={{
          pattern: "Build on the Platform",
          routing: "Proceed, standard review",
        }}
      />,
    );
    expect(container.textContent).not.toContain("Platform fit");
    choose(container, "B");
    const dir = row(container, "DIR");
    expect(dir.textContent).toContain(
      "Platform fit (from the charter): Build on the Platform · Proceed, standard review",
    );
    expect(within(dir).queryByRole("button", { name: /fit/i })).toBeNull();
  });

  it("says it is reading evidence until the read settles, and offers a retry when it fails", async () => {
    const fetchMock = jest.fn(async () => {
      throw new Error("offline");
    });
    (global as { fetch?: unknown }).fetch = fetchMock;
    const { container, findByRole } = render(<Harness />);
    expect(container.textContent).toContain("Reading evidence…");
    const retry = await findByRole("button", { name: "Try again" });
    expect(container.textContent).toContain(
      "Evidence status could not be read",
    );
    expect(container.textContent).not.toContain("Reading evidence…");
    const calls = fetchMock.mock.calls.length;
    await act(async () => {
      fireEvent.click(retry);
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls);
  });

  it("is blocked, with a link to Step 1, until every root cause there is settled", () => {
    const { container } = render(
      <Harness
        designTraceability={serializeDesignTraceability({
          kind: "design_traceability",
          version: 1,
          links: [],
        })}
      />,
    );
    expect(status(container).textContent).toContain("Waiting on Step 1");
    expect(
      within(status(container))
        .getByRole("link", { name: "Open Step 1 →" })
        .getAttribute("href"),
    ).toBe("/step1");
    expect(container.textContent).not.toMatch(/session output/i);
  });

  it("asks again when the chosen option has left the set", () => {
    const { container } = render(<Harness />);
    choose(container, "B");
    cleanup();
    const gone = render(
      <Harness
        initial={saved[saved.length - 1]}
        optionSet={{ ...SET, options: [SET.options[0]] }}
      />,
    );
    expect(row(gone.container, "DIR").textContent).toContain(
      "The option chosen earlier (Build) is no longer in the option set",
    );
    expect(status(gone.container).textContent).toContain("Choose a direction.");
  });

  it("fills only empty fields from notes, and chooses nothing", () => {
    const { container } = render(<Harness />);
    act(() => dockNow().actions[0].onClick());
    fireEvent.change(
      container.querySelector("#ao-notes") as HTMLTextAreaElement,
      {
        target: {
          value: "We back option B because it certifies measures first.",
        },
      },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    expect(saved).toEqual([]);
    expect(
      within(container).getByText(/Choose a direction first/),
    ).toBeTruthy();

    choose(container, "B");
    fireEvent.click(markOf(container, "quality", "Partly"));
    fireEvent.change(
      container.querySelector("#ao-notes") as HTMLTextAreaElement,
      {
        target: {
          value:
            "We back option B because it certifies measures first.\nThe quality release step goes to package C.",
        },
      },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    expect(reasons).toEqual([
      "We back option B because it certifies measures first.",
    ]);
    const quality = last().coverage.find((c) => c.causeId === "RC-6")!;
    expect(quality).toMatchObject({
      mark: "partly",
      how: "The quality release step goes to package C",
    });
    expect(last().coverageAcceptedAt).toBeUndefined();
    expect(last().whyConfirmedAt).toBeUndefined();
    const why = row(container, "WHY");
    expect(why.textContent).toContain("Session notes · review");
    expect(why.textContent).toContain("From your notes, line 1");
  });

  it("marks a template set's effort as a template estimate", () => {
    const template: P3OptionSet = {
      ...SET,
      source: "p3_design_inputs_pack",
      sourceTitle: undefined,
      options: SET.options.map((o) => ({
        ...o,
        clientSupplied: undefined,
        effort: "Medium effort.",
        timeToValue: "Twelve weeks.",
      })),
    };
    const { container } = render(<Harness optionSet={template} />);
    const dir = row(container, "DIR");
    expect(dir.textContent).toContain(
      "Template options: the Move declared none · not scored or ranked",
    );
    expect(dir.textContent).toContain("EffortEstimate");
    expect(dir.textContent).toContain("Medium effort.template estimate");
  });
});

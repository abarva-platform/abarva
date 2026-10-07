/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MovesCaptureFlow } from "../MovesCaptureFlow";
import type { MovesCaptureFlowPhase } from "../MovesCaptureFlow";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";
import {
  captureHandoffAccess,
  captureHandoffHeading,
} from "@/lib/programs/capture-handoff-reachability";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import {
  getPhaseStepGroups,
  phaseStepQuestionCounts,
} from "@/lib/programs/moves-phase-step-groups";
import { phaseStepPlan } from "@/lib/programs/moves-phase-step-plan";

const PHASES: MovesCaptureFlowPhase[] = [
  { phase: 0, code: "P0", name: "Originate", answered: 11, total: 11, reachable: true },
  { phase: 1, code: "P1", name: "Charter", answered: 0, total: 7, reachable: true },
  { phase: 2, code: "P2", name: "Discover", answered: 0, total: 8, reachable: false },
  { phase: 3, code: "P3", name: "Design", answered: 0, total: 7, reachable: false },
  { phase: 4, code: "P4", name: "Roadmap", answered: 0, total: 7, reachable: false },
  { phase: 5, code: "P5", name: "Mobilize", answered: 0, total: 7, reachable: false },
];

// P1 Charter sections, in the order the grouping expects.
const P1_SECTIONS: PhaseCaptureSection[] = [
  { key: "sponsor_commitment", label: "Sponsor contact and progress updates", description: "Name, role, email.", required: true },
  { key: "scope_boundary", label: "Scope boundary", description: "In and out.", required: true },
  { key: "success_criteria", label: "Success criteria", description: "Targets.", required: true },
  { key: "stakeholder_map", label: "Stakeholder map", description: "Who Discovery needs.", required: true },
  { key: "decision_rights", label: "Decision rights", description: "Who approves.", required: true },
  { key: "evidence_plan", label: "Evidence plan", description: "What to gather.", required: true },
  { key: "business_change_assessment", label: "Business change & adoption owner", description: "Expected change.", required: true, structured: "business-change" },
];

function renderFlow(overrides: Partial<React.ComponentProps<typeof MovesCaptureFlow>> = {}) {
  const onSubmitPhase = jest.fn();
  const onAdvanceToNextPhase = jest.fn();
  const onSelectPhase = jest.fn();
  render(
    <MovesCaptureFlow
      phases={PHASES}
      phase={1}
      sections={P1_SECTIONS}
      isSectionComplete={() => false}
      renderSectionInput={(section) => (
        <textarea aria-label={section.label} data-testid={`input-${section.key}`} />
      )}
      sectionRecap={(section) => (section.key === "sponsor_commitment" ? "Priya Nair" : "")}
      onSelectPhase={onSelectPhase}
      onSubmitPhase={onSubmitPhase}
      onAdvanceToNextPhase={onAdvanceToNextPhase}
      nextPhase={{ code: "P2", name: "Discover" }}
      {...overrides}
    />,
  );
  return { onSubmitPhase, onAdvanceToNextPhase, onSelectPhase };
}

describe("MovesCaptureFlow", () => {
  it("shows the six phases, with the current one marked and future ones disabled", () => {
    renderFlow();
    const phasebar = screen.getByRole("navigation", { name: "Phases" });
    const tabs = within(phasebar).getAllByRole("button");
    expect(tabs).toHaveLength(6);
    const current = within(phasebar).getByRole("button", { current: "page" });
    expect(current).toHaveTextContent("Charter");
    // P2–P5 are not reachable yet.
    expect(tabs.filter((t) => (t as HTMLButtonElement).disabled)).toHaveLength(4);
  });

  it("opens on step 1 showing that step's questions and a Continue", () => {
    renderFlow();
    expect(screen.getByRole("heading", { name: "Scope the bet" })).toBeInTheDocument();
    expect(screen.getByTestId("input-sponsor_commitment")).toBeInTheDocument();
    expect(screen.getByTestId("input-success_criteria")).toBeInTheDocument();
    // step-2 content is not on screen yet
    expect(screen.queryByTestId("input-stakeholder_map")).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeInTheDocument();
  });

  it("Continue walks the three steps; the last step submits and shows the hand-off", () => {
    const { onSubmitPhase } = renderFlow();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "People & decisions" })).toBeInTheDocument();
    expect(screen.getByTestId("input-decision_rights")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Plan the proof" })).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Submit Charter" });
    expect(submit).toBeInTheDocument();

    fireEvent.click(submit);
    expect(onSubmitPhase).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mcf-handoff")).toBeInTheDocument();
    expect(screen.getByText(/Charter is complete/)).toBeInTheDocument();
  });

  it("the hand-off recaps answers and advances to the next phase", () => {
    const { onAdvanceToNextPhase } = renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Charter" }));

    const handoff = screen.getByTestId("mcf-handoff");
    // the answered field shows its recap; an unanswered one reads "Not answered"
    expect(within(handoff).getByText("Priya Nair")).toBeInTheDocument();
    expect(within(handoff).getAllByText("Not answered").length).toBeGreaterThan(0);
    expect(within(handoff).getByText("What Discover will need")).toBeInTheDocument();

    fireEvent.click(within(handoff).getByRole("button", { name: "Begin Discover →" }));
    expect(onAdvanceToNextPhase).toHaveBeenCalledTimes(1);
  });

  it("gates Continue when requireAnswers is on and the step is incomplete", () => {
    renderFlow({ requireAnswers: true });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("lets you jump back to a completed step from the step bar, but not forward", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Continue" })); // now on step 2
    const stepbar = screen.getByRole("navigation", { name: "Steps" });
    // step 1 (done) is clickable; step 3 (upcoming) is disabled
    const step1 = within(stepbar).getByRole("button", { name: /Scope the bet/ });
    const step3 = within(stepbar).getByRole("button", { name: /Plan the proof/ });
    expect(step3).toBeDisabled();
    fireEvent.click(step1);
    expect(screen.getByRole("heading", { name: "Scope the bet" })).toBeInTheDocument();
  });

  it("renders the governed approveSlot on the final step instead of the built-in Submit", () => {
    renderFlow({
      approveSlot: <button type="button">Approve &amp; Build</button>,
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    // step 3: the host's governed approve control replaces the built-in Submit
    expect(
      screen.getByRole("button", { name: "Approve & Build" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit Charter" }),
    ).not.toBeInTheDocument();
  });

  // U-564. `it.failing` on purpose, and the assertion below is the CORRECT
  // one, not the current behaviour: the hand-off view SHOULD be reachable from
  // the last step in the configuration the product actually serves. Today it is
  // not, so this case throws and `it.failing` records that as the pinned
  // defect; the moment a remedy makes the hand-off reachable, the case starts
  // passing and `it.failing` turns the suite RED, which is what forces whoever
  // lands the remedy to promote it to a plain `it`.
  //
  // What makes the hand-off dead is a configuration no other case in this file
  // exercises. `MovesPhaseStandaloneClient` passes a non-null `approveSlot` on
  // every path that mounts this flow, and the footer spends its one forward
  // control on it: `{view === 2 && approveSlot ? <approve slot> : <primary>}`.
  // `go(3)` has exactly one caller — that primary's `onClick` — so with an
  // `approveSlot` present nothing reaches view 3. The other ways in are closed
  // too: `initialStep` is typed `0 | 1 | 2`, and the step bar only goes
  // backwards (`if (i < view) go(i)`). The two cases above that do reach the
  // hand-off pass no `approveSlot`, so they walk a footer the product never
  // renders; the case that does pass one asserts only that the slot replaces
  // the Submit, never that the hand-off survives it. No module-graph audit can
  // see this either — the hand-off's contents are imported and referenced, so
  // only the never-executed branch makes them dead.
  it.failing(
    "reaches the hand-off from the last step when the host supplies an approveSlot",
    () => {
      renderFlow({
        approveSlot: <button type="button">Approve &amp; Build</button>,
      });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      // Pin the configuration first, so a failure below cannot be a failure to
      // arrive: we are on the last step, with the host's governed slot in the
      // footer, exactly as every mounting path passes it.
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Approve & Build" }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("mcf-handoff")).not.toBeInTheDocument();

      // Press every forward affordance the last step offers, rather than one
      // button by name — the claim is about reachability, and a remedy is free
      // to label its control however it likes. "Back" is excluded because it
      // leaves the last step.
      const footer = document.querySelector(".mcf-footer");
      expect(footer).not.toBeNull();
      const forward = Array.from(
        (footer as HTMLElement).querySelectorAll("button"),
      ).filter((button) => button.textContent?.trim() !== "Back");
      expect(forward.length).toBeGreaterThan(0);
      for (const button of forward) {
        fireEvent.click(button);
        if (screen.queryByTestId("mcf-handoff")) break;
      }

      expect(screen.queryByTestId("mcf-handoff")).toBeInTheDocument();
    },
  );

  // U-564's remedy, behind `moves_capture_handoff_recap_v1`. The flag is OFF
  // for every tenant, so the `it.failing` pin above stays failing (its
  // `renderFlow` passes no `allowReviewBeforeSubmit`) and these cases carry the
  // claim that the remedy works when it is turned on.
  describe("review before submit (moves_capture_handoff_recap_v1)", () => {
    const APPROVE = <button type="button">Approve &amp; Build</button>;

    function walkToLastStep() {
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    }

    it("opens the hand-off recap from the last step without submitting", () => {
      const { onSubmitPhase } = renderFlow({
        approveSlot: APPROVE,
        allowReviewBeforeSubmit: true,
      });
      walkToLastStep();
      // the governed slot is still the step's submit control
      expect(
        screen.getByRole("button", { name: "Approve & Build" }),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Review what you captured" }),
      );

      const handoff = screen.getByTestId("mcf-handoff");
      expect(within(handoff).getByText("Priya Nair")).toBeInTheDocument();
      expect(onSubmitPhase).not.toHaveBeenCalled();
    });

    it("does not claim the phase was submitted when the recap is a review", () => {
      renderFlow({ approveSlot: APPROVE, allowReviewBeforeSubmit: true });
      walkToLastStep();
      fireEvent.click(
        screen.getByRole("button", { name: "Review what you captured" }),
      );

      const handoff = screen.getByTestId("mcf-handoff");
      // Assert over text NODES, not the container's concatenated textContent:
      // sibling spans join with no separator, so a container-wide negative
      // assertion can be satisfied by a neighbouring string.
      const claims = Array.from(handoff.querySelectorAll("span, h1, h2")).map(
        (node) => node.textContent?.trim() ?? "",
      );
      expect(claims).not.toContain("Charter submitted");
      expect(
        claims.some((text) => /Charter is complete/.test(text)),
      ).toBe(false);
      expect(
        within(handoff).getByText(/before you submit Charter/),
      ).toBeInTheDocument();
      expect(handoff.querySelector(".mcf-tick")).toBeNull();
    });

    it("carries the governed approve control onto the review, and offers no way into the next phase", () => {
      const { onAdvanceToNextPhase } = renderFlow({
        approveSlot: APPROVE,
        allowReviewBeforeSubmit: true,
      });
      walkToLastStep();
      fireEvent.click(
        screen.getByRole("button", { name: "Review what you captured" }),
      );

      const handoff = screen.getByTestId("mcf-handoff");
      expect(
        within(handoff).getByRole("button", { name: "Approve & Build" }),
      ).toBeInTheDocument();
      // Nothing is submitted, so the next phase cannot be begun from here.
      expect(
        within(handoff).queryByRole("button", { name: "Begin Discover →" }),
      ).not.toBeInTheDocument();
      expect(onAdvanceToNextPhase).not.toHaveBeenCalled();

      fireEvent.click(
        within(handoff).getByRole("button", { name: "Back to the last step" }),
      );
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
      expect(screen.queryByTestId("mcf-handoff")).not.toBeInTheDocument();
    });

    it("offers no review control when the flag is off, even with an approveSlot", () => {
      renderFlow({ approveSlot: APPROVE });
      walkToLastStep();
      expect(
        screen.queryByRole("button", { name: "Review what you captured" }),
      ).not.toBeInTheDocument();
    });

    it("offers no review control when there is no approveSlot, since Submit already reaches the recap", () => {
      // Pins the other conjunct: with the built-in Submit present a review
      // control would only duplicate a path that already works, and the
      // post-submit recap must still read as submitted.
      renderFlow({ allowReviewBeforeSubmit: true });
      walkToLastStep();
      expect(
        screen.queryByRole("button", { name: "Review what you captured" }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Submit Charter" }));
      const handoff = screen.getByTestId("mcf-handoff");
      expect(within(handoff).getByText(/Charter submitted/)).toBeInTheDocument();
      expect(
        within(handoff).getByRole("button", { name: "Begin Discover →" }),
      ).toBeInTheDocument();
    });
  });

  // ─── moves_workspace_v2 (Increment 1 of the phase-workspace shell) ───
  // Presentation only: every case pins the v2 chrome while a flag-off control
  // case pins that the legacy chrome is byte-for-byte unchanged.
  describe("moves_workspace_v2 shell", () => {
    const APPROVE = <button type="button">Approve &amp; Build</button>;

    it("renders ONE slim phase rail with a non-interactive hand-off marker", () => {
      renderFlow({ workspaceV2: true });
      const rail = screen.getByRole("navigation", { name: "Phases" });
      // Six phase pips, the current one marked, future ones disabled — the same
      // navigation contract as the legacy strip, in the slim rail.
      const pips = within(rail).getAllByRole("button");
      expect(pips).toHaveLength(6);
      expect(within(rail).getByRole("button", { current: "page" })).toHaveTextContent(
        "Charter",
      );
      expect(pips.filter((p) => (p as HTMLButtonElement).disabled)).toHaveLength(4);
      // The hand-off marker is a static label, not a button.
      expect(within(rail).getByText("→ Tower")).toBeInTheDocument();
      expect(
        within(rail).queryByRole("button", { name: /Tower/ }),
      ).not.toBeInTheDocument();
      // The legacy journey tab strip is NOT rendered.
      expect(rail.querySelector(".mcf-phasebar")).toBeNull();
    });

    it("renders the four-stage sub-step spine: CAPTURE steps, GENERATE, OUTCOME, GATE", () => {
      renderFlow({ workspaceV2: true });
      const steps = screen.getByRole("navigation", { name: "Steps" });
      const kinds = Array.from(
        steps.querySelectorAll(".mcf-v2-kind"),
      ).map((n) => n.textContent);
      // P1 has three capture step groups, then the generate/outcome/gate spine.
      expect(kinds).toEqual([
        "capture",
        "capture",
        "capture",
        "generate",
        "outcome",
        "gate",
      ]);
      // The capture stages carry the phase's real step-group titles.
      expect(within(steps).getByText("Scope the bet")).toBeInTheDocument();
      expect(within(steps).getByText("People & decisions")).toBeInTheDocument();
      expect(within(steps).getByText("Plan the proof")).toBeInTheDocument();
    });

    it("renders the gateExtras (workbook actions) on the gate step beside the approve control, not on the capture steps", () => {
      renderFlow({
        workspaceV2: true,
        approveSlot: APPROVE,
        gateExtras: <div data-testid="workbook-actions">Workbook</div>,
      });
      // Step 1 is a capture step: the workbook actions are NOT here.
      expect(screen.queryByTestId("workbook-actions")).not.toBeInTheDocument();
      // Walk to the last (gate) step, where the approve control lives.
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(
        screen.getByRole("button", { name: "Approve & Build" }),
      ).toBeInTheDocument();
      const workbook = screen.getByTestId("workbook-actions");
      expect(workbook).toBeInTheDocument();
      expect(workbook.closest(".mcf-footer")).not.toBeNull();
    });

    it("gateExtras is ignored unless workspaceV2 is on", () => {
      renderFlow({
        approveSlot: APPROVE,
        gateExtras: <div data-testid="workbook-actions">Workbook</div>,
      });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.queryByTestId("workbook-actions")).not.toBeInTheDocument();
    });

    it("keeps the capture state machine: Continue still walks the steps and submits", () => {
      const { onSubmitPhase } = renderFlow({ workspaceV2: true });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit Charter" }));
      expect(onSubmitPhase).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("mcf-handoff")).toBeInTheDocument();
      // The spine stays on screen at the recap, with OUTCOME current.
      const steps = screen.getByRole("navigation", { name: "Steps" });
      const outcome = steps.querySelector(".mcf-v2-sstep.kind-outcome");
      expect(outcome).not.toBeNull();
      expect(outcome).toHaveClass("is-current");
    });

    it("renders the OUTCOME findings surface in place of the recap, and opens the stage", () => {
      const FINDINGS = (
        <div data-testid="findings-surface">What we found this phase</div>
      );
      renderFlow({
        workspaceV2: true,
        approveSlot: APPROVE,
        outcomeFindings: FINDINGS,
      });
      // The OUTCOME stage is labelled "Findings" and is navigable even though
      // an approveSlot with no review would normally close the recap.
      const steps = screen.getByRole("navigation", { name: "Steps" });
      const outcome = steps.querySelector(
        ".mcf-v2-sstep.kind-outcome",
      ) as HTMLButtonElement;
      expect(outcome).not.toBeNull();
      expect(outcome.disabled).toBe(false);
      expect(outcome).toHaveTextContent("Findings");
      fireEvent.click(outcome);
      // The findings surface replaces the "what you captured" recap list.
      expect(screen.getByTestId("mcf-v2-outcome-findings")).toBeInTheDocument();
      expect(screen.getByTestId("findings-surface")).toBeInTheDocument();
      expect(document.querySelector(".mcf-recap")).toBeNull();
      // The governed approve control travels onto the findings screen.
      expect(
        screen.getByRole("button", { name: "Approve & Build" }),
      ).toBeInTheDocument();
    });

    it("carries gateExtras (the findings gate summary) onto the findings outcome", () => {
      renderFlow({
        workspaceV2: true,
        approveSlot: APPROVE,
        outcomeFindings: <div data-testid="findings-surface">x</div>,
        gateExtras: <div data-testid="gate-summary">2 awaiting</div>,
      });
      const outcome = screen
        .getByRole("navigation", { name: "Steps" })
        .querySelector(".mcf-v2-sstep.kind-outcome") as HTMLButtonElement;
      fireEvent.click(outcome);
      expect(screen.getByTestId("gate-summary")).toBeInTheDocument();
    });

    it("keeps the hand-off recap as the OUTCOME when no findings surface is given", () => {
      renderFlow({ workspaceV2: true });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit Charter" }));
      // No findings slot → the recap renders exactly as Increment 1.
      expect(document.querySelector(".mcf-recap")).not.toBeNull();
      expect(
        screen.queryByTestId("mcf-v2-outcome-findings"),
      ).not.toBeInTheDocument();
    });

    it("flag OFF renders the legacy journey strip and three-step bar unchanged", () => {
      renderFlow();
      const phases = screen.getByRole("navigation", { name: "Phases" });
      expect(phases).toHaveClass("mcf-phasebar");
      expect(phases).not.toHaveClass("mcf-v2-rail");
      const steps = screen.getByRole("navigation", { name: "Steps" });
      expect(steps).toHaveClass("mcf-stepbar");
      expect(steps).not.toHaveClass("mcf-v2-flow");
      expect(screen.queryByText("→ Tower")).not.toBeInTheDocument();
    });
  });

  describe("captureHandoffAccess / captureHandoffHeading", () => {
    it("calls the recap unreachable exactly in the configuration the product serves", () => {
      expect(
        captureHandoffAccess({ reviewEnabled: false, hasApproveSlot: true }),
      ).toEqual({ offerReviewBeforeSubmit: false, reachable: false });
      expect(
        captureHandoffAccess({ reviewEnabled: true, hasApproveSlot: true }),
      ).toEqual({ offerReviewBeforeSubmit: true, reachable: true });
      // No approve slot: the built-in Submit reaches it, so it is reachable and
      // no review control is owed either way.
      expect(
        captureHandoffAccess({ reviewEnabled: false, hasApproveSlot: false }),
      ).toEqual({ offerReviewBeforeSubmit: false, reachable: true });
      expect(
        captureHandoffAccess({ reviewEnabled: true, hasApproveSlot: false }),
      ).toEqual({ offerReviewBeforeSubmit: false, reachable: true });
    });

    it("withholds every completion claim until the phase is actually submitted", () => {
      const review = captureHandoffHeading({
        phaseName: "Charter",
        nextPhaseName: "Discover",
        submitted: false,
      });
      expect(review.showTick).toBe(false);
      expect(`${review.eyebrow} ${review.title}`).not.toMatch(
        /submitted\b|complete/,
      );
      expect(review.title).toMatch(/before you submit Charter/);

      const done = captureHandoffHeading({
        phaseName: "Charter",
        nextPhaseName: "Discover",
        submitted: true,
      });
      expect(done.showTick).toBe(true);
      expect(done.eyebrow).toBe("Charter submitted");
      expect(done.title).toBe(
        "Charter is complete. Here's what you captured.",
      );
    });

    it("names delivery, not a next phase, on the terminal phase", () => {
      expect(
        captureHandoffHeading({
          phaseName: "Mobilize",
          nextPhaseName: null,
          submitted: true,
        }).title,
      ).toMatch(/ready for delivery/);
      expect(
        captureHandoffHeading({
          phaseName: "Mobilize",
          nextPhaseName: null,
          submitted: false,
        }).title,
      ).toMatch(/before you submit Mobilize for delivery/);
    });
  });

  it("states a question count, and no completion tick, for a phase it cannot measure", () => {
    // `answered: null` is what `capturePhaseAnsweredCount` returns for every
    // row but the one on screen. Such a row must not read "N of M answered"
    // and must not be ticked: this screen never saw that phase's answers.
    // The live defect was a Move originated before the capture flow existed —
    // all eleven P0 questions blank — whose P0 row was ticked and read
    // "11 of 11 answered" from every screen except P0's own.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: null } : p,
    );
    renderFlow({ phase: 1, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 questions");
    expect(originate).not.toHaveTextContent("answered");
    expect(within(originate).queryByLabelText("complete")).toBeNull();
  });

  it("states a SAVED count, under that word, for an unmeasured row the host can roll up", () => {
    // `moves_capture_phase_rollup_v1`: a row this screen cannot measure may say
    // how much of the phase has been saved. It must use its own noun — a saved
    // answer is a persisted value, while "answered" additionally requires
    // structured validity, evidence readiness and a satisfied charter basis,
    // so rendering the weaker count as "answered" would relabel saved work as
    // finished work.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: null, savedAnswers: 4 } : p,
    );
    renderFlow({ phase: 1, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("4 of 11 saved");
    expect(originate).not.toHaveTextContent("answered");
  });

  it("does not tick a row whose questions are all SAVED but none measured", () => {
    // The invariant the rollup must not weaken. A fully-saved phase is still
    // unmeasured, so it claims no completion — this is the same over-claim as
    // the ticked-but-blank P0 row, arriving from the other direction.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: null, savedAnswers: 11 } : p,
    );
    renderFlow({ phase: 1, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 of 11 saved");
    expect(within(originate).queryByLabelText("complete")).toBeNull();
    expect(originate).not.toHaveTextContent("answered");
  });

  it("keeps the bare question count when no rollup is supplied", () => {
    // Flag-off behaviour: `savedAnswers` absent ⇒ the row reads exactly as it
    // did before the rollup existed.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: null } : p,
    );
    renderFlow({ phase: 1, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 questions");
    expect(originate).not.toHaveTextContent("saved");
  });

  it("prefers the live answered count over a saved one on the viewed row", () => {
    // One figure per row. A viewed row handed both must show the measured one;
    // showing two numbers for one phase is the shape of the original defect.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: 2, savedAnswers: 9 } : p,
    );
    renderFlow({ phase: 0, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("2 of 11 answered");
    expect(originate).not.toHaveTextContent("saved");
  });

  it("still ticks and counts the phase on screen", () => {
    // The vacuity guard for the case above: a measured, complete row keeps
    // both the count and the tick, so "no tick" is a property of being
    // unmeasured and not of the assertion itself.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: 11 } : p,
    );
    renderFlow({ phase: 0, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 of 11 answered");
    expect(within(originate).getByLabelText("complete")).toBeInTheDocument();
  });
});

/**
 * `U-567` — the discriminator that replaces the mount set a walk can no longer
 * read.
 *
 * Three signed-in waves recorded `3 + 2 + 2 = 7` `.mcf-question` mount points
 * across P1's steps as the structural non-regression figure for the
 * `moves_capture_v2` path. That figure is now unobtainable unattended: *Continue*
 * is gated on saved step readiness and the step bar advances only backwards
 * (`if (i < view) go(i)`), so steps 2 and 3 are unreachable without writing
 * answers — which a write-free walk does not do.
 *
 * So the figure moves here. These cases render the flow against the LIVE capture
 * contract (not the fixture above) and pin step 1's rendered mount count and
 * question order to `phaseStepQuestionCounts`, which derives the per-step counts
 * from that same contract. One reachable step now falsifies a structural change
 * to the mount set, and steps 2 and 3 are evidenced by the derivation rather
 * than by an observation nobody can make.
 */
describe("MovesCaptureFlow — contract-derived mount set (U-567)", () => {
  const contractSections = getPhaseCaptureSections(1);

  it("mounts exactly as many questions on step 1 as the capture contract derives for that step", () => {
    renderFlow({ sections: contractSections });

    const expected = phaseStepQuestionCounts(1)[0];
    expect(document.querySelectorAll(".mcf-question")).toHaveLength(expected);

    // The footer still says which of the three steps this is, so the count
    // above is anchored to step 1 and not to some other view of the flow.
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("mounts step 1's own questions, in the contract's order — not another step's and not all of them", () => {
    renderFlow({ sections: contractSections });

    const rendered = Array.from(
      document.querySelectorAll<HTMLElement>(".mcf-question .mcf-q-label"),
    ).map((node) => node.textContent);

    const expected = getPhaseStepGroups(1)[0].sectionKeys.map(
      (key) =>
        contractSections.find((section) => section.key === key)?.label ?? null,
    );

    expect(expected).not.toContain(null);
    expect(rendered).toEqual(expected);
    // Every question of the phase is NOT on screen — the flow is three steps,
    // and a change that flattened them would pass a bare count on some phases.
    expect(rendered.length).toBeLessThan(contractSections.length);
  });
});

describe("a phase whose grouping was repaired", () => {
  // P3 Design re-shapes its question set once P2 confirms a solution route.
  // This declared set matches no route variant exactly, so the step plan
  // repairs P3's DEFAULT grouping — whose second step is exactly
  // `operating_model` + `process_design`, neither of which is declared here.
  // Repair preserves the step count, so that step mounts nothing.
  const REPAIRED_P3_SECTIONS: PhaseCaptureSection[] = [
    "solution_approach",
    "business_change_boundary",
    "controls_governance",
    "architecture_integration",
    "evidence_confidence",
    "recommendation",
    "estimate_assumptions",
  ].map((key) => ({ key, label: key, description: "", required: true }));

  const P3_PHASES: MovesCaptureFlowPhase[] = [
    { phase: 3, code: "P3", name: "Design", answered: 7, total: 7, reachable: true },
  ];

  function renderRepairedP3(isSectionComplete: () => boolean) {
    render(
      <MovesCaptureFlow
        phases={P3_PHASES}
        phase={3}
        sections={REPAIRED_P3_SECTIONS}
        isSectionComplete={isSectionComplete}
        renderSectionInput={(section) => (
          <textarea aria-label={section.label} data-testid={`input-${section.key}`} />
        )}
        sectionRecap={() => ""}
        onSelectPhase={() => {}}
        onSubmitPhase={() => {}}
        onAdvanceToNextPhase={() => {}}
        approveSlot={<button type="button">Approve and build</button>}
      />,
    );
  }

  it("confirms the grouping really does leave a step with no questions", () => {
    const plan = phaseStepPlan(3, REPAIRED_P3_SECTIONS);
    expect(plan.basis).toBe("repaired");
    expect(plan.groups[1].sectionKeys).toEqual([]);
  });

  it("opens a fully answered phase on its last step, where the governed approval lives", () => {
    renderRepairedP3(() => true);

    const plan = phaseStepPlan(3, REPAIRED_P3_SECTIONS);
    const last = plan.groups[plan.groups.length - 1];
    expect(screen.getByRole("heading", { name: last.title })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approve and build" }),
    ).toBeInTheDocument();
    // Not the empty step, which is what it used to open on: a blank panel with
    // no question on it and the approval one unexplained Continue away.
    expect(
      screen.queryByRole("heading", { name: plan.groups[1].title }),
    ).not.toBeInTheDocument();
  });

  it("still opens on the first step that has an unanswered question", () => {
    renderRepairedP3(() => false);

    const plan = phaseStepPlan(3, REPAIRED_P3_SECTIONS);
    expect(
      screen.getByRole("heading", { name: plan.groups[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("input-solution_approach")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve and build" }),
    ).not.toBeInTheDocument();
  });
});

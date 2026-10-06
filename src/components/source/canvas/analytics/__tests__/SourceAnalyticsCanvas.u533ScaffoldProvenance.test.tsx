/**
 * @jest-environment jsdom
 */

// Item U-533 — the render-path half of the known positive.
//
// `buildLiveStageView` carries the stage exemplar's `tasks` and `gate` through
// verbatim, and `/source/events/[eventId]` passes that view straight to
// `SourceAnalyticsCanvas` as `stageView`. This suite drives THAT seam: the view
// is built by the real builder, not hand-written, and rendered through the shell
// the route mounts, inside the same `MaestroChrome` the `(maestro)` layout wraps
// it in — so the assertion is about what a reader sees, not about what a source
// file says.
//
// It asserted the BEFORE state on purpose, and UPDATED BY U-534 it now asserts
// both sides of the boundary. Its approver case named `bafo` by hand, `bafo` is
// the stage U-534 flipped, and the case went red exactly as intended. It is not
// deleted and not relaxed: the stage is now FOUND by searching for one that still
// carries, and a new case asserts the flipped stage renders its DERIVED titles and
// none of the exemplar's.
//
// NOT A SIGNED-IN ACCEPTANCE. Clerk is mocked to a signed-in user because the
// chrome renders its nav only for one; this is a render, and U-533's acceptance
// (5) says so explicitly.

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      id: "user_1",
      fullName: "Signed In Operator",
      primaryEmailAddress: { emailAddress: "operator@example.com" },
      emailAddresses: [{ emailAddress: "operator@example.com" }],
      publicMetadata: { role: "maestro" },
    },
  }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { MaestroChrome } from "@/components/chrome/MaestroChrome";
import {
  buildLiveStageView,
  liveStageScaffoldFor,
  liveStageScaffoldSourceFor,
} from "@/lib/source/facts/view/stage-analytics-builder";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { FactSourceCitation } from "@/lib/source/facts/fact-types";
import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import type { StageAnalyticsView } from "../view-model";

const ARCHETYPE_ID = "AMS_MANAGED_SERVICES";

/** Enough committed facts for one AMS lever to quantify, so the builder answers. */
const LIVE_INPUTS = {
  annual_change_order_spend: 1_000_000,
  recurring_avoidable_pct: 20,
  term_years: 3,
};

const LIVE_CITATIONS: Record<string, FactSourceCitation | null> = {
  annual_change_order_spend: { doc: "Incumbent AMS contract", locator: "Exhibit C" },
  recurring_avoidable_pct: { doc: "ServiceNow export", locator: "recurring share" },
  term_years: { doc: "Vendor proposal", locator: "term" },
};

function buildStageView(stageKey: string): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs: LIVE_INPUTS,
    citations: LIVE_CITATIONS,
    archetypeId: ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
  });
  if (!view) throw new Error(`no live view for stage ${stageKey}`);
  return view;
}

function makeEvent(stageKey: string, label: string): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "EVT-AMS-2026",
    name: "Managed services renewal",
    accountName: "Example Holdings",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: stageKey,
    currentStageLabel: label,
    openAlerts: 0,
    owner: "Operator",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm the scope boundary",
    isAtRisk: false,
    valueAtStakeUsd: 14_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve the gate",
  } as SourcingEventSummary;
}

/** Mount the shell the way the `(maestro)` layout mounts it. */
function renderStage(stageKey: string, label: string) {
  return render(
    <MaestroChrome>
      <SourceAnalyticsCanvas
        event={makeEvent(stageKey, label)}
        viewStage={stageKey as never}
        tenantName="Example Holdings"
        stageView={buildStageView(stageKey)}
      />
    </MaestroChrome>,
  );
}

const ARMED_STAGE_KEYS = [
  "scope",
  "rfp",
  "responses",
  "evaluation",
  "pricing",
  "bafo",
  "executive_decision",
  "selection",
  "transition",
  "value",
] as const;

/** A person's name rather than a role label, as U-533 learned to detect one. */
const PERSON_NAME_APPROVER = /^[A-Z]\.\s\S/;

/** The stages whose built view still carries both intake beats from an exemplar. */
const CARRIED_STAGE_KEYS = ARMED_STAGE_KEYS.filter(
  (stageKey) => buildStageView(stageKey).beatProvenance?.tasks === "scaffold",
);

const DERIVED_STAGE_KEYS = ARMED_STAGE_KEYS.filter(
  (stageKey) => buildStageView(stageKey).beatProvenance?.tasks === "fact_derived",
);

/** Every armed stage whose EXEMPLAR approver reads as a person. Four of ten. */
const NAMED_APPROVER_STAGES = ARMED_STAGE_KEYS.filter((stageKey) =>
  PERSON_NAME_APPROVER.test(liveStageScaffoldFor(stageKey).gate.approver),
);

/**
 * A stage that STILL carries its beats AND has an approver reading as a person's
 * name.
 *
 * ITEM U-545, and the change here is the point rather than an aside. This was a
 * `.find(...)!` over the carried set, and its one remaining member was `value`.
 * Deriving that stage's beats emptied the intersection, so the `!` would have
 * handed `undefined` to `liveStageScaffoldFor`, which resolves through its default
 * arm to Scope — a case still named after a conjunction it no longer measures.
 *
 * So the intersection is searched and allowed to be empty, its emptiness is
 * asserted in its own right, and the two properties it bundled are asserted over
 * their own non-empty populations below. A future stage landing
 * carried-and-person-named fails that emptiness assertion, which is the signal to
 * reinstate the conjunction rather than inherit silence.
 */
const CARRIED_NAMED_APPROVER_STAGES = CARRIED_STAGE_KEYS.filter((stageKey) =>
  PERSON_NAME_APPROVER.test(liveStageScaffoldFor(stageKey).gate.approver),
);

const SCOPE_EXEMPLAR_TASK_TITLES = liveStageScaffoldFor("scope").tasks.map(
  (task) => task.title,
);

describe("U-533 · exemplar task content reaches the rendered canvas", () => {
  it("renders task titles that exist only in the exemplar", () => {
    // Population before property: an exemplar with no tasks would make the
    // assertion below pass over an empty set.
    expect(SCOPE_EXEMPLAR_TASK_TITLES.length).toBeGreaterThan(0);

    renderStage("scope", "Scope");

    // Every carried title is on the page. Read off the exemplar rather than
    // typed, so re-spelling the exemplar cannot leave this green against a
    // string the builder no longer emits.
    for (const title of SCOPE_EXEMPLAR_TASK_TITLES) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
  });
});

describe("U-533 · the exemplar approver does NOT reach this reader", () => {
  it("passes only the Event Owner role in the live terminal canvas view", () => {
    const view = buildStageView("value");
    expect(liveStageScaffoldFor("value").gate.approver).toMatch(PERSON_NAME_APPROVER);
    expect(view.gate.approver).toBe("Event Owner");
    expect(view.gate.approver).not.toBe(liveStageScaffoldFor("value").gate.approver);
    renderStage("value", "Value");
    expect(screen.queryByText(liveStageScaffoldFor("value").gate.approver)).toBeNull();
  });
  /**
   * MEASURED, and it corrects what this suite first assumed.
   *
   * Four of the ten exemplars carry an approver who reads as a person, and the
   * first draft here asserted that name onto the page. It is not there: the only
   * component that renders `gate.approver` is `ScopeGate`, whose sole mounter
   * `ScopeAnalyticsStage` is imported by no route — only by tests. So the carried
   * approver reaches the MODEL'S PROMPT (asserted in
   * `src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts`) and reaches
   * no reader. That asymmetry is worth pinning: the render path and the grounding
   * path leak DIFFERENT carried fields, and a fix aimed at one does not close the
   * other.
   *
   * The negative is not vacuous. The case first proves the carried view is in
   * play by finding this stage's exemplar task titles on the page; only then does
   * it assert the approver's absence.
   */
  it("has no carried stage left whose exemplar approver reads as a person", () => {
    // Population before property, so the emptiness is a measurement rather than
    // an artefact of either set being empty: there really are person-named
    // exemplars, and there really are stages still carrying.
    expect(NAMED_APPROVER_STAGES.length).toBeGreaterThan(0);
    expect(CARRIED_STAGE_KEYS.length).toBeGreaterThan(0);
    expect(CARRIED_NAMED_APPROVER_STAGES).toEqual([]);
  });

  it("renders the carried task titles on every carried stage", () => {
    // The first half of the retired conjunction, over its own population: a
    // carried stage's exemplar beats really do reach this reader.
    for (const stageKey of CARRIED_STAGE_KEYS) {
      const exemplarTaskTitles = liveStageScaffoldFor(stageKey).tasks.map(
        (task) => task.title,
      );
      expect(exemplarTaskTitles.length).toBeGreaterThan(0);
      expect(liveStageScaffoldSourceFor(stageKey)).toMatch(
        /^SAMPLE_[A-Z_]+_STAGE$/,
      );
      expect(buildStageView(stageKey).beatProvenance).toEqual({
        tasks: "scaffold",
        gate: "scaffold",
        scaffoldSource: liveStageScaffoldSourceFor(stageKey),
      });

      cleanup();
      renderStage(stageKey, stageKey);
      for (const title of exemplarTaskTitles) {
        expect(screen.getAllByText(title).length).toBeGreaterThan(0);
      }
    }
  });

  it("renders no exemplar person's name, on any armed stage", () => {
    // The second half, and widened from one sampled stage to the whole armed set:
    // "the carried approver does not reach this reader" is a claim about every
    // stage, and the four person-named exemplars are all now derived.
    expect(NAMED_APPROVER_STAGES.length).toBeGreaterThan(0);
    for (const stageKey of NAMED_APPROVER_STAGES) {
      const named = liveStageScaffoldFor(stageKey).gate.approver;
      expect(named).toMatch(PERSON_NAME_APPROVER);
      const view = buildStageView(stageKey);
      // Population: this render really did receive a view with content on it.
      expect(view.tasks.length).toBeGreaterThan(0);
      cleanup();
      renderStage(stageKey, view.stageName);
      expect(screen.getAllByText(view.tasks[0]!.title).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(new RegExp(named))).toHaveLength(0);
    }
  });
});

describe("U-533 · the view the canvas receives declares its carried beats", () => {
  it("carries the boundary declaration through to the rendered stage view", () => {
    const view = buildStageView("scope");
    expect(view.beatProvenance).toEqual({
      tasks: "scaffold",
      gate: "scaffold",
      scaffoldSource: "SAMPLE_SCOPE_STAGE",
    });
    // The canvas must still render with the extra field present — an additive
    // boundary declaration that broke the shell would be a worse trade.
    renderStage("scope", "Scope");
    expect(screen.getAllByText(SCOPE_EXEMPLAR_TASK_TITLES[0]!).length).toBeGreaterThan(
      0,
    );
  });
});

describe("U-534/U-535/U-538/U-540/U-542 · a flipped stage renders derived content, not the exemplar's", () => {
  it("has five flipped stages and five that still carry", () => {
    // Population before property. A search that found nothing would make every
    // case below pass over an empty set.
    //
    // Item U-542 flipped `selection`. `buildStageView` here passes NO tenant
    // signal, so that stage renders its UN-OBSERVED beat -- which is the state a
    // canvas with no award fact should show, and is still derived rather than the
    // exemplar, so the cases below hold over it unchanged.
    expect(DERIVED_STAGE_KEYS).toHaveLength(6);
    expect(CARRIED_STAGE_KEYS).toHaveLength(4);
  });

  it.each(DERIVED_STAGE_KEYS)(
    "%s renders no exemplar task title, and does render its own",
    (stageKey) => {
      // Item U-535 made this `it.each`. It read `DERIVED_STAGE_KEYS[0]` and
      // rendered under a hard-coded "BAFO" label, so a second flipped stage was
      // simply not checked — and which stage index 0 names depends on the armed
      // order, which is not something this suite should be sensitive to.
      const view = buildStageView(stageKey);
      const exemplarTitles = liveStageScaffoldFor(stageKey).tasks.map(
        (task) => task.title,
      );
      // Population: the exemplar this stage used to carry really had titles, so
      // the negative below is about a replacement and not about an empty fixture.
      expect(exemplarTitles.length).toBeGreaterThan(0);
      expect(view.tasks.length).toBeGreaterThan(0);

      renderStage(stageKey, view.stageName);

      // What replaced them is on the page — read off the built view, so a change
      // to the derivation cannot leave this green against a string it no longer
      // emits.
      for (const title of view.tasks.map((task) => task.title)) {
        expect(screen.getAllByText(title).length).toBeGreaterThan(0);
      }
      // And the exemplar's own titles are not.
      for (const title of exemplarTitles) {
        expect(screen.queryAllByText(title)).toHaveLength(0);
      }
    },
  );

  /**
   * Item U-535. The derived gate's `generates` list does NOT reach this reader,
   * and the cases that would have asserted it here were MOVED rather than
   * dropped — to `ScopeGate.u535EmptyGenerates.test.tsx`, which mounts that
   * component directly and says why.
   *
   * The item's acceptance (7) warns that "an empty generates section is a visible
   * regression". On today's render path it is not visible at all: the only
   * component that draws the section is `ScopeGate`, whose sole mounter
   * `ScopeAnalyticsStage` is imported by the barrel and by tests and by no route
   * — the same asymmetry the approver case above pins, and the reason
   * `carriedFieldReach` records `gate.generates` as reaching `model_prompt`
   * alone. Two cases written here first FAILED for exactly that reason, which is
   * how the premise got checked instead of inherited.
   */
  it("does not render this stage's gate deliverables at all, on either branch", () => {
    // The negative that keeps the note above honest. It is asserted over BOTH
    // derived stages — the one whose derived list is empty and the one whose is
    // not — so it cannot be satisfied by the emptiness rather than by the reach.
    const withItems = DERIVED_STAGE_KEYS.filter(
      (stageKey) => buildStageView(stageKey).gate.generates.length > 0,
    );
    const withoutItems = DERIVED_STAGE_KEYS.filter(
      (stageKey) => buildStageView(stageKey).gate.generates.length === 0,
    );
    // Population: both branches exist among the flipped stages.
    expect(withItems.length).toBeGreaterThan(0);
    expect(withoutItems.length).toBeGreaterThan(0);

    for (const stageKey of withItems) {
      const view = buildStageView(stageKey);
      renderStage(stageKey, view.stageName);
      // Population within the case: this render really did receive the view, so
      // the negative below is about reach and not about an empty render.
      expect(screen.getAllByText(view.tasks[0]!.title).length).toBeGreaterThan(0);
      for (const deliverable of view.gate.generates) {
        expect(screen.queryAllByText(deliverable.label)).toHaveLength(0);
      }
    }
  });

  it("still names the exemplar for every stage that carries", () => {
    for (const stageKey of CARRIED_STAGE_KEYS) {
      expect(buildStageView(stageKey).beatProvenance?.scaffoldSource).toBe(
        liveStageScaffoldSourceFor(stageKey),
      );
    }
  });
});

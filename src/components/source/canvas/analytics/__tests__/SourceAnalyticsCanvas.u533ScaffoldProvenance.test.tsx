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
import { render, screen } from "@testing-library/react";

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

/**
 * A stage that STILL carries an approver reading as a person's name.
 *
 * Searched, not named. This constant was the literal `"bafo"` and went red when
 * `bafo` became the first derived stage — which is the right failure, but a
 * literal makes the next flip a breakage instead of a move. Four exemplars carry a
 * personal name and three of them still reach this path.
 */
const NAMED_APPROVER_STAGE = CARRIED_STAGE_KEYS.find((stageKey) =>
  PERSON_NAME_APPROVER.test(liveStageScaffoldFor(stageKey).gate.approver),
)!;
const NAMED_APPROVER = liveStageScaffoldFor(NAMED_APPROVER_STAGE).gate.approver;

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
  it("renders the carried task titles but not the carried approver", () => {
    expect(NAMED_APPROVER).toMatch(PERSON_NAME_APPROVER);
    // The exemplar this searched stage resolves to, asserted by identity against
    // the switch rather than against a literal name: the literal was
    // "SAMPLE_BAFO_STAGE" and it pinned this case to the one stage that later
    // stopped carrying.
    expect(liveStageScaffoldSourceFor(NAMED_APPROVER_STAGE)).toMatch(
      /^SAMPLE_[A-Z_]+_STAGE$/,
    );
    expect(buildStageView(NAMED_APPROVER_STAGE).beatProvenance).toEqual({
      tasks: "scaffold",
      gate: "scaffold",
      scaffoldSource: liveStageScaffoldSourceFor(NAMED_APPROVER_STAGE),
    });

    const exemplarTaskTitles = liveStageScaffoldFor(
      NAMED_APPROVER_STAGE,
    ).tasks.map((task) => task.title);
    expect(exemplarTaskTitles.length).toBeGreaterThan(0);

    renderStage(NAMED_APPROVER_STAGE, NAMED_APPROVER_STAGE);

    // Population: the carried beats really did reach this render.
    for (const title of exemplarTaskTitles) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }

    // And the carried approver did not.
    expect(screen.queryAllByText(new RegExp(NAMED_APPROVER))).toHaveLength(0);
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

describe("U-534 · the flipped stage renders derived content, not the exemplar's", () => {
  it("has exactly one flipped stage and nine that still carry", () => {
    // Population before property. A search that found nothing would make both
    // cases below pass over an empty set.
    expect(DERIVED_STAGE_KEYS).toHaveLength(1);
    expect(CARRIED_STAGE_KEYS).toHaveLength(9);
    expect(NAMED_APPROVER_STAGE).toBeDefined();
  });

  it("renders no exemplar task title on the flipped stage, and does render its own", () => {
    const stageKey = DERIVED_STAGE_KEYS[0]!;
    const view = buildStageView(stageKey);
    const exemplarTitles = liveStageScaffoldFor(stageKey).tasks.map(
      (task) => task.title,
    );
    // Population: the exemplar this stage used to carry really had titles, so the
    // negative below is about a replacement and not about an empty fixture.
    expect(exemplarTitles.length).toBeGreaterThan(0);
    expect(view.tasks.length).toBeGreaterThan(0);

    renderStage(stageKey, "BAFO");

    // What replaced them is on the page — read off the built view, so a change to
    // the derivation cannot leave this green against a string it no longer emits.
    for (const title of view.tasks.map((task) => task.title)) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    // And the exemplar's own titles are not.
    for (const title of exemplarTitles) {
      expect(screen.queryAllByText(title)).toHaveLength(0);
    }
  });

  it("still names the exemplar for the nine that carry", () => {
    for (const stageKey of CARRIED_STAGE_KEYS) {
      expect(buildStageView(stageKey).beatProvenance?.scaffoldSource).toBe(
        liveStageScaffoldSourceFor(stageKey),
      );
    }
  });
});

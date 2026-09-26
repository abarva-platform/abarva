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
// It asserts the BEFORE state on purpose. An exemplar task title and an exemplar
// approver's name reach the rendered page today, so the slice that replaces one
// stage's tasks/gate with fact-derived values has a real known positive to go red
// against rather than a fixture written to make a point.
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

/** The `bafo` exemplar is one of the four whose approver is a person's name. */
const NAMED_APPROVER_STAGE = "bafo";
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
    expect(NAMED_APPROVER).toMatch(/^[A-Z]\.\s\S/);
    expect(liveStageScaffoldSourceFor(NAMED_APPROVER_STAGE)).toBe(
      "SAMPLE_BAFO_STAGE",
    );

    const exemplarTaskTitles = liveStageScaffoldFor(
      NAMED_APPROVER_STAGE,
    ).tasks.map((task) => task.title);
    expect(exemplarTaskTitles.length).toBeGreaterThan(0);

    renderStage(NAMED_APPROVER_STAGE, "BAFO");

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

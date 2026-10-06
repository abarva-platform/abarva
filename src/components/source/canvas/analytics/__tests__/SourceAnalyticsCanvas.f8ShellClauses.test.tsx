/**
 * @jest-environment jsdom
 */

// U-529 — SOURCE_BACKLOG_MASTER §F8 requires the Source event shell to carry a
// header, a phase rail, ONE next action and SPECIFIC blockers, with NO second
// navbar. None of those four clauses had an assertion anywhere in the repo.
//
// The item filed `src/components/source/canvas/EventWorkspace.tsx` as the shell.
// It is not: on the commit this suite was written against, that component has
// zero importers outside its own file, neither route the item names mounts it,
// and its own doc comment calls it the right-pane tab strip. The shell the
// `/source/events/[eventId]` route actually mounts is `SourceAnalyticsCanvas`,
// so these cases drive that, inside the same `MaestroChrome` its `(maestro)`
// layout wraps it in — otherwise the navbar clause has nothing to count.
//
// Every case asserts the POPULATION before the property, so a shell that
// renders none of the thing under test fails instead of passing vacuously.

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

// Signed-in, because MaestroChrome's NexusTopNav renders its `<nav>` only for a
// signed-in user. A signed-out mock would make the navbar clause count zero
// landmarks and "no second navbar" would pass for the wrong reason.
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
import { SOURCE_JOURNEYS } from "@/lib/source/sourcing-motion-journeys";
import type { SourcingEventSummary } from "@/lib/source/types";
import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_SCOPE_AVA,
} from "../sample-view-model";
import type { StageAnalyticsView } from "../view-model";

const RAIL = "source-shell-v2-rail";
const CHECKPOINT = "source-reader-journey-checkpoint";
const APPROVAL_BLOCKER = "source-stage-ready-approval-blocker";

/**
 * The four labels `buildStageOperatingStatus` can put on the stage next-action
 * chip. Named here so "exactly one next action" is counted over the whole
 * declared set, not over the one label this fixture happens to produce.
 */
const STAGE_NEXT_ACTION_LABELS = [
  "Remediate current gaps",
  "Approval recorded",
  "Open approval gate",
  "Load required evidence",
] as const;

function makeEvent(
  overrides: Partial<SourcingEventSummary> = {},
): SourcingEventSummary {
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
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm the scope boundary",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve the scope gate",
    ...overrides,
  } as SourcingEventSummary;
}

/**
 * A stage view built from this event's own words — deliberately NOT one of the
 * `SAMPLE_*` fixtures the canvas falls back to, so clause 2 can tell the two
 * apart at the destination.
 */
function makeEventStageView(
  overrides: Partial<StageAnalyticsView> = {},
): StageAnalyticsView {
  return {
    stageKey: "scope",
    stageName: "Scope",
    purpose: "Fix the boundary of what this event is sourcing.",
    intel: {
      provenance: "live",
      lead: "Read from this event's own records.",
      points: [],
    },
    tasks: [
      {
        id: "scope-boundary",
        title: "Confirm the scope boundary",
        subtitle: "from this event",
        type: "confirm",
        state: "done",
        guide: "Confirm what is in and out of the boundary.",
        cta: "Confirm boundary",
        evidenceComplete: true,
      },
    ],
    gate: {
      approver: "K. Oshima, CIO",
      confirms: [
        { label: "Evidence complete", detail: "The boundary is recorded." },
      ],
      generates: [{ label: "Scope Memo", code: "d05" }],
      nextStageName: "RFP",
    },
    ...overrides,
  } as StageAnalyticsView;
}

/**
 * One required, gate-defining scope artifact left as an unaccepted AI draft, so
 * `stageArtifactReadinessFor` produces real, named blockers rather than the
 * empty list a clean event yields.
 */
const BLOCKED_SCOPE_ARTIFACT = {
  id: "art-1",
  artifactCode: "d05_scope_memo",
  stageKey: "scope",
  title: "Scope Memo with Boundaries",
  status: "draft",
  sourceOrigin: "ai_generated",
  isClientFinal: false,
} as const;

/** Mount the shell the way the `(maestro)` layout mounts it. */
function renderShellInRouteChrome(
  props: Partial<React.ComponentProps<typeof SourceAnalyticsCanvas>> = {},
) {
  return render(
    <MaestroChrome>
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Example Holdings"
        {...props}
      />
    </MaestroChrome>,
  );
}

describe("F8 clause 1 — the shell adds no second navbar", () => {
  it("renders exactly one navigation landmark once the route chrome wraps it", () => {
    renderShellInRouteChrome();

    const landmarks = screen.queryAllByRole("navigation");
    // Population first: zero landmarks would satisfy "not two" while meaning
    // the nav never rendered at all.
    expect(landmarks.length).toBeGreaterThan(0);
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toHaveAttribute("aria-label", "Primary");
  });
});

describe("F8 clause 2 — the phase rail comes from the event's own journey", () => {
  it("renders a populated rail", () => {
    renderShellInRouteChrome({ stageView: makeEventStageView() });

    expect(screen.getByTestId(RAIL)).toBeInTheDocument();
    const checkpoints = screen.queryAllByTestId(CHECKPOINT);
    expect(checkpoints.length).toBeGreaterThan(0);
    for (const checkpoint of checkpoints) {
      expect(checkpoint.textContent?.trim()).not.toBe("");
      expect(checkpoint).toHaveAttribute("href");
    }
  });

  it("follows the journey THIS event declares, not a fixed stage list", () => {
    const journey = SOURCE_JOURNEYS.contract_optimization;
    renderShellInRouteChrome({
      stageView: makeEventStageView(),
      journey,
    });

    const rail = screen.getByTestId(RAIL);
    const rendered = within(rail)
      .getAllByTestId(CHECKPOINT)
      .map((node) => node.textContent ?? "");
    expect(rendered.length).toBeGreaterThan(0);

    // Every stage this event's journey declares is on the rail, by its
    // journey label — "Commercial Baseline", not the canonical "Pricing".
    expect(journey.stages.length).toBeGreaterThan(0);
    for (const stage of journey.stages) {
      expect(
        rendered.some((text) => text.includes(stage.label)),
      ).toBe(true);
    }
    // And the canonical labels this journey renames do NOT appear, which is
    // what distinguishes "from the event's journey" from "from a constant".
    const renamed = journey.stages.filter(
      (stage) => stage.label !== canonicalLabelFor(stage.key),
    );
    expect(renamed.length).toBeGreaterThan(0);
    for (const stage of renamed) {
      const canonical = canonicalLabelFor(stage.key);
      expect(
        rendered.some((text) => text.includes(canonical)),
      ).toBe(false);
    }
  });

  it("renders no SAMPLE_* fixture text once the event supplies its own stage view", () => {
    renderShellInRouteChrome({ stageView: makeEventStageView() });

    const rail = screen.getByTestId(RAIL);
    expect((rail.textContent ?? "").trim()).not.toBe("");
    // The rail says what THIS event is, from the event.
    expect(rail.textContent ?? "").toContain(makeEvent().name);

    const sampleStrings = [
      SAMPLE_SCOPE_STAGE.purpose,
      SAMPLE_SCOPE_STAGE.intel.lead,
      SAMPLE_SCOPE_AVA.context,
    ];
    // Assert the fixture strings themselves are real before asserting their
    // absence: a typo'd field name reads as an absent string, and absence is
    // exactly what this case is looking for.
    expect(sampleStrings).toHaveLength(3);
    for (const sample of sampleStrings) {
      expect(typeof sample).toBe("string");
      expect(sample.length).toBeGreaterThan(20);
    }

    // Scanned over the whole shell, not just the rail: the sample fixture is
    // the canvas's fallback for a missing stage view, and a shell that ignores
    // the supplied one shows it wherever that stage view is read.
    const shell = document.body.textContent ?? "";
    expect(shell.length).toBeGreaterThan(0);
    for (const sample of sampleStrings) {
      expect(shell).not.toContain(sample);
    }
    // The event's own stage view did reach the shell.
    expect(shell).toContain(makeEventStageView().purpose);
  });
});

describe("F8 clause 3 — the shell offers exactly one stage next action", () => {
  it("renders one stage operating-status panel carrying one next-action chip", () => {
    renderShellInRouteChrome({
      stageView: makeEventStageView(),
      artifacts: [BLOCKED_SCOPE_ARTIFACT],
    });

    const panels = screen.queryAllByTestId(/operating-status$/);
    expect(panels.length).toBeGreaterThan(0);
    expect(panels).toHaveLength(1);

    const declared = STAGE_NEXT_ACTION_LABELS.flatMap((label) =>
      screen.queryAllByText(label, { exact: true }),
    );
    expect(declared.length).toBeGreaterThan(0);
    expect(declared).toHaveLength(1);
    expect(panels[0]).toContainElement(declared[0]);
  });
});

describe("F8 clause 4 — a blocker names its own reason", () => {
  it("prints each blocked artifact's specific reason, not a generic line", () => {
    renderShellInRouteChrome({
      stageView: makeEventStageView(),
      artifacts: [BLOCKED_SCOPE_ARTIFACT],
    });

    const blocker = screen.getByTestId(APPROVAL_BLOCKER);
    const text = blocker.textContent ?? "";
    expect(text.trim()).not.toBe("");

    // A reason is "<artifact name>: <why>". Count them, then check each one —
    // a panel that renders only its generic preamble has zero and must fail.
    const reasons = (text.match(/[A-Z][^:]*: [a-z][^A-Z]*/g) ?? []).map((row) =>
      row.trim(),
    );
    expect(reasons.length).toBeGreaterThan(0);
    for (const reason of reasons) {
      expect(reason).toMatch(/^[^:]+: .+$/);
    }

    // The specific ones this fixture earns, named rather than summarised.
    expect(text).toContain(
      "Scope Memo with Boundaries: evidence is present, but no governed deliverable is accepted",
    );
    expect(text).toContain("Application Inventory & Tiering: not registered");

    // And not the generic fallback string the intelligence read falls back to.
    expect(text).not.toContain("Files review blocker");
  });
});

function canonicalLabelFor(key: string): string {
  const competitive = SOURCE_JOURNEYS.competitive_rfp.stages.find(
    (stage) => stage.key === key,
  );
  return competitive?.label ?? key;
}

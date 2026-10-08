/**
 * @jest-environment jsdom
 */

// The strip is where a Move's progress is read at a glance, and its gate rail
// was blind to the record that holds a mid-phase approval. `gates_passed` is
// appended to only by the terminal P5 hand-off, so a Move whose P1-P4 gates
// were approved in the product rendered every one of those phases unmarked.
//
// The derivation is pinned by `engagement-phase-rail.test.ts`. What is pinned
// HERE is that the corrected derivation reaches the screen: the markup reads
// the markers, so a correct rail behind a strip that does not pass its
// snapshots is a fix nobody sees. Each case therefore asserts rendered text,
// and the no-snapshot counterpart is kept beside it so the assertions cannot
// pass for a strip that ignores the prop.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { EngagementRow } from "@/lib/db/engagement";
import { EngagementMetaStrip } from "../EngagementMetaStrip";

function engagement(overrides: Partial<EngagementRow> = {}): EngagementRow {
  return {
    id: "eng-1",
    graph_node_id: "node-1",
    name: "A Move",
    industry_code: "IND",
    function_code: "FN",
    objective_code: "OBJ",
    topic_code: null,
    sponsor_person_id: null,
    co_sponsor_person_id: null,
    maestro_person_id: null,
    current_phase: 3,
    status: "active",
    charter: null,
    gates_passed: [],
    decisions: [],
    deliverables: [],
    sponsor_approvals: [],
    baseline_metrics: null,
    actual_metrics: null,
    outcome_fee_status: null,
    outcome_fee_usd: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    phase_0_started_at: null,
    phase_4_completed_at: null,
    ...overrides,
  };
}

function renderStrip(props: {
  phaseSnapshots: Parameters<typeof EngagementMetaStrip>[0]["phaseSnapshots"];
  engagement?: EngagementRow;
}) {
  return render(
    <EngagementMetaStrip
      engagement={props.engagement ?? engagement()}
      phaseSnapshots={props.phaseSnapshots}
      sponsor={null}
      turnCount={0}
      lastTurnAt={null}
      activePatternsCount={0}
      assignedTopicsCount={0}
      contradictionsCount={0}
    />,
  );
}

const P1_AT = "2026-02-02T00:00:00.000Z";
const P2_AT = "2026-03-03T00:00:00.000Z";

const APPROVED_P2 = {
  phase_number: 2,
  approval_status: "approved",
  locked_at: P2_AT,
};

// The strip renders a short local date. The expected text is derived from the
// same instant rather than written out, so these cases assert WHICH record
// supplied the date and not the host's locale or offset — a hardcoded "Mar 3"
// fails on any machine west of UTC for a reason that has nothing to do with
// the defect.
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Thirty days on, the interval the rail schedules the next gate by. */
function thirtyDaysAfter(iso: string): string {
  return shortDate(
    new Date(new Date(iso).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  );
}

describe("the gate rail shows the approvals the product actually recorded", () => {
  it("marks and dates each phase its snapshots approve", () => {
    renderStrip({
      phaseSnapshots: [
        { phase_number: 1, approval_status: "approved", locked_at: P1_AT },
        APPROVED_P2,
      ],
    });
    // Each marker is read for its own text, so one phase's date cannot be
    // mistaken for another's — the two expected strings are distinct, which is
    // what makes a cross-phase bleed fail here.
    expect(shortDate(P1_AT)).not.toBe(shortDate(P2_AT));
    expect(screen.getByTestId("engagement-meta-strip-gate-1")).toHaveTextContent(
      `gate ${shortDate(P1_AT)}`,
    );
    expect(screen.getByTestId("engagement-meta-strip-gate-2")).toHaveTextContent(
      `gate ${shortDate(P2_AT)}`,
    );
    expect(screen.queryByTestId("engagement-meta-strip-gate-3")).toBeNull();
    expect(screen.queryByTestId("engagement-meta-strip-gate-0")).toBeNull();
  });

  it("shows no gate marker at all when the snapshots are withheld", () => {
    renderStrip({ phaseSnapshots: [] });
    for (const phase of [0, 1, 2, 3, 4, 5]) {
      expect(screen.queryByTestId(`engagement-meta-strip-gate-${phase}`)).toBeNull();
    }
  });

  it("marks an approval no record can date without printing a date", () => {
    renderStrip({
      phaseSnapshots: [{ phase_number: 4, approval_status: "approved", locked_at: null }],
    });
    const marker = screen.getByTestId("engagement-meta-strip-gate-4");
    expect(marker).toHaveTextContent("gate approved");
    expect(marker.textContent).not.toMatch(/\d/);
  });

  it("states the baseline lock and the next gate from the phase-2 snapshot", () => {
    renderStrip({ phaseSnapshots: [APPROVED_P2] });
    expect(
      screen.getByText(`baseline locked ${shortDate(P2_AT)}`),
    ).toBeInTheDocument();
    // Thirty days on from the approval the snapshot stamps.
    expect(
      screen.getByText(`next gate ~${thirtyDaysAfter(P2_AT)}`),
    ).toBeInTheDocument();
  });

  it("states neither date for the same Move with its snapshots withheld", () => {
    renderStrip({ phaseSnapshots: [] });
    expect(screen.getByText("baseline not yet locked")).toBeInTheDocument();
    expect(screen.getByText("no gate history yet")).toBeInTheDocument();
  });

  it("still recognises the bare phase number the terminal hand-off appends", () => {
    renderStrip({
      engagement: engagement({ current_phase: 5, gates_passed: [5] }),
      phaseSnapshots: [],
    });
    expect(screen.getByTestId("engagement-meta-strip-gate-5")).toHaveTextContent("gate approved");
  });
});

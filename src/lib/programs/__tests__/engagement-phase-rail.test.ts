// The engagement console's phase rail: does it state the canonical six-phase
// Strategic Move model, and does it recognise a gate approval in the shape the
// product actually records?
//
// Both halves had a defect. The rail hardcoded five legacy labels including
// two the phase-model doctrine excludes, and it matched only one of the shapes
// `gates_passed` is written in. The assertions below pin the canonical model by
// value (so a reintroduced legacy label fails, not just a changed count) and
// pin the bare-phase-number shape that the only reachable writer appends.

import {
  deriveEngagementPhaseRail,
  ENGAGEMENT_RAIL_LABELS,
  NEXT_GATE_INTERVAL_DAYS,
} from "@/lib/programs/engagement-phase-rail";
import { PHASE_LABELS_SHORT, TOTAL_PHASES } from "@/lib/programs/phase-labels";

const noGates = { gatesPassed: null };

describe("the rail states the canonical phase model", () => {
  it("draws one marker per canonical phase, so the last phase has a column", () => {
    const { markers } = deriveEngagementPhaseRail(noGates);
    expect(markers).toHaveLength(TOTAL_PHASES);
    expect(markers.map((marker) => marker.phase)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("labels every phase from the declared source of truth", () => {
    const { markers } = deriveEngagementPhaseRail(noGates);
    expect(markers.map((marker) => marker.label)).toEqual([
      "Originate",
      "Charter",
      "Diagnose",
      "Design",
      "Roadmap",
      "Mobilize",
    ]);
    // Not merely equal to each other: equal to the canonical table, so the rail
    // cannot drift from it without this failing.
    for (const marker of markers) {
      expect(marker.label).toBe(PHASE_LABELS_SHORT[marker.phase]);
    }
  });

  it("names none of the phases the doctrine excludes from a Move", () => {
    const { markers } = deriveEngagementPhaseRail(noGates);
    const labels = markers.map((marker) => marker.label);
    // `phase-labels` says Build / Execute / Verify are Tower's, not a Move's.
    for (const excluded of ["Build", "Execute", "Verify", "Start"]) {
      expect(labels).not.toContain(excluded);
    }
  });

  it("exposes the same labels to a host that has no records", () => {
    expect([...ENGAGEMENT_RAIL_LABELS]).toEqual(
      deriveEngagementPhaseRail(noGates).markers.map((m) => m.label),
    );
  });
});

describe("a recorded gate approval is recognised in the shapes it is written in", () => {
  it("accepts the bare phase number the terminal hand-off appends", () => {
    const { markers } = deriveEngagementPhaseRail({ gatesPassed: [5] });
    expect(markers[5]).toMatchObject({ approved: true, signedAt: null });
    // Only the named phase, so a bare number does not light the whole rail.
    expect(markers.filter((marker) => marker.approved)).toHaveLength(1);
  });

  it("accepts a full record and carries its date", () => {
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [
        { phase: 2, status: "approved", signed_at: "2026-03-04T00:00:00.000Z" },
      ],
    });
    expect(markers[2]).toMatchObject({
      approved: true,
      signedAt: "2026-03-04T00:00:00.000Z",
    });
  });

  it("accepts the alternate phase spellings and approving statuses", () => {
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [
        { phase_number: 1, status: "passed" },
        { completedPhase: "P3", status: "completed" },
      ],
    });
    expect(markers[1].approved).toBe(true);
    expect(markers[3].approved).toBe(true);
  });

  it("does not treat a rejected record as an approval", () => {
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [{ phase: 4, status: "rejected", signed_at: "2026-01-01T00:00:00.000Z" }],
    });
    expect(markers[4]).toMatchObject({ approved: false, signedAt: null });
  });

  it("reads a missing or malformed array as no approvals", () => {
    for (const gatesPassed of [null, undefined, [], ["nonsense"], [{}]] as const) {
      const { markers } = deriveEngagementPhaseRail({ gatesPassed });
      expect(markers.some((marker) => marker.approved)).toBe(false);
    }
  });
});

describe("the dates the rail derives", () => {
  it("prefers the baseline's own capture date", () => {
    const { baselineLockedAt } = deriveEngagementPhaseRail({
      gatesPassed: [
        { phase: 2, status: "approved", signed_at: "2026-03-04T00:00:00.000Z" },
      ],
      baselineCapturedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(baselineLockedAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("falls back to the phase-2 gate date, and to null with neither", () => {
    expect(
      deriveEngagementPhaseRail({
        gatesPassed: [
          { phase: 2, status: "approved", signed_at: "2026-03-04T00:00:00.000Z" },
        ],
        baselineCapturedAt: "   ",
      }).baselineLockedAt,
    ).toBe("2026-03-04T00:00:00.000Z");
    expect(deriveEngagementPhaseRail(noGates).baselineLockedAt).toBeNull();
  });

  it("counts the next gate forward from the latest signed gate", () => {
    const { nextGateAt } = deriveEngagementPhaseRail({
      gatesPassed: [
        { phase: 1, status: "approved", signed_at: "2026-01-01T00:00:00.000Z" },
        { phase: 2, status: "approved", signed_at: "2026-03-04T00:00:00.000Z" },
      ],
    });
    expect(nextGateAt).toBe(
      new Date(
        new Date("2026-03-04T00:00:00.000Z").getTime() +
          NEXT_GATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  });

  it("leaves the next gate unknown when the only approval carries no date", () => {
    const rail = deriveEngagementPhaseRail({ gatesPassed: [5] });
    expect(rail.markers[5].approved).toBe(true);
    // An undated approval must not be turned into an invented schedule.
    expect(rail.nextGateAt).toBeNull();
    expect(rail.baselineLockedAt).toBeNull();
  });
});

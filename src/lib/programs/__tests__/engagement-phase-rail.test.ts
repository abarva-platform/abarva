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

// The defect these cover: `gates_passed` receives nothing for phases 1-4 on
// the walked path, so a Move whose P1-P4 gates were approved in the product
// rendered every one of them unmarked. `phase_snapshots` is the record that
// holds them, and the rail reads it only if the host hands it over — so the
// no-snapshot cases below are kept beside the snapshot ones to state what is
// lost by not wiring it.
describe("the authoritative record carries the approvals the array never receives", () => {
  const approvedSnapshot = (phase: number, lockedAt: string | null) => ({
    phase_number: phase,
    approval_status: "approved",
    locked_at: lockedAt,
  });

  it("marks and dates a mid-phase gate the array is silent about", () => {
    // Exactly the walked shape: nothing in the array, an approved snapshot
    // per phase left behind. Each phase is asserted on its own derived value
    // rather than on the shape of the list, so one phase's date cannot stand
    // in for another's.
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [],
      snapshots: [
        approvedSnapshot(1, "2026-02-02T00:00:00.000Z"),
        approvedSnapshot(2, "2026-03-03T00:00:00.000Z"),
        approvedSnapshot(3, "2026-04-04T00:00:00.000Z"),
      ],
    });
    expect(markers[1]).toMatchObject({ approved: true, signedAt: "2026-02-02T00:00:00.000Z" });
    expect(markers[2]).toMatchObject({ approved: true, signedAt: "2026-03-03T00:00:00.000Z" });
    expect(markers[3]).toMatchObject({ approved: true, signedAt: "2026-04-04T00:00:00.000Z" });
    expect(markers[0]).toMatchObject({ approved: false, signedAt: null });
    expect(markers[4]).toMatchObject({ approved: false, signedAt: null });
    expect(markers[5]).toMatchObject({ approved: false, signedAt: null });
  });

  it("reports the same Move as having cleared nothing when the host loads no snapshots", () => {
    // The counterpart of the case above, and the reason the host's wiring is
    // part of the fix: identical records, snapshots withheld.
    const { markers } = deriveEngagementPhaseRail({ gatesPassed: [] });
    expect(markers.some((marker) => marker.approved)).toBe(false);
  });

  it("does not mark a phase whose snapshot is not approved", () => {
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [],
      snapshots: [
        { phase_number: 2, approval_status: "pending", locked_at: "2026-03-03T00:00:00.000Z" },
      ],
    });
    expect(markers[2]).toMatchObject({ approved: false, signedAt: null });
  });

  it("marks a gate the snapshot cannot date, without inventing a date", () => {
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [],
      snapshots: [approvedSnapshot(4, null)],
    });
    expect(markers[4]).toMatchObject({ approved: true, signedAt: null });
  });

  it("locks the baseline from the phase-2 snapshot, which no array record supplies", () => {
    const rail = deriveEngagementPhaseRail({
      gatesPassed: [],
      snapshots: [approvedSnapshot(2, "2026-03-03T00:00:00.000Z")],
    });
    expect(rail.baselineLockedAt).toBe("2026-03-03T00:00:00.000Z");
    expect(rail.nextGateAt).toBe(
      new Date(
        new Date("2026-03-03T00:00:00.000Z").getTime() +
          NEXT_GATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
    // Without the snapshots the same Move reports neither.
    const unwired = deriveEngagementPhaseRail({ gatesPassed: [] });
    expect(unwired.baselineLockedAt).toBeNull();
    expect(unwired.nextGateAt).toBeNull();
  });

  it("counts the next gate from the newest approval across both records", () => {
    // The array holds the terminal hand-off's bare 5 — approved, undated — and
    // the snapshots hold the dated middle phases. The schedule must come from
    // the latest DATE, not the highest phase.
    const rail = deriveEngagementPhaseRail({
      gatesPassed: [5, { phase: 1, status: "approved", signed_at: "2026-01-01T00:00:00.000Z" }],
      snapshots: [approvedSnapshot(3, "2026-05-05T00:00:00.000Z")],
    });
    expect(rail.markers[5]).toMatchObject({ approved: true, signedAt: null });
    expect(rail.markers[1].approved).toBe(true);
    expect(rail.markers[3].signedAt).toBe("2026-05-05T00:00:00.000Z");
    expect(rail.nextGateAt).toBe(
      new Date(
        new Date("2026-05-05T00:00:00.000Z").getTime() +
          NEXT_GATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  });

  it("prefers the snapshot's stamp over an array date for the same phase", () => {
    // Both records name phase 2. The snapshot is the record the approving
    // control writes, so its stamp is the one the rail shows.
    const { markers } = deriveEngagementPhaseRail({
      gatesPassed: [{ phase: 2, status: "approved", signed_at: "2026-01-01T00:00:00.000Z" }],
      snapshots: [approvedSnapshot(2, "2026-06-06T00:00:00.000Z")],
    });
    expect(markers[2].signedAt).toBe("2026-06-06T00:00:00.000Z");
  });

  it("reads a malformed snapshot list as no approvals rather than throwing", () => {
    for (const snapshots of [null, undefined, []] as const) {
      const { markers } = deriveEngagementPhaseRail({ gatesPassed: null, snapshots });
      expect(markers.some((marker) => marker.approved)).toBe(false);
    }
  });
});

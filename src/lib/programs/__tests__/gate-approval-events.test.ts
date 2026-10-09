import { buildGateApprovalEvents } from "../gate-approval-events";
import { PHASE_LABELS_SHORT } from "../phase-labels";

// An `approved` phase_snapshots row as both `runAdvancePhase` implementations
// write it: the phase being left, stamped at the moment of the write.
const advanceSnapshot = (phase: number, lockedAt: string) => ({
  phaseNumber: phase,
  approvalStatus: "approved",
  lockedAt,
  createdAt: lockedAt,
});

describe("buildGateApprovalEvents", () => {
  it("dates the approval the product advance path writes", () => {
    // The regression this module exists for: on the walked path `gates_passed`
    // is never written for phases 1-4, so the snapshot is the only record.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [advanceSnapshot(2, "2026-10-08T10:00:00.000Z")],
    });

    expect(undatedPhases).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      phase: 2,
      at: "2026-10-08T10:00:00.000Z",
      source: "snapshot",
    });
  });

  it("reads nothing from an empty array with no snapshots", () => {
    expect(buildGateApprovalEvents({ gatesPassed: [], snapshots: [] })).toEqual({
      events: [],
      undatedPhases: [],
    });
  });

  it("reports a bare-number approval as undated rather than dropping it", () => {
    // The P5 terminal handoff appends the bare number 5. Alone it names a
    // phase and carries no time, so it cannot take a position in the stream.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [5],
      snapshots: [],
    });

    expect(events).toEqual([]);
    expect(undatedPhases).toEqual([5]);
  });

  it("emits one dated event for the P5 route's array-plus-snapshot write", () => {
    // The route appends the bare 5 AND inserts an approved snapshot. Both
    // records name phase 5; the surface must show one event, not two.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [5],
      snapshots: [advanceSnapshot(5, "2026-10-08T12:00:00.000Z")],
    });

    expect(undatedPhases).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      phase: 5,
      at: "2026-10-08T12:00:00.000Z",
      source: "snapshot",
    });
  });

  it("dates a legacy record from its own signed_at when no snapshot exists", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [
        {
          phase: 1,
          status: "approved",
          signed_at: "2026-10-01T09:00:00.000Z",
          summary: "Charter signed off",
        },
      ],
      snapshots: [],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      phase: 1,
      at: "2026-10-01T09:00:00.000Z",
      source: "gates_passed",
      detail: "Charter signed off",
    });
  });

  it("prefers the authoritative snapshot time over the array's", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [
        { phase: 3, status: "approved", signed_at: "2026-10-01T09:00:00.000Z" },
      ],
      snapshots: [advanceSnapshot(3, "2026-10-04T09:00:00.000Z")],
    });

    expect(events).toHaveLength(1);
    expect(events[0].at).toBe("2026-10-04T09:00:00.000Z");
    expect(events[0].source).toBe("snapshot");
  });

  it("ignores a snapshot that is not approved", () => {
    // `runAdvancePhase` writes `pending` when no approver is recorded.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        {
          phaseNumber: 2,
          approvalStatus: "pending",
          lockedAt: "2026-10-08T10:00:00.000Z",
        },
        {
          phaseNumber: 3,
          approvalStatus: "rejected",
          lockedAt: "2026-10-08T11:00:00.000Z",
        },
      ],
    });

    expect(events).toEqual([]);
    expect(undatedPhases).toEqual([]);
  });

  it("will not date an array-approved phase from a non-approved snapshot", () => {
    // `runAdvancePhase` stamps `pending` whenever no approver is recorded, so a
    // phase the array calls approved can carry a pending snapshot. The pending
    // row's time is not an approval time: the array's own stamp has to win.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [
        { phase: 2, status: "approved", signed_at: "2026-10-01T09:00:00.000Z" },
      ],
      snapshots: [
        {
          phaseNumber: 2,
          approvalStatus: "pending",
          lockedAt: "2026-10-07T09:00:00.000Z",
        },
      ],
    });

    expect(undatedPhases).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      phase: 2,
      at: "2026-10-01T09:00:00.000Z",
      source: "gates_passed",
    });
  });

  it("leaves a bare-number approval undated when its only snapshot was rejected", () => {
    // Nothing in either record is an approval time, so the crossing stays out
    // of the stream rather than borrowing the rejected row's timestamp.
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [5],
      snapshots: [
        {
          phaseNumber: 5,
          approvalStatus: "rejected",
          lockedAt: "2026-10-07T09:00:00.000Z",
        },
      ],
    });

    expect(events).toEqual([]);
    expect(undatedPhases).toEqual([5]);
  });

  it("falls back to created_at when the approving stamp is absent", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        {
          phase_number: 4,
          approval_status: "approved",
          locked_at: null,
          created_at: "2026-10-08T08:30:00.000Z",
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ phase: 4, at: "2026-10-08T08:30:00.000Z" });
  });

  it("takes the newest re-approval when a phase was approved twice", () => {
    // `recordReapprovalSnapshot` inserts another approved row for the phase.
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        advanceSnapshot(2, "2026-10-02T10:00:00.000Z"),
        advanceSnapshot(2, "2026-10-06T10:00:00.000Z"),
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0].at).toBe("2026-10-06T10:00:00.000Z");
  });

  it("orders a full walk newest first", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        advanceSnapshot(1, "2026-10-01T10:00:00.000Z"),
        advanceSnapshot(3, "2026-10-03T10:00:00.000Z"),
        advanceSnapshot(2, "2026-10-02T10:00:00.000Z"),
      ],
    });

    // Asserted per phase, not just in order: a date taken from another
    // phase's snapshot would still sort correctly by the phase tie-break.
    expect(events.map((e) => [e.phase, e.at])).toEqual([
      [3, "2026-10-03T10:00:00.000Z"],
      [2, "2026-10-02T10:00:00.000Z"],
      [1, "2026-10-01T10:00:00.000Z"],
    ]);
  });

  it("dates each legacy record from its own phase's signed_at", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [
        { phase: 1, status: "approved", signed_at: "2026-10-01T09:00:00.000Z" },
        { phase: 2, status: "approved", signed_at: "2026-10-05T09:00:00.000Z" },
      ],
      snapshots: [],
    });

    expect(events.map((e) => [e.phase, e.at])).toEqual([
      [2, "2026-10-05T09:00:00.000Z"],
      [1, "2026-10-01T09:00:00.000Z"],
    ]);
  });

  it("labels each event from the canonical phase labels", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [advanceSnapshot(2, "2026-10-08T10:00:00.000Z")],
    });

    expect(events[0].label).toBe(`P2 ${PHASE_LABELS_SHORT[2]} gate approved`);
    expect(events[0].label).toContain("Discover");
  });

  it("surfaces the approver's rationale as the event detail", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        {
          ...advanceSnapshot(5, "2026-10-08T12:00:00.000Z"),
          snapshot: { humanRationale: "Tower handoff accepted" },
        },
      ],
    });

    expect(events[0].detail).toBe("Tower handoff accepted");
  });

  it("leaves the detail null when the record carries no rationale", () => {
    const { events } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [advanceSnapshot(2, "2026-10-08T10:00:00.000Z")],
    });

    expect(events[0].detail).toBeNull();
  });

  it("treats an unparseable timestamp as undated, not as a position", () => {
    const { events, undatedPhases } = buildGateApprovalEvents({
      gatesPassed: [],
      snapshots: [
        { phaseNumber: 2, approvalStatus: "approved", lockedAt: "not-a-date" },
      ],
    });

    expect(events).toEqual([]);
    expect(undatedPhases).toEqual([2]);
  });

  it("survives absent records", () => {
    expect(buildGateApprovalEvents({})).toEqual({
      events: [],
      undatedPhases: [],
    });
    expect(
      buildGateApprovalEvents({ gatesPassed: null, snapshots: null }),
    ).toEqual({ events: [], undatedPhases: [] });
  });
});

// Approvals inbox proof: one place, plain English, one destination per item.
// Intake approvals first; gates show honest readiness (ready vs ready-with-gaps).
import { buildApprovalsInbox } from "../approvals-inbox";

const evt = (over: Record<string, unknown>) => ({
  id: "e1",
  event_code: "SKYH-X-2026",
  event_name: "Event",
  current_stage_key: "strategy",
  lifecycle_state: "active",
  estimated_value_usd: 11000000,
  ...over,
});

describe("buildApprovalsInbox", () => {
  it("lists pending intake approvals with a direct link to the approval page", () => {
    const inbox = buildApprovalsInbox({
      pendingEvents: [
        evt({
          id: "p1",
          lifecycle_state: "waiting_on_client",
          event_name: "AMS Consolidation",
        }),
      ],
      activeEvents: [],
      criterionRows: [],
    });
    expect(inbox.intakeCount).toBe(1);
    const item = inbox.items[0];
    expect(item.kind).toBe("intake_approval");
    expect(item.status).toBe("ready");
    expect(item.href).toBe("/source/events/p1/approval");
    expect(item.ask).toMatch(/unlock the working canvas/i);
  });

  it("marks a stage gate ready when all current-stage criteria are met/waived", () => {
    const inbox = buildApprovalsInbox({
      pendingEvents: [],
      activeEvents: [evt({ id: "a1" })],
      criterionRows: [
        { source_event_id: "a1", from_stage: "strategy", state: "met" },
        { source_event_id: "a1", from_stage: "strategy", state: "waived" },
      ],
    });
    const item = inbox.items[0];
    expect(item.kind).toBe("stage_gate");
    expect(item.status).toBe("ready");
    expect(item.readiness).toMatch(/All 2 gate items met/);
    expect(item.actionLabel).toBe("Approve now");
    expect(item.href).toBe("/source/events/a1?stage=strategy&workspace=approvals");
    expect(inbox.gateReadyCount).toBe(1);
  });

  it("shows ready-with-gaps honestly and only counts current-stage criteria", () => {
    const inbox = buildApprovalsInbox({
      pendingEvents: [],
      activeEvents: [evt({ id: "a2", current_stage_key: "rfp" })],
      criterionRows: [
        { source_event_id: "a2", from_stage: "rfp", state: "met" },
        { source_event_id: "a2", from_stage: "rfp", state: "pending" },
        { source_event_id: "a2", from_stage: "scope", state: "pending" }, // prior stage — ignored
      ],
    });
    const item = inbox.items[0];
    expect(item.status).toBe("ready_with_gaps");
    expect(item.readiness).toMatch(/1 of 2 gate items met/);
    expect(item.readiness).toMatch(/approve with gaps/i);
  });

  it("orders intake first, then ready gates, then gates with gaps; skips gate row for pending-intake events", () => {
    const inbox = buildApprovalsInbox({
      pendingEvents: [evt({ id: "p1", lifecycle_state: "waiting_on_client" })],
      activeEvents: [
        evt({ id: "p1", lifecycle_state: "waiting_on_client" }), // also in active list — must not duplicate
        evt({ id: "g1" }),
        evt({ id: "g2" }),
      ],
      criterionRows: [
        { source_event_id: "g1", from_stage: "strategy", state: "pending" },
        { source_event_id: "g2", from_stage: "strategy", state: "met" },
      ],
    });
    expect(inbox.items.map((i) => `${i.kind}:${i.eventId}`)).toEqual([
      "intake_approval:p1",
      "stage_gate:g2",
      "stage_gate:g1",
    ]);
  });

  it("omits events with no gate criteria (nothing to approve)", () => {
    const inbox = buildApprovalsInbox({
      pendingEvents: [],
      activeEvents: [evt({ id: "a3" })],
      criterionRows: [],
    });
    expect(inbox.items).toHaveLength(0);
  });
});

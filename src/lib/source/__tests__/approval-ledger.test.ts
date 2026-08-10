// SOURCE-SHELL-003: per-event Approvals ledger. Honesty invariant under
// test — a past stage's "approved" status is derived purely from stage
// position vs. current_stage_key (always reliable), while the approver
// name/timestamp is a real enrichment from source_event_approvals that is
// null when no matching stage_key row exists, never guessed by inference.

import { buildApprovalLedger } from "../approval-ledger-model";
import { SOURCE_STAGE_ORDER } from "../constants";

describe("buildApprovalLedger", () => {
  it("marks stages before the current stage as approved, the current stage as current, and later stages as locked", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "rfp",
      approvalRows: [],
      approverNames: new Map(),
    });

    expect(ledger).toHaveLength(SOURCE_STAGE_ORDER.length);
    expect(ledger.map((r) => r.state)).toEqual([
      "approved", // strategy
      "approved", // scope
      "current", // rfp
      "locked", // responses
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
  });

  it("attaches the real approver name and timestamp when a matching stage_key row exists", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "rfp",
      approvalRows: [
        {
          stage_key: "strategy",
          approved_by_user_id: "user_abc",
          action: "admin_review",
          created_at: "2026-07-15T10:00:00.000Z",
          notes: "Sponsor reviewed the strategy memo and confirmed the gate.",
        },
      ],
      approverNames: new Map([["user_abc", "D. Rao"]]),
    });

    const strategyRow = ledger.find((r) => r.stageKey === "strategy")!;
    expect(strategyRow.state).toBe("approved");
    expect(strategyRow.approverName).toBe("D. Rao");
    expect(strategyRow.approvedAtIso).toBe("2026-07-15T10:00:00.000Z");
    expect(strategyRow.authorizationNote).toBe("Approved by D. Rao.");
    expect(strategyRow.approverRationale).toBe(
      "Sponsor reviewed the strategy memo and confirmed the gate.",
    );
  });

  it("does NOT fabricate an approver for a past stage with no matching stage_key row — honest null, not a guess", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "rfp",
      // Scope was clearly approved (event is past it) but this event
      // predates stage_key tracking, so no row matches it.
      approvalRows: [],
      approverNames: new Map(),
    });

    const scopeRow = ledger.find((r) => r.stageKey === "scope")!;
    expect(scopeRow.state).toBe("approved");
    expect(scopeRow.approverName).toBeNull();
    expect(scopeRow.approvedAtIso).toBeNull();
    expect(scopeRow.authorizationNote).toMatch(/not recorded/i);
  });

  it("uses the most recent matching row when a stage has more than one approval (e.g. after a send-back)", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "scope",
      approvalRows: [
        {
          stage_key: "strategy",
          approved_by_user_id: "user_first",
          action: "admin_review",
          created_at: "2026-07-01T10:00:00.000Z",
        },
        {
          stage_key: "strategy",
          approved_by_user_id: "user_second",
          action: "admin_review",
          created_at: "2026-07-10T10:00:00.000Z",
        },
      ],
      approverNames: new Map([
        ["user_first", "First Approver"],
        ["user_second", "Second Approver"],
      ]),
    });

    const strategyRow = ledger.find((r) => r.stageKey === "strategy")!;
    expect(strategyRow.approverName).toBe("Second Approver");
  });

  it("ignores non-approval actions (e.g. sent_back, rejected) when matching a stage's approver", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "scope",
      approvalRows: [
        {
          stage_key: "strategy",
          approved_by_user_id: "user_x",
          action: "sent_back",
          created_at: "2026-07-15T10:00:00.000Z",
        },
      ],
      approverNames: new Map([["user_x", "Someone"]]),
    });

    const strategyRow = ledger.find((r) => r.stageKey === "strategy")!;
    expect(strategyRow.approverName).toBeNull();
  });

  it("gives the current stage a plain, non-fabricated authorization statement rather than a fake named individual", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "value",
      approvalRows: [],
      approverNames: new Map(),
    });

    const currentRow = ledger.find((r) => r.stageKey === "value")!;
    expect(currentRow.state).toBe("current");
    expect(currentRow.authorizationNote).toBe(
      "Any client admin can approve this gate.",
    );

    const lockedIndex = ledger.findIndex((r) => r.state === "locked");
    expect(lockedIndex).toBe(-1); // value is the last stage — nothing is locked
  });

  it("marks the terminal value stage as approved when its own approval row exists", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "value",
      approvalRows: [
        {
          stage_key: "value",
          approved_by_user_id: "user_value",
          action: "admin_review",
          created_at: "2026-08-10T15:00:00.000Z",
          notes: "Finance reviewed the value proof gate.",
        },
      ],
      approverNames: new Map([["user_value", "Value Approver"]]),
    });

    expect(ledger.every((r) => r.state === "approved")).toBe(true);
    const valueRow = ledger.find((r) => r.stageKey === "value")!;
    expect(valueRow.approverName).toBe("Value Approver");
    expect(valueRow.approvedAtIso).toBe("2026-08-10T15:00:00.000Z");
    expect(valueRow.authorizationNote).toBe("Approved by Value Approver.");
    expect(valueRow.approverRationale).toBe(
      "Finance reviewed the value proof gate.",
    );
  });

  it("falls back to locked-for-all when currentStageKey is unknown/non-canonical", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "not_a_real_stage",
      approvalRows: [],
      approverNames: new Map(),
    });
    expect(ledger.every((r) => r.state === "locked")).toBe(true);
  });

  it("uses a journey-specific stage list for contract optimization events", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "pricing",
      approvalRows: [],
      approverNames: new Map(),
      stages: [
        { key: "strategy", label: "Strategy" },
        { key: "scope", label: "Scope" },
        { key: "pricing", label: "Commercial Baseline" },
        { key: "bafo", label: "Negotiation Plan" },
        { key: "executive_decision", label: "Executive Decision" },
        { key: "transition", label: "Agreement" },
        { key: "value", label: "Value" },
      ],
    });

    expect(ledger.map((row) => row.stageLabel)).toEqual([
      "Strategy",
      "Scope",
      "Commercial Baseline",
      "Negotiation Plan",
      "Executive Decision",
      "Agreement",
      "Value",
    ]);
    expect(ledger.map((row) => row.stageKey)).not.toContain("rfp");
    expect(ledger.map((row) => row.stageKey)).not.toContain("responses");
    expect(ledger.map((row) => row.stageKey)).not.toContain("evaluation");
    expect(ledger.map((row) => row.stageKey)).not.toContain("selection");
    expect(ledger.map((row) => row.state)).toEqual([
      "approved",
      "approved",
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
  });

  it("coerces skipped canonical stages to the nearest visible journey stage", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "rfp",
      approvalRows: [],
      approverNames: new Map(),
      stages: [
        { key: "strategy", label: "Strategy" },
        { key: "scope", label: "Scope" },
        { key: "pricing", label: "Commercial Baseline" },
        { key: "bafo", label: "Negotiation Plan" },
        { key: "executive_decision", label: "Executive Decision" },
        { key: "transition", label: "Agreement" },
        { key: "value", label: "Value" },
      ],
    });

    expect(ledger.map((row) => row.state)).toEqual([
      "approved",
      "approved",
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(ledger.find((row) => row.state === "current")).toMatchObject({
      stageKey: "pricing",
      stageLabel: "Commercial Baseline",
    });
  });
});

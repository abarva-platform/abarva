/**
 * `evaluateGate` when one of its state reads FAILS.
 *
 * The fluent compat client never throws — `execute()` catches internally and
 * returns `{ data: null, error: { message } }` — so this is the only shape a
 * read failure arrives in, and it is the shape no existing gate fixture
 * supplies. Before this guard every collector coerced the null to `[]` and 30
 * of the 38 criterion branches reported an absence nobody had observed.
 *
 * The healthy direction is asserted in the same cases, because that is the
 * direction the demo walk uses and the one a regression would break.
 */

const getProgramByIdMock = jest.fn();
const listApprovedPhaseEvidenceMock = jest.fn();
const loadApprovedMoveEvidenceSnapshotMock = jest.fn();

jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  __esModule: true,
  listApprovedPhaseEvidence: (...args: unknown[]) =>
    listApprovedPhaseEvidenceMock(...args),
}));

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  __esModule: true,
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) =>
    loadApprovedMoveEvidenceSnapshotMock(...args),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  __esModule: true,
  isFeatureEnabled: () => false,
}));

import { evaluateGate } from "@/lib/programs/governance";
import { GATE_STATE_UNREADABLE_CHECK } from "@/lib/programs/gate-state-readback";

const MOVE_ID = "11111111-2222-4333-8444-555555555555";
const CTX = { clientId: "c-1", clientKey: "meridian", userId: "u-1" };

/** Tables whose read the fake can be told to fail. */
type Table =
  | "deliverables_v2"
  | "program_modules"
  | "engagement_participants"
  | "program_approval_requests"
  | "program_milestones"
  | "deliverable_versions"
  | "move_artifacts";

interface FakeOptions {
  /** Tables whose read returns `{ data: null, error }`, as the client does. */
  fail?: Table[];
  /** Rows per table for the reads that land. */
  rows?: Partial<Record<Table, unknown[]>>;
}

/**
 * A chainable stand-in for the fluent client. Every builder method returns the
 * same object; awaiting it resolves the table's result. No method throws, which
 * is the property that makes `error` the only failure signal.
 */
function fakeClient(options: FakeOptions) {
  const failed = new Set(options.fail ?? []);
  const tablesRead: Table[] = [];
  const client = {
    tablesRead,
    from(table: string) {
      const name = table as Table;
      tablesRead.push(name);
      const result = failed.has(name)
        ? { data: null, error: { message: `read failed: ${table}` } }
        : { data: options.rows?.[name] ?? [], error: null };
      const chain: Record<string, unknown> = {
        then: (
          onfulfilled?: (value: unknown) => unknown,
          onrejected?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(onfulfilled, onrejected),
        catch: (onrejected?: (reason: unknown) => unknown) =>
          Promise.resolve(result).catch(onrejected),
        finally: (onfinally?: () => void) =>
          Promise.resolve(result).finally(onfinally),
      };
      for (const method of [
        "select",
        "eq",
        "in",
        "order",
        "limit",
        "neq",
        "gte",
        "lte",
        "not",
        "is",
      ]) {
        chain[method] = () => chain;
      }
      chain.maybeSingle = () =>
        Promise.resolve(
          failed.has(name)
            ? { data: null, error: { message: `read failed: ${table}` } }
            : { data: (options.rows?.[name] ?? [])[0] ?? null, error: null },
        );
      return chain;
    },
  };
  return client;
}

function run(options: FakeOptions, fromPhase = 2, toPhase = 3) {
  const client = fakeClient(options);
  return {
    client,
    result: evaluateGate(CTX as never, MOVE_ID, fromPhase, toPhase, {
      supabase: client as never,
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getProgramByIdMock.mockResolvedValue({
    id: MOVE_ID,
    currentPhase: 2,
    charter: null,
    problemStatement: null,
    targetOutcome: null,
    timelineHorizon: null,
    archetype: null,
  });
  listApprovedPhaseEvidenceMock.mockResolvedValue([]);
  loadApprovedMoveEvidenceSnapshotMock.mockResolvedValue({
    approvedEvidenceCount: 0,
    revision: "r1",
    revisionByPhase: {},
  });
});

describe("evaluateGate with an unreadable state read", () => {
  it("refuses with ONE named check instead of a criterion ladder", async () => {
    const { result } = run({ fail: ["deliverables_v2"] });
    const gate = await result;
    expect(gate.pass).toBe(false);
    expect(gate.failedChecks).toHaveLength(1);
    expect(gate.failedChecks[0]?.check).toBe(GATE_STATE_UNREADABLE_CHECK);
    expect(gate.failedChecks[0]?.severity).toBe("hard");
    expect(gate.requiresApproval).toBe(false);
    expect(gate.approverRole).toBeNull();
  });

  it("does not report any deliverable criterion as failed", async () => {
    const gate = await run({ fail: ["deliverables_v2"] }).result;
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain("discovery_report_signed_off");
    expect(keys).not.toContain("p2_readiness_cleared");
    expect(keys).not.toContain("discovery_stakeholders_named");
  });

  it("states the read failure rather than an absence", async () => {
    const gate = await run({ fail: ["deliverables_v2"] }).result;
    const reason = gate.failedChecks[0]?.reason ?? "";
    expect(reason).toMatch(/could not be evaluated/i);
    expect(reason).toContain("the Move's deliverable records");
    expect(reason).toMatch(/NOT a finding that a document is missing/);
  });

  it("never prescribes regenerating, which would un-sign accepted work", async () => {
    // The pre-fix sentence for this exact state told a reviewer to regenerate
    // the Discovery Report; `programsWriteAdapter` resets an existing
    // deliverable to `status = 'draft'`, so that advice un-signs the document
    // the sibling HARD criterion in the SAME rule waits for.
    const gate = await run({
      fail: ["deliverable_versions"],
      rows: {
        deliverables_v2: [
          {
            id: "d-1",
            deliverable_type_key: "discovery_report",
            status: "signed_off",
          },
        ],
      },
    }).result;
    const reason = gate.failedChecks[0]?.reason ?? "";
    expect(reason).toMatch(/Do not regenerate or re-upload/);
    expect(reason).not.toMatch(/Regenerate the Discovery Report/);
  });

  it.each<[Table, string]>([
    ["deliverables_v2", "the Move's deliverable records"],
    ["program_modules", "the phase capture modules"],
    ["engagement_participants", "the engagement participants"],
    ["program_approval_requests", "the origination approval request"],
    ["program_milestones", "the Move's milestones"],
  ])("refuses when the %s read fails", async (table, label) => {
    const gate = await run({ fail: [table] }).result;
    expect(gate.failedChecks).toHaveLength(1);
    expect(gate.failedChecks[0]?.check).toBe(GATE_STATE_UNREADABLE_CHECK);
    expect(gate.failedChecks[0]?.reason).toContain(label);
  });

  it("refuses when the latest-version read fails, naming that read", async () => {
    // Reached only when a discovery-report row exists, so the row is seeded.
    const gate = await run({
      fail: ["deliverable_versions"],
      rows: {
        deliverables_v2: [
          {
            id: "d-1",
            deliverable_type_key: "discovery_report",
            status: "signed_off",
          },
        ],
      },
    }).result;
    expect(gate.failedChecks[0]?.check).toBe(GATE_STATE_UNREADABLE_CHECK);
    expect(gate.failedChecks[0]?.reason).toContain(
      "the Discovery Report's latest version",
    );
  });

  it("refuses when the linked-artifact read fails", async () => {
    const gate = await run({
      fail: ["move_artifacts"],
      rows: {
        deliverables_v2: [
          {
            id: "d-1",
            deliverable_type_key: "discovery_report",
            status: "signed_off",
            approved_artifact_id: "a-1",
          },
        ],
      },
    }).result;
    expect(gate.failedChecks[0]?.check).toBe(GATE_STATE_UNREADABLE_CHECK);
    expect(gate.failedChecks[0]?.reason).toContain(
      "the artifacts those deliverables point at",
    );
  });

  it("names every failed read in one sentence", async () => {
    const gate = await run({
      fail: ["deliverables_v2", "program_modules"],
    }).result;
    const reason = gate.failedChecks[0]?.reason ?? "";
    expect(reason).toContain("the Move's deliverable records");
    expect(reason).toContain("the phase capture modules");
  });
});

describe("evaluateGate when every state read lands", () => {
  it("evaluates the criterion ladder as before — empty state fails per criterion", async () => {
    // The regression direction. An EMPTY read is a legitimate state and must
    // keep producing concrete per-criterion failures, not the read refusal.
    const gate = await run({}).result;
    expect(gate.pass).toBe(false);
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
    expect(keys).toContain("discovery_report_signed_off");
    expect(gate.failedChecks.length).toBeGreaterThan(1);
  });

  it("still issues the reads it always did", async () => {
    const { client, result } = run({});
    await result;
    expect(client.tablesRead).toContain("deliverables_v2");
    expect(client.tablesRead).toContain("program_modules");
    expect(client.tablesRead).toContain("engagement_participants");
    expect(client.tablesRead).toContain("program_approval_requests");
    expect(client.tablesRead).toContain("program_milestones");
  });

  it("a read that was never issued does not refuse the gate", async () => {
    // No deliverable rows means neither latest-version read runs, and no
    // `approved_artifact_id` means the linked-artifact read is skipped. None of
    // those is a failure.
    const { client, result } = run({});
    const gate = await result;
    expect(client.tablesRead).not.toContain("deliverable_versions");
    expect(client.tablesRead).not.toContain("move_artifacts");
    expect(
      gate.failedChecks.some(
        (check) => check.check === GATE_STATE_UNREADABLE_CHECK,
      ),
    ).toBe(false);
  });
});

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
  | "move_artifacts"
  | "program_evidence_items";

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

/**
 * The NINTH read. `program_evidence_items` is reached from inside the criterion
 * loop, not with the eight hoisted reads, so the first pass at this guard did
 * not classify it. It is the ingested-evidence arm of `discovery_notes_ingested`
 * — a HARD criterion on the P2→P3 gate, which is the demo walk's own blocking
 * transition.
 */
describe("evaluateGate when the ingested-evidence read fails", () => {
  it("refuses by name rather than reporting notes as un-ingested", async () => {
    const gate = await run({ fail: ["program_evidence_items"] }).result;
    expect(gate.pass).toBe(false);
    expect(gate.failedChecks).toHaveLength(1);
    expect(gate.failedChecks[0]?.check).toBe(GATE_STATE_UNREADABLE_CHECK);
    expect(gate.failedChecks[0]?.severity).toBe("hard");
    expect(gate.failedChecks[0]?.reason).toContain(
      "the Move's ingested discovery evidence",
    );
  });

  it("does not report discovery_notes_ingested as a failed criterion", async () => {
    // The pre-fix sentence. Its remedy is to upload or re-ingest notes that
    // may well already be there, and the read never said they were not.
    const gate = await run({ fail: ["program_evidence_items"] }).result;
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain("discovery_notes_ingested");
    expect(gate.failedChecks[0]?.reason).not.toMatch(
      /Discovery notes or workshop logs ingested/,
    );
  });

  it("names ONLY the evidence read when the other eight landed", async () => {
    const gate = await run({ fail: ["program_evidence_items"] }).result;
    const reason = gate.failedChecks[0]?.reason ?? "";
    expect(reason).toContain("the Move's ingested discovery evidence");
    expect(reason).not.toContain("the Move's deliverable records");
    expect(reason).not.toContain("the phase capture modules");
  });

  it("still refuses — an unread arm cannot clear a HARD criterion", async () => {
    const gate = await run({ fail: ["program_evidence_items"] }).result;
    expect(gate.pass).toBe(false);
    expect(gate.requiresApproval).toBe(false);
    expect(gate.approverRole).toBeNull();
  });

  it("does NOT refuse when another arm already cleared the criterion", async () => {
    // The arms are OR'd, so an unreadable evidence table is only decisive when
    // nothing else answered. A completed ingest module clears the criterion
    // without the read, and the gate must then fail on its OTHER criteria with
    // concrete reasons rather than collapse into the read refusal.
    const { client, result } = run({
      fail: ["program_evidence_items"],
      rows: {
        program_modules: [
          {
            id: "m-1",
            phase: 2,
            module_key: "discovery_notes_ingest",
            status: "completed",
          },
        ],
      },
    });
    const gate = await result;
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
    expect(keys).not.toContain("discovery_notes_ingested");
    expect(client.tablesRead).not.toContain("program_evidence_items");
  });

  it("clears the criterion from an ingested row when the read lands", async () => {
    // The healthy direction, and the one the demo walk uses.
    const gate = await run({
      rows: {
        program_evidence_items: [{ id: "e-1" }],
      },
    }).result;
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
    expect(keys).not.toContain("discovery_notes_ingested");
  });

  it("reports the criterion, not the read refusal, on an EMPTY evidence read", async () => {
    // An empty read is a legitimate state: this Move really ingested nothing.
    const gate = await run({ rows: { program_evidence_items: [] } }).result;
    const keys = gate.failedChecks.map((check) => check.check);
    expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
    expect(keys).toContain("discovery_notes_ingested");
  });

  it("issues the evidence read when it is the deciding arm", async () => {
    const { client, result } = run({});
    await result;
    expect(client.tablesRead).toContain("program_evidence_items");
  });
});

/**
 * The reorder's own regression surface.
 *
 * Moving the `program_evidence_items` read behind the four in-memory arms is
 * what makes an unreadable evidence table refuse ONLY when it decides the
 * criterion. `||` is commutative over side-effect-free predicates, so the
 * verdict cannot change — but that only holds if all four arms survived the
 * move, so each is exercised on its own and each must skip the read.
 */
describe("discovery_notes_ingested arms that answer without the read", () => {
  const ARMS: Array<[string, FakeOptions]> = [
    [
      "an ingested discovery-notes deliverable",
      {
        rows: {
          deliverables_v2: [
            {
              id: "d-n",
              deliverable_type_key: "discovery_notes",
              status: "draft",
            },
          ],
        },
      },
    ],
    [
      "a completed notes-ingest module",
      {
        rows: {
          program_modules: [
            {
              id: "m-1",
              phase: 2,
              module_key: "workshop_notes_ingest",
              status: "completed",
            },
          ],
        },
      },
    ],
    [
      "a discovery report carrying workshop evidence",
      {
        rows: {
          deliverables_v2: [
            {
              id: "d-r",
              deliverable_type_key: "discovery_report",
              status: "signed_off",
              current_version: 1,
            },
          ],
          deliverable_versions: [
            {
              id: "v-1",
              version: 1,
              generated_at: "2026-10-01T00:00:00.000Z",
              content:
                "Workshop with attendees recorded the baseline decision and one contradiction.",
            },
          ],
        },
      },
    ],
  ];

  it.each(ARMS)(
    "%s clears it without reading the table",
    async (_, options) => {
      const { client, result } = run(options);
      const gate = await result;
      const keys = gate.failedChecks.map((check) => check.check);
      expect(keys).not.toContain("discovery_notes_ingested");
      expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
      expect(client.tablesRead).not.toContain("program_evidence_items");
    },
  );

  it.each(ARMS)(
    "%s survives an unreadable evidence table",
    async (_, options) => {
      // The property the reorder buys: a read that cannot decide cannot refuse.
      const gate = await run({
        ...options,
        fail: ["program_evidence_items"],
      }).result;
      const keys = gate.failedChecks.map((check) => check.check);
      expect(keys).not.toContain(GATE_STATE_UNREADABLE_CHECK);
      expect(keys).not.toContain("discovery_notes_ingested");
    },
  );
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

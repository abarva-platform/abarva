/**
 * The P0 close must not draw a write from a state it failed to read.
 *
 * `closeP0OnApproval` is the only path that closes P0 — it ensures the
 * signable origination brief, records the approving user as its signer,
 * evaluates the 0->1 gate and advances. It never throws, because the approval
 * it rides on must stand regardless, so everything it refuses travels back in
 * its result.
 *
 * Both of its reads destructured `{ data }` alone. `postgresCompat`'s builder
 * catches everything in `execute()` and resolves `{ data: null, error }`
 * rather than throwing, so a failed read, a permission denial and a genuinely
 * empty result all arrive as `data: null`:
 *
 *   • The `engagements` read's failure became `move_not_readable`, whose
 *     sentence describes only the absent case ("may have been archived") —
 *     telling a reader hitting a read outage that the Move is gone, and
 *     steering them off the one action that works. It is now
 *     `move_state_unreadable`.
 *
 *   • The existing-brief read inside `ensureOriginationBrief` is a DEDUPE
 *     read, and its two writes are reached only when it finds nothing. So a
 *     failed read did not stop at all: it created a SECOND origination brief,
 *     the close signed that one, and the whole call reported `advanced` — a
 *     duplicate signed document reported as a clean success, on the demo
 *     walk's first gate crossing, with no control on any surface that removes
 *     either copy. It is now `brief_not_readable`, and nothing is written.
 *
 * The decisive assertions below are the WRITE assertions: an outcome value can
 * be produced by any branch, but "no deliverable was drafted, published,
 * signed or advanced" is the behaviour the duplicate consisted of.
 */

const draftModuleDeliverableMock = jest.fn();
const publishDeliverableMock = jest.fn();
const signOffDeliverableMock = jest.fn();
const advancePhaseMock = jest.fn();
const evaluateGateMock = jest.fn();
const saveGateDecisionArtifactMock = jest.fn();
const sendMoveProgressUpdateMock = jest.fn();

const PROGRAM_ID = "move-1";
const CLIENT_ID = "client-1";
const DECIDER = "user-1";

type TableResult = { data: unknown; error: { message: string } | null };

/** Every builder opened, in order, with the operation it performed. */
const issued: Array<{ table: string; op: string }> = [];
let selectResults: Record<string, TableResult> = {};

function builder(table: string) {
  const self: Record<string, unknown> = {};
  const chain = () => self as never;
  for (const method of ["select", "eq", "in", "order", "limit", "is", "gte"]) {
    self[method] = chain;
  }
  const settle = () =>
    Promise.resolve(
      selectResults[table] ?? ({ data: null, error: null } as TableResult),
    );
  self.maybeSingle = settle;
  self.single = settle;
  self.then = (onFulfilled: (value: TableResult) => unknown) =>
    settle().then(onFulfilled);
  for (const op of ["insert", "update", "upsert", "delete"]) {
    self[op] = () => {
      issued.push({ table, op });
      return self as never;
    };
  }
  return self;
}

const fromMock = jest.fn((table: string) => {
  issued.push({ table, op: "open" });
  return builder(table);
});

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
  getAzureReadFluentClient: () => ({ from: fromMock }),
}));

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable: (...args: unknown[]) =>
    draftModuleDeliverableMock(...args),
}));

jest.mock("@/lib/programs/mutations", () => ({
  publishDeliverable: (...args: unknown[]) => publishDeliverableMock(...args),
  signOffDeliverable: (...args: unknown[]) => signOffDeliverableMock(...args),
  advancePhase: (...args: unknown[]) => advancePhaseMock(...args),
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: (...args: unknown[]) => evaluateGateMock(...args),
}));

jest.mock("@/lib/programs/deliverables/gate-override-artifact", () => ({
  saveGateDecisionArtifact: (...args: unknown[]) =>
    saveGateDecisionArtifactMock(...args),
}));

jest.mock("@/lib/programs/move-progress-notifications", () => ({
  sendMoveProgressUpdate: (...args: unknown[]) =>
    sendMoveProgressUpdateMock(...args),
}));

import {
  closeP0OnApproval,
  ensureOriginationBrief,
} from "../origination-close";

const MOVE_ROW = {
  id: PROGRAM_ID,
  client_id: CLIENT_ID,
  name: "Example initiative",
  current_phase: 0,
  problem_statement: "A stated problem.",
  charter: { target_outcome: "A stated outcome." },
};

/** The writes the close performs, in order, past the two reads. */
function writesIssued(): string[] {
  return issued.filter((i) => i.op !== "open").map((i) => `${i.table}.${i.op}`);
}

function close() {
  return closeP0OnApproval({
    programId: PROGRAM_ID,
    tenantKey: "example",
    deciderUserId: DECIDER,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  issued.length = 0;
  selectResults = {};
  draftModuleDeliverableMock.mockResolvedValue({ deliverableId: "new-brief" });
  publishDeliverableMock.mockResolvedValue(true);
  signOffDeliverableMock.mockResolvedValue(true);
  advancePhaseMock.mockResolvedValue({
    programId: PROGRAM_ID,
    newPhase: 1,
    snapshotId: "snap-1",
  });
  evaluateGateMock.mockResolvedValue({ failedChecks: [] });
  saveGateDecisionArtifactMock.mockResolvedValue(undefined);
  sendMoveProgressUpdateMock.mockResolvedValue(undefined);
});

describe("a failed existing-brief read refuses instead of duplicating", () => {
  it("does not draft, publish or sign anything when the dedupe read fails", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: null, error: { message: "connection reset" } },
    };

    const result = await close();

    expect(result.advanced).toBe(false);
    expect(result.outcome).toBe("brief_not_readable");
    // The duplicate consisted of exactly these calls. None may happen.
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
    expect(publishDeliverableMock).not.toHaveBeenCalled();
    expect(signOffDeliverableMock).not.toHaveBeenCalled();
    expect(advancePhaseMock).not.toHaveBeenCalled();
    expect(writesIssued()).toEqual([]);
  });

  it("does not report the refusal as a brief that could not be created", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: null, error: { message: "timeout" } },
    };

    const result = await close();

    // `brief_not_created` means the read succeeded and the CREATE failed; its
    // sentence sends the reader to re-check the origination capture, which is
    // the wrong instruction for a read outage.
    expect(result.outcome).not.toBe("brief_not_created");
    expect(result.briefEnsured).toBe(false);
    expect(result.briefSigned).toBe(false);
  });

  it("still signs the brief that is already there when the read succeeds", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: { id: "existing-brief" }, error: null },
    };

    const result = await close();

    expect(result.advanced).toBe(true);
    expect(result.outcome).toBe("advanced");
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
    expect(signOffDeliverableMock).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM_ID,
      "existing-brief",
      expect.anything(),
    );
  });

  it("still creates and signs a first brief when the read succeeds empty", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: null, error: null },
    };

    const result = await close();

    expect(result.advanced).toBe(true);
    expect(result.briefEnsured).toBe(true);
    expect(draftModuleDeliverableMock).toHaveBeenCalledTimes(1);
    expect(signOffDeliverableMock).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM_ID,
      "new-brief",
      expect.anything(),
    );
  });

  it("reports a create that returned no id separately from an unreadable read", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: null, error: null },
    };
    draftModuleDeliverableMock.mockResolvedValue({ deliverableId: null });

    const result = await close();

    expect(result.outcome).toBe("brief_not_created");
    // The create was attempted, so publishing it must not be.
    expect(publishDeliverableMock).not.toHaveBeenCalled();
    expect(signOffDeliverableMock).not.toHaveBeenCalled();
  });
});

describe("ensureOriginationBrief names which of the two no-id states it is in", () => {
  it("returns `unreadable` on a failed read, with no create", async () => {
    selectResults = {
      deliverables_v2: { data: null, error: { message: "permission denied" } },
    };

    const outcome = await ensureOriginationBrief(
      { clientId: CLIENT_ID, userId: DECIDER } as never,
      PROGRAM_ID,
      MOVE_ROW as never,
    );

    expect(outcome).toEqual({ outcome: "unreadable" });
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
  });

  it("returns `not_created` when the read was clean and the create gave no id", async () => {
    selectResults = { deliverables_v2: { data: null, error: null } };
    draftModuleDeliverableMock.mockResolvedValue({ deliverableId: "" });

    const outcome = await ensureOriginationBrief(
      { clientId: CLIENT_ID, userId: DECIDER } as never,
      PROGRAM_ID,
      MOVE_ROW as never,
    );

    expect(outcome).toEqual({ outcome: "not_created" });
  });

  it("distinguishes an existing brief from one it created", async () => {
    selectResults = {
      deliverables_v2: { data: { id: "existing-brief" }, error: null },
    };
    const existing = await ensureOriginationBrief(
      { clientId: CLIENT_ID, userId: DECIDER } as never,
      PROGRAM_ID,
      MOVE_ROW as never,
    );
    expect(existing).toEqual({
      outcome: "existing",
      deliverableId: "existing-brief",
    });

    selectResults = { deliverables_v2: { data: null, error: null } };
    const created = await ensureOriginationBrief(
      { clientId: CLIENT_ID, userId: DECIDER } as never,
      PROGRAM_ID,
      MOVE_ROW as never,
    );
    expect(created).toEqual({
      outcome: "created",
      deliverableId: "new-brief",
    });
  });
});

describe("a failed Move read is not reported as a Move that does not exist", () => {
  it("names the read outage, and writes nothing", async () => {
    selectResults = {
      engagements: { data: null, error: { message: "connection reset" } },
    };

    const result = await close();

    expect(result.advanced).toBe(false);
    expect(result.outcome).toBe("move_state_unreadable");
    expect(result.movePhase).toBeNull();
    expect(writesIssued()).toEqual([]);
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
  });

  it("does not open the deliverables read at all when the Move read failed", async () => {
    selectResults = {
      engagements: { data: null, error: { message: "connection reset" } },
    };

    await close();

    expect(issued.map((i) => i.table)).toEqual(["engagements"]);
  });

  it("keeps `move_not_readable` for a Move that genuinely is not there", async () => {
    selectResults = { engagements: { data: null, error: null } };

    const result = await close();

    expect(result.outcome).toBe("move_not_readable");
  });

  it("still reports an already-advanced Move as the no-op it is", async () => {
    selectResults = {
      engagements: { data: { ...MOVE_ROW, current_phase: 3 }, error: null },
    };

    const result = await close();

    expect(result.outcome).toBe("already_past_p0");
    expect(result.movePhase).toBe(3);
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
  });

  it("still reports a real hard-gate block, with the brief signed", async () => {
    selectResults = {
      engagements: { data: MOVE_ROW, error: null },
      deliverables_v2: { data: { id: "existing-brief" }, error: null },
    };
    evaluateGateMock.mockResolvedValue({
      failedChecks: [{ check: "program_seed_recorded", severity: "hard" }],
    });

    const result = await close();

    expect(result.outcome).toBe("gate_hard_blocked");
    expect(result.blockedBy).toEqual(["program_seed_recorded"]);
    expect(result.briefSigned).toBe(true);
    expect(advancePhaseMock).not.toHaveBeenCalled();
  });
});

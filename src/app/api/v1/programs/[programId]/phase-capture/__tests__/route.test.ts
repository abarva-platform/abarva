/**
 * The first route-level coverage of `POST .../phase-capture` — the capture
 * autosave, the single most-used control on the phase walk. Every field of
 * every phase is persisted through here, on a debounce, while the reader types.
 *
 * What these cases pin is the snapshot read. `loadCaptureSnapshot` performs
 * three data-plane reads and used to sit behind a swallowing catch that
 * substituted a snapshot asserting the Move had no saved answers at all. The
 * route then reported that substitution to the reader down two paths — a
 * `stale_revision` 409 carrying `values: {}`, and, when the optional revision
 * fence was not sent, a 200 reporting every unsent section as empty — and both
 * client autosave call sites in `MovesPhaseStandaloneClient` adopt those bodies
 * as the authoritative persisted state. See
 * `src/lib/programs/phase-capture-snapshot-refusal.ts` for the full reckoning.
 *
 * The healthy-snapshot cases are here for the same reason: a refusal arm is
 * only worth having if the success path it guards still works, and until this
 * suite nothing at route level said it did.
 */

import {
  PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL,
  PHASE_CAPTURE_SNAPSHOT_UNREADABLE_ERROR,
  PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS,
} from "@/lib/programs/phase-capture-snapshot-refusal";
import { NextRequest } from "next/server";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";

const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockListApprovedPhaseEvidence = jest.fn();
const mockWriteProgramAuditLogBestEffort = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockSbFrom = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: mockSbFrom }),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
  getModuleState: (ctx: unknown, programId: string) =>
    mockGetModuleState(ctx, programId),
}));

jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  listApprovedPhaseEvidence: (...args: unknown[]) =>
    mockListApprovedPhaseEvidence(...args),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: (...args: unknown[]) =>
    mockWriteProgramAuditLogBestEffort(...args),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (...args: unknown[]) => mockIsFeatureEnabled(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET, POST } = require("../route") as typeof import("../route");

const params = Promise.resolve({ programId: "prog-1" });

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/phase-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** A P2 section that is persisted with a real answer. */
const SAVED_P2: Record<string, string> = {
  current_state_findings: "Three handoffs measured across the intake queue.",
  baseline_metrics: "Mean cycle time 14 days across the last two quarters.",
  gaps_root_causes: "Two of the three handoffs re-enter the same spreadsheet.",
};

function savedModules(): Array<{
  moduleKey: string;
  status: string;
  state: Record<string, unknown>;
}> {
  return Object.entries(SAVED_P2).map(([key, value]) => ({
    moduleKey: phaseCaptureModuleKey(2, key),
    status: "in_progress",
    state: { value },
  }));
}

/**
 * The revision a client holds after loading the page against `savedModules()`.
 * The route's GET derives it from one entry per declared P2 section, so the
 * blanks are part of the hash.
 */
function savedRevision(): string {
  const declared = [
    "current_state_findings",
    "baseline_metrics",
    "gaps_root_causes",
    "process_handoffs",
    "data_quality_governance",
    "evidence_confidence",
    "recommendation",
    "solution_route_validation",
  ];
  return computeCaptureRevision(
    Object.fromEntries(declared.map((key) => [key, SAVED_P2[key] ?? ""])),
  );
}

/** A minimal fluent write client that records every table it is asked for. */
function stubWriteClient(): { tables: string[] } {
  const tables: string[] = [];
  mockSbFrom.mockImplementation((table: string) => {
    tables.push(table);
    const selectChain = {
      select: () => selectChain,
      eq: () => selectChain,
      in: () => Promise.resolve({ data: [], error: null }),
    };
    const updateChain = {
      eq: () => updateChain,
      then: (resolve: (v: unknown) => unknown) =>
        resolve({ data: null, error: null }),
    };
    return {
      ...selectChain,
      update: () => updateChain,
      insert: () => Promise.resolve({ error: null }),
    };
  });
  return { tables };
}

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  // The route logs the swallowed-no-more read failure for the operator. That
  // is deliberate and these cases drive it on purpose, so the log is captured
  // rather than printed over the run.
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-1",
    clientKey: "demo",
    userId: "user-1",
    email: "reader@example.com",
  });
  mockGetProgramById.mockResolvedValue({
    id: "prog-1",
    currentPhase: 2,
    charter: {},
    problemStatement: "",
    targetOutcome: "",
  });
  mockGetModuleState.mockResolvedValue(savedModules());
  mockListApprovedPhaseEvidence.mockResolvedValue([]);
  mockWriteProgramAuditLogBestEffort.mockResolvedValue(undefined);
  mockIsFeatureEnabled.mockReturnValue(false);
  stubWriteClient();
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("POST .../phase-capture · the saved answers cannot be read", () => {
  it("answers a named read failure instead of a revision conflict", async () => {
    mockGetModuleState.mockRejectedValue(new Error("data plane unavailable"));

    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: savedRevision(),
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    // The literal, not the constant. Asserting only
    // PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS moves with the value it is
    // supposed to pin, so re-pointing it at 409 failed nothing — and 409 is
    // precisely the status the client's adopt branch keys on.
    expect(res.status).toBe(503);
    expect(res.status).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS);
    expect(body.error).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_ERROR);
    expect(body.detail).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL);
    // The whole point of the arm: the reader's page was loaded against real
    // saved answers, and a read failure must not be reported as "this page was
    // loaded before the capture state changed".
    expect(body.error).not.toBe("stale_revision");
  });

  it("does not answer on the status the client adopts values from", async () => {
    // `MovesPhaseStandaloneClient` reaches its adopt branch only on
    // `res.status === 409`. A read failure answering 409 would put this body
    // one field away from blanking a reader's page, so the status is a
    // load-bearing part of the contract and is pinned by its value.
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS).not.toBe(409);
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS).toBe(503);
  });

  it("carries nothing a client could adopt as the persisted state", async () => {
    mockGetModuleState.mockRejectedValue(new Error("data plane unavailable"));

    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: savedRevision(),
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    // Both autosave call sites in MovesPhaseStandaloneClient adopt a body as
    // authoritative only when it carries `values` AND `revision`
    // (`setPersistedPhaseCaptureValues(body.values)` plus
    // `setPhaseCaptureRevision(body.revision)`). Their absence here is what
    // makes this body structurally unable to blank a reader's answers, so it is
    // part of the contract rather than an omission.
    expect(body).not.toHaveProperty("values");
    expect(body).not.toHaveProperty("revision");
    expect(body).not.toHaveProperty("capture");
    expect(body).not.toHaveProperty("currentRevision");
  });

  it("refuses the same way when the optional revision fence is not sent", async () => {
    mockGetModuleState.mockRejectedValue(new Error("data plane unavailable"));

    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    // `expectedRevision` is optional, so this request used to skip the fence
    // entirely and get a 200 whose `values` reported every section the request
    // did not contain as empty — a success response contradicting the stored
    // state.
    expect(res.status).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS);
    expect(body.ok).toBeUndefined();
    expect(body).not.toHaveProperty("values");
  });

  it("writes nothing and logs no edit", async () => {
    mockGetModuleState.mockRejectedValue(new Error("data plane unavailable"));
    const writer = stubWriteClient();

    await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: savedRevision(),
      }) as never,
      { params },
    );

    expect(writer.tables).toEqual([]);
    expect(mockSbFrom).not.toHaveBeenCalled();
    // The substituted snapshot made `diffCaptureValues` report every submitted
    // field as changed, so the audit trail recorded a real edit against a write
    // that never happened.
    expect(mockWriteProgramAuditLogBestEffort).not.toHaveBeenCalled();
  });

  it("refuses when the approved-evidence read is what fails", async () => {
    // The snapshot makes three reads, not one. A failure in either
    // listApprovedPhaseEvidence call reaches the same substitution.
    mockListApprovedPhaseEvidence.mockRejectedValue(new Error("rls denied"));

    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: savedRevision(),
      }) as never,
      { params },
    );

    expect(res.status).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS);
    expect(mockSbFrom).not.toHaveBeenCalled();
  });

  it("names the read failure rather than leaking its message", async () => {
    mockGetModuleState.mockRejectedValue(
      new Error("pg: connection terminated unexpectedly at 10.1.2.3:5432"),
    );

    const res = await POST(
      req({ phase: 2, sections: { process_handoffs: "x" } }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(JSON.stringify(body)).not.toContain("10.1.2.3");
    expect(JSON.stringify(body)).not.toContain("connection terminated");
    expect(body.detail).toBe(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL);
    // The operator still gets the cause; only the reader is spared it.
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("capture snapshot unreadable"),
      expect.objectContaining({
        message: expect.stringContaining("connection terminated"),
      }),
    );
  });

  it("states that nothing was saved and that the edit survives", async () => {
    // The sentence has to answer three things for a reader mid-keystroke: what
    // failed, whether their earlier answers are gone, and what to do.
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL).toMatch(
      /could not be read/i,
    );
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL).toMatch(/not saved/i);
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL).toMatch(
      /nothing already saved was changed/i,
    );
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL).toMatch(/saving again/i);
    // It must not claim the state moved — a read failure cannot know that, and
    // that false claim is the defect this replaces.
    expect(PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL).not.toMatch(
      /before the capture state changed/i,
    );
  });
});

describe("POST .../phase-capture · a readable snapshot still behaves", () => {
  it("accepts an edit and reports the stored values", async () => {
    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: savedRevision(),
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(body.changedFields).toEqual(["process_handoffs"]);
    // The answers the reader already had are reported back unchanged, which is
    // exactly what the substituted snapshot could not do.
    expect((body.values as Record<string, string>).current_state_findings).toBe(
      SAVED_P2.current_state_findings,
    );
    expect((body.values as Record<string, string>).process_handoffs).toBe(
      "Intake to triage to assignment.",
    );
  });

  it("still fences a genuinely stale revision, with values to recover from", async () => {
    const res = await POST(
      req({
        phase: 2,
        sections: { process_handoffs: "Intake to triage to assignment." },
        expectedRevision: "sha256:not-the-current-revision",
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(409);
    expect(body.error).toBe("stale_revision");
    // The real conflict path is the one case where handing the client
    // authoritative values IS correct — it is how the page recovers. The fix
    // must not have taken that away.
    expect((body.values as Record<string, string>).current_state_findings).toBe(
      SAVED_P2.current_state_findings,
    );
    expect(body.revision).toBe(savedRevision());
    expect(mockSbFrom).not.toHaveBeenCalled();
  });

  it("answers 404 for a Move it cannot read at all", async () => {
    mockGetProgramById.mockResolvedValue(null);

    const res = await POST(req({ phase: 2, sections: {} }) as never, {
      params,
    });

    expect(res.status).toBe(404);
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });

  it("rejects a phase outside [0,5] before reading anything", async () => {
    const res = await POST(req({ phase: 9, sections: {} }) as never, {
      params,
    });
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body.error).toBe("bad_request");
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });
});

describe("POST .../phase-capture · step-page records", () => {
  const RECORD = JSON.stringify({
    kind: "design_traceability",
    version: 1,
    links: [
      {
        causeId: "RC-1",
        cause: "No ownership",
        rank: 1,
        status: "accepted",
        element: "Stewardship council",
      },
    ],
  });
  const p3Revision = (extra: Record<string, string> = {}) =>
    computeCaptureRevision({
      ...Object.fromEntries(
        getPhaseCaptureSections(3).map((section) => [section.key, ""]),
      ),
      ...extra,
    });

  function recordingClient() {
    const inserts: Array<Record<string, unknown>> = [];
    mockSbFrom.mockImplementation(() => {
      const selectChain = {
        select: () => selectChain,
        eq: () => selectChain,
        in: () => Promise.resolve({ data: [], error: null }),
      };
      const updateChain = {
        eq: () => updateChain,
        then: (resolve: (v: unknown) => unknown) =>
          resolve({ data: null, error: null }),
      };
      return {
        ...selectChain,
        update: () => updateChain,
        insert: (row: Record<string, unknown>) => {
          inserts.push(row);
          return Promise.resolve({ error: null });
        },
      };
    });
    return inserts;
  }

  beforeEach(() => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 3,
      charter: {},
      problemStatement: "",
      targetOutcome: "",
    });
    mockGetModuleState.mockResolvedValue([]);
  });

  it("stores P3's traceability record beside the answers, as a record, not a question", async () => {
    const inserts = recordingClient();
    const res = await POST(
      req({
        phase: 3,
        sections: { design_traceability: RECORD },
        expectedRevision: p3Revision(),
      }) as never,
      { params },
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.changedFields).toEqual(["design_traceability"]);
    expect((body.values as Record<string, string>).design_traceability).toBe(
      RECORD,
    );
    const written = inserts.find(
      (row) =>
        row.module_key === phaseCaptureModuleKey(3, "design_traceability"),
    );
    expect(written).toMatchObject({
      phase_number: 3,
      state_jsonb: expect.objectContaining({
        value: RECORD,
        step_record: true,
      }),
    });
    // Never counted as a capture question.
    const capture = body.capture as { sections: Array<{ key: string }> };
    expect(capture.sections.map((s) => s.key)).not.toContain(
      "design_traceability",
    );
    // The revision a client echoes back covers the stored record.
    expect(body.revision).toBe(p3Revision({ design_traceability: RECORD }));
  });

  it("completes a saved record with the phase, so the next phase inherits it", async () => {
    const inserts = recordingClient();
    mockGetModuleState.mockResolvedValue([
      {
        moduleKey: phaseCaptureModuleKey(3, "design_traceability"),
        status: "in_progress",
        state: { value: RECORD },
      },
    ]);
    const answers = Object.fromEntries(
      getPhaseCaptureSections(3).map((section) => [
        section.key,
        `Answer for ${section.key}.`,
      ]),
    );
    const res = await POST(
      req({
        phase: 3,
        complete: true,
        sections: answers,
        expectedRevision: p3Revision({ design_traceability: RECORD }),
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    const written = inserts.find(
      (row) =>
        row.module_key === phaseCaptureModuleKey(3, "design_traceability"),
    );
    expect(written).toMatchObject({
      status: "completed",
      completed_at: expect.any(String),
      state_jsonb: expect.objectContaining({
        value: RECORD,
        step_record: true,
      }),
    });
  });

  it("does not create an empty record row when the phase completes without one", async () => {
    const inserts = recordingClient();
    const answers = Object.fromEntries(
      getPhaseCaptureSections(3).map((section) => [
        section.key,
        `Answer for ${section.key}.`,
      ]),
    );
    const res = await POST(
      req({
        phase: 3,
        complete: true,
        sections: answers,
        expectedRevision: p3Revision(),
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    expect(
      inserts.some(
        (row) =>
          row.module_key === phaseCaptureModuleKey(3, "design_traceability"),
      ),
    ).toBe(false);
  });

  it("keeps a record in progress while the phase is not being completed", async () => {
    const inserts = recordingClient();
    await POST(
      req({
        phase: 3,
        sections: { design_traceability: RECORD },
        expectedRevision: p3Revision(),
      }) as never,
      { params },
    );
    expect(
      inserts.find(
        (row) =>
          row.module_key === phaseCaptureModuleKey(3, "design_traceability"),
      ),
    ).toMatchObject({ status: "in_progress", completed_at: null });
  });

  it("leaves a Move without a record on the revision it had", async () => {
    recordingClient();
    const res = await POST(
      req({
        phase: 3,
        sections: { solution_approach: "Governed medallion layers." },
        expectedRevision: p3Revision(),
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body.values as object)).not.toContain(
      "design_traceability",
    );
  });

  it("fences a stale write against a saved record", async () => {
    recordingClient();
    mockGetModuleState.mockResolvedValue([
      {
        moduleKey: phaseCaptureModuleKey(3, "design_traceability"),
        status: "in_progress",
        state: { value: RECORD },
      },
    ]);
    const res = await POST(
      req({
        phase: 3,
        sections: {
          design_traceability: RECORD.replace("Stewardship", "Steward"),
        },
        expectedRevision: p3Revision(),
      }) as never,
      { params },
    );
    expect(res.status).toBe(409);
  });
});

describe("POST .../phase-capture · P4 value plan behind moves_value_engine_v1", () => {
  // A synthetic structured value model whose attribution is an assumption
  // register row; nothing in this increment resolves register rows, so the
  // engine cannot evaluate it.
  const UNRESOLVED_MODEL = JSON.stringify({
    kind: "value_model",
    version: 1,
    case: {
      horizonYears: 2,
      discountRate: { kind: "literal", value: 0.08, source: "synthetic" },
      cost: { kind: "estimate", baseCents: 10_000_000 },
      levers: [
        {
          id: "L1",
          name: "Premium labour",
          conversion: "cost_reduction",
          driver: {
            name: "premium labour spend reduced",
            unit: "share of spend",
            direction: "increase",
            baseline: { kind: "literal", value: 0, source: "synthetic" },
            target: { kind: "literal", value: 0.1, source: "synthetic" },
          },
          terms: [
            {
              role: "base",
              label: "annual premium labour spend ($)",
              ref: { kind: "literal", value: 1_000_000, source: "synthetic" },
            },
            { role: "driver_delta" },
          ],
          attribution: { kind: "register", registerId: "V3" },
          probability: { kind: "literal", value: 1, source: "synthetic" },
          timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
        },
      ],
    },
  });
  const p4Revision = () =>
    computeCaptureRevision(
      Object.fromEntries(
        getPhaseCaptureSections(4).map((section) => [section.key, ""]),
      ),
    );

  beforeEach(() => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 4,
      charter: {},
      problemStatement: "",
      targetOutcome: "",
    });
    mockGetModuleState.mockResolvedValue([]);
  });

  async function valuePlanComplete(): Promise<boolean | undefined> {
    const res = await POST(
      req({
        phase: 4,
        sections: { value_plan: UNRESOLVED_MODEL },
        expectedRevision: p4Revision(),
      }) as never,
      { params },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      capture: { sections: Array<{ key: string; complete: boolean }> };
    };
    return body.capture.sections.find((s) => s.key === "value_plan")?.complete;
  }

  it("leaves the value plan free text when the flag is off", async () => {
    expect(await valuePlanComplete()).toBe(true);
  });

  it("holds a value model the engine cannot evaluate when the flag is on for the tenant", async () => {
    mockIsFeatureEnabled.mockImplementation(
      (_ctx: unknown, key: string) => key === "moves_value_engine_v1",
    );
    expect(await valuePlanComplete()).toBe(false);
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
      { clientKey: "demo", clientId: "client-1" },
      "moves_value_engine_v1",
    );
  });

  function savedValuePlan() {
    mockGetModuleState.mockResolvedValue([
      {
        moduleKey: phaseCaptureModuleKey(4, "value_plan"),
        status: "in_progress",
        state: { value: UNRESOLVED_MODEL },
      },
    ]);
    mockIsFeatureEnabled.mockImplementation(
      (_ctx: unknown, key: string) => key === "moves_value_engine_v1",
    );
  }
  const valuePlanOf = (body: unknown) =>
    (
      body as {
        capture: { sections: Array<{ key: string; complete: boolean }> };
      }
    ).capture.sections.find((s) => s.key === "value_plan")?.complete;

  it("applies the same check when the capture is read", async () => {
    savedValuePlan();
    const res = await GET(
      new NextRequest(
        "http://test/api/v1/programs/prog-1/phase-capture?phase=4",
      ),
      { params },
    );
    expect(res.status).toBe(200);
    expect(valuePlanOf(await res.json())).toBe(false);
  });

  it("applies the same check on a stale-revision refusal", async () => {
    savedValuePlan();
    const res = await POST(
      req({
        phase: 4,
        sections: { roadmap_sequencing: "30/60/90." },
        expectedRevision: "stale",
      }) as never,
      { params },
    );
    expect(res.status).toBe(409);
    expect(valuePlanOf(await res.json())).toBe(false);
  });

  it("never reads a truthy non-boolean flag answer as on", async () => {
    mockIsFeatureEnabled.mockImplementation((_ctx: unknown, key: string) =>
      key === "moves_value_engine_v1" ? Promise.resolve(false) : false,
    );
    expect(await valuePlanComplete()).toBe(true);
  });
});

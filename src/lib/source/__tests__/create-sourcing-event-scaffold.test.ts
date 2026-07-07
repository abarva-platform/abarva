import {
  createSourcingEvent,
  ensurePersistedSourceEventForClient,
  scaffoldNewEventSubstrate,
} from "../queries";
import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
} from "../canonical-specs";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

jest.mock("@/lib/data-plane/read-adapters/sourceEventsReadAdapter", () => ({
  selectSourceEventsReadAdapter: jest.fn(),
}));

const { getAzureWriteFluentClient } = jest.requireMock(
  "@/lib/data-plane/postgresCompat",
) as {
  getAzureWriteFluentClient: jest.Mock;
};

const { selectSourceEventsReadAdapter } = jest.requireMock(
  "@/lib/data-plane/read-adapters/sourceEventsReadAdapter",
) as {
  selectSourceEventsReadAdapter: jest.Mock;
};

function setupMockSupabase(insertedEvent: {
  id: string;
  client_key: string;
  event_code: string;
}) {
  // Records calls to .from(table).upsert so the test can assert on
  // what was scaffolded.
  const calls: Array<{ table: string; method: "upsert"; rows: unknown }> = [];

  const fromImpl = (table: string) => {
    if (table === "source_events") {
      const single = jest.fn().mockResolvedValue({
        data: {
          id: insertedEvent.id,
          client_key: insertedEvent.client_key,
          event_code: insertedEvent.event_code,
          event_name: "Test Event",
          event_type: "managed_service",
          current_stage_key: "strategy",
          lifecycle_state: "waiting_on_client",
          linked_program_id: null,
          estimated_value_usd: null,
          trigger_description: null,
          scope_description: null,
          decision_owner: null,
          created_by_user_id: null,
          created_at: "2026-05-07T20:00:00Z",
          updated_at: "2026-05-07T20:00:00Z",
        },
        error: null,
      });
      const select = jest.fn(() => ({ single }));
      const upsert = jest.fn((row: unknown) => {
        calls.push({ table, method: "upsert", rows: row });
        return { select };
      });
      return { upsert };
    }
    // canvas-substrate tables — upsert
    const upsert = jest.fn(async (rows: unknown[]) => {
      calls.push({ table, method: "upsert", rows });
      return { data: null, error: null };
    });
    return { upsert };
  };

  getAzureWriteFluentClient.mockReturnValue({ from: jest.fn(fromImpl) });
  return calls;
}

describe("createSourcingEvent scaffolding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectSourceEventsReadAdapter.mockReturnValue({
      getEventByIdForClient: jest.fn().mockResolvedValue(null),
      getEventByCodeForClient: jest.fn().mockResolvedValue(null),
    });
  });

  it("inserts source_events row + scaffolds 3 substrate tables on success", async () => {
    const calls = setupMockSupabase({
      id: "evt-new-1",
      client_key: "apexretail",
      event_code: "APEX-NEW-2026",
    });

    const row = await createSourcingEvent({
      clientKey: "apexretail",
      eventName: "Test Event",
      eventType: "managed_service",
      triggerDescription: "Need AMS sourcing",
    });

    expect(row.id).toBe("evt-new-1");

    // 1 source_events upsert + 3 substrate upserts (one per substrate table)
    expect(calls).toHaveLength(4);

    const tables = calls.map((c) => c.table);
    expect(tables).toContain("source_events");
    expect(tables).toContain("source_event_artifact_states");
    expect(tables).toContain("source_event_gate_criterion_states");
    expect(tables).toContain("source_event_evidence_states");

    const artifactCall = calls.find(
      (c) => c.table === "source_event_artifact_states",
    )!;
    expect((artifactCall.rows as unknown[]).length).toBe(
      SOURCE_ARTIFACT_SPECS.length,
    );

    const criterionCall = calls.find(
      (c) => c.table === "source_event_gate_criterion_states",
    )!;
    expect((criterionCall.rows as unknown[]).length).toBe(
      SOURCE_GATE_CRITERIA.length,
    );

    const evidenceCall = calls.find(
      (c) => c.table === "source_event_evidence_states",
    )!;
    expect((evidenceCall.rows as unknown[]).length).toBe(
      SOURCE_EVIDENCE_REQUIREMENTS.length,
    );
  });

  it("passes current_stage_entered_at to the source_events insert", async () => {
    const calls = setupMockSupabase({
      id: "evt-new-2",
      client_key: "meridian",
      event_code: "MER-2026",
    });

    await createSourcingEvent({
      clientKey: "meridian",
      eventName: "Cloud Renewal",
      eventType: "cloud_infrastructure",
      triggerDescription: "Renewal",
    });

    const eventInsert = calls.find((c) => c.table === "source_events")!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.current_stage_entered_at).toBeTruthy();
    expect(typeof insertedRow.current_stage_entered_at).toBe("string");
    expect(insertedRow.current_stage_key).toBe("strategy");
  });

  it("does not duplicate the client name in generated event codes", async () => {
    const calls = setupMockSupabase({
      id: "evt-new-4",
      client_key: "apexretail",
      event_code: "APEX-INTEGRATION-FABRIC-2026",
    });

    await createSourcingEvent({
      clientKey: "apexretail",
      eventName: "Apex Retail Integration Fabric Commercial Control Event",
      eventType: "other",
      triggerDescription: "Renewal pressure requires commercial control.",
    });

    const eventInsert = calls.find((c) => c.table === "source_events")!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.event_code).toBe(
      `APEX-INTEGRATION-FABRIC-COMMERCIAL-${new Date().getFullYear()}`,
    );
    expect(String(insertedRow.event_code)).not.toContain("APEX-APEX");
  });

  it("strips short tenant aliases before generating event codes", async () => {
    const calls = setupMockSupabase({
      id: "evt-new-5",
      client_key: "meridian",
      event_code: "MERI-GENAI-WORKLOAD-2026",
    });

    await createSourcingEvent({
      clientKey: "meridian",
      eventName: "Meridian GenAI Workload Platform HIPAA RFP",
      eventType: "infrastructure",
      triggerDescription: "HIPAA platform sourcing event.",
    });

    const eventInsert = calls.find((c) => c.table === "source_events")!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.event_code).toBe(
      `MERI-GENAI-WORKLOAD-PLATFORM-${new Date().getFullYear()}`,
    );
    expect(String(insertedRow.event_code)).not.toContain("MERI-MERIDIAN");
    expect(String(insertedRow.event_code)).not.toContain("MERIDIAN-MERIDIAN");
  });

  it("can append a browser creation request id to create a fresh event instance without changing the event title", async () => {
    const calls = setupMockSupabase({
      id: "evt-new-6",
      client_key: "lakeshore",
      event_code: "LAKE-AMS-SOURCING-2026-ABC12345",
    });

    await createSourcingEvent({
      clientKey: "lakeshore",
      eventName: "Lakeshore AMS Sourcing Event",
      eventType: "managed_service",
      triggerDescription: "Recording proof requires a fresh sourcing event.",
      creationRequestId: "abc12345-extra-suffix",
    });

    const eventInsert = calls.find((c) => c.table === "source_events")!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.event_name).toBe("Lakeshore AMS Sourcing Event");
    expect(insertedRow.event_code).toBe(
      `LAKE-AMS-${new Date().getFullYear()}-ABC12345`,
    );
  });

  it("does not abort event creation if scaffolding fails", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "evt-new-3",
        client_key: "apexretail",
        event_code: "APEX-3",
        event_name: "X",
        event_type: "managed_service",
        current_stage_key: "strategy",
        lifecycle_state: "waiting_on_client",
        linked_program_id: null,
        estimated_value_usd: null,
        trigger_description: null,
        scope_description: null,
        decision_owner: null,
        created_by_user_id: null,
        created_at: "2026-05-07T20:00:00Z",
        updated_at: "2026-05-07T20:00:00Z",
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const upsertEvent = jest.fn(() => ({ select }));
    // Substrate tables fail with an RLS error.
    const upsert = jest.fn(async () => ({
      data: null,
      error: { message: "RLS blocked" },
    }));

    getAzureWriteFluentClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "source_events") return { upsert: upsertEvent };
        return { upsert };
      }),
    });

    const consoleSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const row = await createSourcingEvent({
      clientKey: "apexretail",
      eventName: "X",
      eventType: "managed_service",
      triggerDescription: "X",
    });
    expect(row.id).toBe("evt-new-3"); // event still created
    expect(consoleSpy).toHaveBeenCalledWith(
      "source scaffold failure:",
      "evt-new-3",
      expect.any(String),
    );
    consoleSpy.mockRestore();
  });
});

describe("ensurePersistedSourceEventForClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectSourceEventsReadAdapter.mockReturnValue({
      getEventByIdForClient: jest.fn().mockResolvedValue(null),
      getEventByCodeForClient: jest.fn().mockResolvedValue(null),
    });
  });

  it("materializes seeded golden events into source_events and scaffolds substrate", async () => {
    const calls = setupMockSupabase({
      id: "evt-src-004",
      client_key: "apexretail",
      event_code: "SRC-004",
    });

    const row = await ensurePersistedSourceEventForClient(
      "apex-retail-ams-outsourcing-2026",
      "apexretail",
      "clerk:user-1",
    );

    expect(row?.id).toBe("evt-src-004");
    const eventInsert = calls.find((c) => c.table === "source_events")!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.event_code).toBe("SRC-004");
    expect(insertedRow.event_name).toBe("AMS Outsourcing 2026");
    expect(insertedRow.client_key).toBe("apexretail");
    expect(insertedRow.event_type).toBe("managed_service");
    expect(insertedRow.created_by_user_id).toBe("clerk:user-1");
    expect(calls.map((c) => c.table)).toEqual(
      expect.arrayContaining([
        "source_events",
        "source_event_artifact_states",
        "source_event_gate_criterion_states",
        "source_event_evidence_states",
      ]),
    );
  });
});

describe("scaffoldNewEventSubstrate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("upserts with ignoreDuplicates so reruns are idempotent", async () => {
    const upsertCalls: Array<{ table: string; opts: unknown }> = [];
    const upsert = jest.fn((_rows: unknown, opts: unknown) => {
      // captured per call
      return Promise.resolve({ data: null, error: null }).then((r) => {
        upsertCalls.push({ table: "", opts });
        return r;
      });
    });

    getAzureWriteFluentClient.mockReturnValue({
      from: jest.fn((table: string) => ({
        upsert: (
          rows: unknown,
          opts: { onConflict: string; ignoreDuplicates: boolean },
        ) => {
          upsertCalls.push({ table, opts });
          return Promise.resolve({ data: null, error: null });
        },
      })),
    });

    void upsert;

    await scaffoldNewEventSubstrate("evt-id-7", "apexretail");

    expect(upsertCalls).toHaveLength(3);
    for (const call of upsertCalls) {
      const opts = call.opts as {
        onConflict: string;
        ignoreDuplicates: boolean;
      };
      expect(opts.ignoreDuplicates).toBe(true);
      expect(opts.onConflict).toContain("source_event_id");
    }
  });

  it("throws when any of the three upserts errors", async () => {
    let callIdx = 0;
    getAzureWriteFluentClient.mockReturnValue({
      from: jest.fn(() => ({
        upsert: () => {
          callIdx += 1;
          if (callIdx === 2) {
            return Promise.resolve({
              data: null,
              error: { message: "unique violation" },
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
      })),
    });

    await expect(
      scaffoldNewEventSubstrate("evt-x", "meridian"),
    ).rejects.toThrow("unique violation");
  });
});

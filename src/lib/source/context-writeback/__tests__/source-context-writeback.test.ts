import type { SourceEventFactRow } from "@/lib/source/facts/fact-types";
import {
  SOURCE_CONTEXT_RECORD_TYPE,
  buildSourceContextWritebackPlan,
  writeSourceFactsToEnterpriseContext,
  type SourceContextWritebackStore,
  type SourceEnterpriseContextFactRow,
  type SourceEnterpriseContextRecordRow,
  type SourceGovernedReadinessRow,
} from "../index";

function fact(overrides: Partial<SourceEventFactRow> = {}): SourceEventFactRow {
  return {
    id: "fact-1",
    source_event_id: "event-1",
    client_key: "apexretail",
    fact_key: "annual_baseline_spend_usd",
    entity_kind: "event",
    entity_ref: null,
    value_numeric: 1_200_000,
    value_text: null,
    unit: "usd",
    source_method: "structured_map",
    source_citation: {
      doc: "AMS intake template",
      locator: "Spend!B4",
    },
    confidence: "high",
    captured_at: "2026-07-22T12:00:00.000Z",
    is_stale: false,
    ...overrides,
  };
}

const event = {
  id: "event-1",
  code: "SRC-004",
  name: "Apex AMS Outsourcing",
  clientId: "client-1",
  clientKey: "apexretail",
  stageKey: "responses",
};

function fakeStore(
  opts: { fail?: boolean } = {},
): SourceContextWritebackStore & {
  records: SourceEnterpriseContextRecordRow[];
  facts: SourceEnterpriseContextFactRow[];
  readiness: SourceGovernedReadinessRow[];
} {
  const records: SourceEnterpriseContextRecordRow[] = [];
  const facts: SourceEnterpriseContextFactRow[] = [];
  const readiness: SourceGovernedReadinessRow[] = [];
  return {
    records,
    facts,
    readiness,
    async upsertRecords(rows) {
      if (opts.fail) throw new Error("record store unavailable");
      records.push(...rows);
      return new Map(
        rows.map((row, index) => [
          row.canonical_record_id,
          `record-${index + 1}`,
        ]),
      );
    },
    async upsertFacts(rows) {
      facts.push(...rows);
      return rows.length;
    },
    async upsertReadiness(rows) {
      readiness.push(...rows);
      return rows.length;
    },
  };
}

describe("buildSourceContextWritebackPlan", () => {
  it("projects a cited Source fact into an enterprise context record and fact draft", () => {
    const plan = buildSourceContextWritebackPlan({
      event,
      facts: [fact()],
      committedAt: "2026-07-22T13:00:00.000Z",
    });

    expect(plan.skippedFacts).toEqual([]);
    expect(plan.records).toHaveLength(1);
    expect(plan.factDrafts).toHaveLength(1);
    expect(plan.readinessDrafts).toHaveLength(1);
    expect(plan.records[0]).toMatchObject({
      tenant_key: "apex-retail",
      record_type: SOURCE_CONTEXT_RECORD_TYPE,
      record_subtype: "annual_baseline_spend_usd",
      source_system: "source_event_facts",
      source_record_id: "fact-1",
      lifecycle_state: "active",
    });
    expect(plan.records[0].payload).toMatchObject({
      sourceEventId: "event-1",
      sourceEventCode: "SRC-004",
      sourceFactId: "fact-1",
      factKey: "annual_baseline_spend_usd",
      valueNumeric: 1_200_000,
    });
    expect(plan.factDrafts[0]).toMatchObject({
      fact_key: "annual_baseline_spend_usd",
      fact_type: "number",
      fact_value: { value: 1_200_000, unit: "usd" },
    });
  });

  it("uses deterministic canonical ids so replay upserts the same context row", () => {
    const a = buildSourceContextWritebackPlan({
      event,
      facts: [fact()],
      committedAt: "2026-07-22T13:00:00.000Z",
    });
    const b = buildSourceContextWritebackPlan({
      event,
      facts: [fact()],
      committedAt: "2026-07-22T13:00:00.000Z",
    });
    expect(a.records[0].canonical_record_id).toBe(
      "source-event-fact-event-1-fact-1",
    );
    expect(a.records[0].canonical_record_id).toBe(
      b.records[0].canonical_record_id,
    );
    expect(a.records[0].payload_hash).toBe(b.records[0].payload_hash);
  });

  it("accepts numeric values returned from Postgres as strings", () => {
    const plan = buildSourceContextWritebackPlan({
      event,
      facts: [fact({ value_numeric: "8400000" as unknown as number })],
      committedAt: "2026-07-22T13:00:00.000Z",
    });
    expect(plan.skippedFacts).toEqual([]);
    expect(plan.factDrafts[0]).toMatchObject({
      fact_type: "number",
      fact_value: { value: 8400000, unit: "usd" },
      fact_text: "8400000 usd",
    });
  });

  it("does not promote wrong-client, stale, valueless, or uncited facts", () => {
    const plan = buildSourceContextWritebackPlan({
      event,
      facts: [
        fact({ id: "wrong-client", client_key: "meridian" }),
        fact({ id: "stale", is_stale: true }),
        fact({ id: "empty", value_numeric: null, value_text: null }),
        fact({ id: "uncited", source_citation: null }),
      ],
      committedAt: "2026-07-22T13:00:00.000Z",
    });
    expect(plan.records).toHaveLength(0);
    expect(plan.skippedFacts).toEqual([
      {
        factId: "wrong-client",
        factKey: "annual_baseline_spend_usd",
        reason: "wrong_client",
      },
      {
        factId: "stale",
        factKey: "annual_baseline_spend_usd",
        reason: "stale",
      },
      {
        factId: "empty",
        factKey: "annual_baseline_spend_usd",
        reason: "missing_value",
      },
      {
        factId: "uncited",
        factKey: "annual_baseline_spend_usd",
        reason: "missing_citation",
      },
    ]);
  });

  it("marks readiness as not reviewed and not indexed, never agent_ready", () => {
    const plan = buildSourceContextWritebackPlan({
      event,
      facts: [fact()],
      committedAt: "2026-07-22T13:00:00.000Z",
    });
    expect(plan.readinessDrafts[0]).toMatchObject({
      object_table: "enterprise_context_records",
      object_id: "",
      client_key: "apex-retail",
      source_layer: "tenant_context",
      agent_readiness_status: "not_reviewed",
      retrievability: "committed_not_indexed",
      classification: "internal",
      source_basis: "source_event_fact",
      policy_validation_status: "pending",
    });
  });
});

describe("writeSourceFactsToEnterpriseContext", () => {
  it("writes records, facts, and readiness rows through the store", async () => {
    const store = fakeStore();
    const result = await writeSourceFactsToEnterpriseContext(
      {
        event,
        facts: [fact()],
        committedAt: "2026-07-22T13:00:00.000Z",
      },
      store,
    );

    expect(result).toMatchObject({
      status: "written",
      recordsWritten: 1,
      factsWritten: 1,
      readinessRowsWritten: 1,
    });
    expect(store.records).toHaveLength(1);
    expect(store.facts[0].record_id).toBe("record-1");
    expect(store.readiness[0].object_id).toBe("record-1");
    expect(store.readiness[0]).not.toHaveProperty("canonical_record_id");
  });

  it("skips cleanly when no fact is eligible", async () => {
    const store = fakeStore();
    const result = await writeSourceFactsToEnterpriseContext(
      {
        event,
        facts: [fact({ source_citation: null })],
        committedAt: "2026-07-22T13:00:00.000Z",
      },
      store,
    );
    expect(result).toMatchObject({
      status: "skipped",
      reason: "no_eligible_facts",
    });
    expect(store.records).toHaveLength(0);
  });

  it("reports store failure instead of throwing", async () => {
    const result = await writeSourceFactsToEnterpriseContext(
      {
        event,
        facts: [fact()],
        committedAt: "2026-07-22T13:00:00.000Z",
      },
      fakeStore({ fail: true }),
    );
    expect(result).toEqual({
      status: "failed",
      detail: "record store unavailable",
    });
  });
});

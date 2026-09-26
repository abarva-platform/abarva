import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAzureReadFluentClient, getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  approveScorecardCriterion,
  createScorecardCriterion,
  retireDraftCriterion,
  lockEvaluatorScore,
  readSourceScorecardAuthorityRecords,
  recordEvaluatorScore,
} from "../scorecard-authority-store";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
  getAzureWriteFluentClient: jest.fn(),
}));

const getClient = getAzureReadFluentClient as jest.Mock;
const getWriteClient = getAzureWriteFluentClient as jest.Mock;
const artifactId = "11111111-1111-4111-8111-111111111111";

type QueryResult = { data: unknown; error: { message: string } | null };

function serve(results: Record<string, QueryResult>) {
  const calls: Array<{
    table: string;
    predicates: Record<string, unknown>;
    nullPredicates: Record<string, unknown>;
  }> = [];
  getClient.mockReturnValue({
    from: (table: string) => {
      const call = {
        table,
        predicates: {} as Record<string, unknown>,
        nullPredicates: {} as Record<string, unknown>,
      };
      calls.push(call);
      const query = {
        select: jest.fn(),
        eq: jest.fn(),
        is: jest.fn(),
        then: (resolve: (result: QueryResult) => unknown) =>
          Promise.resolve(
            results[table] ?? {
              data: null,
              error: { message: "missing fixture" },
            },
          ).then(resolve),
      };
      query.select.mockReturnValue(query);
      query.eq.mockImplementation((column: string, value: unknown) => {
        call.predicates[column] = value;
        return query;
      });
      query.is.mockImplementation((column: string, value: unknown) => {
        call.nullPredicates[column] = value;
        return query;
      });
      return query;
    },
  });
  return calls;
}

const criterion = {
  client_key: "tenant-1",
  event_id: "event-1",
  criterion_id: "quality",
  criterion_version: "v1",
  label: "Quality",
  weight: 100,
  weights_frozen: true,
  approved_criterion_version: "v1",
  approved_by: "reviewer-1",
  approved_at: "2026-09-23T00:00:00Z",
};

const score = {
  client_key: "tenant-1",
  event_id: "event-1",
  vendor_id: "supplier-1",
  vendor_name: "Supplier 1",
  criterion_id: "quality",
  criterion_version: "v1",
  evaluator_id: "reviewer-2",
  evaluator_name: "Reviewer 2",
  evaluator_score: 4,
  evidence_reference: artifactId,
  override_reason: null,
  override_reason_required: false,
  lock_state: "locked",
  locked_by: "reviewer-2",
  locked_at: "2026-09-23T00:00:00Z",
};

describe("Source scorecard authority store", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads criterion and score authority only for the requested event and tenant", async () => {
    const calls = serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [score], error: null },
    });

    const result = await readSourceScorecardAuthorityRecords(
      "event-1",
      "tenant-1",
    );

    expect(result).toEqual({
      kind: "available",
      criteria: [
        expect.objectContaining({
          criterionId: "quality",
          tenantKey: "tenant-1",
        }),
      ],
      scores: [
        expect.objectContaining({
          criterionId: "quality",
          evaluatorId: "reviewer-2",
        }),
      ],
    });
    expect(calls).toEqual([
      {
        table: "source_scorecard_criteria",
        predicates: { event_id: "event-1", client_key: "tenant-1" },
        nullPredicates: { superseded_at: null },
      },
      {
        table: "source_scorecard_scores",
        predicates: { event_id: "event-1", client_key: "tenant-1" },
        nullPredicates: { superseded_at: null },
      },
    ]);
  });

  it("refuses an opposite-tenant row even if the query returns it", async () => {
    serve({
      source_scorecard_criteria: {
        data: [{ ...criterion, client_key: "tenant-2" }],
        error: null,
      },
      source_scorecard_scores: { data: [score], error: null },
    });

    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("refuses a score belonging to a different event", async () => {
    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: {
        data: [{ ...score, event_id: "event-2" }],
        error: null,
      },
    });

    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("normalizes database numeric values without turning malformed values into scores", async () => {
    serve({
      source_scorecard_criteria: {
        data: [{ ...criterion, weight: "100.0000" }],
        error: null,
      },
      source_scorecard_scores: {
        data: [{ ...score, evaluator_score: "4.0000" }],
        error: null,
      },
    });
    const result = await readSourceScorecardAuthorityRecords(
      "event-1",
      "tenant-1",
    );
    expect(result).toEqual({
      kind: "available",
      criteria: [expect.objectContaining({ weight: 100 })],
      scores: [expect.objectContaining({ evaluatorScore: 4 })],
    });

    serve({
      source_scorecard_criteria: {
        data: [{ ...criterion, weight: "100 units" }],
        error: null,
      },
      source_scorecard_scores: { data: [score], error: null },
    });
    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("normalizes driver Date timestamps for approved and locked authority", async () => {
    serve({
      source_scorecard_criteria: {
        data: [{ ...criterion, approved_at: new Date("2026-09-23T00:00:00Z") }],
        error: null,
      },
      source_scorecard_scores: {
        data: [{ ...score, locked_at: new Date("2026-09-23T00:00:00Z") }],
        error: null,
      },
    });

    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({
      kind: "available",
      criteria: [expect.objectContaining({ approvedAt: "2026-09-23T00:00:00.000Z" })],
      scores: [expect.objectContaining({ lockedAt: "2026-09-23T00:00:00.000Z" })],
    });
  });

  it("distinguishes absent authority from an unapplied schema", async () => {
    serve({
      source_scorecard_criteria: { data: [], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({ kind: "available", criteria: [], scores: [] });

    serve({
      source_scorecard_criteria: {
        data: null,
        error: {
          message: 'relation "source_scorecard_criteria" does not exist',
        },
      },
      source_scorecard_scores: { data: [], error: null },
    });
    await expect(
      readSourceScorecardAuthorityRecords("event-1", "tenant-1"),
    ).resolves.toEqual({ kind: "unavailable" });
  });
});

describe("Source scorecard authority schema", () => {
  it("requires a non-null approved version before criterion approval can pass", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260923214500_source_scorecard_authority.sql",
      ),
      "utf8",
    );
    const approvalCheck = sql.match(
      /CONSTRAINT source_scorecard_criteria_approval_check CHECK \(([\s\S]*?)\n  \)/,
    )?.[1];
    expect(approvalCheck).toContain("approved_criterion_version IS NOT NULL");
  });
});

type WriteCall = {
  table: string;
  operation: "insert" | "update";
  payload: Record<string, unknown>;
  predicates: Record<string, unknown>;
  nullPredicates: Record<string, unknown>;
};

function serveWrites(result: QueryResult = { data: [{ id: "row-1" }], error: null }) {
  const calls: WriteCall[] = [];
  getWriteClient.mockReturnValue({
    from: (table: string) => {
      const query = {
        insert: (payload: Record<string, unknown>) => {
          calls.push({ table, operation: "insert" as const, payload, predicates: {}, nullPredicates: {} });
          return query;
        },
        update: (payload: Record<string, unknown>) => {
          calls.push({ table, operation: "update" as const, payload, predicates: {}, nullPredicates: {} });
          return query;
        },
        eq: (key: string, value: unknown) => {
          calls.at(-1)!.predicates[key] = value;
          return query;
        },
        is: (key: string, value: unknown) => {
          calls.at(-1)!.nullPredicates[key] = value;
          return query;
        },
        select: () => Promise.resolve(result),
      };
      return query;
    },
  });
  return calls;
}

const writeBase = {
  clientKey: "tenant-1",
  eventId: "event-1",
  criterionId: "quality",
  criterionVersion: "v1",
};
const actor = { actorId: "reviewer-2", actorName: "Reviewer Two" };

describe("human scorecard writes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates only a draft criterion and refuses to append after approval", async () => {
    serve({
      source_scorecard_criteria: { data: [], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    const calls = serveWrites();
    expect(await createScorecardCriterion({ ...writeBase, label: "Quality", weight: 100 })).toEqual({ ok: true });
    expect(calls[0]).toEqual(expect.objectContaining({
      table: "source_scorecard_criteria",
      operation: "insert",
      payload: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", weights_frozen: false, approved_by: null }),
    }));

    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    expect(await createScorecardCriterion({ ...writeBase, criterionId: "cost", label: "Cost", weight: 10 })).toEqual({ ok: false, code: "criteria_frozen" });
    expect(calls).toHaveLength(1);
  });

  it("revises or retires only a current unapproved draft", async () => {
    const draft = { ...criterion, weights_frozen: false, approved_criterion_version: null, approved_by: null, approved_at: null };
    serve({
      source_scorecard_criteria: { data: [draft], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    const calls = serveWrites();
    expect(await createScorecardCriterion({ ...writeBase, label: "Quality revised", weight: 90 })).toEqual({ ok: true });
    expect(calls[0]).toEqual(expect.objectContaining({
      operation: "update", payload: expect.objectContaining({ label: "Quality revised", weight: 90 }),
      predicates: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", criterion_id: "quality", criterion_version: "v1" }),
      nullPredicates: expect.objectContaining({ approved_at: null, superseded_at: null }),
    }));
    expect(await retireDraftCriterion(writeBase)).toEqual({ ok: true });
    expect(calls[1]).toEqual(expect.objectContaining({
      operation: "update", payload: expect.objectContaining({ superseded_at: expect.any(String) }),
      predicates: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", criterion_id: "quality", criterion_version: "v1" }),
      nullPredicates: expect.objectContaining({ approved_at: null, superseded_at: null }),
    }));
    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    expect(await retireDraftCriterion(writeBase)).toEqual({ ok: false, code: "criteria_frozen" });
    expect(calls).toHaveLength(2);
  });

  it("approves only an exact current version when draft weights total 100", async () => {
    const draft = { ...criterion, weights_frozen: false, approved_criterion_version: null, approved_by: null, approved_at: null };
    serve({
      source_scorecard_criteria: { data: [{ ...draft, weight: 90 }], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    const calls = serveWrites();
    expect(await approveScorecardCriterion({ ...writeBase, ...actor })).toEqual({ ok: false, code: "weights_not_100" });
    expect(calls).toHaveLength(0);

    serve({
      source_scorecard_criteria: { data: [draft], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    expect(await approveScorecardCriterion({ ...writeBase, criterionVersion: "v2", ...actor })).toEqual({ ok: false, code: "criterion_not_current" });
    expect(await approveScorecardCriterion({ ...writeBase, ...actor })).toEqual({ ok: true });
    expect(calls[0]).toEqual(expect.objectContaining({
      table: "source_scorecard_criteria", operation: "update",
      payload: expect.objectContaining({ approved_criterion_version: "v1", approved_by: "reviewer-2", weights_frozen: true }),
      predicates: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", criterion_id: "quality", criterion_version: "v1" }),
      nullPredicates: expect.objectContaining({ approved_at: null, superseded_at: null }),
    }));
  });

  it("does not record a score against unapproved criteria; the evaluator is the session actor", async () => {
    const draft = { ...criterion, weights_frozen: false, approved_criterion_version: null, approved_by: null, approved_at: null };
    serve({
      source_scorecard_criteria: { data: [draft], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    const calls = serveWrites();
    const input = { ...writeBase, ...actor, vendorId: "supplier-1", vendorName: "Supplier One", score: 8, evidenceReference: artifactId, overrideReason: null };
    expect(await recordEvaluatorScore(input)).toEqual({ ok: false, code: "criterion_not_approved" });
    expect(calls).toHaveLength(0);
    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [], error: null },
    });
    expect(await recordEvaluatorScore(input)).toEqual({ ok: true });
    expect(calls[0]).toEqual(expect.objectContaining({
      table: "source_scorecard_scores", operation: "insert",
      payload: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", vendor_id: "supplier-1", evaluator_id: "reviewer-2", evaluator_name: "Reviewer Two", evaluator_score: 8, evidence_reference: artifactId, lock_state: "unlocked" }),
    }));
  });

  it("only the named evaluator may lock their evidenced exact-version score", async () => {
    const reads = serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [{ ...score, lock_state: "unlocked", locked_by: null, locked_at: null }], error: null },
      source_artifacts: { data: [{ id: artifactId, tenant_key: "tenant-1", source_event_id: "event-1", status: "approved", lifecycle_state: "current", blob_sha256: "a".repeat(64) }], error: null },
    });
    const calls = serveWrites();
    const input = { ...writeBase, ...actor, vendorId: "supplier-1" };
    expect(await lockEvaluatorScore(input)).toEqual({ ok: true });
    expect(reads.at(-1)).toEqual({
      table: "source_artifacts",
      predicates: {
        id: artifactId,
        tenant_key: "tenant-1",
        source_event_id: "event-1",
        status: "approved",
        lifecycle_state: "current",
      },
      nullPredicates: { deleted_at: null },
    });
    expect(calls[0]).toEqual(expect.objectContaining({
      table: "source_scorecard_scores", operation: "update",
      payload: expect.objectContaining({ lock_state: "locked", locked_by: "Reviewer Two" }),
      predicates: expect.objectContaining({ client_key: "tenant-1", event_id: "event-1", vendor_id: "supplier-1", evaluator_id: "reviewer-2", criterion_version: "v1", lock_state: "unlocked" }),
    }));
    expect(await lockEvaluatorScore({ ...input, actorId: "other-person" })).toEqual({ ok: false, code: "evaluator_score_missing" });
    expect(calls).toHaveLength(1);
  });

  it("refuses to lock an unsupported or opposite-tenant evidence reference", async () => {
    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [{ ...score, lock_state: "unlocked", locked_by: null, locked_at: null }], error: null },
      source_artifacts: { data: [], error: null },
    });
    const calls = serveWrites();
    expect(await lockEvaluatorScore({ ...writeBase, ...actor, vendorId: "supplier-1" })).toEqual({ ok: false, code: "evidence_not_approved" });
    expect(calls).toHaveLength(0);
    serve({
      source_scorecard_criteria: { data: [criterion], error: null },
      source_scorecard_scores: { data: [{ ...score, lock_state: "unlocked", locked_by: null, locked_at: null }], error: null },
      source_artifacts: { data: [{ id: artifactId, tenant_key: "other-tenant", source_event_id: "event-1", status: "approved", lifecycle_state: "current", blob_sha256: "a".repeat(64) }], error: null },
    });
    expect(await lockEvaluatorScore({ ...writeBase, ...actor, vendorId: "supplier-1" })).toEqual({ ok: false, code: "evidence_not_approved" });
    expect(calls).toHaveLength(0);
  });
});

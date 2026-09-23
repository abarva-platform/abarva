import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { readSourceScorecardAuthorityRecords } from "../scorecard-authority-store";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const getClient = getAzureReadFluentClient as jest.Mock;

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
  evidence_reference: "artifact-1:v1",
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

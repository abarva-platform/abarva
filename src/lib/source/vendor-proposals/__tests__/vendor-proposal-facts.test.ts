import {
  acceptVendorProposalFact,
  deriveVendorProposalFactStatus,
  getAuthoritativeVendorProposalFacts,
  getLatestVendorProposalFactReviewsByFactIds,
  insertVendorProposalFacts,
  listCandidateVendorProposalFacts,
  listVendorProposalFacts,
  rejectVendorProposalFact,
  type VendorProposalFactsIdentity,
} from "../vendor-proposal-facts";

const identity: VendorProposalFactsIdentity = {
  tenantKey: "apexretail",
  role: "member",
  userId: "clerk-user-1",
};

const factRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "fact-1",
  client_key: "apexretail",
  source_event_id: "event-1",
  vendor_key: "vendor-a",
  proposal_artifact_id: "artifact-1",
  fact_key: "unit_price",
  section_key: null,
  page_or_location: "line 4",
  value_numeric: 120000,
  value_text: null,
  unit: "year",
  currency: "USD",
  effective_period_start: null,
  effective_period_end: null,
  source_quote: "Price: $120,000/year",
  source_pointer: null,
  confidence: "low",
  extraction_method: "parsed_text",
  supersedes_fact_id: null,
  created_by: "clerk-user-1",
  created_at: "2026-07-25T00:00:00.000Z",
  ...overrides,
});

const reviewRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "review-1",
  fact_id: "fact-1",
  client_key: "apexretail",
  source_event_id: "event-1",
  review_status: "accepted",
  rationale: "Matches vendor proposal PDF page 4.",
  reviewed_by: "clerk-user-1",
  reviewed_at: "2026-07-25T01:00:00.000Z",
  ...overrides,
});

/** Housekeeping queries withVendorProposalFactsSession issues before every
 * caller query — never consume the test's data queue for these. */
function isHousekeeping(sql: string): boolean {
  return sql.includes("set_config") || sql.includes("SET LOCAL ROLE");
}

/**
 * A minimal fake run() — `queuedResults` is consumed in order by every
 * non-housekeeping query. Also records every call (including housekeeping)
 * so tests can assert the tenant-context mechanism actually fires.
 */
function fakeRun(queuedResults: unknown[][]) {
  const queue = [...queuedResults];
  const calls: { sql: string; params: unknown[] }[] = [];
  const run = jest.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    if (isHousekeeping(sql)) return [];
    return queue.shift() ?? [];
  });
  return { run, calls };
}

let currentRun: ReturnType<typeof fakeRun>["run"] = jest.fn(
  async (sql: string, params?: unknown[]) => {
    void sql;
    void params;
    return [];
  },
);

jest.mock("@/lib/data-plane/read-adapters/azureSession", () => ({
  createTxSession: () => (fn: (run: unknown) => Promise<unknown>) =>
    fn(currentRun),
}));

function useFake(queuedResults: unknown[][]) {
  const fake = fakeRun(queuedResults);
  currentRun = fake.run;
  return fake;
}

describe("vendor-proposal-facts repository", () => {
  describe("tenant-context mechanism", () => {
    it("sets request.jwt.claims and SET LOCAL ROLE authenticated before every query", async () => {
      const fake = useFake([[factRow()]]);
      await listVendorProposalFacts(identity, { eventId: "event-1" });
      const sqlCalls = fake.calls.map((c) => c.sql);
      expect(sqlCalls[0]).toContain("set_config");
      expect(fake.calls[0]?.params[0]).toContain('"tenant_key":"apexretail"');
      expect(sqlCalls[1]).toBe("SET LOCAL ROLE authenticated");
      expect(sqlCalls[2]).toContain("SELECT");
    });
  });

  describe("insertVendorProposalFacts", () => {
    it("short-circuits on an empty input list", async () => {
      const fake = useFake([]);
      const result = await insertVendorProposalFacts(identity, []);
      expect(result).toEqual({ ok: true, records: [] });
      expect(fake.run).not.toHaveBeenCalled();
    });

    it("inserts candidate facts and maps rows back to camelCase", async () => {
      useFake([[factRow()]]);
      const result = await insertVendorProposalFacts(identity, [
        {
          sourceEventId: "event-1",
          vendorKey: "vendor-a",
          proposalArtifactId: "artifact-1",
          factKey: "unit_price",
          valueNumeric: 120000,
          unit: "year",
          currency: "USD",
          sourceQuote: "Price: $120,000/year",
          confidence: "low",
          extractionMethod: "parsed_text",
          createdBy: "clerk-user-1",
        },
      ]);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");
      expect(result.records[0]).toMatchObject({
        id: "fact-1",
        vendorKey: "vendor-a",
        factKey: "unit_price",
        valueNumeric: 120000,
        supersedesFactId: null,
      });
    });
  });

  describe("getAuthoritativeVendorProposalFacts", () => {
    it("excludes a fact with no review row — unreviewed facts are never authoritative", async () => {
      useFake([[factRow()], []]);
      const result = await getAuthoritativeVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      expect(result).toEqual([]);
    });

    it("includes a fact whose latest review is accepted", async () => {
      useFake([[factRow()], [reviewRow({ review_status: "accepted" })]]);
      const result = await getAuthoritativeVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("fact-1");
    });

    it("excludes a fact whose latest review is rejected", async () => {
      useFake([[factRow()], [reviewRow({ review_status: "rejected" })]]);
      const result = await getAuthoritativeVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      expect(result).toEqual([]);
    });

    it("excludes a fact whose latest review is superseded — superseded facts are never authoritative", async () => {
      useFake([[factRow()], [reviewRow({ review_status: "superseded" })]]);
      const result = await getAuthoritativeVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      expect(result).toEqual([]);
    });

    it("keeps only the latest review per fact when several review rows exist", async () => {
      useFake([
        [factRow()],
        [
          reviewRow({
            id: "review-2",
            review_status: "superseded",
            reviewed_at: "2026-07-25T02:00:00.000Z",
          }),
          reviewRow({
            id: "review-1",
            review_status: "accepted",
            reviewed_at: "2026-07-25T01:00:00.000Z",
          }),
        ],
      ]);
      const result = await getAuthoritativeVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      // Rows arrive latest-first (superseded), so the fact is NOT authoritative.
      expect(result).toEqual([]);
    });
  });

  describe("listCandidateVendorProposalFacts", () => {
    it("returns only facts with no review row (the review queue)", async () => {
      useFake([
        [factRow({ id: "fact-1" }), factRow({ id: "fact-2" })],
        [reviewRow({ fact_id: "fact-1" })],
      ]);
      const result = await listCandidateVendorProposalFacts(identity, {
        eventId: "event-1",
      });
      expect(result.map((f) => f.id)).toEqual(["fact-2"]);
    });
  });

  describe("deriveVendorProposalFactStatus", () => {
    it("derives 'candidate' when no review exists", () => {
      expect(deriveVendorProposalFactStatus(undefined)).toBe("candidate");
    });
    it("derives the latest review's status when one exists", () => {
      expect(
        deriveVendorProposalFactStatus({
          id: "r1",
          factId: "fact-1",
          reviewStatus: "accepted",
          rationale: "x",
          reviewedBy: "u",
          reviewedAt: "2026-07-25T00:00:00.000Z",
        }),
      ).toBe("accepted");
    });
  });

  describe("acceptVendorProposalFact", () => {
    it("accepts a fact with no supersession — inserts exactly one review row", async () => {
      const fake = useFake([
        [factRow({ supersedes_fact_id: null })], // fetch fact
        [reviewRow()], // insert accepted review
      ]);
      const result = await acceptVendorProposalFact(identity, {
        factId: "fact-1",
        eventId: "event-1",
        rationale: "Confirmed against page 4.",
        reviewedBy: "clerk-user-1",
      });
      expect(result.ok).toBe(true);
      const dataCalls = fake.calls.filter((c) => !isHousekeeping(c.sql));
      expect(dataCalls).toHaveLength(2);
      expect(dataCalls[1]!.sql).toContain(
        "INSERT INTO source_vendor_proposal_fact_reviews",
      );
    });

    it("returns fact_not_found across a tenant boundary — cross-tenant denial", async () => {
      // The WHERE clause itself filters by client_key, so a cross-tenant
      // fact never comes back from the fake — same as a real RLS-backed query.
      useFake([[]]);
      const result = await acceptVendorProposalFact(identity, {
        factId: "fact-1",
        eventId: "event-1",
        rationale: "x",
        reviewedBy: "u",
      });
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });

    it("returns fact_not_found across an event boundary — cross-event denial", async () => {
      useFake([[]]);
      const result = await acceptVendorProposalFact(identity, {
        factId: "fact-1",
        eventId: "event-1",
        rationale: "x",
        reviewedBy: "u",
      });
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });

    it("atomically supersedes the prior accepted fact when accepting a revision", async () => {
      const fake = useFake([
        [factRow({ id: "fact-2", supersedes_fact_id: "fact-1" })], // fetch new fact
        [reviewRow({ id: "review-2", fact_id: "fact-2" })], // insert accepted review for fact-2
        [factRow({ id: "fact-1" })], // fetch superseded fact-1 (same tenant/event)
        [], // insert superseded review for fact-1
      ]);
      const result = await acceptVendorProposalFact(identity, {
        factId: "fact-2",
        eventId: "event-1",
        rationale: "Revised pricing supersedes the prior submission.",
        reviewedBy: "clerk-user-1",
      });
      expect(result.ok).toBe(true);
      const dataCalls = fake.calls.filter((c) => !isHousekeeping(c.sql));
      expect(dataCalls).toHaveLength(4);
      expect(dataCalls[3]!.sql).toContain(
        "INSERT INTO source_vendor_proposal_fact_reviews",
      );
      expect(dataCalls[3]!.params).toContain("fact-1");
    });

    it("does not supersede across a tenant boundary even if supersedesFactId is set", async () => {
      // The superseded-fact lookup is ALSO tenant/event-scoped in SQL — a
      // cross-tenant supersedes_fact_id target simply returns no row.
      const fake = useFake([
        [factRow({ id: "fact-2", supersedes_fact_id: "fact-1" })],
        [reviewRow({ id: "review-2", fact_id: "fact-2" })],
        [], // superseded-fact lookup returns nothing (belongs to another tenant)
      ]);
      const result = await acceptVendorProposalFact(identity, {
        factId: "fact-2",
        eventId: "event-1",
        rationale: "x",
        reviewedBy: "clerk-user-1",
      });
      expect(result.ok).toBe(true);
      const dataCalls = fake.calls.filter((c) => !isHousekeeping(c.sql));
      // Only 3 data calls: fetch fact, insert accept, failed superseded lookup.
      // No 4th insert — no cross-tenant superseded write.
      expect(dataCalls).toHaveLength(3);
    });
  });

  describe("rejectVendorProposalFact", () => {
    it("rejects a fact — never mutates the fact row, only inserts a review", async () => {
      useFake([[{ id: "fact-1" }], [reviewRow({ review_status: "rejected" })]]);
      const result = await rejectVendorProposalFact(identity, {
        factId: "fact-1",
        eventId: "event-1",
        rationale: "Not corroborated by the proposal document.",
        reviewedBy: "clerk-user-1",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");
      expect(result.record.reviewStatus).toBe("rejected");
    });

    it("returns fact_not_found across a tenant boundary — cross-tenant denial", async () => {
      useFake([[]]);
      const result = await rejectVendorProposalFact(identity, {
        factId: "fact-1",
        eventId: "event-1",
        rationale: "x",
        reviewedBy: "u",
      });
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });
  });

  describe("listVendorProposalFacts / getLatestVendorProposalFactReviewsByFactIds error handling", () => {
    it("listVendorProposalFacts returns an empty array on a thrown error, never throws", async () => {
      currentRun = jest.fn(async (sql: string) => {
        if (isHousekeeping(sql)) return [];
        throw new Error("boom");
      });
      await expect(
        listVendorProposalFacts(identity, { eventId: "event-1" }),
      ).resolves.toEqual([]);
    });

    it("getLatestVendorProposalFactReviewsByFactIds short-circuits on an empty id list", async () => {
      const fake = useFake([]);
      const result = await getLatestVendorProposalFactReviewsByFactIds(
        identity,
        [],
      );
      expect(result.size).toBe(0);
      expect(fake.run).not.toHaveBeenCalled();
    });
  });
});

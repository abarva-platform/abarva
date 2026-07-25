import {
  acceptVendorProposalFact,
  deriveVendorProposalFactStatus,
  getAuthoritativeVendorProposalFacts,
  getLatestVendorProposalFactReviewsByFactIds,
  insertVendorProposalFacts,
  listCandidateVendorProposalFacts,
  listVendorProposalFacts,
  rejectVendorProposalFact,
} from "../vendor-proposal-facts";

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
  review_status: "accepted",
  rationale: "Matches vendor proposal PDF page 4.",
  reviewed_by: "clerk-user-1",
  reviewed_at: "2026-07-25T01:00:00.000Z",
  ...overrides,
});

/**
 * A minimal chainable fake matching the subset of the fluent client this
 * module uses. `responses` is consumed in call order — each `.from()` call
 * pops the next canned response, which resolves identically whichever
 * terminal method is invoked (`.maybeSingle()`, `.single()`, direct await,
 * or `.order()` chains for list reads).
 */
function fakeDb(responses: Array<{ data: unknown; error: unknown }>) {
  const queue = [...responses];
  const fromCalls: string[] = [];
  const insertCalls: unknown[] = [];

  const from = jest.fn((table: string) => {
    fromCalls.push(table);
    const next = () => queue.shift() ?? { data: null, error: null };
    const chain: Record<string, unknown> = {
      select: () => chain,
      insert: (payload: unknown) => {
        insertCalls.push(payload);
        return chain;
      },
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      single: async () => next(),
      maybeSingle: async () => next(),
    };
    (chain as unknown as { then: unknown }).then = (
      resolve: (value: unknown) => unknown,
    ) => resolve(next());
    return chain;
  });

  return { from, fromCalls, insertCalls };
}

describe("vendor-proposal-facts repository", () => {
  describe("insertVendorProposalFacts", () => {
    it("short-circuits on an empty input list", async () => {
      const db = fakeDb([]);
      const result = await insertVendorProposalFacts([], db as never);
      expect(result).toEqual({ ok: true, records: [] });
      expect(db.from).not.toHaveBeenCalled();
    });

    it("inserts candidate facts and maps rows back to camelCase", async () => {
      const db = fakeDb([{ data: [factRow()], error: null }]);
      const result = await insertVendorProposalFacts(
        [
          {
            clientKey: "apexretail",
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
        ],
        db as never,
      );
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
      const db = fakeDb([
        { data: [factRow()], error: null }, // listVendorProposalFacts
        { data: [], error: null }, // getLatestVendorProposalFactReviewsByFactIds
      ]);
      const result = await getAuthoritativeVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
      expect(result).toEqual([]);
    });

    it("includes a fact whose latest review is accepted", async () => {
      const db = fakeDb([
        { data: [factRow()], error: null },
        { data: [reviewRow({ review_status: "accepted" })], error: null },
      ]);
      const result = await getAuthoritativeVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("fact-1");
    });

    it("excludes a fact whose latest review is rejected", async () => {
      const db = fakeDb([
        { data: [factRow()], error: null },
        { data: [reviewRow({ review_status: "rejected" })], error: null },
      ]);
      const result = await getAuthoritativeVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
      expect(result).toEqual([]);
    });

    it("excludes a fact whose latest review is superseded — superseded facts are never authoritative", async () => {
      const db = fakeDb([
        { data: [factRow()], error: null },
        { data: [reviewRow({ review_status: "superseded" })], error: null },
      ]);
      const result = await getAuthoritativeVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
      expect(result).toEqual([]);
    });

    it("keeps only the latest review per fact when several review rows exist", async () => {
      const db = fakeDb([
        { data: [factRow()], error: null },
        {
          data: [
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
          error: null,
        },
      ]);
      const result = await getAuthoritativeVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
      // Rows arrive latest-first (superseded), so the fact is NOT authoritative.
      expect(result).toEqual([]);
    });
  });

  describe("listCandidateVendorProposalFacts", () => {
    it("returns only facts with no review row (the review queue)", async () => {
      const db = fakeDb([
        {
          data: [factRow({ id: "fact-1" }), factRow({ id: "fact-2" })],
          error: null,
        },
        { data: [reviewRow({ fact_id: "fact-1" })], error: null },
      ]);
      const result = await listCandidateVendorProposalFacts(
        { eventId: "event-1", clientKey: "apexretail" },
        db as never,
      );
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
      const db = fakeDb([
        { data: factRow({ supersedes_fact_id: null }), error: null }, // fetch fact
        { data: reviewRow(), error: null }, // insert accepted review
      ]);
      const result = await acceptVendorProposalFact(
        {
          factId: "fact-1",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "Confirmed against page 4.",
          reviewedBy: "clerk-user-1",
        },
        db as never,
      );
      expect(result.ok).toBe(true);
      expect(db.fromCalls).toEqual([
        "source_vendor_proposal_facts",
        "source_vendor_proposal_fact_reviews",
      ]);
      expect(db.insertCalls).toHaveLength(1);
    });

    it("returns fact_not_found across a tenant boundary — cross-tenant denial", async () => {
      const db = fakeDb([
        { data: factRow({ client_key: "meridian" }), error: null },
      ]);
      const result = await acceptVendorProposalFact(
        {
          factId: "fact-1",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "x",
          reviewedBy: "u",
        },
        db as never,
      );
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });

    it("returns fact_not_found across an event boundary — cross-event denial", async () => {
      const db = fakeDb([
        { data: factRow({ source_event_id: "event-other" }), error: null },
      ]);
      const result = await acceptVendorProposalFact(
        {
          factId: "fact-1",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "x",
          reviewedBy: "u",
        },
        db as never,
      );
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });

    it("atomically supersedes the prior accepted fact when accepting a revision", async () => {
      const db = fakeDb([
        {
          data: factRow({ id: "fact-2", supersedes_fact_id: "fact-1" }),
          error: null,
        }, // fetch new fact
        { data: reviewRow({ id: "review-2", fact_id: "fact-2" }), error: null }, // insert accepted review for fact-2
        { data: factRow({ id: "fact-1" }), error: null }, // fetch superseded fact-1 (same tenant/event)
        { data: null, error: null }, // insert superseded review for fact-1
      ]);
      const result = await acceptVendorProposalFact(
        {
          factId: "fact-2",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "Revised pricing supersedes the prior submission.",
          reviewedBy: "clerk-user-1",
        },
        db as never,
      );
      expect(result.ok).toBe(true);
      expect(db.insertCalls).toHaveLength(2);
      expect(db.insertCalls[1]).toMatchObject({
        fact_id: "fact-1",
        review_status: "superseded",
      });
    });

    it("does not supersede across a tenant boundary even if supersedesFactId is set", async () => {
      const db = fakeDb([
        {
          data: factRow({ id: "fact-2", supersedes_fact_id: "fact-1" }),
          error: null,
        },
        { data: reviewRow({ id: "review-2", fact_id: "fact-2" }), error: null },
        {
          data: factRow({ id: "fact-1", client_key: "meridian" }),
          error: null,
        }, // superseded fact belongs to a DIFFERENT tenant
      ]);
      const result = await acceptVendorProposalFact(
        {
          factId: "fact-2",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "x",
          reviewedBy: "clerk-user-1",
        },
        db as never,
      );
      expect(result.ok).toBe(true);
      // Only the accept insert happened — no cross-tenant superseded write.
      expect(db.insertCalls).toHaveLength(1);
    });
  });

  describe("rejectVendorProposalFact", () => {
    it("rejects a fact — never mutates the fact row, only inserts a review", async () => {
      const db = fakeDb([
        {
          data: {
            id: "fact-1",
            source_event_id: "event-1",
            client_key: "apexretail",
          },
          error: null,
        },
        { data: reviewRow({ review_status: "rejected" }), error: null },
      ]);
      const result = await rejectVendorProposalFact(
        {
          factId: "fact-1",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "Not corroborated by the proposal document.",
          reviewedBy: "clerk-user-1",
        },
        db as never,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");
      expect(result.record.reviewStatus).toBe("rejected");
    });

    it("returns fact_not_found across a tenant boundary — cross-tenant denial", async () => {
      const db = fakeDb([
        {
          data: {
            id: "fact-1",
            source_event_id: "event-1",
            client_key: "meridian",
          },
          error: null,
        },
      ]);
      const result = await rejectVendorProposalFact(
        {
          factId: "fact-1",
          eventId: "event-1",
          clientKey: "apexretail",
          rationale: "x",
          reviewedBy: "u",
        },
        db as never,
      );
      expect(result).toEqual({ ok: false, error: "fact_not_found" });
    });
  });

  describe("listVendorProposalFacts / getLatestVendorProposalFactReviewsByFactIds error handling", () => {
    it("listVendorProposalFacts returns an empty array on a query error, never throws", async () => {
      const db = fakeDb([{ data: null, error: { message: "boom" } }]);
      await expect(
        listVendorProposalFacts(
          { eventId: "event-1", clientKey: "apexretail" },
          db as never,
        ),
      ).resolves.toEqual([]);
    });

    it("getLatestVendorProposalFactReviewsByFactIds short-circuits on an empty id list", async () => {
      const db = fakeDb([]);
      const result = await getLatestVendorProposalFactReviewsByFactIds(
        [],
        db as never,
      );
      expect(result.size).toBe(0);
      expect(db.from).not.toHaveBeenCalled();
    });
  });
});

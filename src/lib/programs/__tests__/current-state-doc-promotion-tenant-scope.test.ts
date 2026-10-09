/**
 * Can a reviewer APPROVE the pending evidence the cabinet is showing them?
 *
 * `current-state-doc-family-review-scope.test.ts` pins the READ half of this:
 * `resolveDocFamilyReviews` matches every key one tenant's own evidence may be
 * stored under, because the product writes `ctx.clientKey` (the app client key)
 * while a data-plane load job writes the canonical substrate key, and a reader
 * scoped to one key reported the other producer's rows as missing evidence.
 *
 * `decideEvidenceReview` — the governed promotion that turns `review_required`
 * into `committed` for the readiness resolver — was not widened with it. So the
 * halves disagreed: the cabinet listed a canonical-substrate-key row AS pending
 * with its review controls live, and every predicate in the promotion missed
 * that row, so the route answered 409 `no_pending_review` for the very item on
 * screen. The phase could never be exited through the UI, and nothing on the
 * surface said why.
 *
 * That is the worst shape this product has — an offered control that cannot
 * succeed — and it is not hypothetical: one Move's evidence was loaded under
 * the canonical key and needed a one-off rekey repair
 * (`docs/governance/data-repairs/`). A reader that sees both keys makes that
 * repair unnecessary for reading; this suite is what makes it unnecessary for
 * approving too.
 *
 * What is pinned, and the discriminators that make each case non-vacuous:
 *
 *   1  a row under the canonical substrate key is promotable, and actually
 *      flips in the store (not merely reported ok);
 *   2  a row under the app client key still is — the widening is additive;
 *   3  another tenant's pending row for the same Move id is NOT promotable and
 *      is left untouched, so the widened set is never a way in;
 *   4  the match predicate carries both of this tenant's keys and neither
 *      carries another tenant's;
 *   5  no tenant promotes nothing and writes nothing;
 *   6  the widening moved the MATCH only — the written values still carry no
 *      tenant key, so a promotion cannot re-key the row it matched.
 *
 * Tenant keys are derived from the alias table in code, never hand-typed, so a
 * profile change cannot leave these cases comparing a key against itself.
 */
const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockFilters: Array<{ table: string; column: string; value: unknown }> =
  [];
const mockUpdates: Array<{ table: string; values: Record<string, unknown> }> =
  [];
const mockInserts: Array<{ table: string; values: Record<string, unknown> }> =
  [];

jest.mock("server-only", () => ({}));
jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: jest.fn(async () => {}),
  writeProgramAuditLog: jest.fn(async () => {}),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => {
      const filters: Array<{ column: string; value: unknown }> = [];
      let pendingUpdate: Record<string, unknown> | null = null;
      let insertedRow: Record<string, unknown> | null = null;
      const rowsFor = () =>
        (table === "program_evidence_reviews"
          ? mockReviewRows
          : mockEvidenceRows
        ).filter((row) =>
          filters.every((filter) =>
            Array.isArray(filter.value)
              ? filter.value.includes(row[filter.column])
              : row[filter.column] === filter.value,
          ),
        );
      // An update applies at the terminal call, after its own filters have been
      // chained on — which is the order the caller builds them in.
      const settle = () => {
        const rows = rowsFor();
        if (pendingUpdate) {
          for (const row of rows) Object.assign(row, pendingUpdate);
        }
        return rows;
      };
      const query = {
        select: () => query,
        update: (values: Record<string, unknown>) => {
          mockUpdates.push({ table, values });
          pendingUpdate = values;
          return query;
        },
        insert: (values: Record<string, unknown>) => {
          mockInserts.push({ table, values });
          insertedRow = { id: `inserted-${mockInserts.length}`, ...values };
          (table === "program_evidence_reviews"
            ? mockReviewRows
            : mockEvidenceRows
          ).push(insertedRow);
          return query;
        },
        eq: (column: string, value: unknown) => {
          mockFilters.push({ table, column, value });
          filters.push({ column, value });
          return query;
        },
        in: (column: string, value: unknown[]) => {
          mockFilters.push({ table, column, value });
          filters.push({ column, value });
          return query;
        },
        maybeSingle: () =>
          Promise.resolve({
            data: insertedRow ?? settle()[0] ?? null,
            error: null,
          }),
        single: () =>
          Promise.resolve({
            data: insertedRow ?? settle()[0] ?? null,
            error: null,
          }),
        // Thenable, so the chain resolves wherever the caller stops filtering
        // rather than at a hardcoded terminal call.
        then: (resolve: (result: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data: settle(), error: null }).then(resolve),
      };
      return query;
    },
  }),
}));

import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import { decideEvidenceReview } from "../current-state-doc-ingest";
import type { TenancyCtx } from "../types.db";

/** A tenant whose app client key and canonical substrate key differ. */
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
/** Any other tenant, used to prove the widened set is not a way in. */
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

const ctxFor = (clientKey: string) =>
  ({ clientKey, userId: "reviewer@example.com" }) as unknown as TenancyCtx;

const EVIDENCE_ID = "11111111-1111-4111-8111-111111111111";
const MOVE_ID = "move-a";

const review = (tenantKey: string, decision: string) => ({
  id: `review-${tenantKey}`,
  evidence_id: EVIDENCE_ID,
  tenant_key: tenantKey,
  program_id: MOVE_ID,
  family_key: "data_governance_ownership",
  decision,
  source_ref: { filename: "ownership.md" },
});

const evidence = (tenantKey: string) => ({
  id: EVIDENCE_ID,
  tenant_key: tenantKey,
  program_id: MOVE_ID,
  evidence_type: "data_governance_ownership",
  title: "ownership.md",
  confidence: 0.9,
  phase: 2,
  extracted_structured: null,
});

/** A valid reviewed extraction; `decideEvidenceReview` refuses without one. */
const EXTRACTION = {
  version: 1 as const,
  summary: "Named data owners per domain.",
  structured: {
    decisions: ["Domain leads own their data products."],
    risks: [],
    baselineCandidates: [],
    actionItems: [],
    observations: [],
    assumptions: [],
    openQuestions: [],
    citations: [{ quote: "Owner: domain lead", locator: "p.1" }],
  },
};

const approve = (clientKey: string) =>
  decideEvidenceReview(ctxFor(clientKey), {
    moveId: MOVE_ID,
    evidenceId: EVIDENCE_ID,
    decision: "approved",
    reviewedExtraction: EXTRACTION,
  });

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockFilters.length = 0;
  mockUpdates.length = 0;
  mockInserts.length = 0;
});

describe("the fixture these cases rest on", () => {
  it("is a tenant with two distinct keys, plus a second tenant", () => {
    // Without this the derivations could be undefined and every case below
    // would compare a key against itself and pass for the wrong reason.
    expect(SPLIT_KEY_TENANT).toBeTruthy();
    expect(APP_KEY).toBeTruthy();
    expect(CANONICAL_KEY).toBeTruthy();
    expect(APP_KEY).not.toEqual(CANONICAL_KEY);
    expect(OTHER_TENANT_KEY).toBeTruthy();
    expect(OTHER_TENANT_KEY).not.toEqual(CANONICAL_KEY);
    expect(OTHER_TENANT_KEY).not.toEqual(APP_KEY);
  });
});

describe("decideEvidenceReview — tenant match scope", () => {
  it("promotes a pending row stored under the tenant's canonical substrate key", async () => {
    // The case the product actually hit: the cabinet lists this row as
    // pending, so refusing it here is a control that cannot succeed.
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.decision).toBe("approved");
    expect(result.familyKey).toBe("data_governance_ownership");
    // Reported ok is not enough — the stored row has to have flipped.
    expect(mockReviewRows[0]?.decision).toBe("approved");
  });

  it("still promotes a pending row stored under the app client key", async () => {
    mockReviewRows.push(review(APP_KEY, "pending"));
    mockEvidenceRows.push(evidence(APP_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(true);
    expect(mockReviewRows[0]?.decision).toBe("approved");
  });

  it("refuses another tenant's pending row for the same Move id, and leaves it pending", async () => {
    mockReviewRows.push(review(OTHER_TENANT_KEY, "pending"));
    mockEvidenceRows.push(evidence(OTHER_TENANT_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(false);
    expect(mockReviewRows[0]?.decision).toBe("pending");
  });

  it("matches on both of this tenant's keys and on neither of another's", async () => {
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    await approve(APP_KEY);

    const tenantFilters = mockFilters.filter(
      (filter) => filter.column === "tenant_key",
    );
    expect(tenantFilters.length).toBeGreaterThan(0);
    for (const filter of tenantFilters) {
      expect(filter.value).toEqual(
        expect.arrayContaining([APP_KEY, CANONICAL_KEY]),
      );
      expect(filter.value).not.toEqual(
        expect.arrayContaining([OTHER_TENANT_KEY]),
      );
    }
  });

  it("promotes nothing and writes nothing without a tenant", async () => {
    mockReviewRows.push(review(APP_KEY, "pending"));
    mockEvidenceRows.push(evidence(APP_KEY));

    const result = await approve("");

    expect(result.ok).toBe(false);
    expect(mockReviewRows[0]?.decision).toBe("pending");
  });

  it("promotes an evidence item under the canonical key that has no review row yet", async () => {
    // The late-review path: the loader wrote the evidence item but no review
    // row. Scoped narrowly this lookup missed the item too, so the approval
    // had nothing to open a review against and answered `no_pending_review`.
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.decision).toBe("approved");
    expect(mockInserts).toHaveLength(1);
  });

  it("reports an already-approved canonical-key row as decided, without a duplicate", async () => {
    // Scoped narrowly, this fell past the decided row to the late-review path
    // and INSERTED a second review for the same evidence under the app client
    // key — one evidence item carrying two reviews under two keys of one
    // tenant, which is the split this widening exists to stop.
    mockReviewRows.push(review(CANONICAL_KEY, "approved"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.decision).toBe("approved");
    expect(mockInserts).toHaveLength(0);
    expect(mockReviewRows).toHaveLength(1);
  });

  it("widens the match only — a promotion never re-keys the row it matched", async () => {
    // The read-scope module's contract is that writes stay keyed to the single
    // `ctx.clientKey`. Widening the predicate must not start writing a key.
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    await approve(APP_KEY);

    expect(mockUpdates.length).toBeGreaterThan(0);
    for (const update of mockUpdates) {
      expect(update.values).not.toHaveProperty("tenant_key");
    }
    expect(mockReviewRows[0]?.tenant_key).toBe(CANONICAL_KEY);
  });
});

describe("the promotion says WHICH refusal this is", () => {
  /**
   * Three different situations used to share one bare `ok: false`, and the
   * route answered all three with `no_pending_review` — whose reviewer sentence
   * states the decision was already recorded and sends them to reload and read
   * it. For the one where the evidence is not on the Move at all there is
   * nothing to read, so the sentence was a fabrication. The route can only tell
   * them apart if the promotion reports the reason, and `familyKey` cannot
   * stand in: `family_key` is nullable, so an existing review can report the
   * same shape as a missing one.
   */
  it("reports evidence that is not on this Move as not found", async () => {
    const result = await approve(APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("evidence_not_found");
    expect(mockInserts).toHaveLength(0);
  });

  it("reports another tenant's rows as not found rather than already decided", async () => {
    // The widened match is never a way in, and the refusal must not imply a
    // decision exists for this tenant to read.
    mockReviewRows.push(review(OTHER_TENANT_KEY, "pending"));
    mockEvidenceRows.push(evidence(OTHER_TENANT_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("evidence_not_found");
  });

  it("reports an already-decided review as already decided, with its decision", async () => {
    mockReviewRows.push(review(CANONICAL_KEY, "rejected"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("already_decided");
    expect(result.decision).toBe("rejected");
  });

  it("reports a missing reviewed extraction as its own refusal", async () => {
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await decideEvidenceReview(ctxFor(APP_KEY), {
      moveId: MOVE_ID,
      evidenceId: EVIDENCE_ID,
      decision: "approved",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("reviewed_extraction_missing");
    expect(mockUpdates).toHaveLength(0);
  });

  it("reports no reason at all when the promotion succeeds", async () => {
    // Non-vacuous: the reason field is a refusal discriminator, so a success
    // that carried one would make every case above read as a refusal.
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY));

    const result = await approve(APP_KEY);

    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

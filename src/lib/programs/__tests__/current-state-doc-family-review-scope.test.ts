const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockFilters: Array<{ table: string; column: string; value: unknown }> =
  [];

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => {
      const filters: Array<{ column: string; value: unknown }> = [];
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
      // Thenable, so the chain resolves wherever the reader stops filtering
      // rather than at a hardcoded terminal call.
      const query = {
        select: () => query,
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
        then: (
          resolve: (result: { data: unknown; error: null }) => unknown,
        ) => Promise.resolve({ data: rowsFor(), error: null }).then(resolve),
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
import { resolveDocFamilyReviews } from "../current-state-doc-ingest";
import {
  DECIDED_EVIDENCE_REVIEW_DECISIONS,
  describeRejectedEvidenceReview,
  isDecidedEvidenceReviewDecision,
  splitDecidedEvidenceReviews,
} from "../evidence-review-dispositions";
import type { TenancyCtx } from "../types.db";

// Tenant keys come from code, never hand-typed. These cases turn on ONE tenant
// being stored under more than one of its own keys, so both keys are derived
// from the alias table itself, and a second, unrelated tenant comes from the
// same source.
/** A tenant whose app client key and canonical substrate key differ. */
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
/** Any other tenant, used to prove the scope set is not a way in. */
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

const ctxFor = (clientKey: string) => ({ clientKey }) as unknown as TenancyCtx;

const review = (tenantKey: string, decision: string) => ({
  id: `review-${tenantKey}-${decision}`,
  evidence_id: `evidence-${tenantKey}-${decision}`,
  tenant_key: tenantKey,
  program_id: "move-a",
  family_key: "data_governance_ownership",
  decision,
  source_ref: { filename: "ownership.md" },
  created_at: "2026-10-07T00:00:00.000Z",
});

const evidence = (tenantKey: string, decision: string) => ({
  id: `evidence-${tenantKey}-${decision}`,
  tenant_key: tenantKey,
  program_id: "move-a",
  title: "ownership.md",
  summary: "Named data owners per domain.",
  extracted_text: "Owner: domain lead",
  extracted_structured: null,
});

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockFilters.length = 0;
});

describe("resolveDocFamilyReviews — tenant read scope", () => {
  it("sees an approved row stored under the tenant's canonical substrate key", async () => {
    // This is the P2 gate's reader. The product writes the app client key; a
    // data-plane load writes the canonical substrate key. Scoped to the app
    // client key alone, an approved family read as `missing`, and the phase
    // counted it a hard gap.
    mockReviewRows.push(review(CANONICAL_KEY, "approved"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY, "approved"));

    const state = await resolveDocFamilyReviews(
      ctxFor(APP_KEY),
      "move-a",
      "data_governance_ownership",
    );

    expect(state.approved).toBe(1);
    expect(state.pending).toBe(0);
    expect(state.committedSignals.length).toBeGreaterThan(0);
  });

  it("still sees a row stored under the app client key", async () => {
    mockReviewRows.push(review(APP_KEY, "approved"));
    mockEvidenceRows.push(evidence(APP_KEY, "approved"));

    const state = await resolveDocFamilyReviews(
      ctxFor(APP_KEY),
      "move-a",
      "data_governance_ownership",
    );

    expect(state.approved).toBe(1);
  });

  it("counts a pending row under either key once, and carries its extraction", async () => {
    mockReviewRows.push(review(CANONICAL_KEY, "pending"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY, "pending"));

    const state = await resolveDocFamilyReviews(
      ctxFor(APP_KEY),
      "move-a",
      "data_governance_ownership",
    );

    expect(state.approved).toBe(0);
    expect(state.pending).toBe(1);
    expect(state.pendingItems).toHaveLength(1);
    expect(state.pendingItems[0]?.sourceTextPreview).toBe("Owner: domain lead");
  });

  it("does not see another tenant's rows for the same Move id", async () => {
    // Widening is per-tenant: a key outside this tenant's own alias profile
    // stays unreadable, so the scope set is never a way in.
    mockReviewRows.push(review(OTHER_TENANT_KEY, "approved"));
    mockEvidenceRows.push(evidence(OTHER_TENANT_KEY, "approved"));

    const state = await resolveDocFamilyReviews(
      ctxFor(APP_KEY),
      "move-a",
      "data_governance_ownership",
    );

    expect(state.approved).toBe(0);
    expect(state.pending).toBe(0);
  });

  it("reads nothing at all without a tenant", async () => {
    mockReviewRows.push(review(APP_KEY, "approved"));

    const state = await resolveDocFamilyReviews(
      ctxFor(""),
      "move-a",
      "data_governance_ownership",
    );

    expect(state.approved).toBe(0);
    expect(mockFilters).toHaveLength(0);
  });

  it("fences both reads to the tenant key set and to the Move", async () => {
    mockReviewRows.push(review(CANONICAL_KEY, "approved"));
    mockEvidenceRows.push(evidence(CANONICAL_KEY, "approved"));

    await resolveDocFamilyReviews(
      ctxFor(APP_KEY),
      "move-a",
      "data_governance_ownership",
    );

    const tenantFilters = mockFilters.filter(
      (filter) => filter.column === "tenant_key",
    );
    expect(tenantFilters).toHaveLength(2);
    for (const filter of tenantFilters) {
      expect(filter.value).toEqual(expect.arrayContaining([APP_KEY, CANONICAL_KEY]));
      expect(filter.value).not.toEqual(
        expect.arrayContaining([OTHER_TENANT_KEY]),
      );
    }
    expect(
      mockFilters.filter(
        (filter) => filter.column === "program_id" && filter.value === "move-a",
      ),
    ).toHaveLength(2);
  });
});

// ── The decided decisions ─────────────────────────────────────────────────────
//
// Hosted here because these cases are about the same column as the suite above
// — `program_evidence_reviews.decision` — and its domain is declared by the
// module this suite already imports.
//
// The cabinet asked for TWO of the column's three values by name: the queue for
// `pending`, the reviewed list for `approved`. `rejected` was therefore in
// neither read and appeared on no surface, while the queue's own explainer
// sentence named it as a state. These cases pin the decided SET and the split,
// which is what keeps a third value from going unread again.
describe("decided program-evidence review decisions", () => {
  it("covers exactly the non-pending half of the decision domain", () => {
    expect([...DECIDED_EVIDENCE_REVIEW_DECISIONS].sort()).toEqual([
      "approved",
      "rejected",
    ]);
    // The defect in one assertion: `rejected` is a decided decision, so a read
    // that asks only for `approved` is asking for half of them.
    expect(isDecidedEvidenceReviewDecision("rejected")).toBe(true);
    expect(isDecidedEvidenceReviewDecision("approved")).toBe(true);
    // `pending` is the queue's own read and must not be in this set: a pending
    // row in the reviewed list would report evidence as committed before a
    // human accepted it.
    expect(isDecidedEvidenceReviewDecision("pending")).toBe(false);
  });

  it("splits one read into the approved and the rejected list", () => {
    const rows = [
      { id: "a", decision: "approved" },
      { id: "r", decision: "rejected" },
      { id: "a2", decision: "approved" },
    ];

    const { approved, rejected } = splitDecidedEvidenceReviews(rows);

    expect(approved.map((row) => row.id)).toEqual(["a", "a2"]);
    expect(rejected.map((row) => row.id)).toEqual(["r"]);
  });

  it("puts a pending row in neither list", () => {
    const { approved, rejected } = splitDecidedEvidenceReviews([
      { id: "p", decision: "pending" },
    ]);

    expect(approved).toEqual([]);
    expect(rejected).toEqual([]);
  });

  it("puts a decision it does not recognise in neither list", () => {
    // A value added to the column later must not be rendered as accepted
    // evidence by a list that has not been taught what it means.
    const { approved, rejected } = splitDecidedEvidenceReviews([
      { id: "x", decision: "withdrawn" },
      { id: "y" },
    ]);

    expect(approved).toEqual([]);
    expect(rejected).toEqual([]);
  });

  it("names the rejected state and the action that can still succeed", () => {
    const rejection = describeRejectedEvidenceReview({
      rationale: "The parser merged two baselines.",
    });

    expect(rejection.label).toBe("Rejected");
    expect(rejection.rationale).toBe("The parser merged two baselines.");
    // The two actions that CANNOT work must not be prescribed: the stored
    // decision is never re-decided (the guarded update filters on `pending`),
    // and the same file parses to the extraction that was rejected.
    expect(rejection.nextAction).toMatch(/cannot be re-decided/i);
    expect(rejection.nextAction).toMatch(/same file produces the same/i);
    // The one that does.
    expect(rejection.nextAction).toMatch(
      /corrected file or a different source/i,
    );
  });

  it("reports no reason rather than an empty one", () => {
    // `rationale` is nullable on the column, and a blank string would render as
    // if the reviewer had left a reason.
    expect(describeRejectedEvidenceReview({ rationale: "   " }).rationale).toBe(
      null,
    );
    expect(describeRejectedEvidenceReview({ rationale: null }).rationale).toBe(
      null,
    );
    expect(describeRejectedEvidenceReview({}).rationale).toBe(null);
    // The action does not depend on a reason being recorded.
    expect(describeRejectedEvidenceReview({}).nextAction).toBe(
      describeRejectedEvidenceReview({ rationale: "any" }).nextAction,
    );
  });
});

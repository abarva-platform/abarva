import { buildContractEvidencePersistencePayload } from "../persistence";
import type { SourceContractEvidencePackInput } from "../types";

const TENANT_KEY = "lakeshore";
const OPPOSITE_TENANT_KEY = "skyharbor-air";

// The manifest fence was asserted here from the start; the per-row and per-metric
// fences were not, so replacing `input.tenantKey` inside `toStructuredRows()` or
// `metric()` with a constant left all three cases green while every structured row
// and every derived metric went to the wrong tenant (item T-755). Collapsing to the
// distinct set asserts EVERY element rather than a sampled one -- a `toMatchObject`
// on `rows[1]` is how this was missed -- and the accompanying length assertion is
// what stops an empty array from satisfying it vacuously.
function distinctTenantKeys(
  rows: ReadonlyArray<{ tenant_key: string }>,
): string[] {
  return [...new Set(rows.map((row) => row.tenant_key))];
}

const baseInput: SourceContractEvidencePackInput = {
  tenantKey: TENANT_KEY,
  sourceEventId: "LAKE-AMS-CONTRACT-OPT-2026",
  sourceArtifactId: "11111111-1111-4111-8111-111111111111",
  archetypeKey: "ams_contract_optimization",
  evidencePackName: "Lakeshore AMS optimization extracts",
  uploadBatchId: "batch-20260704-001",
  sourceType: "client_uploaded",
  rows: [
    {
      family: "contract_baseline",
      payload: {
        contract_name: "Lakeshore Shared Services AMS MSA",
        incumbent_vendor: "Vendor A",
        annual_run_rate_usd: 15_400_000,
        term_end: "2027-03-31",
        renewal_notice_date: "2026-09-30",
      },
    },
    {
      family: "invoice_summary",
      sourceSheet: "Invoice Summary",
      sourceRowNumber: 2,
      payload: {
        month: "2026-03-01",
        category: "Run",
        contracted_amount_usd: 1_250_000,
        invoiced_amount_usd: 1_340_000,
        variance_reason: "After-hours support uplift",
      },
    },
    {
      family: "invoice_exception",
      payload: {
        exception_id: "INV-EX-1042",
        month: "2026-03-01",
        vendor_claim_usd: 96_000,
        supported_amount_usd: 42_000,
        issue: "Run work charged as change order",
      },
    },
    {
      family: "sla_performance",
      payload: {
        service_level: "P1 restoration",
        target_pct: 99,
        actual_pct: 96.7,
        credit_cap_pct: 5,
        period: "2026-03-01",
      },
    },
    {
      family: "ticket_volume",
      payload: {
        month: "2026-03-01",
        tower: "Finance apps",
        baseline_tickets: 7420,
        actual_tickets: 8610,
        reopen_rate_pct: 7.1,
      },
    },
    {
      family: "staffing_model",
      payload: {
        tower: "Finance apps",
        committed_fte: 32,
        observed_fte: 28,
        coverage: "16x5 plus on-call",
        location_mix: "30% onshore / 70% offshore",
      },
    },
    {
      family: "change_order",
      payload: {
        request_id: "CO-2026-018",
        category: "Recurring support",
        amount_usd: 84_000,
        recurring: true,
        approval_evidence: "partial",
      },
    },
    {
      family: "renewal_terms",
      payload: {
        term_key: "non_renewal_notice",
        date: "2026-09-30",
        summary: "Notice required 180 days before term end.",
        risk_level: "high",
      },
    },
  ],
};

describe("Source contract evidence persistence payload", () => {
  it("builds a tenant-scoped manifest, structured rows, and deterministic rollups", () => {
    const payload = buildContractEvidencePersistencePayload(baseInput);

    expect(payload.manifest).toMatchObject({
      tenant_key: TENANT_KEY,
      source_event_id: "LAKE-AMS-CONTRACT-OPT-2026",
      source_type: "client_uploaded",
      validation_status: "accepted",
      row_count: 8,
      required_family_count: 8,
      covered_required_family_count: 8,
      missing_required_families: [],
    });
    expect(payload.manifest.metadata.persistenceBoundary).toContain(
      "Structured sourcing-critical extracts only",
    );
    expect(payload.rows).toHaveLength(8);
    expect(distinctTenantKeys(payload.rows)).toEqual([TENANT_KEY]);
    expect(payload.metrics.length).toBeGreaterThan(0);
    expect(distinctTenantKeys(payload.metrics)).toEqual([TENANT_KEY]);
    expect(payload.rows[0]?.row_hash).toHaveLength(64);
    expect(payload.rows[1]).toMatchObject({
      evidence_family: "invoice_summary",
      source_sheet: "Invoice Summary",
      source_row_number: 2,
      period_start: "2026-03-01",
      amount_usd: 1_340_000,
      normalized_subject: "Run",
      validation_status: "accepted",
    });

    expect(
      Object.fromEntries(payload.metrics.map((metric) => [metric.metric_key, metric.metric_value])),
    ).toMatchObject({
      invoice_variance_usd: 90_000,
      invoice_exception_exposure_usd: 54_000,
      sla_miss_count: 1,
      staffing_gap_fte: 4,
      recurring_change_order_exposure_usd: 84_000,
      ticket_volume_above_baseline: 1190,
    });
  });

  it("uses explicit breach direction and credit state for SLA metrics", () => {
    const payload = buildContractEvidencePersistencePayload({
      ...baseInput,
      rows: [
        ...baseInput.rows.filter((row) => row.family !== "sla_performance"),
        {
          family: "sla_performance",
          payload: {
            service_level: "Critical incident response minutes",
            target_pct: 30,
            actual_pct: 35,
            threshold_direction: "maximum",
            breach_state: "missed",
            credit_owed_usd: 8177.08,
            credit_claimed: false,
            period: "2026-09-01",
          },
        },
        {
          family: "sla_performance",
          payload: {
            service_level: "Batch completion by 7am",
            target_pct: 98,
            actual_pct: 94,
            threshold_direction: "minimum",
            breach_state: "missed",
            credit_owed_usd: 6541.67,
            credit_claimed: true,
            period: "2026-11-01",
          },
        },
      ],
    });

    expect(payload.manifest.tenant_key).toBe(TENANT_KEY);
    expect(payload.rows).toHaveLength(9);
    expect(distinctTenantKeys(payload.rows)).toEqual([TENANT_KEY]);
    expect(payload.metrics.length).toBeGreaterThan(0);
    expect(distinctTenantKeys(payload.metrics)).toEqual([TENANT_KEY]);

    const metrics = Object.fromEntries(
      payload.metrics.map((metric) => [metric.metric_key, metric.metric_value]),
    );
    expect(metrics.sla_miss_count).toBe(2);
    expect(metrics.unclaimed_service_credit_usd).toBe(8177.08);
  });

  it("marks incomplete packs partial and calls out synthetic demo evidence", () => {
    const payload = buildContractEvidencePersistencePayload({
      ...baseInput,
      sourceType: "synthetic_demo",
      rows: baseInput.rows.filter((row) => row.family !== "staffing_model"),
    });

    expect(payload.manifest.tenant_key).toBe(TENANT_KEY);
    expect(payload.rows).toHaveLength(7);
    expect(distinctTenantKeys(payload.rows)).toEqual([TENANT_KEY]);
    expect(payload.metrics.length).toBeGreaterThan(0);
    expect(distinctTenantKeys(payload.metrics)).toEqual([TENANT_KEY]);
    expect(payload.manifest.validation_status).toBe("partial");
    expect(payload.manifest.missing_required_families).toEqual(["staffing_model"]);
    expect(payload.manifest.warnings).toContain(
      "Synthetic demo evidence; do not treat as client-approved truth.",
    );
    expect(payload.rows[0]?.confidence).toBe(0.7);
  });

  it("carries the caller's tenant into the manifest, every row and every metric", () => {
    // The three cases above all run under one tenant, so a fence replaced by the
    // literal "lakeshore" rather than by a foreign constant would still satisfy
    // them. Building the identical pack under a second tenant is what makes these
    // assertions prove the value is DERIVED FROM THE INPUT rather than merely equal
    // to the one string the fixture happens to use.
    expect(OPPOSITE_TENANT_KEY).not.toBe(TENANT_KEY);

    const payload = buildContractEvidencePersistencePayload({
      ...baseInput,
      tenantKey: OPPOSITE_TENANT_KEY,
    });

    expect(payload.manifest.tenant_key).toBe(OPPOSITE_TENANT_KEY);
    expect(payload.rows).toHaveLength(8);
    expect(distinctTenantKeys(payload.rows)).toEqual([OPPOSITE_TENANT_KEY]);
    expect(payload.metrics.length).toBeGreaterThan(0);
    expect(distinctTenantKeys(payload.metrics)).toEqual([OPPOSITE_TENANT_KEY]);

    // Same input but for the tenant key: nothing else in the payload may move, or
    // an "opposite tenant" case would be proving a different pack rather than the
    // same pack under a different fence.
    const home = buildContractEvidencePersistencePayload(baseInput);
    expect(payload.rows.map((row) => row.row_hash)).toEqual(
      home.rows.map((row) => row.row_hash),
    );
    expect(payload.metrics.map((metric) => metric.metric_value)).toEqual(
      home.metrics.map((metric) => metric.metric_value),
    );
  });
});

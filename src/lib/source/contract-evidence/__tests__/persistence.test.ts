import { buildContractEvidencePersistencePayload } from "../persistence";
import type { SourceContractEvidencePackInput } from "../types";

const baseInput: SourceContractEvidencePackInput = {
  tenantKey: "lakeshore",
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
      tenant_key: "lakeshore",
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

  it("marks incomplete packs partial and calls out synthetic demo evidence", () => {
    const payload = buildContractEvidencePersistencePayload({
      ...baseInput,
      sourceType: "synthetic_demo",
      rows: baseInput.rows.filter((row) => row.family !== "staffing_model"),
    });

    expect(payload.manifest.validation_status).toBe("partial");
    expect(payload.manifest.missing_required_families).toEqual(["staffing_model"]);
    expect(payload.manifest.warnings).toContain(
      "Synthetic demo evidence; do not treat as client-approved truth.",
    );
    expect(payload.rows[0]?.confidence).toBe(0.7);
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildSubscriptionEvidencePackage } from "../build-subscription-evidence-package.mjs";

const config = () => ({
  tenant_key: "tenant-test",
  dataset_version: "subscription-test-v1",
  contract_id: "contract-test",
  vendor_ref: "vendor-test",
  vendor_name: "Fixture vendor",
  contract_name: "Fixture subscription",
  source_record_id: "declared:contract-test",
  application_id: "app-test",
  application_name: "Fixture application",
  business_owner: "Contract owner",
  it_owner: "Platform owner",
  reporting_cutoff: "2026-09-30",
  first_month: "2025-10",
  start_date: "2024-10-01",
  end_date: "2028-12-31",
  notice_period_days: 120,
  archetype: "software_subscription",
  archetype_authority: "engineering_declared",
  entitled_seats: 2500,
  minimum_seats: 2200,
  monthly_unit_price: 219.2,
  active_seats: [
    2100, 2075, 2050, 2025, 2000, 1975, 1950, 1925, 1900, 1850, 1825, 1800,
  ],
  synthetic_policy: "synthetic_demo_only_not_client_truth",
  document_ids: {
    agreement: "DOC-test-agreement",
    scope: "DOC-test-scope",
    usage: "DOC-test-usage",
    invoices: "DOC-test-invoices",
    performance: "DOC-test-performance",
    changes: "DOC-test-changes",
  },
  assumption_basis:
    "Authored synthetic scenario, not observed client evidence.",
});

test("builds coherent invoices, payments, usage and cited terms without financial claims", () => {
  const pack = buildSubscriptionEvidencePackage(config());
  const spend = pack.tables.monthly_spend;
  assert.equal(spend.length, 12);
  assert.equal(
    spend.reduce((n, r) => n + Number(r.actual_spend_usd), 0),
    6576000,
  );
  assert.equal(pack.tables.saas_usage[11].unused_quantity, 700);
  assert.equal(pack.diagnostics.unused_entitlement_share, 0.28);
  assert.equal(pack.diagnostics.maximum_renewal_reduction_quantity, 300);
  assert.equal(pack.diagnostics.candidate_savings_usd, null);
  assert.equal(pack.tables.optimization_opportunities[0].annual_value_usd, "");
  assert.ok(
    pack.tables.invoice_line_detail.every(
      (r) => r.invoice_id && r.payment_reference,
    ),
  );
  assert.ok(
    pack.tables.invoice_line_detail.every(
      (r) =>
        r.line_amount_usd === r.quantity * r.unit_price_usd &&
        r.line_type === "subscription",
    ),
  );
  assert.equal(pack.tables.invoice_line_detail[11].paid_amount_usd, 0);
  assert.ok(
    pack.tables.contract_page_text.every(
      (r) =>
        pack.documents[`contract-test-${r.source_file_id}.txt`] === r.page_text,
    ),
  );
  assert.equal(pack.assumption_basis, config().assumption_basis);
  assert.ok(
    pack.tables.contract_clauses.every(
      (r) => r.review_state === "not_reviewed",
    ),
  );
  assert.ok(
    pack.tables.evidence_manifest.every((r) =>
      r.source_system.startsWith("Synthetic "),
    ),
  );
  assert.ok(
    pack.tables.contract_page_text.every((r) =>
      r.page_text.includes("Synthetic scenario"),
    ),
  );
  assert.equal(
    pack.tables.contracts[0].source_record_id,
    "declared:contract-test",
  );
});

for (const [label, mutate, pattern] of [
  [
    "missing binding",
    (c) => {
      delete c.source_record_id;
    },
    /source_record_id/,
  ],
  [
    "missing archetype authority",
    (c) => {
      delete c.archetype_authority;
    },
    /archetype/,
  ],
  [
    "non-synthetic package",
    (c) => {
      c.synthetic_policy = "client_truth";
    },
    /synthetic/,
  ],
  [
    "future period",
    (c) => {
      c.first_month = "2026-01";
    },
    /cutoff/,
  ],
  [
    "missing measured quantity",
    (c) => {
      c.active_seats[1] = null;
    },
    /active_seats/,
  ],
  [
    "quantity above entitlement",
    (c) => {
      c.active_seats[1] = 2501;
    },
    /active_seats/,
  ],
  [
    "missing price",
    (c) => {
      c.monthly_unit_price = null;
    },
    /monthly_unit_price/,
  ],
  [
    "invalid minimum",
    (c) => {
      c.minimum_seats = 2501;
    },
    /minimum_seats/,
  ],
  [
    "invalid calendar date",
    (c) => {
      c.reporting_cutoff = "2026-02-30";
    },
    /reporting_cutoff/,
  ],
  [
    "invalid month",
    (c) => {
      c.first_month = "2025-13";
    },
    /first_month/,
  ],
  [
    "undeclared assumptions",
    (c) => {
      delete c.assumption_basis;
    },
    /assumption_basis/,
  ],
  [
    "undeclared document identities",
    (c) => {
      delete c.document_ids;
    },
    /document_ids/,
  ],
  [
    "duplicate document identities",
    (c) => {
      c.document_ids.usage = c.document_ids.invoices;
    },
    /document_ids/,
  ],
]) {
  test(`refuses ${label}`, () => {
    const c = config();
    mutate(c);
    assert.throws(() => buildSubscriptionEvidencePackage(c), pattern);
  });
}

test("has deterministic source IDs, hashes and calculations", () => {
  assert.deepEqual(
    buildSubscriptionEvidencePackage(config()),
    buildSubscriptionEvidencePackage(config()),
  );
});

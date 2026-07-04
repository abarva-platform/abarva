#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildContractEvidencePersistencePayload } from "../../src/lib/source/contract-evidence/persistence.ts";
import { getContractEvidenceTemplatePack } from "../../src/lib/source/contract-evidence/templates.ts";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(
  os.homedir(),
  "Downloads",
  `source-contract-evidence-persistence-smoke-${timestamp}`,
);

const input = {
  tenantKey: "lakeshore",
  sourceEventId: "LAKE-AMS-CONTRACT-OPT-2026",
  sourceArtifactId: "11111111-1111-4111-8111-111111111111",
  archetypeKey: "ams_contract_optimization",
  evidencePackName: "Lakeshore AMS optimization extracts",
  uploadBatchId: `smoke-${timestamp}`,
  sourceType: "client_uploaded",
  metadata: {
    smoke: true,
    note: "Representative structured extracts; not a raw invoice/ticket dump.",
  },
  rows: [
    {
      family: "contract_baseline",
      payload: {
        contract_name: "Lakeshore Shared Services AMS MSA",
        incumbent_vendor: "Vendor A",
        annual_run_rate_usd: 15400000,
        term_end: "2027-03-31",
        renewal_notice_date: "2026-09-30",
      },
    },
    {
      family: "invoice_summary",
      payload: {
        month: "2026-03-01",
        category: "Run",
        contracted_amount_usd: 1250000,
        invoiced_amount_usd: 1340000,
        variance_reason: "After-hours support uplift",
      },
    },
    {
      family: "invoice_exception",
      payload: {
        exception_id: "INV-EX-1042",
        month: "2026-03-01",
        vendor_claim_usd: 96000,
        supported_amount_usd: 42000,
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
        amount_usd: 84000,
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

const payload = buildContractEvidencePersistencePayload(input);
const templatePack = getContractEvidenceTemplatePack("ams_contract_optimization");

await mkdir(outDir, { recursive: true });
await writeFile(
  path.join(outDir, "template-pack.json"),
  JSON.stringify(templatePack, null, 2),
);
await writeFile(
  path.join(outDir, "persistence-payload.json"),
  JSON.stringify(payload, null, 2),
);
await writeFile(
  path.join(outDir, "summary.md"),
  [
    "# Source Contract Evidence Persistence Smoke",
    "",
    `Output folder: \`${outDir}\``,
    "",
    "## Result",
    "",
    `- Manifest status: ${payload.manifest.validation_status}`,
    `- Structured rows: ${payload.rows.length}`,
    `- Derived metrics: ${payload.metrics.length}`,
    `- Missing required families: ${payload.manifest.missing_required_families.join(", ") || "None"}`,
    "",
    "## Boundary",
    "",
    "This proof stores summarized sourcing-critical extracts only. Raw invoices, raw tickets, and full contracts remain in client systems or Blob-backed Source artifacts.",
  ].join("\n"),
);

console.log(JSON.stringify({ outDir, manifest: payload.manifest, metrics: payload.metrics }, null, 2));

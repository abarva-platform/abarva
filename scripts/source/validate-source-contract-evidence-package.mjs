#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const REQUIRED_FILES = [
  "manifest.json",
  "documents/pdf_extraction_quality_report.json",
  "synthetic/contract_overview.csv",
  "synthetic/contract_pricing_schedule.csv",
  "synthetic/invoice_lines.csv",
  "synthetic/po_contract_match.csv",
  "synthetic/rate_card_variance.csv",
  "synthetic/renewal_negotiation_history.csv",
  "synthetic/sla_incident_service_credit_monthly.csv",
  "synthetic/usage_entitlement_monthly.csv",
  "synthetic/finance_value_confirmation.csv",
  "synthetic/contract_application_scope.csv",
  "synthetic/contract_pdf_document_inventory.csv",
  "synthetic/contract_pdf_page_text.csv",
  "synthetic/contract_pdf_clause_extractions.csv",
  "reconciliation/golden_contract_reconciliation.csv",
  "templates/evidence_source_inventory.csv",
  "templates/field_level_extraction_guide.csv",
  "implementation/parser_persistence_mapping.csv",
  "story/contract_fact_based_talk_track.csv",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  };
  return {
    packageDir: path.resolve(
      value("--package-dir") ||
        process.env.SOURCE_CONTRACT_EVIDENCE_PACKAGE_DIR ||
        path.join(REPO_ROOT, "datasets/source/contract-intelligence/skyharbor-golden-20260808"),
    ),
  };
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function readText(base, relativePath) {
  return fs.readFileSync(path.join(base, relativePath), "utf8");
}

function readCsv(base, relativePath) {
  const parsed = Papa.parse(readText(base, relativePath), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    throw new Error(
      `${relativePath} failed CSV parse: ${parsed.errors.map((error) => error.message).join("; ")}`,
    );
  }
  return parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)]),
    ),
  );
}

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function assertNear(failures, label, actual, expected, tolerance = 1) {
  if (Math.abs(Number(actual) - Number(expected)) > tolerance) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function piiScan(failures, fileName, text) {
  const patterns = [
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu, "email address"],
    [/\b\d{3}[-.]\d{3}[-.]\d{4}\b/u, "phone number"],
    [/\b\d{3}-\d{2}-\d{4}\b/u, "ssn-like identifier"],
    [/\bMRN[-\s]?\d{4,}\b/iu, "patient MRN-like identifier"],
  ];
  for (const [pattern, label] of patterns) {
    if (pattern.test(text)) failures.push(`${fileName}: contains ${label}`);
  }
}

function validatePackage(base) {
  const failures = [];
  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(base, relativePath))) {
      failures.push(`missing required file ${relativePath}`);
    }
  }
  if (failures.length) return { failures };

  for (const relativePath of REQUIRED_FILES) {
    piiScan(failures, relativePath, readText(base, relativePath));
  }

  const manifest = JSON.parse(readText(base, "manifest.json"));
  const overview = readCsv(base, "synthetic/contract_overview.csv");
  const invoice = readCsv(base, "synthetic/invoice_lines.csv");
  const rates = readCsv(base, "synthetic/rate_card_variance.csv");
  const sla = readCsv(base, "synthetic/sla_incident_service_credit_monthly.csv");
  const usage = readCsv(base, "synthetic/usage_entitlement_monthly.csv");
  const finance = readCsv(base, "synthetic/finance_value_confirmation.csv");
  const scope = readCsv(base, "synthetic/contract_application_scope.csv");
  const inventory = readCsv(base, "synthetic/contract_pdf_document_inventory.csv");
  const pages = readCsv(base, "synthetic/contract_pdf_page_text.csv");
  const clauses = readCsv(base, "synthetic/contract_pdf_clause_extractions.csv");
  const reconciliation = readCsv(base, "reconciliation/golden_contract_reconciliation.csv");

  const contracts = new Set(reconciliation.map((row) => row.contract_id).filter(Boolean));
  if (!contracts.size) failures.push("reconciliation has no contract rows");

  for (const row of overview) {
    if ((row.contract_english_overview || "").length < 120) {
      failures.push(`${row.contract_id}: contract_english_overview is too shallow`);
    }
    if (/fictional contract/iu.test(row.contract_english_overview || "")) {
      failures.push(`${row.contract_id}: overview leaks fictional-contract wording`);
    }
  }

  for (const contractId of contracts) {
    const rec = reconciliation.find((row) => row.contract_id === contractId);
    const serviceGap = sla
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + numberValue(row.service_credits_earned_usd) - numberValue(row.service_credits_claimed_usd), 0);
    const invoiceExceptions = invoice
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + numberValue(row.exception_amount_usd), 0);
    const rateVariance = rates
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + numberValue(row.rate_variance_usd), 0);
    assertNear(failures, `${contractId}.service_credit_gap_usd`, serviceGap, numberValue(rec.service_credit_gap_usd));
    assertNear(failures, `${contractId}.invoice_line_exceptions_usd`, invoiceExceptions, numberValue(rec.invoice_line_exceptions_usd));
    assertNear(failures, `${contractId}.rate_card_variance_usd`, rateVariance, numberValue(rec.rate_card_variance_usd));
    assertNear(
      failures,
      `${contractId}.recoverable_leakage_usd`,
      serviceGap + invoiceExceptions + rateVariance,
      numberValue(rec.recoverable_leakage_usd),
    );

    const financeRow = finance.find((row) => row.contract_id === contractId);
    if (!financeRow) failures.push(`${contractId}: missing finance confirmation row`);
    else {
      assertNear(failures, `${contractId}.finance.recoverable_leakage_usd`, financeRow.recoverable_leakage_usd, rec.recoverable_leakage_usd);
      assertNear(failures, `${contractId}.finance.realized_value_usd`, financeRow.realized_value_usd, rec.realized_value_usd);
      if (!financeRow.finance_owner_role_ref || !financeRow.confirmation_date || !financeRow.realized_value_basis) {
        failures.push(`${contractId}: finance confirmation lacks owner, date, or basis`);
      }
    }

    if (scope.filter((row) => row.contract_id === contractId).length < 6) {
      failures.push(`${contractId}: expected at least six scope rows`);
    }
    if (clauses.filter((row) => row.contract_id === contractId).length < 10) {
      failures.push(`${contractId}: expected at least ten PDF clause extraction rows`);
    }
  }

  for (const row of sla) {
    if (numberValue(row.service_credits_claimed_usd) > numberValue(row.service_credits_earned_usd)) {
      failures.push(`${row.source_record_id}: claimed service credits exceed earned credits`);
    }
    if (numberValue(row.service_credits_received_usd) > numberValue(row.service_credits_claimed_usd)) {
      failures.push(`${row.source_record_id}: received service credits exceed claimed credits`);
    }
  }
  for (const row of usage) {
    const entitled = numberValue(row.entitled_quantity);
    if (entitled > 0) {
      const expected = numberValue(row.active_quantity) / entitled;
      assertNear(failures, `${row.source_record_id}.utilization_rate`, expected, numberValue(row.utilization_rate), 0.01);
    }
  }
  for (const row of inventory) {
    const filePath = path.join(base, "documents", row.source_file_name);
    if (!fs.existsSync(filePath)) {
      failures.push(`${row.source_file_id}: referenced PDF does not exist`);
      continue;
    }
    const actualHash = sha256(fs.readFileSync(filePath));
    if (actualHash !== row.source_file_sha256) {
      failures.push(`${row.source_file_id}: PDF hash mismatch`);
    }
  }
  for (const row of pages) {
    if (!row.source_file_id || !row.source_page || !row.page_text_sha256 || !row.page_text) {
      failures.push(`${row.contract_id}: page text row missing file/page/text fields`);
    }
  }
  for (const row of clauses) {
    if (!row.source_file_id || !row.source_page || !row.source_section || !row.concept_ref || !row.subject_ref) {
      failures.push(`${row.extraction_id}: extraction lacks file, page, section, concept, or subject`);
    }
  }

  return {
    manifest,
    contracts: [...contracts],
    row_counts: {
      overview: overview.length,
      invoice: invoice.length,
      rates: rates.length,
      sla: sla.length,
      usage: usage.length,
      finance: finance.length,
      scope: scope.length,
      inventory: inventory.length,
      pages: pages.length,
      clauses: clauses.length,
      reconciliation: reconciliation.length,
    },
    failures,
  };
}

const args = parseArgs();
const result = validatePackage(args.packageDir);
const output = {
  event: "source_contract_evidence_package_validation",
  package_dir: args.packageDir,
  dataset_id: result.manifest?.dataset_id,
  tenant_key: result.manifest?.tenant_key,
  contracts: result.contracts || [],
  row_counts: result.row_counts || {},
  passed: result.failures.length === 0,
  failures: result.failures,
};
console.log(JSON.stringify(output, null, 2));
if (!output.passed) process.exit(1);

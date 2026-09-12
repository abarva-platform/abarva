#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const runtimeNodeModules =
  "/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const require = createRequire(`${runtimeNodeModules}/`);
const { SpreadsheetFile, Workbook } = require("@oai/artifact-tool");

const datasetVersion = "meridian-databricks-consumption-commit-v1-20260908";
const tenantKey = "meridian-health";
const syntheticPolicy = "synthetic_demo_only_not_client_truth";
const packageDir = "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908";
const sourceDir = path.join(packageDir, "source-files");
const docsDir = path.join(packageDir, "synthetic-evidence-documents");
const qaDir = path.join(packageDir, "qa");
const workbookName = "Meridian_Databricks_Consumption_Commit_Intake_Workbook_v1.xlsx";
const contractId = "MER-TECH-DBX-001";
const vendorRef = "MER-VEN-DATABRICKS";
const vendorName = "Databricks, Inc.";
const sourceFile = {
  order: "DOC-MER-TECH-DBX-001-ORDER",
  invoice: "DOC-MER-TECH-DBX-001-INVOICE",
  usage: "DOC-MER-TECH-DBX-001-USAGE",
  metering: "DOC-MER-TECH-DBX-001-METERING",
  renewal: "DOC-MER-TECH-DBX-001-RENEWAL",
  awsEdp: "DOC-MER-TECH-DBX-001-AWS-MARKETPLACE",
};

const months = [
  ["2025-10", "2025-10-15", "2025-10-31", 1400, 1.08],
  ["2025-11", "2025-11-01", "2025-11-30", 1900, 1.47],
  ["2025-12", "2025-12-01", "2025-12-31", 2300, 1.78],
  ["2026-01", "2026-01-01", "2026-01-31", 2900, 2.24],
  ["2026-02", "2026-02-01", "2026-02-28", 3500, 2.71],
  ["2026-03", "2026-03-01", "2026-03-31", 4300, 3.33],
  ["2026-04", "2026-04-01", "2026-04-30", 5300, 4.1],
  ["2026-05", "2026-05-01", "2026-05-31", 7100, 5.5],
  ["2026-06", "2026-06-01", "2026-06-30", 8100, 6.27],
  ["2026-07", "2026-07-01", "2026-07-31", 10600, 8.21],
  ["2026-08", "2026-08-01", "2026-08-31", 13900, 10.76],
  ["2026-09", "2026-09-01", "2026-09-08", 4800, 3.72],
];

const apps = [
  ["MER-APP-CLAIMSDENIAL", "Claims Denials Pattern Analysis (Pilot)", "Revenue Cycle Analytics", "Tier 2", "AWS", "active"],
  ["MER-APP-LAAMSMIG", "Legacy Analytics Migration Workload", "Enterprise Data & Analytics", "Tier 1", "AWS", "planned"],
  ["MER-APP-MEDEEXIT", "MedeAnalytics Exit - Reporting Consolidation", "Enterprise Data & Analytics", "Tier 2", "AWS", "planned"],
  ["MER-APP-EPICINTEG", "Epic Clarity/Caboodle Integration Layer", "Clinical Platforms", "Tier 1", "AWS", "planned"],
];

const services = [
  ["JOBS-COMPUTE", "Jobs Compute", "DBUHours", 0.58],
  ["SQL-WAREHOUSE", "SQL Warehouses", "DBUHours", 0.18],
  ["DELTA-STORAGE", "Delta Storage", "GB-month", 0.09],
  ["MODEL-SERVING", "Model Serving", "EndpointHours", 0.15],
];

function csvValue(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsv(fileName, headers, rows) {
  const lines = [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))];
  await fs.writeFile(path.join(sourceDir, fileName), `${lines.join("\n")}\n`);
}

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function money(value) {
  return Math.round(value * 100) / 100;
}

function monthRows() {
  return months.map(([month, start, end, spend, _utilization], index) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `monthly_spend:${contractId}:${month}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    month,
    period_start: start,
    period_end: end,
    committed_base_amount_usd: 129167,
    invoice_amount_usd: spend,
    paid_amount_usd: spend,
    actual_spend_usd: spend,
    variance_to_committed_usd: spend - 129167,
    currency: "USD",
    invoice_ref: "DB-INV-2025-08841",
    source_file_id: index === 0 ? sourceFile.invoice : sourceFile.metering,
  }));
}

function usageRows() {
  const rows = [];
  for (const [month, start, end, spend] of months) {
    for (const [serviceKey, serviceName, usageUnit, mix] of services) {
      const amount = money(spend * mix);
      rows.push({
        tenant_key: tenantKey,
        dataset_version: datasetVersion,
        source_row_id: `cloud_usage:${contractId}:${month}:${serviceKey}`,
        contract_id: contractId,
        vendor_ref: vendorRef,
        vendor_name: vendorName,
        cloud_provider: "aws",
        cloud_account_id: "DBX-MERIDIAN-AWS-WORKSPACE-001",
        business_unit: serviceKey === "MODEL-SERVING" ? "Enterprise Data & Analytics" : "Revenue Cycle Analytics",
        application_ref: serviceKey === "MODEL-SERVING" ? "MER-APP-LAAMSMIG" : "MER-APP-CLAIMSDENIAL",
        service_name: serviceName,
        usage_type: serviceKey,
        region: "us-east-1",
        month,
        period_start: start,
        period_end: end,
        usage_quantity: money(amount * (usageUnit === "GB-month" ? 20 : 10)),
        usage_unit: usageUnit,
        on_demand_spend_usd: 0,
        covered_spend_usd: amount,
        total_spend_usd: amount,
        owner_tag: serviceKey === "MODEL-SERVING" ? "Enterprise Data Platforms" : "Revenue Cycle Analytics",
        environment_tag: month >= "2026-08" ? "pilot" : "dev",
        source_file_id: sourceFile.usage,
      });
    }
  }
  return rows;
}

function coverageRows() {
  return months.map(([month, start, end, spend, utilization], index) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `coverage:${contractId}:${month}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    cloud_provider: "aws",
    month,
    period_start: start,
    period_end: end,
    eligible_stable_workload_spend_usd: spend,
    commitment_covered_spend_usd: spend,
    on_demand_eligible_spend_usd: 0,
    commitment_coverage_pct: utilization / 100,
    commitment_utilization_pct: utilization / 100,
    recommended_step_up_usd: index >= 9 ? 0 : -650000,
    expected_discount_pct: 0.09,
    candidate_monthly_savings_usd: index < 9 ? 51667 : 12500,
    source_file_id: sourceFile.metering,
  }));
}

function resourceRows() {
  const rows = [];
  let i = 1;
  for (const app of apps) {
    for (const [serviceKey, serviceName] of services.slice(0, 3)) {
      rows.push({
        tenant_key: tenantKey,
        dataset_version: datasetVersion,
        source_row_id: `resource:${contractId}:${String(i).padStart(3, "0")}`,
        resource_id: `DBX-RES-${String(i).padStart(4, "0")}`,
        contract_id: contractId,
        vendor_ref: vendorRef,
        vendor_name: vendorName,
        cloud_provider: "aws",
        service_name: serviceName,
        sku: serviceKey,
        region: "us-east-1",
        application_ref: app[0],
        business_unit: app[2],
        owner_tag: app[2],
        environment_tag: app[5] === "active" ? "pilot" : "planned",
        avg_cpu_utilization_pct: app[5] === "active" ? 0.18 : 0,
        avg_memory_utilization_pct: app[5] === "active" ? 0.24 : 0,
        monthly_spend_usd: app[5] === "active" ? 850 : 0,
        rightsize_signal: app[5] === "active" ? "watch_commitment_underuse" : "not_onboarded",
        source_file_id: sourceFile.usage,
      });
      i += 1;
    }
  }
  return rows;
}

async function writeSyntheticDocs() {
  const docs = {
    "MER-TECH-DBX-001_ORDER_SYNTHETIC.md": [
      "# Databricks order form synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic order form. The subscription term runs from 2025-10-15 to 2030-10-14. The annual committed purchase amount is 1550000 USD and the full five-year committed purchase amount is 7750000 USD. Business Critical Support is priced at 22 percent of annual committed purchase amount. Unused annual commitment does not carry forward.",
    ].join("\n"),
    "MER-TECH-DBX-001_INVOICE_SYNTHETIC.md": [
      "# Databricks annual invoice synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic invoice DB-INV-2025-08841. Year 1 platform services invoice amount is 1550000 USD. Support fee is 341000 USD. Payment is annual in advance. The invoice is used as AP reconciliation evidence only and is not a real Databricks transaction.",
    ].join("\n"),
    "MER-TECH-DBX-001_USAGE_SYNTHETIC.md": [
      "# Databricks usage statement synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic usage statement. Only the Claims Denials Pattern Analysis pilot is active. Three data platform workloads remain planned. Usage rows split monthly synthetic DBU spend across jobs compute, SQL warehouses, Delta storage, and model serving.",
    ].join("\n"),
    "MER-TECH-DBX-001_METERING_SYNTHETIC.md": [
      "# Databricks monthly metering synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic metering statements. Twelve monthly rows total 66100 USD of actual usage against a 1550000 USD annual commitment. The package classifies every opportunity as candidate and not finance-confirmed.",
    ].join("\n"),
    "MER-TECH-DBX-001_RENEWAL_NOTICE_SYNTHETIC.md": [
      "# Databricks renewal notice synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic renewal notice. The next commercial action date is 2026-10-14 for Year 2 commitment lock-in. The contractual renewal notice date is 2030-07-16 for the full subscription term.",
    ].join("\n"),
    "MER-TECH-DBX-001_AWS_MARKETPLACE_SYNTHETIC.md": [
      "# AWS Marketplace routing synthetic evidence",
      "",
      `Tenant: ${tenantKey}`,
      `Dataset: ${datasetVersion}`,
      `Contract: ${contractId}`,
      `Vendor: ${vendorName}`,
      "",
      "Illustrative synthetic sourcing note. The Databricks workspace runs on AWS, and the buyer should evaluate whether future commitments can route through an AWS Marketplace private offer. This row is a sourcing option, not proof of an existing private offer.",
    ].join("\n"),
  };
  await fs.mkdir(docsDir, { recursive: true });
  for (const [file, body] of Object.entries(docs)) {
    await fs.writeFile(path.join(docsDir, file), `${body}\n`);
  }
}

async function buildWorkbook(csvs) {
  const workbook = Workbook.create();
  const summary = workbook.worksheets.add("Summary");
  const coverage = workbook.worksheets.add("Coverage");
  const opportunities = workbook.worksheets.add("Opportunities");
  const levers = workbook.worksheets.add("Levers");
  const sources = workbook.worksheets.add("Sources");
  const checks = workbook.worksheets.add("Checks");
  const font = "Arial";

  const spendTotal = months.reduce((total, row) => total + row[3], 0);
  const annualCommit = 1550000;
  const supportFee = 341000;
  const committedTotal = 7750000;
  const utilization = spendTotal / annualCommit;
  const opportunityHigh = csvs.optimization_opportunities.reduce(
    (total, row) => total + Number(row.annual_value_usd ?? 0),
    0,
  );

  summary.showGridLines = false;
  summary.getRange("A2").values = [["Meridian Databricks consumption commitment"]];
  summary.getRange("A2").format.font = { name: font, size: 16, bold: true, color: "#111827" };
  summary.getRange("A4:B11").values = [
    ["Contract ID", contractId],
    ["Vendor", vendorName],
    ["Annual commitment", annualCommit],
    ["Support fee", supportFee],
    ["Total committed value", committedTotal],
    ["Trailing actual usage", spendTotal],
    ["Commitment utilization", utilization],
    ["Candidate annual opportunity", opportunityHigh],
  ];
  summary.getRange("A4:A11").format.font = { name: font, bold: true, color: "#374151" };
  summary.getRange("B6:B9").format.numberFormat = "$#,##0";
  summary.getRange("B10").format.numberFormat = "0.0%";
  summary.getRange("B11").format.numberFormat = "$#,##0";
  summary.getRange("D4:G16").values = [
    ["Month", "Actual usage", "Commitment run rate", "Utilization"],
    ...months.map(([month, , , spend, pct]) => [month, spend, 129167, pct / 100]),
  ];
  summary.getRange("D4:G4").format = { fill: "#1F4E78", font: { name: font, bold: true, color: "#FFFFFF" } };
  summary.getRange("E5:F16").format.numberFormat = "$#,##0";
  summary.getRange("G5:G16").format.numberFormat = "0.0%";
  const chart = summary.charts.add("line", summary.getRange("D4:F16"));
  chart.title = "Actual Usage vs Commitment Run Rate";
  chart.titleTextStyle.typeface = font;
  chart.titleTextStyle.fontSize = 12;
  chart.legend = { position: "top", textStyle: { typeface: font } };
  chart.xAxis = { axisType: "textAxis", textStyle: { typeface: font, fontSize: 10 } };
  chart.yAxis = { numberFormatCode: "$#,##0", numberFormatSourceLinked: false, textStyle: { typeface: font, fontSize: 10 } };
  chart.setPosition("I4", "P18");

  coverage.showGridLines = false;
  coverage.getRange("A2").values = [["Monthly commitment coverage"]];
  coverage.getRange("A2").format.font = { name: font, size: 14, bold: true };
  coverage.getRange("A4:F16").values = [
    ["Month", "Actual usage", "Commitment run rate", "Utilization", "Candidate monthly savings", "Source"],
    ...coverageRows().map((row) => [
      row.month,
      row.commitment_covered_spend_usd,
      row.eligible_stable_workload_spend_usd === 0 ? 0 : row.committed_base_amount_usd ?? 129167,
      row.commitment_utilization_pct,
      row.candidate_monthly_savings_usd,
      row.source_file_id,
    ]),
  ];
  coverage.getRange("A4:F4").format = { fill: "#355C7D", font: { name: font, bold: true, color: "#FFFFFF" } };
  coverage.getRange("B5:C16").format.numberFormat = "$#,##0";
  coverage.getRange("D5:D16").format.numberFormat = "0.0%";
  coverage.getRange("E5:E16").format.numberFormat = "$#,##0";
  coverage.freezePanes.freezeRows(4);

  opportunities.showGridLines = false;
  opportunities.getRange("A2").values = [["Candidate opportunities"]];
  opportunities.getRange("A2").format.font = { name: font, size: 14, bold: true };
  opportunities.getRange(`A4:G${4 + csvs.optimization_opportunities.length}`).values = [
    ["Opportunity", "Low", "High", "Priority", "Owner", "Recommended action", "Evidence rows"],
    ...csvs.optimization_opportunities.map((row) => [
      row.title,
      row.amount_low_usd,
      row.amount_high_usd,
      row.priority,
      row.owner_role,
      row.recommended_action,
      row.evidence_rows,
    ]),
  ];
  opportunities.getRange("A4:G4").format = { fill: "#78350F", font: { name: font, bold: true, color: "#FFFFFF" } };
  opportunities.getRange(`B5:C${4 + csvs.optimization_opportunities.length}`).format.numberFormat = "$#,##0";
  opportunities.freezePanes.freezeRows(4);

  levers.showGridLines = false;
  levers.getRange("A2").values = [["Negotiation lever cards"]];
  levers.getRange("A2").format.font = { name: font, size: 14, bold: true };
  let leverRow = 4;
  for (const opportunity of csvs.optimization_opportunities) {
    levers.getRange(`A${leverRow}:B${leverRow}`).values = [[opportunity.priority, opportunity.title]];
    levers.getRange(`A${leverRow}:B${leverRow}`).format = { fill: "#78350F", font: { name: font, bold: true, color: "#FFFFFF" } };
    levers.getRange(`A${leverRow + 1}:B${leverRow + 7}`).values = [
      ["Owner", opportunity.owner_role],
      ["Buyer ask", opportunity.buyer_ask],
      ["Negotiation language", opportunity.negotiation_language],
      ["Vendor concession", opportunity.vendor_concession],
      ["Timing dependency", opportunity.timing_dependency],
      ["Risk if ignored", opportunity.risk_if_ignored],
      ["Evidence rows", opportunity.evidence_rows],
    ];
    levers.getRange(`A${leverRow + 1}:A${leverRow + 7}`).format.font = { name: font, bold: true, color: "#374151" };
    leverRow += 9;
  }

  sources.showGridLines = false;
  sources.getRange("A2").values = [["Evidence sources"]];
  sources.getRange("A2").format.font = { name: font, size: 14, bold: true };
  sources.getRange("A4:J10").values = [
    Object.keys(csvs.evidence_manifest[0]),
    ...csvs.evidence_manifest.map((row) => Object.values(row)),
  ];
  sources.getRange("A4:J4").format = { fill: "#065F46", font: { name: font, bold: true, color: "#FFFFFF" } };
  sources.freezePanes.freezeRows(4);

  checks.showGridLines = false;
  checks.getRange("A2").values = [["Package checks"]];
  checks.getRange("A2").format.font = { name: font, size: 14, bold: true };
  checks.getRange("A4:D11").values = [
    ["Check", "Expected", "Actual", "Status"],
    ["Contracts", 1, csvs.cloud_contract_register.length, csvs.cloud_contract_register.length === 1 ? "PASS" : "FAIL"],
    ["Monthly spend rows", 12, csvs.monthly_spend.length, csvs.monthly_spend.length === 12 ? "PASS" : "FAIL"],
    ["Service usage rows", 48, csvs.cloud_service_usage_monthly.length, csvs.cloud_service_usage_monthly.length >= 48 ? "PASS" : "FAIL"],
    ["Coverage months", 12, csvs.cloud_commitment_coverage_monthly.length, csvs.cloud_commitment_coverage_monthly.length === 12 ? "PASS" : "FAIL"],
    ["AP reconciliation months", 12, csvs.cloud_ap_invoice_reconciliation.length, csvs.cloud_ap_invoice_reconciliation.length === 12 ? "PASS" : "FAIL"],
    ["Synthetic evidence docs", 6, csvs.evidence_manifest.length, csvs.evidence_manifest.length === 6 ? "PASS" : "FAIL"],
    ["Opportunities not finance-confirmed", 6, csvs.optimization_opportunities.filter((row) => row.finance_confirmation_state === "not_confirmed").length, csvs.optimization_opportunities.filter((row) => row.finance_confirmation_state === "not_confirmed").length === 6 ? "PASS" : "FAIL"],
  ];
  checks.getRange("A4:D4").format = { fill: "#374151", font: { name: font, bold: true, color: "#FFFFFF" } };
  checks.getRange("D5:D11").conditionalFormats.add("containsText", {
    text: "FAIL",
    format: { fill: "#FEE2E2", font: { bold: true, color: "#991B1B" } },
  });

  for (const sheet of [summary, coverage, opportunities, levers, sources, checks]) {
    sheet.getUsedRange().format.font = { name: font, size: 10 };
    sheet.getUsedRange().format.autofitColumns();
    sheet.getUsedRange().format.autofitRows();
  }

  workbook.recalculate();
  await fs.mkdir(packageDir, { recursive: true });
  const previewSheets = ["Summary", "Coverage", "Opportunities", "Levers", "Sources", "Checks"];
  for (const sheetName of previewSheets) {
    const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
    const previewName = `workbook-${sheetName.toLowerCase()}-preview.png`;
    await fs.writeFile(path.join(qaDir, previewName), new Uint8Array(await preview.arrayBuffer()));
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(packageDir, workbookName));
  const inspectPath = path.join(packageDir, `${workbookName}.inspect.ndjson`);
  try {
    await fs.rename(inspectPath, path.join(qaDir, "workbook-export-inspect.ndjson"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function main() {
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(qaDir, { recursive: true });
  await writeSyntheticDocs();
  await fs.writeFile(
    path.join(packageDir, ".gitignore"),
    ["restricted-source-documents/", "_restricted/", "raw-documents/", "*.pdf", "*.docx", "*.xlsx.tmp", ""].join("\n"),
  );

  const csvs = {};
  csvs.cloud_contract_register = [
    {
      tenant_key: tenantKey,
      dataset_version: datasetVersion,
      source_row_id: `cloud_contract:${contractId}`,
      source_row_number: 1,
      contract_id: contractId,
      vendor_ref: vendorRef,
      vendor_name: vendorName,
      cloud_provider: "aws",
      contract_name: "Databricks Enterprise Agreement - Platform, Support and Committed Purchase",
      category: "Cloud data platform subscription",
      archetype: "cloud_consumption_commit",
      annual_value_usd: 1891000,
      committed_annual_spend_usd: 1550000,
      actual_annual_spend_usd: 66100,
      total_committed_usd: 7750000,
      start_date: "2025-10-15",
      end_date: "2030-10-14",
      renewal_notice_date: "2030-07-16",
      notice_period_days: 90,
      auto_renew: true,
      benchmarking_clause: "absent",
      termination_rights: "for_cause_only",
      business_owner: "VP Technology and Data",
      it_owner: "Enterprise Data Platforms",
      finance_owner: "Technology Finance",
      contract_english_overview:
        "Databricks-on-AWS consumption commitment for lakehouse, SQL warehouse, model serving, and pilot analytics workloads. The agreement buys committed platform capacity and Business Critical Support ahead of current consumption, so Source treats it as a renegotiation and ramp-timing case, not a refund-recovery case.",
      scope_english_summary:
        "Loaded scope covers named AWS-hosted analytics workloads: claims-denials pilot, legacy analytics migration, MedeAnalytics reporting exit, and Epic Clarity/Caboodle integration. It does not prove enterprise-wide Databricks coverage beyond those mapped applications.",
      commercial_thesis:
        "The governed financial fields show committed Databricks platform capacity and support materially ahead of observed usage. The optimization story is to re-time or carry forward the commitment and rebase support before the next lock-in; finance has not confirmed realized value.",
      relationship_summary:
        "The governed relationship is Databricks vendor to contract MER-TECH-DBX-001 to named AWS-hosted application scopes and candidate opportunities. No broader business-unit, CMDB, or Tower dependency should be inferred without matching rows.",
      evidence_boundary_summary:
        "Structured source rows are loaded for contract terms, monthly spend, DBU/service usage, commitment coverage, AP reconciliation, scope, clauses, opportunities, and six governed document page rows. Full raw contract documents remain restricted outside the public repo; the page rows are reviewed synthetic extracts, not client PDFs.",
      context_review_state: "reviewed",
      context_reviewer_role: "Source contract intelligence reviewer",
      context_reviewed_at: "2026-09-08T00:00:00Z",
      source_confidence: 0.92,
      source_file_id: sourceFile.order,
    },
  ];
  csvs.cloud_accounts = [
    ["DBX-MERIDIAN-AWS-WORKSPACE-001", "Meridian Databricks AWS workspace", "Revenue Cycle Analytics", "Enterprise Data Platforms", "workspace", "Databricks account console export", "enabled"],
    ["DBX-MERIDIAN-AWS-METASTORE-001", "Unity Catalog metastore", "Enterprise Data & Analytics", "Data Governance", "metastore", "Databricks account console export", "enabled"],
    ["DBX-MERIDIAN-AWS-JOBS-001", "Pilot jobs workspace", "Revenue Cycle Analytics", "Data Platform", "workspace", "Databricks system tables", "partial"],
    ["AWS-PAYER-001", "Meridian AWS payer", "Cloud Platform", "Cloud FinOps", "payer", "AWS Organizations", "enabled"],
  ].map(([cloud_account_id, account_name, business_unit, technical_owner, account_type, source_system, tag_policy_state]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `cloud_account:${cloud_account_id}`,
    cloud_account_id,
    cloud_provider: "aws",
    account_name,
    business_unit,
    technical_owner,
    account_type,
    source_system,
    tag_policy_state,
    source_file_id: sourceFile.usage,
  }));
  csvs.cmdb_applications = apps.map(([application_ref, application_name, business_function, criticality, hosting_model, lifecycle_state]) => ({
    tenant_key: tenantKey,
    application_ref,
    application_name,
    business_function,
    criticality,
    hosting_model,
    lifecycle_state,
  }));
  csvs.cmdb_application_scope = apps.map(([application_ref, application_name, business_function, criticality, hosting_model, _lifecycleState], index) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `app_scope:${contractId}:${application_ref}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    application_ref,
    application_name,
    business_function,
    criticality,
    hosting_model,
    scope_role: index === 0 ? "active_pilot_workload" : "planned_workload",
    relationship_method: index === 0 ? "explicit_contract_scope" : "reviewed_mapping",
    relationship_confidence: index === 0 ? 0.91 : 0.8,
    source_file_id: sourceFile.usage,
  }));
  csvs.monthly_spend = monthRows();
  csvs.cloud_service_usage_monthly = usageRows();
  csvs.cloud_commitments = [
    ["DBX-COMMIT-2025-Y1", "Annual Databricks committed purchase", 1550000, 176.94, "2025-10-15", "2026-10-14", 0.043, sourceFile.order],
    ["DBX-SUPPORT-2025-Y1", "Business Critical Support annual fee", 341000, 38.93, "2025-10-15", "2026-10-14", 0.012, sourceFile.invoice],
  ].map(([commitment_id, commitment_type, annual_commitment_usd, hourly_commitment_usd, start_date, end_date, utilization_pct, source_file_id]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `commitment:${commitment_id}`,
    commitment_id,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    cloud_provider: "aws",
    commitment_type,
    annual_commitment_usd,
    hourly_commitment_usd,
    start_date,
    end_date,
    utilization_pct,
    source_file_id,
  }));
  csvs.cloud_commitment_coverage_monthly = coverageRows();
  csvs.cloud_resource_inventory = resourceRows();
  csvs.cloud_tag_quality = months.map(([month, start, end, spend]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `tag_quality:${contractId}:${month}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    cloud_provider: "aws",
    account_subscription_id: "DBX-MERIDIAN-AWS-WORKSPACE-001",
    month,
    period_start: start,
    period_end: end,
    total_spend_usd: spend,
    owner_tagged_spend_usd: money(spend * 0.74),
    application_tagged_spend_usd: money(spend * 0.68),
    untagged_spend_usd: money(spend * 0.26),
    owner_tag_coverage_pct: 0.74,
    application_tag_coverage_pct: 0.68,
    data_quality_state: "usable_with_gaps",
    source_file_id: sourceFile.usage,
  }));
  csvs.cloud_ap_invoice_reconciliation = months.map(([month, start, end, spend]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_row_id: `ap_recon:${contractId}:${month}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    month,
    period_start: start,
    period_end: end,
    cloud_billing_export_amount_usd: spend,
    ap_invoice_amount_usd: spend,
    paid_amount_usd: spend,
    variance_usd: 0,
    reconciliation_state: "matched",
    source_file_id: sourceFile.invoice,
  }));
  csvs.contract_clauses = [
    ["minimum_commitment", "commercial_right", "Annual committed purchase amount is 1550000 USD; five-year committed purchase amount is 7750000 USD.", 1550000, "", sourceFile.order, "Commercial terms", 2, 0.92],
    ["support_fee", "commercial_right", "Business Critical Support fee is 22 percent of annual committed purchase amount.", 341000, "", sourceFile.order, "Support terms", 2, 0.9],
    ["no_carry_forward", "commercial_right", "Unused annual commitment expires at each contract-year anniversary and does not carry forward.", "", true, sourceFile.order, "Commitment terms", 3, 0.9],
    ["payment_in_advance", "commercial_right", "Fees for each contract year are invoiced annually in advance, net 30.", "", true, sourceFile.invoice, "Payment terms", 1, 0.88],
    ["benchmarking_clause", "commercial_right", "No benchmarking clause is present in the synthetic order form.", "", false, sourceFile.order, "Governance", 4, 0.84],
    ["termination_rights", "exit_right", "Termination rights are limited to cause-based termination in the synthetic order form.", "", "", sourceFile.order, "Termination", 5, 0.84],
    ["renewal_notice", "commercial_right", "Full-term non-renewal notice date is 2030-07-16 based on a 90-day notice period.", "", true, sourceFile.renewal, "Renewal", 1, 0.86],
    ["marketplace_routing", "commercial_option", "Future commitment may be evaluated for AWS Marketplace private offer routing; no executed private offer is represented.", "", "", sourceFile.awsEdp, "Sourcing option", 1, 0.78],
  ].map(([concept_ref, evidence_class, value_text, value_num, value_bool, source_file_id, source_section, source_page, confidence]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    extraction_id: `clause:${contractId}:${concept_ref}`,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    concept_ref,
    evidence_class,
    subject_kind: "contract",
    subject_ref: contractId,
    value_text,
    value_num,
    value_bool,
    source_file_id,
    source_section,
    source_page,
    confidence,
    review_state: "synthetic_demo_reviewed",
  }));
  csvs.optimization_opportunities = [
    {
      opportunity_id: "OPT-DBX-COMMIT-RAMP-001",
      opportunity_type: "negotiated_improvement",
      title: "Re-time annual commitment to program delivery pace",
      annual_value_usd: 620000,
      amount_low_usd: 350000,
      amount_high_usd: 620000,
      evidence_family: "cloud_consumption",
      evidence_rows: `coverage:${contractId}:2026-08;cloud_usage:${contractId}:2026-08:JOBS-COMPUTE;commitment:DBX-COMMIT-2025-Y1;clause:${contractId}:minimum_commitment`,
      recommended_action: "Propose milestone-based ramp schedule before Year 2 commitment lock-in.",
      buyer_ask: "Reset Year 2 committed purchase to a ramped schedule tied to named workloads reaching production readiness.",
      negotiation_language: "A Year 2 commitment should step up only as governed workloads move from pilot or planned into production. We are asking Databricks to re-time the committed purchase schedule to match actual deployment gates, with no penalty for Year 1 underuse caused by program sequencing.",
      vendor_concession: "Databricks gives up an immediate full Year 2 run-rate lock and accepts milestone-based consumption growth.",
      timing_dependency: "Complete before 2026-10-14 Year 2 commitment lock-in.",
      owner_role: "VP Technology and Data with Cloud FinOps support",
      priority: "P0",
      risk_if_ignored: "Buyer prepays for shelfware while planned workloads remain outside production.",
      native_vs_nexus_note: "Nexus ties Databricks consumption to contract terms, AP payment state, CMDB workload timing, and sourcing action.",
      source_file_id: sourceFile.metering,
    },
    {
      opportunity_id: "OPT-DBX-SUPPORT-REBASE-001",
      opportunity_type: "negotiated_improvement",
      title: "Re-base support fee to consumed spend and support demand",
      annual_value_usd: 341000,
      amount_low_usd: 220000,
      amount_high_usd: 341000,
      evidence_family: "support_tier_review",
      evidence_rows: `commitment:DBX-SUPPORT-2025-Y1;clause:${contractId}:support_fee;cloud_usage:${contractId}:2026-07:SQL-WAREHOUSE`,
      recommended_action: "Propose support basis tied to consumed platform spend and low ticket volume.",
      buyer_ask: "Recalculate Business Critical Support on actual consumed platform usage until production workloads materially increase.",
      negotiation_language: "The current support fee is anchored to committed purchase rather than observed support demand or consumed workloads. We are asking Databricks to re-base support for the next contract year, with an automatic step-up only when production usage and support volume justify it.",
      vendor_concession: "Databricks gives up committed-purchase-based support economics during low-consumption periods.",
      timing_dependency: "Include in Year 2 commercial amendment before invoice issuance.",
      owner_role: "Technology Finance",
      priority: "P0",
      risk_if_ignored: "Support spend stays disconnected from actual workload scale and support demand.",
      native_vs_nexus_note: "Native usage shows spend; Nexus links it to commercial support fee economics.",
      source_file_id: sourceFile.order,
    },
    {
      opportunity_id: "OPT-DBX-CARRY-FORWARD-001",
      opportunity_type: "negotiated_improvement",
      title: "Add carry-forward provision for unused Year 1 commitment",
      annual_value_usd: 400000,
      amount_low_usd: 150000,
      amount_high_usd: 400000,
      evidence_family: "commitment_terms",
      evidence_rows: `coverage:${contractId}:2026-09;clause:${contractId}:no_carry_forward;ap_recon:${contractId}:2026-09`,
      recommended_action: "Draft carry-forward amendment before the Year 2 payment locks.",
      buyer_ask: "Carry forward unused Year 1 commitment into Year 2 or convert it into onboarding, migration, training, or implementation credits.",
      negotiation_language: "The contract's no-carry-forward position should not convert delayed workload adoption into lost buyer value. We are asking Databricks to preserve a negotiated portion of unused Year 1 commitment as Year 2 consumption credit or equivalent adoption services.",
      vendor_concession: "Databricks gives up forfeiture of a portion of unused Year 1 committed purchase.",
      timing_dependency: "Resolve before year-end true-up and Year 2 payment authorization.",
      owner_role: "Strategic Sourcing",
      priority: "P1",
      risk_if_ignored: "Unused commitment expires and the buyer loses leverage before the next payment cycle.",
      native_vs_nexus_note: "Nexus treats the ask as a contract-timing improvement, not realized savings.",
      source_file_id: sourceFile.renewal,
    },
    {
      opportunity_id: "OPT-DBX-AWS-MARKETPLACE-001",
      opportunity_type: "negotiated_improvement",
      title: "Route future commitment through AWS Marketplace private offer",
      annual_value_usd: 150000,
      amount_low_usd: 80000,
      amount_high_usd: 150000,
      evidence_family: "marketplace_routing",
      evidence_rows: `clause:${contractId}:marketplace_routing;cloud_account:AWS-PAYER-001;commitment:DBX-COMMIT-2025-Y1`,
      recommended_action: "Confirm AWS EDP status and request private-offer routing for Year 2-forward.",
      buyer_ask: "Route eligible future Databricks commitment through an AWS Marketplace private offer if it can improve enterprise discount program credit or simplify cloud portfolio governance.",
      negotiation_language: "Because the Databricks deployment runs on AWS, future commitment should be evaluated for Marketplace private-offer routing. We are asking Databricks to support the commercial path that maximizes the buyer's cloud portfolio economics without changing governed data-platform scope.",
      vendor_concession: "Databricks supports alternate transaction routing and any associated private-offer economics.",
      timing_dependency: "Confirm before Year 2 commercial paper is drafted.",
      owner_role: "Cloud FinOps",
      priority: "P2",
      risk_if_ignored: "The buyer may miss cloud-portfolio credits or negotiate Databricks in isolation from AWS commitments.",
      native_vs_nexus_note: "Nexus connects vendor contract action with cloud portfolio strategy.",
      source_file_id: sourceFile.awsEdp,
    },
    {
      opportunity_id: "OPT-DBX-DISCOUNT-REPRICE-001",
      opportunity_type: "negotiated_improvement",
      title: "Signal-stage discount band re-price review",
      annual_value_usd: 270000,
      amount_low_usd: 150000,
      amount_high_usd: 450000,
      confidence: 0.35,
      stage: "signal",
      amount_state: "range",
      evidence_grade: "system_evidenced",
      evidence_family: "discount_band_review",
      evidence_rows: `clause:${contractId}:benchmarking_clause;clause:${contractId}:minimum_commitment;commitment:DBX-COMMIT-2025-Y1;${sourceFile.order}`,
      recommended_action: "Treat as advisory until a comparable benchmark is loaded; request re-pricing evidence for the five-year volume tier.",
      buyer_ask: "Re-price the platform services discount band after Finance loads an accepted comparable for a similar multi-year consumption-platform commitment.",
      negotiation_language: "This is an advisory signal, not a document-proven finding. The current package shows the commitment size and confirms benchmarking is absent, so we are asking Databricks to re-open discount-band evidence once a comparable five-year volume benchmark is available.",
      vendor_concession: "Databricks would move from the current discount position to a benchmark-supported tier if the buyer proves comparable market terms.",
      timing_dependency: "Load one accepted benchmark comparable before treating this as an executive ask in the Year 2 amendment.",
      owner_role: "Strategic Sourcing with Technology Finance",
      priority: "P2",
      blocking_gap: "Benchmark comparable required before discount-band value can be treated as supported.",
      risk_if_ignored: "The buyer may negotiate only ramp timing and credits while leaving a potentially mispriced discount band untested.",
      native_vs_nexus_note: "Nexus surfaces the missing benchmark as the point: native Databricks usage cannot prove whether the contracted discount band is market-appropriate.",
      source_file_id: sourceFile.order,
    },
    {
      opportunity_id: "OPT-DBX-SERVERLESS-PARITY-001",
      opportunity_type: "negotiated_improvement",
      title: "Signal-stage serverless/classic discount parity check",
      annual_value_usd: 55000,
      amount_low_usd: 30000,
      amount_high_usd: 80000,
      confidence: 0.3,
      stage: "signal",
      amount_state: "range",
      evidence_grade: "system_evidenced",
      evidence_family: "compute_mode_review",
      evidence_rows: `cloud_usage:${contractId}:2026-08:JOBS-COMPUTE;cloud_usage:${contractId}:2026-09:JOBS-COMPUTE;${sourceFile.usage}`,
      recommended_action: "Confirm discount parity and per-SKU economics before shifting bursty pilot jobs from classic compute to serverless.",
      buyer_ask: "Confirm committed-discount treatment across serverless and classic compute and load a side-by-side per-SKU cost comparison before workload migration.",
      negotiation_language: "This is a workload-shape signal, not a priced finding. The package shows bursty pilot jobs-compute usage, but it does not include per-SKU serverless comparison evidence, so the ask is to confirm discount parity before making serverless the default operating model.",
      vendor_concession: "Databricks would preserve committed-discount economics across the target compute mode or provide a clear commercial bridge for the migrated workload.",
      timing_dependency: "Complete before the pilot workload moves from classic jobs compute into production serverless jobs.",
      owner_role: "Cloud FinOps and Enterprise Data Platforms",
      priority: "P2",
      blocking_gap: "Per-SKU serverless versus classic comparison required before value can be treated as priced.",
      risk_if_ignored: "A technically sensible compute shift could dilute the committed discount or move spend into a SKU pattern the contract does not protect.",
      native_vs_nexus_note: "Nexus flags the workload-shape question and the missing SKU comparison separately so aVa does not present the serverless move as proven savings.",
      source_file_id: sourceFile.usage,
    },
  ].map((opportunity) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    contract_id: contractId,
    confidence: 0.82,
    stage: "quantified",
    amount_state: "exact",
    evidence_grade: "document_evidenced",
    blocking_gap: "Finance confirmation and owner approval are required before realized value can be claimed.",
    finance_confirmation_state: "not_confirmed",
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    selected_for_action_state: "candidate",
    ...opportunity,
  }));
  csvs.evidence_manifest = [
    [sourceFile.order, "order form", "MER-TECH-DBX-001_ORDER_SYNTHETIC.md", "doc.extraction"],
    [sourceFile.invoice, "annual invoice", "MER-TECH-DBX-001_INVOICE_SYNTHETIC.md", "source.contract_financial_exposure"],
    [sourceFile.usage, "usage statement", "MER-TECH-DBX-001_USAGE_SYNTHETIC.md", "consumption.sourcing_cloud_usage_monthly_v1"],
    [sourceFile.metering, "monthly metering", "MER-TECH-DBX-001_METERING_SYNTHETIC.md", "consumption.sourcing_cloud_commitment_coverage_v1"],
    [sourceFile.renewal, "renewal notice", "MER-TECH-DBX-001_RENEWAL_NOTICE_SYNTHETIC.md", "consumption.sourcing_opportunity_v1"],
    [sourceFile.awsEdp, "AWS marketplace sourcing note", "MER-TECH-DBX-001_AWS_MARKETPLACE_SYNTHETIC.md", "consumption.sourcing_opportunity_v1"],
  ].map(([source_file_id, document_type, file_name, expected_layer]) => ({
    tenant_key: tenantKey,
    dataset_version: datasetVersion,
    source_file_id,
    contract_id: contractId,
    vendor_ref: vendorRef,
    vendor_name: vendorName,
    document_type,
    file_name,
    expected_layer,
    synthetic_policy: syntheticPolicy,
  }));
  csvs.native_tool_comparison = [
    ["Databricks account console", "Shows workspace, metastore, entitlement and usage posture.", "Does not govern renewal timing, AP payment state, or sourcing action.", "Ingest as source evidence and reconcile with CLM, ERP/AP and CMDB."],
    ["Databricks system tables", "Shows DBU consumption, warehouse/job use and workload signals.", "Does not explain whether commitment sizing is commercially right.", "Connects usage to contract economics and action workflow."],
    ["AWS Marketplace", "Can route private offers and align vendor spend to cloud commercial strategy.", "Does not prove a contract right exists or a future private offer has been accepted.", "Flags routing as a sourced negotiation lever, not a realized value claim."],
    ["AP invoice extract", "Shows billed and paid amounts.", "Does not prove underuse, scope timing or finance-confirmed value.", "Reconciles paid amount to usage and contract terms."],
  ].map(([native_tool, what_it_already_does, what_it_cannot_govern, nexus_role]) => ({ native_tool, what_it_already_does, what_it_cannot_govern, nexus_role }));
  csvs.source_extraction_guide = [
    ["Procurement", "CLM / contract repository", "Order form export", "cloud_contract_register", "Contract headers, commitments, renewal dates, notice windows, support basis", "Procurement owner", "Identity and terms are declared, not inferred."],
    ["Finance", "AP / ERP", "Invoice and payment extract", "monthly_spend", "Invoice amount, paid amount, actual monthly drawdown and reconciliation state", "Technology finance", "No realized-value claim without finance confirmation."],
    ["Cloud platform", "Databricks account console", "Usage export", "cloud_service_usage_monthly", "Usage by workspace, service, application, region and owner tag", "Data platform owner", "Native usage is evidence, not final sourcing judgment."],
    ["Cloud platform", "Databricks system tables", "Metering extract", "cloud_commitment_coverage_monthly", "Commitment utilization, covered spend and candidate re-timing value", "Cloud FinOps", "Nexus connects utilization to commercial terms."],
    ["Architecture", "CMDB / app portfolio", "Application scope extract", "cmdb_application_scope", "Active and planned workloads tied to Databricks dependency", "Enterprise architecture", "Only explicit/reviewed scope should appear as covered."],
    ["Sourcing", "AWS Marketplace / EDP tracker", "Private offer feasibility note", "optimization_opportunities", "Whether future commitment routing is available", "Cloud FinOps", "Marketplace routing is a candidate action until confirmed."],
  ].map(([source_owner, source_system, extraction_method, workbook_tab, what_to_collect, likely_owner_role, nexus_rule]) => ({ source_owner, source_system, extraction_method, workbook_tab, what_to_collect, likely_owner_role, nexus_rule }));
  csvs.layer_cube_map = [
    ["Cloud contract register", "contract_register_adapter", "source.contract; source.vendor; source.contract_term", "source.contract_360; source.vendor_contract_portfolio", "Contract headers, vendor rollups, renewal posture"],
    ["Cloud accounts", "cloud_account_adapter", "source.cloud_account", "source.contract_financial_exposure", "Workspace/account ownership and scope"],
    ["Cloud monthly spend", "cloud_consumption_adapter", "source.contract_consumption_observation", "consumption.sourcing_spend_monthly_v1", "Actual spend trend and commitment gap"],
    ["Service usage monthly", "cloud_service_usage_adapter", "source.cloud_service_usage_observation", "consumption.sourcing_cloud_usage_monthly_v1", "DBU/service mix and workload evidence"],
    ["Commitment coverage", "cloud_commitment_coverage_adapter", "source.cloud_commitment_coverage_observation", "consumption.sourcing_cloud_commitment_coverage_v1", "Commitment utilization and re-timing candidate"],
    ["AP reconciliation", "cloud_ap_invoice_reconciliation_adapter", "source.cloud_ap_invoice_reconciliation", "consumption.sourcing_cloud_ap_invoice_reconciliation_v1", "Paid invoice proof and variance checks"],
    ["Opportunities", "optimization_opportunity_adapter", "source.optimization_opportunity; source.calculation_run", "consumption.sourcing_opportunity_v1", "Candidate value workflow"],
    ["Evidence manifest", "evidence_document_adapter", "source.source_record_snapshot", "source.ava_grounding_bundle_v1", "aVa citation and proof references"],
  ].map(([source_file_tab, layer_2_adapter_output, layer_3_canonical_object, layer_4_cube_read_model, source_page_use]) => ({ source_file_tab, layer_2_adapter_output, layer_3_canonical_object, layer_4_cube_read_model, source_page_use }));
  csvs.reconciliation = [
    ["Cloud contracts", 1, "PASS", "One Databricks contract has stable ID, owner, terms and annual/actual values."],
    ["Monthly spend", 12, "PASS", "Twelve AP-reconciled rows carry actual usage and commitment run-rate context."],
    ["Service usage", 48, "PASS", "Four service rows per month split the synthetic Databricks usage stream."],
    ["Commitments", 2, "PASS", "Annual platform commitment and support fee are separated."],
    ["Coverage", 12, "PASS", "Commitment coverage rows retain the underuse trend by month."],
    ["AP reconciliation", 12, "PASS", "Billing export, invoice and paid amounts match in every synthetic month."],
    ["Optimization opportunities", 6, "PASS", "All opportunities remain candidate and not finance-confirmed; two are low-confidence signal-stage reviews."],
    ["Synthetic evidence", 6, "PASS", "Evidence manifest maps to six synthetic markdown documents."],
  ].map(([check, row_count, pass, plain_english_result]) => ({ check, row_count, pass, plain_english_result }));

  await writeCsv("cloud_contract_register.csv", Object.keys(csvs.cloud_contract_register[0]), csvs.cloud_contract_register);
  await writeCsv("cloud_accounts.csv", Object.keys(csvs.cloud_accounts[0]), csvs.cloud_accounts);
  await writeCsv("cmdb_applications.csv", Object.keys(csvs.cmdb_applications[0]), csvs.cmdb_applications);
  await writeCsv("cmdb_application_scope.csv", Object.keys(csvs.cmdb_application_scope[0]), csvs.cmdb_application_scope);
  await writeCsv("monthly_spend.csv", Object.keys(csvs.monthly_spend[0]), csvs.monthly_spend);
  await writeCsv("cloud_service_usage_monthly.csv", Object.keys(csvs.cloud_service_usage_monthly[0]), csvs.cloud_service_usage_monthly);
  await writeCsv("cloud_commitments.csv", Object.keys(csvs.cloud_commitments[0]), csvs.cloud_commitments);
  await writeCsv("cloud_commitment_coverage_monthly.csv", Object.keys(csvs.cloud_commitment_coverage_monthly[0]), csvs.cloud_commitment_coverage_monthly);
  await writeCsv("cloud_resource_inventory.csv", Object.keys(csvs.cloud_resource_inventory[0]), csvs.cloud_resource_inventory);
  await writeCsv("cloud_tag_quality.csv", Object.keys(csvs.cloud_tag_quality[0]), csvs.cloud_tag_quality);
  await writeCsv("cloud_ap_invoice_reconciliation.csv", Object.keys(csvs.cloud_ap_invoice_reconciliation[0]), csvs.cloud_ap_invoice_reconciliation);
  await writeCsv("contract_clauses.csv", Object.keys(csvs.contract_clauses[0]), csvs.contract_clauses);
  await writeCsv("optimization_opportunities.csv", Object.keys(csvs.optimization_opportunities[0]), csvs.optimization_opportunities);
  await writeCsv("evidence_manifest.csv", Object.keys(csvs.evidence_manifest[0]), csvs.evidence_manifest);
  await writeCsv("native_tool_comparison.csv", Object.keys(csvs.native_tool_comparison[0]), csvs.native_tool_comparison);
  await writeCsv("source_extraction_guide.csv", Object.keys(csvs.source_extraction_guide[0]), csvs.source_extraction_guide);
  await writeCsv("layer_cube_map.csv", Object.keys(csvs.layer_cube_map[0]), csvs.layer_cube_map);
  await writeCsv("reconciliation.csv", Object.keys(csvs.reconciliation[0]), csvs.reconciliation);

  await fs.writeFile(
    path.join(packageDir, "README.md"),
    `# Meridian Databricks consumption commitment package\n\nSynthetic demo evidence package for a Databricks consumption-commit contract running on AWS.\n\nThis package is Layer 1 intake evidence for governed Azure loading through scripts/source/load-cloud-consumption-package.mjs. It is not client truth, it is not a real Databricks transaction, and it does not authorize finance-confirmed savings claims.\n\n## Contract visibility\n\nSource360 should show vendor ${vendorName}, contract ${contractId}, annual platform commitment 1550000 USD, support fee 341000 USD, annual commercial value 1891000 USD, five-year committed value 7750000 USD, actual usage 66100 USD, and six candidate opportunities. Four opportunities are document-evidenced package candidates; two are intentionally low-confidence signal-stage reviews that require benchmark or per-SKU evidence before they can be upgraded. Opportunity rows preserve buyer ask, negotiation language, vendor concession, timing dependency, owner role, priority, risk-if-ignored, and native-vs-Nexus fields for Optimize and aVa grounding.\n\n## Signal-stage opportunities\n\n- \`OPT-DBX-DISCOUNT-REPRICE-001\` requires one accepted benchmark comparable for a similar multi-year consumption-platform commitment before it can become a supported discount-band ask.\n- \`OPT-DBX-SERVERLESS-PARITY-001\` requires a per-SKU serverless-versus-classic comparison for the loaded jobs-compute workload before it can become a priced migration finding.\n\n## Restricted-source boundary\n\nRaw/full Databricks contract files and pricing exhibits stay outside the public repo in local restricted storage. This repo package contains only synthetic source rows and synthetic markdown evidence summaries stamped ${syntheticPolicy}.\n\n## Non-mutating validation\n\nRun:\n\n\`\`\`bash\nnode scripts/source/load-cloud-consumption-package.mjs --mode=plan --dataset-version=${datasetVersion} --package-dir=${packageDir} --proof-dir=${packageDir}/qa/plan-proof\n\`\`\`\n\nMutating Layer 2/3/4 load requires the governed ACA data-build job path and explicit operator approval.\n`,
  );

  const manifest = {
    dataset_version: datasetVersion,
    tenant_key: tenantKey,
    generated_at: new Date("2026-09-08T00:00:00.000Z").toISOString(),
    workbook: workbookName,
    preview: "qa/workbook-summary-preview.png",
    workbook_preview_sheets: ["Summary", "Coverage", "Opportunities", "Levers", "Sources", "Checks"],
    source_directory: "source-files",
    document_directory: "synthetic-evidence-documents",
    qa_directory: "qa",
    synthetic_policy: syntheticPolicy,
    row_counts: Object.fromEntries(Object.entries(csvs).map(([key, rows]) => [key, rows.length])),
  };
  await fs.writeFile(path.join(packageDir, "package-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(qaDir, "row-counts.json"), `${JSON.stringify(manifest.row_counts, null, 2)}\n`);
  await buildWorkbook(csvs);

  const workbookBuffer = await fs.readFile(path.join(packageDir, workbookName));
  manifest.workbook_sha256 = hash(workbookBuffer);
  await fs.writeFile(path.join(packageDir, "package-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

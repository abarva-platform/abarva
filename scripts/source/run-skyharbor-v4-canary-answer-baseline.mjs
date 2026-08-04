import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import JSZip from "jszip";
import Papa from "papaparse";

const DEFAULT_PACKAGE_PATH =
  "/Users/anand/Downloads/SkyHarbor_Source_V4_Synthetic_System_Extracts_20260804T012431Z.zip";
const QUESTION_BANK_PATH =
  "docs/source/skyharbor-v4/source_v4_question_bank.json";
const COVERAGE_PATH =
  "docs/source/skyharbor-v4/source_v4_question_coverage_matrix.json";
const MODEL_FIT_PATH =
  "docs/source/skyharbor-v4/source_v4_model_fit_audit.json";

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  return {
    packageZip:
      value("--package-zip") ||
      process.env.SOURCE_V4_PACKAGE_ZIP ||
      DEFAULT_PACKAGE_PATH,
    out: value("--out") || process.env.SOURCE_V4_BASELINE_OUT || "",
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function zipText(zip, name) {
  const entry = zip.file(name);
  if (!entry) throw new Error(`Missing ZIP entry: ${name}`);
  return entry.async("string");
}

async function loadCsvMap(packageZip) {
  const buffer = fs.readFileSync(packageZip);
  const zip = await JSZip.loadAsync(buffer);
  const manifest = JSON.parse(
    await zipText(zip, "csv/source_v4_package_manifest.json"),
  );
  const files = {};
  for (const file of manifest.files) {
    const csvText = await zipText(zip, `csv/${file.file}`);
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length)
      throw new Error(
        `${file.file}: ${parsed.errors.map((error) => error.message).join("; ")}`,
      );
    files[file.file] = {
      rows: parsed.data,
      sha256: sha256(csvText),
      declaration: file,
    };
  }
  return { packageSha256: sha256(buffer), manifest, files };
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function groupSum(rows, keyFn, valueFn) {
  const grouped = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    grouped.set(key, (grouped.get(key) || 0) + valueFn(row));
  }
  return [...grouped.entries()].sort((a, b) => b[1] - a[1]);
}

function buildFacts(files) {
  const suppliers = files["suppliers/ARIBA_SUPPLIERS.csv"].rows;
  const contracts = files["contracts/ARIBA_CONTRACT_WORKSPACES.csv"].rows;
  const finance = files["finance/S4_VENDOR_INVOICE_LINES.csv"].rows;
  const legal = files["legal/SHAREPOINT_CONTRACT_EVIDENCE.csv"].rows;
  const usage = files["usage/ENTRA_SAAS_USAGE_MONTHLY.csv"].rows;
  const cloud = files["cloud/AZURE_COST_MONTHLY.csv"].rows;
  const performanceRows = files["performance/SERVICENOW_SLA_MONTHLY.csv"].rows;
  const workforce = files["workforce/FIELDGLASS_RATE_CARD.csv"].rows;
  const sourcing = files["sourcing/ARIBA_SOURCING_EVENTS.csv"].rows;
  const scope = files["scope/LEANIX_CONTRACT_SCOPE.csv"].rows;
  const supplierById = new Map(suppliers.map((row) => [row.vendor_id, row]));
  const contractById = new Map(contracts.map((row) => [row.contract_id, row]));
  const contractValue = contracts.reduce(
    (sum, row) => sum + numeric(row.annual_value),
    0,
  );
  const topVendors = groupSum(
    contracts,
    (row) => row.vendor_id,
    (row) => numeric(row.annual_value),
  )
    .slice(0, 5)
    .map(([vendor_id, annual_value]) => ({
      vendor_id,
      legal_name: supplierById.get(vendor_id)?.legal_name || vendor_id,
      annual_value,
    }));
  const offContractSpend = finance
    .filter((row) => row.matching_state === "off_contract")
    .reduce((sum, row) => sum + numeric(row.actual_spend), 0);
  const earnedCredits = performanceRows.reduce(
    (sum, row) => sum + numeric(row.credit_calculated),
    0,
  );
  const claimedCredits = performanceRows.reduce(
    (sum, row) => sum + numeric(row.credit_claimed),
    0,
  );
  const aiRows = usage.filter(
    (row) => row.scenario_thread_id === "ai_value_proof_gap",
  );
  return {
    suppliers,
    contracts,
    finance,
    legal,
    usage,
    cloud,
    performanceRows,
    workforce,
    sourcing,
    scope,
    supplierById,
    contractById,
    metrics: {
      vendors: suppliers.length,
      contracts: contracts.length,
      contract_annual_value: contractValue,
      invoice_lines: finance.length,
      off_contract_spend: Math.round(offContractSpend * 100) / 100,
      scope_rows: scope.length,
      explicit_scope_rows: scope.filter(
        (row) => row.relationship_method === "explicit_contract_scope",
      ).length,
      inferred_scope_rows: scope.filter(
        (row) => row.relationship_method !== "explicit_contract_scope",
      ).length,
      legal_evidence_rows: legal.length,
      earned_credits: Math.round(earnedCredits * 100) / 100,
      unclaimed_credits:
        Math.round((earnedCredits - claimedCredits) * 100) / 100,
      ai_usage_rows: aiRows.length,
      ai_claimable_rows: aiRows.filter(
        (row) => row.claimable_value_state === "claimable",
      ).length,
      sourcing_response_rows: sourcing.length,
      top_vendors: topVendors,
    },
  };
}

const domainSql = {
  executive_portfolio_concentration:
    "SELECT supplier_category, risk_tier, vendor_id, SUM(annual_value) FROM consumption_v4_canary.sourcing_contract_v1 JOIN consumption_v4_canary.sourcing_vendor_v1 USING (tenant_key, vendor_id) GROUP BY 1,2,3 ORDER BY 4 DESC;",
  vendor_360:
    "SELECT vendor_id, legal_name, contract_count, annual_value, risk_tier FROM consumption_v4_canary.sourcing_vendor_v1 ORDER BY annual_value DESC;",
  contract_economics_terms:
    "SELECT contract_id, vendor_name, annual_value, total_committed_value, renewal_type, notice_deadline FROM consumption_v4_canary.sourcing_contract_v1 ORDER BY annual_value DESC;",
  spend_invoices_commitments:
    "SELECT contract_id, matching_state, SUM(actual_spend), SUM(committed_amount), COUNT(*) FROM consumption_v4_canary.sourcing_spend_monthly_v1 GROUP BY 1,2 ORDER BY 3 DESC;",
  saas_cloud_consumption_utilization:
    "SELECT 'saas_usage' AS source, COUNT(*) AS rows FROM raw_source_v4.entra_saas_usage_monthly UNION ALL SELECT 'cloud_consumption', COUNT(*) FROM raw_source_v4.azure_cost_monthly;",
  sla_incidents_service_credits:
    "SELECT contract_id, SUM(breach_count), SUM(credit_calculated), SUM(credit_claimed), SUM(credit_recovered) FROM consumption_v4_canary.sourcing_performance_v1 GROUP BY 1 ORDER BY 3 DESC;",
  renewals_notice_leverage:
    "SELECT contract_id, vendor_name, renewal_type, auto_renew, notice_deadline, annual_value FROM consumption_v4_canary.sourcing_contract_v1 WHERE notice_deadline <= DATE '2027-09-28' ORDER BY notice_deadline;",
  application_platform_dependencies:
    "SELECT contract_id, criticality, relationship_method, COUNT(*) FROM consumption_v4_canary.sourcing_contract_scope_v1 GROUP BY 1,2,3 ORDER BY 4 DESC;",
  workforce_rate_cards:
    "SELECT contract_id, SUM(CASE WHEN approval_state = 'variance_unapproved' THEN 1 ELSE 0 END) AS unapproved_variances, SUM(hours::numeric) AS hours FROM raw_source_v4.fieldglass_rate_card GROUP BY 1 ORDER BY 2 DESC;",
  cyber_vendor_risk:
    "SELECT vendor_id, legal_name, risk_tier, cyber_privacy_risk_state, latest_review_date FROM raw_source_v4.ariba_suppliers ORDER BY risk_tier, legal_name;",
  sourcing_events_supplier_bafo:
    "SELECT event_id, supplier_id, MIN(line_item_cost::numeric) AS headline, SUM(normalized_cost::numeric) AS normalized_cost FROM raw_source_v4.ariba_sourcing_events GROUP BY 1,2 ORDER BY 4;",
  ai_adoption_productivity_value_proof:
    "SELECT product_name, function_ref, SUM(active_users::numeric), MAX(finance_validation_state), MAX(claimable_value_state) FROM raw_source_v4.entra_saas_usage_monthly WHERE scenario_thread_id = 'ai_value_proof_gap' GROUP BY 1,2;",
  evidence_lineage_conflict_missing_proof:
    "SELECT conflict_group_id, contract_id, COUNT(*) AS evidence_rows, MIN(quality_state) AS quality_state FROM raw_source_v4.sharepoint_contract_evidence WHERE conflict_group_id <> '' GROUP BY 1,2;",
};

function answerForDomain(domain, facts) {
  const m = facts.metrics;
  const base = {
    executive_portfolio_concentration: `Portfolio canary covers ${m.vendors} vendors, ${m.contracts} contracts and ${m.contract_annual_value} annual value; top vendor is ${m.top_vendors[0]?.legal_name}.`,
    vendor_360: `Vendor 360 is populated for ${m.vendors} vendors with ${m.contracts} linked contracts and risk tiers from supplier master.`,
    contract_economics_terms: `Contract economics are populated for ${m.contracts} contract families; legal evidence rows available: ${m.legal_evidence_rows}.`,
    spend_invoices_commitments: `${m.invoice_lines} invoice lines loaded; off-contract spend is ${m.off_contract_spend}.`,
    saas_cloud_consumption_utilization: `SaaS usage rows and cloud consumption rows are available; AI usage rows: ${m.ai_usage_rows}.`,
    sla_incidents_service_credits: `Service-credit path is populated; earned credits ${m.earned_credits}, unclaimed credits ${m.unclaimed_credits}.`,
    renewals_notice_leverage: `Renewal calendar fields are available across ${m.contracts} contracts with notice dates and auto-renew flags.`,
    application_platform_dependencies: `Scope has ${m.scope_rows} rows: ${m.explicit_scope_rows} explicit and ${m.inferred_scope_rows} inferred relationships.`,
    workforce_rate_cards: `Workforce/rate-card extract has ${facts.workforce.length} work-order rows with billed and approved rates.`,
    cyber_vendor_risk: `Supplier risk fields are populated for ${m.vendors} vendors; high-risk vendors remain reviewable by source record.`,
    sourcing_events_supplier_bafo: `Sourcing event extract has ${m.sourcing_response_rows} supplier requirement response rows and normalized-cost fields.`,
    ai_adoption_productivity_value_proof: `AI adoption has ${m.ai_usage_rows} usage rows and ${m.ai_claimable_rows} claimable rows; adoption is not treated as value.`,
    evidence_lineage_conflict_missing_proof: `Legal evidence has conflict groups and human review states across ${m.legal_evidence_rows} clause/span rows.`,
  };
  return (
    base[domain] ||
    "Canary package contains required source domains; question requires reviewer-specific interpretation."
  );
}

function main() {
  const args = parseArgs();
  const started = performance.now();
  return loadCsvMap(args.packageZip).then(
    ({ packageSha256, manifest, files }) => {
      const facts = buildFacts(files);
      const questionBank = JSON.parse(
        fs.readFileSync(QUESTION_BANK_PATH, "utf8"),
      );
      const coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, "utf8"));
      const modelFit = JSON.parse(fs.readFileSync(MODEL_FIT_PATH, "utf8"));
      const coverageByQuestion = new Map(
        coverage.rows.map((row) => [row.question_id, row]),
      );
      const fitByDomain = new Map(
        modelFit.domains.map((row) => [row.domain, row]),
      );
      const questions = questionBank.questions;
      const filesPresent = new Set(Object.keys(files));
      const rows = questions.map((question) => {
        const qStarted = performance.now();
        const c = coverageByQuestion.get(question.question_id);
        const fit = fitByDomain.get(question.domain);
        const missingFiles = (c?.required_source_files || []).filter(
          (file) => !filesPresent.has(file),
        );
        const nextViews =
          c?.required_next_views || fit?.required_next_views || [];
        const sql =
          domainSql[question.domain] ||
          domainSql.executive_portfolio_concentration;
        return {
          question_id: question.question_id,
          category: question.domain,
          question: question.question,
          generated_sql: sql,
          tables_and_columns_used: {
            source_files: c?.required_source_files || [],
            required_columns: c?.required_columns || {},
            canary_views: [
              c?.cube_view,
              ...(c?.alternate_cube_views || []),
            ].filter(Boolean),
          },
          joins_attempted: question.required_source_domains,
          execution_plan:
            "offline_csv_canary; SQL is generated for consumption_v4_canary/raw_source_v4 lab execution",
          latency_ms: Math.round((performance.now() - qStarted) * 100) / 100,
          rows_scanned: (c?.required_source_files || []).reduce(
            (sum, file) => sum + (files[file]?.rows.length || 0),
            0,
          ),
          rows_returned: 1,
          sql_correctness: missingFiles.length
            ? "blocked_missing_source_file"
            : "syntactically_planned_not_db_executed",
          answer_quality: missingFiles.length
            ? "blocked"
            : nextViews.length
              ? "partial_semantic_view_needed"
              : "canary_supported",
          answer: answerForDomain(question.domain, facts),
          missing_context: [
            ...missingFiles,
            ...nextViews.map((view) => `next_view:${view}`),
          ],
          evidence_requirement:
            c?.evidence_requirement || question.required_evidence_depth,
        };
      });
      const summary = {
        ok: rows.every((row) => row.answer_quality !== "blocked"),
        package_sha256: packageSha256,
        dataset_id: manifest.dataset_id,
        dataset_version: manifest.dataset_version,
        tenant_key: manifest.tenant_key,
        question_count: rows.length,
        canary_supported: rows.filter(
          (row) => row.answer_quality === "canary_supported",
        ).length,
        partial_semantic_view_needed: rows.filter(
          (row) => row.answer_quality === "partial_semantic_view_needed",
        ).length,
        blocked: rows.filter((row) => row.answer_quality === "blocked").length,
        total_latency_ms: Math.round((performance.now() - started) * 100) / 100,
        package_metrics: facts.metrics,
      };
      const result = { summary, rows };
      const text = `${JSON.stringify(result, null, 2)}\n`;
      if (args.out) {
        fs.mkdirSync(path.dirname(args.out), { recursive: true });
        fs.writeFileSync(args.out, text);
      }
      process.stdout.write(text);
    },
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});

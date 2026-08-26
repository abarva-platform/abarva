#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SPEC_PATH = "docs/architecture/meridian-demo-findings-20260824.json";
const PLAN_PATH = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const FOUR_LANE_STATUS_PATH = "docs/architecture/ecl-four-lane-completion-status.json";
const GENERATOR_PATH = "scripts/ecl/generate_dense_source_room_extracts.py";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout;
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...dataRows] = rows;
  return dataRows.map((dataRow) => Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""])));
}

function readRows(outDir, family, filename) {
  const csvPath = path.join(outDir, "__synthetic_sources__", family, filename);
  return parseCsv(fs.readFileSync(csvPath, "utf8"));
}

function daysBetween(startIso, endIso) {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
const plan = fs.readFileSync(PLAN_PATH, "utf8");
const fourLaneStatus = JSON.parse(fs.readFileSync(FOUR_LANE_STATUS_PATH, "utf8"));
const generator = fs.readFileSync(GENERATOR_PATH, "utf8");

assert.equal(spec.spec_id, "meridian_demo_findings_v1");
assert.equal(spec.tenant_key, "meridian-health");
assert.equal(spec.demo_as_of_date, "2026-09-15");
assert.equal(spec.findings.length, 10);
assert.deepEqual(spec.findings.map((finding) => finding.id), ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
assert.equal(spec.denominator.metric, "findings demonstrable on a real surface");
assert.equal(spec.denominator.numerator, 0);
assert.equal(spec.denominator.denominator, 10);

assert.match(plan, /\[meridian-demo-findings-20260824\.json\]\(\.\/meridian-demo-findings-20260824\.json\)/);
assert.match(plan, /\| Findings demonstrable on default routes \| 10 \| 10 \|/);
assert.equal(fourLaneStatus.live_product_proof.findings_demonstrable.numerator, 10);
assert.equal(fourLaneStatus.live_product_proof.findings_demonstrable.denominator, 10);
assert.equal(fourLaneStatus.repo_denominators.findings_declared.numerator, 10);
assert.equal(fourLaneStatus.repo_denominators.findings_declared.denominator, 10);
assert.match(generator, /DEMO_AS_OF_DATE\s*=\s*date\(2026,\s*9,\s*15\)/);

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-demo-findings-source-contract-"));
run("python3", [GENERATOR_PATH, "--out-dir", outDir]);

const applications = readRows(outDir, "SP03_CMDB", "ServiceNow_Business_Applications_SYNTHETIC.csv");
const dataBi = readRows(outDir, "SP04_Data_BI_ETL", "BI_ETL_Analytics_Volumes_SYNTHETIC.csv");
const infrastructure = readRows(outDir, "SP05_Infrastructure", "Hosting_Platforms_SYNTHETIC.csv");
const finance = readRows(outDir, "SP06_Finance_ERP", "GL_Budget_Actuals_SYNTHETIC.csv");
const contracts = readRows(outDir, "SP08_Vendor_Contract", "Contract_Register_SYNTHETIC.csv");
const grc = readRows(outDir, "SP09_GRC", "GRC_Risk_Control_Exceptions_SYNTHETIC.csv");

for (const field of ["termination_for_convenience", "auto_renew", "demo_as_of_date"]) {
  assert(Object.hasOwn(contracts[0], field), `contracts must include ${field}`);
}
for (const field of ["support_end_date", "demo_as_of_date"]) {
  assert(Object.hasOwn(infrastructure[0], field), `infrastructure must include ${field}`);
}
assert.deepEqual([...new Set(contracts.map((row) => row.demo_as_of_date))], [spec.demo_as_of_date]);
assert.deepEqual([...new Set(infrastructure.map((row) => row.demo_as_of_date))], [spec.demo_as_of_date]);

const appsById = new Map(applications.map((row) => [row.application_id, row]));
const highValueThreshold = contracts
  .map((row) => Number(row.annualized_value_usd))
  .sort((a, b) => b - a)[Math.floor(contracts.length * 0.1) - 1];
const sharedClaimsContracts = contracts.filter((row) => {
  const scopedApps = row.scoped_applications.split(";").map((appId) => appsById.get(appId)).filter(Boolean);
  return (
    row.service_tower === "claims_admin"
    && Number(row.annualized_value_usd) >= highValueThreshold
    && scopedApps.length >= 3
    && new Set(scopedApps.map((app) => app.business_function)).size === 1
    && new Set(scopedApps.map((app) => app.application_subdomain)).size === 1
  );
});
assert(sharedClaimsContracts.length >= 3, "F1 must have 3+ high-value same-tower contracts scoped to one function/subdomain");
assert(new Set(sharedClaimsContracts.map((row) => row.supplier_name)).size >= 3, "F1 must have 3+ suppliers");

const autoRenewInsideWindow = contracts.filter((row) => {
  const daysRemaining = daysBetween(spec.demo_as_of_date, row.end_date);
  return (
    daysRemaining >= 0
    && daysRemaining <= 90
    && Number(row.notice_window_days) >= daysRemaining
    && row.benchmarking_right === "absent"
    && Number(row.minimum_commitment_usd) > 0
    && row.auto_renew === "true"
  );
});
assert(autoRenewInsideWindow.length >= 1, "F2 must have an auto-renewal row inside its notice window");

const vendorProtectiveContracts = contracts.filter((row) =>
  row.benchmarking_right === "absent"
  && Number(row.minimum_commitment_usd) > 0
  && Number(row.notice_window_days) >= 90
  && row.termination_for_convenience === "false",
);
assert.equal(vendorProtectiveContracts.length, 34, "F3 must plant exactly 34 vendor-protective contracts");

const appCohorts = new Map();
for (const app of applications.filter((row) => row.lifecycle_state === "current")) {
  const key = `${app.business_function}|${app.application_subdomain}`;
  const cohort = appCohorts.get(key) ?? [];
  cohort.push(app);
  appCohorts.set(key, cohort);
}
assert(
  [...appCohorts.values()].some((cohort) => cohort.length >= 5 && new Set(cohort.map((app) => app.vendor_name)).size >= 3),
  "F4 must have 5+ applications in one function/subdomain from 3+ vendors",
);

const workloadCohorts = new Map();
for (const row of dataBi) {
  const key = `${row.function}|${row.workload_type}`;
  const cohort = workloadCohorts.get(key) ?? [];
  cohort.push(row);
  workloadCohorts.set(key, cohort);
}
assert(
  [...workloadCohorts.values()].some(
    (cohort) =>
      new Set(cohort.map((row) => row.technology_name)).size >= 4
      && cohort.some((row) => row.governance_state === "ungoverned")
      && cohort.reduce((sum, row) => sum + Number(row.workload_count), 0) > 0
      && cohort.reduce((sum, row) => sum + Number(row.active_user_count), 0) > 0,
  ),
  "F5 must have one workload across 4+ BI technologies with an ungoverned row",
);

const clinicalUnsupportedAppliance = infrastructure.filter((row) => {
  const daysToSupportEnd = daysBetween(spec.demo_as_of_date, row.support_end_date);
  return (
    row.platform_type === "netezza_appliance"
    && row.business_function === "Clinical Operations"
    && ["tier_3_backup_only", "unknown"].includes(row.dr_tier)
    && Number(row.utilization_percent) >= 85
    && daysToSupportEnd >= 0
    && daysToSupportEnd <= 548
  );
});
assert(clinicalUnsupportedAppliance.length >= 1, "F6 must have a clinical Netezza appliance within 18 months of support end");
assert(
  clinicalUnsupportedAppliance.every((row) => /^PLAT-\d{4}$/.test(row.platform_id)),
  "F6 must plant the Netezza finding without replacing the platform primary key",
);

const unattributedFinance = finance.filter((row) => row.allocation_basis === "unknown" && row.application_or_platform_ref === "");
assert.equal(unattributedFinance.length, Math.round(finance.length * 0.12), "F7 must plant 12% unattributed finance rows");
assert(unattributedFinance.reduce((sum, row) => sum + Number(row.actual_usd), 0) > 0, "F7 unattributed actuals must be material");

const exceptionApps = grc
  .filter((row) => row.severity === "high" && row.control_state === "missing" && Number(row.open_exception_count) > 0)
  .map((row) => appsById.get(row.object_ref))
  .filter(Boolean);
const vendorCounts = new Map();
for (const app of exceptionApps) {
  vendorCounts.set(app.vendor_name, (vendorCounts.get(app.vendor_name) ?? 0) + 1);
}
assert(Math.max(...vendorCounts.values()) >= 5, "F9 must have 5+ open exceptions resolving to one vendor estate");

console.log(
  JSON.stringify(
    {
      accepted: true,
      spec: SPEC_PATH,
      demoAsOfDate: spec.demo_as_of_date,
      findings: spec.findings.length,
      sourceChecksPassed: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F9"],
      projectionChecksDeferredUntilW2W3: ["F8", "F10"],
      outputDirectory: outDir,
    },
    null,
    2,
  ),
);

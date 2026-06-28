#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "v4-v5-dataset-refresh-20260627");

const TENANTS = [
  {
    label: "Apex Retail",
    folder: "apex-retail-synthetic-v4",
    tenantKey: "apex-retail",
    profile: {
      revenue_fy25_usd: 50000000000,
      employees_fte: 200000,
      annual_technology_budget_usd: 1800000000,
      annual_ai_budget_usd: 55000000,
    },
  },
  {
    label: "First Capital",
    folder: "first-capital-financial-synthetic-v4",
    tenantKey: "first-capital",
    profile: {
      revenue_fy25_usd: 52000000000,
      employees_fte: 65000,
      annual_technology_budget_usd: 2400000000,
      annual_ai_and_data_budget_usd: 72000000,
    },
  },
  {
    label: "Lakeshore Industries",
    folder: "lakeshore-industries-synthetic-v4",
    tenantKey: "lakeshore",
    profile: {
      revenue_fy25_usd: 54200000000,
      employees_fte: 72000,
      annual_technology_budget_usd: 1800000000,
      annual_ai_and_data_budget_usd: 54000000,
    },
  },
  {
    label: "Meridian Health",
    folder: "meridian-health-synthetic-v4",
    tenantKey: "meridian-health",
    profile: {
      revenue_fy25_usd: 39600000000,
      employees_fte: 88000,
      annual_technology_budget_usd: 1600000000,
      annual_ai_and_data_budget_usd: 48000000,
    },
  },
  {
    label: "SkyHarbor Air",
    folder: "skyharbor-air-synthetic-v4",
    tenantKey: "skyharbor-air",
    profile: {
      revenue_fy25_usd: 82400000000,
      employees_fte: 132000,
      annual_technology_budget_usd: 2800000000,
      annual_ai_budget_usd: 84000000,
    },
  },
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function splitCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  out.push(value);
  return out;
}

function csv(file) {
  if (!exists(file)) return [];
  const lines = read(file)
    .trim()
    .split(/\n/)
    .filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, index) => [h, values[index] ?? ""]));
  });
}

function yamlScalars(file) {
  if (!exists(file)) return {};
  const result = {};
  for (const line of read(file).split(/\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    const raw = match[2].trim().replace(/^["']|["']$/g, "");
    result[match[1]] = Number.isFinite(Number(raw)) && raw !== "" ? Number(raw) : raw;
  }
  return result;
}

function ids(rows, key) {
  return new Set(rows.map((row) => row[key]).filter(Boolean));
}

function firstColumn(rows, candidates) {
  if (rows.length === 0) return candidates[0];
  const columns = new Set(Object.keys(rows[0]));
  return candidates.find((candidate) => columns.has(candidate)) ?? candidates[0];
}

function countMissing(rows, key, validIds) {
  return rows.filter((row) => row[key] && !validIds.has(row[key])).length;
}

function graphRows(file) {
  if (!exists(file)) return [];
  return read(file)
    .trim()
    .split(/\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function hasColumns(rows, columns) {
  if (rows.length === 0) return false;
  return columns.every((column) => Object.hasOwn(rows[0], column));
}

function pass(name, details = {}) {
  return { name, status: "pass", ...details };
}

function fail(name, details = {}) {
  return { name, status: "fail", ...details };
}

function pct(passCount, totalCount) {
  return totalCount === 0 ? 0 : Math.round((passCount / totalCount) * 100);
}

function fileFor(folder, suffix) {
  return path.join("datasets", folder, suffix);
}

function validateTenant(tenant) {
  const base = `datasets/${tenant.folder}`;
  const profile = yamlScalars(`${base}/family-1-enterprise-operating-model/F01_enterprise-profile.yaml`);
  const checks = [];

  for (const [key, expected] of Object.entries(tenant.profile)) {
    const actual = profile[key];
    checks.push(
      actual === expected
        ? pass(`profile.${key}`, { actual, expected })
        : fail(`profile.${key}`, { actual, expected }),
    );
  }

  if (profile.tenant_key) {
    checks.push(
      profile.tenant_key === tenant.tenantKey
        ? pass("profile.tenant_key", { actual: profile.tenant_key })
        : fail("profile.tenant_key", { actual: profile.tenant_key, expected: tenant.tenantKey }),
    );
  }

  const applications = csv(fileFor(tenant.folder, "family-2-technology-estate/F05_applications-systems.csv"));
  const appIdColumn = firstColumn(applications, ["app_id", "application_id"]);
  const appIds = ids(applications, appIdColumn);
  checks.push(applications.length > 0 ? pass("applications.present", { rows: applications.length }) : fail("applications.present"));

  const systemMap = csv(fileFor(tenant.folder, "family-2-technology-estate/F06_system-function-mapping.csv"));
  checks.push(
    countMissing(systemMap, "app_id", appIds) === 0
      ? pass("system-function.app_id_resolves", { rows: systemMap.length })
      : fail("system-function.app_id_resolves", { missing: countMissing(systemMap, "app_id", appIds), rows: systemMap.length }),
  );

  const integrations = csv(fileFor(tenant.folder, "family-3-data-connectivity/F10_integrations-interfaces.csv"));
  const missingFrom = countMissing(integrations, "from_system_id", appIds);
  const missingTo = countMissing(integrations, "to_system_id", appIds);
  checks.push(
    missingFrom + missingTo === 0
      ? pass("integrations.endpoints_resolve", { rows: integrations.length })
      : fail("integrations.endpoints_resolve", { missingFrom, missingTo, rows: integrations.length }),
  );

  const budget = csv(fileFor(tenant.folder, "family-4-financial-commercial/F12_it-budget-financials.csv"));
  checks.push(
    hasColumns(budget, ["run_budget_usd", "change_budget_usd", "capex_pct", "opex_pct"])
      ? pass("budget.run_change_capex_opex_columns", { rows: budget.length })
      : fail("budget.run_change_capex_opex_columns", { rows: budget.length, columns: budget[0] ? Object.keys(budget[0]) : [] }),
  );
  const badPct = budget.filter((row) => Number(row.capex_pct) + Number(row.opex_pct) !== 100).length;
  checks.push(
    badPct === 0
      ? pass("budget.capex_opex_sum_to_100", { rows: budget.length })
      : fail("budget.capex_opex_sum_to_100", { badRows: badPct, rows: budget.length }),
  );

  const dataAssets = csv(fileFor(tenant.folder, "family-3-data-connectivity/F09_data-analytics-estate.csv"));
  const dataIdColumn = firstColumn(dataAssets, ["data_asset_id", "data_product_id"]);
  const dataIds = ids(dataAssets, dataIdColumn);
  const dataLineage = csv(fileFor(tenant.folder, "family-8-semantic-enrichment/F21_data-product-ownership-lineage.csv"));
  checks.push(
    dataLineage.length > 0 && countMissing(dataLineage, "data_product_id", dataIds) === 0
      ? pass("data-lineage.data_product_id_resolves", { rows: dataLineage.length })
      : fail("data-lineage.data_product_id_resolves", {
          missing: countMissing(dataLineage, "data_product_id", dataIds),
          rows: dataLineage.length,
        }),
  );

  const dependencies = csv(fileFor(tenant.folder, "family-8-semantic-enrichment/F20_capability-system-dependency.csv"));
  checks.push(
    dependencies.length > 0 && countMissing(dependencies, "system_id", appIds) === 0
      ? pass("capability-system.system_id_resolves", { rows: dependencies.length })
      : fail("capability-system.system_id_resolves", { missing: countMissing(dependencies, "system_id", appIds), rows: dependencies.length }),
  );

  const contracts = csv(fileFor(tenant.folder, "family-4-financial-commercial/F11_vendors-contracts-licenses.csv"));
  const contractIds = ids(contracts, "vendor_id");
  const contractMap = csv(fileFor(tenant.folder, "family-8-semantic-enrichment/F22_contract-system-service-map.csv"));
  const badContract = countMissing(contractMap, "vendor_id", contractIds);
  const badContractSystem = countMissing(contractMap, "supported_system_id", appIds);
  checks.push(
    contractMap.length > 0 && badContract + badContractSystem === 0
      ? pass("contract-system.relationships_resolve", { rows: contractMap.length })
      : fail("contract-system.relationships_resolve", {
          missingContracts: badContract,
          missingSystems: badContractSystem,
          rows: contractMap.length,
        }),
  );

  const teams = csv(fileFor(tenant.folder, "family-1-enterprise-operating-model/F03_it-org-ownership.csv"));
  const teamIds = ids(teams, firstColumn(teams, ["team_id", "function_id"]));
  const capabilities = csv(fileFor(tenant.folder, "family-1-enterprise-operating-model/F04_capabilities-value-streams.csv"));
  const capabilityIds = ids(capabilities, "capability_id");
  const aiAssets = csv(fileFor(tenant.folder, "family-6-governance-ai-evidence/F17_ai-automation-footprint.csv"));
  const aiAssetIds = ids(aiAssets, firstColumn(aiAssets, ["ai_asset_id", "tool_id"]));
  const kpis = csv(fileFor(tenant.folder, "family-5-execution-operations/F15_kpis-outcome-evidence.csv"));
  const kpiIds = ids(kpis, "kpi_id");
  const graphResolvableIds = new Set([
    ...appIds,
    ...teamIds,
    ...capabilityIds,
    ...contractIds,
    ...dataIds,
    ...aiAssetIds,
    ...kpiIds,
  ]);
  const graph = graphRows(fileFor(tenant.folder, "graph/context-relationships.jsonl"));
  const unresolvedGraphEdges = graph.filter((row) => {
    const from = row.from_record_key ?? row.from;
    const to = row.to_record_key ?? row.to;
    return !from || !to || !graphResolvableIds.has(from) || !graphResolvableIds.has(to);
  });
  checks.push(
    graph.length > 0 && unresolvedGraphEdges.length === 0
      ? pass("graph.edges_resolve_to_loaded_keys", { rows: graph.length })
      : fail("graph.edges_resolve_to_loaded_keys", {
          rows: graph.length,
          unresolved: unresolvedGraphEdges.length,
          sample: unresolvedGraphEdges.slice(0, 5),
        }),
  );

  const passed = checks.filter((check) => check.status === "pass").length;
  return {
    tenant: tenant.tenantKey,
    label: tenant.label,
    folder: tenant.folder,
    score: pct(passed, checks.length),
    passed,
    total: checks.length,
    checks,
  };
}

function html(results) {
  const rows = results
    .map(
      (result) => `<tr><td>${result.label}</td><td>${result.tenant}</td><td>${result.folder}</td><td>${result.score}%</td><td>${result.passed}/${result.total}</td></tr>`,
    )
    .join("\n");
  const details = results
    .map((result) => {
      const checks = result.checks
        .map(
          (check) =>
            `<tr><td>${check.status === "pass" ? "PASS" : "FAIL"}</td><td>${check.name}</td><td><code>${escapeHtml(JSON.stringify({ ...check, name: undefined, status: undefined }))}</code></td></tr>`,
        )
        .join("\n");
      return `<h2>${result.label}</h2><table><thead><tr><th>Status</th><th>Check</th><th>Details</th></tr></thead><tbody>${checks}</tbody></table>`;
    })
    .join("\n");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>V4/V5 Dataset Refresh Validation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #111827; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 32px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    code { white-space: pre-wrap; font-size: 12px; }
  </style>
</head>
<body>
  <h1>V4/V5 Dataset Refresh Validation</h1>
  <p>Generated ${new Date().toISOString()}. This is a source-file validation only; it does not prove Azure refresh or browser retrieval.</p>
  <table><thead><tr><th>Tenant</th><th>Tenant Key</th><th>Folder</th><th>Score</th><th>Passed</th></tr></thead><tbody>${rows}</tbody></table>
  ${details}
</body>
</html>`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = TENANTS.map(validateTenant);
const failed = results.flatMap((result) =>
  result.checks
    .filter((check) => check.status === "fail")
    .map((check) => ({ tenant: result.tenant, check: check.name, details: check })),
);

const payload = {
  generatedAt: new Date().toISOString(),
  note: "Source-file validation only. Azure refresh and browser retrieval proof are separate gates.",
  results,
  failed,
};

fs.writeFileSync(path.join(OUT_DIR, "validation.generated.json"), `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(path.join(OUT_DIR, "validation.generated.html"), html(results));

console.log(`Validated ${results.length} tenants.`);
for (const result of results) {
  console.log(`${result.tenant}: ${result.score}% (${result.passed}/${result.total})`);
}
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.length}`);
  process.exit(1);
}

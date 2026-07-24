#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(
  ROOT,
  "reports",
  "tower-active-budget-envelope-repair",
);
const ACTIVE_ROOT = path.join(ROOT, "datasets", "tenant-inputs", "active");
const STANDARDIZED_ROOT = path.join(ROOT, "tower-standardized-v1");
const RECONCILIATION_REPORT = path.join(
  STANDARDIZED_ROOT,
  "RECONCILIATION_REPORT.csv",
);
const SOURCE_DATE = "2026-07-24";
const REPAIR_RULE = "active_budget_envelope_repair_from_declared_source";
const REPAIR_ROW_MARKER = "TOWER-BUDGET-ENV";

const F12_BACKED_TENANTS = [
  "apex-retail",
  "first-capital-financial",
  "lakeshore-industries",
  "skyharbor-air",
];

const HOLDCO_TENANT = "lakeshore-holdings";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) =>
      Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
    );
}

function stringifyCsv(headers, rows) {
  const cell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };
  return [
    headers.map(cell).join(","),
    ...rows.map((row) => headers.map((header) => cell(row[header])).join(",")),
    "",
  ].join("\n");
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(/[$,%\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + number(row[key]), 0);
}

function hashFile(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function ensureHeaders(headers, required) {
  const next = [...headers];
  for (const header of required) {
    if (!next.includes(header)) next.push(header);
  }
  return next;
}

function f12PathForTenant(tenantKey) {
  return path.join(
    STANDARDIZED_ROOT,
    tenantKey,
    "family-4-financial-commercial",
    "F12_it-budget-financials.csv",
  );
}

function activeSpendPathForTenant(tenantKey) {
  return path.join(ACTIVE_ROOT, tenantKey, "current", "08_spend_value.csv");
}

function readReconciliationExpectations() {
  const rows = readCsv(RECONCILIATION_REPORT);
  return new Map(
    rows.map((row) => [
      row.tenant_key,
      {
        total: number(row.it_budget_envelope_fy26_usd),
        run: number(row.run_budget_fy26_usd),
        change: number(row.change_budget_fy26_usd),
      },
    ]),
  );
}

function rowIdPrefix(tenantKey) {
  return tenantKey.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

function appendF12BudgetRows(tenantKey, expectations, write) {
  const sourcePath = f12PathForTenant(tenantKey);
  const activePath = activeSpendPathForTenant(tenantKey);
  const sourceRows = readCsv(sourcePath);
  const activeText = fs.readFileSync(activePath, "utf8");
  const activeHeaders = activeText.split(/\r?\n/, 1)[0].split(",");
  const activeRows = parseCsv(activeText);
  const sourceHash = hashFile(sourcePath);

  const totals = {
    total: sum(sourceRows, "budget_fy26_usd"),
    run: sum(sourceRows, "run_budget_fy26_usd"),
    change: sum(sourceRows, "change_budget_fy26_usd"),
    aiTagged: sum(sourceRows, "ai_data_budget_fy26_usd"),
  };

  const expected = expectations.get(tenantKey);
  if (!expected) {
    throw new Error(`Missing reconciliation row for ${tenantKey}`);
  }
  if (
    totals.total !== expected.total ||
    totals.run !== expected.run ||
    totals.change !== expected.change
  ) {
    throw new Error(
      `${tenantKey} F12 rollup does not match reconciliation report: ${JSON.stringify(
        { totals, expected },
      )}`,
    );
  }

  const prefix = rowIdPrefix(tenantKey);
  const keptRows = activeRows.filter(
    (row) => !String(row.original_row_id ?? "").includes(REPAIR_ROW_MARKER),
  );
  const base = {
    tenant_key: tenantKey,
    cost_center_or_owner: "CIO / Technology Finance",
    vendor_internal_split: "portfolio",
    value_driver: "Tower FY26 IT budget envelope",
    savings_opportunity_usd: "0",
    confidence: "high",
    calculation_basis:
      "Source rollup from tower-standardized-v1 F12; reconciliation report status pass.",
    source_file: relative(activePath),
    source_date: SOURCE_DATE,
    known_gaps:
      "Synthetic demo budget envelope; replace with client finance extract before board-grade use.",
    original_source_file: relative(sourcePath),
    original_packet: "tower-standardized-v1",
    original_row_number: `rollup n=${sourceRows.length}`,
    source_classification: "synthetic-demo",
    source_fingerprint: sourceHash,
    consolidation_rule_used: REPAIR_RULE,
    conflict_status: "resolved_from_reconciled_f12",
  };
  const repairRows = [
    {
      ...base,
      spend_category: "FY26 run budget envelope",
      annual_spend_usd: String(totals.run),
      run_change_transform_split: "run",
      ai_tagged_budget_usd: String(totals.aiTagged),
      original_row_id: `${prefix}-${REPAIR_ROW_MARKER}-RUN`,
    },
    {
      ...base,
      spend_category: "FY26 change budget envelope",
      annual_spend_usd: String(totals.change),
      run_change_transform_split: "change",
      ai_tagged_budget_usd: "0",
      original_row_id: `${prefix}-${REPAIR_ROW_MARKER}-CHANGE`,
    },
  ];

  if (write) {
    const headers = ensureHeaders(activeHeaders, [
      "ai_tagged_budget_usd",
      "budget_repair_status",
    ]);
    const rows = [
      ...keptRows.map((row) => ({
        ...Object.fromEntries(headers.map((header) => [header, ""])),
        ...row,
        budget_repair_status: "",
      })),
      ...repairRows.map((row) => ({
        ...Object.fromEntries(headers.map((header) => [header, ""])),
        ...row,
        budget_repair_status: "active_budget_envelope_repaired",
      })),
    ];
    fs.writeFileSync(activePath, stringifyCsv(headers, rows));
  }

  return {
    tenant_key: tenantKey,
    source: relative(sourcePath),
    active_file: relative(activePath),
    source_basis: "tower-standardized-v1 F12 reconciled row rollup",
    total_it_budget_fy26: totals.total,
    run_budget_fy26: totals.run,
    change_budget_fy26: totals.change,
    ai_tagged_budget_fy26: totals.aiTagged,
    repair_rows: repairRows.length,
    status: "READY",
    caveat: "",
  };
}

function parseStrategicPriorities(profileRow) {
  const pairs = String(profileRow.strategic_priorities ?? "")
    .split("|")
    .map((pair) => pair.split(":"))
    .filter((parts) => parts.length === 2)
    .map(([key, value]) => [key.trim(), value.trim()]);
  return Object.fromEntries(pairs);
}

function appendHoldcoBudgetRows(write) {
  const tenantKey = HOLDCO_TENANT;
  const profilePath = path.join(
    ACTIVE_ROOT,
    tenantKey,
    "current",
    "00_enterprise_profile.csv",
  );
  const activePath = activeSpendPathForTenant(tenantKey);
  const profileRows = readCsv(profilePath);
  const profile = profileRows[0];
  if (!profile) throw new Error(`Missing enterprise profile row for ${tenantKey}`);
  const priorities = parseStrategicPriorities(profile);
  const total = number(priorities.direct_it_budget_usd);
  const corporate = number(priorities.corporate_it_budget_usd);
  const local = number(priorities.portfolio_company_local_it_budget_usd);
  const innovation = number(priorities.innovation_it_subset_usd);
  if (total <= 0 || corporate + local !== total) {
    throw new Error(
      `${tenantKey} profile budget fields do not reconcile: ${JSON.stringify({
        total,
        corporate,
        local,
      })}`,
    );
  }

  const activeText = fs.readFileSync(activePath, "utf8");
  const activeHeaders = activeText.split(/\r?\n/, 1)[0].split(",");
  const activeRows = parseCsv(activeText);
  const keptRows = activeRows.filter(
    (row) => !String(row.original_row_id ?? "").includes(REPAIR_ROW_MARKER),
  );
  const prefix = rowIdPrefix(tenantKey);
  const repairRows = [
    {
      tenant_key: tenantKey,
      spend_category: "FY26 direct IT budget envelope",
      cost_center_or_owner: "Group CIO / Portfolio Technology Finance",
      annual_spend_usd: String(total),
      run_change_transform_split: "split_pending",
      vendor_internal_split: "portfolio",
      value_driver: "Tower FY26 IT budget envelope",
      savings_opportunity_usd: "0",
      confidence: "medium",
      calculation_basis:
        "Declared in active enterprise profile strategic_priorities; run/change split is not present in source.",
      source_file: relative(activePath),
      source_date: SOURCE_DATE,
      known_gaps:
        "Run/change budget split remains source-pending; projection uses its explicit unsplit fallback until a finance extract is supplied.",
      original_source_file: relative(profilePath),
      original_packet: "active-current",
      original_row_number: "2",
      original_row_id: `${prefix}-${REPAIR_ROW_MARKER}-TOTAL`,
      source_classification: "synthetic-demo",
      source_fingerprint: hashFile(profilePath),
      consolidation_rule_used: REPAIR_RULE,
      conflict_status: "one_source_profile_declared_total",
      ai_tagged_budget_usd: String(innovation),
      budget_repair_status: "active_budget_envelope_repaired_total_only",
    },
  ];

  if (write) {
    const headers = ensureHeaders(activeHeaders, [
      "ai_tagged_budget_usd",
      "budget_repair_status",
    ]);
    const rows = [
      ...keptRows.map((row) => ({
        ...Object.fromEntries(headers.map((header) => [header, ""])),
        ...row,
        budget_repair_status: "",
      })),
      ...repairRows.map((row) => ({
        ...Object.fromEntries(headers.map((header) => [header, ""])),
        ...row,
      })),
    ];
    fs.writeFileSync(activePath, stringifyCsv(headers, rows));
  }

  return {
    tenant_key: tenantKey,
    source: relative(profilePath),
    active_file: relative(activePath),
    source_basis: "active enterprise profile declared direct_it_budget_usd",
    total_it_budget_fy26: total,
    run_budget_fy26: "",
    change_budget_fy26: "",
    ai_tagged_budget_fy26: innovation,
    repair_rows: repairRows.length,
    status: "READY_WITH_SPLIT_PENDING",
    caveat:
      "Corporate/local budget fields reconcile to total, but source does not declare run/change split.",
  };
}

function writeCsvReport(filePath, rows) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  fs.writeFileSync(filePath, stringifyCsv(headers, rows));
}

function writeProofHtml(results, write) {
  const rows = results
    .map(
      (row) => `<tr><td>${row.tenant_key}</td><td>${row.status}</td><td>${row.total_it_budget_fy26}</td><td>${row.run_budget_fy26}</td><td>${row.change_budget_fy26}</td><td>${row.ai_tagged_budget_fy26}</td><td>${row.source}</td><td>${row.caveat}</td></tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower Active Budget Envelope Repair</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #1f2933; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d8dee4; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f6f8fa; }
    code { background: #f6f8fa; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Tower Active Budget Envelope Repair</h1>
  <p>Status: <strong>${write ? "WRITE_APPLIED" : "CHECK_ONLY"}</strong></p>
  <p>Layer boundary: source rows are added to active tenant input packs; Tower marts must still be regenerated through the governed ACA operator job before runtime changes are claimed.</p>
  <table>
    <thead>
      <tr><th>Tenant</th><th>Status</th><th>Total</th><th>Run</th><th>Change</th><th>AI tagged</th><th>Source</th><th>Caveat</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, "proof.html"), html);
}

function main() {
  const write = process.argv.includes("--write");
  const expectations = readReconciliationExpectations();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [
    ...F12_BACKED_TENANTS.map((tenantKey) =>
      appendF12BudgetRows(tenantKey, expectations, write),
    ),
    appendHoldcoBudgetRows(write),
  ].sort((a, b) => a.tenant_key.localeCompare(b.tenant_key));

  writeCsvReport(path.join(OUT_DIR, "budget-envelope-repair.csv"), results);
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(
      {
        status: "PASS",
        mode: write ? "write" : "check",
        repaired_tenants: results.length,
        generated_at: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.md"),
    [
      "# Tower Active Budget Envelope Repair",
      "",
      `Status: PASS (${write ? "write applied" : "check only"})`,
      "",
      "This repair adds explicit FY26 budget-envelope source rows to active tenant input packs where the Tower source-path audit found blocking `total_it_budget_fy26` gaps.",
      "",
      "No product runtime or database mart changes are made by this script. Marts must still be regenerated through the governed ACA operator job after merge/deploy.",
      "",
      "| Tenant | Total | Run | Change | AI tagged | Status | Caveat |",
      "| --- | ---: | ---: | ---: | ---: | --- | --- |",
      ...results.map(
        (row) =>
          `| ${row.tenant_key} | ${row.total_it_budget_fy26} | ${row.run_budget_fy26} | ${row.change_budget_fy26} | ${row.ai_tagged_budget_fy26} | ${row.status} | ${row.caveat || ""} |`,
      ),
      "",
    ].join("\n"),
  );
  writeProofHtml(results, write);

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        mode: write ? "write" : "check",
        repaired_tenants: results.length,
        outputs: [
          "reports/tower-active-budget-envelope-repair/summary.md",
          "reports/tower-active-budget-envelope-repair/budget-envelope-repair.csv",
          "reports/tower-active-budget-envelope-repair/proof.html",
        ],
      },
      null,
      2,
    ),
  );
}

main();

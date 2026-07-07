#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TENANTS = [
  {
    tenantKey: "apex-retail",
    label: "Apex Retail Group",
    dir: "datasets/apex-retail-synthetic-v4/ai-control-tower",
  },
  {
    tenantKey: "first-capital-financial",
    label: "First Capital Financial",
    dir: "datasets/first-capital-financial-synthetic-v4/ai-control-tower",
  },
  {
    tenantKey: "lakeshore-holdings",
    label: "Lakeshore Holdings",
    dir: "datasets/lakeshore-holdings-synthetic-v4/ai-control-tower",
    extraFiles: [
      "../family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
      "../family-4-financial-commercial/F12_it-budget-financials.csv",
      "../derived-tower-read-model/portfolio-company-spend.csv",
      "../derived-tower-read-model/vendor-exposure.csv",
    ],
  },
  {
    tenantKey: "meridian-health",
    label: "Meridian Health System",
    dir: "datasets/meridian-health-synthetic-v4/ai-control-tower",
  },
  {
    tenantKey: "skyharbor-air",
    label: "SkyHarbor Air",
    dir: "datasets/skyharbor-air-synthetic-v4/ai-control-tower",
  },
];

const REQUIRED_FILES = [
  "T01_initiative-registry.csv",
  "T07_benefit-realization.csv",
  "T08_spend-contracts.csv",
  "T09_risk-governance.csv",
  "T10_evidence-items.csv",
];

const AMOUNT_COLUMNS = [
  ["promised_benefit_usd", "committed_value", "T07/T01 promised benefit"],
  ["promised_value_usd", "committed_value", "T01 promised value"],
  ["committed_value_usd", "committed_value", "T07 committed value"],
  ["measured_value_usd", "realized_value", "measured value"],
  ["measured_value_ytd_usd", "realized_value", "measured value YTD"],
  ["realized_value_ytd_usd", "realized_value", "realized value YTD"],
  ["unrealized_or_blocked_value_usd", "value_at_stake", "blocked value"],
  ["ytd_spend_usd", "annual_run_rate", "YTD spend evidence"],
  ["actual_ytd_usd", "annual_run_rate", "actual YTD spend evidence"],
  ["annual_budget_usd", "annual_run_rate", "annual budget/spend line"],
  ["fy26_budget_usd", "annual_run_rate", "FY26 budget/spend line"],
  ["total_it_budget_usd", "annual_run_rate", "F12 total IT budget"],
  ["total_it_spend", "annual_run_rate", "derived portfolio-company IT spend"],
  ["actual_spend_ytd_usd", "annual_run_rate", "F12 actual spend YTD"],
  ["opex_amount_usd", "annual_run_rate", "F12 OpEx amount"],
  ["capex_amount_usd", "annual_run_rate", "F12 CapEx amount"],
  ["run_amount_usd", "annual_run_rate", "F12 run amount"],
  ["change_amount_usd", "annual_run_rate", "F12 change amount"],
  ["annual_spend_usd", "contract_value", "contract/vendor exposure"],
  ["contract_value_usd", "contract_value", "contract value"],
];

const STRUCTURAL_FIELDS = [
  ["portfolio_company", "Portfolio company / opco"],
  ["operating_company", "Operating company"],
  ["legal_entity", "Legal entity"],
  ["capex_amount_usd", "CapEx amount"],
  ["opex_amount_usd", "OpEx amount"],
  ["run_amount_usd", "Run amount"],
  ["change_amount_usd", "Change amount"],
  ["utilization_rate", "Vendor/tool utilization"],
  ["licensed_users", "Licensed users"],
  ["active_users", "Active users"],
];

function parseArgs(argv) {
  const args = { downloads: false, selfTest: false, outDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--downloads") args.downloads = true;
    else if (arg === "--self-test") args.selfTest = true;
    else if (arg === "--out-dir") {
      args.outDir = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function canonicalizeTenantKey(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (["lakeshore", "lakeshore-industries", "lakeshore-holdings"].includes(normalized)) {
    return "lakeshore-holdings";
  }
  if (["skyharbor", "skyharbor-air"].includes(normalized)) return "skyharbor-air";
  return normalized;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).filter((values) => values.some((value) => value.trim())).map((values, index) => {
    const record = { __rowNumber: index + 2 };
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    return record;
  });
}

function readCsv(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return [];
  return parseCsv(fs.readFileSync(full, "utf8"));
}

function numberValue(value) {
  const parsed = Number(String(value ?? "").replace(/[$,%]/g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(row, fields) {
  for (const field of fields) {
    if (String(row[field] ?? "").trim()) return String(row[field]).trim();
  }
  return "";
}

function initiativeId(row) {
  return firstValue(row, ["initiative_id", "program_id", "ai_initiative_id"]);
}

function vendorName(row) {
  return firstValue(row, ["vendor_or_tool", "vendor_or_internal", "vendor", "supplier", "tool_name"]);
}

function logicalVendorKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\bexpansion\s+\d+\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown-vendor";
}

function countDistinct(rows, getter) {
  return new Set(rows.map(getter).filter(Boolean)).size;
}

function sumColumn(rows, column) {
  return rows.reduce((acc, row) => acc + (numberValue(row[column]) ?? 0), 0);
}

function fmtMoney(value) {
  if (!Number.isFinite(value) || value === 0) return "$0";
  if (Math.abs(value) >= 1_000_000_000) return `$${Math.round((value / 1_000_000_000) * 10) / 10}B`;
  if (Math.abs(value) >= 1_000_000) return `$${Math.round((value / 1_000_000) * 10) / 10}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round((value / 1_000) * 10) / 10}K`;
  return `$${Math.round(value * 100) / 100}`;
}

function collectRows(tenant) {
  const base = tenant.dir;
  const files = fs.existsSync(path.join(ROOT, base))
    ? fs.readdirSync(path.join(ROOT, base)).filter((file) => file.endsWith(".csv")).sort()
    : [];
  const byFile = new Map();
  for (const file of files) {
    byFile.set(file, readCsv(path.join(base, file)));
  }
  for (const extraFile of tenant.extraFiles ?? []) {
    const key = path.normalize(extraFile).replaceAll(path.sep, "/");
    byFile.set(key, readCsv(path.normalize(path.join(base, extraFile))));
    files.push(key);
  }
  return {
    files,
    byFile,
    initiatives: byFile.get("T01_initiative-registry.csv") ?? [],
    benefits: byFile.get("T07_benefit-realization.csv") ?? [],
    spend: byFile.get("T08_spend-contracts.csv") ?? [],
    budget: byFile.get("../family-4-financial-commercial/F12_it-budget-financials.csv") ?? [],
    budgetRollups: byFile.get("../derived-tower-read-model/portfolio-company-spend.csv") ?? [],
    contractRows: byFile.get("../family-4-financial-commercial/F11_vendors-contracts-licenses.csv") ?? [],
    vendorExposure: byFile.get("../derived-tower-read-model/vendor-exposure.csv") ?? [],
    risks: byFile.get("T09_risk-governance.csv") ?? [],
    evidence: byFile.get("T10_evidence-items.csv") ?? [],
    toolUsage: byFile.get("T03_tool-usage-monthly.csv") ?? [],
  };
}

function makeFileSummary(rows) {
  return rows.files.map((file) => ({
    file,
    rows: rows.byFile.get(file)?.length ?? 0,
  }));
}

function makeAmountAudit(tenant, rows) {
  const out = [];
  for (const file of rows.files) {
    const fileRows = rows.byFile.get(file) ?? [];
    for (const [column, amountType, note] of AMOUNT_COLUMNS) {
      const total = sumColumn(fileRows, column);
      if (total > 0) {
        out.push({
          tenantKey: tenant.tenantKey,
          tenantLabel: tenant.label,
          file,
          column,
          amountType,
          total,
          totalText: fmtMoney(total),
          note,
        });
      }
    }
  }
  return out;
}

function makeGapRows(tenant, rows, gates) {
  const allRows = [
    ...rows.initiatives,
    ...rows.benefits,
    ...rows.spend,
    ...rows.budget,
    ...rows.budgetRollups,
    ...rows.contractRows,
    ...rows.vendorExposure,
    ...rows.risks,
    ...rows.evidence,
    ...rows.toolUsage,
  ];
  const availableFields = new Set(allRows.flatMap((row) => Object.keys(row)).filter((key) => !key.startsWith("__")));
  const gaps = [];

  for (const [field, label] of STRUCTURAL_FIELDS) {
    if (!availableFields.has(field)) {
      gaps.push({
        tenantKey: tenant.tenantKey,
        tenantLabel: tenant.label,
        gapKey: `tower.field.${field}.missing`,
        severity: ["portfolio_company", "operating_company", "capex_amount_usd", "opex_amount_usd"].includes(field) ? "high" : "medium",
        label,
        impact: `${label} is not present in the loaded Tower files, so Tower must render named gaps instead of fabricating that slice.`,
        requiredSource: "Tower v4/v5 input template",
      });
    }
  }

  if (!gates.evidenceBridge.pass) {
    gaps.push({
      tenantKey: tenant.tenantKey,
      tenantLabel: tenant.label,
      gapKey: "tower.evidence_bridge.incomplete",
      severity: "high",
      label: "Initiative-to-evidence bridge incomplete",
      impact: gates.evidenceBridge.detail,
      requiredSource: "T10 evidence-items with initiative_id or benefit evidence_id bridge",
    });
  }

  if (!gates.amountSemantics.pass) {
    gaps.push({
      tenantKey: tenant.tenantKey,
      tenantLabel: tenant.label,
      gapKey: "tower.amount_semantics.thin",
      severity: "critical",
      label: "Tower amount semantics are not complete",
      impact: gates.amountSemantics.detail,
      requiredSource: "Explicit amount_type/accounting_treatment/scope columns in Tower inputs",
    });
  }

  return gaps;
}

function makeGates(tenant, rows, amountAudit) {
  const expectedCanonical = canonicalizeTenantKey(tenant.tenantKey);
  const initiativeIds = new Set(rows.initiatives.map(initiativeId).filter(Boolean));
  const benefitIds = new Set(rows.benefits.map(initiativeId).filter(Boolean));
  const spendIds = new Set(rows.spend.map(initiativeId).filter(Boolean));
  const evidenceByInitiative = new Set(rows.evidence.map(initiativeId).filter(Boolean));
  const evidenceIds = new Set(rows.evidence.map((row) => firstValue(row, ["evidence_id", "evidence_item_id"])).filter(Boolean));
  const benefitsWithEvidence = rows.benefits.filter((row) => evidenceIds.has(firstValue(row, ["evidence_id", "evidence_item_id"]))).length;
  const missingRequiredFiles = REQUIRED_FILES.filter((file) => !rows.files.includes(file));
  const vendorKeys = rows.spend.map((row) => logicalVendorKey(vendorName(row))).filter((key) => key !== "unknown-vendor");
  const duplicateVendorGroups = vendorKeys.length - new Set(vendorKeys).size;
  const amountTypes = new Set(amountAudit.map((entry) => entry.amountType));
  const hasPortfolioDimension = [...rows.initiatives, ...rows.spend, ...rows.benefits].some((row) =>
    ["portfolio_company", "operating_company", "legal_entity"].some((field) => String(row[field] ?? "").trim()),
  );

  const evidenceLinked = evidenceByInitiative.size > 0 || benefitsWithEvidence > 0;

  return {
    canonicalKey: {
      pass: expectedCanonical === tenant.tenantKey,
      detail: `canonical key = ${expectedCanonical}`,
    },
    requiredFiles: {
      pass: missingRequiredFiles.length === 0,
      detail: missingRequiredFiles.length === 0 ? "all required Tower files present" : `missing ${missingRequiredFiles.join(", ")}`,
    },
    initiativeJoin: {
      pass: initiativeIds.size > 0 && [...benefitIds].every((id) => initiativeIds.has(id)) && [...spendIds].every((id) => initiativeIds.has(id)),
      detail: `${initiativeIds.size} initiatives; ${benefitIds.size} benefit-linked; ${spendIds.size} spend-linked`,
    },
    evidenceBridge: {
      pass: evidenceLinked,
      detail: evidenceLinked
        ? `${evidenceByInitiative.size} initiative evidence links; ${benefitsWithEvidence} benefit evidence links`
        : "no initiative_id or evidence_id bridge from evidence rows to initiatives/benefits",
    },
    vendorDedup: {
      pass: vendorKeys.length > 0,
      detail: `${new Set(vendorKeys).size} logical vendors; ${duplicateVendorGroups} duplicate raw vendor rows`,
    },
    amountSemantics: {
      pass: amountTypes.has("committed_value") && amountTypes.has("realized_value") && (amountTypes.has("annual_run_rate") || amountTypes.has("contract_value")),
      detail: `amount types present: ${[...amountTypes].sort().join(", ") || "none"}`,
    },
    portfolioIntegrity: {
      pass: tenant.tenantKey !== "lakeshore-holdings" || hasPortfolioDimension,
      detail: hasPortfolioDimension
        ? "opco/portfolio dimension present"
        : tenant.tenantKey === "lakeshore-holdings"
          ? "Path A only: holding company data lacks opco/portfolio_company slices"
          : "opco dimension not required for this tenant",
    },
  };
}

function readinessFromGates(gates, gaps) {
  const failed = Object.values(gates).filter((gate) => !gate.pass).length;
  const criticalGaps = gaps.filter((gap) => gap.severity === "critical").length;
  const highGaps = gaps.filter((gap) => gap.severity === "high").length;
  if (criticalGaps > 0 || failed > 2) return "red";
  if (highGaps > 0 || failed > 0) return "yellow";
  return "green";
}

function canonicalValueTotal(rows, fields) {
  for (const field of fields) {
    const total = sumColumn(rows, field);
    if (total > 0) return total;
  }
  return 0;
}

function canonicalTowerAmounts(rows) {
  const budgetRollupSpend = canonicalValueTotal(rows.budgetRollups, ["total_it_spend"]);
  const budgetSpend = canonicalValueTotal(rows.budget, ["total_it_budget_usd"]);
  const budgetYtd = canonicalValueTotal(rows.budget, ["actual_spend_ytd_usd"]);
  const contractExposure = canonicalValueTotal(rows.contractRows, ["annual_spend_usd"]) ||
    canonicalValueTotal(rows.vendorExposure, ["annual_spend_usd"]);
  return {
    committed: canonicalValueTotal(rows.benefits, [
      "committed_value_usd",
      "promised_benefit_usd",
      "promised_value_usd",
    ]),
    realized: canonicalValueTotal(rows.benefits, [
      "realized_value_ytd_usd",
      "measured_value_usd",
      "measured_value_ytd_usd",
    ]),
    spend: budgetRollupSpend || budgetSpend || canonicalValueTotal(rows.spend, [
      "annual_budget_usd",
      "fy26_budget_usd",
    ]),
    ytdSpend: budgetYtd || canonicalValueTotal(rows.spend, [
      "actual_ytd_usd",
      "ytd_spend_usd",
    ]),
    contractExposure: contractExposure || canonicalValueTotal(rows.spend, [
      "contract_value_usd",
    ]),
  };
}

function readinessFromGatesOnly(gates) {
  const failed = Object.values(gates).filter((gate) => !gate.pass).length;
  if (failed === 0) return "green";
  if (failed <= 2) return "yellow";
  return "red";
}

function analyzeTenant(tenant) {
  const rows = collectRows(tenant);
  const amountAudit = makeAmountAudit(tenant, rows);
  const gates = makeGates(tenant, rows, amountAudit);
  const gaps = makeGapRows(tenant, rows, gates);
  const canonicalAmounts = canonicalTowerAmounts(rows);
  const initiativeCount = countDistinct(rows.initiatives, initiativeId);
  const vendorCount = countDistinct([...rows.spend, ...rows.contractRows, ...rows.vendorExposure], (row) =>
    logicalVendorKey(vendorName(row) || row.vendor),
  );
  const rowCount = [...rows.byFile.values()].reduce((acc, fileRows) => acc + fileRows.length, 0);

  return {
    tenant,
    files: makeFileSummary(rows),
    summary: {
      tenantKey: tenant.tenantKey,
      tenantLabel: tenant.label,
      readiness: readinessFromGates(gates, gaps),
      gateReadiness: readinessFromGatesOnly(gates),
      fileCount: rows.files.length,
      rowCount,
      initiativeCount,
      vendorCount,
      benefitRows: rows.benefits.length,
      spendRows: rows.spend.length,
      riskRows: rows.risks.length,
      evidenceRows: rows.evidence.length,
      committed: canonicalAmounts.committed,
      realized: canonicalAmounts.realized,
      spend: canonicalAmounts.spend,
      ytdSpend: canonicalAmounts.ytdSpend,
      contractExposure: canonicalAmounts.contractExposure,
      committedText: fmtMoney(canonicalAmounts.committed),
      realizedText: fmtMoney(canonicalAmounts.realized),
      spendText: fmtMoney(canonicalAmounts.spend),
      ytdSpendText: fmtMoney(canonicalAmounts.ytdSpend),
      contractExposureText: fmtMoney(canonicalAmounts.contractExposure),
    },
    gates,
    amountAudit,
    gaps,
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(file, rows) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gateCell(gate) {
  return `<td class="${gate.pass ? "pass" : "fail"}">${gate.pass ? "PASS" : "FAIL"}<small>${htmlEscape(gate.detail)}</small></td>`;
}

function renderHtml(results, generatedAt) {
  const summaries = results.map((result) => result.summary);
  const amountRows = results.flatMap((result) => result.amountAudit);
  const gapRows = results.flatMap((result) => result.gaps);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower Data Trust Gate</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#111827;background:#f8f7f3}
    h1,h2{font-family:Georgia,serif;color:#171717}
    table{border-collapse:collapse;width:100%;background:white;margin:16px 0 28px;border:1px solid #ded8cd}
    th,td{padding:10px 12px;border-bottom:1px solid #e8e1d7;text-align:left;vertical-align:top}
    th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;background:#fbfaf7}
    small{display:block;color:#6b7280;font-size:11px;line-height:1.35;margin-top:4px}
    .pass{color:#166534;background:#f0fdf4}.fail{color:#991b1b;background:#fef2f2}
    .green{color:#166534}.yellow{color:#92400e}.red{color:#991b1b}
    .meta{color:#6b7280}.pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px}
  </style>
</head>
<body>
  <h1>Tower Data Trust Gate</h1>
  <p class="meta">Generated ${htmlEscape(generatedAt)}. Reversible audit only: no database writes, no deletes, no live runtime mutation.</p>
  <p class="meta">Tenant summary values use canonical source precedence to avoid double counting: committed/realized value from T07 benefit realization, annual spend from T08 annual/FY26 budget, YTD spend from T08 actual/YTD spend, and contract exposure from T08 contract value. The amount-type audit below intentionally lists every source column and is not additive.</p>

  <h2>Tenant Readiness</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Readiness</th><th>Gate-only</th><th>Files</th><th>Rows</th><th>Initiatives</th><th>Vendors</th><th>Committed value</th><th>Realized value</th><th>Annual spend</th><th>YTD spend</th><th>Contract exposure</th></tr></thead>
    <tbody>
      ${summaries.map((row) => `<tr>
        <td>${htmlEscape(row.tenantLabel)}<small>${htmlEscape(row.tenantKey)}</small></td>
        <td class="${row.readiness}">${row.readiness.toUpperCase()}</td>
        <td class="${row.gateReadiness}">${row.gateReadiness.toUpperCase()}</td>
        <td>${row.fileCount}</td><td>${row.rowCount}</td><td>${row.initiativeCount}</td><td>${row.vendorCount}</td>
        <td>${htmlEscape(row.committedText)}</td><td>${htmlEscape(row.realizedText)}</td><td>${htmlEscape(row.spendText)}</td><td>${htmlEscape(row.ytdSpendText)}</td><td>${htmlEscape(row.contractExposureText)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Gate Matrix</h2>
  <table>
    <thead><tr><th>Tenant</th><th>A Canonical key</th><th>B Required files</th><th>C Initiative joins</th><th>D Evidence bridge</th><th>E Vendor dedup</th><th>F Amount semantics</th><th>G Portfolio integrity</th></tr></thead>
    <tbody>
      ${results.map((result) => `<tr>
        <td>${htmlEscape(result.tenant.label)}</td>
        ${gateCell(result.gates.canonicalKey)}
        ${gateCell(result.gates.requiredFiles)}
        ${gateCell(result.gates.initiativeJoin)}
        ${gateCell(result.gates.evidenceBridge)}
        ${gateCell(result.gates.vendorDedup)}
        ${gateCell(result.gates.amountSemantics)}
        ${gateCell(result.gates.portfolioIntegrity)}
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Amount-Type Audit</h2>
  <table>
    <thead><tr><th>Tenant</th><th>File</th><th>Column</th><th>Classified type</th><th>Total</th><th>Note</th></tr></thead>
    <tbody>
      ${amountRows.map((row) => `<tr>
        <td>${htmlEscape(row.tenantLabel)}</td><td>${htmlEscape(row.file)}</td><td>${htmlEscape(row.column)}</td>
        <td><span class="pill">${htmlEscape(row.amountType)}</span></td><td>${htmlEscape(row.totalText)}</td><td>${htmlEscape(row.note)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Named Gaps</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Severity</th><th>Gap</th><th>Impact</th><th>Required source</th></tr></thead>
    <tbody>
      ${gapRows.map((row) => `<tr>
        <td>${htmlEscape(row.tenantLabel)}</td><td>${htmlEscape(row.severity)}</td><td>${htmlEscape(row.label)}</td>
        <td>${htmlEscape(row.impact)}</td><td>${htmlEscape(row.requiredSource)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <h2>Source File Volumetrics</h2>
  ${results.map((result) => `<h3>${htmlEscape(result.tenant.label)}</h3><table>
    <thead><tr><th>File</th><th>Rows</th></tr></thead>
    <tbody>${result.files.map((file) => `<tr><td>${htmlEscape(file.file)}</td><td>${file.rows}</td></tr>`).join("")}</tbody>
  </table>`).join("")}
</body>
</html>`;
}

function runSelfTest() {
  const sample = parseCsv('a,b,c\n1,"two, with comma",3\n"4","quote ""inside""",6\n');
  if (sample.length !== 2) throw new Error("csv self-test row count failed");
  if (sample[0].b !== "two, with comma") throw new Error("csv self-test comma failed");
  if (sample[1].b !== 'quote "inside"') throw new Error("csv self-test quote failed");
  if (canonicalizeTenantKey("lakeshore-industries") !== "lakeshore-holdings") throw new Error("tenant canonicalization failed");
  process.stdout.write("tower-data-trust-gate self-test passed\n");
}

function makeOutDir(args, generatedAtSlug) {
  if (args.outDir) return path.resolve(args.outDir);
  if (args.downloads) return path.join(process.env.HOME ?? "/Users/anand", "Downloads", `tower-data-trust-gate-${generatedAtSlug}`);
  return path.join(ROOT, "out", "tower-data-trust-gate", generatedAtSlug);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    return;
  }
  const generatedAt = new Date().toISOString();
  const generatedAtSlug = generatedAt.replace(/[:.]/g, "-");
  const outDir = makeOutDir(args, generatedAtSlug);
  fs.mkdirSync(outDir, { recursive: true });
  const results = TENANTS.map(analyzeTenant);
  const summaries = results.map((result) => result.summary);
  const amountRows = results.flatMap((result) => result.amountAudit);
  const gapRows = results.flatMap((result) => result.gaps);
  const proof = { generatedAt, tenants: results };
  fs.writeFileSync(path.join(outDir, "tower-data-trust-proof.json"), JSON.stringify(proof, null, 2));
  writeCsv(path.join(outDir, "tenant-summary.csv"), summaries);
  writeCsv(path.join(outDir, "amount-type-audit.csv"), amountRows);
  writeCsv(path.join(outDir, "gap-register.csv"), gapRows);
  fs.writeFileSync(path.join(outDir, "tower-data-trust-report.html"), renderHtml(results, generatedAt));
  try {
    execFileSync("zip", ["-qr", `${outDir}.zip`, path.basename(outDir)], { cwd: path.dirname(outDir) });
  } catch {
    // zip is proof convenience only; JSON/CSV/HTML are already written.
  }
  process.stdout.write(`Tower data trust gate wrote ${outDir}\n`);
  process.stdout.write(`Readiness: ${summaries.map((row) => `${row.tenantKey}=${row.readiness}`).join(", ")}\n`);
}

main();

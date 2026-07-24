#!/usr/bin/env node
// Build the client-facing field guide for the Tower template pack.
//
// WHY
//
// `REAL_WORLD_CAPTURE_GUIDE.csv` covers 16 metric areas — 35 of the 791
// (file, column) pairs in the pack, 4.4%. A client handed these 45 CSVs has no
// way to know, for the other 756 columns, who in their organisation owns the
// field, which system it comes out of, what a good value looks like, or what
// breaks on the dashboard if they leave it blank.
//
// WHAT IT EMITS
//
//   TEMPLATE_FIELD_GUIDE.csv   one row per (file, column) — the machine-readable
//                              spec, and the sheet that becomes the Instructions
//                              tab of the client workbook
//   TEMPLATE_FIELD_GUIDE.md    the same, grouped by file, for reading
//
// THE COLUMN THAT MATTERS MOST IS `exemplar_status`
//
// Guidance is cheap to write and easy to ignore. What a client actually copies
// is the example value. So every field is graded on whether OUR OWN pack
// demonstrates it well, computed from the data rather than asserted:
//
//   good         populated across tenants, with real variance
//   thin         populated on some tenants only
//   not_loaded   present but every value is the literal `not_loaded`
//   filler_ramp  values are an arithmetic sequence — a generator, not a business
//   uniform      numeric column with near-zero variance
//   copy_paste   identical values across two or more tenants
//   missing      no tenant populates it at all
//
// Anything not `good` is a field we are asking a client to fill better than we
// filled it ourselves. That list is the backlog, and it is printed at the end.
//
//   node scripts/tower/build-template-field-guide.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "tower-standardized-v1";
const TENANTS = [
  "skyharbor-air",
  "meridian-health",
  "first-capital-financial",
  "lakeshore-industries",
  "apex-retail",
];

// ── who owns it, where it comes from, how to get it ──────────────────────────
//
// Matched on column name, first hit wins. Ordered most-specific first. This is
// pattern-based on purpose: 791 columns cannot be hand-authored and kept true,
// but "anything ending _usd is Finance, out of the GL or the FP&A model" holds
// across every file in the pack and stays true as columns are added.
const FIELD_RULES = [
  [
    /^tenant_key$/,
    "AbarVa",
    "AbarVa onboarding",
    "Pre-filled by AbarVa. Do not edit — it is the tenant fence for row-level security.",
    "Must match the tenant key on every row of every file.",
  ],
  [
    /^(source_file|source_row|value_source|formula|formula_version)$/,
    "Whoever extracts the file",
    "Your extract job",
    "Provenance. Record which system and row this came from so a number on the dashboard can be traced back to your source of record.",
    "value_source is tenant_file for anything you extracted, synthetic only for values AbarVa generated.",
  ],
  [
    /ai_classification|ai_investment_share|ai_tag_basis/,
    "Head of AI / CIO chief of staff",
    "AI investment register, portfolio governance",
    "Tag every initiative: ai_native if the AI IS the deliverable, ai_enabled if it is a modernization carrying an AI component, non_ai otherwise. ai_investment_share_pct is how much of the budget is genuinely AI. This is the single most important field in the pack — without it AI spend cannot be computed at all.",
    "ai_native 80-100, ai_enabled 10-40, non_ai 0. Must reconcile to your AI investment register.",
  ],
  [
    /^(promised|expected|forecast).*_usd$/,
    "Initiative business sponsor",
    "Business case, investment committee paper",
    "The benefit the approved business case promised. Take it from the paper that got funded, not from a later re-forecast — the gap between promise and outcome is the point.",
    "Must trace to an approved business case. Do not net off costs.",
  ],
  [
    /^(measured|realized|realised|validated).*_usd$/,
    "Finance business partner",
    "GL, FP&A benefit tracker",
    "Benefit that Finance has signed off as landed in the P&L or a budget reduction. If Finance has not validated it, leave blank rather than copying the promise.",
    "Must be <= promised. Blank is a legitimate answer and is far better than an optimistic guess.",
  ],
  [
    /budget.*_usd$|_usd.*budget/,
    "IT Finance / FP&A",
    "ERP GL, Apptio, Anaplan, Adaptive",
    "Approved budget for the fiscal year, by portfolio, function, platform and cost centre. Include the approval version so a restatement is visible.",
    "Committed budget, not value at stake. Run + change must equal total.",
  ],
  [
    /^actual.*_usd$|_actual.*_usd$|ytd.*_usd/,
    "IT Finance / FP&A",
    "ERP GL actuals, project accounting",
    "Spend booked to date against this line. Cut it at a month end and say which month in the period column.",
    "Must be <= budget under normal circumstances. Flag overruns rather than capping them.",
  ],
  [
    /cost_usd$|_cost$|run_rate|contract_value/,
    "Procurement / Vendor management",
    "Contract register, Coupa, Ariba, SAP",
    "Annualised contract value or run rate per vendor or tool. Use the committed value, and note the renewal date so concentration and renewal exposure can be shown.",
    "Total vendor run-rate should land near your IT budget, not several times it.",
  ],
  [
    /owner_role|sponsor_role|owned_by|accountable/,
    "CIO chief of staff / PMO",
    "Org chart, portfolio governance deck",
    "The ROLE accountable, not a person's name — 'VP Crew Operations', not 'Priya'. Roles survive reorgs and avoid putting personal data in the pack.",
    "Must be a role title. Never a personal name or an email address.",
  ],
  [
    /^(licensed|active)_users$|seats|_rate_pct$|adoption/,
    "Tool administrator",
    "M365 admin centre, GitHub org insights, vendor usage console",
    "Export the monthly usage report from each tool's own admin console. Licensed = seats paid for; active = seats that actually did something that month. The gap is the story.",
    "active <= licensed. Report per month, not as an average.",
  ],
  [
    /^period$|_date$|renewal|valid_from|valid_to/,
    "Whoever extracts the file",
    "The source system's own date field",
    "Use ISO format — YYYY-MM for a month, YYYY-MM-DD for a date. Every row of a monthly file must carry ITS OWN month, not the extract date.",
    "One period per row. If every row shares a period, the monthly trend is silently lost.",
  ],
  [
    /vendor|supplier|_tool$|tool_name/,
    "Procurement / Vendor management",
    "Contract register, CMDB",
    "Use the contracting entity's legal name, consistently across files. Pick one spelling of AWS and keep it.",
    "Same vendor must be spelled identically everywhere or spend will not consolidate.",
  ],
  [
    /^stage$|^status$|scale_decision|lifecycle/,
    "PMO",
    "Portfolio management tool, Clarity, Planview, Jira",
    "The governance stage this initiative is at. Use your own stage gates and tell AbarVa the mapping once.",
    "Must be one of the allowed values listed for this column.",
  ],
  [
    /evidence|citation|_id$|claim/,
    "Initiative owner",
    "Benefit tracker, document store",
    "Point at the artefact that proves the claim — a signed benefit case, a Finance sign-off, a measured before/after. An unevidenced number is shown as unevidenced.",
    "Every evidence_id must resolve to a row in the evidence file.",
  ],
  [
    /dora_|deployment_freq|lead_time|change_failure|mttr/,
    "Engineering / Platform lead",
    "GitHub, GitLab, Azure DevOps, Jira, PagerDuty",
    "Export DORA metrics from your delivery toolchain per month per team. Do not hand-key them — they change monthly and a stale figure is worse than a blank one.",
    "Report per month. Lead time in the unit named by the column.",
  ],
  [
    /risk|control|compliance|regulat|policy_status/,
    "Risk / Compliance",
    "GRC platform, model risk register",
    "Take from the model risk or AI governance register. If a model is in production without validation, say so — that is exactly the finding the board needs.",
    "Do not mark validated unless the validation is on file and current.",
  ],
  [
    /^(app|application|system|platform)_|cmdb|ci_/,
    "Enterprise architecture",
    "CMDB — ServiceNow, Device42",
    "Export the application inventory with its business criticality and lifecycle state. Restrict it to applications in scope, not every configuration item.",
    "One row per application. Deduplicate aliases before sending.",
  ],
  [
    /headcount|fte|persona|_pct$/,
    "HR / Workforce planning",
    "HRIS — Workday, SuccessFactors",
    "Aggregate counts by role and location only. Never send individual employee records.",
    "Counts and percentages only. No personally identifiable data.",
  ],
  [
    /^(business_area|portfolio_segment|domain|function)/,
    "PMO",
    "Portfolio taxonomy",
    "Your own portfolio taxonomy. Keep it stable across files so the same programme groups the same way everywhere.",
    "Use one taxonomy across the whole pack.",
  ],
  [
    /notes|description|_name$|blocker/,
    "Initiative owner",
    "Portfolio governance record",
    "Plain business English. This text is read by executives and may be quoted on the dashboard, so write it as you would to your CEO.",
    "No internal codenames, no real client names, no personal data.",
  ],
];

const GOVERNANCE = new Set([
  "tenant_key",
  "source_file",
  "source_row",
  "value_source",
  "amount_type",
  "view",
  "is_rollup_of",
  "basis",
  "period",
  "formula",
  "formula_version",
]);

function guidanceFor(col) {
  for (const [re, owner, system, how, rule] of FIELD_RULES) {
    if (re.test(col)) return { owner, system, how, rule };
  }
  return {
    owner: "Initiative owner",
    system: "Portfolio governance record",
    how: "Fill from your system of record for this domain. If you have no source for it, leave it blank — a blank is reported as a gap, an invented value is reported as fact.",
    rule: "Leave blank rather than guessing.",
  };
}

// ── csv ──────────────────────────────────────────────────────────────────────
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
const cell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function readCsv(full) {
  const text = fs.readFileSync(full, "utf8").trim();
  if (!text) return { cols: [], rows: [] };
  const [header, ...lines] = text.split("\n");
  const cols = splitCsvLine(header);
  return {
    cols,
    rows: lines.filter(Boolean).map((l) => {
      const c = splitCsvLine(l);
      return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
    }),
  };
}

const isNum = (v) => v !== "" && Number.isFinite(Number(String(v).replace(/[$,%\s]/g, "")));
const toNum = (v) => Number(String(v).replace(/[$,%\s]/g, ""));

/**
 * A generator counter, not a business measure.
 *
 * The signature is monotonicity IN FILE ORDER with a constant step —
 * `incidents_total` running 40, 41, 42 ... 51 down the rows. Testing sorted
 * distinct values instead flags any dense integer range, which is legitimate
 * for counts and percentages, so this tests the values as they appear.
 */
function isRamp(values) {
  const n = values.map(toNum).filter(Number.isFinite);
  if (n.length < 6) return false;
  const d = n.slice(1).map((v, i) => v - n[i]);
  const steps = new Set(d.map((x) => x.toFixed(6)));
  // One constant step throughout, or a single reset (a per-group counter).
  if (steps.size === 1 && d[0] !== 0) return true;
  if (steps.size === 2) {
    const [a, b] = [...steps].map(Number);
    const counts = d.filter((x) => Math.abs(x - a) < 1e-9).length;
    const dominant = counts > d.length / 2 ? a : b;
    const resets = d.filter((x) => Math.abs(x - dominant) > 1e-9);
    return dominant !== 0 && resets.every((x) => x < 0);
  }
  return false;
}

// ── walk the pack ────────────────────────────────────────────────────────────
const perFile = new Map();
for (const t of TENANTS) {
  for (const fam of fs.readdirSync(path.join(ROOT, BASE, t))) {
    const dir = path.join(ROOT, BASE, t, fam);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".csv")) continue;
      const key = `${fam}/${f}`;
      const { cols, rows } = readCsv(path.join(dir, f));
      if (!perFile.has(key)) perFile.set(key, { cols: [], byTenant: new Map() });
      const e = perFile.get(key);
      for (const c of cols) if (!e.cols.includes(c)) e.cols.push(c);
      e.byTenant.set(t, rows);
    }
  }
}

const out = [];
const weak = [];

for (const [file, { cols, byTenant }] of [...perFile].sort()) {
  for (const col of cols) {
    const perTenantValues = new Map();
    for (const [t, rows] of byTenant) {
      perTenantValues.set(
        t,
        rows.map((r) => (r[col] ?? "").trim()).filter((v) => v !== ""),
      );
    }
    const all = [...perTenantValues.values()].flat();
    const totalRows = [...byTenant.values()].reduce((s, r) => s + r.length, 0);
    const fill = totalRows ? Math.round((all.length / totalRows) * 100) : 0;
    const populatedTenants = [...perTenantValues.entries()].filter(([, v]) => v.length).map(([t]) => t);
    const distinct = new Set(all);
    const enumLikePre = distinct.size > 0 && distinct.size <= 8;

    // exemplar grade
    //
    // Provenance and vocabulary columns are exempt. `source_row` SHOULD be a
    // sequence, `value_source` SHOULD be constant, and an enum SHOULD repeat
    // across tenants — grading those produces noise that buries the real
    // defects. Only columns that carry business data are graded.
    const exempt =
      GOVERNANCE.has(col) ||
      /^(source_row|source_file|ai_tag_basis|line_id|.*_id)$/.test(col) ||
      (enumLikePre && !/_usd$|_pct$|users$|cost/.test(col));

    let status = "good";
    if (exempt) status = "good";
    else if (all.length === 0) status = "missing";
    else if ([...distinct].every((v) => v === "not_loaded" || v === "not_provided")) status = "not_loaded";
    else if (populatedTenants.length === 1 && byTenant.size > 1) status = "thin";
    else if (isRamp(all)) status = "filler_ramp";
    else if (all.length >= 10 && distinct.size / all.length < 0.06 && all.every(isNum))
      status = "uniform";
    else {
      const sigs = new Map();
      for (const [t, v] of perTenantValues) {
        // A shared vocabulary repeating is not a copy-paste; a run of real
        // values repeating verbatim is.
        if (v.length < 5 || new Set(v).size < 5) continue;
        const s = v.join("|");
        if (sigs.has(s)) status = "copy_paste";
        sigs.set(s, t);
      }
    }

    const numeric = all.length > 0 && all.every(isNum);
    const enumLike = !numeric && enumLikePre;
    const example =
      [...distinct].sort((a, b) => (isNum(b) ? toNum(b) : 0) - (isNum(a) ? toNum(a) : 0))[0] ?? "";
    const g = guidanceFor(col);

    const row = {
      family: file.split("/")[0],
      file: file.split("/")[1],
      column: col,
      required: GOVERNANCE.has(col) ? "governance" : fill >= 90 ? "required" : fill > 0 ? "recommended" : "optional",
      data_type: numeric ? "number" : /_date$|^period$/.test(col) ? "date" : enumLike ? "enum" : "text",
      allowed_values: enumLike ? [...distinct].sort().join(" | ") : "",
      fill_rate_pct: fill,
      tenants_populated: `${populatedTenants.length}/${byTenant.size}`,
      example_value: example.length > 60 ? `${example.slice(0, 57)}...` : example,
      owner_role: g.owner,
      source_system: g.system,
      how_to_extract: g.how,
      validation_rule: g.rule,
      exemplar_status: status,
    };
    out.push(row);
    if (status !== "good") weak.push(row);
  }
}

// ── write ────────────────────────────────────────────────────────────────────
const COLS = Object.keys(out[0]);
fs.writeFileSync(
  path.join(ROOT, BASE, "TEMPLATE_FIELD_GUIDE.csv"),
  `${[COLS.join(","), ...out.map((r) => COLS.map((c) => cell(r[c])).join(","))].join("\n")}\n`,
);

const md = [];
md.push("# Tower template — field guide");
md.push("");
md.push(
  `One row per column across all ${perFile.size} files in the pack — ${out.length} fields. For each: who in your organisation owns it, which system it comes out of, how to extract it, and what a good value looks like.`,
);
md.push("");
md.push("## How to use this");
md.push("");
md.push(
  "Each file is owned by a different team. Send each one to the owner named in the **Owner** column rather than asking a single person to complete the pack — no one person can produce all of it, and a pack filled by one person guessing is worse than a partial pack filled by the people who know.",
);
md.push("");
md.push("**A blank is a legitimate answer.** Blanks are reported as coverage gaps. Invented values are reported as fact, and they will be wrong on a board slide.");
md.push("");
md.push("### Reading `exemplar_status`");
md.push("");
md.push("| Status | Meaning |");
md.push("| --- | --- |");
md.push("| `good` | Our reference pack demonstrates this field well — copy its shape |");
md.push("| `thin` | Only one tenant populates it |");
md.push("| `not_loaded` | Present but every value is the literal `not_loaded` |");
md.push("| `filler_ramp` | Values form an arithmetic sequence — generated, not real |");
md.push("| `uniform` | Numeric column with almost no variance |");
md.push("| `copy_paste` | Identical values across two or more tenants |");
md.push("| `missing` | No tenant populates it at all |");
md.push("");
const byStatus = out.reduce((m, r) => ((m[r.exemplar_status] = (m[r.exemplar_status] ?? 0) + 1), m), {});
md.push(
  `Across the pack: ${Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([k, v]) => `**${k}** ${v}`).join(", ")}.`,
);
md.push("");

let lastFam = "";
for (const [file, { cols }] of [...perFile].sort()) {
  const fam = file.split("/")[0];
  if (fam !== lastFam) {
    md.push(`## ${fam}`);
    md.push("");
    lastFam = fam;
  }
  md.push(`### \`${file.split("/")[1]}\``);
  md.push("");
  md.push("| Column | Req | Type | Owner | Source system | How to extract | Example | Our pack |");
  md.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const col of cols) {
    const r = out.find((x) => x.file === file.split("/")[1] && x.column === col && x.family === fam);
    if (!r) continue;
    const how = r.how_to_extract.length > 150 ? `${r.how_to_extract.slice(0, 147)}...` : r.how_to_extract;
    md.push(
      `| \`${r.column}\` | ${r.required} | ${r.data_type} | ${r.owner_role} | ${r.source_system} | ${how.replace(/\|/g, "/")} | ${String(r.example_value).replace(/\|/g, "/")} | ${r.exemplar_status === "good" ? "ok" : `**${r.exemplar_status}**`} |`,
    );
  }
  md.push("");
}
fs.writeFileSync(path.join(ROOT, BASE, "TEMPLATE_FIELD_GUIDE.md"), `${md.join("\n")}\n`);

// ── report ───────────────────────────────────────────────────────────────────
console.log(`${out.length} fields across ${perFile.size} files\n`);
for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(13)} ${String(v).padStart(4)}  ${((v / out.length) * 100).toFixed(1)}%`);
}
console.log(`\nFields we ask clients to fill better than we filled them: ${weak.length}`);
const worst = weak.filter((r) => r.exemplar_status !== "missing").slice(0, 12);
for (const r of worst) console.log(`  ${r.exemplar_status.padEnd(12)} ${r.file}/${r.column}`);

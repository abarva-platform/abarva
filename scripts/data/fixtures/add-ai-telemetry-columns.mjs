#!/usr/bin/env node
/**
 * Bring the AI usage feed up to what the platforms actually expose.
 *
 * The existing feed captures a seat-adoption view: licensed, enabled, active and power users, a
 * usage-event count, and an adoption rate against target. That answers "how many people log in". It
 * does not answer any of the questions a client asks in the second meeting, and — more importantly —
 * it does not reconcile to a single invoice.
 *
 * What the platforms actually publish:
 *
 * - **Microsoft 365 Copilot** (Graph `getMicrosoft365CopilotUsageUserDetail`, ~48h refresh): per-user
 *   prompt count and active-day count, last activity split by app — Word, Excel, PowerPoint, Outlook,
 *   Teams, Copilot chat, Edge, OneNote. A separate agent report segments by license state and agent
 *   creator type.
 * - **ServiceNow Now Assist**: the billed unit is an "assist", queryable from `sys_gen_ai_usage_log`,
 *   with Performance Analytics indicators for workflow latency and task closure rate.
 * - **Coding assistants**: tokens, sessions, and suggestion acceptance rate.
 *
 * Three gaps mattered enough to fix.
 *
 * **No metered unit.** `usage_events` is a generic count that reconciles to nothing. Every platform
 * bills on something specific — prompts, assists, tokens — and a consumption figure that cannot be
 * tied to an invoice cannot support a cost conversation.
 *
 * **No quality signal.** 306 active users who discard every suggestion is not adoption. Acceptance
 * rate is the difference between a tool being opened and a tool being used.
 *
 * **No collection provenance.** A 48-hour-stale export presented as current is a different claim from
 * a live read, and the sheet had no way to say which it was.
 *
 * Usage:
 *   node scripts/data/fixtures/add-ai-telemetry-columns.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

const NEW_COLUMNS = [
  "metered_unit",
  "metered_quantity",
  "metered_quantity_period",
  "contracted_quantity",
  "acceptance_rate_pct",
  "task_completion_rate_pct",
  "median_latency_seconds",
  "license_state_breakdown",
  "agent_creator_type",
  "per_surface_breakdown",
  "collection_method",
  "collection_endpoint",
  "refresh_lag_hours",
  "shadow_usage_flag",
];

/**
 * How each class of tool is actually metered, and where the figure comes from.
 *
 * Keyed on tool category and vendor rather than tool name, because the billing unit is a property of
 * the platform, not of the deployment.
 */
function meteringFor(vendor, category, toolName) {
  const v = `${vendor} ${toolName}`.toLowerCase();
  if (/copilot|microsoft/.test(v)) {
    return {
      unit: "prompts",
      method: "api_pull",
      endpoint: "MS Graph reports · getMicrosoft365CopilotUsageUserDetail",
      lagHours: 48,
      surfaces: ["Teams", "Outlook", "Word", "Excel", "PowerPoint", "Copilot chat"],
      creatorType: "microsoft_published",
    };
  }
  if (/servicenow|now assist/.test(v)) {
    return {
      unit: "assists",
      method: "table_query",
      endpoint: "ServiceNow · sys_gen_ai_usage_log + Now Assist Analytics indicators",
      lagHours: 24,
      surfaces: ["Virtual Agent", "Incident summarisation", "Change assist", "Knowledge assist"],
      creatorType: "vendor_skill",
    };
  }
  if (/workday/.test(v)) {
    return {
      unit: "assisted_transactions",
      method: "api_pull",
      endpoint: "Workday · Prism analytics extract",
      lagHours: 24,
      surfaces: ["Absence", "Recruiting", "Journeys"],
      creatorType: "vendor_skill",
    };
  }
  if (/claude|codex|code|github/.test(v)) {
    return {
      unit: "tokens",
      method: "api_pull",
      endpoint: "Vendor usage API · seat and token report",
      lagHours: 12,
      surfaces: ["IDE", "CLI", "code review"],
      creatorType: "vendor_published",
    };
  }
  if (/predictive|decision_support/.test(category)) {
    return {
      unit: "scored_records",
      method: "warehouse_query",
      endpoint: "Model serving log, joined to the owning system of record",
      lagHours: 24,
      surfaces: ["Batch scoring", "In-workflow scoring"],
      creatorType: "internally_built",
    };
  }
  return {
    unit: "requests",
    method: "manual_export",
    endpoint: "Vendor admin console CSV export",
    lagHours: 168,
    surfaces: ["Primary surface"],
    creatorType: "unknown",
  };
}

function parseCsv(text) {
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const int = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const summary = [];

for (const tenantKey of TENANTS) {
  const file = path.join(ACTIVE, tenantKey, "current/SA09_AI_Tool_Usage_Feed.csv");
  if (!fs.existsSync(file)) continue;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const body = rows.slice(1).filter((r) => r.some((v) => v.trim()));
  const outHeader = [...header, ...NEW_COLUMNS.filter((c) => !header.includes(c))];

  const units = {};
  const out = body.map((raw, idx) => {
    const row = Object.fromEntries(header.map((h, i) => [h, (raw[i] ?? "").trim()]));
    const m = meteringFor(row.vendor_name, row.tool_category, row.tool_name);
    units[m.unit] = (units[m.unit] ?? 0) + 1;

    const active = int(row.active_users);
    const licensed = int(row.licensed_users);
    const enabled = int(row.enabled_users);
    const power = int(row.power_users);

    // Consumption per active user, varied deterministically and shaped by how heavily the surface is
    // used. Power users carry a disproportionate share, which is the pattern every adoption report
    // shows and the reason a per-seat average misleads.
    const perUser = m.unit === "tokens" ? 42_000 : m.unit === "assists" ? 180 : m.unit === "prompts" ? 96 : 240;
    const spread = 0.75 + ((idx * 17) % 60) / 100;
    const metered = Math.round((active * perUser + power * perUser * 2.4) * spread);

    // Acceptance is the signal seat counts hide. Deliberately low where adoption is low: a tool
    // people open and do not act on is the most common finding in this data, and a fixture where
    // acceptance tracks adoption has nothing to reveal.
    const usageRate = int(row.usage_rate_pct) || 1;
    const acceptance = Math.max(11, Math.min(78, Math.round(usageRate * (0.6 + ((idx * 13) % 70) / 100))));

    const disabled = Math.max(0, licensed - enabled);
    const neverActive = Math.max(0, enabled - active);

    return {
      ...row,
      metered_unit: m.unit,
      metered_quantity: String(metered),
      metered_quantity_period: `${row.usage_period_start} to ${row.usage_period_end}`,
      // Contracted volume sits above consumption, which is the normal state and the thing a renewal
      // conversation is actually about.
      contracted_quantity: String(Math.round((metered * (1.25 + ((idx * 7) % 40) / 100)) / 1000) * 1000),
      acceptance_rate_pct: String(acceptance),
      task_completion_rate_pct: String(Math.max(20, Math.min(94, acceptance + 12 + ((idx * 5) % 15)))),
      median_latency_seconds: String((1.2 + ((idx * 11) % 38) / 10).toFixed(1)),
      license_state_breakdown: `licensed ${licensed}; enabled ${enabled}; disabled-but-billed ${disabled}; enabled-never-active ${neverActive}`,
      agent_creator_type: m.creatorType,
      per_surface_breakdown: m.surfaces
        .map((s, i) => `${s} ${Math.max(2, Math.round((usageRate * (1.6 - i * 0.28)) ))}%`)
        .join("; "),
      collection_method: m.method,
      collection_endpoint: m.endpoint,
      refresh_lag_hours: String(m.lagHours),
      // Manual exports cannot see usage outside the licensed tenant, so shadow usage is unknown
      // rather than absent — an important distinction when the question is whether staff have moved
      // to an unmanaged tool.
      shadow_usage_flag: m.method === "manual_export" ? "unknown_not_instrumented" : "none_detected",
    };
  });

  summary.push({ tenantKey, rows: out.length, columnsAdded: outHeader.length - header.length, meteredUnits: units });

  if (WRITE) {
    const csv = [outHeader.join(","), ...out.map((r) => outHeader.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
    fs.writeFileSync(file, csv);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey}: ${s.rows} rows, +${s.columnsAdded} columns`);
  console.log(`  metered units: ${Object.entries(s.meteredUnits).map(([k, v]) => `${k} (${v})`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");

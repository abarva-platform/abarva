#!/usr/bin/env node
/**
 * Generate the raw platform extracts a client actually hands over.
 *
 * `SA09_AI_Tool_Usage_Feed.csv` is a tidy summary — one row per tool, adoption already computed,
 * surfaces already rolled up. No client produces that. Somebody produced it, by exporting four
 * incompatible admin-centre reports and reconciling them by hand, and every judgement they made in
 * the process is invisible.
 *
 * That matters more than it sounds. A pre-aggregated feed means the pipeline never has to normalise
 * anything, so the adapter layer has never met real heterogeneity: `userPrincipalName` against
 * `sys_created_by`, activity dates against consumption counters, per-user rows against per-event
 * rows. It also means the aggregation happens where nobody can audit it, which is exactly where
 * per-surface splits and licence waste get lost.
 *
 * So this emits the sources instead, each in the shape its platform actually publishes:
 *
 *   ms365-copilot-usage-user-detail   per user, Graph field names, per-app last-activity dates
 *   servicenow-gen-ai-usage-log       per invocation, assists consumed, execution time, outcome
 *   workday-ai-assist-adoption        per worker per module, assisted transactions
 *   coding-assistant-token-report     per developer, tokens, sessions, suggestion acceptance
 *
 * The summary feed becomes a derived artifact rather than an input. Anything it asserts should be
 * reproducible by aggregating these, and where it is not, that is a finding about the summary.
 *
 * Volume is bounded deliberately. Real Graph output is per-user-per-day — 1,035 users over a quarter
 * is ninety thousand rows for one tool — which is faithful and unreviewable. These are per-user with
 * period totals: the grain a human can check, carrying the fields that matter.
 *
 * Usage:
 *   node scripts/data/fixtures/generate-ai-platform-extracts.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

/** Deterministic pseudo-random, so a rerun reproduces the fixture exactly. */
function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FIRST = ["Alex", "Priya", "Marcus", "Chen", "Sofia", "Ravi", "Nadia", "Tom", "Grace", "Idris",
  "Lena", "Omar", "Ava", "Jonas", "Mei", "Diego", "Hannah", "Yusuf", "Clara", "Ben"];
const LAST = ["Okafor", "Sharma", "Bennett", "Wei", "Marino", "Iyer", "Haddad", "Fletcher", "Nakamura",
  "Adeyemi", "Kowalski", "Rahman", "Lindqvist", "Moreau", "Santos", "Duarte", "Novak", "Petrov", "Ellis", "Tran"];

function person(rand, domain) {
  const first = FIRST[Math.floor(rand() * FIRST.length)];
  const last = LAST[Math.floor(rand() * LAST.length)];
  return {
    displayName: `${first} ${last}`,
    upn: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
  };
}

const iso = (base, offsetDays) => {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

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
const objects = (rows) => {
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
};
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const int = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
};
const writeCsv = (file, header, rows) =>
  fs.writeFileSync(file, [header.join(","), ...rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n");

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const feedPath = path.join(dir, "SA09_AI_Tool_Usage_Feed.csv");
  if (!fs.existsSync(feedPath)) continue;
  const feed = objects(parseCsv(fs.readFileSync(feedPath, "utf8")));
  const domain = `${tenantKey.split("-")[0]}.example.com`;
  const outDir = path.join(dir, "extracts");
  const files = [];

  const copilotRows = [];
  const serviceNowRows = [];
  const workdayRows = [];
  const codingRows = [];

  for (const row of feed) {
    const rand = rng(`${tenantKey}|${row.tool_name}`);
    const tool = `${row.vendor_name} ${row.tool_name}`.toLowerCase();
    const licensed = int(row.licensed_users);
    const enabled = int(row.enabled_users);
    const active = int(row.active_users);
    const power = int(row.power_users);
    const periodEnd = row.usage_period_end || "2026-06-30";
    // Graph reports carry a refresh date that lags the period end. Presenting a stale export as
    // current is a different claim, and the field is how a reader tells.
    const refreshDate = iso(periodEnd, 2);

    if (/copilot|microsoft/.test(tool)) {
      for (let i = 0; i < licensed; i += 1) {
        const p = person(rand, domain);
        const isEnabled = i < enabled;
        const isActive = i < active;
        const isPower = i < power;
        // Prompts follow a long tail: a small group carries most of the consumption and the median
        // licensed user issues none at all. A per-seat average hides both facts.
        const prompts = !isActive ? 0 : isPower ? 180 + Math.floor(rand() * 900) : 4 + Math.floor(rand() * 70);
        const activeDays = !isActive ? 0 : isPower ? 40 + Math.floor(rand() * 25) : 1 + Math.floor(rand() * 18);
        const lastActivity = isActive ? iso(periodEnd, -Math.floor(rand() * 30)) : "";
        const surface = (weight) => (isActive && rand() < weight ? iso(periodEnd, -Math.floor(rand() * 45)) : "");
        copilotRows.push({
          reportRefreshDate: refreshDate,
          userPrincipalName: p.upn,
          displayName: p.displayName,
          // Graph reports the licence, and a licensed-but-disabled seat still bills.
          copilotLicenseAssigned: "TRUE",
          copilotLicenseEnabled: isEnabled ? "TRUE" : "FALSE",
          lastActivityDate: lastActivity,
          promptCount: String(prompts),
          activeDayCount: String(activeDays),
          copilotChatLastActivityDate: surface(0.55),
          microsoftTeamsCopilotLastActivityDate: surface(0.62),
          outlookCopilotLastActivityDate: surface(0.5),
          wordCopilotLastActivityDate: surface(0.38),
          excelCopilotLastActivityDate: surface(0.22),
          powerPointCopilotLastActivityDate: surface(0.19),
          oneNoteCopilotLastActivityDate: surface(0.08),
          reportPeriod: "90D",
        });
      }
      files.push("ms365-copilot-usage-user-detail");
    } else if (/servicenow|now assist/.test(tool)) {
      // Per invocation, as sys_gen_ai_usage_log records it.
      const invocations = Math.min(1200, Math.max(120, int(row.usage_events) || active * 12));
      const skills = ["incident_summarisation", "resolution_notes", "change_summary", "knowledge_authoring", "virtual_agent_deflection"];
      for (let i = 0; i < invocations; i += 1) {
        const p = person(rand, domain);
        const skill = skills[Math.floor(rand() * skills.length)];
        const accepted = rand() < 0.42;
        serviceNowRows.push({
          sys_id: `${tenantKey.slice(0, 3)}${String(i).padStart(6, "0")}`,
          sys_created_on: `${iso(periodEnd, -Math.floor(rand() * 90))} ${String(7 + Math.floor(rand() * 11)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00`,
          sys_created_by: p.upn,
          skill_name: skill,
          capability: skill.includes("virtual_agent") ? "conversational" : "generative",
          // Assists are the billed unit and vary by skill, which is why a raw invocation count
          // cannot be reconciled to an invoice.
          assists_consumed: String(skill === "knowledge_authoring" ? 3 : skill === "change_summary" ? 2 : 1),
          execution_time_ms: String(600 + Math.floor(rand() * 5200)),
          outcome: accepted ? "accepted" : rand() < 0.7 ? "discarded" : "edited",
          target_table: skill.startsWith("incident") ? "incident" : skill.startsWith("change") ? "change_request" : "kb_knowledge",
          model_version: "now-assist-2026.06",
        });
      }
      files.push("servicenow-gen-ai-usage-log");
    } else if (/workday/.test(tool)) {
      const modules = ["Absence", "Recruiting", "Journeys", "Expenses"];
      for (let i = 0; i < Math.max(40, active); i += 1) {
        const p = person(rand, domain);
        const functionalArea = modules[Math.floor(rand() * modules.length)];
        workdayRows.push({
          Extract_Date: refreshDate,
          Worker_ID: `WD-${String(100000 + i)}`,
          Worker_Name: p.displayName,
          Functional_Area: functionalArea,
          Assisted_Transactions: String(Math.floor(rand() * 40)),
          Assisted_Transaction_Minutes_Saved: String(Math.floor(rand() * 220)),
          Manual_Fallback_Count: String(Math.floor(rand() * 9)),
          Period_Start: row.usage_period_start,
          Period_End: periodEnd,
        });
      }
      files.push("workday-ai-assist-adoption");
    } else if (/claude|codex|github|code/.test(tool)) {
      for (let i = 0; i < Math.max(25, active); i += 1) {
        const p = person(rand, domain);
        const suggested = 200 + Math.floor(rand() * 3800);
        const accepted = Math.floor(suggested * (0.14 + rand() * 0.4));
        codingRows.push({
          report_period_start: row.usage_period_start,
          report_period_end: periodEnd,
          user_email: p.upn,
          seat_type: rand() < 0.2 ? "enterprise" : "standard",
          sessions: String(10 + Math.floor(rand() * 190)),
          input_tokens: String(120_000 + Math.floor(rand() * 2_400_000)),
          output_tokens: String(30_000 + Math.floor(rand() * 900_000)),
          suggestions_shown: String(suggested),
          suggestions_accepted: String(accepted),
          // The metric that separates a tool being open from a tool being used.
          acceptance_rate_pct: ((accepted / suggested) * 100).toFixed(1),
          last_active_date: iso(periodEnd, -Math.floor(rand() * 21)),
        });
      }
      files.push("coding-assistant-token-report");
    }
  }

  const emitted = [];
  const emit = (name, header, rows) => {
    if (rows.length === 0) return;
    emitted.push({ file: `${name}.csv`, rows: rows.length, columns: header.length });
    if (WRITE) {
      fs.mkdirSync(outDir, { recursive: true });
      writeCsv(path.join(outDir, `${name}.csv`), header, rows);
    }
  };

  emit("ms365-copilot-usage-user-detail", Object.keys(copilotRows[0] ?? {}), copilotRows);
  emit("servicenow-gen-ai-usage-log", Object.keys(serviceNowRows[0] ?? {}), serviceNowRows);
  emit("workday-ai-assist-adoption", Object.keys(workdayRows[0] ?? {}), workdayRows);
  emit("coding-assistant-token-report", Object.keys(codingRows[0] ?? {}), codingRows);

  summary.push({ tenantKey, outDir: path.relative(ROOT, outDir), extracts: emitted });
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey} -> ${s.outDir}`);
  for (const e of s.extracts) console.log(`  ${e.file.padEnd(38)} ${String(e.rows).padStart(6)} rows · ${e.columns} columns`);
}
if (!WRITE) console.log("\ndry-run — pass --write to emit the extracts.");

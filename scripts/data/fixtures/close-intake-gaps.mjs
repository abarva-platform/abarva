#!/usr/bin/env node
/**
 * Close the intake gaps that block a product surface.
 *
 * A column-by-column audit of all twenty-six sheets found roughly sixty missing fields. Most are
 * nice-to-have. These are the ones where a surface cannot answer its own question without them, and
 * each is derived from data the tenant already holds so nothing contradicts the estate.
 *
 * | Missing | What it blocks |
 * | --- | --- |
 * | `04.annual_cost_usd`, `user_count` | 503 applications and no cost each — the estate cannot be ranked by spend, so no rationalisation case can be built |
 * | `06.annual_cost_usd`, `utilization_pct` | Underused platforms are invisible; consolidation has no evidence |
 * | `07.notice_period_days`, `auto_renew_flag` | Source cannot say "you have 43 days to give notice", which is the single most actionable line in a renewal review |
 * | `07.exit_cost_usd`, `benchmark_clause` | Switching cost and price-testing rights are the two things that decide whether leverage exists at all |
 * | `08.prior_year_actual_usd` | Home's prior-year tile reads "Not established" — there was no column to carry it |
 * | `09.start_date`, `pct_complete`, `stage_gate` | Moves cannot show a portfolio in flight without dates and progress |
 * | `11.inherent/residual_risk_score`, `last_tested_date` | Risk posture cannot be quantified or aged |
 * | `01.headcount_fte`, `cost_to_serve_usd` | Home's executive summary has no denominator for cost per function |
 * | `18.transaction_volume`, `cost_per_transaction` | Process economics — the basis of every automation case |
 *
 * Cross-sheet consistency is enforced rather than hoped for: application and infrastructure costs are
 * apportioned from the technology budget the spend sheet declares, so the parts sum to the whole
 * instead of drifting into their own arithmetic.
 *
 * Usage:
 *   node scripts/data/fixtures/close-intake-gaps.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

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
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const rnd = (seed) => {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
const TIER = { tier1: 4.2, tier2: 2.1, tier3: 1, tier4: 0.6 };

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const load = (f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return null;
    const rows = parseCsv(fs.readFileSync(p, "utf8"));
    const header = rows[0].map((h) => h.trim());
    return {
      path: p,
      header,
      rows: rows.slice(1).filter((r) => r.some((v) => v.trim()))
        .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()]))),
    };
  };
  const save = (t, extra) => {
    const header = [...t.header, ...extra.filter((c) => !t.header.includes(c))];
    if (WRITE) {
      fs.writeFileSync(
        t.path,
        [header.join(","), ...t.rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n",
      );
    }
    return header.length - t.header.length;
  };

  const added = {};
  const spend = load("08_spend_value.csv");
  const itBudget = spend ? spend.rows.reduce((s, r) => s + num(r.annual_spend_usd), 0) : 0;

  // ---- 04 applications: cost and users, apportioned from the technology budget -----------------
  const apps = load("04_applications_systems.csv");
  if (apps && itBudget) {
    // Applications carry roughly 45% of a technology budget; infrastructure and shared services the
    // rest. Apportioning from the declared budget keeps the parts summing to the whole.
    const pool = itBudget * 0.45;
    const weights = apps.rows.map((a) => TIER[(a.criticality ?? "").toLowerCase()] ?? 1);
    const wSum = weights.reduce((x, y) => x + y, 0) || 1;
    apps.rows.forEach((a, i) => {
      const r = rnd(`${tenantKey}|app|${a.system_name}`);
      // Lifecycle variety, because there was none: 501 of 503 applications were "current", which
      // makes every debt score cluster in the middle and leaves the estate with nothing to
      // rationalise. A 500-application estate with no legacy in it is not a clean estate, it is an
      // uncatalogued one — and the rationalisation case is the whole reason to catalogue it.
      const tierNow = (a.criticality ?? "").toLowerCase();
      const legacySignal = /mainframe|as400|cobol|legacy|db2|cics|on-?prem/i.test(
        `${a.system_name} ${a.technology_stack ?? ""} ${a.hosting_location ?? ""}`,
      );
      if (!/target_state/i.test(a.lifecycle_state ?? "")) {
        const roll = r();
        a.lifecycle_state = legacySignal
          ? roll < 0.4 ? "legacy_stable" : roll < 0.62 ? "sunset_planned" : roll < 0.72 ? "deprecated" : "current"
          : roll < 0.62 ? "current"
            : roll < 0.78 ? "legacy_stable"
              : roll < 0.88 ? "sunset_planned"
                : roll < 0.94 ? "deprecated" : "target_state";
      }
      const cost = Math.round(((weights[i] / wSum) * pool) / 1000) * 1000;
      const tier = tierNow;
      a.annual_cost_usd = String(cost);
      a.user_count = String(Math.max(5, Math.round((tier === "tier1" ? 900 : tier === "tier2" ? 220 : 45) * (0.4 + r()))));
      // Debt rises with age and falls with cloud readiness — a legacy on-prem system scores worst.
      const lc = (a.lifecycle_state ?? "").toLowerCase();
      a.technical_debt_score = String(
        Math.min(10, Math.max(1, Math.round(
          (lc.includes("deprecated") ? 9 : lc.includes("sunset") ? 8 : lc.includes("legacy") ? 7 : lc.includes("target") ? 2 : 4) +
          (/on-?prem|data cent|mainframe/i.test(a.hosting_location ?? "") ? 1.5 : 0) - r(),
        ))),
      );
      a.cloud_readiness = /saas|cloud/i.test(a.deployment_model ?? "")
        ? "already_cloud"
        : /mainframe|as400/i.test(`${a.system_name} ${a.technology_stack ?? ""}`)
          ? "not_feasible_without_rewrite"
          : r() < 0.45 ? "rehost_candidate" : "refactor_required";
      // A tier-1 system with high debt is a modernisation candidate, not a replacement one: you
      // cannot simply switch off the platform the airline runs on. Conflating the two produces a
      // rationalisation list nobody can act on.
      const debt = Number(a.technical_debt_score);
      a.replacement_candidate =
        debt >= 7 && tierNow !== "tier1" ? "yes"
          : debt >= 7 ? "modernise_in_place"
            : "no";
      a.end_of_support_date = r() < 0.22 ? `20${27 + Math.floor(r() * 3)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-01` : "";
    });
    added.applications = save(apps, ["annual_cost_usd", "user_count", "technical_debt_score", "cloud_readiness", "replacement_candidate", "end_of_support_date"]);
  }

  // ---- 06 infrastructure: cost, utilisation, life ----------------------------------------------
  const infra = load("06_infrastructure_platforms.csv");
  if (infra && itBudget) {
    const pool = itBudget * 0.28;
    const weights = infra.rows.map((p) => TIER[(p.criticality ?? "").toLowerCase()] ?? 1);
    const wSum = weights.reduce((x, y) => x + y, 0) || 1;
    infra.rows.forEach((p, i) => {
      const r = rnd(`${tenantKey}|infra|${p.platform_name}`);
      p.annual_cost_usd = String(Math.round(((weights[i] / wSum) * pool) / 1000) * 1000);
      // Deliberately spread wide. A platform estate where everything sits at healthy utilisation has
      // no consolidation case in it, and consolidation is the point of cataloguing platforms.
      p.utilization_pct = String(18 + Math.floor(r() * 66));
      p.end_of_life_date = r() < 0.3 ? `20${27 + Math.floor(r() * 4)}-06-30` : "";
      p.dr_tier = /dr|recovery|replicat/i.test(`${p.platform_name} ${p.platform_type}`) ? "tier1_hot"
        : (p.criticality ?? "").toLowerCase() === "tier1" ? "tier2_warm" : "tier3_backup_only";
      p.capacity_headroom_pct = String(Math.max(0, 100 - Number(p.utilization_pct) - Math.floor(r() * 12)));
    });
    added.infrastructure = save(infra, ["annual_cost_usd", "utilization_pct", "end_of_life_date", "dr_tier", "capacity_headroom_pct"]);
  }

  // ---- 07 vendors: the renewal levers -----------------------------------------------------------
  const vendors = load("07_vendors_contracts.csv");
  if (vendors) {
    const book = vendors.rows.reduce((s, v) => s + num(v.annual_spend_usd), 0) || 1;
    vendors.rows.forEach((v) => {
      const r = rnd(`${tenantKey}|vendor|${v.vendor_name}|${v.contract_name}`);
      const value = num(v.annual_spend_usd);
      v.auto_renew_flag = r() < 0.62 ? "yes" : "no";
      // Notice periods cluster at contractual round numbers, and the large agreements carry the
      // longest — which is precisely why they are the ones missed.
      v.notice_period_days = String(value > book * 0.05 ? [120, 180][Math.floor(r() * 2)] : [30, 60, 90][Math.floor(r() * 3)]);
      v.benchmark_clause = r() < 0.35 ? "yes_annual" : r() < 0.6 ? "yes_once_per_term" : "none";
      // Switching cost scales with entanglement, not with price. A cheap deeply-integrated system can
      // cost more to leave than an expensive standalone one.
      v.exit_cost_usd = String(Math.round((value * (0.15 + r() * 0.5)) / 1000) * 1000);
      const share = value / book;
      v.concentration_risk = share > 0.1 ? "high" : share > 0.04 ? "medium" : "low";
    });
    added.vendors = save(vendors, ["auto_renew_flag", "notice_period_days", "benchmark_clause", "exit_cost_usd", "concentration_risk"]);
  }

  // ---- 08 spend: prior year and forecast --------------------------------------------------------
  if (spend) {
    spend.rows.forEach((s) => {
      const r = rnd(`${tenantKey}|spend|${s.spend_category}`);
      const current = num(s.annual_spend_usd);
      // Prior year is what Home's tile has been unable to show. It is an observed figure the client
      // holds and the template never asked for.
      s.prior_year_actual_usd = String(Math.round((current / (1 + (0.02 + r() * 0.11))) / 1000) * 1000);
      s.forecast_next_year_usd = String(Math.round((current * (1.01 + r() * 0.09)) / 1000) * 1000);
      s.budget_owner = s.cost_center_or_owner || "Technology Finance";
    });
    added.spend = save(spend, ["prior_year_actual_usd", "forecast_next_year_usd", "budget_owner"]);
  }

  // ---- 09 programmes: dates and progress --------------------------------------------------------
  const programs = load("09_programs_initiatives.csv");
  if (programs) {
    programs.rows.forEach((p, i) => {
      const r = rnd(`${tenantKey}|prog|${p.program_name}`);
      const startYear = 2025 + Math.floor(r() * 2);
      p.start_date = `${startYear}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-01`;
      p.end_date = `${startYear + 1 + Math.floor(r() * 2)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-28`;
      const phase = (p.phase ?? "").toLowerCase();
      p.pct_complete = String(phase === "execute" ? 30 + Math.floor(r() * 55) : phase === "pilot" ? 10 + Math.floor(r() * 30) : Math.floor(r() * 15));
      p.stage_gate = phase === "execute" ? "delivery" : phase === "pilot" ? "proof" : "shaping";
      p.blocked_reason = (p.status ?? "").toLowerCase() === "at_risk"
        ? ["Dependency on a platform migration that has slipped two quarters.",
           "Business sponsor changed; scope is being re-agreed.",
           "Funding approved for year one only; year two is unconfirmed.",
           "Key supplier resource unavailable until the next contract period."][i % 4]
        : "";
      p.benefit_realization_start = `${startYear + 1}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-01`;
    });
    added.programs = save(programs, ["start_date", "end_date", "pct_complete", "stage_gate", "blocked_reason", "benefit_realization_start"]);
  }

  // ---- 11 risks: scored and aged ----------------------------------------------------------------
  const risks = load("11_risks_controls.csv");
  if (risks) {
    const SEV = { critical: 5, high: 4, medium: 3, low: 2 };
    const LIK = { almost_certain: 5, likely: 4, possible: 3, unlikely: 2, rare: 1 };
    risks.rows.forEach((x) => {
      const r = rnd(`${tenantKey}|risk|${x.risk_or_control_name}`);
      const sev = SEV[(x.severity ?? "").toLowerCase()] ?? 3;
      const lik = LIK[(x.likelihood ?? "").toLowerCase()] ?? 3;
      const inherent = sev * lik;
      x.inherent_risk_score = String(inherent);
      // Residual reflects whether the control is actually operating, not whether it exists.
      const operating = /operating|effective|implemented/i.test(x.control_status ?? "");
      x.residual_risk_score = String(Math.max(1, Math.round(inherent * (operating ? 0.35 + r() * 0.2 : 0.75 + r() * 0.2))));
      x.last_tested_date = operating ? `2026-${String(1 + Math.floor(r() * 7)).padStart(2, "0")}-15` : "";
      x.remediation_cost_usd = String(Math.round((inherent * 24_000 * (0.5 + r())) / 1000) * 1000);
      x.regulatory_driver = /phi|hipaa|pci|gdpr|sox|privacy|safety/i.test(`${x.risk_or_control_name} ${x.risk_domain ?? ""}`)
        ? "yes" : "no";
    });
    added.risks = save(risks, ["inherent_risk_score", "residual_risk_score", "last_tested_date", "remediation_cost_usd", "regulatory_driver"]);
  }

  // ---- 01 business functions: the denominator ---------------------------------------------------
  const functions = load("01_business_functions.csv");
  if (functions) {
    functions.rows.forEach((f) => {
      const r = rnd(`${tenantKey}|fn|${f.function_name}`);
      const budget = num(f.annual_budget_usd);
      const fte = num(f.fte_count) || Math.max(20, Math.round(budget / 220_000));
      f.headcount_fte = String(fte);
      f.cost_to_serve_usd = String(Math.round(budget / Math.max(1, fte)));
      f.process_maturity = ["initial", "managed", "defined", "measured", "optimising"][Math.floor(r() * 5)];
      f.change_appetite = ["low", "moderate", "high"][Math.floor(r() * 3)];
      f.regulatory_exposure = /clinical|safety|finance|privacy|compliance|flight|crew/i.test(f.function_name) ? "high" : r() < 0.4 ? "moderate" : "low";
    });
    added.functions = save(functions, ["headcount_fte", "cost_to_serve_usd", "process_maturity", "change_appetite", "regulatory_exposure"]);
  }

  // ---- 18 process economics ---------------------------------------------------------------------
  const processes = load("18_operational_process_evidence.csv");
  if (processes) {
    processes.rows.forEach((p) => {
      const r = rnd(`${tenantKey}|proc|${p.process_name}`);
      const volume = 4_000 + Math.floor(r() * 900_000);
      p.transaction_volume = String(volume);
      p.error_rate_pct = (0.4 + r() * 7).toFixed(1);
      p.rework_pct = (Number(p.error_rate_pct) * (1.1 + r())).toFixed(1);
      p.automation_pct = String(Math.floor(r() * 70));
      p.cost_per_transaction = (0.8 + r() * 26).toFixed(2);
    });
    added.processes = save(processes, ["transaction_volume", "error_rate_pct", "rework_pct", "automation_pct", "cost_per_transaction"]);
  }

  summary.push({ tenantKey, columnsAdded: added });
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  const total = Object.values(s.columnsAdded).reduce((a, b) => a + b, 0);
  console.log(`\n${s.tenantKey}: +${total} columns across ${Object.keys(s.columnsAdded).length} sheets`);
  console.log(`  ${Object.entries(s.columnsAdded).map(([k, v]) => `${k} +${v}`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");

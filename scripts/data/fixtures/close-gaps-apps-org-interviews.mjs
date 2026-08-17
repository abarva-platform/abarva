#!/usr/bin/env node
/**
 * Close the second round of intake gaps: applications, org structure, interviews.
 *
 * The first pass fixed the fields that blocked a surface outright. Reading the three richest sheets
 * column by column found a different class of gap — links that do not exist, and evidence that cannot
 * be weighed.
 *
 * **Applications had no contract reference.** Every row names a `vendor`, none names *which contract*.
 * So Source can rank vendors and read contract terms, and cannot answer "what are the terms on the
 * agreement covering this system" — the join that a renewal conversation actually runs on. Adding
 * `vendor` to the applications sheet looked like it had solved this and had not: a vendor name is not
 * a contract, and a supplier with four agreements has four different notice periods.
 *
 * **Org structure had no cost centre and no headcount.** It carries owned functions, systems and data
 * domains, which is genuinely good, and then cannot say how big an org unit is or what it costs. With
 * no `cost_center_code` there is no link from the organisation to spend at all, so "what does this
 * function cost to run" has no path through the model.
 *
 * **Interviews had no date.** Eight rows per tenant, no `interview_date`, no corroboration status, and
 * a paraphrase where a quote should be. Undated interview evidence presented as current is the
 * fastest way to lose a room, and one person's opinion carries the same weight in this schema as
 * three people independently agreeing. A paraphrase also cannot be attributed on a slide.
 *
 * Usage:
 *   node scripts/data/fixtures/close-gaps-apps-org-interviews.mjs [--write]
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
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const load = (f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return null;
    const rows = parseCsv(fs.readFileSync(p, "utf8"));
    const header = rows[0].map((h) => h.trim());
    return {
      path: p, header,
      rows: rows.slice(1).filter((r) => r.some((v) => v.trim()))
        .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()]))),
    };
  };
  const save = (t, extra) => {
    const header = [...t.header, ...extra.filter((c) => !t.header.includes(c))];
    if (WRITE) {
      fs.writeFileSync(t.path,
        [header.join(","), ...t.rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n");
    }
    return header.length - t.header.length;
  };

  const added = {};

  // ---- applications: the contract link, classification, and migration reality ------------------
  const apps = load("04_applications_systems.csv");
  const vendors = load("07_vendors_contracts.csv");
  if (apps) {
    // Contracts grouped by supplier, so an application resolves to a real agreement rather than to a
    // vendor name. A supplier with four agreements has four different notice periods, and picking the
    // wrong one produces confident, wrong renewal advice.
    const byVendor = new Map();
    for (const v of vendors?.rows ?? []) {
      const name = (v.vendor_name ?? "").trim();
      if (!name) continue;
      if (!byVendor.has(name)) byVendor.set(name, []);
      byVendor.get(name).push(v);
    }

    apps.rows.forEach((a) => {
      const r = rnd(`${tenantKey}|app2|${a.system_name}`);
      const vendorName = (a.vendor ?? "").trim();
      const candidates = byVendor.get(vendorName) ?? [];
      // Where a supplier has several agreements, prefer the one whose supported systems name this
      // application; fall back to the largest, which is the usual master agreement.
      const matched = candidates.find((c) => (c.supported_systems ?? "").includes(a.system_name))
        ?? candidates.slice().sort((x, y) => num(y.annual_spend_usd) - num(x.annual_spend_usd))[0];
      a.contract_ref = matched ? (matched.contract_name || matched.vendor_name) : "";
      a.contract_coverage = matched
        ? ((matched.supported_systems ?? "").includes(a.system_name) ? "named_in_contract" : "inferred_from_supplier")
        : vendorName ? "vendor_named_no_contract" : "internally_built";

      const domains = `${a.data_domains ?? ""} ${a.system_name} ${a.business_function ?? ""}`;
      a.data_classification = /patient|clinical|phi|member|claims|health/i.test(domains) ? "phi"
        : /payment|card|billing|revenue|payroll/i.test(domains) ? "pci"
          : /passenger|customer|loyalty|crew|employee|hr/i.test(domains) ? "pii"
            : /financial|ledger|treasury/i.test(domains) ? "financially_material"
              : "internal";
      a.compliance_scope = a.data_classification === "phi" ? "HIPAA"
        : a.data_classification === "pci" ? "PCI-DSS"
          : a.data_classification === "financially_material" ? "SOX"
            : a.data_classification === "pii" ? "GDPR/CCPA" : "none";

      a.integration_pattern = num(a.interfaces_count) === 0 ? "standalone"
        : pick(r, ["rest_api", "rest_api", "soap", "file_transfer", "database_link", "etl_batch", "event_stream"]);
      a.authentication_method = /saas|cloud/i.test(a.deployment_model ?? "")
        ? pick(r, ["sso_saml", "sso_saml", "sso_oidc"])
        : pick(r, ["sso_saml", "ldap_direct", "local_accounts", "local_accounts"]);
      // Entitlements sit above active users. The gap is shelfware and it is one of the few savings
      // lines a client can act on without renegotiating anything.
      const users = num(a.user_count);
      a.license_model = /saas|cloud/i.test(a.deployment_model ?? "") ? "per_user_subscription"
        : pick(r, ["perpetual_plus_maintenance", "capacity_based", "enterprise_agreement"]);
      a.entitlement_count = a.license_model === "per_user_subscription"
        ? String(Math.round(users * (1.05 + r() * 0.45))) : "";
      const tier = (a.criticality ?? "").toLowerCase();
      a.rto_hours = String(tier === "tier1" ? 1 : tier === "tier2" ? 8 : 48);
      a.rpo_hours = String(tier === "tier1" ? 0.25 : tier === "tier2" ? 4 : 24);
    });
    added.applications = save(apps, [
      "contract_ref", "contract_coverage", "data_classification", "compliance_scope",
      "integration_pattern", "authentication_method", "license_model", "entitlement_count",
      "rto_hours", "rpo_hours",
    ]);
  }

  // ---- org structure: size, money, and the link to spend ---------------------------------------
  const org = load("02_org_ownership.csv");
  const spend = load("08_spend_value.csv");
  const functions = load("01_business_functions.csv");
  if (org) {
    const fnBudget = new Map(
      (functions?.rows ?? []).map((f) => [f.function_name, num(f.annual_budget_usd)]),
    );
    const centres = (spend?.rows ?? []).map((s) => s.cost_center_or_owner).filter(Boolean);

    org.rows.forEach((o, i) => {
      const r = rnd(`${tenantKey}|org|${o.org_unit}`);
      const level = (o.role_level ?? "").toLowerCase();
      // Headcount and authority both scale with level. Without them an org unit is a label: you
      // cannot size a decision, route an approval, or say what a function costs to run.
      const scale = /chief|c-suite|executive|ceo|cfo|coo|cio/.test(level) ? 3
        : /svp|evp|vp/.test(level) ? 2 : /director|head/.test(level) ? 1 : 0;
      o.headcount = String([12, 60, 340, 1400][scale] + Math.floor(r() * [10, 50, 260, 900][scale]));
      o.budget_authority_usd = String([250_000, 2_000_000, 15_000_000, 75_000_000][scale]);
      o.span_of_control = String([3, 7, 12, 9][scale] + Math.floor(r() * 5));
      o.tenure_months = String(6 + Math.floor(r() * 90));
      // Key-person dependency: long tenure plus wide ownership plus no named deputy is the pattern
      // that stalls a programme when someone leaves.
      const owns = (o.owned_systems ?? "").split(/[;,]/).filter(Boolean).length;
      o.succession_risk = owns > 6 && Number(o.tenure_months) > 60 ? "high" : owns > 3 ? "medium" : "low";
      // The missing link. With no cost centre there is no path from the organisation to spend, so
      // "what does this org unit cost" cannot be answered from the model at all.
      const owned = (o.owned_functions ?? "").split(/[;,]/)[0]?.trim();
      o.cost_center_code = `CC-${String(1000 + i)}`;
      o.cost_center_name = centres.length ? centres[i % centres.length] : owned || "Shared Services";
      o.attributed_function_budget_usd = String(fnBudget.get(owned) ?? 0);
    });
    added.org_ownership = save(org, [
      "headcount", "budget_authority_usd", "span_of_control", "tenure_months",
      "succession_risk", "cost_center_code", "cost_center_name", "attributed_function_budget_usd",
    ]);
  }

  // ---- interviews: date them, quote them, corroborate them -------------------------------------
  const interviews = load("SA10_AI_Value_Interview_Evidence.csv");
  if (interviews) {
    // Corroboration is counted across the set rather than asserted per row: a claim two other
    // stakeholders independently made is a finding, and a claim only one person made is an opinion.
    // The schema previously gave both the same weight.
    const themeCount = new Map();
    for (const x of interviews.rows) {
      const theme = (x.what_is_not_working ?? "").slice(0, 40).toLowerCase();
      if (theme) themeCount.set(theme, (themeCount.get(theme) ?? 0) + 1);
    }

    interviews.rows.forEach((x, i) => {
      const r = rnd(`${tenantKey}|int|${x.source_record_id ?? i}`);
      const day = 1 + Math.floor(r() * 27);
      const month = 3 + Math.floor(r() * 4);
      x.interview_date = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      x.interview_format = pick(r, ["one_to_one", "one_to_one", "small_group", "workshop"]);
      x.interview_duration_minutes = String(pick(r, [30, 45, 45, 60, 90]));
      // A paraphrase cannot be attributed on a slide. A quote can, which is why consent is asked
      // for separately rather than assumed.
      x.verbatim_quote = x.what_is_not_working
        ? `"${x.what_is_not_working.replace(/"/g, "'").slice(0, 180)}"`
        : "";
      x.consent_to_attribute = r() < 0.55 ? "named" : r() < 0.85 ? "role_only" : "anonymous";
      const theme = (x.what_is_not_working ?? "").slice(0, 40).toLowerCase();
      const corroborators = Math.max(0, (themeCount.get(theme) ?? 1) - 1);
      x.corroboration_count = String(corroborators);
      x.corroboration_status = corroborators >= 2 ? "corroborated_multi_source"
        : corroborators === 1 ? "corroborated_single_source" : "uncorroborated_opinion";
      x.sentiment = /not working|gap|slow|manual|risk|fail|delay/i.test(x.what_is_not_working ?? "")
        ? "negative" : /working|good|fast|improve/i.test(x.what_is_working ?? "") ? "positive" : "neutral";
      // When an interview contradicts a system fact, that contradiction is the finding — not noise to
      // be reconciled away.
      x.contradicts_record = r() < 0.18 ? "yes_conflicts_with_system_data" : "no_conflict_identified";
      x.theme_tags = [
        /data|report/i.test(x.answer_summary ?? "") ? "data_quality" : null,
        /manual|effort|time/i.test(x.answer_summary ?? "") ? "manual_effort" : null,
        /vendor|supplier|contract/i.test(x.answer_summary ?? "") ? "vendor_dependency" : null,
        /skill|train|capab/i.test(x.answer_summary ?? "") ? "capability_gap" : null,
      ].filter(Boolean).join("; ");
      x.evidence_staleness_days = String(
        Math.max(0, Math.round((new Date("2026-08-17") - new Date(x.interview_date)) / 86_400_000)),
      );
    });
    added.interviews = save(interviews, [
      "interview_date", "interview_format", "interview_duration_minutes", "verbatim_quote",
      "consent_to_attribute", "corroboration_count", "corroboration_status", "sentiment",
      "contradicts_record", "theme_tags", "evidence_staleness_days",
    ]);
  }

  summary.push({ tenantKey, columnsAdded: added });
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  const total = Object.values(s.columnsAdded).reduce((a, b) => a + b, 0);
  console.log(`\n${s.tenantKey}: +${total} columns`);
  console.log(`  ${Object.entries(s.columnsAdded).map(([k, v]) => `${k} +${v}`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");

// Source adapter for a lab tenant whose intake uses the union/EAV schema.
//
// WHY THIS IS A SEPARATE ADAPTER AND NOT A FLAG
//
// The two lab tenants do not merely differ in column names. One is wide, one
// per domain, and every populated cell is an assertable fact. The other is a
// single union schema where MOST rows are explicitly not assertable, and says so
// in its own columns: additive_status, value_claim_status, tower_claim_allowed,
// legacy_row_flag, forbidden_claims.
//
// Harvesting numerics from it the way the wide adapter does would build a ledger
// out of figures the corpus explicitly forbids claiming — 228 of its 298 spend
// rows are narrative hypotheses marked excluded_from_budget_rollup, and summing
// them would produce an authoritative-looking total that the source data says is
// not a total. That is not a parsing bug; it is asserting something the client
// told us not to assert.
//
// So the governance columns drive the adapter:
//
//   additive_budget_fact              → a figure, and summable
//   program_budget_view_non_additive  → a figure, NEVER summed with the above
//   not_claimable / tower_claim_allowed=false → a STATEMENT, and no figure
//   legacy_row_flag=true              → context only
//   forbidden_claims                  → explicit prohibitions, carried forward
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv.mjs";

const TENANT = process.env.PROOF_TENANT ?? "meridian-health";
const ROOT = path.resolve(
  process.env.PROOF_DATA_ROOT ??
    "/Users/anand/Projects/nexus/datasets/tenant-inputs/active",
  TENANT,
  "current",
);

const read = (f) => {
  const p = path.join(ROOT, `${f}.csv`);
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : [];
};
const NOT_A_VALUE = new Set(["", "0", "not_provided", "not_applicable", "none", "false"]);
const val = (v) => {
  const s = String(v ?? "").trim();
  return NOT_A_VALUE.has(s.toLowerCase()) ? null : s;
};
const num = (v) => {
  const s = val(v);
  if (!s) return null;
  const m = s.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
const usd = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString("en-US")}`;

const evidence = [];
const ledger = [];
const forbidden = new Set();
let cite = 0;

function add({ label, statement, family, confidence = "medium", asOf = "FY2026", figures = [] }) {
  if (!statement || statement.length < 30) return null;
  cite += 1;
  evidence.push({
    citationNumber: cite,
    label: label.slice(0, 120),
    statement,
    evidenceFamily: family,
    confidence,
    asOf,
    disclosureTier: "internal_only",
    provenanceRef: `${TENANT}/current/${family}#${cite}`,
  });
  for (const f of figures) {
    ledger.push({
      figureId: `F${createHash("sha256").update(`${f.label}|${f.unit}|${f.value}`).digest("hex").slice(0, 8)}`,
      value: f.value,
      unit: f.unit,
      label: f.label,
      formattedVariants: f.variants,
      citationNumber: cite,
      sourceRef: `${TENANT}/current/${family}`,
      additive: f.additive ?? false,
    });
  }
  return cite;
}

const money = (n, label, additive = false) => ({
  value: n,
  unit: "usd",
  label,
  additive,
  variants: [
    String(n),
    n.toLocaleString("en-US"),
    usd(n),
    `$${(n / 1e6).toFixed(1)}M`,
    `$${(n / 1e6).toFixed(0)}M`,
    `$${(n / 1e9).toFixed(2)}B`,
    `$${(n / 1e9).toFixed(1)}B`,
  ],
});
const count = (n, label) => ({ value: n, unit: "count", label, variants: [String(n), n.toLocaleString("en-US")] });
const metric = (n, label, raw) => ({ value: n, unit: "metric", label, variants: [raw, String(n), `${n}%`] });

const collectForbidden = (rows) => {
  for (const r of rows) {
    for (const c of String(r.forbidden_claims ?? "").split(";")) {
      const t = c.trim();
      if (t.length > 8) forbidden.add(t);
    }
  }
};

// ── 1 · enterprise profile ────────────────────────────────────────────────────
const profile = read("00_enterprise_profile");
const entityName = profile[0]?.business_name ?? "Meridian Health";
for (const r of profile.slice(0, 12)) {
  const parts = Object.entries(r)
    .filter(([k, v]) => val(v) && !/^(tenant_key|record_id|entity_id|dimension|evidence_id|source_|synthetic_|legacy_|module_usage|active_candidate)/.test(k))
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
  add({
    label: `Enterprise context — ${r.context_item ?? r.business_name}`,
    statement: parts.join(" · "),
    family: "enterprise_profile",
    confidence: r.confidence || "high",
  });
}

// ── 2 · attested FY26 budget — the only summable money in this corpus ─────────
const spend = read("08_it_budget_spend_value");
collectForbidden(spend);
const attested = spend.filter((r) => r.additive_status === "additive_budget_fact");
const totalApproved = attested.reduce((s, r) => s + (num(r.approved_budget_usd) ?? 0), 0);
const totalActual = attested.reduce((s, r) => s + (num(r.actual_spend_ytd_usd) ?? 0), 0);
add({
  label: "FY26 attested technology budget",
  statement:
    `${attested.length} finance-attested FY26 budget lines total ${usd(totalApproved)} of approved budget, with ` +
    `${usd(totalActual)} of actual spend year to date. These are the only additive budget facts in the governed set; ` +
    `${spend.length - attested.length} further spend rows are narrative value hypotheses explicitly excluded from the budget rollup and must not be summed with them.`,
  family: "budget_baseline",
  confidence: "high",
  figures: [
    money(totalApproved, "FY26 approved technology budget", true),
    money(totalActual, "FY26 actual spend year to date", true),
    count(attested.length, "attested FY26 budget lines"),
  ],
});
for (const r of attested.sort((a, b) => (num(b.approved_budget_usd) ?? 0) - (num(a.approved_budget_usd) ?? 0)).slice(0, 26)) {
  const approved = num(r.approved_budget_usd);
  const actual = num(r.actual_spend_ytd_usd);
  const runB = num(r.run_budget_usd);
  const changeB = num(r.change_budget_usd);
  add({
    label: `Budget line — ${r.business_name}`,
    statement: [
      `${r.business_name} (${r.fiscal_year ?? "FY26"}, ${r.budget_row_level ?? "budget fact"}):`,
      approved ? `approved ${usd(approved)}` : null,
      actual ? `actual YTD ${usd(actual)}` : null,
      runB ? `run ${usd(runB)}` : null,
      changeB ? `change ${usd(changeB)}` : null,
      val(r.vendor_name) ? `vendors: ${r.vendor_name}` : null,
      val(r.system_name) ? `systems: ${r.system_name}` : null,
      val(r.amount_basis) ? `basis: ${r.amount_basis}` : null,
      val(r.caveat) ? `caveat: ${r.caveat}` : null,
    ].filter(Boolean).join(" · "),
    family: "budget_baseline",
    confidence: "high",
    figures: [
      ...(approved ? [money(approved, `${r.business_name} approved budget`, true)] : []),
      ...(actual ? [money(actual, `${r.business_name} actual YTD`, true)] : []),
      ...(runB ? [money(runB, `${r.business_name} run budget`, true)] : []),
      ...(changeB ? [money(changeB, `${r.business_name} change budget`, true)] : []),
    ],
  });
}

// ── 3 · application estate ────────────────────────────────────────────────────
const apps = read("04_applications_systems");
const byCrit = {};
const byLife = {};
for (const a of apps) {
  if (val(a.criticality)) byCrit[a.criticality] = (byCrit[a.criticality] ?? 0) + 1;
  if (val(a.lifecycle_status)) byLife[a.lifecycle_status] = (byLife[a.lifecycle_status] ?? 0) + 1;
}
add({
  label: "Application estate",
  statement:
    `The governed application inventory holds ${apps.length} systems. Criticality: ` +
    `${Object.entries(byCrit).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}. ` +
    `Lifecycle: ${Object.entries(byLife).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
  family: "application_portfolio",
  confidence: "high",
  figures: [
    count(apps.length, "applications in the governed inventory"),
    ...Object.entries(byCrit).map(([k, v]) => count(v, `applications of criticality ${k}`)),
    ...Object.entries(byLife).map(([k, v]) => count(v, `applications in lifecycle ${k}`)),
  ],
});
for (const a of apps.filter((x) => x.criticality === "critical").slice(0, 22)) {
  add({
    label: `System — ${a.business_name}`,
    statement: [
      `${a.business_name} (${a.capability ?? "capability not stated"}, owner ${a.owner ?? "unstated"}, ${a.lifecycle_status ?? "lifecycle unstated"}):`,
      val(a.integrations) ? `integrations: ${a.integrations}` : null,
      val(a.data_dependencies) ? `data dependencies: ${a.data_dependencies}` : null,
      val(a.vendor_id) ? `vendor: ${a.vendor_id}` : null,
    ].filter(Boolean).join(" · "),
    family: "application_portfolio",
    confidence: a.confidence || "high",
  });
}

// ── 4 · vendors ───────────────────────────────────────────────────────────────
const vendors = read("07_vendors_contracts");
collectForbidden(vendors);
const priced = vendors.filter((v) => num(v.annual_contract_value_usd));
add({
  label: "Vendor estate and its commercial visibility",
  statement:
    `${vendors.length} governed vendor records exist, but only ${priced.length} carry an annual contract value. ` +
    `Commercial terms for the remainder are not loaded, so contract economics cannot be asserted for them.`,
  family: "vendor_contracts",
  confidence: "high",
  figures: [count(vendors.length, "governed vendor records"), count(priced.length, "vendors with a contract value")],
});
for (const v of priced) {
  const acv = num(v.annual_contract_value_usd);
  add({
    label: `Vendor — ${v.business_name}`,
    statement: [
      `${v.business_name} (${v.service ?? "service unstated"}, owned by ${v.owning_function ?? "unstated"}): annual contract value ${usd(acv)}.`,
      val(v.contract_risk) ? `Contract risk: ${v.contract_risk}` : null,
      val(v.pricing_basis) ? `Pricing basis: ${v.pricing_basis}` : null,
    ].filter(Boolean).join(" "),
    family: "vendor_contracts",
    confidence: "high",
    figures: [money(acv, `${v.business_name} annual contract value`, false)],
  });
}
for (const v of vendors.filter((x) => !num(x.annual_contract_value_usd) && val(x.contract_risk)).slice(0, 18)) {
  add({
    label: `Vendor risk — ${v.business_name}`,
    statement: `${v.business_name} (${v.service ?? "service unstated"}, ${v.owning_function ?? "owner unstated"}): ${v.contract_risk}. Pricing basis: ${v.pricing_basis ?? "not loaded"}.`,
    family: "vendor_contracts",
  });
}

// ── 5 · programmes — a non-additive view, and labelled as one ─────────────────
const programs = read("09_programs_initiatives");
collectForbidden(programs);
const funded = programs.filter((p) => num(p.approved_funding_usd));
if (funded.length) {
  add({
    label: "Programme funding view",
    statement:
      `${funded.length} programmes carry approved funding. This is a programme VIEW of spend and is marked ` +
      `non-additive in the governed set: it must not be summed with the FY26 budget lines, because the same money ` +
      `appears in both.`,
    family: "programs",
    confidence: "high",
    figures: [count(funded.length, "programmes with approved funding")],
  });
  for (const p of funded) {
    const approvedF = num(p.approved_funding_usd);
    add({
      label: `Programme — ${p.business_name}`,
      statement: [
        `${p.business_name} (${p.program_code ?? "code unstated"}, status ${p.initiative_status ?? "unstated"}):`,
        `approved funding ${usd(approvedF)}`,
        num(p.actual_spend_ytd_usd) ? `actual YTD ${usd(num(p.actual_spend_ytd_usd))}` : null,
        val(p.executive_owner) ? `executive owner ${p.executive_owner}` : null,
        `value claim status: ${p.value_claim_status ?? "unstated"}`,
        val(p.caveat) ? `caveat: ${p.caveat}` : null,
      ].filter(Boolean).join(" · "),
      family: "programs",
      confidence: "high",
      figures: [money(approvedF, `${p.business_name} approved funding`, false)],
    });
  }
}

// ── 6 · metrics — almost all not claimable, and that IS the finding ───────────
const metrics = read("14_metrics_outcomes");
collectForbidden(metrics);
const claimable = metrics.filter((m) => num(m.baseline_value) !== null || num(m.target_value) !== null);
const notClaimable = metrics.filter((m) => (m.value_claim_status ?? "").startsWith("not_claimable"));
add({
  label: "Measurement readiness",
  statement:
    `${metrics.length} outcome/metric rows exist, of which ${notClaimable.length} are marked not claimable — no baseline, ` +
    `no actual, or no attested owner. Only ${claimable.length} carry a baseline or a target. Benefit claims cannot be made ` +
    `against the remainder without establishing a baseline first.`,
  family: "operating_metrics",
  confidence: "high",
  figures: [
    count(metrics.length, "outcome and metric rows"),
    count(notClaimable.length, "metric rows not claimable"),
    count(claimable.length, "metric rows with a baseline or target"),
  ],
});
for (const m of claimable) {
  const bv = num(m.baseline_value);
  const tv = num(m.target_value);
  add({
    label: `Metric — ${m.business_name}`,
    statement: [
      `${m.business_name}:`,
      bv !== null ? `baseline ${m.baseline_value}` : "no baseline",
      tv !== null ? `target ${m.target_value}` : "no target",
      val(m.measurement_owner) ? `owner ${m.measurement_owner}` : null,
      val(m.measurement_cadence) ? `cadence ${m.measurement_cadence}` : null,
      val(m.source_system) ? `source ${m.source_system}` : null,
      `claim status: ${m.value_claim_status ?? "unstated"}`,
    ].filter(Boolean).join(" · "),
    family: "operating_metrics",
    confidence: m.confidence || "medium",
    figures: [
      ...(bv !== null ? [metric(bv, `${m.business_name} baseline`, m.baseline_value)] : []),
      ...(tv !== null ? [metric(tv, `${m.business_name} target`, m.target_value)] : []),
    ],
  });
}

// ── 7 · risks and gaps — the deepest part of this corpus ──────────────────────
const risks = read("11_risks_controls");
collectForbidden(risks);
const seenGap = new Set();
for (const r of risks) {
  const gap = val(r.risk_or_gap);
  if (!gap || seenGap.has(gap)) continue;
  seenGap.add(gap);
  if (seenGap.size > 30) break;
  add({
    label: `Gap — ${gap}`,
    statement: [
      `${gap}.`,
      val(r.use_case) ? `Affects: ${r.use_case}.` : null,
      val(r.affected_systems) ? `Systems: ${r.affected_systems}.` : null,
      val(r.evidence_needed) ? `Evidence needed: ${r.evidence_needed}.` : null,
      val(r.metric_boundary) ? `Boundary: ${r.metric_boundary}.` : null,
    ].filter(Boolean).join(" "),
    family: "risk_controls",
    confidence: r.confidence || "medium",
  });
}

// ── 8 · AI use cases and infrastructure ───────────────────────────────────────
const ai = read("10_ai_automation_use_cases");
collectForbidden(ai);
const seenAi = new Set();
for (const u of ai) {
  const key = val(u.use_case) ?? val(u.business_name);
  if (!key || seenAi.has(key)) continue;
  seenAi.add(key);
  if (seenAi.size > 18) break;
  add({
    label: `AI use case — ${key}`,
    statement: [
      `${key}:`,
      val(u.value_hypothesis) ? `value hypothesis — ${u.value_hypothesis}` : null,
      val(u.systems) ? `systems: ${u.systems}` : null,
      val(u.data_domain) ? `data domain: ${u.data_domain}` : null,
      val(u.evidence_needed) ? `evidence needed: ${u.evidence_needed}` : null,
    ].filter(Boolean).join(" · "),
    family: "ai_use_cases",
  });
}
const infra = read("06_infrastructure_platforms");
for (const i of infra.slice(0, 16)) {
  add({
    label: `Platform — ${i.business_name}`,
    statement: Object.entries(i)
      .filter(([k, v]) => val(v) && !/^(tenant_key|record_id|entity_id|dimension|evidence_id|source_|synthetic_|legacy_|module_usage|active_candidate|confidence)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "infrastructure",
  });
}

// ── 10 · the real initiative: the AI benefit/usage ledger ────────────────────
//
// The decision context below is NOT authored. It is the corpus's own initiative:
// programme PROG-CONTACT-KNOW, its funded and actual spend, its promised value,
// its finance-validated value, its adoption against target, and the four named
// evidence gaps that the governed set says block it from being decision-grade.
//
// An earlier version of this adapter invented a decision ("measurement
// readiness") and framed the whole artifact around it. The initiative was in the
// data the whole time. An artifact framed on a decision nobody is taking is not
// a governed artifact, whatever its citations say.
const benefits = read("SA08_AI_Benefits_Realization_Usage_Ledger");
const usage = read("SA09_AI_Tool_Usage_Feed");
const aiInterviews = read("SA10_AI_Value_Interview_Evidence");
const PROGRAM = "PROG-CONTACT-KNOW";

const portfolioFunded = benefits.reduce((s2, r) => s2 + (num(r.funded_spend_usd) ?? 0), 0);
const portfolioPromised = benefits.reduce((s2, r) => s2 + (num(r.promised_value_usd) ?? 0), 0);
const portfolioValidated = benefits.reduce((s2, r) => s2 + (num(r.finance_validated_value_usd) ?? 0), 0);
add({
  label: "AI portfolio — funded, promised, and validated",
  statement:
    `${benefits.length} AI programmes carry ${usd(portfolioFunded)} of funded spend against ${usd(portfolioPromised)} of promised value, ` +
    `of which ${usd(portfolioValidated)} has been finance-validated. Every row in this ledger is marked a non-additive lens: it is a view ` +
    `across programmes and must not be added to the FY26 budget lines, because the same money appears in both.`,
  family: "ai_portfolio",
  confidence: "high",
  figures: [
    count(benefits.length, "AI programmes in the benefits ledger"),
    money(portfolioFunded, "AI portfolio funded spend", false),
    money(portfolioPromised, "AI portfolio promised value", false),
    money(portfolioValidated, "AI portfolio finance-validated value", false),
  ],
});
for (const r of benefits) {
  const funded = num(r.funded_spend_usd) ?? 0;
  const ytd = num(r.actual_spend_ytd_usd) ?? 0;
  const promised = num(r.promised_value_usd) ?? 0;
  const validated = num(r.finance_validated_value_usd) ?? 0;
  const adoption = num(r.adoption_rate_pct);
  add({
    label: `AI programme — ${r.program_name}`,
    statement: [
      `${r.program_name} (${r.ai_program_id}, ${r.vendor_name ?? "vendor unstated"}, tool ${r.tool_name ?? "unstated"}):`,
      `funded ${usd(funded)}`,
      `actual YTD ${usd(ytd)}`,
      `promised value ${usd(promised)}`,
      `finance-validated ${usd(validated)}`,
      adoption !== null ? `adoption ${adoption}% of ${r.enabled_users ?? "?"} enabled users` : null,
      `claim status ${r.value_claim_status ?? "unstated"}`,
      `finance validation ${r.finance_validation_status ?? "unstated"}`,
      val(r.baseline_value) ? `baseline: ${r.baseline_value}` : null,
      val(r.target_value) ? `target: ${r.target_value}` : null,
      val(r.decision_action) ? `decision action: ${r.decision_action}` : null,
      val(r.caveat) ? `caveat: ${r.caveat}` : null,
    ].filter(Boolean).join(" · "),
    family: r.ai_program_id === PROGRAM ? "focus_initiative" : "ai_portfolio",
    confidence: "high",
    figures: [
      ...(funded ? [money(funded, `${r.program_name} funded spend`, false)] : []),
      ...(ytd ? [money(ytd, `${r.program_name} actual spend YTD`, false)] : []),
      ...(promised ? [money(promised, `${r.program_name} promised value`, false)] : []),
      ...(validated ? [money(validated, `${r.program_name} finance-validated value`, false)] : []),
      ...(adoption !== null ? [metric(adoption, `${r.program_name} adoption rate`, `${adoption}%`)] : []),
    ],
  });
}

for (const u of usage.filter((r) => r.ai_program_id === PROGRAM)) {
  add({
    label: `Adoption telemetry — ${u.tool_name}`,
    statement: [
      `${u.tool_name} (${u.vendor_name}, ${u.tool_category}) over ${u.usage_period_start} to ${u.usage_period_end}:`,
      `${u.licensed_users} licensed, ${u.enabled_users} enabled, ${u.active_users} active, ${u.power_users} power users`,
      `${u.usage_events} usage events`,
      `usage rate ${u.usage_rate_pct}% against an adoption target of ${u.adoption_target_pct}% — a gap of ${u.adoption_gap_pct} points`,
      `baseline metric ${u.baseline_metric_name}: ${u.baseline_metric_value}`,
      `business owner ${u.business_owner}, finance validator ${u.finance_validator}`,
      val(u.notes) ? `note: ${u.notes}` : null,
    ].filter(Boolean).join(" · "),
    family: "focus_initiative",
    confidence: "high",
    asOf: `${u.usage_period_start} to ${u.usage_period_end}`,
    figures: [
      ...(num(u.licensed_users) ? [count(num(u.licensed_users), "Agent Assist licensed users")] : []),
      ...(num(u.enabled_users) ? [count(num(u.enabled_users), "Agent Assist enabled users")] : []),
      ...(num(u.active_users) ? [count(num(u.active_users), "Agent Assist active users")] : []),
      ...(num(u.power_users) ? [count(num(u.power_users), "Agent Assist power users")] : []),
      ...(num(u.usage_events) ? [count(num(u.usage_events), "Agent Assist usage events in the quarter")] : []),
      ...(num(u.usage_rate_pct) !== null ? [metric(num(u.usage_rate_pct), "Agent Assist usage rate", `${u.usage_rate_pct}%`)] : []),
      ...(num(u.adoption_target_pct) !== null ? [metric(num(u.adoption_target_pct), "Agent Assist adoption target", `${u.adoption_target_pct}%`)] : []),
      ...(num(u.adoption_gap_pct) !== null ? [metric(num(u.adoption_gap_pct), "Agent Assist adoption gap", `${u.adoption_gap_pct}`)] : []),
    ],
  });
}

for (const i of aiInterviews.filter((r) => r.ai_program_id === PROGRAM)) {
  add({
    label: `Owner interview — ${i.stakeholder_role}`,
    statement: [
      `${i.stakeholder_role} asked "${i.question}":`,
      i.answer_summary,
      val(i.what_is_working) ? `Working: ${i.what_is_working}` : null,
      val(i.what_is_not_working) ? `Not working: ${i.what_is_not_working}` : null,
      val(i.evidence_request) ? `Evidence requested: ${i.evidence_request}` : null,
      val(i.follow_up_artifact_needed) ? `Artifacts needed: ${i.follow_up_artifact_needed}` : null,
      val(i.named_owner) ? `Named owner: ${i.named_owner}` : null,
    ].filter(Boolean).join(" "),
    family: "focus_initiative",
    confidence: "high",
  });
}

// ── 11 · the four gaps that block decision-grade, and who is blocked by each ──
const sources = read("13_evidence_sources");
const CC = /call center optimization|contact center platform/i;
const blockers = new Map();
for (const r of sources) {
  const t = val(r.context_item);
  if (!t || !CC.test(t)) continue;
  const m = t.match(/^(.+?)\s+says\s+.*?evidence closes:\s*(.+?)\.\s/);
  if (!m) continue;
  const [, role, gap] = m;
  if (!blockers.has(gap)) blockers.set(gap, new Set());
  blockers.get(gap).add(role.trim());
}
if (blockers.size) {
  const roles = new Set([...blockers.values()].flatMap((s2) => [...s2]));
  add({
    label: "Why the contact-centre case is not decision-grade",
    statement:
      `${roles.size} named stakeholder roles describe call centre optimisation as promising but not decision-grade, and each names ` +
      `one of ${blockers.size} specific evidence gaps as the blocker: ` +
      [...blockers.entries()].map(([gap, r]) => `${gap} (${r.size} roles)`).join("; ") + ".",
    family: "focus_initiative",
    confidence: "high",
    figures: [count(roles.size, "stakeholder roles blocking decision-grade"), count(blockers.size, "named evidence gaps")],
  });
  for (const [gap, r] of blockers) {
    add({
      label: `Blocking gap — ${gap}`,
      statement: `${gap}. Named as the blocking condition by: ${[...r].sort().join("; ")}.`,
      family: "focus_initiative",
      confidence: "high",
      figures: [count(r.size, `roles blocked by "${gap}"`)],
    });
  }
}

const ccUse = read("10_ai_automation_use_cases").find((r) => (r.use_case ?? "") === "Call center optimization" && val(r.value_hypothesis));
if (ccUse) {
  add({
    label: "Approved value hypothesis — call centre optimisation",
    statement:
      `The governed value hypothesis reads: "${ccUse.value_hypothesis}" It names the systems in scope as ${ccUse.systems}, ` +
      `the data domain as ${ccUse.data_domain}, and the evidence still needed as: ${ccUse.evidence_needed}.`,
    family: "focus_initiative",
    confidence: "high",
  });
}

// ── 12 · supplemental current-state intake (the P2 upload under test) ────────
//
// Loaded only when PROOF_UPLOAD is set, so the pre-upload run stays intact as
// the control. The package declares in its own gap-coverage tab which gaps it
// fills and which stay open, and that declaration is the smoke's expected
// result — not a judgement I make afterwards about whether the deck looks
// better.
//
// Every figure it carries is a synthetic PLANNING figure. The package says so on
// every row and repeats it as a prohibition. Registering these in the ledger
// makes them assertable; it does not make them measured, and the deck must not
// present them as actuals.
// Resolved against THIS repo, not against PROOF_DATA_ROOT. The canonical packet
// is read from wherever the tenant data lives; the supplemental package is
// checked in beside the adapter, and conflating the two silently disabled the
// upload while still reporting a successful build.
const UPLOAD_DIR = path.resolve(
  process.env.PROOF_UPLOAD_DIR ??
    path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../datasets/tenant-inputs/active/meridian-health/supplemental/contact-center-current-state-v2",
    ),
);
const uploadWanted = process.env.PROOF_UPLOAD === "1";
const uploadEnabled = uploadWanted && fs.existsSync(UPLOAD_DIR);
// Asking for the upload and silently not getting it would make the treatment run
// an expensive duplicate of the control, and the smoke would report "no change"
// as a finding about the pipeline rather than about the path.
if (uploadWanted && !uploadEnabled) {
  throw new Error(`PROOF_UPLOAD=1 but no package at ${UPLOAD_DIR}`);
}
/** Instrumented facts the trace harness follows to the rendered file. */
const uploadedFacts = [];

if (uploadEnabled) {
  const tab = (f) => {
    const p2 = path.join(UPLOAD_DIR, `${f}.csv`);
    return fs.existsSync(p2) ? parseCsv(fs.readFileSync(p2, "utf8")) : [];
  };
  // Executive prose spells small numbers out. The deck said "Seven of the nine
  // systems in the contact flow carry unvalidated API readiness" and the trace
  // reported the fact as never having reached the bundle, because every variant
  // was a digit. An instrument that only reads digits cannot measure a document
  // written by people.
  const WORDS = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
    "eighteen", "nineteen", "twenty",
  ];
  const withWords = (value, variants) =>
    Number.isInteger(value) && value >= 0 && value <= 20
      ? [...variants, WORDS[value], `${WORDS[value]} of`]
      : variants;
  const track = (factId, label, value, variants, tab_, expectation) => {
    uploadedFacts.push({ factId, label, value, variants: withWords(value, variants), tab: tab_, expectation });
  };

  // 05 · KPI baselines — the gap the corpus names most often
  const kpis = tab("05_KPI_Baseline");
  add({
    label: "Uploaded KPI baselines — contact centre",
    statement:
      `A supplemental current-state intake supplies ${kpis.length} contact-centre KPI baselines: ` +
      kpis.map((k) => `${k.kpi} ${k.value} ${k.unit} (${k.measurement_basis})`).join("; ") +
      `. Every one is a synthetic planning figure, not a measured actual, and the package states that on each row.`,
    family: "uploaded_current_state",
    confidence: "medium",
    figures: kpis.map((k) => {
      const v = num(k.value);
      track(`kpi:${k.kpi}`, k.kpi, v, [String(v), `${v}%`, `${v} ${k.unit}`], "05_KPI_Baseline", "represented");
      return metric(v, `${k.kpi} baseline (uploaded, planning figure)`, `${k.value} ${k.unit}`);
    }),
  });

  // 04 · contact volumes
  const volumes = tab("04_Contact_Volumes");
  const totalContacts = volumes.reduce((a, v) => a + (num(v.annual_contacts) ?? 0), 0);
  track("volume:total", "total annual contacts", totalContacts, [String(totalContacts), totalContacts.toLocaleString("en-US"), `${(totalContacts / 1e6).toFixed(1)}M`, `${(totalContacts / 1e6).toFixed(2)}M`], "04_Contact_Volumes", "represented");
  add({
    label: "Uploaded contact volumes",
    statement:
      `${volumes.length} contact channels carry ${totalContacts.toLocaleString("en-US")} annual contacts: ` +
      volumes.map((v) => `${v.channel} ${Number(v.annual_contacts).toLocaleString("en-US")} (${v.live_agent_share} live agent, system of record ${v.system_of_record}; drivers: ${v.principal_drivers})`).join("; ") + ".",
    family: "uploaded_current_state",
    confidence: "medium",
    figures: [
      count(totalContacts, "total annual contacts (uploaded)"),
      ...volumes.map((v) => {
        const n = num(v.annual_contacts);
        track(`volume:${v.channel}`, v.channel, n, [String(n), n.toLocaleString("en-US")], "04_Contact_Volumes", "optional");
        return count(n, `${v.channel} annual contacts (uploaded)`);
      }),
    ],
  });

  // 06 · workforce
  const workforce = tab("06_Workforce_And_Sites");
  const headcount = workforce.reduce((a, w) => a + (num(w.headcount) ?? 0), 0);
  const productive = workforce.reduce((a, w) => a + (num(w.productive_fte) ?? 0), 0);
  track("workforce:headcount", "contact-centre headcount", headcount, [String(headcount), headcount.toLocaleString("en-US")], "06_Workforce_And_Sites", "represented");
  track("workforce:productive", "productive FTE", productive, [String(productive), productive.toLocaleString("en-US")], "06_Workforce_And_Sites", "optional");
  add({
    label: "Uploaded workforce and sites",
    statement:
      `${headcount.toLocaleString("en-US")} contact-centre headcount and ${productive.toLocaleString("en-US")} productive FTE across ` +
      `${new Set(workforce.map((w) => w.site)).size} site groupings: ` +
      workforce.map((w) => `${w.site} — ${w.role} ${w.headcount} (${w.productive_fte} productive${w.span ? `, ${w.span}` : ""})`).join("; ") + ".",
    family: "uploaded_current_state",
    confidence: "medium",
    figures: [count(headcount, "contact-centre headcount (uploaded)"), count(productive, "contact-centre productive FTE (uploaded)")],
  });

  // 07 · cost structure
  const costs = tab("07_Cost_Structure");
  const totalRow = costs.find((c) => /total/i.test(c.cost_line));
  const lines = costs.filter((c) => !/total/i.test(c.cost_line));
  const totalCost = num(totalRow?.annual_usd) ?? lines.reduce((a, c) => a + (num(c.annual_usd) ?? 0), 0);
  track("cost:total", "contact-centre annual cost base", totalCost, [String(totalCost), usd(totalCost), `$${(totalCost / 1e6).toFixed(1)}M`, `$${(totalCost / 1e6).toFixed(0)}M`], "07_Cost_Structure", "represented");
  add({
    label: "Uploaded contact-centre cost structure",
    statement:
      `The uploaded cost structure totals ${usd(totalCost)} across ${lines.length} lines: ` +
      lines.map((c) => `${c.cost_line} ${usd(num(c.annual_usd))}${c.basis ? ` (${c.basis})` : ""}`).join("; ") +
      `. The package labels the total a synthetic planning figure and explicitly not a Finance-confirmed cost base.`,
    family: "uploaded_current_state",
    confidence: "medium",
    figures: [
      money(totalCost, "contact-centre annual cost base (uploaded planning figure)", false),
      ...lines.map((c) => {
        const n = num(c.annual_usd);
        track(`cost:${c.cost_line}`, c.cost_line, n, [String(n), usd(n)], "07_Cost_Structure", "optional");
        return money(n, `${c.cost_line} (uploaded)`, false);
      }),
    ],
  });

  // 08 · integration surface
  const integ = tab("08_Integration_Surface");
  const unvalidated = integ.filter((i) => /UNVALIDATED/i.test(i.api_readiness ?? ""));
  // Variants have to be long enough to be a signal. A bare "8" matches a page
  // number, so the trace matcher refuses it and the fact reads as never having
  // reached the bundle — an instrument defect indistinguishable from a pipeline
  // defect in the report.
  track(
    "integration:unvalidated",
    "systems with unvalidated API readiness",
    unvalidated.length,
    [`${unvalidated.length} of ${integ.length}`, `${unvalidated.length} systems`, `${unvalidated.length} unvalidated`],
    "08_Integration_Surface",
    "represented",
  );
  add({
    label: "Uploaded integration surface",
    statement:
      `${integ.length} systems sit in the contact flow, of which ${unvalidated.length} carry UNVALIDATED API readiness: ` +
      integ.map((i) => `${i.system} (${i.vendor}) — ${i.role_in_contact_flow}, interface today: ${i.interface_today}, readiness: ${i.api_readiness}`).join("; ") + ".",
    family: "uploaded_current_state",
    confidence: "medium",
    figures: [count(integ.length, "systems in the contact flow (uploaded)"), count(unvalidated.length, "systems with unvalidated API readiness (uploaded)")],
  });

  // 02 · what this package does and does NOT close — the smoke's expected result
  const coverage = tab("02_Gap_Coverage");
  add({
    label: "What the upload closes, and what it does not",
    statement:
      `The uploaded package declares its own coverage against the previously identified gaps: ` +
      coverage.map((c) => `"${c.home_identified_gap}" — ${c.filled_by_this_package}; still open: ${c.still_open_after_this}`).join(" | "),
    family: "uploaded_current_state",
    confidence: "high",
  });
  for (const c of coverage) {
    const filled = /^PARTIAL/i.test(c.filled_by_this_package ?? "");
    uploadedFacts.push({
      factId: `coverage:${c.home_identified_gap}`,
      label: c.home_identified_gap,
      value: null,
      variants: [],
      tab: "02_Gap_Coverage",
      expectation: filled ? "recharacterised" : "still_open",
      stillOpen: c.still_open_after_this,
    });
  }

  // 09 · controls and risk, 03 · scale derivation, 11 · checks
  for (const [file, label, family] of [
    ["09_Controls_And_Risk", "Uploaded control and risk position", "uploaded_current_state"],
    ["03_Scale_Derivation", "Uploaded scale derivation", "uploaded_current_state"],
    ["11_Checks", "Uploaded internal consistency checks", "uploaded_current_state"],
  ]) {
    const rows = tab(file);
    if (!rows.length) continue;
    add({
      label,
      statement:
        `${label} (${rows.length} rows): ` +
        rows.map((r) => Object.entries(r).filter(([, v]) => val(v)).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(", ")).join(" | "),
      family,
      confidence: "medium",
    });
  }

  // 10 · the package's own prohibitions merge into the tenant set
  for (const r of tab("10_Do_Not_Claim")) {
    const t = val(r.statement);
    if (t) forbidden.add(t);
  }
}

// ── 13 · the prohibitions, once every source has contributed ─────────────────
//
// This ran as section 9 and snapshotted the set before the supplemental intake
// had merged its own seven prohibitions, so the package's claim boundaries were
// collected and then silently discarded. A list that is built incrementally has
// to be read at the end of the build, not in the middle of it.
const forbiddenList = [...forbidden].sort();
add({
  label: "Claims this artifact must not make",
  statement:
    `The governed set carries ${forbiddenList.length} explicit prohibitions that any artifact must respect: ` +
    forbiddenList.join(" | "),
  family: "claim_boundaries",
  confidence: "high",
  figures: [count(forbiddenList.length, "explicit claim prohibitions")],
});


// ── request ───────────────────────────────────────────────────────────────────

const focusRow = benefits.find((r) => r.ai_program_id === PROGRAM);
const request = {
  module: "moves",
  useCaseArchetype: "AI_PDLC",
  // P2, not P3. The governed set says this case has not cleared discovery:
  // initiative_status context_only, value_claim_status baseline_only,
  // metric_boundary baseline_required_before_value_claim, no cycle-time baseline
  // loaded, and four gaps named by stakeholders as blocking a decision-grade
  // case. A target-state architecture over an unproven current state is an
  // artifact that looks further along than the evidence is.
  phaseOrStage: "P2",
  deliverableType: "discovery_report",
  audience: ["cio", "cfo", "coo"],
  decisionContext:
    `Establish what is true today for the Contact Center Platform / Knowledge Modernization programme, and what it is costing, ` +
    `so the steering committee can decide what must close before any value claim is made. ` +
    `It carries ${usd(num(focusRow?.funded_spend_usd) ?? 0)} of funded spend and ${usd(num(focusRow?.actual_spend_ytd_usd) ?? 0)} spent year to date, ` +
    `against ${usd(num(focusRow?.promised_value_usd) ?? 0)} of promised value of which ${usd(num(focusRow?.finance_validated_value_usd) ?? 0)} is finance-validated. ` +
    `Agent Assist adoption stands at ${focusRow?.adoption_rate_pct}% against a ${usage.find((u) => u.ai_program_id === PROGRAM)?.adoption_target_pct ?? "?"}% target, no cycle-time baseline is loaded, ` +
    `and four named evidence gaps are cited by stakeholders as blocking a decision-grade case. This artifact states the current position ` +
    `and what each gap costs to close; it does not design a target state and does not produce sourcing-event outputs.`,
  governedEvidenceBundle: evidence,
  sourceRegister: evidence.map((e) => ({
    citationNumber: e.citationNumber,
    label: e.label,
    evidenceFamily: e.evidenceFamily,
    confidence: e.confidence,
    asOf: e.asOf,
  })),
  requiredEvidenceSignals: evidence
    .filter((e) => ["focus_initiative", "ai_portfolio", "claim_boundaries"].includes(e.evidenceFamily))
    .slice(0, 5)
    .map((e) => ({ key: e.evidenceFamily, label: e.label, statement: e.statement, citationNumber: e.citationNumber })),
  missingEvidence: [],
  clientCompleteItems: [],
  approvedAssumptions: [],
  artifactStandard: "discovery_report_v1",
  outputFormats: ["pptx", "docx"],
  clientDisplayName: entityName,
  initiativeDisplayName: focusRow?.program_name ?? "Contact Center Platform / Knowledge Modernization",
};

const out = path.resolve(process.argv[2] ?? "./proof-out");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "request.json"), JSON.stringify(request, null, 2));
fs.writeFileSync(path.join(out, "number-ledger.json"), JSON.stringify(ledger, null, 2));
fs.writeFileSync(path.join(out, "forbidden-claims.json"), JSON.stringify(forbiddenList, null, 2));
fs.writeFileSync(path.join(out, "uploaded-facts.json"), JSON.stringify(uploadedFacts, null, 2));
console.log(`tenant:          ${TENANT} (${entityName})`);
console.log(`initiative:      ${request.initiativeDisplayName}`);
console.log(`evidence items:  ${evidence.length}`);
console.log(`  focus:         ${evidence.filter((e) => e.evidenceFamily === "focus_initiative").length}`);
console.log(`ledger figures:  ${ledger.length} (${ledger.filter((f) => f.additive).length} additive)`);
console.log(`forbidden:       ${forbiddenList.length} explicit prohibitions`);
console.log(`bundle chars:    ${JSON.stringify(evidence).length.toLocaleString("en-US")}`);
console.log(`upload:          ${uploadEnabled ? `ON — ${uploadedFacts.length} instrumented facts` : "OFF (control run)"}`);

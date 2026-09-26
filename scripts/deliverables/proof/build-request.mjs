// Build a governed DeliverableIntelligenceRequest for the composer proof, and the
// authoritative number ledger, from one lab tenant's governed intake CSVs.
//
// Both come from the SAME rows on purpose. The ledger is not a second, hand-kept
// list that can drift from the evidence the model was shown; it is derived from the
// evidence items themselves, so "in the bundle" and "in the ledger" cannot disagree.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv.mjs";

const TENANT = process.env.PROOF_TENANT ?? "skyharbor-air";
const ROOT = path.resolve(
  process.env.PROOF_DATA_ROOT ??
    "/Users/anand/Projects/nexus/datasets/tenant-inputs/active",
  TENANT,
  "current",
);

const read = (f) => parseCsv(fs.readFileSync(path.join(ROOT, `${f}.csv`), "utf8"));
/**
 * The FIRST numeric token in a string, not every digit in it.
 *
 * Stripping non-digits turned "100% by FY27 Q4" into 100274 — the target, the
 * fiscal year and the quarter concatenated — and wrote that into the ledger as
 * an authoritative figure. Every metric baseline and target in the corpus was
 * wrong the same way, and the lineage gate then correctly refused the deck's
 * perfectly good "100%" because the governed entry it was checked against was
 * nonsense. A bad ledger does not fail loudly; it fails as a false accusation.
 */
const num = (v) => {
  const m = String(v ?? "").match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
const usd = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString("en-US")}`;

const evidence = [];
const ledger = [];
let cite = 0;

/**
 * Add one evidence item, and register the figures it asserts.
 *
 * `figures` are the numeric claims the model is ALLOWED to repeat from this item.
 * Registering them here — at the point the statement is written — is what makes
 * the lineage gate meaningful: a number in the deck that was never written into a
 * governed statement has no ledger entry and cannot pass.
 */
function add({ label, statement, family, confidence = "medium", asOf = "FY2026", figures = [] }) {
  cite += 1;
  evidence.push({
    citationNumber: cite,
    label,
    statement,
    evidenceFamily: family,
    confidence,
    asOf,
    disclosureTier: "internal_only",
    provenanceRef: `${TENANT}/current/${family}#${cite}`,
  });
  for (const f of figures) {
    // Content-addressed, NOT positional.
    //
    // Sequential ids looked stable and were not: fixing an unrelated parser
    // inserted one figure at index 117 and renumbered everything after it, so
    // eight of the accepted plan's fifty-seven figure references silently began
    // pointing at a different figure. Nothing failed — the ids still existed.
    // An id that means "the 118th thing we happened to build" cannot survive its
    // own builder changing.
    ledger.push({
      figureId: `F${createHash("sha256").update(`${f.label}|${f.unit}|${f.value}`).digest("hex").slice(0, 8)}`,
      value: f.value,
      unit: f.unit,
      label: f.label,
      formattedVariants: f.variants,
      citationNumber: cite,
      sourceRef: `${TENANT}/current/${family}`,
    });
  }
  return cite;
}

const money = (n, label) => ({
  value: n,
  unit: "usd",
  label,
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
const count = (n, label) => ({
  value: n,
  unit: "count",
  label,
  variants: [String(n), n.toLocaleString("en-US")],
});
const pct = (n, label) => ({
  value: n,
  unit: "percent",
  label,
  variants: [`${n}%`, `${n.toFixed(1)}%`, String(n)],
});

// ── 1 · enterprise profile ────────────────────────────────────────────────────
const profile = read("00_enterprise_profile")[0];
const revenue = num(profile.revenue_usd);
const employees = num(profile.employee_count);
add({
  label: "Enterprise profile",
  statement: `${profile.entity_name} is a ${profile.sub_industry} operating at ${usd(revenue)} annual revenue with ${employees.toLocaleString("en-US")} employees, headquartered in ${profile.headquarters}.`,
  family: "enterprise_profile",
  confidence: "high",
  figures: [money(revenue, "annual revenue"), count(employees, "employee count")],
});
add({
  label: "Strategic priorities",
  statement: `Stated strategic priorities: ${profile.strategic_priorities}`,
  family: "enterprise_profile",
  confidence: "high",
  figures: [],
});
if (profile.known_gaps)
  add({
    label: "Declared enterprise gaps",
    statement: `Declared gaps at the enterprise level: ${profile.known_gaps}`,
    family: "enterprise_profile",
    figures: [],
  });

// ── 2 · application portfolio ─────────────────────────────────────────────────
const apps = read("04_applications_systems");
const byCrit = {};
const byLifecycle = {};
const byDeploy = {};
for (const a of apps) {
  byCrit[a.criticality] = (byCrit[a.criticality] ?? 0) + 1;
  byLifecycle[a.lifecycle_state] = (byLifecycle[a.lifecycle_state] ?? 0) + 1;
  byDeploy[a.deployment_model] = (byDeploy[a.deployment_model] ?? 0) + 1;
}
const tier1 = byCrit.tier1 ?? 0;
add({
  label: "Application portfolio size and criticality",
  statement: `The governed application inventory holds ${apps.length} systems, of which ${tier1} are classified tier1 (criticality mix: ${Object.entries(byCrit).map(([k, v]) => `${k} ${v}`).join(", ")}).`,
  family: "application_portfolio",
  confidence: "high",
  figures: [count(apps.length, "applications in inventory"), count(tier1, "tier1 applications")],
});
add({
  label: "Portfolio lifecycle distribution",
  statement: `Lifecycle distribution across the inventory: ${Object.entries(byLifecycle).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
  family: "application_portfolio",
  confidence: "high",
  figures: Object.entries(byLifecycle).map(([k, v]) => count(v, `applications in lifecycle ${k}`)),
});
add({
  label: "Deployment model distribution",
  statement: `Deployment model mix across the inventory: ${Object.entries(byDeploy).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}.`,
  family: "application_portfolio",
  confidence: "high",
  figures: Object.entries(byDeploy).map(([k, v]) => count(v, `applications deployed ${k}`)),
});
const topIntegrated = apps
  .filter((a) => num(a.interfaces_count))
  .sort((a, b) => num(b.interfaces_count) - num(a.interfaces_count))
  .slice(0, 8);
add({
  label: "Most-integrated systems",
  statement: `The most heavily integrated systems by declared interface count: ${topIntegrated.map((a) => `${a.system_name} (${a.interfaces_count} interfaces, ${a.criticality}, ${a.business_function})`).join("; ")}.`,
  family: "integration_topology",
  confidence: "high",
  figures: topIntegrated.map((a) => count(num(a.interfaces_count), `${a.system_name} interfaces`)),
});
for (const a of apps.filter((x) => x.criticality === "tier1" && x.known_challenges_narrative).slice(0, 10)) {
  add({
    label: `Tier-1 constraint — ${a.system_name}`,
    statement: `${a.system_name} (${a.system_category}, ${a.deployment_model}, owner ${a.technology_owner}): ${a.known_challenges_narrative}`,
    family: "current_state_constraint",
    figures: [],
  });
}

// ── 3 · vendors and contracts ─────────────────────────────────────────────────
const vendors = read("07_vendors_contracts");
const vendorSpend = vendors.reduce((s, v) => s + (num(v.annual_spend_usd) ?? 0), 0);
const topVendors = vendors
  .slice()
  .sort((a, b) => (num(b.annual_spend_usd) ?? 0) - (num(a.annual_spend_usd) ?? 0))
  .slice(0, 10);
const top5 = topVendors.slice(0, 5).reduce((s, v) => s + num(v.annual_spend_usd), 0);
const concentration = Number(((top5 / vendorSpend) * 100).toFixed(1));
add({
  label: "Contracted vendor spend",
  statement: `${vendors.length} governed vendor contracts carry ${usd(vendorSpend)} of annual contracted spend.`,
  family: "vendor_contracts",
  confidence: "high",
  figures: [count(vendors.length, "vendor contracts"), money(vendorSpend, "annual contracted vendor spend")],
});
add({
  label: "Vendor concentration",
  statement: `The five largest contracts represent ${usd(top5)}, or ${concentration}% of contracted vendor spend: ${topVendors.slice(0, 5).map((v) => `${v.vendor_name} ${usd(num(v.annual_spend_usd))}`).join("; ")}.`,
  family: "vendor_contracts",
  confidence: "high",
  figures: [money(top5, "top-5 contracted spend"), pct(concentration, "top-5 concentration")],
});
for (const v of topVendors) {
  add({
    label: `Contract — ${v.vendor_name}`,
    statement: `${v.vendor_name} — ${v.contract_name} (${v.service_category}): ${usd(num(v.annual_spend_usd))} annual, ${v.commercial_model}, term ${v.term_start} to ${v.term_end}, renewal ${v.renewal_date}, risk ${v.risk_rating}. Supports: ${v.supported_systems}.`,
    family: "vendor_contracts",
    confidence: "high",
    figures: [money(num(v.annual_spend_usd), `${v.vendor_name} annual contract value`)],
  });
}

// ── 4 · spend baseline ────────────────────────────────────────────────────────
const spend = read("08_spend_value");
const totalSpend = spend.reduce((s, r) => s + (num(r.annual_spend_usd) ?? 0), 0);
const totalSavings = spend.reduce((s, r) => s + (num(r.savings_opportunity_usd) ?? 0), 0);
add({
  label: "Technology spend baseline",
  statement: `Governed technology spend totals ${usd(totalSpend)} across ${spend.length} categories, with ${usd(totalSavings)} of identified savings opportunity.`,
  family: "spend_baseline",
  confidence: "high",
  figures: [money(totalSpend, "total governed technology spend"), money(totalSavings, "identified savings opportunity"), count(spend.length, "spend categories")],
});
for (const r of spend.slice().sort((a, b) => num(b.annual_spend_usd) - num(a.annual_spend_usd))) {
  add({
    label: `Spend — ${r.spend_category}`,
    statement: `${r.spend_category} (owner ${r.cost_center_or_owner}): ${usd(num(r.annual_spend_usd))} annual, split ${r.run_change_transform_split}, ${r.vendor_internal_split}. Value driver: ${r.value_driver}. Identified savings ${usd(num(r.savings_opportunity_usd) ?? 0)}. Basis: ${r.calculation_basis}.`,
    family: "spend_baseline",
    confidence: r.confidence || "medium",
    figures: [
      money(num(r.annual_spend_usd), `${r.spend_category} annual spend`),
      ...(num(r.savings_opportunity_usd) ? [money(num(r.savings_opportunity_usd), `${r.spend_category} savings opportunity`)] : []),
    ],
  });
}

// ── 5 · operating metrics ─────────────────────────────────────────────────────
for (const m of read("14_metrics_outcomes")) {
  const bv = num(m.baseline_value);
  const tv = num(m.target_value);
  add({
    label: `Metric — ${m.metric_name}`,
    statement: `${m.metric_name} (${m.metric_domain}, ${m.business_function}): baseline ${m.baseline_value} in ${m.baseline_period}, target ${m.target_value}. Owner ${m.owner}. Definition: ${m.definition}. Source: ${m.data_source}.`,
    family: "operating_metrics",
    confidence: m.confidence || "medium",
    asOf: m.baseline_period || "FY2026",
    figures: [
      ...(bv !== null ? [{ value: bv, unit: "metric", label: `${m.metric_name} baseline`, variants: [m.baseline_value, String(bv), `${bv}%`] }] : []),
      ...(tv !== null ? [{ value: tv, unit: "metric", label: `${m.metric_name} target`, variants: [m.target_value, String(tv), `${tv}%`] }] : []),
    ],
  });
}

// ── 6 · risks, programs, platforms, data, AI, maturity ────────────────────────
for (const r of read("11_risks_controls").slice(0, 16)) {
  add({
    label: `Risk — ${r.risk_or_control_name ?? r.risk_name ?? "declared risk"}`,
    statement: Object.entries(r)
      .filter(([k, v]) => v && !/^(tenant_key|source_|original_|confidence|known_gaps|consolidation_|conflict_)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "risk_controls",
    figures: [],
  });
}
const programs = read("09_programs_initiatives");
const progBudget = programs.reduce((s, p) => s + (num(p.budget_usd ?? p.annual_budget_usd) ?? 0), 0);
add({
  label: "In-flight programs",
  statement: `${programs.length} governed programs are in flight${progBudget ? `, carrying ${usd(progBudget)} of declared budget` : ""}.`,
  family: "programs",
  confidence: "high",
  figures: [count(programs.length, "in-flight programs"), ...(progBudget ? [money(progBudget, "declared program budget")] : [])],
});
for (const p of programs.slice(0, 12)) {
  add({
    label: `Program — ${p.program_name ?? p.initiative_name ?? "program"}`,
    statement: Object.entries(p)
      .filter(([k, v]) => v && !/^(tenant_key|source_|original_|confidence|known_gaps|consolidation_|conflict_)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "programs",
    figures: [],
  });
}
const infra = read("06_infrastructure_platforms");
add({
  label: "Infrastructure platform estate",
  statement: `${infra.length} governed infrastructure platforms: ${infra.slice(0, 14).map((i) => i.platform_name ?? i.name ?? "").filter(Boolean).join("; ")}.`,
  family: "infrastructure",
  confidence: "high",
  figures: [count(infra.length, "infrastructure platforms")],
});
for (const i of infra.slice(0, 10)) {
  add({
    label: `Platform — ${i.platform_name ?? i.name ?? "platform"}`,
    statement: Object.entries(i)
      .filter(([k, v]) => v && !/^(tenant_key|source_|original_|confidence|known_gaps|consolidation_|conflict_)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "infrastructure",
    figures: [],
  });
}
const dataAssets = read("05_data_assets_integrations");
add({
  label: "Data assets and integrations",
  statement: `${dataAssets.length} governed data assets and integrations are declared across the estate.`,
  family: "data_integration",
  confidence: "high",
  figures: [count(dataAssets.length, "data assets and integrations")],
});
for (const u of read("10_ai_automation_use_cases")) {
  add({
    label: `AI/automation candidate — ${u.use_case_name ?? u.name ?? "use case"}`,
    statement: Object.entries(u)
      .filter(([k, v]) => v && !/^(tenant_key|source_|original_|confidence|known_gaps|consolidation_|conflict_)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "ai_use_cases",
    figures: [],
  });
}
for (const m of read("19_data_analytics_platform_maturity")) {
  add({
    label: `Data/analytics maturity — ${m.capability_area ?? m.dimension ?? "dimension"}`,
    statement: Object.entries(m)
      .filter(([k, v]) => v && !/^(tenant_key|source_|original_|confidence|known_gaps|consolidation_|conflict_)/.test(k))
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · "),
    family: "analytics_maturity",
    figures: [],
  });
}

// ── request ───────────────────────────────────────────────────────────────────
const request = {
  module: "moves",
  useCaseArchetype: "CLOUD_MODERNIZATION",
  phaseOrStage: "P3",
  deliverableType: "target_state_architecture",
  audience: ["cio", "cfo", "coo"],
  decisionContext:
    "Approve the target-state technology architecture and the sequenced modernization path that will carry the enterprise from its current fragmented estate to a governed, integrated platform — including which platforms consolidate, which contracts are renegotiated at renewal, and what the first two horizons fund.",
  governedEvidenceBundle: evidence,
  sourceRegister: evidence.map((e) => ({
    citationNumber: e.citationNumber,
    label: e.label,
    evidenceFamily: e.evidenceFamily,
    confidence: e.confidence,
    asOf: e.asOf,
  })),
  requiredEvidenceSignals: [1, 4, 8, 9].map((n) => {
    const e = evidence.find((x) => x.citationNumber === n);
    return { key: e.evidenceFamily, statement: e.statement, citationNumber: n };
  }),
  missingEvidence: [],
  clientCompleteItems: [],
  approvedAssumptions: [],
  artifactStandard: "target_state_architecture_v1",
  outputFormats: ["pptx", "docx"],
  clientDisplayName: profile.entity_name,
  initiativeDisplayName: "Enterprise Platform Modernization",
};

const out = path.resolve(process.argv[2] ?? "./proof-out");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "request.json"), JSON.stringify(request, null, 2));
fs.writeFileSync(path.join(out, "number-ledger.json"), JSON.stringify(ledger, null, 2));
console.log(`evidence items: ${evidence.length}`);
console.log(`ledger figures: ${ledger.length}`);
console.log(`bundle chars:   ${JSON.stringify(evidence).length.toLocaleString("en-US")}`);

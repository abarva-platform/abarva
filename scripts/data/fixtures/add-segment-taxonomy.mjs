#!/usr/bin/env node
/**
 * The segment taxonomy that classifies every move.
 *
 * A use case captured in Moves needs to answer three questions before anyone can build a business
 * case for it: which part of the business owns the P&L, which function operates it, and what kind of
 * value it produces. Today it answers one — `business_function` — and the other two are worked out in
 * someone's head at the governance council.
 *
 * Three layers, and the distinction between them is not cosmetic:
 *
 *   BUSINESS SEGMENT   the client's own operating segments. Their P&L, their leaders, their words.
 *                      This is a fact about the client and it comes from the client.
 *
 *   BUSINESS FUNCTION  what the function does, and whether it is clinical or enabling. Also theirs.
 *
 *   OFFICE LENS        front / middle / back. **This is ours, not theirs.** It is an analytical frame
 *                      we apply to predict where value comes from, and it must be labelled as such —
 *                      presenting our lens as their org design is how a consultant loses a room.
 *
 * The lens earns its place because it predicts the value archetype, which is what shapes a business
 * case:
 *
 *   front office   customer- or patient-facing  ->  revenue uplift, experience, retention
 *   middle office  risk, control, planning       ->  yield, leakage, regulatory exposure
 *   back office    enabling services             ->  cost, productivity, cycle time
 *
 * A back-office move justified on revenue uplift is usually a move that has not been thought through,
 * and the taxonomy makes that visible at capture rather than at the council.
 *
 * Routing falls out of the taxonomy: segment gives the sponsor who signs, function gives the
 * operational owner who has to make it work, and the two together give the approval path.
 *
 * Usage:
 *   node scripts/data/fixtures/add-segment-taxonomy.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");

/**
 * Segments as each client describes their own business.
 *
 * Revenue shares come from the enterprise profile's stated operating model, not from anything we
 * invented — for the health system, 60% provider / 40% plan, with the plan splitting 70% Medicare.
 */
const SEGMENTS = {
  "meridian-health": [
    { key: "health_plan", name: "Health Plan Operations", revenueSharePct: 40, pnlOwner: "President, Meridian Health Plan", regulatory: "CMS Medicare Advantage; state DOI", note: "70% Medicare Advantage and Medicare FFS, 30% commercial and Medicaid managed care." },
    { key: "hospital_delivery", name: "Hospital & Acute Delivery", revenueSharePct: 42, pnlOwner: "Chief Operating Officer", regulatory: "CMS Conditions of Participation; Joint Commission; state licensure", note: "34 owned hospitals." },
    { key: "ambulatory", name: "Ambulatory & Physician Network", revenueSharePct: 15, pnlOwner: "President, Meridian Medical Group", regulatory: "CMS; state licensure", note: "214 clinic sites and the employed and affiliated physician network." },
    { key: "shared_enterprise", name: "Shared Enterprise Services", revenueSharePct: 3, pnlOwner: "Chief Financial Officer", regulatory: "SOX; HIPAA administrative safeguards", note: "Allocated to the operating segments; not a revenue-generating segment." },
  ],
  "skyharbor-air": [
    { key: "passenger_commercial", name: "Passenger & Commercial", revenueSharePct: 62, pnlOwner: "Chief Commercial Officer", regulatory: "DOT consumer rules; IATA settlement", note: "Distribution, revenue management, loyalty and customer experience." },
    { key: "flight_ground_ops", name: "Flight & Ground Operations", revenueSharePct: 20, pnlOwner: "Chief Operating Officer", regulatory: "FAA / EASA operational certification", note: "Flight ops, crew, airport and technical operations." },
    { key: "cargo", name: "Cargo", revenueSharePct: 11, pnlOwner: "VP Cargo", regulatory: "IATA cargo; customs regimes", note: "Freight and mail." },
    { key: "shared_enterprise", name: "Shared Enterprise Services", revenueSharePct: 7, pnlOwner: "Chief Financial Officer", regulatory: "SOX", note: "Allocated to the operating segments; not a revenue-generating segment." },
  ],
};

/**
 * Function to segment, and function to office lens.
 *
 * Patterns rather than an explicit list, so a function added later classifies without a code change.
 * Ordered — first match wins — because "Revenue Cycle" is middle office and contains the word
 * revenue, and a naive front-office rule would grab it.
 */
const FUNCTION_RULES = [
  // health system
  [/health plan|payer|claims|enrollment|actuarial|underwriting|medicare advantage|stars|hedis/i, "health_plan", "middle", "non_clinical"],
  [/population health|care management|utilization/i, "health_plan", "middle", "clinical"],
  [/acute care|nursing|emergency|surgical|inpatient|perioperative|critical care/i, "hospital_delivery", "front", "clinical"],
  [/pharmacy|laboratory|imaging|radiology|behavioral health|rehab/i, "hospital_delivery", "middle", "clinical"],
  [/ambulatory|physician network|clinic|primary care|specialty care/i, "ambulatory", "front", "clinical"],
  // These belong to a delivery segment, not to shared services. Falling them through to shared was
  // wrong: revenue cycle and quality are how a hospital gets paid and stays licensed, and burying
  // them in enabling services hides the segment that actually owns the outcome.
  [/patient access|registration|scheduling|patient experience/i, "hospital_delivery", "front", "non_clinical"],
  [/member services/i, "health_plan", "front", "non_clinical"],
  [/revenue cycle|billing|coding|denials|charge capture/i, "hospital_delivery", "middle", "non_clinical"],
  [/quality|regulatory affairs|accreditation/i, "hospital_delivery", "middle", "clinical"],
  [/clinical informatics|clinical decision support/i, "hospital_delivery", "middle", "clinical"],
  // airline
  [/distribution|e-commerce|sales|revenue management|loyalty|marketing|customer experience|in-flight/i, "passenger_commercial", "front", "non_clinical"],
  [/network planning|scheduling|pricing/i, "passenger_commercial", "middle", "non_clinical"],
  [/flight operations|crew|dispatch|technical operations|maintenance|mro|airport|ground|baggage|station/i, "flight_ground_ops", "front", "non_clinical"],
  [/safety|compliance|security operations/i, "flight_ground_ops", "middle", "non_clinical"],
  [/cargo|freight|mail/i, "cargo", "front", "non_clinical"],
  // enabling, both industries
  [/finance|accounting|treasury|procurement|supply chain|sourcing/i, "shared_enterprise", "back", "non_clinical"],
  [/human resources|workforce|people|talent|payroll/i, "shared_enterprise", "back", "non_clinical"],
  [/information technology|digital|data|analytics|cyber|security|infrastructure|architecture|enterprise applications/i, "shared_enterprise", "back", "non_clinical"],
  [/legal|risk|internal audit|corporate|real estate|facilities|sustainability/i, "shared_enterprise", "back", "non_clinical"],
];

/** What kind of value a move in each office lens is expected to produce. */
const VALUE_ARCHETYPE = {
  front: "revenue_uplift_or_experience",
  middle: "yield_leakage_or_regulatory_exposure",
  back: "cost_productivity_or_cycle_time",
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
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function classify(name, fallbackSegment) {
  for (const [pattern, segment, office, type] of FUNCTION_RULES) {
    if (pattern.test(name)) return { segment: segment ?? fallbackSegment, office, type };
  }
  return { segment: "shared_enterprise", office: "back", type: "non_clinical" };
}

const summary = [];

for (const [tenantKey, segments] of Object.entries(SEGMENTS)) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  if (!fs.existsSync(dir)) continue;
  const load = (f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) return null;
    const rows = parseCsv(fs.readFileSync(p, "utf8"));
    return { path: p, header: rows[0].map((h) => h.trim()), rows: objects(rows) };
  };
  const save = (t, extra) => {
    const header = [...t.header, ...extra.filter((c) => !t.header.includes(c))];
    if (WRITE) {
      fs.writeFileSync(t.path,
        [header.join(","), ...t.rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n");
    }
    return header.length - t.header.length;
  };

  const profile = load("00_enterprise_profile.csv");
  const revenue = profile ? num(profile.rows[0]?.revenue_usd) : 0;
  const org = load("02_org_ownership.csv");
  const out = { tenantKey, segments: segments.length };

  // ---- 01b: the segment sheet itself ------------------------------------------------------------
  const segmentRows = segments.map((s) => ({
    tenant_key: tenantKey,
    segment_key: s.key,
    segment_name: s.name,
    revenue_share_pct: String(s.revenueSharePct),
    revenue_usd: String(Math.round((revenue * s.revenueSharePct) / 100)),
    pnl_owner_role: s.pnlOwner,
    // The sponsor who signs a business case for this segment, and the council it goes to.
    business_case_sponsor_role: s.pnlOwner,
    governance_council: s.key === "shared_enterprise" ? "Enterprise Technology Council" : "Segment Investment Committee",
    regulatory_regime: s.regulatory,
    segment_notes: s.note,
    source_file: "00_enterprise_profile.csv",
    confidence: "high",
    classification_basis: "client_declared_operating_segment",
  }));
  if (WRITE) {
    fs.writeFileSync(path.join(dir, "01b_business_segments.csv"),
      [Object.keys(segmentRows[0]).join(","),
       ...segmentRows.map((r) => Object.keys(segmentRows[0]).map((h) => esc(r[h])).join(","))].join("\n") + "\n");
  }

  // ---- 01: functions gain segment, lens, type ---------------------------------------------------
  const functions = load("01_business_functions.csv");
  const fnIndex = new Map();
  if (functions) {
    functions.rows.forEach((f) => {
      const c = classify(f.function_name, "shared_enterprise");
      const seg = segments.find((s) => s.key === c.segment);
      f.business_segment = seg?.name ?? "Shared Enterprise Services";
      f.business_segment_key = c.segment;
      f.function_type = c.type;
      // Named so nobody mistakes it for the client's own classification. It is our frame, applied by
      // us, and the column name says so.
      f.office_lens_abarva = c.office;
      f.office_lens_basis = "abarva_analytical_lens_not_client_declared";
      f.expected_value_archetype = VALUE_ARCHETYPE[c.office];
      f.segment_sponsor_role = seg?.pnlOwner ?? "Chief Financial Officer";
      fnIndex.set(f.function_name, f);
    });
    out.functions = save(functions, [
      "business_segment", "business_segment_key", "function_type",
      "office_lens_abarva", "office_lens_basis", "expected_value_archetype", "segment_sponsor_role",
    ]);
  }

  // ---- 10: use cases inherit the whole chain, plus their routing --------------------------------
  const useCases = load("10_ai_automation_use_cases.csv");
  if (useCases) {
    const ownerFor = (fnName) => {
      const o = (org?.rows ?? []).find((x) => (x.owned_functions ?? "").includes(fnName));
      return o?.leader_name_or_role ?? "";
    };
    useCases.rows.forEach((u) => {
      const fn = fnIndex.get(u.business_function);
      const c = fn ? null : classify(u.business_function || u.use_case_name, "shared_enterprise");
      const office = fn?.office_lens_abarva ?? c?.office ?? "back";
      const segKey = fn?.business_segment_key ?? c?.segment ?? "shared_enterprise";
      const seg = segments.find((s) => s.key === segKey);
      u.business_segment = seg?.name ?? "Shared Enterprise Services";
      u.business_segment_key = segKey;
      u.function_type = fn?.function_type ?? c?.type ?? "non_clinical";
      u.office_lens_abarva = office;
      u.expected_value_archetype = VALUE_ARCHETYPE[office];
      // The three names a business case needs before it can be tabled.
      u.sponsor_role = seg?.pnlOwner ?? "Chief Financial Officer";
      u.operational_owner_role = ownerFor(u.business_function) || fn?.executive_owner || "";
      u.approval_path = segKey === "shared_enterprise"
        ? "Function owner -> Enterprise Technology Council"
        : `Function owner -> ${seg?.pnlOwner} -> Segment Investment Committee`;
      u.governance_council = segKey === "shared_enterprise" ? "Enterprise Technology Council" : "Segment Investment Committee";
      // A move whose claimed value does not match its office archetype is not disqualified — it is
      // flagged, because it is usually either mislabelled or genuinely novel, and both are worth a
      // question at the council rather than a silent pass.
      const claim = `${u.value_hypothesis ?? ""}`.toLowerCase();
      const claimed = /revenue|growth|conversion|retention|experience/.test(claim) ? "front"
        : /risk|leakage|compliance|yield|denial|regulator/.test(claim) ? "middle"
          : /cost|productivity|effort|cycle|time|automat/.test(claim) ? "back" : "";
      u.value_archetype_alignment = !claimed ? "not_stated"
        : claimed === office ? "aligned" : `mismatch_claims_${claimed}_but_is_${office}_office`;
      // The mismatch rate runs high — over half in one tenant — and at that level it is as likely to
      // be the keyword detection as the use cases. Marking it a heuristic keeps it useful as a
      // prompt at the council without letting anyone quote the rate as a finding.
      u.value_archetype_alignment_basis = "abarva_heuristic_keyword_match_requires_human_confirmation";
    });
    out.useCases = save(useCases, [
      "business_segment", "business_segment_key", "function_type", "office_lens_abarva",
      "expected_value_archetype", "sponsor_role", "operational_owner_role", "approval_path",
      "governance_council", "value_archetype_alignment",
    ]);
  }

  summary.push(out);
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey}: ${s.segments} segments · functions +${s.functions ?? 0} cols · use cases +${s.useCases ?? 0} cols`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");

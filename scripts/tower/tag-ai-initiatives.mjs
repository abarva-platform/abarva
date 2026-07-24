#!/usr/bin/env node
// Tag every initiative line with whether it is an AI project, and how much of
// its investment is AI.
//
// THE DEFECT
//
// Nothing in the tree says which initiatives are AI. `T01_initiative-registry`
// has no classification column: `business_area` and `status` are empty on all
// 30 SkyHarbor rows, and `portfolio_segment` merely suffixes everything `_ai`,
// so "Mainframe transaction processing modernization" is filed as
// `corporate_ai`. `T13_model-ai-inventory` attaches models to all 30 including
// that one, so it does not discriminate either.
//
// Everything in the `ai-control-tower/` folder was therefore treated as AI by
// assumption. That is what made AI-tagged spend unanswerable, and it is why the
// same surface has reported $539.2M (all initiative delivery cost) and $11.9M
// (tool licences only) for the same tenant. Neither is the number. The number
// is AI investment — programmes AND tools — and it cannot be computed until
// each line says whether it is AI.
//
// THE TAG
//
//   ai_classification        ai_native | ai_enabled | non_ai
//   ai_investment_share_pct  how much of this initiative's spend is AI
//   ai_tag_basis             why it was tagged that way, for audit
//
//   ai_native   The initiative exists to deliver AI — an agent, a model, a
//               copilot, a prediction. Kill the AI and there is no programme.
//               90% of spend is AI; the remainder is the platform it runs on.
//
//   ai_enabled  A modernization programme with a real AI component inside it.
//               Kill the AI and the programme still ships, smaller. 25%.
//
//   non_ai      No AI content. Mainframe transaction processing and revenue
//               settlement are ledger and throughput work. 0%.
//
// This is what lets the Tower answer the question it exists to answer: of the
// value being promised, how much is actually being promised BY the AI?
//
//   node scripts/tower/tag-ai-initiatives.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");

const SHARE = { ai_native: 0.9, ai_enabled: 0.25, non_ai: 0 };

// Ordered — first match wins, so non_ai exclusions must precede the generic
// modernization rule.
const RULES = [
  // ai_native — the AI is the deliverable.
  [/agent|agentic|copilot|assist\b|assistant/i, "ai_native", "delivers an agent or assistant"],
  [/\bai\b|\bml\b|machine learning|genai|llm/i, "ai_native", "names AI/ML as the deliverable"],
  [/predictive|prediction|forecast|propensity/i, "ai_native", "predictive model is the deliverable"],
  [/personalization|personalisation|recommend/i, "ai_native", "recommendation/personalization model"],
  [/decisioning|optimization cockpit|recovery cockpit/i, "ai_native", "automated decisioning"],
  [/concierge|chatbot|conversational/i, "ai_native", "conversational AI"],
  [/fraud|anomaly|risk scoring|surveillance/i, "ai_native", "detection model"],
  [/document (intelligence|processing)|idp|ocr/i, "ai_native", "document intelligence"],

  // non_ai — ledger, throughput and settlement work.
  [/transaction processing|settlement|revenue accounting/i, "non_ai", "ledger and throughput work, no AI content"],
  [/finance close|procure.to.pay|general ledger/i, "non_ai", "finance process modernization, no AI content"],
  [/rationalization|decommission|migration|upgrade/i, "non_ai", "platform housekeeping, no AI content"],

  // ai_enabled — modernization that carries an AI component.
  [/data (platform|lake|lakehouse)|edw|lineage|ingestion/i, "ai_enabled", "data foundation an AI programme consumes"],
  [/cdp|identity graph|customer data/i, "ai_enabled", "data foundation an AI programme consumes"],
  [/integration|api|eventing|event bridge/i, "ai_enabled", "integration substrate carrying AI services"],
  [/modernization|modernisation|platform|cloud.native/i, "ai_enabled", "modernization with an AI component"],
  [/optimization|optimisation|pricing|revenue management/i, "ai_enabled", "optimization with a modelled component"],
];

function classifyByName(name) {
  for (const [re, cls, basis] of RULES) {
    if (re.test(name)) return { cls, basis };
  }
  return { cls: "ai_enabled", basis: "unmatched; defaulted to the partial-AI tier" };
}

/**
 * T00 is the authority, not the keyword table.
 *
 * `T00_ai-investment-super-template.csv` IS the separate AI-initiative
 * register, and on four of five tenants it matches T01 exactly — same ids,
 * same count — so for them every T01 line genuinely is an AI initiative and
 * the folder assumption happens to hold.
 *
 * SkyHarbor is the exception and the reason this script exists: its T00 is
 * EMPTY, so its 30 T01 lines were never checked against an AI register. Ten of
 * them (SHA-INIT-001..010) are real AI initiatives; the twenty SHA-INIT-1xx
 * "... modernization" lines are a transformation programme series that landed
 * in the AI folder with nothing to challenge it. Only there does the keyword
 * table decide, and its verdicts are written back into T00 so the register
 * exists for next time.
 */
function classify(name, id, t00Ids) {
  if (t00Ids.size > 0) {
    return t00Ids.has(id)
      ? { cls: "ai_native", basis: "listed in T00, the AI investment register" }
      : { cls: "non_ai", basis: "absent from T00, the AI investment register" };
  }
  const hit = classifyByName(name);
  return { ...hit, basis: `${hit.basis} (T00 register is empty for this tenant)` };
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

const TENANTS = [
  ["skyharbor-air", "skyharbor-air"],
  ["meridian-health", "meridian-health"],
  ["first-capital-financial", "first-capital"],
  ["lakeshore-industries", "lakeshore-holdings"],
  ["apex-retail", "apex-retail"],
];

const manifest = [];
const summary = [];

for (const [dir, key] of TENANTS) {
  const rel = `tower-standardized-v1/${dir}/ai-control-tower/T01_initiative-registry.csv`;
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8").trim();
  const [header, ...lines] = text.split("\n");
  const cols = splitCsvLine(header);
  const rows = lines.map((l) => {
    const c = splitCsvLine(l);
    return Object.fromEntries(cols.map((k, i) => [k, c[i] ?? ""]));
  });

  for (const c of ["ai_classification", "ai_investment_share_pct", "ai_tag_basis"]) {
    if (!cols.includes(c)) cols.splice(cols.indexOf("portfolio_segment") + 1, 0, c);
  }

  const t00Path = path.join(ROOT, `tower-standardized-v1/${dir}/ai-control-tower/T00_ai-investment-super-template.csv`);
  const t00Text = fs.readFileSync(t00Path, "utf8").trim();
  const t00Lines = t00Text.split("\n");
  const t00Cols = splitCsvLine(t00Lines[0]);
  const t00Rows = t00Lines.slice(1).filter(Boolean).map((l) => {
    const c = splitCsvLine(l);
    return Object.fromEntries(t00Cols.map((k, i) => [k, c[i] ?? ""]));
  });
  const t00Ids = new Set(t00Rows.map((r) => r.initiative_id).filter(Boolean));

  const counts = { ai_native: 0, ai_enabled: 0, non_ai: 0 };
  for (const r of rows) {
    const { cls, basis } = classify(r.initiative_name ?? "", r.initiative_id, t00Ids);
    r.ai_classification = cls;
    r.ai_investment_share_pct = Math.round(SHARE[cls] * 100);
    r.ai_tag_basis = basis;
    counts[cls] += 1;
    manifest.push({
      tenant_key: key,
      source_file: "ai-control-tower/T01_initiative-registry.csv",
      source_row: r.initiative_id,
      field: "ai_classification",
      value: cls,
      why: `T01 carried no AI classification, so every initiative in the ai-control-tower folder was treated as AI by assumption. Tagged from the initiative name: ${basis}.`,
      reconciles_to: "T01 initiative registry",
      envelope_value: "",
      formula: `ai_tag_v1:${cls}=${SHARE[cls]}`,
      value_source: "synthetic",
    });
  }

  const body = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  if (!DRY) fs.writeFileSync(path.join(ROOT, rel), `${body}\n`);

  // Where T00 was empty, write the register the tenant should have had, so the
  // next run reads an authority instead of re-deriving one from names.
  if (t00Ids.size === 0) {
    const ai = rows.filter((r) => r.ai_classification === "ai_native");
    const out = [
      t00Cols.join(","),
      ...ai.map((r, i) =>
        t00Cols
          .map((c) => cell(c === "source_row" ? String(i + 2) : c === "source_file" ? "ai-control-tower/T00_ai-investment-super-template.csv" : (r[c] ?? "")))
          .join(","),
      ),
    ].join("\n");
    if (!DRY) fs.writeFileSync(t00Path, `${out}\n`);
    console.log(`  ${key}: T00 was empty — wrote ${ai.length} AI initiatives into the register`);
  }
  summary.push([key, rows.length, counts]);
}

console.log(`${"tenant".padEnd(22)} ${"lines".padStart(6)} ${"ai_native".padStart(10)} ${"ai_enabled".padStart(11)} ${"non_ai".padStart(7)}`);
for (const [k, n, c] of summary) {
  console.log(
    `${k.padEnd(22)} ${String(n).padStart(6)} ${String(c.ai_native).padStart(10)} ${String(c.ai_enabled).padStart(11)} ${String(c.non_ai).padStart(7)}`,
  );
}

const mp = "tower-standardized-v1/SYNTHETIC_MANIFEST.csv";
if (!DRY && manifest.length) {
  const existing = fs.readFileSync(path.join(ROOT, mp), "utf8").trimEnd();
  const cols = splitCsvLine(existing.split("\n")[0]);
  fs.writeFileSync(
    path.join(ROOT, mp),
    `${existing}\n${manifest.map((m) => cols.map((c) => cell(m[c] ?? "")).join(",")).join("\n")}\n`,
  );
}
console.log(`\n${manifest.length} initiative lines tagged, all recorded in SYNTHETIC_MANIFEST.csv`);

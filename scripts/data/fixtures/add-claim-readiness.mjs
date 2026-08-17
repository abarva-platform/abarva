#!/usr/bin/env node
/**
 * Ask the client why a claim is not claimable, instead of inferring it.
 *
 * The Tower evidence projector derives a claim state from which observations exist: no actual means
 * `evidence_gap`, no attestation means not claimable. That is defensible and it is also the wrong
 * place for the answer to come from.
 *
 * Sitting with a client filling in the metrics sheet, these are the questions you ask out loud:
 *
 *   - What evidence would you accept that this outcome happened?
 *   - Who has to sign it off before we can put it in front of the board?
 *   - What is stopping you claiming it today?
 *   - What would have to be true, and by when?
 *
 * None of that had a column. So the reason a claim is blocked was reconstructed downstream from the
 * shape of the data — which produces a technically accurate label (`missing actual`) and loses the
 * thing that actually moves the work forward: *the instrumentation was never funded*, or *finance
 * will not attest until the cohort definition is agreed*, or *the process owner disputes the
 * baseline*. A dashboard can tell you a field is empty. Only the client can tell you why.
 *
 * This adds six columns and populates them, so the surface can show the client's own stated reason
 * and fall back to inference only where they have not said.
 *
 *   evidence_basis            what the client accepts as proof
 *   attestation_owner         who signs it off
 *   claim_readiness           the client's own assessment
 *   claim_blocked_reason      why not today, in their words
 *   unblock_action            what has to happen
 *   unblock_target_period     by when
 *
 * Usage:
 *   node scripts/data/fixtures/add-claim-readiness.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

const NEW_COLUMNS = [
  "evidence_basis",
  "attestation_owner",
  "claim_readiness",
  "claim_blocked_reason",
  "unblock_action",
  "unblock_target_period",
];

/**
 * The reasons a real outcome claim stalls.
 *
 * Every one of these is a different conversation with a different owner, and a derived
 * "missing actual" label collapses all of them into one. That collapse is the reason this exists:
 * the state tells you a field is empty, the reason tells you who to call.
 */
const BLOCKED_REASONS = [
  {
    reason: "Instrumentation for this metric was never funded, so no post-change measurement exists.",
    action: "Fund and deploy measurement in the owning system; agree the reporting cadence.",
    owner: "Business Metric Owner",
    basis: "System-generated report from the owning platform, reconciled to the operational ledger",
  },
  {
    reason: "Finance will not attest until the comparison cohort is agreed; the current baseline mixes populations.",
    action: "Agree the cohort definition with Finance and restate the baseline on that basis.",
    owner: "Finance Business Partner",
    basis: "Finance-signed cohort definition plus a restated baseline on the same population",
  },
  {
    reason: "The process owner disputes the baseline; it was taken during a period they consider atypical.",
    action: "Re-baseline over a representative period agreed with the process owner.",
    owner: "Business Process Owner",
    basis: "Baseline drawn from a period the process owner accepts as representative",
  },
  {
    reason: "Benefit is real but not separable from two other concurrent changes in the same process.",
    action: "Agree an attribution method, or accept a shared claim across the three changes.",
    owner: "Portfolio Owner",
    basis: "Attribution method agreed in writing, or an explicit shared-claim decision",
  },
  {
    reason: "Measured improvement has not yet cleared the quality guardrail; error rates rose alongside it.",
    action: "Hold the claim until quality returns to baseline for two consecutive periods.",
    owner: "Risk / Quality Owner",
    basis: "Two consecutive periods at or better than baseline quality, alongside the outcome",
  },
  {
    reason: "Outcome is contractually attributed to the supplier, so the saving is theirs to evidence, not ours.",
    action: "Request supplier evidence under the reporting clause before claiming internally.",
    owner: "Contract Owner",
    basis: "Supplier-provided evidence pack under the contract's reporting obligation",
  },
];

const READY = {
  basis: "Finance-attested outcome reconciled to the general ledger",
  owner: "Finance Business Partner",
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
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const summary = [];

for (const tenantKey of TENANTS) {
  const file = path.join(ACTIVE, tenantKey, "current/14_metrics_outcomes.csv");
  if (!fs.existsSync(file)) continue;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const body = rows.slice(1).filter((r) => r.some((v) => v.trim()));
  const outHeader = [...header, ...NEW_COLUMNS.filter((c) => !header.includes(c))];

  const counts = {};
  const out = body.map((raw, idx) => {
    const row = Object.fromEntries(header.map((h, i) => [h, (raw[i] ?? "").trim()]));
    const status = row.value_claim_status || "baseline_only";

    // An attested outcome is claimable and needs no blocked reason. Everything else carries the
    // client's own account of what is in the way — including the measured-but-unattested case, which
    // is the most common and the most actionable.
    let readiness;
    let blocked = null;
    if (status === "attested") {
      readiness = "claimable";
    } else if (status === "measured") {
      readiness = "pending_attestation";
      blocked = BLOCKED_REASONS[idx % BLOCKED_REASONS.length];
    } else {
      readiness = "not_ready";
      blocked = BLOCKED_REASONS[(idx + 2) % BLOCKED_REASONS.length];
    }
    counts[readiness] = (counts[readiness] ?? 0) + 1;

    return {
      ...row,
      evidence_basis: blocked ? blocked.basis : READY.basis,
      attestation_owner: blocked ? blocked.owner : READY.owner,
      claim_readiness: readiness,
      claim_blocked_reason: blocked ? blocked.reason : "",
      unblock_action: blocked ? blocked.action : "",
      unblock_target_period: blocked ? (idx % 2 === 0 ? "FY2027 Q1" : "FY2027 Q2") : "",
    };
  });

  summary.push({ tenantKey, metrics: out.length, columnsAdded: outHeader.length - header.length, readiness: counts });

  if (WRITE) {
    const csv = [outHeader.join(","), ...out.map((r) => outHeader.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
    fs.writeFileSync(file, csv);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey}: ${s.metrics} metrics, +${s.columnsAdded} columns`);
  console.log(`  ${Object.entries(s.readiness).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    browserEvents: "audit-artifacts/ecl-product-live-proof/browser-operator/05-structured-events.json",
    evalEvents: "audit-artifacts/ecl-product-live-proof/eval-operator/05-structured-events.json",
    out: "audit-artifacts/ecl-product-live-proof/compact-summary.json",
    baseUrl: process.env.BASE_URL || "https://app.abarva.ai",
    tenantKey: process.env.E2E_ACTIVE_CLIENT || "meridian-health",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--browser-events") args.browserEvents = next();
    else if (arg === "--eval-events") args.evalEvents = next();
    else if (arg === "--out") args.out = next();
    else if (arg === "--base-url") args.baseUrl = next();
    else if (arg === "--tenant-key") args.tenantKey = next();
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs [options]

Options:
  --browser-events <path>  ACA operator structured-events JSON for product browser proof.
  --eval-events <path>     ACA operator structured-events JSON for aVa live ablation eval.
  --out <path>             Compact summary output path.
  --base-url <url>         Product URL under proof.
  --tenant-key <key>       Tenant key under proof.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readEvents(file) {
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${file} must contain a JSON array`);
  return parsed;
}

function eventName(event) {
  return event?.structured_event || event?.event || null;
}

function findEvent(events, name) {
  return events.find((event) => eventName(event) === name) || null;
}

const args = parseArgs(process.argv.slice(2));
const browser = findEvent(readEvents(args.browserEvents), "ecl_product_browser_smoke_summary");
const evaluation = findEvent(readEvents(args.evalEvents), "ecl_ava_consultant_eval_compact_summary");
const evalRequired = !args.tenantKey.toLowerCase().includes("skyharbor");

const compact = {
  accepted: Boolean(browser?.accepted && (!evalRequired || evaluation?.accepted)),
  checked_at: new Date().toISOString(),
  base_url: args.baseUrl,
  tenant_key: args.tenantKey,
  proof_execution: "aca_private_operator",
  default_entry_routes: browser
    ? {
        numerator: (browser.routes || []).filter((route) => route.accepted).length,
        denominator: browser.route_count,
        accepted: browser.accepted,
      }
    : null,
  named_surfaces_browser_proven: browser?.named_surfaces_browser_proven ?? null,
  findings_demonstrable_on_real_surface: browser?.findings_demonstrable_on_real_surface ?? null,
  ava_eval: evaluation
    ? {
        accepted: evaluation.accepted,
        answers_accepted: evaluation.answers_accepted,
        answers_evaluated: evaluation.answers_evaluated,
        ablation_answers_accepted: evaluation.ablation_answers_accepted,
        ablation_answers_evaluated: evaluation.ablation_answers_evaluated,
        ablation_demo_findings_accepted: evaluation.ablation_demo_findings_accepted,
        ablation_accepted: evaluation.ablation_accepted,
      }
    : {
        accepted: !evalRequired,
        status: evalRequired ? "missing" : "not_applicable",
        reason: evalRequired
          ? "required_eval_events_missing"
          : "eval_case_bank_is_scoped_to_primary_healthcare_fixture",
      },
};

fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, `${JSON.stringify(compact, null, 2)}\n`, "utf8");
console.log(JSON.stringify(compact, null, 2));

if (!compact.accepted) {
  process.exitCode = 1;
}

#!/usr/bin/env node
// Source → facts → mart delta, by layer, by tenant.
//
// Runs the mart projection twice per tenant — once as it is today (V3 tree
// only) and once with the tower-standardized-v1 T-family added — and reports
// what changes at every layer. No DB, no writes: both runs are --no-db
// --dry-run, so this is safe to run anywhere.
//
//   node scripts/tower/tower-source-to-mart-delta.mjs [--tenant <key>]
//
// The question it answers is the one that matters before a governed load:
// "if I point the projection at the complete tree, what actually changes on
// each layer, for each tenant?" — including the two defects this work exists to
// fix, `ai_tagged_spend_usd` = $0 and "No owner recorded".

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports/tower-source-to-mart-delta");

// Directory names differ between the two trees for the same tenant — that is
// the tenant-key namespace drift, and it is why this map is explicit rather
// than derived by string munging.
const TENANTS = [
  { key: "meridian-health", v3: "meridian-health", std: "meridian-health" },
  { key: "first-capital", v3: "first-capital", std: "first-capital-financial" },
  { key: "skyharbor-air", v3: "skyharbor-air", std: "skyharbor-air" },
  { key: "lakeshore-holdings", v3: null, std: "lakeshore-industries" },
  { key: "apex-retail", v3: null, std: "apex-retail" },
];

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

function v3Dir(t) {
  if (!t.v3) return null;
  const dir = path.join(
    ROOT,
    "datasets/tenant-inputs",
    t.v3,
    "standard-2026-07-v3",
  );
  return fs.existsSync(dir) ? dir : null;
}

function stdDir(t) {
  const dir = path.join(ROOT, "tower-standardized-v1", t.std);
  return fs.existsSync(dir) ? dir : null;
}

/** One projection run. Returns the parsed summary, or null if it could not run. */
function project(tenantKey, v3, std, outDir, skipV3Programs = false) {
  // The CLI parses space-separated flags, not --flag=value.
  const args = [
    "tsx",
    "src/scripts/tower/project-tower-mart.ts",
    "--tenant",
    tenantKey,
    "--v3-dir",
    v3 ?? std,
    "--dry-run",
    "--no-db",
    "--out-dir",
    outDir,
  ];
  if (std) args.push("--standardized-dir", std);
  if (skipV3Programs) args.push("--skip-v3-programs");

  const run = spawnSync("npx", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const summaryPath = path.join(outDir, "projection-summary.json");
  if (!fs.existsSync(summaryPath)) {
    return { failed: true, stderr: (run.stderr || "").slice(-600) };
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const martPath = path.join(outDir, "mart.json");
  const mart = fs.existsSync(martPath)
    ? JSON.parse(fs.readFileSync(martPath, "utf8"))
    : null;
  return { summary, mart };
}

function martShape(mart) {
  if (!mart) return null;
  const lanes = mart.program_decision_lanes ?? [];
  const portfolio = mart.ai_portfolio ?? [];
  const sum = (rows, col) =>
    rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
  return {
    lanes: lanes.length,
    portfolio: portfolio.length,
    actions: (mart.cxo_actions ?? []).length,
    evidence: (mart.evidence_lineage ?? []).length,
    gaps: (mart.required_field_gaps ?? []).length,
    // The two defects this work exists to fix.
    ai_tagged_spend_usd:
      sum(lanes, "ai_tagged_spend_usd") + sum(portfolio, "ai_tagged_spend_usd"),
    lanes_with_owner: lanes.filter((r) => r.owner_role).length,
    approved_funding_usd: sum(lanes, "approved_funding_usd"),
    promised_value_usd: sum(lanes, "promised_value_usd"),
    finance_validated_usd: sum(lanes, "finance_validated_value_usd"),
  };
}

function money(n) {
  if (!Number.isFinite(n) || n === 0) return "$0";
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

function main() {
  const only = arg("--tenant");
  const selected = only ? TENANTS.filter((t) => t.key === only) : TENANTS;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];

  for (const t of selected) {
    const v3 = v3Dir(t);
    const std = stdDir(t);
    const base = path.join(OUT_DIR, t.key);
    fs.mkdirSync(base, { recursive: true });

    const sourceRows = {};
    for (const [label, file] of [
      ["T01_initiatives", "ai-control-tower/T01_initiative-registry.csv"],
      ["T08_spend", "ai-control-tower/T08_spend-contracts.csv"],
      ["T03_tool_usage", "ai-control-tower/T03_tool-usage-monthly.csv"],
    ]) {
      const full = std ? path.join(std, file) : null;
      sourceRows[label] =
        full && fs.existsSync(full)
          ? fs.readFileSync(full, "utf8").trim().split("\n").length - 1
          : 0;
    }

    const before = v3
      ? project(t.key, v3, null, path.join(base, "before"))
      : { skipped: "no V3 packet — this tenant has no 'before' state" };
    const after = std
      ? project(t.key, v3, std, path.join(base, "after"))
      : { skipped: "no standardized packet" };
    // Third variant: T-family owns the program registry; V3 budget still
    // projects, V3 programs/use-cases do not. This is the option that removes
    // the double-count rather than merging two parallel registries forever.
    const tfamily = std
      ? project(t.key, v3, std, path.join(base, "tfamily-only"), true)
      : { skipped: "no standardized packet" };

    results.push({
      tenant: t.key,
      v3Dir: v3 ? path.relative(ROOT, v3) : null,
      stdDir: std ? path.relative(ROOT, std) : null,
      sourceRows,
      before: before.summary
        ? { facts: before.summary.merged_facts, mart: martShape(before.mart) }
        : before,
      after: after.summary
        ? {
            facts: after.summary.merged_facts,
            standardizedFacts: after.summary.standardized_facts ?? 0,
            mart: martShape(after.mart),
          }
        : after,
      tfamily: tfamily.summary
        ? { facts: tfamily.summary.merged_facts, mart: martShape(tfamily.mart) }
        : tfamily,
    });
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "delta.json"),
    JSON.stringify(results, null, 2),
  );

  // ── markdown report ──────────────────────────────────────────────────────
  const lines = [];
  lines.push("# Tower source → mart delta");
  lines.push("");
  lines.push(
    "Both runs are `--dry-run --no-db`. **Before** = the projection as it ships today (V3 tree only). " +
      "**After** = the same projection with the `tower-standardized-v1` T-family added.",
  );
  lines.push("");

  for (const r of results) {
    lines.push(`## ${r.tenant}`);
    lines.push("");
    lines.push(`- V3 packet: \`${r.v3Dir ?? "none"}\``);
    lines.push(`- Standardized packet: \`${r.stdDir ?? "none"}\``);
    lines.push("");
    lines.push("### Layer 1 — source rows read");
    lines.push("");
    lines.push("| File | Rows |");
    lines.push("| --- | ---: |");
    for (const [k, v] of Object.entries(r.sourceRows)) {
      lines.push(`| \`${k}\` | ${v} |`);
    }
    lines.push("");

    if (!r.after.mart) {
      lines.push(
        `> Could not project: ${r.after.skipped ?? r.after.stderr ?? "unknown"}`,
      );
      lines.push("");
      continue;
    }

    const b = r.before.mart;
    const a = r.after.mart;
    lines.push("### Layers 2–3 — facts and mart");
    lines.push("");
    const c = r.tfamily?.mart ?? null;
    lines.push("| Layer | Today (V3 only) | Additive (V3 + T) | T-family owns programs |");
    lines.push("| --- | ---: | ---: | ---: |");
    lines.push(
      `| canonical facts (merged) | ${r.before.facts ?? "—"} | ${r.after.facts} | ${r.tfamily?.facts ?? "—"} |`,
    );
    const cell = (k) => `${b ? b[k] : "—"} | ${a[k]} | ${c ? c[k] : "—"}`;
    lines.push(`| mart decision lanes | ${cell("lanes")} |`);
    lines.push(`| mart AI portfolio | ${cell("portfolio")} |`);
    lines.push(`| mart evidence lineage | ${cell("evidence")} |`);
    lines.push(`| mart required-field gaps | ${cell("gaps")} |`);
    lines.push("");
    lines.push("### The two defects");
    lines.push("");
    lines.push("| Measure | Today (V3 only) | Additive (V3 + T) | T-family owns programs |");
    lines.push("| --- | ---: | ---: | ---: |");
    const m = (k) =>
      `${money(b?.[k] ?? 0)} | ${money(a[k])} | ${c ? money(c[k]) : "—"}`;
    lines.push(`| \`ai_tagged_spend_usd\` | ${m("ai_tagged_spend_usd")} |`);
    lines.push(
      `| lanes with an owner | ${b ? `${b.lanes_with_owner}/${b.lanes}` : "—"} | ${a.lanes_with_owner}/${a.lanes} | ${c ? `${c.lanes_with_owner}/${c.lanes}` : "—"} |`,
    );
    lines.push(`| approved funding | ${m("approved_funding_usd")} |`);
    lines.push(`| promised value | ${m("promised_value_usd")} |`);
    lines.push(`| finance-validated | ${m("finance_validated_usd")} |`);
    lines.push("");
  }

  const md = lines.join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "delta.md"), md);
  console.log(md);
  console.log(`\nWritten to ${path.relative(ROOT, OUT_DIR)}/`);
}

main();

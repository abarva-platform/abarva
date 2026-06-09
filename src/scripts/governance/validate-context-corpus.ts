// =============================================================================
// Context & Corpus Governance — CI validators (PR-4, the hard gate)
// -----------------------------------------------------------------------------
// Static, DB-free enforcement that runs in CI (which cannot reach the private
// Azure DB). Live coverage/readiness checks are produced by the ACA-job reports
// (PR-2 inventory, PR-3 backfill, PR-6 coverage). This gate stops a *future*
// change — from ANY agent (Codex or Claude Code) — from quietly weakening the
// governance contract. It exits non-zero on any failure.
//
// Subcommands (default: all):
//   exceptions      — policy-exceptions.json: no expired/malformed/duplicate/
//                     non-canonical entries (CI-enforced expiry).
//   tenant-coverage — governance code derives tenants from CANONICAL_TENANT_KEYS;
//                     no hand-typed tenant lists.
//   agent-readiness — no runtime code mints agent_ready without routing through
//                     the policy contract (evaluateGovernedObject).
//   duplicates      — the canonical enums are defined exactly once.
//
//   npx tsx src/scripts/governance/validate-context-corpus.ts [subcommand]
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { validateExceptions } from "@/lib/governance/policy-exceptions";
import { validateManifest } from "@/lib/governance/dataset-manifest";

const ROOT = process.cwd();
const POLICY_FILE = "src/lib/governance/context-corpus-policy.ts";
const EXCEPTIONS_FILE = "docs/governance/policy-exceptions.json";
const MANIFESTS_DIR = "docs/governance/dataset-manifests";

function today(): string {
  // CI runs on a real clock; a plain script (not a Workflow) may use Date.
  return new Date().toISOString().slice(0, 10);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

type Check = { name: string; errors: string[]; warnings: string[] };

function checkExceptions(): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const p = path.join(ROOT, EXCEPTIONS_FILE);
  if (!fs.existsSync(p)) {
    errors.push(`${EXCEPTIONS_FILE} is missing`);
    return { name: "exceptions", errors, warnings };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    errors.push(
      `${EXCEPTIONS_FILE} is not valid JSON: ${(e as Error).message}`,
    );
    return { name: "exceptions", errors, warnings };
  }
  const v = validateExceptions(raw, today());
  errors.push(...v.errors);
  warnings.push(...v.warnings);
  return { name: "exceptions", errors, warnings };
}

function checkTenantCoverage(): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const govDir = path.join(ROOT, "src/lib/governance");
  const files = fs.existsSync(govDir) ? walk(govDir) : [];
  // A hand-typed canonical tenant list (the exact anti-pattern) — every
  // governance module must derive from CANONICAL_TENANT_KEYS instead.
  const handTyped =
    /\[\s*["'](apex-retail|meridian-health|northstar-clinical|first-capital|skyharbor-air|lakeshore-holdings)["']/;
  for (const f of files) {
    if (f.includes("__tests__")) continue;
    const src = fs.readFileSync(f, "utf8");
    if (handTyped.test(src)) {
      errors.push(
        `${path.relative(ROOT, f)} hand-types canonical tenant keys — import CANONICAL_TENANT_KEYS instead`,
      );
    }
  }
  return { name: "tenant-coverage", errors, warnings };
}

function checkAgentReadiness(): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const srcDir = path.join(ROOT, "src");
  const files = walk(srcDir);
  // Allowlist: the contract itself, the readiness tooling, tests, and the
  // exceptions module legitimately reference the agent_ready literal.
  const allow = [
    "src/lib/governance/",
    "/__tests__/",
    "src/scripts/governance/",
  ];
  const assignsReady =
    /agent_readiness_status\s*[:=]\s*["']agent_ready["']|["']agent_ready["']\s*as\s+const/;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    if (allow.some((a) => `${path.sep}${rel}`.replace(/\\/g, "/").includes(a)))
      continue;
    const src = fs.readFileSync(f, "utf8");
    if (assignsReady.test(src)) {
      const routes =
        /evaluateGovernedObject|buildValidatedAgentContextBundle|isAgentUsable/.test(
          src,
        );
      if (!routes) {
        errors.push(
          `${rel} mints agent_ready without routing through the policy contract (evaluateGovernedObject / buildValidatedAgentContextBundle)`,
        );
      }
    }
  }
  return { name: "agent-readiness", errors, warnings };
}

function checkDuplicates(): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const enums = [
    "AGENT_READINESS",
    "RETRIEVABILITY",
    "CLASSIFICATIONS",
    "SOURCE_LAYERS",
  ];
  const files = walk(path.join(ROOT, "src"));
  for (const name of enums) {
    const re = new RegExp(`export const ${name}\\s*=`);
    const defs = files.filter((f) => re.test(fs.readFileSync(f, "utf8")));
    if (defs.length > 1) {
      errors.push(
        `enum ${name} is defined ${defs.length}× (${defs
          .map((d) => path.relative(ROOT, d))
          .join(", ")}) — it must live only in ${POLICY_FILE}`,
      );
    }
  }
  return { name: "duplicates", errors, warnings };
}

function checkManifests(): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dir = path.join(ROOT, MANIFESTS_DIR);
  if (!fs.existsSync(dir)) {
    // No registry yet — nothing to validate. PR-8 seeds the dir + template.
    return { name: "manifests", errors, warnings };
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  for (const f of files) {
    const p = path.join(dir, f);
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      errors.push(
        `${MANIFESTS_DIR}/${f}: invalid JSON: ${(e as Error).message}`,
      );
      continue;
    }
    const v = validateManifest(raw);
    errors.push(...v.errors.map((e) => `${f}: ${e}`));
    warnings.push(...v.warnings.map((w) => `${f}: ${w}`));
  }
  return { name: "manifests", errors, warnings };
}

const CHECKS: Record<string, () => Check> = {
  exceptions: checkExceptions,
  "tenant-coverage": checkTenantCoverage,
  "agent-readiness": checkAgentReadiness,
  duplicates: checkDuplicates,
  manifests: checkManifests,
};

function main(): void {
  const sub = process.argv[2] ?? "all";
  const toRun =
    sub === "all" ? Object.keys(CHECKS) : sub in CHECKS ? [sub] : null;
  if (!toRun) {
    console.error(
      `unknown subcommand "${sub}". Use one of: all, ${Object.keys(CHECKS).join(", ")}`,
    );
    process.exit(2);
  }

  let failed = false;
  for (const name of toRun) {
    const r = CHECKS[name]();
    for (const w of r.warnings) console.warn(`  ⚠ [${name}] ${w}`);
    if (r.errors.length > 0) {
      failed = true;
      for (const e of r.errors) console.error(`  ✖ [${name}] ${e}`);
    } else {
      console.log(`  ✓ [${name}] passed`);
    }
  }

  if (failed) {
    console.error("\nContext & Corpus governance gate FAILED.");
    process.exit(1);
  }
  console.log("\nContext & Corpus governance gate passed.");
}

main();

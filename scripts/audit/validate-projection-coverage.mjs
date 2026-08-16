#!/usr/bin/env node

/**
 * Projection coverage gate.
 *
 * Checks the projector registry against the canonical model and reports what does not reach a
 * product. This is the check whose absence let a real gap sit unnoticed: `spend_value_fact` —
 * the client's own declared spend — is produced on every refresh and consumed by no projector,
 * while Tower answers spend questions from metered cloud cost through a separate pipeline.
 * Neither number is wrong. Nothing declared which one a surface used, and nothing failed.
 *
 * Two things are verified:
 *
 *   1. The registry is honest about the canonical model. Every type the registry claims to
 *      consume must actually be emitted by the canonical build, and every type the build emits
 *      must be known to the registry. A drift in either direction is a defect: a projector
 *      consuming a type that no longer exists is dead, and a new type nobody registered is
 *      invisible.
 *
 *   2. Coverage is reported, not assumed. Uncovered types and off-spine surfaces are listed
 *      explicitly so the gap is a number in CI rather than a thing someone remembers.
 *
 * Modes:
 *   default    report coverage; fail only on registry drift (safe to adopt today)
 *   --strict   additionally fail when any canonical type has no consumer (the target state)
 *
 * The default is deliberately not --strict. Turning the gate on at full strength today would
 * fail the build for a gap that is already known and is being closed deliberately; a gate that
 * fails for a reason nobody can act on immediately gets muted, and a muted gate protects
 * nothing. --strict becomes the default once the spine work lands.
 *
 * Usage:
 *   node scripts/audit/validate-projection-coverage.mjs [--strict] [--json]
 */

import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");
const AS_JSON = process.argv.includes("--json");

/** Load the registry through tsx so the TypeScript source stays the single definition. */
function loadRegistry() {
  const script = `
    import { PROJECTOR_REGISTRY, CANONICAL_OBJECT_TYPES, summariseCoverage } from ${JSON.stringify(
      path.join(ROOT, "src/lib/enterprise-data/projection/projector-registry.ts"),
    )};
    process.stdout.write(JSON.stringify({
      registry: PROJECTOR_REGISTRY,
      declaredTypes: CANONICAL_OBJECT_TYPES,
      summary: summariseCoverage(),
    }));
  `;
  const out = execFileSync("npx", ["tsx", "-e", script], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 26,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

/**
 * The types the canonical build can actually emit, read from its source rather than from a
 * duplicated list. If this ever stops matching the registry, one of them has drifted.
 */
function emittedTypesFromBuild() {
  const buildFile = path.join(
    ROOT,
    "src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts",
  );
  const src = execFileSync("cat", [buildFile], { encoding: "utf8", maxBuffer: 1 << 26 });
  const found = new Set();
  for (const m of src.matchAll(/objectType:\s*"([a-z_]+)"/g)) found.add(m[1]);
  return [...found].sort();
}

const { registry, declaredTypes, summary } = loadRegistry();
const emitted = emittedTypesFromBuild();

const failures = [];

// 1. registry drift — both directions
const declaredSet = new Set(declaredTypes);
const emittedSet = new Set(emitted);
for (const type of emitted) {
  if (!declaredSet.has(type)) {
    failures.push(
      `canonical build emits "${type}" but the registry does not declare it — add it to CANONICAL_OBJECT_TYPES and decide which projector consumes it`,
    );
  }
}
for (const type of declaredTypes) {
  if (!emittedSet.has(type)) {
    failures.push(
      `registry declares "${type}" but the canonical build no longer emits it — remove it, or the projectors consuming it are dead`,
    );
  }
}
for (const projector of registry) {
  for (const type of projector.consumes) {
    if (!emittedSet.has(type)) {
      failures.push(`projector "${projector.id}" consumes "${type}", which the build does not emit`);
    }
  }
  if (projector.input === "canonical" && projector.consumes.length === 0) {
    failures.push(`projector "${projector.id}" reads canonical but declares no consumed types`);
  }
}

// 2. coverage — reported always, enforced under --strict
const strictFailures = [];
if (summary.uncovered.length > 0) {
  strictFailures.push(
    `${summary.uncovered.length} canonical type(s) reach no product: ${summary.uncovered.join(", ")}`,
  );
}
if (summary.surfacesOffSpine.length > 0) {
  strictFailures.push(
    `${summary.surfacesOffSpine.length} product surface(s) have no projector reading canonical: ${summary.surfacesOffSpine.join(", ")}`,
  );
}

if (AS_JSON) {
  console.log(JSON.stringify({ summary, registry, failures, strictFailures }, null, 2));
} else {
  console.log("projection coverage");
  console.log(`  canonical types      : ${summary.canonicalTypeCount}`);
  console.log(`  reaching a product   : ${summary.coveredTypeCount}  (${summary.coveragePercent}%)`);
  console.log(`  surfaces on spine    : ${summary.surfacesOnSpine.join(", ") || "none"}`);
  console.log(`  surfaces off spine   : ${summary.surfacesOffSpine.join(", ") || "none"}`);

  if (summary.parallelProjectors.length) {
    console.log("\n  projectors reading a parallel store (working, but not fed by the spine):");
    for (const p of summary.parallelProjectors) {
      console.log(`    - ${p.id} -> ${p.parallelStore}`);
      console.log(`      ${p.note}`);
    }
  }

  if (summary.uncovered.length) {
    console.log(`\n  canonical types reaching no product (${summary.uncovered.length}):`);
    for (const type of summary.uncovered) console.log(`    - ${type}`);
  }

  if (failures.length) {
    console.log(`\nREGISTRY DRIFT (${failures.length}):`);
    for (const f of failures) console.log(`  - ${f}`);
  }
  if (STRICT && strictFailures.length) {
    console.log(`\nCOVERAGE FAILURES (--strict):`);
    for (const f of strictFailures) console.log(`  - ${f}`);
  }
}

if (failures.length > 0 || (STRICT && strictFailures.length > 0)) {
  if (!AS_JSON) console.log("\nFAIL");
  process.exit(1);
}
if (!AS_JSON) {
  console.log(
    strictFailures.length
      ? "\npass — registry is consistent with the canonical build. Coverage gaps above are reported, not enforced; run with --strict to enforce."
      : "\npass — registry consistent and every canonical type reaches a product.",
  );
}

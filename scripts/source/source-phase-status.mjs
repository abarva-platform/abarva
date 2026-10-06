#!/usr/bin/env node
/**
 * Phase status for the Source sourcing-event journey, measured from the tree.
 *
 * Every number printed is a count of files or declarations that exist right
 * now. Nothing here is an estimate, a percentage, or a judgement about how
 * nearly done something is — those are the figures that drift away from the
 * code and then get quoted in a status meeting.
 *
 * The probes run against a git ref (default `origin/main`), so the answer is
 * about a named commit rather than whatever happens to be in a working tree.
 *
 * Usage:
 *   node scripts/source/source-phase-status.mjs            # origin/main
 *   node scripts/source/source-phase-status.mjs --ref HEAD
 *   node scripts/source/source-phase-status.mjs --json
 */
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const refIndex = argv.indexOf("--ref");
const REF = refIndex >= 0 ? argv[refIndex + 1] : "origin/main";
const AS_JSON = argv.includes("--json");

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // git grep exits 1 when it matches nothing. That is an answer, not a fault.
    if (error.status === 1 && typeof error.stdout === "string") return error.stdout;
    throw error;
  }
}

const lines = (out) => out.split("\n").filter((line) => line.trim().length > 0);

/** Files matching a pattern, excluding tests. */
function files(pattern, paths) {
  const out = git(["grep", "-lEi", pattern, REF, "--", ...paths]);
  return lines(out).filter((line) => !/test|__tests__|\.spec\./.test(line));
}

/** Distinct declarations matching a pattern. */
function declarations(pattern, paths) {
  const out = git(["grep", "-hoEi", pattern, REF, "--", ...paths]);
  return [...new Set(lines(out))];
}

function tree(paths) {
  return lines(git(["ls-tree", "-r", "--name-only", REF, "--", ...paths]));
}

const MIGRATIONS = ["supabase/migrations/*.sql"];
const SRC = ["src/*"];

// ── controls ───────────────────────────────────────────────────────────────
// A probe that cannot fire reports zero for everything, and a report of all
// zeros reads exactly like a product that was never built. These run first and
// the script refuses to print a board if they disagree with reality.
const controls = [
  {
    name: "source.vendor is declared",
    expect: "non-zero",
    value: files("source\\.vendor", MIGRATIONS).length,
  },
  {
    name: "executed-NDA writer exists",
    expect: "non-zero",
    value: files("into source_executed_nda_authority", SRC).length,
  },
  {
    name: "a nonsense pattern matches nothing",
    expect: "zero",
    value: files("zzz_not_a_real_capability_xyzzy", SRC).length,
  },
];

const controlsHeld = controls.every((control) =>
  control.expect === "zero" ? control.value === 0 : control.value > 0,
);

// ── phases ─────────────────────────────────────────────────────────────────
const phases = [
  {
    code: "R0",
    name: "Request",
    probes: {
      "intake tables": declarations(
        "create table (if not exists )?source\\.intake_request[a-z_]*",
        MIGRATIONS,
      ).length,
      "request loaders": tree(["scripts/source"]).filter((f) => /servicenow/i.test(f)).length,
    },
  },
  {
    code: "S1",
    name: "Define",
    probes: {
      "scope artifacts": declarations("d0[56]_(scope_memo|excl_log)", ["src/lib/source/*"]).length,
      // Anchored to the index name, which exists only if the columns do.
      // `accepted_by_user_id` alone also matches two authority tables that
      // have nothing to do with evidence state.
      "evidence acceptance actor": files(
        "source_event_evidence_states_accepted_idx",
        MIGRATIONS,
      ).length,
    },
  },
  {
    code: "S2",
    name: "Suppliers & NDA",
    probes: {
      "candidate accept route": tree(["src/app/api/v1/source"]).filter((f) =>
        /candidate-suppliers\/accept\/route\.ts$/.test(f),
      ).length,
      "prospective supplier write": files("insert into source\\.vendor[ (]", SRC).length,
      "NDA template writer": files("into source_nda_template_versions", SRC).length,
      "executed NDA writer": files("into source_executed_nda_authority", SRC).length,
      "e-signature modules": tree(["src/lib/source/esign"]).filter((f) => !/test/.test(f)).length,
    },
  },
  {
    code: "S3",
    name: "Market & Respond",
    probes: {
      "release write paths": files(
        "into source_event_rfx_(package_version|contact_authority)",
        SRC,
      ).length,
      "rfx-release routes": tree(["src/app/api/v1/source"]).filter((f) =>
        /rfx-release\/.*route\.ts$/.test(f),
      ).length,
      "release shown on the event page": files("release-state-view", ["src/app/*"]).length,
    },
  },
  {
    code: "S4",
    name: "Decide",
    probes: {
      "award tables": declarations(
        "create table (if not exists )?[a-z_.]*award[a-z_]*",
        MIGRATIONS,
      ).length,
      "contract writers outside loaders": files("insert into source\\.contract[ (]", SRC).length,
    },
  },
  {
    code: "S5",
    name: "Realise",
    probes: {
      "finance realization tables": declarations(
        "create table (if not exists )?source\\.finance_realization[a-z_]*",
        MIGRATIONS,
      ).length,
    },
  },
];

const readinessSteps = declarations('step: "[a-z_]+"', [
  "src/lib/source/new-workspace/step-readiness-adapter.ts",
]).length;

const head = lines(git(["log", "-1", "--format=%h %ci", REF]))[0] ?? REF;

if (AS_JSON) {
  console.log(
    JSON.stringify({ ref: REF, head, controlsHeld, controls, phases, readinessSteps }, null, 2),
  );
} else {
  console.log(`Source phase status — ${REF} at ${head}\n`);
  console.log("CONTROLS");
  for (const control of controls) {
    const held = control.expect === "zero" ? control.value === 0 : control.value > 0;
    console.log(`  ${held ? "ok  " : "FAIL"}  ${control.name} (${control.value}, want ${control.expect})`);
  }
  if (!controlsHeld) {
    console.error(
      "\nA control disagreed with reality, so every count below would be meaningless. Fix the probes before reading this as status.",
    );
    process.exit(1);
  }
  console.log("\nPHASES");
  for (const phase of phases) {
    console.log(`  ${phase.code} ${phase.name}`);
    for (const [label, value] of Object.entries(phase.probes)) {
      console.log(`      ${value === 0 ? "—" : String(value).padStart(2)}  ${label}`);
    }
  }
  console.log(`\nREADINESS MODEL\n      ${readinessSteps}  of 4 steps the workspace can report on`);
  console.log(
    "\nA dash is a measured zero, not an unknown. It means no file in the tree declares that capability.",
  );
}

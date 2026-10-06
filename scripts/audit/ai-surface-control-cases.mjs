#!/usr/bin/env node
/**
 * Does the suite credited with a control still contain the case that proves it?
 * (item C-554)
 *
 * `scripts/audit/ai-surface-control-catalog.mjs` checks a declared behavioral
 * test hard — the path exists, the catalog workflow runs it, and the name
 * filter the workflow uses is the one the catalog declares. What it never did
 * was look inside the suite. Coverage was credited **per control kind** from a
 * **file**, so a suite named by four kinds earned four credits whatever it
 * actually exercised.
 *
 * Measured on `912a1c593c` before this existed: 10 test files carried 25 of the
 * 35 reachable credits, and the worst case was a 61-case general suite
 * (`src/components/agent/__tests__/AgentDock.test.tsx`) credited for two kinds.
 * Deleting the one case that proves one of them —
 * `renders the persistent AI responsibility footer`, the only proof of
 * `agent-dock-chat-turns/responsibility-footer` — left the suite green at 60
 * cases and left the gate green at exit 0, still reporting that control covered
 * inside "35 of 35 (100%)". Nothing anywhere went red. That is the founding
 * defect of this whole programme in a new dress: a control proved by a name
 * rather than by something that runs.
 *
 * So each credited control now declares `provenCases`: the exact jest case
 * names that prove that kind, and this script reconciles them against the
 * suites themselves.
 *
 * ## Why jest's own output, and not a scan of the test file
 *
 * A case name is a runtime value. It can be built from a template literal, a
 * `describe.each` table, a loop variable, or a constant imported from another
 * module — four shapes a grep reads wrong in both directions, and one of them
 * (`describe.each`) is already used by the surfaces in this catalog. Reading
 * the names back from `jest --json` asks jest what it ran, which is the only
 * authority on the question, and it carries each case's **status** as well, so
 * a case that was renamed, deleted, skipped or marked `todo` is a failure
 * rather than a silence.
 *
 * All 23 credited suites run in one invocation in a few seconds, so this is a
 * single jest boot and not 23.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { isDirectInvocation } from "../exec/cli-entry.mjs";

export const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";

/**
 * Every control that names a behavioral test path, with the cases it claims
 * prove it. Derived from the catalog rather than hand-listed anywhere, so a new
 * surface is covered by this check the moment it is catalogued.
 */
export function collectCreditedControls(catalog) {
  const credited = [];
  for (const surface of catalog?.controls ?? []) {
    for (const control of surface?.requiredControls ?? []) {
      const declared = control?.behavioralTest;
      if (!declared || typeof declared.path !== "string" || !declared.path.trim()) continue;
      credited.push({
        label: `${surface.id}/${control.kind}`,
        surfaceId: surface.id,
        kind: control.kind,
        suite: declared.path,
        provenCases: declared.provenCases,
      });
    }
  }
  return credited;
}

/**
 * Reconcile the declared cases against what jest reported.
 *
 * `suiteResults` maps a repository-relative suite path to the cases jest ran in
 * it, as `{ fullName, status }`. Kept as a pure function of that map so the
 * behavioural test can drive every branch — including the ones a healthy
 * repository cannot produce — without booting jest.
 */
export function reconcileProvenCases(catalog, suiteResults) {
  const problems = [];

  for (const control of collectCreditedControls(catalog)) {
    const declared = control.provenCases;
    if (!Array.isArray(declared) || declared.length === 0) {
      problems.push(
        `${control.label}: credits ${control.suite} but declares no provenCases — name the case(s) in that suite which prove this control, or the credit is a claim about a file rather than about a control`,
      );
      continue;
    }

    const ran = suiteResults.get(control.suite);
    if (!ran) {
      problems.push(
        `${control.label}: ${control.suite} reported no cases at all — a suite that runs nothing proves nothing`,
      );
      continue;
    }

    const byName = new Map(ran.map((entry) => [entry.fullName, entry.status]));
    for (const caseName of declared) {
      if (typeof caseName !== "string" || !caseName.trim()) {
        problems.push(`${control.label}: provenCases must be non-empty case names`);
        continue;
      }
      const status = byName.get(caseName);
      if (status === undefined) {
        problems.push(
          `${control.label}: ${control.suite} ran no case named "${caseName}" — it was renamed or removed, and this control's proof went with it. jest ran ${ran.length} case(s) in that suite.`,
        );
        continue;
      }
      if (status !== "passed") {
        problems.push(
          `${control.label}: "${caseName}" reported ${status} rather than passed — a skipped or failing case is not proof`,
        );
      }
    }
  }

  return problems;
}

/**
 * Two kinds on one surface must not point at the same case.
 *
 * Without this, the cheapest way to satisfy the check is to name one case under
 * every kind the surface declares, which restores exactly the overstatement
 * this item exists to remove: four credits earned by one assertion. A case that
 * genuinely evidences two kinds is rare, and the honest answer there is a
 * second case asserting the second kind — not one case sold twice.
 */
export function findSharedProvenCases(catalog) {
  const problems = [];
  for (const surface of catalog?.controls ?? []) {
    const owner = new Map();
    for (const control of surface?.requiredControls ?? []) {
      const declared = control?.behavioralTest?.provenCases;
      if (!Array.isArray(declared)) continue;
      for (const caseName of declared) {
        if (typeof caseName !== "string") continue;
        const previous = owner.get(caseName);
        if (previous) {
          problems.push(
            `${surface.id}: "${caseName}" is declared as proof of both ${previous} and ${control.kind} — one case cannot be the proof of two different controls`,
          );
          continue;
        }
        owner.set(caseName, control.kind);
      }
    }
  }
  return problems;
}

/**
 * Ask jest what it ran. Returns the same `Map` shape `reconcileProvenCases`
 * consumes.
 *
 * jest exits non-zero when a case fails, and its report is the thing this needs
 * most in that situation, so the exit status is deliberately not treated as
 * fatal here — a failing case is reported by name below instead of collapsing
 * into "jest exited 1".
 */
export function runCreditedSuites(suites, { cwd = process.cwd() } = {}) {
  const outputFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "control-case-proof-")),
    "jest.json",
  );
  try {
    execFileSync(
      "npx",
      ["jest", "--runTestsByPath", ...suites, "--silent", "--json", `--outputFile=${outputFile}`],
      { cwd, stdio: ["ignore", "ignore", "inherit"] },
    );
  } catch {
    // Reported per case below.
  }

  if (!fs.existsSync(outputFile)) {
    throw new Error(
      `jest wrote no report to ${outputFile} — it failed before running any suite, so nothing about these controls can be concluded`,
    );
  }

  const report = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  const results = new Map();
  for (const suite of report.testResults ?? []) {
    const relative = path.relative(cwd, suite.name);
    results.set(
      relative,
      (suite.assertionResults ?? []).map((assertion) => ({
        fullName: assertion.fullName,
        status: assertion.status,
      })),
    );
  }
  return results;
}

function main() {
  const cwd = process.cwd();
  const catalog = JSON.parse(fs.readFileSync(path.join(cwd, CATALOG_REL), "utf8"));
  const credited = collectCreditedControls(catalog);
  const suites = [...new Set(credited.map((control) => control.suite))].sort();

  if (suites.length === 0) {
    console.error(
      `No control in ${CATALOG_REL} names a behavioral test path. That is either a catalog with no coverage at all or a reader that stopped working; neither is a pass.`,
    );
    process.exit(1);
  }

  const suiteResults = runCreditedSuites(suites, { cwd });
  const problems = [
    ...findSharedProvenCases(catalog),
    ...reconcileProvenCases(catalog, suiteResults),
  ];

  if (problems.length > 0) {
    console.error(
      `AI surface control case proof failed — ${problems.length} problem(s) across ${suites.length} suite(s):`,
    );
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }

  const cases = credited.reduce((total, control) => total + control.provenCases.length, 0);
  console.log(
    `AI surface control case proof passed: ${credited.length} credited control(s) name ${cases} case(s) across ${suites.length} suite(s), and jest ran and passed every one.`,
  );
}

if (isDirectInvocation(import.meta.url)) {
  main();
}

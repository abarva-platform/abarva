#!/usr/bin/env node
/**
 * SEC-P0 probe verdict emitter · item C-628.
 *
 * The cross-tenant probe suite has always distinguished its outcomes by exit
 * code — 0 clean, 1 leak, 2 misconfigured — and nothing read the distinction.
 * GitHub reports a job as `failure` for the second and the third alike, so a
 * run that could not reach its targets was indistinguishable, in the run list,
 * from one that probed and found a boundary open — and the unresolved-config
 * path is the path these runs take, so neither state got acted on. Run ids and
 * the measured history are in the internal execution register.
 *
 * So this module is the one place that turns an exit code into a named
 * verdict and emits it where it can be read without opening the logs:
 *
 *   - `SEC-P0 VERDICT: <TOKEN>` on stdout, one line, machine-readable
 *   - a GitHub annotation whose TITLE differs per verdict
 *   - the same verdict in `$GITHUB_STEP_SUMMARY`
 *   - `verdict` / `severity` on `$GITHUB_OUTPUT` for later steps
 *
 * It does not change the exit contract. A misconfigured run still exits 2 and
 * is still red, because a security control that did not run must be loud; what
 * changes is that it no longer looks like a leak.
 *
 * Usage:
 *   node scripts/security/sec-p0-probe-verdict.mjs --run
 *       spawn the suite and emit the verdict for whatever it exits with
 *   node scripts/security/sec-p0-probe-verdict.mjs --from-exit <n> [--detail <s>]
 *       emit the verdict for an exit code produced elsewhere
 */

import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_ROOT, "..", "..");
export const SUITE_PATH = "tests/security/sec-p0-cross-tenant-probes.sh";

/**
 * The verdict table. Tokens, titles and severities are pairwise distinct on
 * purpose: a test asserts that, because the whole defect was two different
 * outcomes wearing one appearance.
 */
export const VERDICTS = {
  PROBES_CLEAN: {
    verdict: "PROBES_CLEAN",
    severity: "clean",
    annotation: "notice",
    title: "SEC-P0 PROBES CLEAN",
    headline: "All cross-tenant probes ran and returned a refusal.",
  },
  CROSS_TENANT_LEAK: {
    verdict: "CROSS_TENANT_LEAK",
    severity: "incident",
    annotation: "error",
    title: "SEC-P0 CROSS-TENANT LEAK",
    headline:
      "A probe reached another tenant's data. This is a P0 incident: page the founder and stop any deployment in progress.",
  },
  NOT_RUN_CONFIG_UNRESOLVED: {
    verdict: "NOT_RUN_CONFIG_UNRESOLVED",
    severity: "not_run",
    annotation: "error",
    title: "SEC-P0 NOT RUN — targets unresolved",
    headline:
      "No probe executed. The suite could not resolve its target or its caller identity, so this run is evidence of nothing — it is NOT a cross-tenant finding.",
  },
  NOT_RUN_HARNESS_ERROR: {
    verdict: "NOT_RUN_HARNESS_ERROR",
    severity: "not_run",
    annotation: "error",
    title: "SEC-P0 NOT RUN — harness error",
    headline:
      "The suite exited with a code outside its documented contract, so no probe verdict exists. This run is NOT a cross-tenant finding.",
  },
};

/** Map the suite's documented exit contract onto a verdict. */
export function verdictForExit(code) {
  if (code === 0) return VERDICTS.PROBES_CLEAN;
  if (code === 1) return VERDICTS.CROSS_TENANT_LEAK;
  if (code === 2) return VERDICTS.NOT_RUN_CONFIG_UNRESOLVED;
  return VERDICTS.NOT_RUN_HARNESS_ERROR;
}

function appendTo(variable, body) {
  const target = process.env[variable];
  if (!target) return;
  try {
    appendFileSync(target, body);
  } catch {
    // A missing summary file must never turn a clean probe run red.
  }
}

export function emit(code, detail = "") {
  const chosen = verdictForExit(code);
  const suffix = detail ? ` ${detail}` : "";

  // One line, one grep. Everything downstream reads this.
  process.stdout.write(`SEC-P0 VERDICT: ${chosen.verdict}\n`);
  process.stdout.write(`SEC-P0 SEVERITY: ${chosen.severity}\n`);
  process.stdout.write(`SEC-P0 EXIT: ${code}\n`);
  process.stdout.write(
    `::${chosen.annotation} title=${chosen.title}::${chosen.headline}${suffix}\n`,
  );

  appendTo(
    "GITHUB_STEP_SUMMARY",
    [
      `### SEC-P0 cross-tenant probes — ${chosen.verdict}`,
      "",
      `- **Verdict:** \`${chosen.verdict}\``,
      `- **Severity:** \`${chosen.severity}\``,
      `- **Suite exit:** \`${code}\``,
      "",
      `${chosen.headline}${suffix}`,
      "",
    ].join("\n"),
  );

  appendTo(
    "GITHUB_OUTPUT",
    `verdict=${chosen.verdict}\nseverity=${chosen.severity}\nsuite_exit=${code}\n`,
  );

  return chosen;
}

function valueAfter(flag, argv) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function main(argv) {
  const detail = valueAfter("--detail", argv) ?? "";

  if (argv.includes("--run")) {
    const result = spawnSync("bash", [SUITE_PATH], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "inherit", "inherit"],
    });
    // A signalled child has no exit code; that is a harness error, not a leak.
    const code = result.status === null ? 99 : result.status;
    emit(code, detail);
    process.exit(code);
  }

  const raw = valueAfter("--from-exit", argv);
  if (raw === undefined) {
    process.stderr.write(
      "usage: sec-p0-probe-verdict.mjs --run | --from-exit <n> [--detail <s>]\n",
    );
    process.exit(64);
  }

  const code = Number.parseInt(raw, 10);
  if (!Number.isInteger(code)) {
    emit(99, `Unreadable exit code: ${raw}`);
    process.exit(99);
  }

  emit(code, detail);
  process.exit(code);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}

#!/usr/bin/env node
/**
 * A workflow step may name an individual test suite by path only if the job
 * hosting that step is a required status check on `main`.
 *
 * Backlog item T-595. Three suites in `src/__tests__/behaviors` were named by
 * exact path in `unit-suites.yml` and `integration-suites.yml` while the job
 * that blocks a merge — `Behavior coverage floor` — ran all of them anonymously
 * inside a directory sweep. Nothing was unprotected: every one of them blocked
 * a merge through the floor. What was wrong is subtler and worse for a reader.
 * The *named, quotable* line in the log belonged to a check that cannot block a
 * merge, and the merge-blocking run had no name to quote. Closure notes then
 * quoted the named step as CI proof, which is how a true sentence about a real
 * run becomes false evidence about what gates the repository.
 *
 * So the rule is not "do not duplicate a suite". Duplication is cheap and
 * sometimes deliberate — `coverage-threshold.yml` names two AgentDock suites
 * that the catalog's directory step runs again, 1.8 seconds for 63 tests, kept
 * on purpose and recorded in docs/ci/README-suite-wiring.md. Both of those runs
 * are inside required jobs, so either is honest to quote. The rule is about
 * WHERE the name lives.
 *
 * A violation, precisely: a step in a NON-required job names a test file by
 * path, and that file lies inside a directory that a REQUIRED job sweeps. A
 * suite that only a non-required job runs is not a violation — naming it there
 * is how it runs at all, and this control is not a lever for making every
 * workflow required.
 *
 * Requiredness is not derivable from any file in this repository; it lives in
 * GitHub repository settings. docs/ci/required-status-checks.json mirrors it.
 * A mirror can go stale, so this control narrows the gap from both sides:
 *   - every mirrored context must name a real job in .github/workflows, so a
 *     context that was renamed or deleted fails here instead of going quiet;
 *   - every declared indirect sweep must be proven by reading the script that
 *     performs it, so "the floor sweeps the behaviors directory" cannot become
 *     a sentence that used to be true.
 * Neither can see a context ADDED to the ruleset and not written down. That
 * residual is stated in the mirror file rather than hidden here.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** A jest argument, once the shell quoting a workflow uses is stripped off. */
function normalizeArgument(token) {
  return token.replace(/^["']+/, "").replace(/["',;]+$/, "");
}

/**
 * Expand `npm run <script>` to the script body, repeatedly, so a step that runs
 * a wrapper is read for the jest command the wrapper actually issues. Bounded:
 * a script that runs itself terminates instead of recursing.
 */
function expandNpmScripts(command, scripts, depth = 0) {
  if (depth >= 5) return command;
  return command.replace(/npm run ([A-Za-z0-9:_@./-]+)/g, (match, name) => {
    const body = scripts[name];
    return body ? expandNpmScripts(body, scripts, depth + 1) : match;
  });
}

/** Every `run:` string a job issues, including the branches of a `strategy`-free matrix. */
function jobRunCommands(job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  return steps.map((step) => (typeof step?.run === "string" ? step.run : "")).filter(Boolean);
}

function classifyJestArguments(command, repoRoot) {
  const named = new Set();
  const swept = new Set();
  if (!/\bjest\b/.test(command)) return { named, swept };
  for (const raw of command.split(/\s+/)) {
    const token = normalizeArgument(raw);
    if (!token || token.startsWith("-")) continue;
    if (!/^(src|tests|scripts)\//.test(token)) continue;
    if (TEST_FILE.test(token)) {
      named.add(token);
      continue;
    }
    const candidate = path.join(repoRoot, token);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      swept.add(token.replace(/\/+$/, ""));
    }
  }
  return { named, swept };
}

export function readWorkflowJobs({ repoRoot = REPO_ROOT } = {}) {
  const dir = path.join(repoRoot, ".github", "workflows");
  const scripts = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts ?? {};

  const jobs = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!/\.ya?ml$/.test(file)) continue;
    let doc;
    try {
      doc = yaml.load(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      throw new Error(`.github/workflows/${file} is not parseable YAML: ${error.message}`);
    }
    for (const [jobId, job] of Object.entries(doc?.jobs ?? {})) {
      const named = new Set();
      const swept = new Set();
      for (const command of jobRunCommands(job)) {
        const expanded = expandNpmScripts(command, scripts);
        const found = classifyJestArguments(expanded, repoRoot);
        for (const value of found.named) named.add(value);
        for (const value of found.swept) swept.add(value);
      }
      jobs.push({
        workflow: file,
        jobId,
        context: typeof job?.name === "string" && job.name.trim() ? job.name : jobId,
        named: [...named].sort(),
        swept: [...swept].sort(),
      });
    }
  }
  return jobs;
}

function isInside(file, directory) {
  return file === directory || file.startsWith(`${directory}/`);
}

/**
 * @returns {{violations: Array, mirrorProblems: Array, requiredSweeps: Array}}
 */
export function evaluateNamedSuiteRequiredness({ repoRoot = REPO_ROOT, mirror } = {}) {
  const declaration =
    mirror ??
    JSON.parse(
      fs.readFileSync(path.join(repoRoot, "docs", "ci", "required-status-checks.json"), "utf8"),
    );

  const required = new Set(declaration.requiredContexts ?? []);
  const jobs = readWorkflowJobs({ repoRoot });
  const contextsInWorkflows = new Set(jobs.map((job) => job.context));

  const mirrorProblems = [];
  for (const context of required) {
    if (!contextsInWorkflows.has(context)) {
      mirrorProblems.push(
        `required context "${context}" names no job in .github/workflows — the mirror in docs/ci/required-status-checks.json has gone stale, or the job was renamed without updating the ruleset`,
      );
    }
  }

  const requiredSweeps = [];
  for (const job of jobs) {
    if (!required.has(job.context)) continue;
    for (const directory of job.swept) {
      requiredSweeps.push({ directory, context: job.context, source: `.github/workflows/${job.workflow}` });
    }
  }

  for (const sweep of declaration.indirectSweeps ?? []) {
    if (!required.has(sweep.context)) {
      mirrorProblems.push(
        `indirect sweep of ${sweep.directory} claims the required job "${sweep.context}", which is not in requiredContexts`,
      );
      continue;
    }
    const provenPath = path.join(repoRoot, sweep.provenBy);
    if (!fs.existsSync(provenPath)) {
      mirrorProblems.push(
        `indirect sweep of ${sweep.directory} is proven by ${sweep.provenBy}, which does not exist`,
      );
      continue;
    }
    const body = fs.readFileSync(provenPath, "utf8");
    const passesDirectoryToJest =
      /\bjest\b/.test(body) && new RegExp(`["']${sweep.directory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?["']`).test(body);
    if (!passesDirectoryToJest) {
      mirrorProblems.push(
        `${sweep.provenBy} no longer passes ${sweep.directory} to jest, so the declared sweep by "${sweep.context}" is unproven`,
      );
      continue;
    }
    requiredSweeps.push({ directory: sweep.directory, context: sweep.context, source: sweep.provenBy });
  }

  const violations = [];
  for (const job of jobs) {
    if (required.has(job.context)) continue;
    for (const file of job.named) {
      const sweep = requiredSweeps.find((candidate) => isInside(file, candidate.directory));
      if (!sweep) continue;
      violations.push({
        file,
        namedBy: job.context,
        namedIn: `.github/workflows/${job.workflow}`,
        sweptBy: sweep.context,
        sweptFrom: sweep.source,
      });
    }
  }

  return { violations, mirrorProblems, requiredSweeps };
}

function main() {
  const { violations, mirrorProblems, requiredSweeps } = evaluateNamedSuiteRequiredness();

  console.log(
    `Named-suite requiredness: ${requiredSweeps.length} director${requiredSweeps.length === 1 ? "y" : "ies"} swept by a required job.`,
  );

  for (const problem of mirrorProblems) {
    console.error(`  mirror: ${problem}`);
  }
  for (const violation of violations) {
    console.error(
      `  ${violation.file}\n` +
        `      named by "${violation.namedBy}" in ${violation.namedIn}, which does not block a merge\n` +
        `      already run by required "${violation.sweptBy}" via ${violation.sweptFrom}\n` +
        `      The named line is the quotable one and the blocking line is anonymous. Move the named step into the required job, or drop it and read PASS <path> out of the required job's own log.`,
    );
  }

  if (mirrorProblems.length || violations.length) {
    console.error(
      `\nFAIL: ${violations.length} named suite(s) in a non-required job, ${mirrorProblems.length} mirror problem(s).` +
        `\nThe rule is in docs/ci/README-suite-wiring.md.`,
    );
    process.exit(1);
  }

  console.log("OK: every individually named suite that a required job also runs is named inside a required job.");
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  const real = (value) => {
    try {
      return fs.realpathSync(value);
    } catch {
      return path.resolve(value);
    }
  };
  // macOS hands back /var/... for a temp path whose real location is
  // /private/var/..., and the ESM loader resolves symlinks while argv does not.
  // Comparing the resolved paths keeps this script runnable from a scratch tree.
  return real(process.argv[1]) === real(fileURLToPath(import.meta.url));
}

if (isEntryPoint()) {
  main();
}

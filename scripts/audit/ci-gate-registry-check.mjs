#!/usr/bin/env node
/**
 * Every audit script is either a gate or it is not, and the repo has to say which.
 *
 * `package.json` carries many `audit:` / `validate:` / `check:` scripts. Some
 * are invoked by workflows. The rest are a mix of two very different things —
 * policy gates that should fail a PR, and operator tools that are meant to be
 * run by hand — and nothing distinguished them. A gate that nobody runs looks
 * exactly like a tool that nobody needs to run.
 *
 * That is not hypothetical. The route-reachability audit sat unwired and red for
 * an unknown period, and a spot check of six unwired code-policy gates found
 * four failing on main: the Nexus navigation contract, the candidate
 * invisibility guard, legacy-context retirement, and legacy-dataset sunset.
 *
 * This check does not decide which is which — that is a judgment per script. It
 * requires the decision to be written down, and enforces the one consequence
 * that follows from it: anything classified `pr-gate` must actually be invoked
 * by a workflow.
 *
 * Usage:
 *   node scripts/audit/ci-gate-registry-check.mjs            # check
 *   node scripts/audit/ci-gate-registry-check.mjs --update   # add new scripts as unclassified
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);
const REGISTRY = path.join(
  REPO_ROOT,
  'docs',
  'architecture',
  'ci-gate-registry.json',
);

const SCRIPT_PREFIXES = /^(audit|validate|check):/;

/**
 * pr-gate      must be invoked by a workflow; fails a PR when it fails.
 * operator     run by hand — needs credentials, a live data plane, or a human
 *              deciding when it is meaningful. Never gates a PR.
 * report       writes a report and always succeeds. Never gates a PR.
 * quarantined  a pr-gate that is failing on main today. Recorded with what is
 *              wrong so it is visible, not wired until it is triaged.
 * unclassified nobody has decided yet. Allowed in the baseline, refused for
 *              anything added after it.
 */
const KINDS = new Set([
  'pr-gate',
  'operator',
  'report',
  'quarantined',
  'unclassified',
]);

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

function readWorkflowText() {
  const dir = path.join(REPO_ROOT, '.github', 'workflows');
  if (!fs.existsSync(dir)) return '';
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n');
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Does `text` run the npm script `name` — the script itself, not one whose name
 * merely starts with it?
 *
 * npm script names nest by colon, so `audit:foo` is a prefix of
 * `audit:foo:guard`. A substring test therefore let a workflow that runs only
 * the guard vouch for the bare script as well, and three scripts on main were
 * counted as wired that way while running nowhere. What follows the name has to
 * be something that ends it: whitespace, a shell operator, a quote, end of line.
 */
function endsWithScriptName(prefix, name, text) {
  return new RegExp(`${prefix}${escapeForRegExp(name)}(?![\\w:.-])`).test(text);
}

/** A workflow step that runs the npm script itself. */
function workflowRunsScript(workflowText, name) {
  return endsWithScriptName('npm\\s+run\\s+', name, workflowText);
}

/** A package.json script body that runs another npm script. */
function bodyRunsScript(body, name) {
  return endsWithScriptName('run\\s+', name, body);
}

/** A workflow step that runs the package script body itself. */
function workflowRunsScriptBody(workflowText, body) {
  if (!body.trim()) return false;
  return new RegExp(
    `${escapeForRegExp(body.trim())}(?=\\s*(?:$|\\n|&&|\\|\\||;|#))`,
    'm',
  ).test(workflowText);
}

/**
 * A script counts as invoked when a workflow names it, runs its exact package
 * script body, or reaches it through any number of npm-run composite hops.
 * Matching the full body matters when sibling scripts share one entry file but
 * select different modes with flags.
 */
function scriptsInvokedByWorkflow(scripts, workflowText) {
  const names = Object.keys(scripts);
  const invoked = new Set(
    names.filter(
      (name) =>
        workflowRunsScript(workflowText, name) ||
        workflowRunsScriptBody(workflowText, scripts[name] ?? ''),
    ),
  );
  const queue = [...invoked];

  while (queue.length > 0) {
    const current = queue.shift();
    const body = scripts[current] ?? '';
    for (const candidate of names) {
      if (invoked.has(candidate) || !bodyRunsScript(body, candidate)) continue;
      invoked.add(candidate);
      queue.push(candidate);
    }
  }

  return invoked;
}

function main() {
  const update = process.argv.slice(2).includes('--update');
  const pkg = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
  );
  const scripts = pkg.scripts ?? {};
  const workflowText = readWorkflowText();
  const invokedScripts = scriptsInvokedByWorkflow(scripts, workflowText);
  const names = Object.keys(scripts).filter((n) => SCRIPT_PREFIXES.test(n)).sort();

  let registry = { note: '', entries: {} };
  if (fs.existsSync(REGISTRY)) {
    registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  }
  const entries = registry.entries ?? {};

  if (update) {
    let added = 0;
    for (const name of names) {
      if (entries[name]) continue;
      entries[name] = { kind: 'unclassified' };
      added += 1;
    }
    for (const name of Object.keys(entries)) {
      if (!names.includes(name)) delete entries[name];
    }
    const sorted = Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((k) => [k, entries[k]]),
    );
    fs.writeFileSync(
      REGISTRY,
      `${JSON.stringify({ ...registry, entries: sorted }, null, 2)}\n`,
    );
    console.log(
      `Registry written: ${Object.keys(sorted).length} scripts, ${added} newly added as unclassified.`,
    );
    return;
  }

  const problems = [];

  for (const name of names) {
    const entry = entries[name];
    if (!entry) {
      problems.push(
        `${name}: not in the gate registry — classify it as pr-gate, operator, report or quarantined (see docs/architecture/ci-gate-registry.json)`,
      );
      continue;
    }
    if (!KINDS.has(entry.kind)) {
      problems.push(
        `${name}: kind must be one of ${[...KINDS].join(', ')}, got ${JSON.stringify(entry.kind)}`,
      );
      continue;
    }

    const invoked = invokedScripts.has(name);

    if (entry.kind === 'pr-gate' && !invoked) {
      problems.push(
        `${name}: classified pr-gate but no workflow invokes it — a gate that does not run reports to no one`,
      );
    }
    if (entry.kind === 'quarantined') {
      if (invoked) {
        problems.push(
          `${name}: classified quarantined but a workflow invokes it — reclassify as pr-gate`,
        );
      }
      if (typeof entry.reason !== 'string' || entry.reason.trim().length < 30) {
        problems.push(
          `${name}: a quarantined gate needs a reason saying what is failing and what would clear it`,
        );
      }
    }
    if (entry.kind === 'operator' || entry.kind === 'report') {
      if (typeof entry.reason !== 'string' || entry.reason.trim().length < 20) {
        problems.push(`${name}: ${entry.kind} needs a reason it is not a PR gate`);
      }
    }
  }

  for (const name of Object.keys(entries)) {
    if (!names.includes(name)) {
      problems.push(
        `${name}: in the registry but no longer a package.json script — refresh with --update`,
      );
    }
  }

  if (problems.length > 0) {
    fail('CI gate registry failed.', problems);
  }

  const counts = {};
  for (const name of names) {
    const kind = entries[name].kind;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  console.log(`CI gate registry passed (${names.length} scripts).`);
  console.log(
    Object.entries(counts)
      .sort()
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n'),
  );
  if (counts.unclassified) {
    console.log(
      `\n${counts.unclassified} scripts are still unclassified. New scripts are refused; these are the backlog.`,
    );
  }
}

main();

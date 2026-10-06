/**
 * The worker jobs the repo-owned deploy actually re-images — read from the
 * deploy script itself rather than restated (item C-589, claimable half).
 *
 * The ACA runtime invariant is stated over "all required worker job images".
 * Which jobs those are was written down twice: once in
 * `scripts/deploy/update-worker-jobs.sh`, which decides what the deploy
 * re-images, and once as an array inside
 * `scripts/deploy/check-aca-runtime-invariant.mjs`, which decides what the
 * proof checks. Neither deploy workflow passes `--worker-job-names`, so the
 * proof's own array was the whole of the enforcement, and the two lists agreed
 * only because somebody had kept them agreeing. Add a job to the deploy script
 * and the proof keeps reporting PASSED over the old set — an invariant whose
 * stated scope is wider than its enforcement reads PASSED in precisely the
 * direction that matters, and the divergence waits to be found by hand.
 *
 * So there is one list, and it lives where the deploy reads it.
 *
 * This module REFUSES rather than falling back. A fallback to a list of our own
 * is the bug restated: it would make an unreadable deploy script look like
 * agreement. If the source cannot be read, the caller must stop.
 */

import { existsSync, readFileSync } from 'node:fs';

/** Repository-relative path of the one file that decides the set. */
export const WORKER_JOB_NAMES_SOURCE = 'scripts/deploy/update-worker-jobs.sh';

const ASSIGNMENT = /^\s*(?:export\s+)?WORKER_JOB_NAMES=(.+?)\s*$/;
const ENV_DEFAULT = /^\$\{WORKER_JOB_NAMES:-([\s\S]*)\}$/;

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Parse the `WORKER_JOB_NAMES` default out of a deploy script's text.
 *
 * @param {string} scriptText
 * @param {{ sourceLabel?: string }} [options]
 * @returns {string[]} the job names, in the order the script lists them
 */
export function parseWorkerJobNamesDefault(scriptText, options = {}) {
  const where = options.sourceLabel ? ` in ${options.sourceLabel}` : '';
  const matches = [];

  for (const line of String(scriptText ?? '').split('\n')) {
    // The `^` anchor in ASSIGNMENT is what keeps a comment out: a line whose
    // first non-space character is `#` cannot match it. An explicit
    // comment-skip was written here first and then removed, because no fixture
    // could reach it — the anchor had already decided every such line, so the
    // skip was a branch that looked like a guard and was not one. If the anchor
    // is ever loosened, the commented-example case below goes red.
    const match = line.match(ASSIGNMENT);
    if (match) matches.push(match[1]);
  }

  if (matches.length === 0) {
    throw new Error(
      `No WORKER_JOB_NAMES assignment found${where}. The enforced worker-job set is derived from ` +
        `${WORKER_JOB_NAMES_SOURCE} and there is deliberately no fallback list to use instead.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Found ${matches.length} live WORKER_JOB_NAMES assignments${where}; which one the shell ` +
        'reaches is ambiguous, so the enforced set cannot be derived. Leave exactly one.',
    );
  }

  const raw = stripQuotes(matches[0]);
  const envDefault = raw.match(ENV_DEFAULT);
  const value = envDefault ? envDefault[1] : raw;
  const names = value.split(/[\s,]+/).filter(Boolean);

  if (names.length === 0) {
    throw new Error(
      `WORKER_JOB_NAMES${where} has an empty default, so the enforced worker-job set would be ` +
        'empty and the invariant would check nothing. Refusing.',
    );
  }

  const unresolved = names.filter((name) => /[$'"{}]/.test(name));
  if (unresolved.length > 0) {
    throw new Error(
      `WORKER_JOB_NAMES${where} yields ${JSON.stringify(unresolved)}, which is not a job name — ` +
        'the default is built from shell expansion this reader cannot resolve. Refusing rather ' +
        'than enforcing a set that is wrong in a way nobody would see.',
    );
  }

  return names;
}

/**
 * Read the enforced worker-job set from a deploy script on disk.
 *
 * @param {string} scriptPath absolute or cwd-relative path to update-worker-jobs.sh
 * @returns {string[]}
 */
export function readWorkerJobNames(scriptPath) {
  if (!existsSync(scriptPath)) {
    throw new Error(
      `Cannot derive the enforced worker-job set: ${scriptPath} does not exist. The set comes ` +
        `from ${WORKER_JOB_NAMES_SOURCE} and there is no fallback list by design.`,
    );
  }
  return parseWorkerJobNamesDefault(readFileSync(scriptPath, 'utf8'), { sourceLabel: scriptPath });
}

#!/usr/bin/env node
/**
 * Behavioural test for the derived worker-job enforcement set (item C-589,
 * claimable half).
 *
 * What was wrong. The ACA runtime invariant is stated over "all required
 * worker job images", and two separate files each carried their own
 * hand-typed idea of which jobs those are:
 *
 *   scripts/deploy/update-worker-jobs.sh      WORKER_JOB_NAMES default
 *   scripts/deploy/check-aca-runtime-invariant.mjs   DEFAULTS.workerJobNames
 *
 * The first decides which jobs the deploy actually re-images; the second
 * decides which jobs the proof actually checks. Nothing tied them together,
 * and neither deploy workflow passes `--worker-job-names`, so the proof's own
 * array was the whole of the enforcement. The two lists agreed — by agreement,
 * not by construction. Add a job to the deploy script and the proof keeps
 * reporting PASSED over the old set; an invariant whose stated scope is wider
 * than its enforcement reads PASSED in exactly the direction that matters.
 *
 * So the enforced set is now DERIVED from the deploy script's own default, and
 * these cases are the contract. The important ones are not "today's two jobs
 * parse" — a hard-coded array passes that. They are the ones where a plausible
 * simplification would keep reporting the old set:
 *
 *   return a literal array instead of parsing      -> cases 2, 3, 9, 10
 *   fall back to a literal when parsing fails      -> cases 4, 5, 6
 *   match the assignment unanchored, so a commented
 *     example in the header counts as a second one  -> case 7
 *   take the first of several assignments          -> case 8
 *   accept a token the shell would still expand    -> case 13
 *
 * A CORRECTION ON THIS SUITE'S OWN FIRST DRAFT, recorded here rather than
 * quietly fixed. Case 7 was first written against an explicit comment-skip in
 * the parser, and deleting that skip did not turn it red — the `^` anchor in
 * the assignment pattern had already rejected every comment line, so the skip
 * was unreachable and the case was pinning something else than it claimed. The
 * skip is gone and case 7 now names the anchor, which a mutation does kill.
 *
 * Case 11 is DIFFERENT IN KIND and labelled so: it compares the two real repo
 * files, which agree today, so it cannot fail on this commit and proves
 * nothing about the derivation. It is a regression guard against the two
 * drifting apart again, not evidence that deriving works.
 *
 * Run: node --test scripts/deploy/worker-job-names.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseWorkerJobNamesDefault,
  readWorkerJobNames,
  WORKER_JOB_NAMES_SOURCE,
} from './worker-job-names.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const checker = path.join(repoRoot, 'scripts', 'deploy', 'check-aca-runtime-invariant.mjs');

/** A deploy script in the real file's shape, with the default we want to vary. */
function deployScript(defaultLine) {
  return [
    '#!/usr/bin/env bash',
    '# Update the deliverable-generation worker JOBS to a given image.',
    'set -euo pipefail',
    'IMAGE="${1:-${IMAGE:-}}"',
    'RESOURCE_GROUP="${RESOURCE_GROUP:-rg-abarva-controlplane-lab-eastus}"',
    '# Space-separated. Cron fallback + KEDA event-triggered worker.',
    defaultLine,
    'WORKER_CONTAINER_NAME="${WORKER_CONTAINER_NAME:-worker}"',
    'for job in $WORKER_JOB_NAMES; do echo "$job"; done',
    '',
  ].join('\n');
}

function withScript(text, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'c589-worker-jobs-'));
  const file = path.join(dir, 'update-worker-jobs.sh');
  writeFileSync(file, text);
  try {
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Ask the real checker binary what it would enforce, with no Azure call. This
 * is the case that a hand-typed array inside the checker cannot survive: the
 * answer has to follow the fixture script it is pointed at.
 */
function checkerEnforcedSet(scriptPath, extraArgs = []) {
  const out = execFileSync(
    process.execPath,
    [checker, '--print-worker-jobs', '--worker-job-source', scriptPath, ...extraArgs],
    { encoding: 'utf8', env: { ...process.env, WORKER_JOB_NAMES: '' } },
  );
  return JSON.parse(out);
}

// ---------------------------------------------------------------------------
// 1. The shape the real script is written in parses at all.
// ---------------------------------------------------------------------------
test('1. the env-indirection default form parses to its two names', () => {
  const names = parseWorkerJobNamesDefault(
    deployScript(
      'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker job-abarva-deliv-worker-event}"',
    ),
  );
  assert.deepEqual(names, ['job-abarva-deliv-worker', 'job-abarva-deliv-worker-event']);
});

// ---------------------------------------------------------------------------
// 2-3. THE NECESSITY CASES. These are the mutation the item names: change the
// deploy script's own list and the enforced set must change with it. A literal
// array — the code being replaced — fails both.
// ---------------------------------------------------------------------------
test('2. a THIRD job added to the deploy script is enforced without touching the proof', () => {
  const names = parseWorkerJobNamesDefault(
    deployScript(
      'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker job-abarva-deliv-worker-event job-abarva-private-operator-eus}"',
    ),
  );
  assert.deepEqual(names, [
    'job-abarva-deliv-worker',
    'job-abarva-deliv-worker-event',
    'job-abarva-private-operator-eus',
  ]);
  assert.ok(
    names.includes('job-abarva-private-operator-eus'),
    'a job the deploy script re-images must be in the enforced set the proof checks',
  );
});

test('3. a job REMOVED from the deploy script leaves the enforced set', () => {
  const names = parseWorkerJobNamesDefault(
    deployScript('WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker}"'),
  );
  assert.deepEqual(names, ['job-abarva-deliv-worker']);
});

// ---------------------------------------------------------------------------
// 4-6. A FALLBACK IS THE BUG, NOT THE SAFETY NET. If the derivation cannot
// read the deploy script it must refuse, because the one thing it must never
// do is quietly go back to enforcing a list of its own.
// ---------------------------------------------------------------------------
test('4. a script with no WORKER_JOB_NAMES assignment REFUSES rather than falling back', () => {
  assert.throws(
    () =>
      parseWorkerJobNamesDefault(
        [
          '#!/usr/bin/env bash',
          'set -euo pipefail',
          'IMAGE="${1:-${IMAGE:-}}"',
          '',
        ].join('\n'),
      ),
    /WORKER_JOB_NAMES/,
  );
});

test('5. an assignment with an EMPTY default refuses', () => {
  assert.throws(
    () => parseWorkerJobNamesDefault(deployScript('WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-}"')),
    /empty/i,
  );
});

test('6. a missing deploy script refuses by path, naming the file it wanted', () => {
  assert.throws(
    () => readWorkerJobNames(path.join(tmpdir(), 'c589-definitely-absent', 'update-worker-jobs.sh')),
    /update-worker-jobs\.sh/,
  );
});

// ---------------------------------------------------------------------------
// 7. A COMMENT IS NOT AN ASSIGNMENT — and the `^` anchor is what makes that
// true. Loosen the anchor and the commented example in the header becomes a
// second live assignment, which is how a stale example would get to decide
// what the deploy enforces.
// ---------------------------------------------------------------------------
test('7. a commented-out assignment is not read as the default', () => {
  const text = [
    '#!/usr/bin/env bash',
    '#   WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-OLD-worker}" \\',
    'set -euo pipefail',
    'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker job-abarva-deliv-worker-event}"',
    '',
  ].join('\n');
  const names = parseWorkerJobNamesDefault(text);
  assert.deepEqual(names, ['job-abarva-deliv-worker', 'job-abarva-deliv-worker-event']);
  assert.ok(!names.includes('job-abarva-OLD-worker'), 'a comment must not contribute a job');
});

// ---------------------------------------------------------------------------
// 8. TWO ASSIGNMENTS IS UNDECIDABLE. Taking the first is a guess about which
// one the shell would reach, and the guess is what makes a wrong set look
// authoritative.
// ---------------------------------------------------------------------------
test('8. two live assignments refuse rather than silently picking one', () => {
  const text = [
    '#!/usr/bin/env bash',
    'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker}"',
    'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker-event}"',
    '',
  ].join('\n');
  assert.throws(() => parseWorkerJobNamesDefault(text), /more than one|ambiguous/i);
});

// ---------------------------------------------------------------------------
// 9-10. THE CHECKER ITSELF, not just the parser. Run the real binary and make
// it say what it would enforce. Reverting DEFAULTS.workerJobNames to a
// hand-typed array inside the checker cannot pass case 9.
// ---------------------------------------------------------------------------
test('9. the checker enforces what the deploy script it is pointed at says', () => {
  withScript(
    deployScript(
      'WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker job-abarva-deliv-worker-event job-abarva-third-worker}"',
    ),
    (file) => {
      const resolved = checkerEnforcedSet(file);
      assert.deepEqual(resolved.workerJobNames, [
        'job-abarva-deliv-worker',
        'job-abarva-deliv-worker-event',
        'job-abarva-third-worker',
      ]);
      assert.equal(resolved.workerJobNamesOrigin, 'derived');
      assert.equal(resolved.workerJobSource, file);
    },
  );
});

test('10. an explicit --worker-job-names still overrides, and says so', () => {
  withScript(
    deployScript('WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker}"'),
    (file) => {
      const resolved = checkerEnforcedSet(file, ['--worker-job-names', 'job-one,job-two']);
      assert.deepEqual(resolved.workerJobNames, ['job-one', 'job-two']);
      assert.equal(resolved.workerJobNamesOrigin, 'explicit');
    },
  );
});

// ---------------------------------------------------------------------------
// 13. A TOKEN THE SHELL WOULD STILL EXPAND IS NOT A JOB NAME. Accepting one
// enforces a set that is wrong in a way nothing would surface: `az job show`
// would be asked for a job literally named `$EXTRA_JOBS`, and the read failure
// would look like a missing job rather than an unreadable deploy script. Added
// after a mutation that removed this guard survived the first draft of this
// suite — the branch was real and no case reached it.
// ---------------------------------------------------------------------------
test('13. a default built from an unresolved shell variable refuses', () => {
  assert.throws(
    () =>
      parseWorkerJobNamesDefault(
        deployScript('WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-$EXTRA_WORKER_JOBS}"'),
      ),
    /not a job name/,
  );
});

// ---------------------------------------------------------------------------
// 11. REGRESSION GUARD, NOT A NECESSITY PROOF — said plainly because the
// difference is the whole point of this item. Both real files agree on this
// commit, so this case is green here no matter whether the derivation works,
// and no mutation of the parser can turn it red. What it pins is that the
// repo-owned deploy script stays readable by the proof that depends on it.
// ---------------------------------------------------------------------------
test('11. [regression guard] the real deploy script is readable and non-empty', () => {
  const live = readWorkerJobNames(path.join(repoRoot, WORKER_JOB_NAMES_SOURCE));
  assert.ok(Array.isArray(live) && live.length > 0, 'the real script must yield a non-empty set');
  const text = readFileSync(path.join(repoRoot, WORKER_JOB_NAMES_SOURCE), 'utf8');
  for (const job of live) {
    assert.ok(text.includes(job), `${job} must come from the deploy script's own text`);
  }
});

// ---------------------------------------------------------------------------
// 12. The proof bundle has to carry the derivation, or a reader cannot tell
// which set was enforced on a given run.
// ---------------------------------------------------------------------------
test('12. the resolved set names its origin and its source file', () => {
  withScript(
    deployScript('WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker}"'),
    (file) => {
      const resolved = checkerEnforcedSet(file);
      assert.equal(typeof resolved.workerJobSource, 'string');
      assert.ok(resolved.workerJobSource.length > 0);
      assert.ok(['derived', 'explicit'].includes(resolved.workerJobNamesOrigin));
    },
  );
});

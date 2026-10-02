#!/usr/bin/env node

/**
 * Proves the release check runs every gate it lists, and that any gate which
 * does not exit 0 fails it.
 *
 * The property under test is about execution, so every case executes. Each one
 * copies the real entry point (`scripts/release-check.mjs`) and the real runner
 * (`run-release-gates.mjs`) into a scratch directory, puts a fixture gate list
 * beside them, and runs the entry point the way `npm run release:check` does.
 * The fixture gates append a line to `ran.log` as their first statement, so
 * "this gate ran" is read from what the gate itself wrote, not from what the
 * runner says about it. The runner's summary is then checked against that log.
 *
 * Only the gate list is a fixture. The entry point and the runner are the
 * shipped files, which is what makes one regression visible that a unit test of
 * the runner could not see: an `import` of a gate added to the entry point is
 * evaluated in the entry point's own process, and in the scratch copy that
 * import does not resolve, so the case fails instead of passing around it.
 *
 * The gate that matters most is the one that passes by calling
 * `process.exit(0)`. Evaluated in a shared process it ends the run, status 0,
 * before the gates after it start. One case below runs the same fixtures that
 * way on purpose and requires the defect to appear, so the cases that require
 * it to be absent are known to be looking at fixtures that can produce it.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const RELEASE_CHECK_ARGS = ['--base', 'origin/main', '--head', 'HEAD'];

/** How a fixture gate finishes, after it has recorded that it ran. */
const ENDINGS = {
  fallsThrough: '',
  exitsZero: 'process.exit(0);',
  exitsOne: 'process.exit(1);',
  throws: "throw new Error('fixture gate threw');",
  setsExitCode: 'process.exitCode = 3;',
  killed: "process.kill(process.pid, 'SIGKILL');",
};

function gateSource(gate, ending) {
  const entry = `{ gate: ${JSON.stringify(gate)}, args: process.argv.slice(2) }`;
  return [
    "import { appendFileSync } from 'node:fs';",
    `appendFileSync('ran.log', \`\${JSON.stringify(${entry})}\\n\`);`,
    ending,
    '',
  ].join('\n');
}

function readRanLog(dir) {
  const file = path.join(dir, 'ran.log');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** The runner's own account: everything from its summary line to the end. */
function summaryOf(output) {
  const start = output.lastIndexOf('release-check: summary');
  return start < 0 ? [] : output.slice(start).trimEnd().split('\n');
}

/**
 * Builds a scratch release check around `gates` and hands the directory to `use`.
 * `gates` is a list of `[path, ending]`; an ending of `null` lists the gate but
 * writes no file for it.
 *
 * Exactly two shipped files are copied, by name, and that is the point of naming
 * them. If the entry point or the runner starts importing anything else, the
 * import does not resolve here and every case that goes through the entry point
 * fails. A helper the runner genuinely needs has to be added to this list by
 * hand; a gate must never be.
 */
function withScratchReleaseCheck(gates, use) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-check-every-gate-'));
  try {
    mkdirSync(path.join(dir, 'scripts', 'release-control'), { recursive: true });
    mkdirSync(path.join(dir, 'gates'), { recursive: true });
    cpSync(
      path.join(repoRoot, 'scripts', 'release-check.mjs'),
      path.join(dir, 'scripts', 'release-check.mjs'),
    );
    cpSync(
      path.join(repoRoot, 'scripts', 'release-control', 'run-release-gates.mjs'),
      path.join(dir, 'scripts', 'release-control', 'run-release-gates.mjs'),
    );
    writeFileSync(
      path.join(dir, 'scripts', 'release-control', 'release-gates.mjs'),
      `export const RELEASE_GATES = ${JSON.stringify(gates.map(([gate]) => gate))};\n`,
    );
    for (const [gate, ending] of gates) {
      if (ending === null) continue;
      writeFileSync(path.join(dir, gate), gateSource(gate, ending));
    }
    return use(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runNode(dir, script, args = []) {
  const run = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
  return {
    status: run.status,
    output: `${run.stdout ?? ''}${run.stderr ?? ''}`,
    ran: readRanLog(dir),
  };
}

function runReleaseCheck(gates) {
  return withScratchReleaseCheck(gates, (dir) =>
    runNode(dir, 'scripts/release-check.mjs', RELEASE_CHECK_ARGS),
  );
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---------------------------------------------------------------------------
// The defect: a gate that passes by ending its process.
// ---------------------------------------------------------------------------

const PASSING_GATES = [
  ['gates/passes-by-falling-through.mjs', ENDINGS.fallsThrough],
  ['gates/passes-by-exiting-zero.mjs', ENDINGS.exitsZero],
  ['gates/listed-after-the-exit.mjs', ENDINGS.fallsThrough],
];

test('a gate that passes by calling process.exit(0) does not stop the gates listed after it', () => {
  const result = runReleaseCheck(PASSING_GATES);
  assert.deepEqual(
    result.ran.map((entry) => entry.gate),
    PASSING_GATES.map(([gate]) => gate),
    result.output,
  );
  assert.equal(result.status, 0, result.output);
  assert.deepEqual(summaryOf(result.output), [
    'release-check: summary - 3 of 3 listed gates ran',
    '  PASS  gates/passes-by-falling-through.mjs (exit 0)',
    '  PASS  gates/passes-by-exiting-zero.mjs (exit 0)',
    '  PASS  gates/listed-after-the-exit.mjs (exit 0)',
    'release-check: PASSED - all 3 gates ran and passed.',
  ]);
});

test('the same gates imported into one process stop at the exit and still report status 0', () => {
  // The control for the case above. If these fixtures could not reproduce the
  // defect, the case above would pass whether or not the runner prevents it.
  const result = withScratchReleaseCheck(PASSING_GATES, (dir) => {
    writeFileSync(
      path.join(dir, 'imports-every-gate.mjs'),
      PASSING_GATES.map(([gate]) => `import './${gate}';\n`).join(''),
    );
    return runNode(dir, 'imports-every-gate.mjs');
  });
  assert.deepEqual(
    result.ran.map((entry) => entry.gate),
    ['gates/passes-by-falling-through.mjs', 'gates/passes-by-exiting-zero.mjs'],
  );
  assert.equal(result.status, 0, result.output);
});

// ---------------------------------------------------------------------------
// Any way of not exiting 0 fails the check, and never hides the gates after it.
// Each way is its own case: one failing gate among several would satisfy an
// assertion about the exit code on behalf of every other way of failing.
// ---------------------------------------------------------------------------

for (const [label, ending, detail] of [
  ['calls process.exit(1)', ENDINGS.exitsOne, 'exit 1'],
  ['throws', ENDINGS.throws, 'exit 1'],
  ['sets process.exitCode to 3', ENDINGS.setsExitCode, 'exit 3'],
  ['is killed by a signal', ENDINGS.killed, 'killed by SIGKILL'],
]) {
  test(`a gate that ${label} fails the release check, and the gates after it still run`, () => {
    const gates = [
      ['gates/passes-first.mjs', ENDINGS.fallsThrough],
      ['gates/does-not-pass.mjs', ending],
      ['gates/listed-after-the-failure.mjs', ENDINGS.fallsThrough],
    ];
    const result = runReleaseCheck(gates);
    assert.deepEqual(
      result.ran.map((entry) => entry.gate),
      gates.map(([gate]) => gate),
      result.output,
    );
    assert.equal(result.status, 1, result.output);
    assert.deepEqual(summaryOf(result.output), [
      'release-check: summary - 3 of 3 listed gates ran',
      '  PASS  gates/passes-first.mjs (exit 0)',
      `  FAIL  gates/does-not-pass.mjs (${detail})`,
      '  PASS  gates/listed-after-the-failure.mjs (exit 0)',
      'release-check: FAILED - 1 of 3 gates failed.',
    ]);
  });
}

for (const [position, gates] of [
  [
    'first',
    [
      ['gates/does-not-pass.mjs', ENDINGS.exitsOne],
      ['gates/passes-second.mjs', ENDINGS.fallsThrough],
      ['gates/passes-third.mjs', ENDINGS.exitsZero],
    ],
  ],
  [
    'last',
    [
      ['gates/passes-first.mjs', ENDINGS.exitsZero],
      ['gates/passes-second.mjs', ENDINGS.fallsThrough],
      ['gates/does-not-pass.mjs', ENDINGS.exitsOne],
    ],
  ],
]) {
  test(`a failing gate fails the release check when it is listed ${position}`, () => {
    const result = runReleaseCheck(gates);
    assert.deepEqual(
      result.ran.map((entry) => entry.gate),
      gates.map(([gate]) => gate),
      result.output,
    );
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /^ {2}FAIL {2}gates\/does-not-pass\.mjs \(exit 1\)$/m);
    assert.match(result.output, /^release-check: FAILED - 1 of 3 gates failed\.$/m);
  });
}

test('a listed gate whose file is missing fails the release check and does not stop the rest', () => {
  const gates = [
    ['gates/passes-first.mjs', ENDINGS.fallsThrough],
    ['gates/has-no-file.mjs', null],
    ['gates/listed-after-the-missing-file.mjs', ENDINGS.fallsThrough],
  ];
  const result = runReleaseCheck(gates);
  assert.deepEqual(
    result.ran.map((entry) => entry.gate),
    ['gates/passes-first.mjs', 'gates/listed-after-the-missing-file.mjs'],
    result.output,
  );
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /^ {2}FAIL {2}gates\/has-no-file\.mjs \(exit 1\)$/m);
});

test('a gate that cannot be started fails the release check', () => {
  // The runner starts gates with the Node binary it is running under. Pointing
  // that at a path that does not exist is the one way to make the start itself
  // fail, which leaves no exit status and no signal to read.
  const gates = [['gates/is-never-started.mjs', ENDINGS.fallsThrough]];
  const result = withScratchReleaseCheck(gates, (dir) => {
    writeFileSync(
      path.join(dir, 'runs-without-a-node-binary.mjs'),
      [
        "import path from 'node:path';",
        "import { runReleaseGates } from './scripts/release-control/run-release-gates.mjs';",
        "process.execPath = path.join(process.cwd(), 'no-such-node-binary');",
        `const gates = ${JSON.stringify(gates.map(([gate]) => gate))};`,
        'process.exitCode = runReleaseGates({ gates, rootDir: process.cwd() }).exitCode;',
        '',
      ].join('\n'),
    );
    return runNode(dir, 'runs-without-a-node-binary.mjs');
  });
  assert.deepEqual(result.ran, [], result.output);
  assert.equal(result.status, 1, result.output);
  assert.match(
    result.output,
    /^ {2}FAIL {2}gates\/is-never-started\.mjs \(could not start: .*ENOENT.*\)$/m,
  );
});

// ---------------------------------------------------------------------------
// A run that checked nothing is not a pass.
// ---------------------------------------------------------------------------

test('an empty gate list fails the release check instead of passing it', () => {
  const result = runReleaseCheck([]);
  assert.deepEqual(result.ran, []);
  assert.equal(result.status, 1, result.output);
  assert.deepEqual(summaryOf(result.output), [
    'release-check: summary - 0 of 0 listed gates ran',
    'release-check: FAILED - no gates are listed, so nothing was checked.',
  ]);
});

// ---------------------------------------------------------------------------
// Gates read `--base` and `--head` themselves, so each one has to receive them.
// ---------------------------------------------------------------------------

test('every gate receives the arguments the release check was given', () => {
  const result = runReleaseCheck(PASSING_GATES);
  assert.equal(result.ran.length, PASSING_GATES.length, result.output);
  for (const entry of result.ran) {
    assert.deepEqual(entry.args, RELEASE_CHECK_ARGS, entry.gate);
  }
});

// ---------------------------------------------------------------------------
// The last gate runs a script with one implemented mode. Run in any other mode
// it used to print nothing and exit 0, which reads as a pass that checked
// nothing; it has to refuse instead.
// ---------------------------------------------------------------------------

test('the context truth script runs in its static mode and refuses any other', () => {
  const run = (args) =>
    spawnSync('npx', ['tsx', 'src/scripts/intelligence/scb-truth-gates.ts', ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

  const staticMode = run(['--static-only']);
  assert.equal(staticMode.status, 0, staticMode.stdout + staticMode.stderr);
  assert.match(staticMode.stdout, /^PASS /m);

  for (const args of [[], ['--require-live']]) {
    const refused = run(args);
    assert.equal(refused.status, 2, `${JSON.stringify(args)}: ${refused.stdout}${refused.stderr}`);
    assert.match(refused.stderr, /only --static-only is implemented/);
    assert.equal(refused.stdout, '');
  }

  // Its own test suite imports the script, so importing it must not run it.
  const importer = path.join(mkdtempSync(path.join(tmpdir(), 'scb-truth-gates-import-')), 'importer.mts');
  try {
    writeFileSync(
      importer,
      `await import(${JSON.stringify(path.join(repoRoot, 'src/scripts/intelligence/scb-truth-gates.ts'))});\nconsole.log('imported without running');\n`,
    );
    const imported = spawnSync('npx', ['tsx', importer], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stdout + imported.stderr);
    assert.equal(imported.stdout, 'imported without running\n');
  } finally {
    rmSync(path.dirname(importer), { recursive: true, force: true });
  }
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(`     ${error.message.split('\n').join('\n     ')}`);
  }
}

console.log('');
console.log(`${tests.length - failed} passed, ${failed} failed, ${tests.length} total`);
process.exit(failed > 0 ? 1 : 0);

#!/usr/bin/env node
/**
 * The one typecheck command for this repository.
 *
 * There was not one before this script. `package.json` defined no `typecheck`
 * script, the two workflows that run tsc invoked it two different ways, and
 * every agent and every release record hand-rolled a third. That is how the
 * following happened, twice, in two days.
 *
 * **A crashed typecheck reads as a clean one.** On this repository a bare
 * `npx tsc --noEmit` exhausts the default V8 heap: it exits 134 and prints 90
 * lines of V8 crash trace containing no diagnostic at all. The habit of piping
 * tsc to `grep "error TS"` therefore reports a crash as a pass, and a real type
 * error inside that run is invisible. A release record on `main` carries a
 * correction saying exactly this about a typecheck it had already claimed.
 *
 * So this command's contract is not "run tsc". It is:
 *
 *   1. Remove any `.tsbuildinfo` the project would otherwise read, and ask tsc
 *      not to write one, so the answer never depends on an artifact from an
 *      earlier run of an earlier tree.
 *   2. Raise the child's heap above the level at which this project OOMs, so
 *      the common failure stops being a crash.
 *   3. Classify the outcome by what came back, not by exit code alone, and make
 *      a crash LOUD rather than silent. Non-zero with no diagnostic is not a
 *      typecheck result; it is the absence of one.
 *
 * Exit codes are distinct on purpose, so a caller can tell the three apart:
 *   0  clean       — tsc ran and reported nothing
 *   1  diagnostics — tsc ran and reported type errors
 *   3  crashed     — tsc did not produce a verdict (OOM, signal, missing tsc)
 *
 * Usage:
 *   node scripts/quality/typecheck.mjs          # or: npm run typecheck
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/**
 * The floor, not the value. 4096 (near the Node default this project crashes
 * at) is what made the bare command unreliable; both CI jobs already set 6144
 * and complete. A caller asking for more keeps their number.
 */
const HEAP_FLOOR_MB = 6144;

const DIAGNOSTIC_RE = /error TS\d+/;

/**
 * Every `.tsbuildinfo` the given tsconfig could read. `tsBuildInfoFile` wins
 * when set; otherwise tsc's default sits beside the config file. Both are
 * returned as absolute paths whether or not they exist — the caller unlinks
 * what is there and ignores what is not.
 */
export function resolveBuildInfoPaths(tsconfigPath) {
  const dir = path.dirname(tsconfigPath);
  const paths = [path.join(dir, 'tsconfig.tsbuildinfo')];

  let declared = null;
  try {
    const raw = fs.readFileSync(tsconfigPath, 'utf8');
    // Deliberately a narrow match rather than a JSONC parser: this file must
    // not fail to clean up because a comment confused a hand-rolled parser.
    declared = raw.match(/"tsBuildInfoFile"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  } catch {
    declared = null;
  }
  if (declared) paths.push(path.resolve(dir, declared));

  return [...new Set(paths)];
}

/**
 * Merge the heap floor into an existing NODE_OPTIONS without discarding the
 * caller's other flags, and without lowering a limit they set higher.
 */
export function resolveNodeOptions(existing, floorMb = HEAP_FLOOR_MB) {
  const current = (existing ?? '').trim();
  const declared = current.match(/--max-old-space-size=(\d+)/);
  if (!declared) {
    return current
      ? `${current} --max-old-space-size=${floorMb}`
      : `--max-old-space-size=${floorMb}`;
  }
  if (Number(declared[1]) >= floorMb) return current;
  return current.replace(
    /--max-old-space-size=\d+/,
    `--max-old-space-size=${floorMb}`,
  );
}

/**
 * The reason this script exists. `code !== 0` alone cannot tell a type error
 * from an out-of-memory abort, and the two demand opposite responses: one is
 * the answer you asked for, the other is the absence of an answer being read
 * as a good one.
 */
export function classifyResult({ code, signal, output }) {
  const text = output ?? '';
  const hasDiagnostics = DIAGNOSTIC_RE.test(text);

  if (signal) return 'crashed';
  if (code === 0) return hasDiagnostics ? 'diagnostics' : 'clean';
  return hasDiagnostics ? 'diagnostics' : 'crashed';
}

export const EXIT_CODES = { clean: 0, diagnostics: 1, crashed: 3 };

function main() {
  const tsconfigPath = path.join(REPO_ROOT, 'tsconfig.json');
  const tsc = path.join(REPO_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

  for (const buildInfo of resolveBuildInfoPaths(tsconfigPath)) {
    try {
      fs.rmSync(buildInfo, { force: true });
    } catch {
      // An unremovable build-info is itself a reason not to trust the run.
      console.error(`typecheck: could not remove ${buildInfo}`);
      process.exit(EXIT_CODES.crashed);
    }
  }

  if (!fs.existsSync(tsc)) {
    console.error(
      `typecheck: CRASHED — no TypeScript compiler at ${tsc}. Run \`npm ci\`.`,
    );
    process.exit(EXIT_CODES.crashed);
  }

  const result = spawnSync(
    process.execPath,
    [tsc, '--noEmit', '--pretty', 'false', '--incremental', 'false'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: resolveNodeOptions(process.env.NODE_OPTIONS),
      },
    },
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const verdict = classifyResult({
    code: result.status,
    signal: result.signal,
    output,
  });

  if (output.trim()) process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);

  if (verdict === 'crashed') {
    console.error('');
    console.error(
      'typecheck: CRASHED — tsc exited ' +
        `${result.signal ? `on signal ${result.signal}` : `${result.status}`} ` +
        'without reporting a single diagnostic.',
    );
    console.error(
      'This is NOT a clean typecheck. The output above is the crash, not a result.',
    );
    console.error(
      'A heap exhaustion here looks identical to success when the output is grepped for "error TS".',
    );
  } else if (verdict === 'diagnostics') {
    console.error('typecheck: type errors reported above.');
  } else {
    console.log('typecheck: clean.');
  }

  process.exit(EXIT_CODES[verdict]);
}

/**
 * Invoked directly, not imported. Compared through `realpathSync` because on
 * macOS `/tmp` is a symlink to `/private/tmp`: `process.argv[1]` keeps the path
 * as typed while `import.meta.url` is already resolved, and a plain comparison
 * silently declines to run the script at all.
 */
function isDirectInvocation() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return (
      fs.realpathSync(entry) === fs.realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  main();
}

#!/usr/bin/env node
/**
 * Behavioural test for the shared CLI entry guard (item T-723).
 *
 * Every script in this directory is a module with a CLI attached, so each needs
 * to answer one question: was I run, or was I imported? Four scripts had four
 * different answers and only one was right.
 *
 * The defect is not a wrong answer. It is a control that answers "imported",
 * does nothing, and **exits 0**. On macOS `/tmp` is a symlink to `/private/tmp`;
 * `import.meta.url` is always the realpath, while `process.argv[1]` is the path
 * as typed. So a guard that compares them without resolving symlinks never
 * matches when the script is invoked through `/tmp`, and the operator task file
 * instructs agents to work in `/tmp/exec-<item>-<timestamp>`.
 *
 * Measured before the fix, both via a `/tmp` path:
 *
 *   node <dir>/queue-provenance.mjs --register <register>   -> no output, exit 0
 *   node <dir>/worktree-retention.mjs --check --free-floor-gib 9999
 *                                                          -> no output, exit 0
 *
 * The second is the serious one: that is T-719's disk-safety control, and its
 * whole contract is to exit 1 below the floor.
 *
 * So every case below invokes a REAL CLI as a child process through a REAL
 * symlink, because that is the only way to distinguish a guard that works from
 * one that silently declines. A unit test of the predicate alone would have
 * passed against every one of the four broken guards — the predicate was never
 * the thing that was wrong, the comparison it was given was.
 *
 * Run:  node scripts/exec/cli-entry.test.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isDirectInvocation } from "./cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

let passes = 0;
let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    passes += 1;
    console.log(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${name}`);
  if (detail) console.log(`        ${String(detail).split("\n").join("\n        ")}`);
}

function run(script, args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error),
    };
  }
}

/**
 * A real directory reachable by two different paths, one of them a symlink.
 *
 * Built rather than assumed: `/tmp` happens to be a symlink on macOS and is not
 * on Linux, so a suite that relied on it would silently stop testing anything
 * in CI — which is the same "passes because it never ran" shape this item is
 * about. `realDir` and `linkDir` name the same files on every platform.
 */
function symlinkedCopy(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t723-"));
  const realDir = path.join(root, "real");
  const linkDir = path.join(root, "link");
  fs.mkdirSync(realDir);
  for (const f of files) fs.copyFileSync(path.join(HERE, f), path.join(realDir, f));
  fs.symlinkSync(realDir, linkDir, "dir");
  return { root, realDir, linkDir };
}

/* ------------------------------------------------------------------------ */
/* 1-4. The predicate itself, including the symlink case.                   */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy([]);
  const target = path.join(realDir, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");
  const viaLink = path.join(linkDir, "thing.mjs");
  const url = `file://${target}`;

  check(
    "the file's own path is a direct invocation",
    isDirectInvocation(url, target),
  );
  check(
    "THE DEFECT: the same file reached through a symlinked directory is still a direct invocation",
    isDirectInvocation(url, viaLink),
    `url=${url} argv1=${viaLink}`,
  );
  check(
    "a different file in the same directory is NOT a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "other.mjs")),
  );
  check(
    "a file whose name merely ends with the module's name is NOT a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "my-thing.mjs")),
    "a suffix match would accept this; the register-time-authority guard does",
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 5-6. Absent and unreadable argv[1].                                     */
/*                                                                          */
/* Failing closed is WRONG here and that is deliberate. Everywhere else in   */
/* this directory an unknown case refuses, because refusing costs one rerun. */
/* This predicate is not a gate; it decides whether to run a CLI. An unknown */
/* case that answers "yes, run" would make `import` execute the CLI, which   */
/* breaks every importer. So the safe direction is inverted, and it is       */
/* inverted on purpose rather than by omission.                              */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir } = symlinkedCopy([]);
  const target = path.join(realDir, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");
  const url = `file://${target}`;

  check(
    "no argv[1] at all is not a direct invocation",
    !isDirectInvocation(url, undefined) && !isDirectInvocation(url, ""),
  );
  check(
    "an argv[1] that does not exist on disk is not a direct invocation",
    !isDirectInvocation(url, path.join(realDir, "never-written.mjs")),
  );
  check(
    "a module url that does not exist on disk is not a direct invocation",
    !isDirectInvocation(`file://${path.join(realDir, "gone.mjs")}`, target),
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 7-8. A path with a space, which the string-concatenation guard also lost. */
/*                                                                          */
/* `import.meta.url` percent-encodes a space; `file://${argv[1]}` does not,  */
/* so the two never compare equal. Same silent exit 0, different cause, and  */
/* it is why the fix compares resolved FILES rather than composed strings.   */
/* ------------------------------------------------------------------------ */
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "t723-"));
  const spaced = path.join(root, "dir with space");
  fs.mkdirSync(spaced);
  const target = path.join(spaced, "thing.mjs");
  fs.writeFileSync(target, "// a module\n");

  check(
    "a path containing a space is a direct invocation",
    isDirectInvocation(`file://${encodeURI(target)}`, target),
    `encoded=${encodeURI(target)}`,
  );
  check(
    "the unencoded composed form is what the old guard compared, and it differs",
    `file://${target}` !== `file://${encodeURI(target)}`,
    "if these were equal this case would prove nothing",
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 9-12. THE ACCEPTANCE. Real CLIs, invoked through a real symlink.         */
/*                                                                          */
/* These are the cases the item exists for. Each asserts the CLI produced    */
/* its verdict, not that it exited 0 — a silent exit 0 is the defect.        */
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy([
    "cli-entry.mjs",
    "queue-provenance.mjs",
    "worktree-retention.mjs",
  ]);

  // queue-provenance: point it at a queue that does not exist. The verdict is
  // `absent` and the exit code is 1 — a CLI that declined to run gives neither.
  const missingQueue = path.join(root, "EXECUTION_QUEUE.md");
  const qpVia = (dir) =>
    run(path.join(dir, "queue-provenance.mjs"), ["--queue", missingQueue, "--json"], root);

  const qpReal = qpVia(realDir);
  const qpLink = qpVia(linkDir);

  check(
    "queue-provenance runs when invoked through its real path",
    qpReal.status === 1 && /"verdict"/.test(qpReal.stdout),
    `status=${qpReal.status} stdout=${qpReal.stdout.slice(0, 200)}`,
  );
  check(
    "THE ACCEPTANCE: queue-provenance runs when invoked through a SYMLINKED path",
    qpLink.status === 1 && /"verdict"/.test(qpLink.stdout),
    `status=${qpLink.status} stdout=${qpLink.stdout.slice(0, 200)}\n` +
      "a silent exit 0 with no stdout is the defect this case exists against",
  );
  check(
    "both invocations of queue-provenance report the same verdict",
    qpReal.stdout === qpLink.stdout && qpReal.status === qpLink.status,
    `real=${qpReal.status} link=${qpLink.status}`,
  );

  // worktree-retention: `--check` with an impossible floor must exit non-zero.
  // Run from a directory that is not a git repository, so the outcome cannot
  // depend on this machine's worktree population; what is asserted is that the
  // CLI ENGAGED, which a refusal to run does not.
  const wrVia = (dir) =>
    run(path.join(dir, "worktree-retention.mjs"), ["--check", "--free-floor-gib", "9999"], root);

  const wrReal = wrVia(realDir);
  const wrLink = wrVia(linkDir);
  const engaged = (r) => r.status !== 0 || `${r.stdout}${r.stderr}`.trim().length > 0;

  check(
    "worktree-retention --check engages when invoked through its real path",
    engaged(wrReal),
    `status=${wrReal.status} out=${(wrReal.stdout + wrReal.stderr).slice(0, 200)}`,
  );
  check(
    "THE ACCEPTANCE: worktree-retention --check engages when invoked through a SYMLINKED path",
    engaged(wrLink),
    `status=${wrLink.status} out=${(wrLink.stdout + wrLink.stderr).slice(0, 200)}\n` +
      "exit 0 and no output means the disk-safety control declined to run",
  );
  check(
    "both invocations of worktree-retention behave identically",
    wrReal.status === wrLink.status,
    `real=${wrReal.status} link=${wrLink.status}`,
  );

  fs.rmSync(root, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------ */
/* 13-14. Importing a CLI module must NOT run its CLI.                     */
/*                                                                          */
/* The opposite error, and it has to be held down or the fix could be "just  */
/* always run". append-claim.mjs imports queue-provenance.mjs on every claim.*/
/* ------------------------------------------------------------------------ */
{
  const { root, realDir, linkDir } = symlinkedCopy([
    "cli-entry.mjs",
    "queue-provenance.mjs",
    "worktree-retention.mjs",
  ]);

  for (const [label, dir] of [["real", realDir], ["symlinked", linkDir]]) {
    const importer = path.join(root, `import-${label}.mjs`);
    fs.writeFileSync(
      importer,
      `import "${path.join(dir, "queue-projected").replace("queue-projected", "queue-provenance.mjs")}";\n` +
        `import "${path.join(dir, "worktree-retention.mjs")}";\n` +
        `console.log("IMPORTED_CLEANLY");\n`,
    );
    const r = run(importer, [], root);
    check(
      `importing both modules through the ${label} path does not run either CLI`,
      r.status === 0 && r.stdout.trim() === "IMPORTED_CLEANLY",
      `status=${r.status} stdout=${r.stdout.slice(0, 300)} stderr=${r.stderr.slice(0, 200)}`,
    );
  }

  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
